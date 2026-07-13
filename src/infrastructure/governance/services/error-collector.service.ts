/**
 * ErrorCollectorService - Sammelt Fehler aus allen Testläufen
 * Kategorisiert und analysiert Test-Fehler
 */

import { TestFailure } from '../types/governance-report.types';

interface RawTestResult {
  testName: string;
  testFile: string;
  error?: Error | string;
  duration: number;
  category: 'unit' | 'integration' | 'e2e';
}

export class ErrorCollectorService {
  private failures: TestFailure[] = [];

  /**
   * Sammelt Fehler aus Jest Testergebnissen
   */
  public collectFromJestResults(results: any): TestFailure[] {
    const collected: TestFailure[] = [];

    if (!results.testResults) {
      return collected;
    }

    results.testResults.forEach((suite: any) => {
      suite.assertionResults?.forEach((result: any) => {
        if (result.status === 'failed') {
          collected.push({
            testName: result.title,
            testFile: suite.name,
            error: result.failureMessages?.[0] || 'Unknown error',
            stack: result.failureMessages?.[1],
            timestamp: new Date().toISOString(),
            duration: result.duration || 0,
            category: this.inferCategory(suite.name),
          });
        }
      });
    });

    this.failures = [...this.failures, ...collected];
    return collected;
  }

  /**
   * Sammelt Fehler aus Playwright Test Reports
   */
  public collectFromPlaywrightResults(results: any): TestFailure[] {
    const collected: TestFailure[] = [];

    results.suites?.forEach((suite: any) => {
      suite.tests?.forEach((test: any) => {
        if (test.status === 'failed') {
          collected.push({
            testName: test.title,
            testFile: suite.title,
            error: test.error?.message || 'E2E test failed',
            stack: test.error?.stack,
            timestamp: new Date().toISOString(),
            duration: test.duration || 0,
            category: 'e2e',
          });
        }
      });
    });

    this.failures = [...this.failures, ...collected];
    return collected;
  }

  /**
   * Fügt manuell gesammelte Fehler hinzu (z.B. von Linting/Coverage)
   */
  public addManualFailure(failure: Omit<TestFailure, 'timestamp'>): void {
    this.failures.push({
      ...failure,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Gruppiert Fehler nach Kategorie
   */
  public groupByCategory(): Record<string, TestFailure[]> {
    return {
      unit: this.failures.filter(f => f.category === 'unit'),
      integration: this.failures.filter(f => f.category === 'integration'),
      e2e: this.failures.filter(f => f.category === 'e2e'),
    };
  }

  /**
   * Gruppiert Fehler nach Modul/Datei
   */
  public groupByModule(): Record<string, TestFailure[]> {
    const grouped: Record<string, TestFailure[]> = {};

    this.failures.forEach(failure => {
      const module = this.extractModuleName(failure.testFile);
      if (!grouped[module]) {
        grouped[module] = [];
      }
      grouped[module].push(failure);
    });

    return grouped;
  }

  /**
   * Erkennt häufige Fehlermuster
   */
  public analyzeCommonPatterns(): string[] {
    const patterns: Record<string, number> = {};

    this.failures.forEach(failure => {
      const pattern = this.extractPattern(failure.error);
      patterns[pattern] = (patterns[pattern] || 0) + 1;
    });

    // Rückgabe von Mustern, die mehrmals vorkommen
    return Object.entries(patterns)
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .map(([pattern]) => pattern);
  }

  /**
   * Bestimmt Root Causes für Fehler
   */
  public analyzeRootCauses(): Record<string, string> {
    const causes: Record<string, string> = {};

    this.failures.forEach(failure => {
      const rootCause = this.identifyRootCause(failure.error);
      if (rootCause) {
        causes[failure.testName] = rootCause;
      }
    });

    return causes;
  }

  /**
   * Gibt alle gesammelten Fehler zurück
   */
  public getAllFailures(): TestFailure[] {
    return [...this.failures];
  }

  /**
   * Gibt Fehlerstatistiken zurück
   */
  public getStatistics() {
    return {
      total: this.failures.length,
      byCategory: this.groupByCategory(),
      byModule: this.groupByModule(),
      patterns: this.analyzeCommonPatterns(),
      averageDuration: this.failures.reduce((sum, f) => sum + f.duration, 0) / this.failures.length,
    };
  }

  /**
   * Setzt den Fehler-Collector zurück
   */
  public reset(): void {
    this.failures = [];
  }

  // ============= Private Hilfsmethoden =============

  private inferCategory(filePath: string): 'unit' | 'integration' | 'e2e' {
    if (filePath.includes('__tests__') || filePath.includes('.test.')) {
      if (filePath.includes('integration')) return 'integration';
      if (filePath.includes('e2e') || filePath.includes('playwright')) return 'e2e';
      return 'unit';
    }
    if (filePath.includes('integration')) return 'integration';
    if (filePath.includes('e2e')) return 'e2e';
    return 'unit';
  }

  private extractModuleName(filePath: string): string {
    const parts = filePath.split(/[\\/]/);
    // Sucht nach 'src' und gibt den nächsten Namen zurück
    const srcIndex = parts.findIndex(p => p === 'src');
    if (srcIndex !== -1 && srcIndex + 1 < parts.length) {
      return parts[srcIndex + 1];
    }
    return parts[parts.length - 1];
  }

  private extractPattern(error: string): string {
    if (!error) return 'UNKNOWN_ERROR';

    // Gängige Fehlermuster
    if (error.includes('undefined')) return 'UNDEFINED_REFERENCE';
    if (error.includes('TypeError')) return 'TYPE_ERROR';
    if (error.includes('timeout')) return 'TIMEOUT';
    if (error.includes('not found')) return 'NOT_FOUND';
    if (error.includes('connection')) return 'CONNECTION_ERROR';
    if (error.includes('assertion')) return 'ASSERTION_FAILED';
    if (error.includes('mock')) return 'MOCK_FAILURE';
    if (error.includes('async')) return 'ASYNC_ERROR';

    // Fallback: Erste Zeile des Fehlers
    return error.split('\n')[0].substring(0, 50);
  }

  private identifyRootCause(error: string): string {
    if (!error) return '';

    if (error.includes('Cannot read property')) {
      return 'Null/undefined reference - check object initialization';
    }
    if (error.includes('timeout')) {
      return 'Test timeout - async operation too slow or not completing';
    }
    if (error.includes('not found')) {
      return 'Resource/component not found - check fixture or DOM setup';
    }
    if (error.includes('connection') || error.includes('ECONNREFUSED')) {
      return 'Service connection failed - check server health or mocks';
    }
    if (error.includes('mock')) {
      return 'Mock setup incorrect - verify mock function signatures';
    }
    if (error.includes('assertion')) {
      return 'Expected value does not match - check test logic or implementation';
    }

    return 'Check stack trace for detailed error information';
  }
}
