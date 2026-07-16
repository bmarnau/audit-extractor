/**
 * Findings API Service
 * Manages loading, filtering, and serving technical audit findings
 * 
 * @version 0.37.0
 * @phase 43
 */

import fs from 'fs';
import path from 'path';
import { FindingDTO, FindingSearchQuery, SeverityBreakdown } from '../dtos/technical-audit.dto.js';

export class FindingsService {
  private findingsFile: string;
  private findings: FindingDTO[] = [];
  private lastLoaded: Date | null = null;

  constructor() {
    // Try multiple paths for findings.json
    const possiblePaths = [
      path.join(process.cwd(), 'data', 'findings.json'),
      path.join(process.cwd(), 'findings.json'),
      path.join(process.cwd(), '../findings.json'),
    ];

    this.findingsFile = possiblePaths[0]; // Default path
    this.loadFindings();
  }

  /**
   * Load findings from JSON file
   */
  private loadFindings(): void {
    try {
      let filePath = this.findingsFile;
      
      // Check if default path exists
      if (!fs.existsSync(filePath)) {
        // Try alternative paths
        const altPaths = [
          path.join(process.cwd(), 'findings.json'),
          path.join(process.cwd(), '../findings.json'),
          path.join(process.cwd(), 'data', 'findings.json'),
        ];
        
        const found = altPaths.find(p => fs.existsSync(p));
        if (!found) {
          console.warn('⚠️  findings.json not found, using empty findings array');
          this.findings = [];
          return;
        }
        filePath = found;
      }

      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      this.findings = data.findings || [];
      this.lastLoaded = new Date();
      console.log(`✅ Loaded ${this.findings.length} findings from ${filePath}`);
    } catch (error) {
      console.error('❌ Error loading findings:', error);
      this.findings = [];
    }
  }

  /**
   * Get all findings with optional filtering
   */
  async getFindings(query: FindingSearchQuery): Promise<{
    findings: FindingDTO[];
    total: number;
    filtered: number;
    severityBreakdown: SeverityBreakdown;
  }> {
    // Reload findings if needed (check every 5 minutes)
    if (!this.lastLoaded || Date.now() - this.lastLoaded.getTime() > 5 * 60 * 1000) {
      this.loadFindings();
    }

    let filtered = [...this.findings];

    // Apply filters
    if (query.severity) {
      filtered = filtered.filter(f => f.severity === query.severity);
    }

    if (query.category) {
      filtered = filtered.filter(f => f.category === query.category);
    }

    if (query.component) {
      filtered = filtered.filter(f => 
        f.impactedComponent?.toLowerCase().includes(query.component.toLowerCase())
      );
    }

    if (query.q) {
      const q = query.q.toLowerCase();
      filtered = filtered.filter(f =>
        f.title.toLowerCase().includes(q) ||
        f.description.toLowerCase().includes(q) ||
        f.recommendation.toLowerCase().includes(q)
      );
    }

    if (query.since) {
      const since = new Date(query.since);
      filtered = filtered.filter(f => new Date(f.timestamp) >= since);
    }

    if (query.until) {
      const until = new Date(query.until);
      filtered = filtered.filter(f => new Date(f.timestamp) <= until);
    }

    // Sort by severity (critical first) then timestamp
    filtered.sort((a, b) => {
      const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
      if (severityDiff !== 0) return severityDiff;
      
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Apply pagination
    const total = filtered.length;
    const paginated = filtered.slice(
      query.offset,
      query.offset + query.limit
    );

    // Calculate severity breakdown
    const severityBreakdown = this.calculateSeverityBreakdown(filtered);

    return {
      findings: paginated,
      total,
      filtered: total,
      severityBreakdown,
    };
  }

  /**
   * Get only critical findings
   */
  async getCriticalFindings(limit = 10): Promise<FindingDTO[]> {
    // Reload if needed
    if (!this.lastLoaded || Date.now() - this.lastLoaded.getTime() > 5 * 60 * 1000) {
      this.loadFindings();
    }

    return this.findings
      .filter(f => f.severity === 'critical')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get high severity findings
   */
  async getHighFindings(limit = 10): Promise<FindingDTO[]> {
    // Reload if needed
    if (!this.lastLoaded || Date.now() - this.lastLoaded.getTime() > 5 * 60 * 1000) {
      this.loadFindings();
    }

    return this.findings
      .filter(f => f.severity === 'high')
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  }

  /**
   * Get finding by ID
   */
  async getFindingById(id: string): Promise<FindingDTO | null> {
    // Reload if needed
    if (!this.lastLoaded || Date.now() - this.lastLoaded.getTime() > 5 * 60 * 1000) {
      this.loadFindings();
    }

    return this.findings.find(f => f.id === id) || null;
  }

  /**
   * Calculate severity breakdown
   */
  private calculateSeverityBreakdown(findings: FindingDTO[]): SeverityBreakdown {
    return {
      critical: findings.filter(f => f.severity === 'critical').length,
      high: findings.filter(f => f.severity === 'high').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      low: findings.filter(f => f.severity === 'low').length,
    };
  }

  /**
   * Get findings statistics
   */
  async getStatistics(): Promise<{
    total: number;
    byCategory: Record<string, number>;
    bySeverity: SeverityBreakdown;
    lastUpdated: string | null;
  }> {
    // Reload if needed
    if (!this.lastLoaded || Date.now() - this.lastLoaded.getTime() > 5 * 60 * 1000) {
      this.loadFindings();
    }

    const byCategory: Record<string, number> = {};
    this.findings.forEach(f => {
      byCategory[f.category] = (byCategory[f.category] || 0) + 1;
    });

    const bySeverity = this.calculateSeverityBreakdown(this.findings);

    return {
      total: this.findings.length,
      byCategory,
      bySeverity,
      lastUpdated: this.lastLoaded?.toISOString() || null,
    };
  }
}

// Singleton instance
export const findingsService = new FindingsService();
