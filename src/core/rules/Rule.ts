/**
 * Rule Model
 *
 * Definiert NICHT, wie Daten extrahiert werden, sondern WAS gesucht werden soll.
 * Regeln sind deklarativ und beschreiben nur die Struktur, nicht die Implementierung.
 *
 * Kritisch: Regeln enthalten KEINE Daten und führen NICHT zu Datengenerierung.
 */

/**
 * Unterstützte Feldtypen.
 */
export enum FieldType {
  STRING = 'string',
  NUMBER = 'number',
  DATE = 'date',
  BOOLEAN = 'boolean',
  ENUM = 'enum',
  ARRAY = 'array',
  OBJECT = 'object',
}

/**
 * Constraint-Typen für Feldvalidierung.
 */
export interface FieldConstraint {
  /** Constraint-Typ */
  type: 'minLength' | 'maxLength' | 'pattern' | 'min' | 'max' | 'enum' | 'custom';

  /** Constraint-Wert */
  value: unknown;

  /** Optionale Fehlermeldung, wenn Constraint verletzt wird */
  errorMessage?: string;
}

/**
 * Eine einzelne Extraktionsregel.
 * Beschreibt WAS gesucht werden soll, nicht WIE.
 */
export interface Rule {
  /** Eindeutige Rule-ID (z.B. "invoice-field-001") */
  id: string;

  /** Feldname (z.B. "invoiceNumber", "customerName") */
  fieldName: string;

  /** Feldtyp (string, number, date, etc.) */
  fieldType: FieldType;

  /** Beschreibung des Feldes */
  description: string;

  /** Ist das Feld erforderlich? */
  isRequired: boolean;

  /** Constraints für das Feld (Pattern, Länge, etc.) */
  constraints?: FieldConstraint[];

  /** Dokumenttypen, auf die diese Rule angewendet wird */
  documentTypes: string[];

  /** Tipps/Hinweise zur Extraktion */
  hints?: string[];

  /** Beispiele korrekter Werte (zur Veranschaulichung) */
  examples?: unknown[];

  /** Inverse Beispiele (Werte, die NICHT akzeptiert werden) */
  counterExamples?: unknown[];

  /** Schema-Version */
  schemaVersion: string;

  /** Wurde die Rule deaktiviert? */
  isActive: boolean;

  /** Zeitstempel der letzten Änderung */
  updatedAt: Date;
}

/**
 * Ein Set von Rules (z.B. für einen Dokumenttyp).
 */
export interface RuleSet {
  /** Eindeutige Rule-Set ID (z.B. "invoice-v1.0.0") */
  id: string;

  /** Name des Rule-Sets */
  name: string;

  /** Beschreibung */
  description?: string;

  /** Dokumenttypen, die dieses Rule-Set verwenden */
  documentTypes: string[];

  /** Version des Rule-Sets (SemanticVersioning) */
  version: string;

  /** Alle Rules in diesem Set */
  rules: Rule[];

  /** Wann wurde das Rule-Set erstellt? */
  createdAt: Date;

  /** Wann wurde das Rule-Set zuletzt aktualisiert? */
  updatedAt: Date;

  /** Ist das Rule-Set aktiv/in Verwendung? */
  isActive: boolean;

  /** Breaking Changes von der vorherigen Version */
  breakingChanges?: string[];

  /** Optionale Notizen */
  notes?: string;
}
