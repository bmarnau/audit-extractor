/**
 * RunComparison Service Interface
 * Phase 15e: Revision System
 */

import { ExtractedRun, RunComparison, FieldChange, DiffItem } from '../model/ExtractedRun';

export interface IRunComparison {
  compareRuns(run1: ExtractedRun, run2: ExtractedRun): Promise<RunComparison>;
  
  calculateDifferences(
    fields1: Map<string, any>,
    fields2: Map<string, any>,
  ): DiffItem[];
  
  calculateFieldChanges(
    run1: ExtractedRun,
    run2: ExtractedRun,
  ): FieldChange[];
  
  calculateSimilarity(run1: ExtractedRun, run2: ExtractedRun): number;
  
  identifyHighImpactChanges(changes: FieldChange[]): FieldChange[];
  
  generateChangesSummary(comparison: RunComparison): string;
}

export interface IRunHistoryService {
  saveRun(run: ExtractedRun): Promise<void>;
  
  getRun(runId: string): Promise<ExtractedRun | null>;
  
  listRuns(filter?: any, limit?: number, offset?: number): Promise<ExtractedRun[]>;
  
  deleteRun(runId: string): Promise<void>;
  
  getRunHistory(documentId: string): Promise<ExtractedRun[]>;
  
  getRunsBetween(dateFrom: Date, dateTo: Date): Promise<ExtractedRun[]>;
  
  countRuns(filter?: any): Promise<number>;
  
  searchRuns(query: string): Promise<ExtractedRun[]>;
}

export interface IRevisionService {
  getRevisions(runId: string): Promise<any[]>;
  
  trackRevision(run: ExtractedRun, previousRun?: ExtractedRun): Promise<void>;
  
  getRevisionHistory(documentId: string): Promise<any[]>;
  
  revertToRun(runId: string): Promise<ExtractedRun>;
}
