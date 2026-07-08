/**
 * PatternInference - Domain Models für Pattern-Inferenz
 *
 * Prozess:
 * 1. Trainings-Beispiele laden (z.B. "INV-2024-001")
 * 2. Pattern analysieren (z.B. "INV-" + Zahlen)
 * 3. Generalisieren (z.B. "INV-[0-9]{4}-[0-9]{3}")
 * 4. Validieren (z.B. gegen andere Beispiele testen)
 * 5. Confidence berechnen (z.B. 92% der Beispiele passen)
 */

/**
 * Ein einzelnes Inferenz-Ergebnis
 */
export interface InferredPattern {
  /** Das Pattern selbst (z.B. "INV-[0-9]{4}-[0-9]{3}") */
  pattern: string;

  /** Wie viele Beispiele matchen dieses Pattern? */
  matchCount: number;

  /** Gesamtanzahl der Trainings-Beispiele */
  totalExamples: number;

  /** Confidence: matchCount / totalExamples */
  confidence: number;

  /** Beschreibung des Patterns (für Menschen) */
  description: string;

  /** Spezifität des Patterns (0 = zu generisch, 1 = zu spezifisch) */
  specificity: number;

  /** Hat dieses Pattern ReDoS-Probleme? */
  hasReDoSRisk: boolean;

  /** Worauf basiert dieses Pattern? (z.B. "prefix+number+suffix") */
  basedOn?: {
    prefix?: string;
    suffix?: string;
    structure?: string;
    examples?: string[];
  };
}

/**
 * Mehrere alternative Patterns
 */
export interface AlternativePatterns {
  /** Haupt-Pattern (mit höchster Confidence) */
  primary: InferredPattern;

  /** Alternative Patterns (mit niedrigerer Confidence) */
  alternatives: InferredPattern[];

  /** Insgesamt beste Lösung? */
  recommendation: 'primary' | 'alternative' | 'manual_review_needed';

  /** Warum? */
  reasoning: string;

  /** Soll Nutzer manuell überprüfen? */
  requiresManualReview: boolean;

  /** Warum braucht es Manual Review? */
  reviewReason?: string;
}

/**
 * Statistiken über die Inferenz
 */
export interface InferenceStatistics {
  /** Wie lange hat die Inferenz gedauert? */
  durationMs: number;

  /** Wie viele Muster wurden analysiert? */
  patternsAnalyzed: number;

  /** Wie viele Varianten wurden gefunden? */
  variantsFound: number;

  /** Durchschnittliche Confidence */
  averageConfidence: number;

  /** Min/Max Confidence */
  minConfidence: number;
  maxConfidence: number;

  /** Wurden Probleme gefunden? */
  issues: string[];

  /** Wurde ReDoS-Check durchgeführt? */
  redosCheckPerformed: boolean;

  /** Wurde Performance-Test durchgeführt? */
  performanceTestPerformed: boolean;
}

/**
 * Input für Pattern-Inferenz
 */
export interface InferenceRequest {
  /** Feldname (z.B. "invoiceNumber") */
  fieldName: string;

  /** Feldtyp (z.B. "string") */
  fieldType: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';

  /** Trainings-Beispiele (die zu matchenden Werte) */
  examples: string[];

  /** Source-Texte (wo die Werte in Original-Dokumenten vorkommen) */
  sourceTexts?: string[];

  /** Ist dieses Feld erforderlich? */
  isRequired?: boolean;

  /** Maximale Spezifität? (0.0-1.0) */
  maxSpecificity?: number;

  /** Constraints (z.B. minLength, maxLength) */
  constraints?: {
    minLength?: number;
    maxLength?: number;
  };
}

/**
 * Output der Pattern-Inferenz
 */
export interface InferenceResult {
  /** Request der zu dieser Inferenz geführt hat */
  request: InferenceRequest;

  /** Ergebnis: Alternative Patterns */
  patterns: AlternativePatterns;

  /** Statistiken */
  stats: InferenceStatistics;

  /** Wurde erfolgreich abgeschlossen? */
  success: boolean;

  /** Falls nicht erfolgreich: Fehler */
  error?: string;

  /** Zeitstempel */
  inferredAt: Date;
}

/**
 * Validiert InferenceRequest auf Sicherheit
 */
export function validateInferenceRequest(req: InferenceRequest): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Feldname prüfen
  if (!req.fieldName || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(req.fieldName)) {
    errors.push(`Invalid fieldName: "${req.fieldName}"`);
  }

  // Beispiele prüfen
  if (!req.examples || req.examples.length === 0) {
    errors.push('examples must not be empty');
  }

  if (req.examples && req.examples.length > 1000) {
    errors.push('Too many examples (max: 1000)');
  }

  // Jedes Beispiel prüfen
  if (req.examples) {
    for (const example of req.examples) {
      if (typeof example !== 'string') {
        errors.push(`Invalid example type: ${typeof example}`);
      }
      if (example.length > 10000) {
        errors.push(`Example too long: ${example.substring(0, 50)}...`);
      }
    }
  }

  // Source Texts prüfen
  if (req.sourceTexts) {
    for (const text of req.sourceTexts) {
      if (text.length > 100000) {
        errors.push(`Source text too long`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
