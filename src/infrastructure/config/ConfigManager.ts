/**
 * ConfigManager Service - Phase 12
 *
 * Lädt, speichert und verwaltet Konfigurationen mit Versionierung.
 *
 * @version 0.12.0
 * @phase 12
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { injectable } from 'tsyringe';
import {
  AppConfig,
  ConfigChange,
  DEFAULT_CONFIG,
} from '@domain/Configuration';

@injectable()
export class ConfigManager {
  private config: AppConfig = { ...DEFAULT_CONFIG };
  private changes: ConfigChange[] = [];
  private readonly configDir = path.join(process.cwd(), 'config');
  private readonly changelogFile = path.join(this.configDir, 'changelog.json');
  private readonly configFile = path.join(this.configDir, 'app-config.json');

  /**
   * Initialize ConfigManager
   */
  async initialize(): Promise<void> {
    try {
      // Ensure config directory exists
      await fs.mkdir(this.configDir, { recursive: true });

      // Load existing config or use default
      try {
        const fileContent = await fs.readFile(this.configFile, 'utf-8');
        this.config = JSON.parse(fileContent);
        console.log(`[ConfigManager] Loaded config v${this.config.configVersion}`);
      } catch {
        // Config doesn't exist, use default
        await this.saveConfig(this.config, 'System', 'Initial configuration');
        console.log('[ConfigManager] Using default configuration');
      }

      // Load changelog
      try {
        const changelogContent = await fs.readFile(this.changelogFile, 'utf-8');
        this.changes = JSON.parse(changelogContent);
        console.log(`[ConfigManager] Loaded ${this.changes.length} configuration changes`);
      } catch {
        this.changes = [];
      }
    } catch (error) {
      console.error('[ConfigManager] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get current configuration
   */
  getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  async updateConfig(
    updates: Partial<AppConfig>,
    changedBy?: string,
    reason?: string
  ): Promise<AppConfig> {
    const previousConfig = { ...this.config };
    const newConfig = { ...this.config, ...updates };

    // Calculate changes
    const changes: Record<string, { from: unknown; to: unknown }> = {};

    for (const key in updates) {
      if (previousConfig[key as keyof AppConfig] !== updates[key as keyof AppConfig]) {
        changes[key] = {
          from: previousConfig[key as keyof AppConfig],
          to: updates[key as keyof AppConfig],
        };
      }
    }

    if (Object.keys(changes).length === 0) {
      console.log('[ConfigManager] No changes detected');
      return this.config;
    }

    // Increment version
    newConfig.configVersion = this.config.configVersion + 1;
    newConfig.lastUpdated = new Date().toISOString();
    newConfig.updatedBy = changedBy;

    // Save new config
    await this.saveConfig(newConfig, changedBy, reason);

    // Record change
    const changeRecord: ConfigChange = {
      id: `change-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      version: newConfig.configVersion,
      changes,
      timestamp: new Date().toISOString(),
      changedBy,
      reason,
      previousConfig,
      newConfig,
    };

    this.changes.push(changeRecord);
    await this.saveChangelog();

    this.config = newConfig;

    console.log(
      `[ConfigManager] Config updated to v${newConfig.configVersion} (${Object.keys(changes).length} changes)`
    );

    return this.config;
  }

  /**
   * Update specific section
   */
  async updateSection(
    section: 'chunking' | 'confidence' | 'llm' | 'system',
    updates: Record<string, unknown>,
    changedBy?: string,
    reason?: string
  ): Promise<AppConfig> {
    const newConfig = {
      ...this.config,
      [section]: {
        ...this.config[section],
        ...updates,
      },
    };

    return this.updateConfig(newConfig, changedBy, reason);
  }

  /**
   * Get all configuration changes
   */
  getChanges(limit: number = 100): ConfigChange[] {
    return this.changes.slice(-limit).reverse();
  }

  /**
   * Get specific change
   */
  getChange(changeId: string): ConfigChange | undefined {
    return this.changes.find((c) => c.id === changeId);
  }

  /**
   * Revert to previous version
   */
  async revertToVersion(version: number, changedBy?: string): Promise<AppConfig> {
    const changeRecord = this.changes.find((c) => c.version === version);

    if (!changeRecord) {
      throw new Error(`Configuration version ${version} not found`);
    }

    const reverted = changeRecord.previousConfig;
    return this.updateConfig(reverted, changedBy, `Reverted to v${version}`);
  }

  /**
   * Export configuration as JSON
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * Import configuration from JSON
   */
  async importConfig(
    jsonString: string,
    changedBy?: string,
    reason?: string
  ): Promise<AppConfig> {
    try {
      const imported = JSON.parse(jsonString) as AppConfig;

      // Validate structure
      if (!imported.chunking || !imported.confidence || !imported.llm || !imported.system) {
        throw new Error('Invalid configuration structure');
      }

      return this.updateConfig(imported, changedBy, reason);
    } catch (error) {
      throw new Error(`Failed to import configuration: ${(error as any).message}`);
    }
  }

  /**
   * Get configuration statistics
   */
  getStats(): {
    currentVersion: number;
    totalChanges: number;
    lastUpdated: string;
    lastUpdatedBy?: string;
  } {
    return {
      currentVersion: this.config.configVersion,
      totalChanges: this.changes.length,
      lastUpdated: this.config.lastUpdated,
      lastUpdatedBy: this.config.updatedBy,
    };
  }

  /**
   * Save config to file
   */
  private async saveConfig(
    config: AppConfig,
    _changedBy?: string,
    _reason?: string
  ): Promise<void> {
    try {
      await fs.writeFile(
        this.configFile,
        JSON.stringify(config, null, 2)
      );
      console.log(`[ConfigManager] Saved config v${config.configVersion}`);
    } catch (error) {
      console.error('[ConfigManager] Failed to save config:', error);
      throw error;
    }
  }

  /**
   * Save changelog to file
   */
  private async saveChangelog(): Promise<void> {
    try {
      await fs.writeFile(
        this.changelogFile,
        JSON.stringify(this.changes, null, 2)
      );
    } catch (error) {
      console.error('[ConfigManager] Failed to save changelog:', error);
      throw error;
    }
  }

  /**
   * Export audit trail
   */
  getAuditTrail(limit: number = 50): Array<{
    version: number;
    timestamp: string;
    changedBy?: string;
    reason?: string;
    changeCount: number;
  }> {
    return this.changes
      .slice(-limit)
      .reverse()
      .map((c) => ({
        version: c.version,
        timestamp: c.timestamp,
        changedBy: c.changedBy,
        reason: c.reason,
        changeCount: Object.keys(c.changes).length,
      }));
  }
}

export const configManager = new ConfigManager();
