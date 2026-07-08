/**
 * ExampleMatcher - Domain Models für Beispiel-Matching
 *
 * Aufgabe:
 * - Matche Beispielwerte gegen Schema-Felder
 * - Erkenne Muster in den Beispielen
 * - Validiere dass Beispiele zum Feld passen
 */

/**
 * Ein Matching-Result
 */
export interface ExampleMatch {
  /** Feldname aus dem Schema */
  fieldName: string;

  /** Beispielwert aus den Daten */
  exampleValue: string | number | boolean | null;

  /** War das Matching erfolgreich? */
  matched: boolean;

  /** Confidence des Matchings (0-1) */
  confidence: number;

  /** Warum hat es nicht gematcht? (falls matched=false) */
  reason?: string;

  /** Zusätzliche Metadaten */
  metadata?: {
    valueType?: string;
    length?: number;
    format?: string;
  };
}

/**
 * Ergebnis beim Matching aller Beispiele
 */
export interface ExampleMatchingResult {
  /** Wie viele Felder konnten gematcht werden? */
  matchedCount: number;

  /** Gesamtanzahl der Felder im Schema */
  totalCount: number;

  /** Match-Rate (matchedCount / totalCount) */
  matchRate: number;

  /** Alle Matches */
  matches: ExampleMatch[];

  /** Welche Felder haben nicht gematcht? */
  unmatchedFields: string[];

  /** Welche Beispiel-Felder passen zu keinem Schema-Feld? */
  orphanedExamples: string[];
}

/**
 * Erkannte Muster in den Beispielen
 */
export interface DetectedPattern {
  /** Name des Musters (z.B. "letter_then_number") */
  patternName: string;

  /** Regex für dieses Muster */
  regex: string;

  /** Beispiele die dieses Muster zeigen */
  examples: string[];

  /** Wie häufig kommt dieses Muster vor? */
  frequency: number;

  /** Ist dieses Muster konsistent? */
  isConsistent: boolean;

  /** Beschreibung */
  description: string;
}

/**
 * Erkannte Varianten eines Feldes
 */
export interface FieldVariant {
  /** Feldname */
  fieldName: string;

  /** Wie viele verschiedene Varianten wurden gefunden? */
  variantCount: number;

  /** Die Varianten */
  variants: {
    pattern: string;
    examples: string[];
    frequency: number;
  }[];

  /** Gibt es ein Haupt-Pattern? */
  primaryVariant?: string;

  /** Sind die Varianten kompatibel? */
  compatible: boolean;

  /** Falls nicht kompatibel: warum? */
  incompatibilityReason?: string;
}

/**
 * Input für Example Matching
 */
export interface ExampleMatchRequest {
  /** Die Schema-Struktur */
  schema: {
    fields: {
      fieldName: string;
      fieldType: string;
      isRequired: boolean;
    }[];
  };

  /** Die Beispiel-Daten */
  examples: Record<string, unknown>;

  /** Sollen Muster erkannt werden? */
  detectPatterns?: boolean;

  /** Sollen Varianten erkannt werden? */
  detectVariants?: boolean;
}

/**
 * Output vom Example Matching
 */
export interface ExampleMatchResult {
  /** Matching-Ergebnis */
  matching: ExampleMatchingResult;

  /** Erkannte Muster */
  detectedPatterns?: DetectedPattern[];

  /** Erkannte Varianten */
  detectedVariants?: FieldVariant[];

  /** Ist alles OK zum Weiterverarbeiten? */
  readyForGeneration: boolean;

  /** Falls nicht: Warum? */
  issues?: string[];

  /** Recommendations */
  recommendations?: string[];
}

/**
 * Validiert ExampleMatchRequest
 */
export function validateExampleMatchRequest(req: ExampleMatchRequest): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Schema prüfen
  if (!req.schema || !req.schema.fields || !Array.isArray(req.schema.fields)) {
    errors.push('schema.fields must be an array');
  }

  if (req.schema.fields && req.schema.fields.length === 0) {
    errors.push('schema.fields must not be empty');
  }

  if (req.schema.fields && req.schema.fields.length > 500) {
    errors.push('Too many fields (max: 500)');
  }

  // Beispiele prüfen
  if (!req.examples || typeof req.examples !== 'object' || Array.isArray(req.examples)) {
    errors.push('examples must be a non-null object');
  }

  // Beispiel-Größe prüfen
  const exampleSize = JSON.stringify(req.examples).length;
  if (exampleSize > 10 * 1024 * 1024) { // 10MB
    errors.push('Examples too large (max: 10MB)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Berechnet die Match-Quality
 */
export function calculateMatchQuality(result: ExampleMatchingResult): {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  score: number;
} {
  const score = result.matchRate;

  if (score >= 0.95) return { quality: 'excellent', score };
  if (score >= 0.80) return { quality: 'good', score };
  if (score >= 0.60) return { quality: 'fair', score };
  return { quality: 'poor', score };
}
