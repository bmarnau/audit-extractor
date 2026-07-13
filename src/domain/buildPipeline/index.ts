/**
 * Build Pipeline Domain Layer
 * 
 * Exports für Domain-Komponenten
 */

export { BuildStage, BUILD_STAGE_METADATA } from './BuildStage';
export type { BuildStageDescription } from './BuildStage';

export { BuildMetrics } from './BuildMetrics';
export type { BuildMetricsData } from './BuildMetrics';

export { BuildRisk, RiskCategory, RiskSeverity } from './BuildRisk';
export type { RiskData } from './BuildRisk';

export { BuildRecommendation, RecommendationType } from './BuildRecommendation';
export type { RecommendationData } from './BuildRecommendation';

export { BuildId } from './BuildId';
