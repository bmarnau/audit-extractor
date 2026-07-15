/**
 * Main Entry Point
 * 
 * Serves two purposes:
 * 1. When imported as a module: exports library code
 * 2. When run as CLI: starts the Express API server
 */

// MUST be first! tsyringe requires this polyfill
// Using import for ESM compatibility
import 'reflect-metadata';

// Register tsconfig-paths for module resolution
// Using direct path with .js for ESM compatibility
import 'tsconfig-paths/register.js';

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
// When run with: npx ts-node src/index.ts or node dist/index.js
// This check works with both CommonJS and ESM
(async () => {
  const isMainModule = process.argv[1]?.endsWith('index.ts') || 
                       process.argv[1]?.endsWith('index.js') ||
                       process.argv[1]?.includes('ts-node');
  
  if (isMainModule) {
    try {
      const { startServer } = await import('@infrastructure/api/index.js');
      await startServer();
    } catch (err) {
      console.error('[Fatal] Failed to start server:', err);
      process.exit(1);
    }
  }
})();
