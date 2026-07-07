/**
 * DocumentClassifier Interface
 *
 * Klassifiziert Dokumente in verschiedene Typen.
 * Unterstützte Typen: Invoice, Contract, Resume, Email, Report, Unknown
 *
 * Kritisch: Keine Klassifikation darf 100% sicher sein!
 * - Unsicherheit muss dokumentiert werden
 * - Confidence Range: 0.0 - 0.99 (Max 99%)
 * - Jede Klassifikation braucht Reasoning
 */

import { Document } from '@core/models';

/**
 * Unterstützte Dokumenttypen.
 */
export enum DocumentTypeEnum {
  INVOICE = 'invoice',
  CONTRACT = 'contract',
  RESUME = 'resume',
  EMAIL = 'email',
  REPORT = 'report',
  UNKNOWN = 'unknown',
}

/**
 * Klassifikations-Resultat.
 */
export interface ClassificationResult {
  documentType: DocumentTypeEnum;
  confidence: number; // 0.0 - 0.99 (NEVER 1.0!)
  alternativeTypes?: Array<{
    type: DocumentTypeEnum;
    confidence: number;
  }>;
  reasoning: string; // Warum diese Klassifikation?
  uncertainty: string | null; // Explizite Unsicherheit dokumentieren
  indicators: {
    matched: string[]; // Z.B. ["contains 'Invoice Number'", "has line items"]
    missing: string[]; // Z.B. ["no signature field", "no date found"]
  };
  classifiedAt: Date;
}

/**
 * DocumentClassifier Service.
 */
export interface IDocumentClassifier {
  /**
   * Klassifiziert ein Document.
   *
   * @param document Source Document
   * @returns ClassificationResult mit confidence 0.0-0.99
   */
  classify(document: Document): Promise<ClassificationResult>;

  /**
   * Gibt unterstützte Typen zurück.
   */
  getSupportedTypes(): DocumentTypeEnum[];
}

/**
 * Fehlerklasse.
 */
export class ClassificationError extends Error {
  constructor(
    message: string,
    public readonly documentId?: string
  ) {
    super(message);
    this.name = 'ClassificationError';
  }
}
