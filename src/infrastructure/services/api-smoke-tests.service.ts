/**
 * ApiSmokeTestsService
 * Führt Smoke Tests für alle Endpoints durch
 * Prüft HTTP Statuscodes, Response Format und Error Handling
 */

import * as fs from 'fs';
import * as path from 'path';
import { ApiEndpoint, ApiInventory } from './api-endpoint-discovery.service';

export interface SmokeTestResult {
  endpoint: ApiEndpoint;
  status: 'PASS' | 'FAIL' | 'WARNING' | 'SKIP';
  statusCode?: number;
  expectedStatus: number;
  responseTime: number;
  error?: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface SmokeTestReport {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  warnings: number;
  skipped: number;
  duration: number;
  results: SmokeTestResult[];
  summary: {
    successRate: number;
    failuresByEndpoint: Record<string, string[]>;
    slowEndpoints: Array<{ route: string; time: number }>;
    errorDetails: Record<string, any>;
  };
}

export class ApiSmokeTestsService {
  private baseUrl: string;
  private results: SmokeTestResult[] = [];
  private timeout: number = 5000;
  private startTime: number = 0;

  // Endpoints die übersprungen werden (z.B. die DELETE ohne ID)
  // private skipPatterns = [
  //   /DELETE.*\/:w+\//,  // DELETE mit ID erforderlich
  //   /PUT.*\/:w+\//,     // PUT mit ID erforderlich
  //   /PATCH.*\/:w+\//,   // PATCH mit ID erforderlich
  // ];

  constructor(baseUrl: string = 'http://localhost:3000', timeout: number = 5000) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Führt Smoke Tests durch
   */
  async runTests(inventory: ApiInventory): Promise<SmokeTestReport> {
    this.results = [];
    this.startTime = Date.now();

    console.log('🧪 Starte API Smoke Tests...');
    console.log(`📊 Teste ${inventory.totalEndpoints} Endpoints\n`);

    for (const endpoint of inventory.endpoints) {
      if (this.shouldSkip(endpoint)) {
        this.results.push(this.createSkipResult(endpoint));
        console.log(`↩️  ${endpoint.method} ${endpoint.route} (skipped)`);
        continue;
      }

      try {
        const result = await this.testEndpoint(endpoint);
        this.results.push(result);

        const icon =
          result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️';
        console.log(
          `${icon} ${endpoint.method} ${endpoint.route} - ${result.statusCode} (${result.responseTime}ms)`
        );
      } catch (error) {
        const result: SmokeTestResult = {
          endpoint,
          status: 'FAIL',
          expectedStatus: this.getExpectedStatus(endpoint),
          responseTime: 0,
          error: error instanceof Error ? error.message : String(error),
          details: {},
          timestamp: new Date().toISOString(),
        };
        this.results.push(result);
        console.log(`❌ ${endpoint.method} ${endpoint.route} - ${result.error}`);
      }
    }

    return this.generateReport();
  }

  /**
   * Testet einzelnen Endpoint
   */
  private async testEndpoint(endpoint: ApiEndpoint): Promise<SmokeTestResult> {
    const startTime = Date.now();
    const expectedStatus = this.getExpectedStatus(endpoint);

    try {
      const response = await this.makeRequest(endpoint);
      const responseTime = Date.now() - startTime;
      const isSuccess = response.status === expectedStatus;

      return {
        endpoint,
        status: isSuccess ? 'PASS' : 'FAIL',
        statusCode: response.status,
        expectedStatus,
        responseTime,
        details: {
          contentType: response.headers['content-type'],
          contentLength: response.headers['content-length'],
          responseSize: JSON.stringify(response.data).length,
          hasData: !!response.data?.data,
          hasTimestamp: !!response.data?.timestamp,
          hasDuration: !!response.data?.duration,
        },
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      return {
        endpoint,
        status: 'FAIL',
        expectedStatus,
        responseTime,
        error: error instanceof Error ? error.message : String(error),
        details: { error: error instanceof Error ? error.stack : String(error) },
        timestamp: new Date().toISOString(),
      };
    }
  }

  /**
   * Macht HTTP Request
   */
  private async makeRequest(
    endpoint: ApiEndpoint
  ): Promise<{ status: number; data: any; headers: Record<string, string> }> {
    const url = `${this.baseUrl}${endpoint.route}`;

    // Nutze fetch (Node.js 18+)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const options: RequestInit = {
        method: endpoint.method,
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        signal: controller.signal,
      };

      // Für POST/PUT/PATCH: sende minimale Test-Daten
      if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
        options.body = JSON.stringify(this.getTestPayload(endpoint));
      }

      const response = await fetch(url, options);
      const data = await response.json().catch(() => ({}));

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return {
        status: response.status,
        data,
        headers,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Gibt Test Payload zurück
   */
  private getTestPayload(endpoint: ApiEndpoint): Record<string, any> {
    // Minimal test payloads basierend auf Endpoint
    const payloads: Record<string, Record<string, any>> = {
      '/api/config': { theme: 'light', language: 'en' },
      '/api/audit': { documentId: 'test-doc-123' },
      '/api/help': { query: 'test' },
      '/api/backup': { name: 'test-backup' },
      '/api/extract': { documentContent: 'test content', ruleSet: {} },
      '/api/jobs': { documentContent: 'test', ruleSet: {} },
      '/api/jobs/structure': { schema: {} },
      '/api/revision': { documentId: 'test', changes: [] },
      '/api/schema': { name: 'test-schema' },
    };

    // Finde passenden Payload
    for (const [path, payload] of Object.entries(payloads)) {
      if (endpoint.route.startsWith(path)) {
        return payload;
      }
    }

    return { test: true };
  }

  /**
   * Bestimmt erwarteten Status Code
   */
  private getExpectedStatus(endpoint: ApiEndpoint): number {
    switch (endpoint.method) {
      case 'POST':
        return 201; // Created
      case 'GET':
        return 200; // OK
      case 'PUT':
      case 'PATCH':
        return 200; // OK
      case 'DELETE':
        return 204; // No Content
      default:
        return 200;
    }
  }

  /**
   * Prüft ob Endpoint übersprungen werden soll
   */
  private shouldSkip(endpoint: ApiEndpoint): boolean {
    // Überspringe Endpoints mit erforderlichen ID Parametern
    return endpoint.route.includes(':');
  }

  /**
   * Erstellt Skip Result
   */
  private createSkipResult(endpoint: ApiEndpoint): SmokeTestResult {
    return {
      endpoint,
      status: 'SKIP',
      expectedStatus: this.getExpectedStatus(endpoint),
      responseTime: 0,
      details: { reason: 'Endpoint requires path parameters' },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generiert Test Report
   */
  private generateReport(): SmokeTestReport {
    const passed = this.results.filter((r) => r.status === 'PASS').length;
    const failed = this.results.filter((r) => r.status === 'FAIL').length;
    const warnings = this.results.filter((r) => r.status === 'WARNING').length;
    const skipped = this.results.filter((r) => r.status === 'SKIP').length;
    const duration = Date.now() - this.startTime;

    const successRate =
      this.results.length > 0
        ? ((passed / (passed + failed + warnings)) * 100).toFixed(2)
        : '0.00';

    // Sammle Fehler
    const failuresByEndpoint: Record<string, string[]> = {};
    for (const result of this.results) {
      if (result.status === 'FAIL' && result.error) {
        if (!failuresByEndpoint[result.endpoint.route]) {
          failuresByEndpoint[result.endpoint.route] = [];
        }
        failuresByEndpoint[result.endpoint.route].push(result.error);
      }
    }

    // Finde langsame Endpoints (>1000ms)
    const slowEndpoints = this.results
      .filter((r) => r.responseTime > 1000)
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, 5)
      .map((r) => ({ route: r.endpoint.route, time: r.responseTime }));

    return {
      timestamp: new Date().toISOString(),
      totalTests: this.results.length - skipped,
      passed,
      failed,
      warnings,
      skipped,
      duration,
      results: this.results,
      summary: {
        successRate: parseFloat(successRate),
        failuresByEndpoint,
        slowEndpoints,
        errorDetails: this.aggregateErrors(),
      },
    };
  }

  /**
   * Aggregiert Error Details
   */
  private aggregateErrors(): Record<string, any> {
    const errorTypes: Record<string, number> = {};
    const errorMessages: Set<string> = new Set();

    for (const result of this.results) {
      if (result.error) {
        const errorType = result.error.split(':')[0];
        errorTypes[errorType] = (errorTypes[errorType] || 0) + 1;
        errorMessages.add(result.error);
      }
    }

    return {
      errorTypes,
      uniqueErrors: Array.from(errorMessages),
      totalErrors: this.results.filter((r) => r.error).length,
    };
  }

  /**
   * Exportiert Report als JSON
   */
  async exportToJson(
    report: SmokeTestReport,
    outputPath: string
  ): Promise<void> {
    const dir = path.dirname(outputPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`\n✅ Smoke Test Report exportiert: ${outputPath}`);
    console.log(`\n📊 Zusammenfassung:`);
    console.log(`   Gesamt Tests: ${report.totalTests}`);
    console.log(`   ✅ Bestanden: ${report.passed}`);
    console.log(`   ❌ Fehlgeschlagen: ${report.failed}`);
    console.log(`   ↩️  Übersprungen: ${report.skipped}`);
    console.log(`   ⏱️  Gesamtdauer: ${report.duration}ms`);
    console.log(`   📈 Erfolgsrate: ${report.summary.successRate}%`);
  }
}
