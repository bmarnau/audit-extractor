import { Issue, IssueStatus } from '../../domain/issue/Issue';
import { IssueId } from '../../domain/issue/IssueId';
import { IssueRepository, IssueStatistics, ComponentStatistics } from '../../domain/issue/IssueRepository';
import { IssueFactory } from '../../domain/issue/IssueFactory';
import { Severity } from '../../domain/issue/Severity';

/**
 * IssueService - Application Service
 *
 * Orchestriert:
 * - Geschäftslogik für Issue Management
 * - Koordination zwischen Domain und Infrastructure Layer
 * - Use Cases für Issue Verwaltung
 */
export class IssueService {
  constructor(private readonly issueRepository: IssueRepository) {}

  /**
   * Erstellt ein neues Issue
   */
  async createIssue(issueData: any): Promise<Issue> {
    const issue = IssueFactory.createIssue(issueData);
    await this.issueRepository.save(issue);
    return issue;
  }

  /**
   * Erstellt ein Issue aus Testfehler
   */
  async createFromTestFailure(failureData: any): Promise<Issue> {
    const issue = IssueFactory.createFromTestFailure(failureData);
    await this.issueRepository.save(issue);
    return issue;
  }

  /**
   * Erstellt ein Issue aus API-Test Fehler
   */
  async createFromApiTestFailure(failureData: any): Promise<Issue> {
    const issue = IssueFactory.createFromApiTestFailure(failureData);
    await this.issueRepository.save(issue);
    return issue;
  }

  /**
   * Erstellt ein Issue aus Performance-Fehler
   */
  async createFromPerformanceFailure(failureData: any): Promise<Issue> {
    const issue = IssueFactory.createFromPerformanceFailure(failureData);
    await this.issueRepository.save(issue);
    return issue;
  }

  /**
   * Erstellt ein Issue aus Lint-Fehler
   */
  async createFromLintError(errorData: any): Promise<Issue> {
    const issue = IssueFactory.createFromLintError(errorData);
    await this.issueRepository.save(issue);
    return issue;
  }

  /**
   * Erstellt ein Issue aus Validierungs-Fehler
   */
  async createFromValidationFailure(failureData: any): Promise<Issue> {
    const issue = IssueFactory.createFromValidationFailure(failureData);
    await this.issueRepository.save(issue);
    return issue;
  }

  /**
   * Erstellt ein Issue aus Integrations-Fehler
   */
  async createFromIntegrationFailure(failureData: any): Promise<Issue> {
    const issue = IssueFactory.createFromIntegrationFailure(failureData);
    await this.issueRepository.save(issue);
    return issue;
  }

  /**
   * Findet ein Issue nach ID
   */
  async getIssueById(issueId: string): Promise<Issue | null> {
    return this.issueRepository.findById(IssueId.from(issueId));
  }

  /**
   * Gibt alle Issues zurück
   */
  async getAllIssues(): Promise<Issue[]> {
    return this.issueRepository.findAll();
  }

  /**
   * Findet Issues nach Severity
   */
  async getIssuesBySeverity(severity: Severity): Promise<Issue[]> {
    return this.issueRepository.findBySeverity(severity);
  }

  /**
   * Findet alle kritischen Issues
   */
  async getCriticalIssues(): Promise<Issue[]> {
    return this.issueRepository.findBySeverity(Severity.CRITICAL);
  }

  /**
   * Findet alle offenen Issues mit HIGH oder CRITICAL Severity
   */
  async getHighPriorityIssues(): Promise<Issue[]> {
    const all = await this.issueRepository.findAll();
    return all.filter(issue => issue.isHighPriority() && issue.getStatus() === IssueStatus.OPEN);
  }

  /**
   * Findet Issues nach Komponente
   */
  async getIssuesByComponent(component: string): Promise<Issue[]> {
    return this.issueRepository.findByComponent(component);
  }

  /**
   * Findet Issues nach Kategorie
   */
  async getIssuesByCategory(category: string): Promise<Issue[]> {
    return this.issueRepository.findByCategory(category);
  }

  /**
   * Findet Issues nach Status
   */
  async getIssuesByStatus(status: IssueStatus): Promise<Issue[]> {
    return this.issueRepository.findByStatus(status);
  }

  /**
   * Findet offene Issues
   */
  async getOpenIssues(): Promise<Issue[]> {
    return this.issueRepository.findByStatus(IssueStatus.OPEN);
  }

  /**
   * Findet Issues nach Build Version
   */
  async getIssuesByBuildVersion(buildVersion: string): Promise<Issue[]> {
    return this.issueRepository.findByBuildVersion(buildVersion);
  }

  /**
   * Sucht Issues nach Title
   */
  async searchIssuesByTitle(searchTerm: string): Promise<Issue[]> {
    return this.issueRepository.findByTitleContains(searchTerm);
  }

  /**
   * Findet Issues im Zeitraum
   */
  async getIssuesByDateRange(startDate: Date, endDate: Date): Promise<Issue[]> {
    return this.issueRepository.findByDateRange(startDate, endDate);
  }

  /**
   * Aktualisiert Issue Status
   */
  async updateIssueStatus(issueId: string, newStatus: IssueStatus): Promise<Issue | null> {
    const issue = await this.issueRepository.findById(IssueId.from(issueId));
    if (!issue) return null;

    issue.updateStatus(newStatus);
    await this.issueRepository.update(issue);
    return issue;
  }

  /**
   * Aktualisiert Issue Recommendation
   */
  async updateIssueRecommendation(issueId: string, newRecommendation: string): Promise<Issue | null> {
    const issue = await this.issueRepository.findById(IssueId.from(issueId));
    if (!issue) return null;

    issue.updateRecommendation(newRecommendation);
    await this.issueRepository.update(issue);
    return issue;
  }

  /**
   * Aktualisiert Issue Severity (nur OPEN Issues)
   */
  async updateIssueSeverity(issueId: string, newSeverity: Severity): Promise<Issue | null> {
    const issue = await this.issueRepository.findById(IssueId.from(issueId));
    if (!issue) return null;

    issue.updateSeverity(newSeverity);
    await this.issueRepository.update(issue);
    return issue;
  }

  /**
   * Markiert Issue als gelöst
   */
  async resolveIssue(issueId: string): Promise<Issue | null> {
    return this.updateIssueStatus(issueId, IssueStatus.RESOLVED);
  }

  /**
   * Markiert Issue als closed
   */
  async closeIssue(issueId: string): Promise<Issue | null> {
    return this.updateIssueStatus(issueId, IssueStatus.CLOSED);
  }

  /**
   * Markiert Issue als in Bearbeitung
   */
  async startResolvingIssue(issueId: string): Promise<Issue | null> {
    return this.updateIssueStatus(issueId, IssueStatus.IN_PROGRESS);
  }

  /**
   * Archiviert ein Issue
   */
  async archiveIssue(issueId: string): Promise<Issue | null> {
    return this.updateIssueStatus(issueId, IssueStatus.ARCHIVED);
  }

  /**
   * Löscht ein Issue
   */
  async deleteIssue(issueId: string): Promise<void> {
    await this.issueRepository.delete(IssueId.from(issueId));
  }

  /**
   * Gibt Statistiken zurück
   */
  async getStatistics(): Promise<IssueStatistics> {
    return this.issueRepository.getStatistics();
  }

  /**
   * Gibt Komponenten-Statistiken zurück
   */
  async getComponentStatistics(component: string): Promise<ComponentStatistics> {
    return this.issueRepository.getComponentStatistics(component);
  }

  /**
   * Zählt alle Issues
   */
  async getTotalIssueCount(): Promise<number> {
    return this.issueRepository.count();
  }

  /**
   * Prüft ob Issue existiert
   */
  async issueExists(issueId: string): Promise<boolean> {
    return this.issueRepository.exists(IssueId.from(issueId));
  }

  /**
   * Importiert mehrere Issues (z.B. aus Test Report)
   */
  async importIssues(issues: any[]): Promise<Issue[]> {
    const created: Issue[] = [];
    for (const issueData of issues) {
      const issue = IssueFactory.createIssue(issueData);
      await this.issueRepository.save(issue);
      created.push(issue);
    }
    return created;
  }

  /**
   * Exportiert alle Issues als JSON
   */
  async exportAllIssuesAsJson(): Promise<any[]> {
    const issues = await this.issueRepository.findAll();
    return issues.map(issue => issue.toPersistence());
  }

  /**
   * Gibt Zusammenfassung mit höchster Priorität
   */
  async getSummary(): Promise<IssueSummary> {
    const [total, critical, open, stats] = await Promise.all([
      this.issueRepository.count(),
      this.issueRepository.findBySeverity(Severity.CRITICAL),
      this.issueRepository.findByStatus(IssueStatus.OPEN),
      this.issueRepository.getStatistics()
    ]);

    return {
      totalIssues: total,
      criticalCount: critical.length,
      openCount: open.length,
      statistics: stats,
      urgentAction: critical.length > 0
    };
  }
}

/**
 * Issue Summary für Übersicht
 */
export interface IssueSummary {
  totalIssues: number;
  criticalCount: number;
  openCount: number;
  statistics: IssueStatistics;
  urgentAction: boolean;
}
