/**
 * API DTO Types - Backend Domain Models
 * 
 * Diese sollten mit den Frontend API Types synchronisiert werden.
 */

/* Document */
export interface DocumentMetadata {
  id: string;
  filename: string;
  format: 'pdf' | 'docx' | 'html';
  size: number;
  uploadedAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  confidence?: number;
  pages?: number;
  error?: string;
}

/* Extraction Rule */
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

export interface TestRuleResponse {
  matched: boolean;
  result: string | null;
  testCasePassed: boolean;
  duration: number;
  timestamp: string;
}

/* List Responses */
export interface DocumentListResponse {
  data: DocumentMetadata[];
  total: number;
  timestamp: string;
}

export interface RuleListResponse {
  data: ExtractionRuleDTO[];
  total: number;
  timestamp: string;
}

/* Extraction */
export interface ExtractionStep {
  stepNumber: number;
  stepName: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  duration: number;
  timestamp: string;
  error?: string;
}

export interface ExtractionWorkflow {
  id: string;
  documentId: string;
  documentName: string;
  startedAt: string;
  completedAt: string;
  steps: ExtractionStep[];
  overallStatus: 'pending' | 'in-progress' | 'completed' | 'failed';
}

export interface ExtractionResultField {
  fieldName: string;
  value: unknown;
  confidence: number;
  sourceReference: string;
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

/* Changelog */
export interface ChangeLogEntryDTO {
  id: string;
  ruleId: string;
  action: 'created' | 'updated' | 'deleted' | 'duplicated' | 'tested';
  timestamp: string;
  description: string;
  changes?: Record<string, unknown>;
  userId?: string;
}
