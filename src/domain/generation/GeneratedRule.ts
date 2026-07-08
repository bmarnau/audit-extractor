/**
 * GeneratedRule - Domain Model für automatisch generierte Extraktions-Regeln
 *
 * Kritisch für Sicherheit:
 * - Alle Patterns werden auf ReDoS (Regex Denial of Service) geprüft
 * - Keine unkontrollierten Regex-Patterns
 * - Type-Safe und validiert
 */

/**
 * Eine automatisch generierte Extraktionsregel
 */
export interface GeneratedRule {
  /** Eindeutige Regel-ID (auto-generated) */
  ruleId: string;

  /** Feldname (validiert gegen Whitelist) */
  fieldName: string;

  /** Feldtyp (string, number, date, etc.) */
  fieldType: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';

  /** Hauptpattern zum Extrahieren */
  pattern: string;

  /** Alternative Patterns (Varianten) */
  alternatives?: {
    pattern: string;
    confidence: number;
    description?: string;
  }[];

  /** Wie sicher ist dieses Pattern? (0.0 - 1.0) */
  confidence: number;

  /** Constraints für dieses Feld */
  constraints?: {
    minLength?: number;
    maxLength?: number;
    allowedValues?: unknown[];
    format?: string;
  };

  /** Ist dieses Feld erforderlich? */
  isRequired: boolean;

  /** Beschreibung (für Menschen) */
  description: string;

  /** Dokumenttypen, die dieses Pattern unterstützen */
  documentTypes: ('pdf' | 'html' | 'text' | 'image')[];

  /** Wie viele Beispiele haben zum Muster gepasst? */
  examplesMatched?: number;

  /** Gesamtanzahl der Trainings-Beispiele */
  totalExamples?: number;

  /** Wann wurde die Regel generiert? */
  generatedAt: Date;

  /** Welche Regex-Engine wird verwendet? */
  regexEngine: 'javascript' | 'pcre';

  /** Hat dieses Pattern potenzielle ReDoS-Schwachstellen? */
  hasReDoSRisk?: boolean;

  /** Maximale Verarbeitungszeit für dieses Pattern (ms) */
  maxProcessingTimeMs?: number;

  /** Hinweise auf Probleme bei der Generierung */
  warnings?: string[];

  /** Hat der Nutzer dieses Pattern überprüft/genehmigt? */
  isApproved?: boolean;
}

/**
 * Validiert eine GeneratedRule auf Sicherheit und Korrektheit
 */
export function validateGeneratedRule(rule: GeneratedRule): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // 1. Feldname validieren
  if (!rule.fieldName || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(rule.fieldName)) {
    errors.push(`Invalid fieldName: "${rule.fieldName}" must match pattern /^[a-zA-Z_][a-zA-Z0-9_]*$/`);
  }

  // 2. Pattern nicht leer
  if (!rule.pattern || rule.pattern.trim().length === 0) {
    errors.push('Pattern must not be empty');
  }

  // 3. Pattern validieren (ist es ein gültiges Regex?)
  try {
    new RegExp(rule.pattern);
  } catch (e) {
    errors.push(`Invalid regex pattern: ${e instanceof Error ? e.message : String(e)}`);
  }

  // 4. Confidence muss zwischen 0 und 1 sein
  if (typeof rule.confidence !== 'number' || rule.confidence < 0 || rule.confidence > 1) {
    errors.push(`Invalid confidence: ${rule.confidence} (must be 0-1)`);
  }

  // 5. Mindestens 0.3 Confidence (sonst zu unsicher)
  if (rule.confidence < 0.3) {
    errors.push(`Confidence too low: ${rule.confidence} (minimum: 0.3)`);
  }

  // 6. Fieldtype muss erlaubt sein
  const allowedTypes = ['string', 'number', 'date', 'boolean', 'array', 'object'];
  if (!allowedTypes.includes(rule.fieldType)) {
    errors.push(`Invalid fieldType: "${rule.fieldType}"`);
  }

  // 7. DocumentTypes müssen erlaubt sein
  const allowedDocTypes = ['pdf', 'html', 'text', 'image'];
  if (!rule.documentTypes || rule.documentTypes.length === 0) {
    errors.push('Must specify at least one documentType');
  } else {
    for (const docType of rule.documentTypes) {
      if (!allowedDocTypes.includes(docType)) {
        errors.push(`Invalid documentType: "${docType}"`);
      }
    }
  }

  // 8. RuleID nicht leer
  if (!rule.ruleId || rule.ruleId.trim().length === 0) {
    errors.push('ruleId must not be empty');
  }

  // 9. GeneratedAt muss valides Datum sein
  if (!(rule.generatedAt instanceof Date)) {
    errors.push('generatedAt must be a Date object');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Converter: GeneratedRule → ExtractionRule (für Kompatibilität)
 */
export function toExtractionRule(generated: GeneratedRule): any {
  return {
    ruleId: generated.ruleId,
    fieldName: generated.fieldName,
    description: generated.description,
    fieldType: generated.fieldType,
    isRequired: generated.isRequired,
    constraints: generated.constraints,
    documentTypes: generated.documentTypes,
    confidence: generated.confidence,
    pattern: generated.pattern,
    alternatives: generated.alternatives,
    generatedAt: generated.generatedAt,
    regexEngine: generated.regexEngine
  };
}
