/**
 * ExtractionPipeline - Phase 12
 *
 * Zentrale Orchestrierungsschicht für den kompletten Extraktionsprozess.
 * Verbindet alle 9 Komponenten mit vollständiger Nachvollziehbarkeit.
 *
 * Pipeline-Schritte:
 * 1. Parser         - Dokument parsen
 * 2. ChunkingEngine - In Chunks teilen
 * 3. Classifier    - Dokumenttyp klassifizieren
 * 4. RuleLoader    - Regeln laden
 * 5. LLMExtractor  - Mit LLM extrahieren
 * 6. HalluValidator- Halluzinationen prüfen
 * 7. Validator     - Gegen Schema validieren
 * 8. QualityEval   - Qualität bewerten
 * 9. Repository    - Ergebnisse speichern
 *
 * @version 0.12.0
 * @phase 12
 * @status IN DEVELOPMENT - Integration Layer
 */

import { injectable, inject } from 'tsyringe';
import { ExtractionResult, DocumentReference } from '@domain/ExtractionModels';
import { QualityScore } from '@application/quality/QualityEvaluator';
import { HallucinationReport } from '@domain/HallucinationValidator';

/**
 * Pipeline Step: Input/Output/Duration/Errors
 */
export interface PipelineStep {
  /** Name des Schritts */
  stepName: string;

  /** Schritt-Nummer (1-9) */
  stepNumber: number;

  /** Status: pending|running|completed|failed */
  status: 'pending' | 'running' | 'completed' | 'failed';

  /** Input Daten */
  input: {
    type: string;
    size?: number; // Bytes oder Item Count
    description: string;
  };

  /** Output Daten */
  output?: {
    type: string;
    size?: number;
    description: string;
  };

  /** Verarbeitungszeit (ms) */
  duration: number;

  /** Fehler (falls vorhanden) */
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };

  /** Warnungen (nicht-kritisch) */
  warnings: string[];

  /** Zeitstempel: Start */
  startedAt: Date;

  /** Zeitstempel: Ende */
  completedAt?: Date;

  /** Zusätzliche Metriken (step-spezifisch) */
  metrics?: Record<string, unknown>;
}

/**
 * Pipeline Result: Komplett mit Audit Trail
 */
export interface PipelineResult {
  /** Unique ID der Pipeline-Ausführung */
  pipelineId: string;

  /** Dokumentreferenz */
  document: DocumentReference;

  /** Extraktionsergebnis */
  extraction?: ExtractionResult;

  /** Qualitätsscore */
  quality?: QualityScore;

  /** Halluzination Report */
  hallucination?: HallucinationReport;

  /** Alle Pipeline-Schritte mit Details */
  steps: PipelineStep[];

  /** Gesamtstatus */
  status: 'success' | 'partial' | 'failed';

  /** Gesamtdauer (ms) */
  totalDuration: number;

  /** Fehler (falls kritisch) */
  error?: {
    code: string;
    message: string;
    failedStep: number;
  };

  /** Warnungen aus allen Schritten */
  warnings: Array<{
    step: number;
    message: string;
  }>;

  /** Audit Trail: Alle Events */
  auditTrail: AuditEvent[];

  /** Zeitstempel: Start */
  startedAt: Date;

  /** Zeitstempel: Ende */
  completedAt: Date;
}

/**
 * Audit Event: Für komplettes Tracking
 */
export interface AuditEvent {
  /** Zeitstempel */
  timestamp: Date;

  /** Schritt */
  step: number;

  /** Event Type */
  type: 'started' | 'completed' | 'error' | 'warning';

  /** Message */
  message: string;

  /** Kontext */
  context?: Record<string, unknown>;
}

/**
 * ExtractionPipeline - Haupt-Orchestrator
 */
@injectable()
export class ExtractionPipeline {
  private pipelineId: string = '';
  private steps: PipelineStep[] = [];
  private auditTrail: AuditEvent[] = [];
  private warnings: Array<{ step: number; message: string }> = [];

  constructor(
    // Dependencies vom TSyringe Container
    @inject('DocumentParser') private parser: any, // IDocumentParser
    @inject('ChunkingEngine') private chunkingEngine: any, // ChunkingEngine
    @inject('DocumentClassifier') private classifier: any, // IDocumentClassifier
    @inject('RuleLoader') private ruleLoader: any, // RuleLoader
    @inject('LLMExtractor') private llmExtractor: any, // LLMExtractor
    @inject('HallucinationValidator') private hallucinationValidator: any, // HallucinationValidator
    @inject('ValidationService') private validationService: any, // IValidationService
    @inject('QualityEvaluator') private qualityEvaluator: any, // IQualityEvaluator
    @inject('ResultRepository') private resultRepository: any // IResultRepository
  ) {}

  /**
   * Führe komplette Extraktion aus
   */
  async execute(
    documentPath: string,
    schemaName: string = 'invoice'
  ): Promise<PipelineResult> {
    this.pipelineId = `pipeline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.steps = [];
    this.auditTrail = [];
    this.warnings = [];

    const startTime = Date.now();
    const startedAt = new Date();

    try {
      // Step 1: Parse Document
      const document = await this.executeStep(1, 'Parser', async () => {
        return await this.parser.parse(documentPath);
      });

      // Step 2: Chunking
      const chunks = await this.executeStep(2, 'ChunkingEngine', async () => {
        return await this.chunkingEngine.chunk(document);
      });

      // Step 3: Classification
      const documentType = await this.executeStep(3, 'DocumentClassifier', async () => {
        return await this.classifier.classify(document);
      });

      // Step 4: Load Rules
      const rules = await this.executeStep(4, 'RuleLoader', async () => {
        return await this.ruleLoader.loadRules(documentType.type);
      });

      // Step 5: LLM Extraction
      const extractionResult = await this.executeStep(5, 'LLMExtractor', async () => {
        return await this.llmExtractor.extract({
          document,
          chunks,
          rules,
          schema: await this.validationService.loadSchema(schemaName),
        });
      });

      // Step 6: Hallucination Validation
      const hallucinationReport = await this.executeStep(6, 'HallucinationValidator', async () => {
        return await this.hallucinationValidator.validate(extractionResult, chunks);
      });

      // Step 7: Schema Validation
      const validationResult = await this.executeStep(7, 'ValidationService', async () => {
        const schema = await this.validationService.loadSchema(schemaName);
        return await this.validationService.validate(extractionResult, schema);
      });

      // Step 8: Quality Evaluation
      const qualityScore = await this.executeStep(8, 'QualityEvaluator', async () => {
        return await this.qualityEvaluator.evaluate(extractionResult, rules.length);
      });

      // Step 9: Save Result
      await this.executeStep(9, 'ResultRepository', async () => {
        return await this.resultRepository.saveResult(
          extractionResult,
          `${this.pipelineId}-result`
        );
      });

      // Determine overall status
      const status = this.determineStatus(hallucinationReport, validationResult);

      const result: PipelineResult = {
        pipelineId: this.pipelineId,
        document: {
          documentId: document.id,
          fileName: document.fileName,
          documentType: this.mapDocumentFormat(document.metadata.format),
          hash: document.metadata.hash,
          uploadedAt: document.metadata.uploadedAt,
        },
        extraction: extractionResult,
        quality: qualityScore,
        hallucination: hallucinationReport,
        steps: this.steps,
        status,
        totalDuration: Date.now() - startTime,
        warnings: this.warnings,
        auditTrail: this.auditTrail,
        startedAt,
        completedAt: new Date(),
      };

      this.logPipelineCompletion(result);
      return result;
    } catch (error) {
      return this.handlePipelineError(error, startTime, startedAt);
    }
  }

  /**
   * Führe einen Pipeline-Schritt aus mit Fehlerbehandlung
   */
  private async executeStep<T>(
    stepNumber: number,
    stepName: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const step: PipelineStep = {
      stepNumber,
      stepName,
      status: 'running',
      input: { type: 'auto', description: `Input for ${stepName}` },
      duration: 0,
      warnings: [],
      startedAt: new Date(),
      metrics: {},
    };

    const startTime = Date.now();

    try {
      this.auditTrail.push({
        timestamp: new Date(),
        step: stepNumber,
        type: 'started',
        message: `Starting ${stepName}`,
      });

      console.log(`[Pipeline] Step ${stepNumber}: ${stepName} started...`);

      const result = await fn();

      const duration = Date.now() - startTime;

      step.status = 'completed';
      step.output = {
        type: 'result',
        description: `${stepName} completed successfully`,
      };
      step.duration = duration;
      step.completedAt = new Date();

      this.auditTrail.push({
        timestamp: new Date(),
        step: stepNumber,
        type: 'completed',
        message: `${stepName} completed in ${duration}ms`,
        context: { duration },
      });

      console.log(`[Pipeline] Step ${stepNumber}: ${stepName} completed (${duration}ms)`);

      this.steps.push(step);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      step.status = 'failed';
      step.duration = duration;
      step.completedAt = new Date();
      step.error = {
        code: (error as any).code || 'PIPELINE_STEP_ERROR',
        message: (error as any).message || String(error),
        details: {
          stack: (error as any).stack,
        },
      };

      this.auditTrail.push({
        timestamp: new Date(),
        step: stepNumber,
        type: 'error',
        message: `${stepName} failed: ${(error as any).message}`,
        context: { error: step.error },
      });

      console.error(
        `[Pipeline] Step ${stepNumber}: ${stepName} FAILED (${duration}ms)`,
        error
      );

      this.steps.push(step);
      throw error;
    }
  }

  /**
   * Bestimme Gesamtstatus basierend auf Teilergebnissen
   */
  private determineStatus(
    hallucinationReport: HallucinationReport,
    validationResult: any
  ): 'success' | 'partial' | 'failed' {
    // Hallucinations vorhanden = partial
    if (hallucinationReport.discardedFields.length > 0) {
      return 'partial';
    }

    // Validation fehlgeschlagen = partial oder failed
    if (validationResult?.violations && validationResult.violations.length > 0) {
      return 'partial';
    }

    return 'success';
  }

  /**
   * Fehlerbehandlung auf Pipeline-Level
   */
  private handlePipelineError(
    error: unknown,
    startTime: number,
    startedAt: Date
  ): PipelineResult {
    const failedStepNumber = this.steps.length > 0 ? this.steps[this.steps.length - 1].stepNumber : 0;
    const failedStepName = this.steps.length > 0 ? this.steps[this.steps.length - 1].stepName : 'Unknown';

    const errorResult: PipelineResult = {
      pipelineId: this.pipelineId,
      document: {
        documentId: '',
        fileName: '',
        documentType: 'text',
        hash: '',
        uploadedAt: new Date(),
      },
      steps: this.steps,
      status: 'failed',
      totalDuration: Date.now() - startTime,
      error: {
        code: (error as any).code || 'PIPELINE_EXECUTION_FAILED',
        message: (error as any).message || String(error),
        failedStep: failedStepNumber,
      },
      warnings: this.warnings,
      auditTrail: this.auditTrail,
      startedAt,
      completedAt: new Date(),
    };

    this.auditTrail.push({
      timestamp: new Date(),
      step: failedStepNumber,
      type: 'error',
      message: `Pipeline failed at step ${failedStepNumber}: ${failedStepName}`,
      context: { error: errorResult.error },
    });

    console.error(`[Pipeline] FAILED after step ${failedStepNumber}: ${failedStepName}`, error);

    return errorResult;
  }

  /**
   * Formatiere Pipeline-Abschluss Logging
   */
  private logPipelineCompletion(result: PipelineResult): void {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`PIPELINE EXECUTION REPORT`);
    console.log(`Pipeline ID: ${result.pipelineId}`);
    console.log(`Status: ${result.status.toUpperCase()}`);
    console.log(`Total Duration: ${result.totalDuration}ms`);
    console.log(`Steps: ${result.steps.length}/9 completed`);
    console.log(`Warnings: ${result.warnings.length}`);
    console.log(`${'='.repeat(70)}`);

    // Step Summary
    console.log('\nSTEP SUMMARY:');
    result.steps.forEach((step) => {
      const icon = step.status === 'completed' ? '✅' : '❌';
      console.log(
        `${icon} Step ${step.stepNumber}: ${step.stepName} (${step.duration}ms) - ${step.status}`
      );
      if (step.error) {
        console.log(`   Error: ${step.error.message}`);
      }
      if (step.warnings.length > 0) {
        step.warnings.forEach((w) => console.log(`   ⚠️  ${w}`));
      }
    });

    // Quality Metrics
    if (result.quality) {
      console.log('\nQUALITY METRICS:');
      console.log(`Overall Score: ${(result.quality.overallScore * 100).toFixed(1)}%`);
    }

    // Hallucination Status
    if (result.hallucination) {
      console.log('\nHALLUCINATION CHECK:');
      console.log(
        `Trustworthiness: ${(result.hallucination.trustworthiness * 100).toFixed(1)}%`
      );
      if (result.hallucination.discardedFields.length > 0) {
        console.log(
          `Discarded Fields: ${result.hallucination.discardedFields.length}`
        );
      }
    }

    // Audit Trail Summary
    console.log('\nAUDIT TRAIL EVENTS:');
    console.log(`Total Events: ${result.auditTrail.length}`);
    const errors = result.auditTrail.filter((e) => e.type === 'error');
    if (errors.length > 0) {
      console.log(`  - Errors: ${errors.length}`);
      errors.forEach((e) => console.log(`    ${e.timestamp.toISOString()}: ${e.message}`));
    }

    console.log(`${'='.repeat(70)}\n`);
  }

  /**
   * Exportiere Audit Trail als JSON
   */
  getAuditTrailJson(): object {
    return {
      pipelineId: this.pipelineId,
      steps: this.steps,
      auditTrail: this.auditTrail,
      warnings: this.warnings,
    };
  }

  /**
   * Map DocumentFormat to DocumentType string
   */
  private mapDocumentFormat(format: string): 'pdf' | 'html' | 'image' | 'text' {
    switch (format.toLowerCase()) {
      case 'pdf':
        return 'pdf';
      case 'html':
        return 'html';
      case 'image':
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
        return 'image';
      default:
        return 'text';
    }
  }
}

export default ExtractionPipeline;
