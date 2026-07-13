import { Issue } from './Issue';
import { IssueId } from './IssueId';

/**
 * Repository Interface für Issue Persistierung
 *
 * Definiert Verträge für:
 * - Speicherung und Abruf von Issues
 * - Suche und Filterung
 * - Persistierungs-Abstraktionen
 *
 * Implementierungen können: JSON, Datenbank, Cloud Storage, etc. verwenden
 */
export interface IssueRepository {
  /**
   * Speichert ein neues Issue
   */
  save(issue: Issue): Promise<void>;

  /**
   * Aktualisiert ein bestehendes Issue
   */
  update(issue: Issue): Promise<void>;

  /**
   * Findet ein Issue nach ID
   */
  findById(id: IssueId): Promise<Issue | null>;

  /**
   * Gibt alle Issues zurück
   */
  findAll(): Promise<Issue[]>;

  /**
   * Findet Issues nach Severity
   */
  findBySeverity(severity: string): Promise<Issue[]>;

  /**
   * Findet Issues nach Komponente
   */
  findByComponent(component: string): Promise<Issue[]>;

  /**
   * Findet Issues nach Kategorie
   */
  findByCategory(category: string): Promise<Issue[]>;

  /**
   * Findet Issues nach Status
   */
  findByStatus(status: string): Promise<Issue[]>;

  /**
   * Findet Issues nach Build Version
   */
  findByBuildVersion(buildVersion: string): Promise<Issue[]>;

  /**
   * Suche nach Title mit Wildcard
   */
  findByTitleContains(searchTerm: string): Promise<Issue[]>;

  /**
   * Findet Issues innerhalb eines Zeitraums
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<Issue[]>;

  /**
   * Gibt Statistiken über alle Issues zurück
   */
  getStatistics(): Promise<IssueStatistics>;

  /**
   * Gibt Statistiken für eine Komponente zurück
   */
  getComponentStatistics(component: string): Promise<ComponentStatistics>;

  /**
   * Löscht ein Issue
   */
  delete(id: IssueId): Promise<void>;

  /**
   * Zählt alle Issues
   */
  count(): Promise<number>;

  /**
   * Prüft, ob ein Issue existiert
   */
  exists(id: IssueId): Promise<boolean>;

  /**
   * Speichert mehrere Issues (Batch)
   */
  saveMany(issues: Issue[]): Promise<void>;

  /**
   * Löscht alle Issues
   */
  deleteAll(): Promise<void>;
}

/**
 * Statistiken für alle Issues
 */
export interface IssueStatistics {
  total: number;
  bySeverity: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    INFO: number;
  };
  byStatus: {
    OPEN: number;
    IN_PROGRESS: number;
    RESOLVED: number;
    CLOSED: number;
    ARCHIVED: number;
  };
  byComponent: Record<string, number>;
  byCategory: Record<string, number>;
  averageResolutionTime?: number;
}

/**
 * Statistiken für eine spezifische Komponente
 */
export interface ComponentStatistics {
  component: string;
  totalIssues: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  infoCount: number;
  openCount: number;
  resolvedCount: number;
  recentIssues: Issue[];
}
