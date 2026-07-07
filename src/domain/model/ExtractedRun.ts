/**
 * ExtractedRun - Ein einzelner Extraktions-Lauf mit Metadaten
 * Phase 15e: Revision System
 */

export interface ExtractedRun {
  runId: string;
  timestamp: Date;
  ruleSetId: string;
  documentId: string;
  documentName: string;
  
  // Extraction results
  extractedFields: Map<string, any>;
  coverage: number; // 0-100%
  isValid: boolean;
  validationErrors: string[];
  warnings: string[];
  
  // Quality metrics
  averageConfidence: number;
  fieldCount: number;
  successfulFields: number;
  failedFields: string[];
  
  // Metadata
  executionTimeMs: number;
  ruleVersion: string;
  aggressiveness: number;
  customKeywords?: string[];
  
  // Status tracking
  status: 'success' | 'partial' | 'failed';
  errorMessage?: string;
  notes?: string;
}

export interface RevisionMetadata {
  runId: string;
  previousRunId?: string;
  changesSummary: string;
  fieldChanges: Map<string, FieldChange>;
  timestamp: Date;
  userId?: string;
}

export interface FieldChange {
  fieldName: string;
  previousValue?: any;
  currentValue?: any;
  changeType: 'added' | 'modified' | 'removed' | 'unchanged';
  confidenceBefore?: number;
  confidenceAfter?: number;
  impact: 'high' | 'medium' | 'low';
}

export interface RunComparison {
  run1: ExtractedRun;
  run2: ExtractedRun;
  timestamp: Date;
  
  // Overall metrics
  fieldChanges: FieldChange[];
  addedFields: string[];
  removedFields: string[];
  modifiedFields: string[];
  
  // Statistics
  totalChanges: number;
  highImpactChanges: number;
  coverageChange: number; // +5%, -2%, etc.
  confidenceChange: number;
  
  // Comparison results
  similarities: number; // 0-100%
  differences: DiffItem[];
}

export interface DiffItem {
  field: string;
  oldValue: any;
  newValue: any;
  valueType: 'field' | 'confidence' | 'validation';
  severity: 'info' | 'warning' | 'error';
  explanation: string;
}

export interface RunHistoryFilter {
  ruleSetId?: string;
  documentId?: string;
  status?: ExtractedRun['status'];
  dateFrom?: Date;
  dateTo?: Date;
  minCoverage?: number;
  maxCoverage?: number;
}

export interface RunHistoryPage {
  runs: ExtractedRun[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  hasMore: boolean;
}
