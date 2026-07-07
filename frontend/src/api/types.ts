/**
 * API Contract Types
 * 
 * Definiert die Schnittstelle zwischen Frontend und Backend.
 * Diese Interfaces sollten zwischen Frontend und Backend geteilt werden.
 */

/* ========== Document APIs ========== */

export interface DocumentMetadata {
  id: string;
  filename: string;
  format: 'pdf' | 'docx' | 'html';
  size: number;
  uploadedAt: string; // ISO 8601
  status: 'pending' | 'processing' | 'completed' | 'failed';
  confidence?: number;
  pages?: number;
  error?: string;
}

export interface DocumentListResponse {
  data: DocumentMetadata[];
  total: number;
  timestamp: string;
}

export interface DocumentUploadRequest {
  file: File;
}

export interface DocumentDeleteRequest {
  id: string;
}

/* ========== Extraction Rule APIs ========== */

export interface ExtractionRuleDTO {
  id: string;
  fieldName: string;
  pattern: 'regex' | 'keyword' | 'date' | 'custom';
  expression: string;
  description: string;
  isRequired: boolean;
  confidence: number;
  version: string;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RuleListResponse {
  data: ExtractionRuleDTO[];
  total: number;
  timestamp: string;
}

export interface SaveRuleRequest {
  fieldName: string;
  pattern: 'regex' | 'keyword' | 'date' | 'custom';
  expression: string;
  description: string;
  isRequired: boolean;
  confidence: number;
  version: string;
  tags?: string[];
}

export interface TestRuleRequest {
  testInput: string;
}

export interface TestRuleResponse {
  matched: boolean;
  result: string | null;
  testCasePassed: boolean;
  duration: number; // ms
  timestamp: string;
}

export interface DuplicateRuleRequest {
  newFieldName: string;
}

/* ========== Extraction APIs ========== */

export interface ExtractionStep {
  stepNumber: number;
  stepName: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  duration: number; // ms
  timestamp: string;
  error?: string;
}

export interface ExtractionWorkflow {
  id: string;
  documentId: string;
  documentName: string;
  startedAt: string;
  completedAt?: string;
  steps: ExtractionStep[];
  overallStatus: 'pending' | 'in-progress' | 'completed' | 'failed';
}

export interface StartExtractionRequest {
  documentId: string;
  documentName: string;
  schemaId?: string;
}

export interface ExtractionResultField {
  fieldName: string;
  value: unknown;
  confidence: number;
  sourceReference: string; // chunk reference
}

export interface ExtractionResultResponse {
  id: string;
  documentId: string;
  documentName: string;
  fields: ExtractionResultField[];
  completedAt: string;
  qualityScore: number;
  warnings: string[];
}

/* ========== Changelog APIs ========== */

export interface ChangeLogEntryDTO {
  id: string;
  ruleId: string;
  action: 'created' | 'updated' | 'deleted' | 'duplicated' | 'tested';
  timestamp: string;
  description: string;
  changes?: Record<string, unknown>;
  userId?: string;
}

export interface ChangeLogResponse {
  data: ChangeLogEntryDTO[];
  total: number;
  timestamp: string;
}

/* ========== Error Response ========== */

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
  path: string;
}

/* ========== Pagination ========== */

export interface PaginationParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}
