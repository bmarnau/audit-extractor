/**
 * RunHistory Service Implementation
 * Phase 15e: Revision System
 * 
 * Speichert und retrieves Extraktions-Läufe
 */

import { injectable } from 'tsyringe';
import { ExtractedRun, RunHistoryFilter } from '../../domain/model/ExtractedRun';
import { IRunHistoryService } from '../../domain/comparison/IRunComparison';

@injectable()
export class RunHistoryService implements IRunHistoryService {
  private runs: Map<string, ExtractedRun> = new Map();
  private runsByDocument: Map<string, string[]> = new Map();
  private runsByRuleSet: Map<string, string[]> = new Map();

  async saveRun(run: ExtractedRun): Promise<void> {
    this.runs.set(run.runId, run);

    // Index by document
    if (!this.runsByDocument.has(run.documentId)) {
      this.runsByDocument.set(run.documentId, []);
    }
    this.runsByDocument.get(run.documentId)!.push(run.runId);

    // Index by rule set
    if (!this.runsByRuleSet.has(run.ruleSetId)) {
      this.runsByRuleSet.set(run.ruleSetId, []);
    }
    this.runsByRuleSet.get(run.ruleSetId)!.push(run.runId);
  }

  async getRun(runId: string): Promise<ExtractedRun | null> {
    return this.runs.get(runId) || null;
  }

  async listRuns(
    filter?: RunHistoryFilter,
    limit = 20,
    offset = 0,
  ): Promise<ExtractedRun[]> {
    let filtered = Array.from(this.runs.values());

    if (filter) {
      if (filter.documentId) {
        filtered = filtered.filter((r) => r.documentId === filter.documentId);
      }
      if (filter.ruleSetId) {
        filtered = filtered.filter((r) => r.ruleSetId === filter.ruleSetId);
      }
      if (filter.status) {
        filtered = filtered.filter((r) => r.status === filter.status);
      }
      if (filter.dateFrom) {
        filtered = filtered.filter((r) => r.timestamp >= filter.dateFrom!);
      }
      if (filter.dateTo) {
        filtered = filtered.filter((r) => r.timestamp <= filter.dateTo!);
      }
      if (filter.minCoverage !== undefined) {
        filtered = filtered.filter((r) => r.coverage >= filter.minCoverage!);
      }
      if (filter.maxCoverage !== undefined) {
        filtered = filtered.filter((r) => r.coverage <= filter.maxCoverage!);
      }
    }

    // Sort by timestamp descending (newest first)
    filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    return filtered.slice(offset, offset + limit);
  }

  async deleteRun(runId: string): Promise<void> {
    const run = this.runs.get(runId);
    if (run) {
      this.runs.delete(runId);

      // Clean up indices
      const docRuns = this.runsByDocument.get(run.documentId);
      if (docRuns) {
        const idx = docRuns.indexOf(runId);
        if (idx !== -1) docRuns.splice(idx, 1);
      }

      const ruleRuns = this.runsByRuleSet.get(run.ruleSetId);
      if (ruleRuns) {
        const idx = ruleRuns.indexOf(runId);
        if (idx !== -1) ruleRuns.splice(idx, 1);
      }
    }
  }

  async getRunHistory(documentId: string): Promise<ExtractedRun[]> {
    const runIds = this.runsByDocument.get(documentId) || [];
    return runIds
      .map((id) => this.runs.get(id)!)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async getRunsBetween(dateFrom: Date, dateTo: Date): Promise<ExtractedRun[]> {
    return Array.from(this.runs.values())
      .filter((r) => r.timestamp >= dateFrom && r.timestamp <= dateTo)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  async countRuns(filter?: RunHistoryFilter): Promise<number> {
    const runs = await this.listRuns(filter, 10000);
    return runs.length;
  }

  async searchRuns(query: string): Promise<ExtractedRun[]> {
    const lowerQuery = query.toLowerCase();
    return Array.from(this.runs.values())
      .filter(
        (r) =>
          r.runId.toLowerCase().includes(lowerQuery) ||
          r.documentId.toLowerCase().includes(lowerQuery) ||
          r.documentName.toLowerCase().includes(lowerQuery) ||
          r.ruleSetId.toLowerCase().includes(lowerQuery),
      )
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }
}
