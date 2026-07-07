/**
 * ValidationResult Model
 *
 * Speichert Validierungsergebnisse für extrahierte Werte.
 * Checkt: Vollständigkeit, Typen, Constraints, etc.
 *
 * @example
 * const validation: ValidationResult = {
 *   isValid: false,
 *   errors: ["invoiceNumber: Pattern nicht erfüllt"],
 *   warnings: ["totalAmount: Niedriges Vertrauen"],
 *   validatedAt: new Date()
 * };
 */

/**
 * Ergebnis einer Validierung.
 */
export interface ValidationResult {
  /** Ist die Validierung erfolgreich? */
  isValid: boolean;

  /** Validierungsfehler (Breaking Issues) */
  errors: ValidationError[];

  /** Validierungswarnungen (Non-Breaking Issues) */
  warnings: ValidationWarning[];

  /** Anzahl validierter Felder */
  fieldsValidated: number;

  /** Anzahl fehlerhafter Felder */
  fieldsFailed: number;

  /** Zeitstempel der Validierung */
  validatedAt: Date;

  /** Verarbeitungszeit (Millisekunden) */
  processingTimeMs?: number;

  /** Optionale Notizen */
  notes?: string;
}

/**
 * Ein Validierungsfehler.
 */
export interface ValidationError {
  /** Betroffenes Feld */
  field: string;

  /** Fehlerkategorie (z.B. "missing", "type-mismatch", "constraint-violation") */
  category: 'missing' | 'type-mismatch' | 'constraint-violation' | 'custom' | 'other';

  /** Fehlermeldung */
  message: string;

  /** Der Wert, der validiert wurde (oder undefined, falls fehlend) */
  value?: unknown;

  /** Erwarteter Typ/Constraint */
  expected?: string;

  /** Optionale Suggestion zur Behebung */
  suggestion?: string;

  /** Schweregrad (0-1, wobei 1 = kritisch) */
  severity?: number;
}

/**
 * Eine Validierungswarnung.
 */
export interface ValidationWarning {
  /** Betroffenes Feld */
  field: string;

  /** Warnungstyp (z.B. "low-confidence", "format-deviation", "ambiguous") */
  type: 'low-confidence' | 'format-deviation' | 'ambiguous' | 'other';

  /** Warnungsmeldung */
  message: string;

  /** Der Wert, der überprüft wurde */
  value?: unknown;

  /** Optionale Suggestion */
  suggestion?: string;

  /** Schweregrad der Warnung (0-1, wobei 0.5 = mittel) */
  severity?: number;
}
