/**
 * Configuration Manager - Phase 12
 *
 * Zentrale Konfigurationsverwaltung für:
 * - Chunking-Parameter (size, overlap)
 * - Confidence-Schwellen
 * - LLM-Einstellungen
 * - System-Limits
 * - Timeouts
 *
 * @version 0.12.0
 * @phase 12
 * @status COMPLETE
 */

export interface ChunkingConfig {
  /** Maximale Chunkgröße in Zeichen */
  maxChunkSize: number;

  /** Minimale Chunkgröße */
  minChunkSize: number;

  /** Overlap in Zeichen */
  overlap: number;

  /** Chunkingstrategie: semantic|simple|hybrid */
  strategy: 'semantic' | 'simple' | 'hybrid';
}

export interface ConfidenceConfig {
  /** Hallucination Threshold (<50%) */
  hallucinationThreshold: number;

  /** Low Confidence Warning (<70%) */
  lowConfidenceThreshold: number;

  /** Minimum Trustworthiness für Akzeptanz */
  minimumTrustworthiness: number;

  /** Source Match Percentage (80%) */
  sourceMatchPercentage: number;
}

export interface LLMConfig {
  /** Provider: openai|azure-openai */
  provider: 'openai' | 'azure-openai';

  /** API Key */
  apiKey: string;

  /** Model Name */
  model: string;

  /** Temperature (0.0-1.0) */
  temperature: number;

  /** Max Tokens */
  maxTokens: number;

  /** Request Timeout (ms) */
  requestTimeout: number;
}

export interface SystemConfig {
  /** Max Dateisize (MB) */
  maxFileSize: number;

  /** Max Documents im Cache */
  maxCacheSize: number;

  /** Parser Timeout (ms) */
  parserTimeout: number;

  /** Chunking Timeout (ms) */
  chunkingTimeout: number;

  /** Extraction Timeout (ms) */
  extractionTimeout: number;

  /** Validation Timeout (ms) */
  validationTimeout: number;
}

export interface AppConfig {
  /** App Version */
  version: string;

  /** Config Version */
  configVersion: number;

  /** Chunking Einstellungen */
  chunking: ChunkingConfig;

  /** Confidence Einstellungen */
  confidence: ConfidenceConfig;

  /** LLM Einstellungen */
  llm: LLMConfig;

  /** System Limits */
  system: SystemConfig;

  /** Zuletzt aktualisiert */
  lastUpdated: string;

  /** Updated By */
  updatedBy?: string;
}

/**
 * Default Configuration
 */
export const DEFAULT_CONFIG: AppConfig = {
  version: '0.12.0',
  configVersion: 1,
  chunking: {
    maxChunkSize: 1024,
    minChunkSize: 256,
    overlap: 256,
    strategy: 'hybrid',
  },
  confidence: {
    hallucinationThreshold: 0.5,
    lowConfidenceThreshold: 0.7,
    minimumTrustworthiness: 0.8,
    sourceMatchPercentage: 0.8,
  },
  llm: {
    provider: 'openai',
    apiKey: process.env.LLM_API_KEY || '',
    model: process.env.LLM_MODEL || 'gpt-4-turbo',
    temperature: 0.1,
    maxTokens: 2048,
    requestTimeout: 30000,
  },
  system: {
    maxFileSize: 50, // MB
    maxCacheSize: 100,
    parserTimeout: 30000,
    chunkingTimeout: 30000,
    extractionTimeout: 120000,
    validationTimeout: 30000,
  },
  lastUpdated: new Date().toISOString(),
};

/**
 * Configuration Change Record
 */
export interface ConfigChange {
  /** Change ID */
  id: string;

  /** Config Version */
  version: number;

  /** Changed Fields */
  changes: Record<string, { from: unknown; to: unknown }>;

  /** Timestamp */
  timestamp: string;

  /** Changed By */
  changedBy?: string;

  /** Reason */
  reason?: string;

  /** Previous Config (full snapshot) */
  previousConfig: AppConfig;

  /** New Config (full snapshot) */
  newConfig: AppConfig;
}
