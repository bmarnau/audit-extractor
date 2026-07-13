/**
 * TEST GOVERNANCE FRAMEWORK
 * 
 * Complete test governance solution with:
 * ✅ Error Collection & Analysis
 * ✅ Severity Assessment (CRITICAL, HIGH, MEDIUM, LOW, INFO)
 * ✅ Recommendation Engine
 * ✅ Risk Analysis & Mitigation Planning
 * ✅ Release Decision Making
 * ✅ Management Reporting
 */

// Main Framework
export { TestGovernanceFramework, testGovernanceFramework } from './test-governance.framework';

// Types
export type { GovernanceReport, TestFailure, Recommendation, RiskAssessment, ReleaseDecision } from './types/governance-report.types';
export type { SeverityLevel, SeverityMetrics, SeverityAssessmentResult } from './types/severity.types';
export type { RiskFactor, RiskMatrix, RiskMitigation, RiskRegister } from './types/risk-analysis.types';

// Services
export { ErrorCollectorService } from './services/error-collector.service';
export { SeverityAssessorService, SeverityLevel } from './services/severity-assessor.service';
export { RecommendationEngineService } from './services/recommendation-engine.service';
export { RiskAnalyzerService } from './services/risk-analyzer.service';
export { ReleaseDecisionService } from './services/release-decision.service';

// Reporters
export { GovernanceReportGenerator } from './reporters/governance-report.generator';
