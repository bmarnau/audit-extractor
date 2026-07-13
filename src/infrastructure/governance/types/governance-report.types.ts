/**
 * GovernanceReport - Haupttypen für Management-Bewertung
 * Output aller TestGovernanceFramework-Analysen
 */

import { SeverityLevel, SeverityAssessmentResult } from './severity.types';

export interface TestFailure {
  testName: string;
  testFile: string;
  error: string;
  stack?: string;
  timestamp: string;
  duration: number;
  category: 'unit' | 'integration' | 'e2e';
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  severity: SeverityLevel;
  priority: number; // 1 (highest) to 10 (lowest)
  action: string;
  expectedOutcome: string;
  estimatedEffort: 'QUICK' | 'MEDIUM' | 'LONG';
  affectedAreas: string[];
  dueDate?: string;
  ownerTeam?: string;
}

export interface RiskAssessment {
  riskId: string;
  name: string;
  description: string;
  probability: 'LOW' | 'MEDIUM' | 'HIGH';
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  riskScore: number; // 1-25
  mitigation: string;
  relatedTests: string[];
  detectionMethod: string;
}

export interface ReleaseDecision {
  canRelease: boolean;
  releaseBlockers: string[];
  warnings: string[];
  recommendedActions: string[];
  approvalLevel: 'APPROVED' | 'CONDITIONAL' | 'BLOCKED';
  reasoning: string;
  timestamp: string;
  decisionMaker?: string;
}

export interface GovernanceReport {
  // Metadata
  reportId: string;
  timestamp: string;
  projectVersion: string;
  testRunId: string;

  // Zusammenfassung
  executiveSummary: {
    totalTestsRun: number;
    passedTests: number;
    failedTests: number;
    passRate: number;
    coveragePercentage: number;
    qualityScore: number; // 0-100
  };

  // Fehleranalyse
  failures: TestFailure[];
  failureAnalysis: {
    failuresByCategory: Record<string, number>;
    failuresByModule: Record<string, number>;
    commonPatterns: string[];
    rootCauseAnalysis: Record<string, string>;
  };

  // Schweregrad Assessment
  severityAssessment: SeverityAssessmentResult;

  // Empfehlungen
  recommendations: Recommendation[];

  // Risikoanalyse
  riskAnalysis: {
    identifiedRisks: RiskAssessment[];
    overallRiskRating: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    riskMatrix: string; // ASCII visualization
    mitigationPlan: string;
  };

  // Releaseentscheidung
  releaseDecision: ReleaseDecision;

  // Compliance & Standards
  compliance: {
    codeStyleCompliance: number; // 0-100 (ESLint)
    typeScriptStrictness: number; // 0-100
    testCoverageCompliance: number; // 0-100 (gegen 80% target)
    documentationCompleteness: number; // 0-100
    preCommitHooksStatus: 'PASSED' | 'FAILED' | 'SKIPPED';
  };

  // Trends & Metriken
  metrics: {
    executionTime: number; // ms
    averageTestDuration: number; // ms
    slowestTests: Array<{ name: string; duration: number }>;
    flakynessIndex: number; // 0-100
    regressionDetected: boolean;
  };

  // Approval & Sign-off
  approval: {
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    approverRole: string;
    approvalComment?: string;
    approvalTimestamp?: string;
  };
}
