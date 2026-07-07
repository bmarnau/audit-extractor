/**
 * Validation Service Interface
 *
 * JSON Schema-basierte Validierung mit AJV.
 * Lädt Schemas aus extraction-rules/schemas/
 *
 * Kritisch: Keine erfundenen Daten!
 * - Fehlende Felder → missingFields (nicht ergänzen)
 * - Schema-Validierung nur
 * - Keine Daten-Transformation
 */

import { ExtractionResult } from '@core/models';

/**
 * Validierungs-Fehler.
 */
export interface ValidationError {
  field: string;
  message: string;
  value: unknown;
  schema?: Record<string, unknown>;
}

/**
 * Validierungs-Resultat.
 */
export interface ValidationResult {
  documentId: string;
  documentType: string;
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  missingFields: string[];
  validatedAt: Date;
}

/**
 * Schema-Information.
 */
export interface SchemaInfo {
  documentType: string;
  schemaPath: string;
  schema: Record<string, unknown>;
  requiredFields: string[];
  optionalFields: string[];
}

/**
 * IValidationService - Schema-basierte Validierung.
 */
export interface IValidationService {
  /**
   * Lädt Schema für Dokumenttyp.
   *
   * @param documentType z.B. "invoice"
   * @returns SchemaInfo oder null falls nicht vorhanden
   */
  loadSchema(documentType: string): Promise<SchemaInfo | null>;

  /**
   * Validiert ExtractionResult gegen Schema.
   *
   * @param result ExtractionResult zum Validieren
   * @param documentType z.B. "invoice"
   * @returns ValidationResult mit Errors + missingFields
   */
  validate(result: ExtractionResult, documentType: string): Promise<ValidationResult>;

  /**
   * Lädt alle verfügbaren Schemas.
   *
   * @returns Array von SchemaInfo
   */
  loadAllSchemas(): Promise<SchemaInfo[]>;

  /**
   * Gibt unterstützte Dokumenttypen zurück.
   */
  getSupportedDocumentTypes(): Promise<string[]>;
}

/**
 * Fehlerklasse.
 */
export class ValidationServiceError extends Error {
  constructor(
    message: string,
    public readonly documentType?: string,
    public readonly documentId?: string
  ) {
    super(message);
    this.name = 'ValidationServiceError';
  }
}
