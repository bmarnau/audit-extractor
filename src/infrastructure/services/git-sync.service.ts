/**
 * Git Sync Service
 * Überwacht Synchronisation mit GitHub / Git Remote
 * Prüft Push Status und verwaltet Sync-Metadaten
 * 
 * @version 0.26.0
 * @phase 22
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export interface RemoteInfo {
  url: string;
  branch: string;
  lastPush: string;
  lastFetch: string;
  isAheadOfRemote: boolean;
  commitsBehind: number;
  commitsAhead: number;
  status: 'synced' | 'ahead' | 'behind' | 'diverged' | 'unknown';
}

export interface SyncStatus {
  timestamp: string;
  remote: RemoteInfo;
  lastSyncCheckTime: string;
  isSynced: boolean;
  syncMessage: string;
  buildNumberAtLastSync?: string;
  buildMetadata?: {
    version: string;
    buildNumber: string;
    gitHash: string;
  };
}

const SYNC_STATUS_FILE = path.join(process.cwd(), '.git-sync-status.json');

export class GitSyncService {
  private projectRoot: string;
  private syncStatus: SyncStatus | null = null;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Prüft Sync-Status mit Remote
   */
  async checkSyncStatus(): Promise<SyncStatus> {
    try {
      const remote = this.getRemoteInfo();
      const isSynced = remote.status === 'synced';

      const syncMessage = this.generateSyncMessage(remote);

      const loadedStatus = this.loadSyncStatus();

      this.syncStatus = {
        timestamp: new Date().toISOString(),
        remote,
        lastSyncCheckTime: new Date().toISOString(),
        isSynced,
        syncMessage,
        buildNumberAtLastSync: loadedStatus?.buildNumberAtLastSync,
        buildMetadata: loadedStatus?.buildMetadata,
      };

      return this.syncStatus;
    } catch (err) {
      console.warn(
        '[GitSyncService] Sync check failed:',
        err instanceof Error ? err.message : String(err)
      );
      return {
        timestamp: new Date().toISOString(),
        remote: {
          url: 'unknown',
          branch: 'unknown',
          lastPush: 'unknown',
          lastFetch: 'unknown',
          isAheadOfRemote: false,
          commitsBehind: 0,
          commitsAhead: 0,
          status: 'unknown',
        },
        lastSyncCheckTime: new Date().toISOString(),
        isSynced: false,
        syncMessage: 'Unable to determine sync status',
      };
    }
  }

  /**
   * Liest Remote-Informationen
   */
  private getRemoteInfo(): RemoteInfo {
    const url = this.execGit('config --get remote.origin.url');
    const branch = this.execGit('rev-parse --abbrev-ref HEAD');

    // Get last push time
    let lastPush = 'unknown';
    try {
      const timestamp = this.execGit(
        `log -1 --format=%aI $(git rev-parse origin/${branch} 2>/dev/null || echo HEAD)`
      );
      if (timestamp) {
        lastPush = new Date(timestamp).toISOString();
      }
    } catch {
      lastPush = 'unknown';
    }

    // Get last fetch time
    let lastFetch = 'unknown';
    try {
      if (fs.existsSync(path.join(this.projectRoot, '.git', 'FETCH_HEAD'))) {
        const stat = fs.statSync(path.join(this.projectRoot, '.git', 'FETCH_HEAD'));
        lastFetch = new Date(stat.mtime).toISOString();
      }
    } catch {
      lastFetch = 'unknown';
    }

    // Check ahead/behind
    let commitsAhead = 0;
    let commitsBehind = 0;
    let isAheadOfRemote = false;
    let status: 'synced' | 'ahead' | 'behind' | 'diverged' | 'unknown' =
      'unknown';

    try {
      const revList = this.execGit(
        `rev-list --left-right --count origin/${branch}...HEAD 2>/dev/null || echo "0 0"`
      );
      const [behind, ahead] = revList.trim().split(/\s+/).map(Number);
      commitsBehind = behind || 0;
      commitsAhead = ahead || 0;
      isAheadOfRemote = commitsAhead > 0;

      if (commitsBehind > 0 && commitsAhead > 0) {
        status = 'diverged';
      } else if (commitsAhead > 0) {
        status = 'ahead';
      } else if (commitsBehind > 0) {
        status = 'behind';
      } else {
        status = 'synced';
      }
    } catch {
      status = 'unknown';
    }

    return {
      url,
      branch,
      lastPush,
      lastFetch,
      isAheadOfRemote,
      commitsBehind,
      commitsAhead,
      status,
    };
  }

  /**
   * Generiert Sync-Nachricht
   */
  private generateSyncMessage(remote: RemoteInfo): string {
    switch (remote.status) {
      case 'synced':
        return `✅ Repository is synced with remote (${remote.branch})`;
      case 'ahead':
        return `🔼 Local branch is ${remote.commitsAhead} commits ahead of remote`;
      case 'behind':
        return `🔽 Local branch is ${remote.commitsBehind} commits behind remote`;
      case 'diverged':
        return `🔀 Local and remote branches have diverged (${remote.commitsAhead} ahead, ${remote.commitsBehind} behind)`;
      case 'unknown':
        return '❓ Unable to determine sync status';
      default:
        return 'Sync status unknown';
    }
  }

  /**
   * Speichert Sync-Status mit Build-Metadaten
   */
  saveSyncStatus(buildMetadata?: {
    version: string;
    buildNumber: string;
    gitHash: string;
  }): void {
    const status: SyncStatus = {
      timestamp: new Date().toISOString(),
      remote: this.syncStatus?.remote || {
        url: 'unknown',
        branch: 'unknown',
        lastPush: 'unknown',
        lastFetch: 'unknown',
        isAheadOfRemote: false,
        commitsBehind: 0,
        commitsAhead: 0,
        status: 'unknown',
      },
      lastSyncCheckTime: new Date().toISOString(),
      isSynced: this.syncStatus?.isSynced || false,
      syncMessage: this.syncStatus?.syncMessage || 'Unknown',
      buildNumberAtLastSync: buildMetadata?.buildNumber,
      buildMetadata,
    };

    fs.writeFileSync(SYNC_STATUS_FILE, JSON.stringify(status, null, 2));
    console.log(`✅ Sync status saved: ${SYNC_STATUS_FILE}`);
  }

  /**
   * Lädt letzte Sync-Status
   */
  private loadSyncStatus(): SyncStatus | null {
    try {
      if (fs.existsSync(SYNC_STATUS_FILE)) {
        const content = fs.readFileSync(SYNC_STATUS_FILE, 'utf-8');
        return JSON.parse(content);
      }
    } catch {
      // No sync status file yet
    }
    return null;
  }

  /**
   * Prüft ob Push erforderlich ist
   */
  isPushRequired(): boolean {
    try {
      const status = this.getRemoteInfo();
      return status.status === 'ahead' || status.status === 'diverged';
    } catch {
      return false;
    }
  }

  /**
   * Prüft ob Pull erforderlich ist
   */
  isPullRequired(): boolean {
    try {
      const status = this.getRemoteInfo();
      return status.status === 'behind' || status.status === 'diverged';
    } catch {
      return false;
    }
  }

  /**
   * Führt Git-Befehl aus
   */
  private execGit(command: string): string {
    try {
      return execSync(`git ${command}`, {
        cwd: this.projectRoot,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      }).trim();
    } catch (err: any) {
      throw new Error(
        `Git command failed: ${command}\n${err?.stderr || err?.message}`
      );
    }
  }

  /**
   * Exportiert Sync-Status
   */
  async exportSyncStatus(outputPath: string): Promise<void> {
    if (!this.syncStatus) {
      await this.checkSyncStatus();
    }

    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(this.syncStatus, null, 2));
    console.log(`✅ Sync Status exported: ${outputPath}`);
  }

  /**
   * Gibt aktuelle Sync-Status zurück
   */
  getSyncStatus(): SyncStatus | null {
    return this.syncStatus;
  }
}
