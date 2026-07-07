/**
 * Schema Model
 *
 * Definiert die Struktur eines Dokumenttyps.
 * Ein Schema ist eine Sammlung von Rules mit zusätzlichen Metadaten.
 *
 * Kritisch: Schemas sind Vorlagen - enthalten KEINE Daten!
 */

import { Rule } from './Rule';

/**
 * Feldgruppe im Schema (zur logischen Organisierung).
 */
export interface FieldGroup {
  /** Gruppen-ID (z.B. "header", "items", "totals") */
  id: string;

  /** Gruppen-Name */
  name: string;

  /** Beschreibung */
  description?: string;

  /** Felder in dieser Gruppe */
  fieldIds: string[];

  /** Ist diese Gruppe erforderlich? */
  isRequired: boolean;

  /** Können mehrere Instanzen dieser Gruppe existieren? */
  isArray: boolean;

  /** Reihenfolge (für UI/Rendering) */
  order?: number;
}

/**
 * Ein Schema definiert die Struktur eines Dokumenttyps.
 * Schema beschreibt die "Form" des Dokuments, nicht die "Daten".
 */
export interface Schema {
  /** Eindeutige Schema-ID (z.B. "invoice-schema-v1") */
  id: string;

  /** Name des Schemas */
  name: string;

  /** Dokumenttyp, den dieses Schema beschreibt */
  documentType: string;

  /** Beschreibung des Schemas */
  description?: string;

  /** Version des Schemas (SemanticVersioning) */
  version: string;

  /** Alle Felder im Schema */
  fields: Rule[];

  /** Logische Feldgruppen (optional, zur Organisierung) */
  fieldGroups?: FieldGroup[];

  /** Abhängigkeiten zwischen Feldern */
  fieldDependencies?: {
    /** Wenn Feld A existiert, muss auch Feld B existieren */
    field: string;
    dependsOn?: string[];
    excludes?: string[];
  }[];

  /** Regex-Patterns für häufige Werte (als Hinweise, nicht Vorschrift!) */
  commonPatterns?: {
    pattern: string;
    name: string;
    examples: string[];
  }[];

  /** Wann wurde das Schema erstellt? */
  createdAt: Date;

  /** Wann wurde das Schema zuletzt aktualisiert? */
  updatedAt: Date;

  /** Ist das Schema aktiv? */
  isActive: boolean;

  /** Optionale Notizen */
  notes?: string;
}
