/**
 * Phase 15: Schema-Driven Rule Generation
 * ExampleAnalyzer Type Definitions
 * 
 * Represents patterns and characteristics learned from JSON examples
 */

/**
 * Characteristics observed from analyzing field examples
 */
export interface FieldCharacteristics {
  fieldName: string;
  observedTypes: Set<string>;          // e.g., ['string', 'number']
  sampleValues: any[];                 // e.g., [123.45, 456.78, 789.01]
  frequency: number;                   // How often this field appeared (0-1)
  uniqueCount: number;                 // Number of unique values
  pattern?: string;                    // Regex pattern from samples (e.g., /^\d{2}-\d{5}$/)
  patternConfidence: number;           // How confident are we in the pattern (0-1)
  minLength?: number;                  // For strings
  maxLength?: number;
  minValue?: number;                   // For numbers
  maxValue?: number;
  enum?: any[];                        // Common discrete values
  isNullable: boolean;                 // Did we see nulls/undefined?
  isArray: boolean;                    // Is this typically an array?
  nestedFields?: FieldCharacteristics[]; // For nested objects
}

/**
 * Result from analyzing examples for a schema field set
 */
export interface ExampleAnalysisResult {
  exampleCount: number;                // How many examples were analyzed
  fieldCharacteristics: FieldCharacteristics[];
  dataQuality: DataQuality;
  warnings: string[];
  analyzedAt: Date;
}

/**
 * Data quality metrics for the examples
 */
export interface DataQuality {
  completenessPercentage: number;      // % of fields with values
  consistencyScore: number;            // 0-1: how consistent are field types
  patternReliability: number;          // 0-1: confidence in extracted patterns
  minExamplesForReliability: number;   // Recommended minimum examples
  isReliable: boolean;                 // Is the data good enough for rule generation?
}

/**
 * Search strategy for finding a field in extracted text
 */
export interface SearchStrategy {
  fieldName: string;
  strategies: StrategyOption[];        // Ordered by confidence
  estimatedReliability: number;        // 0-1 confidence in this strategy
}

/**
 * Individual search strategy option
 */
export interface StrategyOption {
  type: 'regex' | 'keyword' | 'proximity' | 'format';
  pattern: string;                     // The actual pattern/keyword to search for
  confidence: number;                  // 0-1
  explanation: string;                 // Why this strategy works
}
