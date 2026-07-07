/**
 * Feedback & Learning Service
 * 
 * Collects user feedback on extraction results.
 * Tracks corrections and improves patterns based on feedback.
 * 
 * @version 0.14.0
 * @phase 14c
 */

import * as fs from 'fs/promises';
import * as path from 'path';

export interface ExtractionFeedback {
  resultId: string;
  docType: string;
  fieldFeedback: Array<{
    field: string;
    originalValue: string;
    correctedValue: string;
    issue: 'WRONG_VALUE' | 'MISSING' | 'FALSE_POSITIVE' | 'LOW_CONFIDENCE';
    severity: 'critical' | 'high' | 'medium' | 'low';
    notes?: string;
  }>;
  feedbackAt: string;
  userEmail?: string;
}

export interface ExtractionSuggestion {
  field: string;
  currentPattern: string;
  suggestedPattern: string;
  reason: string;
  confidence: number;
  exampleCorrections: number;
  estimatedImprovement: number;
}

export class FeedbackService {
  private feedbackDir: string;
  private suggestionsDir: string;

  constructor(projectRoot: string) {
    this.feedbackDir = path.join(projectRoot, 'learning/feedback');
    this.suggestionsDir = path.join(projectRoot, 'learning/suggestions');
  }

  /**
   * Initialize feedback system
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.feedbackDir, { recursive: true });
      await fs.mkdir(this.suggestionsDir, { recursive: true });
    } catch (err) {
      console.error('[FeedbackService] Init error:', err);
    }
  }

  /**
   * Save user feedback on extraction result
   */
  async recordFeedback(feedback: ExtractionFeedback): Promise<string> {
    await this.initialize();

    const feedbackFile = path.join(this.feedbackDir, `${feedback.resultId}-feedback.json`);
    await fs.writeFile(feedbackFile, JSON.stringify(feedback, null, 2));

    return feedbackFile;
  }

  /**
   * Generate suggestions for pattern improvements
   */
  async generateSuggestions(
    _docType: string,
    fieldCorrections: Array<{ field: string; original: string; corrected: string }>
  ): Promise<ExtractionSuggestion[]> {
    const suggestions: ExtractionSuggestion[] = [];

    // Group corrections by field
    const fieldMap = new Map<string, Array<{ original: string; corrected: string }>>();
    
    for (const correction of fieldCorrections) {
      if (!fieldMap.has(correction.field)) {
        fieldMap.set(correction.field, []);
      }
      fieldMap.get(correction.field)!.push({
        original: correction.original,
        corrected: correction.corrected,
      });
    }

    // Generate suggestions per field
    for (const [field, corrections] of fieldMap) {
      const suggestion = this.suggestPatternImprovement(field, corrections);
      if (suggestion) {
        suggestions.push(suggestion);
      }
    }

    return suggestions;
  }

  /**
   * Suggest pattern improvement for a field based on corrections
   */
  private suggestPatternImprovement(
    field: string,
    corrections: Array<{ original: string; corrected: string }>
  ): ExtractionSuggestion | null {
    if (corrections.length === 0) return null;

    // Analysis: Find common patterns in corrected values
    const correctedValues = corrections.map(c => c.corrected);
    
    // Simple pattern detection
    let suggestedPattern = '';
    let reason = '';
    let confidence = 0.7;
    let estimatedImprovement = 0.15;

    // Example: If all corrections contain numbers
    if (correctedValues.every(v => /\d/.test(v))) {
      // Could suggest a pattern with digit capture
      suggestedPattern = `(${this.extractCommonPattern(correctedValues)})`;
      reason = `Detected number patterns in ${corrections.length} corrections`;
      confidence = Math.min(0.9, 0.6 + corrections.length * 0.05);
      estimatedImprovement = Math.min(0.4, 0.15 + corrections.length * 0.05);
    } else {
      // Generic suggestion
      suggestedPattern = `(${correctedValues[0]})`;
      reason = `Based on ${corrections.length} user corrections`;
    }

    return {
      field,
      currentPattern: 'TBD',
      suggestedPattern,
      reason,
      confidence,
      exampleCorrections: corrections.length,
      estimatedImprovement,
    };
  }

  /**
   * Extract common pattern from values
   */
  private extractCommonPattern(values: string[]): string {
    if (values.length === 0) return '.*';
    
    // For now, return generic pattern
    // In production, this would use more sophisticated pattern analysis
    const firstValue = values[0];
    
    if (/^\d{6}$/.test(firstValue)) return '[0-9]{6}';
    if (/^\d{2}\.\d{2}\.\d{4}$/.test(firstValue)) return '\\d{2}\\.\\d{2}\\.\\d{4}';
    if (/^[A-Z][A-Z0-9-]+$/.test(firstValue)) return '[A-Z][A-Z0-9-]+';
    
    return '.*';
  }

  /**
   * Get all feedback for a docType
   */
  async getFeedbackSummary(docType: string): Promise<any> {
    await this.initialize();

    const feedbackFiles = await fs.readdir(this.feedbackDir);
    const feedbacks: ExtractionFeedback[] = [];

    for (const file of feedbackFiles) {
      try {
        const content = await fs.readFile(path.join(this.feedbackDir, file), 'utf-8');
        const feedback = JSON.parse(content);
        if (feedback.docType === docType) {
          feedbacks.push(feedback);
        }
      } catch (err) {
        // Skip invalid files
      }
    }

    // Aggregate statistics
    const fieldStats = new Map<string, { corrections: number; severity: string[] }>();

    for (const feedback of feedbacks) {
      for (const field of feedback.fieldFeedback) {
        if (!fieldStats.has(field.field)) {
          fieldStats.set(field.field, { corrections: 0, severity: [] });
        }
        const stat = fieldStats.get(field.field)!;
        stat.corrections++;
        stat.severity.push(field.severity);
      }
    }

    return {
      docType,
      totalFeedbacks: feedbacks.length,
      fieldStats: Object.fromEntries(fieldStats),
      topIssues: this.getTopIssues(feedbacks),
    };
  }

  /**
   * Get top issues from feedback
   */
  private getTopIssues(feedbacks: ExtractionFeedback[]): any[] {
    const issueMap = new Map<string, number>();

    for (const feedback of feedbacks) {
      for (const field of feedback.fieldFeedback) {
        const key = `${field.field}:${field.issue}`;
        issueMap.set(key, (issueMap.get(key) || 0) + 1);
      }
    }

    return Array.from(issueMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([key, count]) => ({ issue: key, occurrences: count }));
  }

  /**
   * Save suggestions to file
   */
  async saveSuggestions(
    docType: string,
    suggestions: ExtractionSuggestion[]
  ): Promise<string> {
    await this.initialize();

    const suggestionsFile = path.join(this.suggestionsDir, `${docType}-suggestions.json`);
    const data = {
      docType,
      generatedAt: new Date().toISOString(),
      suggestions,
    };

    await fs.writeFile(suggestionsFile, JSON.stringify(data, null, 2));

    return suggestionsFile;
  }
}
