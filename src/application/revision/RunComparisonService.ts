/**
 * RunComparison Service Implementation
 * Phase 15e: Revision System
 * 
 * Vergleicht Extraktions-Läufe punkt-für-punkt
 */

import { injectable } from 'tsyringe';
import {
  ExtractedRun,
  RunComparison,
  FieldChange,
  DiffItem,
} from '../../domain/model/ExtractedRun';
import { IRunComparison } from '../../domain/comparison/IRunComparison';

@injectable()
export class RunComparisonService implements IRunComparison {
  async compareRuns(run1: ExtractedRun, run2: ExtractedRun): Promise<RunComparison> {
    const fieldChanges = this.calculateFieldChanges(run1, run2);
    const differences = this.calculateDifferences(run1.extractedFields, run2.extractedFields);
    const similarity = this.calculateSimilarity(run1, run2);

    const addedFields = fieldChanges
      .filter((c) => c.changeType === 'added')
      .map((c) => c.fieldName);
    const removedFields = fieldChanges
      .filter((c) => c.changeType === 'removed')
      .map((c) => c.fieldName);
    const modifiedFields = fieldChanges
      .filter((c) => c.changeType === 'modified')
      .map((c) => c.fieldName);
    const highImpactChanges = this.identifyHighImpactChanges(fieldChanges);

    return {
      run1,
      run2,
      timestamp: new Date(),
      fieldChanges,
      addedFields,
      removedFields,
      modifiedFields,
      totalChanges: fieldChanges.length,
      highImpactChanges: highImpactChanges.length,
      coverageChange: run2.coverage - run1.coverage,
      confidenceChange: run2.averageConfidence - run1.averageConfidence,
      similarities: similarity,
      differences,
    };
  }

  calculateDifferences(
    fields1: Map<string, any>,
    fields2: Map<string, any>,
  ): DiffItem[] {
    const diffs: DiffItem[] = [];

    // Check modified + added fields
    for (const [field, value2] of fields2) {
      const value1 = fields1.get(field);
      
      if (value1 === undefined) {
        diffs.push({
          field,
          oldValue: undefined,
          newValue: value2,
          valueType: 'field',
          severity: 'info',
          explanation: `Field added: ${field}`,
        });
      } else if (JSON.stringify(value1) !== JSON.stringify(value2)) {
        diffs.push({
          field,
          oldValue: value1,
          newValue: value2,
          valueType: 'field',
          severity: 'warning',
          explanation: `Field modified: ${field}`,
        });
      }
    }

    // Check removed fields
    for (const [field, value1] of fields1) {
      if (!fields2.has(field)) {
        diffs.push({
          field,
          oldValue: value1,
          newValue: undefined,
          valueType: 'field',
          severity: 'error',
          explanation: `Field removed: ${field}`,
        });
      }
    }

    return diffs;
  }

  calculateFieldChanges(run1: ExtractedRun, run2: ExtractedRun): FieldChange[] {
    const changes: FieldChange[] = [];

    // All fields from both runs
    const allFields = new Set([
      ...run1.extractedFields.keys(),
      ...run2.extractedFields.keys(),
    ]);

    for (const field of allFields) {
      const value1 = run1.extractedFields.get(field);
      const value2 = run2.extractedFields.get(field);
      const confidence1 = run1.averageConfidence; // Simplified
      const confidence2 = run2.averageConfidence;

      let changeType: FieldChange['changeType'] = 'unchanged';
      let impact: FieldChange['impact'] = 'low';

      if (value1 === undefined && value2 !== undefined) {
        changeType = 'added';
        impact = 'medium';
      } else if (value1 !== undefined && value2 === undefined) {
        changeType = 'removed';
        impact = 'high';
      } else if (value1 !== undefined && value2 !== undefined) {
        if (JSON.stringify(value1) !== JSON.stringify(value2)) {
          changeType = 'modified';
          impact = confidence2 > confidence1 ? 'medium' : 'high';
        }
      }

      if (changeType !== 'unchanged') {
        changes.push({
          fieldName: field,
          previousValue: value1,
          currentValue: value2,
          changeType,
          confidenceBefore: confidence1,
          confidenceAfter: confidence2,
          impact,
        });
      }
    }

    return changes;
  }

  calculateSimilarity(run1: ExtractedRun, run2: ExtractedRun): number {
    if (run1.extractedFields.size === 0 && run2.extractedFields.size === 0) {
      return 100;
    }

    let matchingFields = 0;
    for (const [field, value1] of run1.extractedFields) {
      const value2 = run2.extractedFields.get(field);
      if (value2 !== undefined && JSON.stringify(value1) === JSON.stringify(value2)) {
        matchingFields++;
      }
    }

    const totalFields = Math.max(run1.extractedFields.size, run2.extractedFields.size);
    return totalFields > 0 ? Math.round((matchingFields / totalFields) * 100) : 100;
  }

  identifyHighImpactChanges(changes: FieldChange[]): FieldChange[] {
    return changes.filter((c) => c.impact === 'high');
  }

  generateChangesSummary(comparison: RunComparison): string {
    const parts: string[] = [];

    if (comparison.addedFields.length > 0) {
      parts.push(`Added: ${comparison.addedFields.join(', ')}`);
    }
    if (comparison.removedFields.length > 0) {
      parts.push(`Removed: ${comparison.removedFields.join(', ')}`);
    }
    if (comparison.modifiedFields.length > 0) {
      parts.push(`Modified: ${comparison.modifiedFields.join(', ')}`);
    }

    parts.push(`Coverage: ${comparison.run1.coverage}% → ${comparison.run2.coverage}%`);
    parts.push(`Similarity: ${comparison.similarities}%`);

    return parts.join(' | ');
  }
}
