/**
 * Severity Levels für Test Governance Framework
 * Bestimmt Priorität und Eskalation von Problemen
 */

export enum SeverityLevel {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
  INFO = 'INFO',
}

export interface SeverityMetrics {
  level: SeverityLevel;
  score: number; // 0-100: CRITICAL=90-100, HIGH=70-89, MEDIUM=50-69, LOW=30-49, INFO=0-29
  affectedSystems: string[];
  impactArea: 'core' | 'integration' | 'optional' | 'documentation';
  blocksRelease: boolean; // CRITICAL blockiert automatisch
  requiresHotfix: boolean; // HIGH kann Hotfix erfordern
}

export interface SeverityAssessmentResult {
  timestamp: string;
  totalIssues: number;
  byLevel: Record<SeverityLevel, number>;
  criticalIssues: string[];
  overallRisk: 'SAFE' | 'CAUTION' | 'DANGER';
  assessmentDetails: SeverityMetrics[];
}
