/**
 * Project Version & Phase Information
 * 
 * Centralized version and phase metadata for logging and exports
 */

export const PROJECT_VERSION = '0.35.0';
export const PROJECT_NAME = 'Audit-Safe Document Extractor';

/** Completed Phases */
export enum Phase {
  DOMAIN_MODELS = 2,
  RULE_LOADER = 3,
  PARSER_FRAMEWORK = 4,
  EXAMPLE_REPOSITORY = 5,
  CHUNKING_ENGINE = 6,
  DOCUMENT_CLASSIFIER = 7,
  LLM_EXTRACTOR = 8,
  HALLUCINATION_VALIDATOR = 9,
  VALIDATION_SERVICE = 10,
  REST_API = 11,
  ORCHESTRATION_CENTERS = 12,
  FRONTEND_WORKBENCH = 13,
  AUTOMATIC_RULESET_GENERATION = 14,
}

/** Current Phase */
export const CURRENT_PHASE = Phase.AUTOMATIC_RULESET_GENERATION;

/** Build Info */
export const BUILD_INFO = {
  version: PROJECT_VERSION,
  name: PROJECT_NAME,
  phase: CURRENT_PHASE,
  buildTime: new Date().toISOString(),
  phases: {
    domainModels: 'COMPLETE',
    ruleLoader: 'COMPLETE',
    parserFramework: 'COMPLETE',
    exampleRepository: 'COMPLETE',
    chunkingEngine: 'COMPLETE',
    documentClassifier: 'COMPLETE',
    llmExtractor: 'COMPLETE - Phase 8',
    hallucinationValidator: 'COMPLETE - Phase 9 Rewrite',
    validationService: 'COMPLETE',
    restApi: 'COMPLETE - Phase 11 (Frontend + Backend)',
    orchestrationCenters: 'COMPLETE - Phase 12 (Pipeline + Config/Audit/Help/Log/Backup Centers)',
    frontendWorkbench: 'COMPLETE - Phase 13 (React UI + Material-UI)',
    automaticRulesetGeneration: 'COMPLETE - Phase 14 (Schema + Examples → Auto-Generated Rules)',
  },
};

/**
 * Log project startup info
 */
export function logProjectInfo(): void {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`${BUILD_INFO.name} v${BUILD_INFO.version}`);
  console.log(`Phase ${BUILD_INFO.phase}: REST API Infrastructure`);
  console.log(`Build: ${BUILD_INFO.buildTime}`);
  console.log(`${'='.repeat(60)}\n`);
}

export default BUILD_INFO;
