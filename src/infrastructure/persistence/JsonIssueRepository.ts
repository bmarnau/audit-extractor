import fs from 'fs/promises';
import path from 'path';
import { Issue, IssueStatus } from '../../domain/issue/Issue';
import { IssueId } from '../../domain/issue/IssueId';
import { Severity } from '../../domain/issue/Severity';
import { IssueRepository, IssueStatistics, ComponentStatistics } from '../../domain/issue/IssueRepository';

/**
 * JSON File-based Repository Implementation
 *
 * Speichert Issues in JSON Dateien für:
 * - Development und Testing
 * - Einfache Persistierung ohne Datenbank
 * - Migration später auf DB möglich
 */
export class JsonIssueRepository implements IssueRepository {
  private readonly storageDir: string;
  private readonly issuesFile: string;
  private issues: Map<string, Issue> = new Map();
  private initialized = false;

  constructor(storageDir: string = './data/issues') {
    this.storageDir = storageDir;
    this.issuesFile = path.join(storageDir, 'issues.json');
  }

  /**
   * Initialisiert das Repository
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Verzeichnis erstellen wenn nicht vorhanden
      await fs.mkdir(this.storageDir, { recursive: true });

      // Datei laden wenn vorhanden
      if (await this.fileExists(this.issuesFile)) {
        const data = await fs.readFile(this.issuesFile, 'utf-8');
        const issuesData = JSON.parse(data);

        for (const issueData of issuesData) {
          const issue = Issue.fromPersistence(issueData);
          this.issues.set(issue.getIssueId().getValue(), issue);
        }
      }

      this.initialized = true;
    } catch (error) {
      throw new Error(`Failed to initialize JsonIssueRepository: ${error}`);
    }
  }

  /**
   * Speichert ein Issue
   */
  async save(issue: Issue): Promise<void> {
    await this.ensureInitialized();
    this.issues.set(issue.getIssueId().getValue(), issue);
    await this.persistToFile();
  }

  /**
   * Aktualisiert ein Issue
   */
  async update(issue: Issue): Promise<void> {
    await this.ensureInitialized();
    if (!this.issues.has(issue.getIssueId().getValue())) {
      throw new Error(`Issue with id ${issue.getIssueId().getValue()} not found`);
    }
    this.issues.set(issue.getIssueId().getValue(), issue);
    await this.persistToFile();
  }

  /**
   * Findet ein Issue nach ID
   */
  async findById(id: IssueId): Promise<Issue | null> {
    await this.ensureInitialized();
    return this.issues.get(id.getValue()) || null;
  }

  /**
   * Gibt alle Issues zurück
   */
  async findAll(): Promise<Issue[]> {
    await this.ensureInitialized();
    return Array.from(this.issues.values());
  }

  /**
   * Findet Issues nach Severity
   */
  async findBySeverity(severity: string): Promise<Issue[]> {
    await this.ensureInitialized();
    return Array.from(this.issues.values()).filter(
      issue => issue.getSeverity() === severity
    );
  }

  /**
   * Findet Issues nach Komponente
   */
  async findByComponent(component: string): Promise<Issue[]> {
    await this.ensureInitialized();
    return Array.from(this.issues.values()).filter(
      issue => issue.getComponent().toLowerCase() === component.toLowerCase()
    );
  }

  /**
   * Findet Issues nach Kategorie
   */
  async findByCategory(category: string): Promise<Issue[]> {
    await this.ensureInitialized();
    return Array.from(this.issues.values()).filter(
      issue => issue.getCategory().toLowerCase() === category.toLowerCase()
    );
  }

  /**
   * Findet Issues nach Status
   */
  async findByStatus(status: string): Promise<Issue[]> {
    await this.ensureInitialized();
    return Array.from(this.issues.values()).filter(
      issue => issue.getStatus() === status
    );
  }

  /**
   * Findet Issues nach Build Version
   */
  async findByBuildVersion(buildVersion: string): Promise<Issue[]> {
    await this.ensureInitialized();
    return Array.from(this.issues.values()).filter(
      issue => issue.getBuildVersion() === buildVersion
    );
  }

  /**
   * Sucht Issues nach Title
   */
  async findByTitleContains(searchTerm: string): Promise<Issue[]> {
    await this.ensureInitialized();
    const term = searchTerm.toLowerCase();
    return Array.from(this.issues.values()).filter(
      issue => issue.getTitle().toLowerCase().includes(term)
    );
  }

  /**
   * Findet Issues im Zeitraum
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<Issue[]> {
    await this.ensureInitialized();
    return Array.from(this.issues.values()).filter(
      issue => {
        const timestamp = issue.getTimestamp();
        return timestamp >= startDate && timestamp <= endDate;
      }
    );
  }

  /**
   * Gibt Statistiken zurück
   */
  async getStatistics(): Promise<IssueStatistics> {
    await this.ensureInitialized();
    const allIssues = Array.from(this.issues.values());

    const stats: IssueStatistics = {
      total: allIssues.length,
      bySeverity: {
        CRITICAL: 0,
        HIGH: 0,
        MEDIUM: 0,
        LOW: 0,
        INFO: 0
      },
      byStatus: {
        OPEN: 0,
        IN_PROGRESS: 0,
        RESOLVED: 0,
        CLOSED: 0,
        ARCHIVED: 0
      },
      byComponent: {},
      byCategory: {}
    };

    for (const issue of allIssues) {
      // By Severity
      const severity = issue.getSeverity() as keyof typeof stats.bySeverity;
      stats.bySeverity[severity]++;

      // By Status
      const status = issue.getStatus() as keyof typeof stats.byStatus;
      stats.byStatus[status]++;

      // By Component
      const component = issue.getComponent();
      stats.byComponent[component] = (stats.byComponent[component] || 0) + 1;

      // By Category
      const category = issue.getCategory();
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
    }

    return stats;
  }

  /**
   * Gibt Komponenten-Statistiken zurück
   */
  async getComponentStatistics(component: string): Promise<ComponentStatistics> {
    await this.ensureInitialized();
    const componentIssues = await this.findByComponent(component);

    const stats: ComponentStatistics = {
      component,
      totalIssues: componentIssues.length,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 0,
      lowCount: 0,
      infoCount: 0,
      openCount: 0,
      resolvedCount: 0,
      recentIssues: []
    };

    for (const issue of componentIssues) {
      const severity = issue.getSeverity();
      if (severity === Severity.CRITICAL) stats.criticalCount++;
      else if (severity === Severity.HIGH) stats.highCount++;
      else if (severity === Severity.MEDIUM) stats.mediumCount++;
      else if (severity === Severity.LOW) stats.lowCount++;
      else if (severity === Severity.INFO) stats.infoCount++;

      if (issue.getStatus() === IssueStatus.OPEN) stats.openCount++;
      else if (issue.getStatus() === IssueStatus.RESOLVED) stats.resolvedCount++;
    }

    // Recent Issues (letzte 5)
    stats.recentIssues = componentIssues
      .sort((a, b) => b.getTimestamp().getTime() - a.getTimestamp().getTime())
      .slice(0, 5);

    return stats;
  }

  /**
   * Löscht ein Issue
   */
  async delete(id: IssueId): Promise<void> {
    await this.ensureInitialized();
    this.issues.delete(id.getValue());
    await this.persistToFile();
  }

  /**
   * Zählt alle Issues
   */
  async count(): Promise<number> {
    await this.ensureInitialized();
    return this.issues.size;
  }

  /**
   * Prüft ob Issue existiert
   */
  async exists(id: IssueId): Promise<boolean> {
    await this.ensureInitialized();
    return this.issues.has(id.getValue());
  }

  /**
   * Speichert mehrere Issues
   */
  async saveMany(issues: Issue[]): Promise<void> {
    await this.ensureInitialized();
    for (const issue of issues) {
      this.issues.set(issue.getIssueId().getValue(), issue);
    }
    await this.persistToFile();
  }

  /**
   * Löscht alle Issues
   */
  async deleteAll(): Promise<void> {
    await this.ensureInitialized();
    this.issues.clear();
    await this.persistToFile();
  }

  // ============ Private Methods ============

  /**
   * Speichert Issues in JSON Datei
   */
  private async persistToFile(): Promise<void> {
    try {
      const data = Array.from(this.issues.values()).map(issue => issue.toPersistence());
      const json = JSON.stringify(data, null, 2);
      await fs.writeFile(this.issuesFile, json, 'utf-8');
    } catch (error) {
      throw new Error(`Failed to persist issues to file: ${error}`);
    }
  }

  /**
   * Prüft ob eine Datei existiert
   */
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Stellt sicher, dass Repository initialisiert ist
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Gibt absolute Pfad zum Storage Dir
   */
  getStorageDir(): string {
    return this.storageDir;
  }

  /**
   * Setzt Storage Directory
   */
  setStorageDir(dir: string): void {
    if (this.initialized && dir !== this.storageDir) {
      throw new Error('Cannot change storage directory after initialization');
    }
    (this as any).storageDir = dir;
    (this as any).issuesFile = path.join(dir, 'issues.json');
  }

  /**
   * Gibt In-Memory Issues aus (nur für Testing)
   */
  getInMemoryIssues(): Map<string, Issue> {
    return this.issues;
  }

  /**
   * Setzt In-Memory Issues (nur für Testing)
   */
  setInMemoryIssues(issues: Map<string, Issue>): void {
    this.issues = issues;
  }
}
