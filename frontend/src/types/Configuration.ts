/**
 * Configuration Type Definitions
 */

export interface ChunkingConfig {
  strategy: 'semantic' | 'fixed-size' | 'hybrid';
  maxChunkSize: number;
  minChunkSize: number;
  overlapPercentage: number;
  language: string;
}

export interface ConfidenceConfig {
  minimumThreshold: number;
  scoreCalculation: 'weighted' | 'average';
  hallucinationDetection: boolean;
  sourceValidation: boolean;
}

export interface LLMConfig {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
  timeout: number;
  retries: number;
}

export interface SystemConfig {
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  enableTracing: boolean;
  enableMetrics: boolean;
  cacheResults: boolean;
  cacheTTL: number;
}

export interface AppConfig {
  version: number;
  chunking: ChunkingConfig;
  confidence: ConfidenceConfig;
  llm: LLMConfig;
  system: SystemConfig;
  lastUpdated: string;
  updatedBy?: string;
}

export interface ConfigChange {
  version: number;
  timestamp: string;
  changedBy?: string;
  reason?: string;
  previousVersion: number;
  changes: Record<string, unknown>;
}
