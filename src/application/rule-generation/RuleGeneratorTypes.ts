/**
 * Phase 15: Schema-Driven Rule Generation
 * RuleGenerator Type Definitions
 * 
 * Types for generating ExtractionRules from schema + examples
 */

import { ExtractionRule } from '../../domain';

/**
 * Input to rule generation process
 */
export interface RuleGenerationInput {
  schemaId: string;
  schemaFields: any[];                  // SchemaField[]
  exampleCharacteristics: any[];        // FieldCharacteristics[]
  aggressiveness: number;               // 0.0-1.0: how strict/lenient to be
  customKeywords?: Record<string, string[]>; // fieldName -> keywords
}

/**
 * Generated rule with confidence metrics
 */
export interface GeneratedRule extends ExtractionRule {
  confidence: number;                   // 0-1: how confident in this rule
  derivedFrom: 'schema' | 'examples' | 'hybrid';
  rationale: string;                    // Why we generated this rule
}

/**
 * Result from rule generation
 */
export interface RuleGenerationResult {
  rules: GeneratedRule[];
  ruleSetId: string;
  generatedAt: Date;
  stats: GenerationStats;
  warnings: string[];
}

/**
 * Statistics about generated rules
 */
export interface GenerationStats {
  totalFieldsProcessed: number;
  rulesGenerated: number;
  averageConfidence: number;
  schemaOnlyRules: number;              // Rules from schema alone
  dataInformedRules: number;            // Rules informed by examples
  lowConfidenceRules: number;           // Rules with confidence < 0.6
}

/**
 * Aggressiveness levels
 */
export enum AggressivenessLevel {
  CONSERVATIVE = 0.3,     // Only very confident patterns
  BALANCED = 0.6,         // Mix of schema + data patterns
  AGGRESSIVE = 0.85,      // Use any reasonable pattern
}
