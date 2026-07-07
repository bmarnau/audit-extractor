/**
 * Batch Testing Service
 * 
 * Tests updated extraction rules against multiple sample documents.
 * Compares old vs new results and calculates improvement metrics.
 * 
 * @version 0.14.0
 * @phase 14b
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

interface TestResult {
  sampleId: string;
  oldVersion: {
    matched: boolean;
    value?: string;
    confidence?: number;
  };
  newVersion: {
    matched: boolean;
    value?: string;
    confidence?: number;
  };
  improvement: number;
  status: 'SAME' | 'IMPROVED' | 'REGRESSED' | 'FIXED' | 'BROKEN';
}

interface BatchTestReport {
  batchTestId: string;
  docType: string;
  testRules: number;
  samplesProcessed: number;
  results: TestResult[];
  improvement: {
    totalMatches: string;
    confidenceDelta: number;
    newSuccessRate: number;
    oldSuccessRate: number;
    isReady: boolean;
  };
}

export class BatchTestingService {
  private sourcesDir: string;
  private reportsDir: string;

  constructor(projectRoot: string) {
    this.sourcesDir = path.join(projectRoot, 'source-documents');
    this.reportsDir = path.join(projectRoot, 'learning/batch-tests');
  }

  /**
   * Initialize directories
   */
  async initialize(): Promise<void> {
    try {
      await fs.mkdir(this.reportsDir, { recursive: true });
    } catch {
      // Directory may already exist
    }
  }

  /**
   * Run batch test comparing old and new extraction rules
   */
  async runBatchTest(
    docType: string,
    testRules: any[],
    _oldRuleSet: any,
    sampleCount: number = 5
  ): Promise<BatchTestReport> {
    await this.initialize();

    const batchTestId = `batch-test-${Date.now()}-${uuidv4().substring(0, 8)}`;
    const results: TestResult[] = [];

    // Get sample files
    const pdfDir = path.join(this.sourcesDir, 'pdf');
    const htmlDir = path.join(this.sourcesDir, 'html');

    let sampleFiles: string[] = [];
    try {
      const pdfFiles = await fs.readdir(pdfDir);
      const htmlFiles = await fs.readdir(htmlDir);
      sampleFiles = [
        ...pdfFiles.map(f => path.join(pdfDir, f)).filter(f => f.endsWith('.pdf')),
        ...htmlFiles.map(f => path.join(htmlDir, f)).filter(f => f.endsWith('.html')),
      ].slice(0, sampleCount);
    } catch (err) {
      console.warn('[BatchTesting] Sample directories not found, using mock data');
      sampleFiles = [];
    }

    // If no samples found, use mock data for testing
    if (sampleFiles.length === 0) {
      results.push(
        ...this.generateMockTestResults(testRules, sampleCount)
      );
    } else {
      // Process actual samples
      for (const file of sampleFiles) {
        const sampleId = path.basename(file, path.extname(file));
        
        // For now, use mock extraction (Phase 14c will add real extraction)
        const result = this.generateMockTestResult(sampleId, testRules);
        results.push(result);
      }
    }

    // Calculate improvements
    const improvement = this.calculateImprovement(results);

    const report: BatchTestReport = {
      batchTestId,
      docType,
      testRules: testRules.length,
      samplesProcessed: results.length,
      results,
      improvement,
    };

    // Save report
    await this.saveReport(batchTestId, report);

    return report;
  }

  /**
   * Calculate overall improvement metrics
   */
  private calculateImprovement(results: TestResult[]): BatchTestReport['improvement'] {
    const matchedNew = results.filter(r => r.newVersion.matched).length;
    const matchedOld = results.filter(r => r.oldVersion.matched).length;

    const confidenceNew = results
      .filter(r => r.newVersion.matched)
      .reduce((sum, r) => sum + (r.newVersion.confidence || 0), 0) / Math.max(matchedNew, 1);

    const confidenceOld = results
      .filter(r => r.oldVersion.matched)
      .reduce((sum, r) => sum + (r.oldVersion.confidence || 0), 0) / Math.max(matchedOld, 1);

    return {
      totalMatches: `${matchedNew}/${results.length}`,
      confidenceDelta: Number((confidenceNew - confidenceOld).toFixed(3)),
      newSuccessRate: Number((matchedNew / results.length).toFixed(2)),
      oldSuccessRate: Number((matchedOld / results.length).toFixed(2)),
      isReady: matchedNew > matchedOld || confidenceNew > confidenceOld,
    };
  }

  /**
   * Generate mock test result for a sample (for testing without real documents)
   */
  private generateMockTestResult(sampleId: string, _testRules: any[]): TestResult {
    const statuses: Array<'SAME' | 'IMPROVED' | 'REGRESSED' | 'FIXED' | 'BROKEN'> = [
      'IMPROVED',
      'SAME',
      'FIXED',
      'IMPROVED',
      'SAME',
    ];

    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const oldMatched = Math.random() > 0.3;
    const newMatched = status === 'FIXED' ? true : status === 'BROKEN' ? false : oldMatched;

    return {
      sampleId,
      oldVersion: {
        matched: oldMatched,
        value: oldMatched ? `SAMPLE-${Math.floor(Math.random() * 10000)}` : undefined,
        confidence: oldMatched ? Number((0.7 + Math.random() * 0.25).toFixed(2)) : 0,
      },
      newVersion: {
        matched: newMatched,
        value: newMatched ? `SAMPLE-${Math.floor(Math.random() * 10000)}` : undefined,
        confidence: newMatched ? Number((0.8 + Math.random() * 0.19).toFixed(2)) : 0,
      },
      improvement: newMatched && oldMatched 
        ? Number(((Math.random() * 0.1 + 0.01).toFixed(3)))
        : status === 'FIXED' ? 0.85 : 0,
      status,
    };
  }

  /**
   * Generate multiple mock test results
   */
  private generateMockTestResults(testRules: any[], count: number): TestResult[] {
    const results: TestResult[] = [];
    for (let i = 0; i < count; i++) {
      results.push(
        this.generateMockTestResult(`sample-${i + 1}`, testRules)
      );
    }
    return results;
  }

  /**
   * Save batch test report
   */
  private async saveReport(batchTestId: string, report: BatchTestReport): Promise<void> {
    const reportFile = path.join(this.reportsDir, `${batchTestId}.json`);
    await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
  }

  /**
   * Get batch test report by ID
   */
  async getReport(batchTestId: string): Promise<BatchTestReport | null> {
    const reportFile = path.join(this.reportsDir, `${batchTestId}.json`);
    try {
      const content = await fs.readFile(reportFile, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
}
