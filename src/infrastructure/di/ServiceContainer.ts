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
import { LLMExtractor } from '@application/LLMExtractor';
import { ExtractionPipeline } from '@application/ExtractionPipeline';
import { MetricsBasedQualityEvaluator } from '@application/quality/QualityEvaluatorImpl';

// Domain Services
import { RuleLoader } from '@core/rules/RuleLoader';
import { HallucinationValidator } from '@domain/HallucinationValidator';
import { AjvValidationService } from '@domain/validation/ValidationServiceImpl';

// Infrastructure Services
import { ResultRepository } from '@infrastructure/ResultRepository';
import { ConfigManager } from '@infrastructure/config/ConfigManager';
import { BackupService } from '@infrastructure/services/BackupService';

// Phase 15 Revision System
import { RunComparisonService } from '@application/revision/RunComparisonService';
import { RunHistoryService } from '@application/revision/RunHistoryService';

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
  // APPLICATION SERVICES - Chunking, Classification, Extraction
  // ============================================================================
  container.registerSingleton(ChunkingEngine);
  container.registerSingleton(FeatureBasedClassifier);
  container.registerSingleton(LLMExtractor);

  // ============================================================================
  // DOMAIN SERVICES - Validation, Quality, Hallucination Detection
  // ============================================================================
  container.registerSingleton(RuleLoader);
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
  // ORCHESTRATION - Central Pipeline (depends on all above)
  // ============================================================================
  container.registerSingleton(ExtractionPipeline);

  // ============================================================================
  // PHASE 15 - Revision System
  // ============================================================================
  container.registerSingleton(RunComparisonService);
  container.registerSingleton(RunHistoryService);
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
