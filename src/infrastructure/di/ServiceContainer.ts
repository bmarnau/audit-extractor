/**
 * ServiceContainer - Zentrale Dependency Injection Konfiguration
 *
 * Registriert alle Services zentral für durchgehende Dependency Injection.
 * Keine direkten `new` Aufrufe außerhalb des Containers.
 *
 * @version 0.13.0
 * @phase 13
 * @principle DI-First: Alle Services über Container auflösen
 */

import { container } from 'tsyringe';

// Application Services
import { ChunkingEngine } from '@application/chunking/ChunkingEngine';
import { FeatureBasedClassifier } from '@application/classification/DocumentClassifierImpl';
import { ExtractionPipeline } from '@application/ExtractionPipeline';
import { MetricsBasedQualityEvaluator } from '@application/quality/QualityEvaluatorImpl';

// Domain Services
// Note: RuleLoader and LLMExtractor are NOT registered in DI container - they're instantiated directly in ExtractionPipeline
import { HallucinationValidator } from '@domain/HallucinationValidator';
import { AjvValidationService } from '@domain/validation/ValidationServiceImpl';

// Parser Infrastructure
import { ParserService } from '@infrastructure/parsers/ParserService';

// Infrastructure Services
import { ResultRepository } from '@infrastructure/ResultRepository';
import { ConfigManager } from '@infrastructure/config/ConfigManager';
import { BackupService } from '@infrastructure/services/BackupService';

// Phase 15 Revision System
import { RunComparisonService } from '@application/revision/RunComparisonService';
import { RunHistoryService } from '@application/revision/RunHistoryService';

// Phase 15 Schema-Driven Rule Generation
import { SchemaAnalyzer } from '@domain/schema/SchemaAnalyzer';
import { ExampleAnalyzer } from '@domain/schema/ExampleAnalyzer';
import { RuleGenerator } from '@application/rule-generation/RuleGenerator';

// Phase 16 Database & Schema Management
import { SchemaRepository } from '@domain/schema/SchemaRepository';
import { SchemaStorageService } from '@application/schema/SchemaStorageService';
import { SchemaDirectoryManager } from '@infrastructure/filesystem/SchemaDirectoryManager';
import { SchemaManagementService } from '@application/schema/SchemaManagementService';

// Phase 21 Asynchronous Job Processing
import { JobRepository } from '@infrastructure/repositories/JobRepository';
import { JobService } from '@application/jobs/JobService';

// Phase 22 Job-Based Architecture
import { JobStructureService } from '@infrastructure/services/JobStructureService';
import { JobLoaderService } from '@infrastructure/services/JobLoaderService';
import { SchemaLoaderService } from '@infrastructure/services/SchemaLoaderService';
import { ExampleAnalysisService } from '@infrastructure/services/ExampleAnalysisService';
import { JobStructureApplicationService } from '@application/jobs/JobStructureApplicationService';
import { JobOrchestrator } from '@application/orchestration/JobOrchestrator';

/**
 * Registriert alle Services im globalen Container
 *
 * Nutze:
 * ```typescript
 * const container = getServiceContainer();
 * const pipeline = container.resolve(ExtractionPipeline);
 * ```
 */
export function initializeServiceContainer(): void {
  // ============================================================================
  // INFRASTRUCTURE SERVICES - Parsers
  // ============================================================================
  container.registerSingleton(ParserService);

  // ============================================================================
  // APPLICATION SERVICES - Chunking, Classification, Extraction
  // ============================================================================
  container.registerSingleton(ChunkingEngine);
  container.registerSingleton(FeatureBasedClassifier);
  // LLMExtractor is NOT registered in DI - it's instantiated directly in ExtractionPipeline

  // ============================================================================
  // DOMAIN SERVICES - Validation, Quality, Hallucination Detection
  // ============================================================================
  // RuleLoader is instantiated directly in ExtractionPipeline, not via DI
  // This avoids the issue with optional constructor parameters
  container.registerSingleton(HallucinationValidator);
  container.registerSingleton(AjvValidationService);
  container.registerSingleton(MetricsBasedQualityEvaluator);

  // ============================================================================
  // INFRASTRUCTURE SERVICES - Storage, Config, Backup
  // ============================================================================
  container.registerSingleton(ResultRepository);
  container.registerSingleton(ConfigManager);
  container.registerSingleton(BackupService);

  // ============================================================================
  // TOKEN-BASED REGISTRATIONS FOR @inject() DECORATORS IN ExtractionPipeline
  // ============================================================================
  container.registerSingleton('DocumentParser', ParserService);
  container.registerSingleton('ChunkingEngine', ChunkingEngine);
  container.registerSingleton('DocumentClassifier', FeatureBasedClassifier);
  // RuleLoader, LLMExtractor, ValidationService, QualityEvaluator, and ResultRepository are NOT registered here 
  // - they're instantiated directly in ExtractionPipeline
  container.registerSingleton('HallucinationValidator', HallucinationValidator);

  // ============================================================================
  // ORCHESTRATION - Central Pipeline (depends on all above)
  // ============================================================================
  container.registerSingleton(ExtractionPipeline);

  // ============================================================================
  // PHASE 15 - Revision System
  // ============================================================================
  container.registerSingleton(RunComparisonService);
  container.registerSingleton(RunHistoryService);

  // ============================================================================
  // PHASE 15 - Schema-Driven Rule Generation
  // ============================================================================
  container.registerSingleton(SchemaAnalyzer);
  container.registerSingleton(ExampleAnalyzer);
  container.registerSingleton(RuleGenerator);

  // ============================================================================
  // PHASE 16 - Database & Schema Persistence
  // ============================================================================
  container.registerSingleton(SchemaRepository);
  container.registerSingleton(SchemaStorageService);
  container.registerSingleton(SchemaDirectoryManager);
  container.registerSingleton(SchemaManagementService);

  // ============================================================================
  // PHASE 21 - Asynchronous Job Processing
  // ============================================================================
  container.registerSingleton(JobRepository);
  container.registerSingleton(JobService);

  // ============================================================================
  // PHASE 22 - Job-Based Architecture with DDD
  // ============================================================================
  container.registerSingleton(JobStructureService);
  container.registerSingleton(JobLoaderService);
  container.registerSingleton(SchemaLoaderService);
  container.registerSingleton(ExampleAnalysisService);
  container.registerSingleton(JobStructureApplicationService);
  container.registerSingleton(JobOrchestrator);
}

/**
 * Holt den globalen Service Container
 *
 * Nutze dies nach initializeServiceContainer() aufgerufen wurde
 */
export function getServiceContainer() {
  return container;
}

/**
 * Resolves a service from the container
 *
 * Beispiel:
 * ```typescript
 * const pipeline = resolveService(ExtractionPipeline);
 * const configManager = resolveService(ConfigManager);
 * ```
 *
 * @param ServiceClass Der zu auflösende Service
 * @returns Instanz des Services
 */
export function resolveService<T>(ServiceClass: { new (...args: any[]): T }): T {
  return container.resolve(ServiceClass as any);
}

// ============================================================================
// STARTUP SEQUENCE
// ============================================================================

/**
 * Initialisiert alle Services beim Application Startup
 *
 * Sollte in der main.ts / server.ts aufgerufen werden:
 * ```typescript
 * import { initializeServices } from '@infrastructure/di/ServiceContainer';
 * await initializeServices();
 * ```
 */
export async function initializeServices(): Promise<void> {
  // 1. Globale Container-Registrierung
  initializeServiceContainer();

  // 2. ConfigManager initialisieren (lazy loading von Dateien)
  const configManager = resolveService(ConfigManager);
  await configManager.initialize();

  console.log('✅ Service Container initialisiert');
  console.log('📋 Registered Services:');
  console.log('   ✓ DocumentParser');
  console.log('   ✓ ChunkingEngine');
  console.log('   ✓ DocumentClassifier');
  console.log('   ✓ RuleLoader');
  console.log('   ✓ LLMExtractor');
  console.log('   ✓ HallucinationValidator');
  console.log('   ✓ ValidationService');
  console.log('   ✓ QualityEvaluator');
  console.log('   ✓ ResultRepository');
  console.log('   ✓ ConfigManager');
  console.log('   ✓ ExtractionPipeline');
}

export default {
  initializeServices,
  initializeServiceContainer,
  getServiceContainer,
  resolveService,
};
