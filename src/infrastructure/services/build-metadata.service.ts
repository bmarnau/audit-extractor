/**
 * Build Metadata Service
 * Generiert eindeutige Build-Nummern und Git-Informationen
 * Prüft Versionssynchronisation zwischen Frontend/Backend/Git
 * 
 * @version 0.26.0
 * @phase 22
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

export interface GitInfo {
  hash: string;           // Current commit hash
  shortHash: string;      // Short commit hash (first 7 chars)
  branch: string;         // Current branch name
  lastCommitTime: string; // Last commit timestamp
  lastCommitMsg: string;  // Last commit message
  isDirty: boolean;       // Has uncommitted changes
  remoteUrl: string;      // Git remote URL
  lastPushTime?: string;  // Last push to remote
}

export interface BuildMetadata {
  version: string;
  buildNumber: string;      // Format: YYYYMMDDHHmmss-<gitHash>
  buildTime: string;        // ISO timestamp
  buildTimestamp: number;   // Unix timestamp (ms)
  environment: string;
  gitInfo: GitInfo;
  frontendVersion?: string; // Synced from package.json
  backendVersion?: string;  // Synced from package.json
  versionMatch: boolean;    // Frontend === Backend === package.json
  syncStatus: 'synced' | 'mismatched' | 'unknown';
}

export interface VersionReport {
  timestamp: string;
  isValid: boolean;
  versions: {
    packageJson: string;
    frontend: string;
    backend: string;
  };
  versionMatch: boolean;
  mismatches: string[];
  gitStatus: {
    isDirty: boolean;
    uncommittedChanges: string[];
  };
  warnings: string[];
  recommendations: string[];
}

export class BuildMetadataService {
  private projectRoot: string;
  private buildMetadata: BuildMetadata | null = null;

  constructor(projectRoot: string = process.cwd()) {
    this.projectRoot = projectRoot;
  }

  /**
   * Generiert komplette Build Metadata
   */
  async generateBuildMetadata(): Promise<BuildMetadata> {
    const version = this.getPackageVersion();
    const gitInfo = this.getGitInfo();
    const frontendVersion = this.getFrontendVersion();
    const backendVersion = this.getBackendVersion();

    const versionMatch =
      version === frontendVersion && version === backendVersion;

    const buildNumber = this.generateBuildNumber(gitInfo);
    const buildTime = new Date().toISOString();

    this.buildMetadata = {
      version,
      buildNumber,
      buildTime,
      buildTimestamp: Date.now(),
      environment: process.env.NODE_ENV || 'development',
      gitInfo,
      frontendVersion,
      backendVersion,
      versionMatch,
      syncStatus: versionMatch ? 'synced' : 'mismatched',
    };

    return this.buildMetadata;
  }

  /**
   * Gibt zwischengespeicherte Build Metadata zurück
   */
  getBuildMetadata(): BuildMetadata {
    if (!this.buildMetadata) {
      throw new Error(
        'BuildMetadata not generated yet. Call generateBuildMetadata() first.'
      );
    }
    return this.buildMetadata;
  }

  /**
   * Liest Version aus package.json
   */
  private getPackageVersion(): string {
    try {
      const packageJsonPath = path.join(this.projectRoot, 'package.json');
      const packageJson = JSON.parse(
        fs.readFileSync(packageJsonPath, 'utf-8')
      );
      return packageJson.version || '0.0.0';
    } catch {
      return '0.0.0';
    }
  }

  /**
   * Liest Frontend Version
   */
  private getFrontendVersion(): string {
    try {
      const frontendPackagePath = path.join(
        this.projectRoot,
        'frontend',
        'package.json'
      );
      if (!fs.existsSync(frontendPackagePath)) {
        return 'unknown';
      }
      const packageJson = JSON.parse(
        fs.readFileSync(frontendPackagePath, 'utf-8')
      );
      return packageJson.version || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  /**
   * Liest Backend Version (aus root package.json, da Backend TypeScript-basiert ist)
   */
  private getBackendVersion(): string {
    return this.getPackageVersion();
  }

  /**
   * Generiert eindeutige Build-Nummer
   */
  private generateBuildNumber(gitInfo: GitInfo): string {
    const now = new Date();
    const timestamp = now
      .toISOString()
      .replace(/[-:T.]/g, '')
      .substring(0, 14);

    return `${timestamp}-${gitInfo.shortHash}`;
  }

  /**
   * Sammelt Git-Informationen
   */
  private getGitInfo(): GitInfo {
    try {
      const hash = this.execGit('rev-parse HEAD').trim();
      const shortHash = this.execGit('rev-parse --short HEAD').trim();
      const branch = this.execGit('rev-parse --abbrev-ref HEAD').trim();
      const lastCommitMsg = this.execGit('log -1 --pretty=%B').trim();
      const isDirty = this.execGit('status --porcelain').trim().length > 0;

      let lastCommitTime = '';
      try {
        const timestamp = this.execGit('log -1 --pretty=%ct');
        lastCommitTime = new Date(parseInt(timestamp) * 1000).toISOString();
      } catch {
        lastCommitTime = new Date().toISOString();
      }

      let remoteUrl = '';
      try {
        remoteUrl = this.execGit('config --get remote.origin.url').trim();
      } catch {
        remoteUrl = 'unknown';
      }

      let lastPushTime: string | undefined;
      try {
        const reflog = this.execGit(
          `log -1 --format=%aI $(git rev-parse --verify ${branch}@{push} 2>/dev/null || echo HEAD)`
        ).trim();
        if (reflog) {
          lastPushTime = reflog;
        }
      } catch {
        // No push information available
      }

      return {
        hash,
        shortHash,
        branch,
        lastCommitTime,
        lastCommitMsg,
        isDirty,
        remoteUrl,
        lastPushTime,
      };
    } catch (err) {
      console.warn('[BuildMetadataService] Git info collection failed:', err);
      return {
        hash: 'unknown',
        shortHash: 'unknown',
        branch: 'unknown',
        lastCommitTime: new Date().toISOString(),
        lastCommitMsg: 'unable to retrieve',
        isDirty: false,
        remoteUrl: 'unknown',
      };
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
      });
    } catch (err) {
      throw new Error(`Git command failed: git ${command}`);
    }
  }

  /**
   * Prüft Versionsabstimmung
   */
  async verifyVersions(): Promise<VersionReport> {
    const metadata = await this.generateBuildMetadata();
    const mismatches: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Check version alignment
    if (metadata.frontendVersion !== metadata.version) {
      mismatches.push(
        `Frontend (${metadata.frontendVersion}) !== Package (${metadata.version})`
      );
    }

    if (metadata.backendVersion !== metadata.version) {
      mismatches.push(
        `Backend (${metadata.backendVersion}) !== Package (${metadata.version})`
      );
    }

    // Check Git status
    const uncommittedChanges: string[] = [];
    if (metadata.gitInfo.isDirty) {
      try {
        const status = this.execGit('status --porcelain');
        uncommittedChanges.push(...status.split('\n').filter(l => l.trim()));
        warnings.push('Repository has uncommitted changes');
      } catch {
        warnings.push('Unable to determine uncommitted changes');
      }
    }

    // Generate recommendations
    if (mismatches.length > 0) {
      recommendations.push('Synchronize version numbers across all packages');
      recommendations.push('Run: npm run sync:versions');
    }

    if (metadata.gitInfo.isDirty) {
      recommendations.push('Commit or stash uncommitted changes before deployment');
    }

    return {
      timestamp: new Date().toISOString(),
      isValid: mismatches.length === 0 && uncommittedChanges.length === 0,
      versions: {
        packageJson: metadata.version,
        frontend: metadata.frontendVersion || 'unknown',
        backend: metadata.backendVersion || 'unknown',
      },
      versionMatch: metadata.versionMatch,
      mismatches,
      gitStatus: {
        isDirty: metadata.gitInfo.isDirty,
        uncommittedChanges,
      },
      warnings,
      recommendations,
    };
  }

  /**
   * Exportiert Build Metadata als JSON
   */
  async exportMetadata(outputPath: string): Promise<void> {
    const metadata = await this.generateBuildMetadata();
    const dir = path.dirname(outputPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(metadata, null, 2));
    console.log(`✅ Build Metadata exported: ${outputPath}`);
  }

  /**
   * Exportiert Version Report
   */
  async exportVersionReport(outputPath: string): Promise<void> {
    const report = await this.verifyVersions();
    const dir = path.dirname(outputPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`✅ Version Report exported: ${outputPath}`);

    // Print summary
    console.log('\n📋 Version Report Summary:');
    console.log(`   Valid: ${report.isValid ? '✅' : '❌'}`);
    console.log(`   Versions Match: ${report.versionMatch ? '✅' : '❌'}`);
    if (report.mismatches.length > 0) {
      console.log(`   Mismatches:`);
      report.mismatches.forEach(m => console.log(`     - ${m}`));
    }
    if (report.warnings.length > 0) {
      console.log(`   Warnings:`);
      report.warnings.forEach(w => console.log(`     ⚠️  ${w}`));
    }
    if (report.recommendations.length > 0) {
      console.log(`   Recommendations:`);
      report.recommendations.forEach(r => console.log(`     💡 ${r}`));
    }
  }
}
