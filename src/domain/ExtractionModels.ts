/**
 * DocumentReference - Verweist auf ein Quell-Dokument
 */
export interface DocumentReference {
  documentId: string;
  fileName: string;
  documentType: 'pdf' | 'html' | 'image' | 'text';
  hash: string; // SHA256 des Original-Dokuments
  uploadedAt: Date;
}

/**
 * SourceLocation - Exakte Verweisstelle für einen extrahierten Wert
 */
export interface SourceLocation {
  documentReference: DocumentReference;
  pageNumber?: number;
  sectionId?: string;
  lineStart?: number;
  lineEnd?: number;
  offsetStart?: number;
  offsetEnd?: number;
  textSnippet?: string;
}

/**
 * ExtractedField - Ein einfach extrahiertes Feld (für Phase 15 Schema-Driven)
 */
export interface ExtractedField {
  fieldName: string;
  value: any;
  confidence: number;
}

/**
 * ExtractedValue - Ein extrahierter Wert mit Provenance Tracking
 */
export interface ExtractedValue<T> {
  value: T | null;
  confidence: number; // 0-1, wie sicher sind wir
  sources: SourceLocation[]; // Woher kommt dieser Wert
  uncertainty?: string; // Warum ist die Confidence niedrig
  extractedAt: Date;
}

/**
 * ExtractionWarning - Warnung bei der Extraktion
 */
export interface ExtractionWarning {
  field: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  suggestion?: string;
}

/**
 * ExtractionResult - Komplettes Extraktionsergebnis
 */
export interface ExtractionResult {
  resultId: string;
  documentReference: DocumentReference;
  extractedFields: Map<string, ExtractedValue<any>>;
  missingFields: string[];
  warnings: ExtractionWarning[];
  extractedAt: Date;
  version: string;
  ruleSetVersion: string;
}
