/**
 * Rule Versioning Service
 * 
 * Manages version history, backups, and rollback for extraction rules.
 * Tracks metadata like change reason, owner, success rates, etc.
 * 
 * @version 0.14.0
 * @phase 14b
 */

import * as fs from 'fs/promises';
import * as path from 'path';

interface RuleVersion {
  version: string;
  modifyCount: number;
  lastModified: string;
  changeReason: string;
  owner: string;
  rulesChanged: number;
  successRateAtRelease: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  rules?: any[];
}

interface VersionHistory {
  docType: string;
  currentVersion: string;
  totalVersions: number;
  versions: RuleVersion[];
}

export class RuleVersioningService {
  private rulesDir: string;
  private versionsDir: string;
  private historyFile: string;

  constructor(rulesDir: string) {
    this.rulesDir = rulesDir;
    this.versionsDir = path.join(rulesDir, 'versions');
    this.historyFile = path.join(rulesDir, '.version-history.json');
  }

  /**
   * Initialize version system (create directories if needed)
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.versionsDir, { recursive: true });
    } catch (err) {
      // Directory may already exist
    }
  }

  /**
   * Save a new version of rules
   */
  async saveVersion(
    docType: string,
    rules: any,
    changeReason: string,
    owner: string,
    successRate: number
  ): Promise<RuleVersion> {
    await this.initialize();

    // Load current version
    const ruleFile = path.join(this.rulesDir, `${docType}.json`);
    let currentRuleset;
    try {
      const content = await fs.readFile(ruleFile, 'utf-8');
      currentRuleset = JSON.parse(content);
    } catch {
      currentRuleset = { version: '1.0.0', modifyCount: 0 };
    }

    // Parse current version
    const currentVersion = currentRuleset.version || '1.0.0';
    const [major, minor, patch] = currentVersion.split('.').map(Number);
    const newVersion = `${major}.${minor}.${patch + 1}`;
    const newModifyCount = (currentRuleset.modifyCount || 0) + 1;

    // Create version record
    const versionRecord: RuleVersion = {
      version: newVersion,
      modifyCount: newModifyCount,
      lastModified: new Date().toISOString(),
      changeReason,
      owner,
      rulesChanged: this.countChangedRules(currentRuleset.rules || [], rules),
      successRateAtRelease: successRate,
      status: 'DRAFT',
    };

    // Backup old version
    if (patch > 0 || minor > 0) {
      const backupFile = path.join(this.versionsDir, `${docType}-${currentVersion}.json`);
      await fs.writeFile(backupFile, JSON.stringify(currentRuleset, null, 2));
    }

    // Update main ruleset
    const updatedRuleset = {
      ...currentRuleset,
      ...rules,
      version: newVersion,
      modifyCount: newModifyCount,
      lastModified: versionRecord.lastModified,
    };

    await fs.writeFile(ruleFile, JSON.stringify(updatedRuleset, null, 2));

    // Update history
    await this.updateHistory(docType, versionRecord);

    return versionRecord;
  }

  /**
   * Get version history
   */
  async getHistory(docType: string): Promise<VersionHistory> {
    const ruleFile = path.join(this.rulesDir, `${docType}.json`);
    const content = await fs.readFile(ruleFile, 'utf-8');
    const ruleset = JSON.parse(content);

    let history: VersionHistory = {
      docType,
      currentVersion: ruleset.version || '1.0.0',
      totalVersions: 1,
      versions: [
        {
          version: ruleset.version || '1.0.0',
          modifyCount: ruleset.modifyCount || 0,
          lastModified: ruleset.lastModified || new Date().toISOString(),
          changeReason: ruleset.description || 'Initial version',
          owner: ruleset.owner || 'system',
          rulesChanged: ruleset.rules?.length || 0,
          successRateAtRelease: ruleset.successRate || 0,
          status: 'PUBLISHED',
        },
      ],
    };

    // Load from history file if exists
    try {
      const historyContent = await fs.readFile(this.historyFile, 'utf-8');
      const allHistory = JSON.parse(historyContent);
      if (allHistory[docType]) {
        history = allHistory[docType];
      }
    } catch {
      // History file doesn't exist yet
    }

    return history;
  }

  /**
   * Publish a version (lock and mark as production-ready)
   */
  async publishVersion(
    docType: string,
    version: string,
    publishNotes: string
  ): Promise<RuleVersion> {
    const ruleFile = path.join(this.rulesDir, `${docType}.json`);
    const content = await fs.readFile(ruleFile, 'utf-8');
    const ruleset = JSON.parse(content);

    // Verify version matches
    if (ruleset.version !== version) {
      throw new Error(`Version mismatch: expected ${version}, got ${ruleset.version}`);
    }

    // Update ruleset status
    ruleset.publishNotes = publishNotes;
    ruleset.publishedAt = new Date().toISOString();
    ruleset.locked = true;

    await fs.writeFile(ruleFile, JSON.stringify(ruleset, null, 2));

    // Update history
    const history = await this.getHistory(docType);
    const versionRecord = history.versions.find(v => v.version === version);

    if (versionRecord) {
      versionRecord.status = 'PUBLISHED';
    }

    return versionRecord || { version, modifyCount: 0, lastModified: new Date().toISOString(), changeReason: '', owner: '', rulesChanged: 0, successRateAtRelease: 0, status: 'PUBLISHED' };
  }

  /**
   * Rollback to a previous version
   */
  async rollback(docType: string, targetVersion: string): Promise<void> {
    const backupFile = path.join(this.versionsDir, `${docType}-${targetVersion}.json`);
    const ruleFile = path.join(this.rulesDir, `${docType}.json`);

    const content = await fs.readFile(backupFile, 'utf-8');
    await fs.writeFile(ruleFile, content);
  }

  /**
   * Count how many rules changed
   */
  private countChangedRules(oldRules: any[], newRules: any[]): number {
    let changed = 0;
    const oldFieldMap = new Map(oldRules.map((r: any) => [r.field, r.pattern]));

    for (const newRule of newRules) {
      const oldPattern = oldFieldMap.get(newRule.field);
      if (oldPattern !== newRule.pattern) {
        changed++;
      }
    }

    return changed;
  }

  /**
   * Update version history file
   */
  private async updateHistory(docType: string, versionRecord: RuleVersion): Promise<void> {
    let allHistory: any = {};

    try {
      const content = await fs.readFile(this.historyFile, 'utf-8');
      allHistory = JSON.parse(content);
    } catch {
      // File doesn't exist yet
    }

    if (!allHistory[docType]) {
      allHistory[docType] = {
        docType,
        currentVersion: versionRecord.version,
        totalVersions: 0,
        versions: [],
      };
    }

    allHistory[docType].versions.unshift(versionRecord);
    allHistory[docType].totalVersions = allHistory[docType].versions.length;
    allHistory[docType].currentVersion = versionRecord.version;

    await fs.writeFile(this.historyFile, JSON.stringify(allHistory, null, 2));
  }
}
