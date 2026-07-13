import { IssueId } from './IssueId';
import { Severity } from './Severity';

/**
 * Issue Domain Entity
 * Aggregiert root für das Issue Management System
 *
 * Verantwortlich für:
 * - Verwaltung von Fehler- und Qualitätsinformationen
 * - Konsistenz der Issue-Daten
 * - Business Logic für Issue-Lebenszyklen
 */
export class Issue {
  private issueId: IssueId;
  private title: string;
  private description: string;
  private category: string;
  private component: string;
  private severity: Severity;
  private rootCause: string;
  private recommendation: string;
  private consequenceIfResolved: string;
  private consequenceIfIgnored: string;
  private detectedBy: string;
  private buildVersion: string;
  private timestamp: Date;
  private createdAt: Date;
  private updatedAt: Date;
  private status: IssueStatus;

  private constructor(
    issueId: IssueId,
    title: string,
    description: string,
    category: string,
    component: string,
    severity: Severity,
    rootCause: string,
    recommendation: string,
    consequenceIfResolved: string,
    consequenceIfIgnored: string,
    detectedBy: string,
    buildVersion: string,
    timestamp: Date,
    status: IssueStatus = IssueStatus.OPEN
  ) {
    this.validateInputs(
      title,
      description,
      category,
      component,
      rootCause,
      recommendation,
      consequenceIfResolved,
      consequenceIfIgnored,
      detectedBy,
      buildVersion
    );

    this.issueId = issueId;
    this.title = title.trim();
    this.description = description.trim();
    this.category = category.trim();
    this.component = component.trim();
    this.severity = severity;
    this.rootCause = rootCause.trim();
    this.recommendation = recommendation.trim();
    this.consequenceIfResolved = consequenceIfResolved.trim();
    this.consequenceIfIgnored = consequenceIfIgnored.trim();
    this.detectedBy = detectedBy.trim();
    this.buildVersion = buildVersion.trim();
    this.timestamp = timestamp;
    this.status = status;
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  /**
   * Factory Methode für neue Issues
   */
  static create(props: IssueProps): Issue {
    return new Issue(
      IssueId.generate(),
      props.title,
      props.description,
      props.category,
      props.component,
      props.severity,
      props.rootCause,
      props.recommendation,
      props.consequenceIfResolved,
      props.consequenceIfIgnored,
      props.detectedBy,
      props.buildVersion,
      props.timestamp || new Date()
    );
  }

  /**
   * Rekonstruktion aus persistierten Daten
   */
  static fromPersistence(data: IssuePersistenceData): Issue {
    const issue = new Issue(
      IssueId.from(data.issueId),
      data.title,
      data.description,
      data.category,
      data.component,
      data.severity,
      data.rootCause,
      data.recommendation,
      data.consequenceIfResolved,
      data.consequenceIfIgnored,
      data.detectedBy,
      data.buildVersion,
      new Date(data.timestamp),
      data.status || IssueStatus.OPEN
    );
    issue.createdAt = new Date(data.createdAt);
    issue.updatedAt = new Date(data.updatedAt);
    return issue;
  }

  /**
   * Validierung der Eingaben
   */
  private validateInputs(
    title: string,
    description: string,
    category: string,
    component: string,
    rootCause: string,
    recommendation: string,
    consequenceIfResolved: string,
    consequenceIfIgnored: string,
    detectedBy: string,
    buildVersion: string
  ): void {
    if (!title || title.trim().length === 0) {
      throw new Error('Issue title is required');
    }
    if (title.length > 255) {
      throw new Error('Issue title must not exceed 255 characters');
    }
    if (!description || description.trim().length === 0) {
      throw new Error('Issue description is required');
    }
    if (!category || category.trim().length === 0) {
      throw new Error('Issue category is required');
    }
    if (!component || component.trim().length === 0) {
      throw new Error('Issue component is required');
    }
    if (!rootCause || rootCause.trim().length === 0) {
      throw new Error('Issue rootCause is required');
    }
    if (!recommendation || recommendation.trim().length === 0) {
      throw new Error('Issue recommendation is required');
    }
    if (!consequenceIfResolved || consequenceIfResolved.trim().length === 0) {
      throw new Error('Issue consequenceIfResolved is required');
    }
    if (!consequenceIfIgnored || consequenceIfIgnored.trim().length === 0) {
      throw new Error('Issue consequenceIfIgnored is required');
    }
    if (!detectedBy || detectedBy.trim().length === 0) {
      throw new Error('Issue detectedBy is required');
    }
    if (!buildVersion || buildVersion.trim().length === 0) {
      throw new Error('Issue buildVersion is required');
    }
  }

  // ============ Getters ============

  getIssueId(): IssueId {
    return this.issueId;
  }

  getTitle(): string {
    return this.title;
  }

  getDescription(): string {
    return this.description;
  }

  getCategory(): string {
    return this.category;
  }

  getComponent(): string {
    return this.component;
  }

  getSeverity(): Severity {
    return this.severity;
  }

  getRootCause(): string {
    return this.rootCause;
  }

  getRecommendation(): string {
    return this.recommendation;
  }

  getConsequenceIfResolved(): string {
    return this.consequenceIfResolved;
  }

  getConsequenceIfIgnored(): string {
    return this.consequenceIfIgnored;
  }

  getDetectedBy(): string {
    return this.detectedBy;
  }

  getBuildVersion(): string {
    return this.buildVersion;
  }

  getTimestamp(): Date {
    return this.timestamp;
  }

  getStatus(): IssueStatus {
    return this.status;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  // ============ Geschäftslogik ============

  /**
   * Status des Issues aktualisieren
   */
  updateStatus(newStatus: IssueStatus): void {
    if (this.status === newStatus) {
      return; // Keine Änderung notwendig
    }
    this.status = newStatus;
    this.updatedAt = new Date();
  }

  /**
   * Überprüft, ob das Issue gelöst ist
   */
  isResolved(): boolean {
    return this.status === IssueStatus.RESOLVED;
  }

  /**
   * Überprüft, ob das Issue kritisch ist
   */
  isCritical(): boolean {
    return this.severity === Severity.CRITICAL;
  }

  /**
   * Überprüft, ob das Issue High Priority hat
   */
  isHighPriority(): boolean {
    return this.severity === Severity.CRITICAL || this.severity === Severity.HIGH;
  }

  /**
   * Aktualisiert Recommendation
   */
  updateRecommendation(newRecommendation: string): void {
    if (!newRecommendation || newRecommendation.trim().length === 0) {
      throw new Error('Recommendation cannot be empty');
    }
    this.recommendation = newRecommendation.trim();
    this.updatedAt = new Date();
  }

  /**
   * Aktualisiert Severity (nur bei OPEN Status)
   */
  updateSeverity(newSeverity: Severity): void {
    if (this.status !== IssueStatus.OPEN) {
      throw new Error('Cannot update severity of non-open issues');
    }
    this.severity = newSeverity;
    this.updatedAt = new Date();
  }

  /**
   * Konvertiert Issue zu Plain Object für Serialisierung
   */
  toPersistence(): IssuePersistenceData {
    return {
      issueId: this.issueId.getValue(),
      title: this.title,
      description: this.description,
      category: this.category,
      component: this.component,
      severity: this.severity,
      rootCause: this.rootCause,
      recommendation: this.recommendation,
      consequenceIfResolved: this.consequenceIfResolved,
      consequenceIfIgnored: this.consequenceIfIgnored,
      detectedBy: this.detectedBy,
      buildVersion: this.buildVersion,
      timestamp: this.timestamp.toISOString(),
      status: this.status,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  /**
   * Konvertiert zu JSON
   */
  toJSON(): IssuePersistenceData {
    return this.toPersistence();
  }
}

/**
 * Issue Status Enum
 */
export enum IssueStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
  ARCHIVED = 'ARCHIVED'
}

/**
 * Props für Issue-Erstellung
 */
export interface IssueProps {
  title: string;
  description: string;
  category: string;
  component: string;
  severity: Severity;
  rootCause: string;
  recommendation: string;
  consequenceIfResolved: string;
  consequenceIfIgnored: string;
  detectedBy: string;
  buildVersion: string;
  timestamp?: Date;
}

/**
 * Persistierungs-Format für Datenbank/JSON
 */
export interface IssuePersistenceData {
  issueId: string;
  title: string;
  description: string;
  category: string;
  component: string;
  severity: Severity;
  rootCause: string;
  recommendation: string;
  consequenceIfResolved: string;
  consequenceIfIgnored: string;
  detectedBy: string;
  buildVersion: string;
  timestamp: string;
  status: IssueStatus;
  createdAt: string;
  updatedAt: string;
}
