/**
 * ISSUE REPOSITORY SERVICE
 * 
 * Handles centralized storage, retrieval, and management of issues
 * Supports in-memory storage with optional file persistence
 */

import fs from 'fs';
import path from 'path';
import {
  Issue,
  IssueFilter,
  IssueStatus,
  IssueSummary,
  IssueCategory,
  IssuePriority,
  SeverityLevel,
  ImpactArea,
  BatchIssueOperation,
  IssueStatistics,
} from '../types/issue.types';

export class IssueRepositoryService {
  private issues: Map<string, Issue> = new Map();
  private persistencePath?: string;
  private batchOperations: BatchIssueOperation[] = [];

  constructor(persistencePath?: string) {
    this.persistencePath = persistencePath;
    if (persistencePath && fs.existsSync(persistencePath)) {
      this.loadFromDisk();
    }
  }

  /**
   * Create a new issue
   */
  createIssue(issue: Issue): Issue {
    if (this.issues.has(issue.issueId)) {
      throw new Error(`Issue with ID ${issue.issueId} already exists`);
    }

    // Ensure required timestamps
    issue.createdAt = issue.createdAt || new Date().toISOString();
    issue.discoveredAt = issue.discoveredAt || new Date().toISOString();

    this.issues.set(issue.issueId, issue);
    this.saveToDisk();

    return issue;
  }

  /**
   * Get issue by ID
   */
  getIssue(issueId: string): Issue | undefined {
    return this.issues.get(issueId);
  }

  /**
   * Update existing issue
   */
  updateIssue(issueId: string, updates: Partial<Issue>): Issue {
    const issue = this.issues.get(issueId);
    if (!issue) {
      throw new Error(`Issue with ID ${issueId} not found`);
    }

    const updated: Issue = {
      ...issue,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.issues.set(issueId, updated);
    this.saveToDisk();

    return updated;
  }

  /**
   * Delete issue
   */
  deleteIssue(issueId: string): boolean {
    const deleted = this.issues.delete(issueId);
    if (deleted) {
      this.saveToDisk();
    }
    return deleted;
  }

  /**
   * Get all issues
   */
  getAllIssues(): Issue[] {
    return Array.from(this.issues.values());
  }

  /**
   * Get issues matching filter
   */
  filterIssues(filter: IssueFilter): Issue[] {
    let results = Array.from(this.issues.values());

    // Filter by categories
    if (filter.categories && filter.categories.length > 0) {
      results = results.filter(i => filter.categories!.includes(i.category));
    }

    // Filter by priorities
    if (filter.priorities && filter.priorities.length > 0) {
      results = results.filter(i => filter.priorities!.includes(i.priority));
    }

    // Filter by severities
    if (filter.severities && filter.severities.length > 0) {
      results = results.filter(i => filter.severities!.includes(i.severity));
    }

    // Filter by statuses
    if (filter.statuses && filter.statuses.length > 0) {
      results = results.filter(i => filter.statuses!.includes(i.status));
    }

    // Filter by impact areas
    if (filter.impactAreas && filter.impactAreas.length > 0) {
      results = results.filter(i =>
        i.impactAreas.some(area => filter.impactAreas!.includes(area))
      );
    }

    // Filter by components
    if (filter.components && filter.components.length > 0) {
      results = results.filter(i =>
        i.affectedComponents.some(comp => filter.components!.includes(comp))
      );
    }

    // Filter by build versions
    if (filter.buildVersions && filter.buildVersions.length > 0) {
      results = results.filter(i => filter.buildVersions!.includes(i.buildVersion));
    }

    // Filter by date range
    if (filter.createdAfter) {
      const afterTime = new Date(filter.createdAfter).getTime();
      results = results.filter(i => new Date(i.createdAt).getTime() >= afterTime);
    }

    if (filter.createdBefore) {
      const beforeTime = new Date(filter.createdBefore).getTime();
      results = results.filter(i => new Date(i.createdAt).getTime() <= beforeTime);
    }

    // Filter by assignee
    if (filter.assignedTo) {
      results = results.filter(i => i.assignedTo === filter.assignedTo);
    }

    // Text search
    if (filter.search) {
      const searchLower = filter.search.toLowerCase();
      results = results.filter(i =>
        i.title.toLowerCase().includes(searchLower) ||
        i.description.toLowerCase().includes(searchLower)
      );
    }

    return results;
  }

  /**
   * Get open issues (blocking release)
   */
  getOpenIssues(): Issue[] {
    return this.filterIssues({
      statuses: [IssueStatus.OPEN, IssueStatus.IN_PROGRESS, IssueStatus.ACKNOWLEDGED],
    });
  }

  /**
   * Get critical issues (blocking release)
   */
  getCriticalIssues(): Issue[] {
    return this.filterIssues({
      priorities: [IssuePriority.CRITICAL],
      statuses: [IssueStatus.OPEN, IssueStatus.IN_PROGRESS],
    });
  }

  /**
   * Get issues by build version
   */
  getIssuesByVersion(version: string): Issue[] {
    return this.filterIssues({ buildVersions: [version] });
  }

  /**
   * Get issues by component
   */
  getIssuesByComponent(component: string): Issue[] {
    return this.filterIssues({ components: [component] });
  }

  /**
   * Get issues by category
   */
  getIssuesByCategory(category: IssueCategory): Issue[] {
    return this.filterIssues({ categories: [category] });
  }

  /**
   * Calculate summary statistics
   */
  calculateSummary(): IssueSummary {
    const allIssues = this.getAllIssues();

    const summary: IssueSummary = {
      totalIssues: allIssues.length,
      byCategory: {} as Record<IssueCategory, number>,
      byPriority: {} as Record<IssuePriority, number>,
      bySeverity: {} as Record<SeverityLevel, number>,
      byStatus: {} as Record<IssueStatus, number>,
      openCount: 0,
      criticalCount: 0,
    };

    // Initialize counts
    Object.values(IssueCategory).forEach(cat => {
      (summary.byCategory as Record<string, number>)[cat] = 0;
    });
    Object.values(IssuePriority).forEach(pri => {
      (summary.byPriority as Record<string, number>)[pri] = 0;
    });
    Object.values(SeverityLevel).forEach(sev => {
      (summary.bySeverity as Record<string, number>)[sev] = 0;
    });
    Object.values(IssueStatus).forEach(sta => {
      (summary.byStatus as Record<string, number>)[sta] = 0;
    });

    // Count issues
    allIssues.forEach(issue => {
      (summary.byCategory as Record<string, number>)[issue.category]++;
      (summary.byPriority as Record<string, number>)[issue.priority]++;
      (summary.bySeverity as Record<string, number>)[issue.severity]++;
      (summary.byStatus as Record<string, number>)[issue.status]++;

      if (issue.status === IssueStatus.OPEN || issue.status === IssueStatus.IN_PROGRESS) {
        summary.openCount++;
      }

      if (issue.priority === IssuePriority.CRITICAL) {
        summary.criticalCount++;
      }
    });

    // Calculate average resolution time
    const resolvedIssues = allIssues.filter(i => i.resolvedAt && i.createdAt);
    if (resolvedIssues.length > 0) {
      const totalTime = resolvedIssues.reduce((sum, issue) => {
        const created = new Date(issue.createdAt).getTime();
        const resolved = new Date(issue.resolvedAt!).getTime();
        return sum + (resolved - created);
      }, 0);
      summary.averageResolutionTime = Math.round(totalTime / resolvedIssues.length / (1000 * 60 * 60 * 24));
    }

    return summary;
  }

  /**
   * Calculate detailed statistics
   */
  calculateStatistics(): IssueStatistics {
    const allIssues = this.getAllIssues();
    const summary = this.calculateSummary();

    const resolved = allIssues.filter(i => i.status === IssueStatus.CLOSED);
    const resolutionTimes = resolved
      .map(i => {
        const created = new Date(i.createdAt).getTime();
        const resolvedTime = new Date(i.resolvedAt!).getTime();
        return (resolvedTime - created) / (1000 * 60 * 60 * 24);
      })
      .sort((a, b) => a - b);

    // Top categories
    const categoryMap = new Map<IssueCategory, number>();
    allIssues.forEach(i => {
      categoryMap.set(i.category, (categoryMap.get(i.category) || 0) + 1);
    });
    const topCategories = Array.from(categoryMap.entries())
      .map(([cat, count]) => ({ category: cat, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Top components
    const componentMap = new Map<string, number>();
    allIssues.forEach(i => {
      i.affectedComponents.forEach(comp => {
        componentMap.set(comp, (componentMap.get(comp) || 0) + 1);
      });
    });
    const topComponents = Array.from(componentMap.entries())
      .map(([comp, count]) => ({ component: comp, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const critical = allIssues.filter(
      i => i.priority === IssuePriority.CRITICAL && i.status !== IssueStatus.CLOSED
    );

    return {
      totalCreated: allIssues.length,
      totalResolved: resolved.length,
      averageResolutionTime: summary.averageResolutionTime || 0,
      medianResolutionTime: resolutionTimes[Math.floor(resolutionTimes.length / 2)] || 0,
      resolutionRate: allIssues.length > 0 ? (resolved.length / allIssues.length) * 100 : 0,
      topCategories,
      topComponents,
      trendingIssueTypes: topCategories.map(t => t.category),
      criticalOpenIssues: critical.length,
      blockedReleases: this.getCriticalIssues().length,
    };
  }

  /**
   * Batch create issues
   */
  batchCreateIssues(issues: Issue[], performedBy: string): Issue[] {
    const created = issues.map(issue => this.createIssue(issue));

    this.batchOperations.push({
      operation: 'CREATE',
      issues: created,
      timestamp: new Date().toISOString(),
      performedBy,
    });

    return created;
  }

  /**
   * Bulk update issues (e.g., mark as resolved)
   */
  bulkUpdateIssues(issueIds: string[], updates: Partial<Issue>, performedBy: string): Issue[] {
    const updated = issueIds.map(id => this.updateIssue(id, updates));

    this.batchOperations.push({
      operation: 'UPDATE',
      issues: updated,
      timestamp: new Date().toISOString(),
      performedBy,
    });

    return updated;
  }

  /**
   * Save issues to disk (JSON format)
   */
  private saveToDisk(): void {
    if (!this.persistencePath) {
      return;
    }

    try {
      const directory = path.dirname(this.persistencePath);
      if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
      }

      const issues = Array.from(this.issues.values());
      const data = {
        lastUpdated: new Date().toISOString(),
        totalIssues: issues.length,
        issues,
        batchOperations: this.batchOperations.slice(-100), // Keep last 100
      };

      fs.writeFileSync(this.persistencePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save issues to disk:', error);
    }
  }

  /**
   * Load issues from disk
   */
  private loadFromDisk(): void {
    if (!this.persistencePath || !fs.existsSync(this.persistencePath)) {
      return;
    }

    try {
      const content = fs.readFileSync(this.persistencePath, 'utf-8');
      const data = JSON.parse(content);

      this.issues.clear();
      (data.issues || []).forEach((issue: Issue) => {
        this.issues.set(issue.issueId, issue);
      });

      this.batchOperations = data.batchOperations || [];
    } catch (error) {
      console.error('Failed to load issues from disk:', error);
    }
  }

  /**
   * Export issues as JSON
   */
  exportAsJSON(): string {
    const summary = this.calculateSummary();
    const issues = this.getAllIssues();

    return JSON.stringify(
      {
        exportedAt: new Date().toISOString(),
        summary,
        issues,
      },
      null,
      2
    );
  }

  /**
   * Export issues as formatted text
   */
  exportAsText(): string {
    const summary = this.calculateSummary();
    const criticalIssues = this.getCriticalIssues();
    const openIssues = this.getOpenIssues();

    let text = '';
    text += '═══════════════════════════════════════════════════════════\n';
    text += 'ISSUE REPOSITORY REPORT\n';
    text += '═══════════════════════════════════════════════════════════\n\n';

    text += `Generated: ${new Date().toISOString()}\n`;
    text += `Total Issues: ${summary.totalIssues}\n`;
    text += `Open Issues: ${summary.openCount}\n`;
    text += `Critical Issues: ${summary.criticalCount}\n\n`;

    text += '───────────────────────────────────────────────────────────\n';
    text += 'ISSUES BY STATUS\n';
    text += '───────────────────────────────────────────────────────────\n';
    Object.entries(summary.byStatus).forEach(([status, count]) => {
      text += `  ${status}: ${count}\n`;
    });
    text += '\n';

    text += '───────────────────────────────────────────────────────────\n';
    text += 'CRITICAL OPEN ISSUES\n';
    text += '───────────────────────────────────────────────────────────\n';
    if (criticalIssues.length === 0) {
      text += '  ✓ No critical issues\n';
    } else {
      criticalIssues.forEach(issue => {
        text += `\n  ${issue.issueId} | ${issue.title}\n`;
        text += `  Category: ${issue.category} | Severity: ${issue.severity}\n`;
        text += `  Status: ${issue.status} | Assigned: ${issue.assignedTo || 'Unassigned'}\n`;
        text += `  Consequence: ${issue.consequenceIfNotFixed}\n`;
      });
    }
    text += '\n';

    text += '───────────────────────────────────────────────────────────\n';
    text += 'TOP COMPONENTS BY ISSUE COUNT\n';
    text += '───────────────────────────────────────────────────────────\n';
    const componentMap = new Map<string, number>();
    this.getAllIssues().forEach(i => {
      i.affectedComponents.forEach(comp => {
        componentMap.set(comp, (componentMap.get(comp) || 0) + 1);
      });
    });
    Array.from(componentMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .forEach(([comp, count]) => {
        text += `  ${comp}: ${count} issues\n`;
      });

    text += '\n═══════════════════════════════════════════════════════════\n';

    return text;
  }

  /**
   * Clear all issues (for testing)
   */
  clear(): void {
    this.issues.clear();
    this.batchOperations = [];
    this.saveToDisk();
  }

  /**
   * Get repository statistics
   */
  getRepositoryStats(): {
    totalIssues: number;
    totalBatches: number;
    lastUpdated?: string;
    diskPath?: string;
  } {
    return {
      totalIssues: this.issues.size,
      totalBatches: this.batchOperations.length,
      lastUpdated: this.issues.size > 0 ? new Date().toISOString() : undefined,
      diskPath: this.persistencePath,
    };
  }
}
