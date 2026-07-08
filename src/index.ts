/**
 * Main Entry Point
 * 
 * Serves two purposes:
 * 1. When imported as a module: exports library code
 * 2. When run as CLI: starts the Express API server
 */

// Register tsconfig-paths for module resolution
import 'tsconfig-paths/register';

// Library exports
export { ExtractionEngine, ProvenanceAuditor } from '@application/ExtractionEngine';
export { DocumentRuleAssociationService, ExtractionResultBuilder } from '@application/DocumentRuleAssociation';
export { LearningComponent } from '@application/LearningComponent';

export { ExtractionFieldName } from '@domain/ExtractionFieldName';
export { ConfidenceScore } from '@domain/ConfidenceScore';
export { ExtractionRule, validateNoHallucination, validateAgainstRule } from '@domain/ExtractionRule';
export type {
  ExtractionResult,
  ExtractedValue,
  SourceLocation,
  DocumentReference,
  ExtractionWarning
} from '@domain/ExtractionModels';

export { ResultRepository, DocumentHasher } from '@infrastructure/ResultRepository';
export { RuleSetRepository } from '@infrastructure/RuleSetRepository';

export { AuditReportGenerator } from '@presentation/AuditReportGenerator';

// Re-export types
export type { AuditEntry } from '@application/ExtractionEngine';
export type { LearningEntry } from '@application/LearningComponent';

// CLI Entry Point: Start API Server
// When run with: npx ts-node src/index.ts
// This check works with both CommonJS and ESM
(async () => {
  const isMainModule = process.argv[1]?.endsWith('index.ts') || 
                       process.argv[1]?.includes('ts-node');
  
  if (isMainModule) {
    try {
      const { startServer } = await import('@infrastructure/api');
      await startServer();
    } catch (err) {
      console.error('[Fatal] Failed to start server:', err);
      process.exit(1);
    }
  }
})();
