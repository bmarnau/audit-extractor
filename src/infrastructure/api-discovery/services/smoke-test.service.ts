/**
 * Smoke Test Service
 * 
 * Executes smoke tests against discovered endpoints
 * Validates response status codes, structure, authentication, and error handling
 */

import axios from 'axios';
import {
  ApiEndpoint,
  SmokeTestCheck,
  SmokeTestFailure,
  SmokeTestMethodStats,
  SmokeTestReport,
  SmokeTestRequest,
  SmokeTestResponse,
  SmokeTestResult,
  HttpMethod,
  ISmokeTestService,
} from '../api-discovery.types';

/**
 * Smoke Test Service
 */
export class SmokeTestService implements ISmokeTestService {
  private baseUrl: string;
  private timeout: number = 5000;
  private retries: number = 2;

  constructor(
    baseUrl: string = 'http://localhost:3000',
    timeout: number = 5000
  ) {
    this.baseUrl = baseUrl;
    this.timeout = timeout;
  }

  /**
   * Run a single test
   */
  async runTest(endpoint: ApiEndpoint, request?: SmokeTestRequest): Promise<SmokeTestResult> {
    const testId = `TEST-${endpoint.endpointId}-${Date.now()}`;
    const testRequest = request || this.buildDefaultRequest(endpoint);

    const result: SmokeTestResult = {
      testId,
      endpointId: endpoint.endpointId,
      request: testRequest,
      passed: false,
      skipped: false,
      testName: endpoint.name,
      checks: [],
      executedAt: new Date().toISOString(),
      duration: 0,
    };

    const startTime = Date.now();

    try {
      // Execute request
      const response = await this.executeRequest(endpoint, testRequest);

      result.response = response;
      result.duration = Date.now() - startTime;

      // Validate response
      const checks = await this.validateResponse(endpoint, response);
      result.checks = checks;
      result.passed = checks.every((c) => c.passed);
    } catch (error) {
      result.duration = Date.now() - startTime;
      result.passed = false;
      result.error = this.getErrorMessage(error);
      result.errorType = this.classifyError(error);

      // Add failure check
      result.checks.push({
        name: 'Connection',
        description: 'Endpoint is reachable',
        passed: false,
        message: result.error,
      });
    }

    return result;
  }

  /**
   * Run all tests
   */
  async runAllTests(endpoints: ApiEndpoint[]): Promise<SmokeTestReport> {
    const results: SmokeTestResult[] = [];
    const startTime = Date.now();

    // Run tests sequentially
    for (const endpoint of endpoints) {
      const result = await this.runTest(endpoint);
      results.push(result);

      // Small delay between tests
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const totalDuration = Date.now() - startTime;

    // Calculate statistics
    const passed = results.filter((r) => r.passed && !r.skipped).length;
    const failed = results.filter((r) => !r.passed && !r.skipped).length;
    const skipped = results.filter((r) => r.skipped).length;

    // By method statistics
    const resultsByMethod: Record<HttpMethod, SmokeTestMethodStats> = {
      GET: { method: 'GET', total: 0, passed: 0, failed: 0, skipped: 0, passRate: 0 },
      POST: { method: 'POST', total: 0, passed: 0, failed: 0, skipped: 0, passRate: 0 },
      PUT: { method: 'PUT', total: 0, passed: 0, failed: 0, skipped: 0, passRate: 0 },
      PATCH: { method: 'PATCH', total: 0, passed: 0, failed: 0, skipped: 0, passRate: 0 },
      DELETE: { method: 'DELETE', total: 0, passed: 0, failed: 0, skipped: 0, passRate: 0 },
      HEAD: { method: 'HEAD', total: 0, passed: 0, failed: 0, skipped: 0, passRate: 0 },
      OPTIONS: { method: 'OPTIONS', total: 0, passed: 0, failed: 0, skipped: 0, passRate: 0 },
    };

    for (const result of results) {
      const endpoint = endpoints.find((e) => e.endpointId === result.endpointId);
      if (!endpoint) continue;

      const stats = resultsByMethod[endpoint.method];
      stats.total++;

      if (result.skipped) {
        stats.skipped++;
      } else if (result.passed) {
        stats.passed++;
      } else {
        stats.failed++;
      }
    }

    // Calculate pass rates
    for (const stats of Object.values(resultsByMethod)) {
      if (stats.total > 0) {
        stats.passRate = (stats.passed / (stats.total - stats.skipped)) * 100;
      }
    }

    // Build failures list
    const failures: SmokeTestFailure[] = results
      .filter((r) => !r.passed && !r.skipped)
      .map((r) => ({
        testId: r.testId,
        endpointId: r.endpointId,
        endpoint: r.request.endpoint,
        method: endpoints.find((e) => e.endpointId === r.endpointId)?.method || 'GET',
        error: r.error || 'Unknown error',
        errorType: r.errorType || 'Unknown',
        failedChecks: r.checks.filter((c) => !c.passed).map((c) => c.name),
      }));

    // Determine health status
    const passRate = (passed / (results.length - skipped)) * 100;
    let healthStatus: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' = 'HEALTHY';
    if (passRate < 80) healthStatus = 'DEGRADED';
    if (passRate < 50) healthStatus = 'CRITICAL';

    return {
      reportId: `SMOKE-REPORT-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      totalTests: results.length,
      passedTests: passed,
      failedTests: failed,
      skippedTests: skipped,
      passRate,
      results,
      resultsByMethod,
      failures,
      totalDuration,
      averageDuration: Math.round(totalDuration / results.length),
      maxDuration: Math.max(...results.map((r) => r.duration)),
      minDuration: Math.min(...results.map((r) => r.duration)),
      healthStatus,
    };
  }

  /**
   * Validate response
   */
  async validateResponse(endpoint: ApiEndpoint, response: SmokeTestResponse): Promise<SmokeTestCheck[]> {
    const checks: SmokeTestCheck[] = [];

    // Check 1: Status code
    const successStatusCodes = [200, 201, 202, 204];
    const isSuccessful = successStatusCodes.includes(response.statusCode);

    checks.push({
      name: 'Status Code',
      description: `Response status code is in success range (200-204)`,
      passed: isSuccessful,
      actual: response.statusCode,
      expected: '200-204',
    });

    // Check 2: Content-Type header
    const contentType = response.headers['content-type'];
    const hasContentType = !!contentType;

    checks.push({
      name: 'Content-Type Header',
      description: 'Response includes Content-Type header',
      passed: hasContentType,
      actual: contentType,
      expected: 'application/json',
    });

    // Check 3: Response structure for JSON
    if (response.bodyType === 'json' && response.body) {
      const hasValidStructure = typeof response.body === 'object';

      checks.push({
        name: 'Response Structure',
        description: 'Response body is valid JSON object',
        passed: hasValidStructure,
        actual: typeof response.body,
        expected: 'object',
      });

      // Check 4: Required fields (if endpoint specifies them)
      if (endpoint.bodySchema && endpoint.bodySchema.required) {
        const missingFields = endpoint.bodySchema.required.filter(
          (field: string) => !(field in response.body)
        );

        checks.push({
          name: 'Required Fields',
          description: `All required fields present in response`,
          passed: missingFields.length === 0,
          actual: missingFields.length === 0 ? 'all present' : missingFields.join(', '),
          expected: 'all required fields',
        });
      }
    }

    // Check 5: Response size
    const maxSize = 5 * 1024 * 1024; // 5MB
    const isSizeOk = response.size < maxSize;

    checks.push({
      name: 'Response Size',
      description: `Response size is reasonable (< 5MB)`,
      passed: isSizeOk,
      actual: `${(response.size / 1024).toFixed(2)} KB`,
      expected: '< 5 MB',
    });

    // Check 6: Response time
    const maxDuration = 5000; // 5 seconds
    const isResponseTimeOk = response.duration < maxDuration;

    checks.push({
      name: 'Response Time',
      description: `Response time is acceptable (< 5s)`,
      passed: isResponseTimeOk,
      actual: `${response.duration}ms`,
      expected: '< 5000ms',
    });

    // Check 7: Error handling (if available)
    if (response.statusCode >= 400) {
      const hasErrorInfo = response.body && (response.body.error || response.body.message);

      checks.push({
        name: 'Error Information',
        description: 'Error response includes error details',
        passed: hasErrorInfo,
        actual: hasErrorInfo ? 'error info present' : 'missing',
        expected: 'error message or object',
      });
    }

    // Check 8: Authentication (if required)
    if (endpoint.requiresAuth) {
      const isAuthenticated = response.statusCode !== 401 && response.statusCode !== 403;

      checks.push({
        name: 'Authentication',
        description: 'Endpoint requires proper authentication',
        passed: isAuthenticated,
        actual: response.statusCode,
        expected: '!= 401/403',
      });
    }

    return checks;
  }

  /**
   * Helper: Build default request
   */
  buildDefaultRequest(endpoint: ApiEndpoint): SmokeTestRequest {
    let path = endpoint.path;

    // Replace path parameters with dummy values
    if (endpoint.pathParams) {
      for (const param of endpoint.pathParams) {
        path = path.replace(`:${param}`, `dummy-${param}`);
      }
    }

    const request: SmokeTestRequest = {
      endpoint: `${this.baseUrl}${path}`,
      method: endpoint.method,
      headers: {} as Record<string, string>,
    };

    // Add default auth header if needed
    if (endpoint.requiresAuth) {
      (request.headers as Record<string, string>)['Authorization'] = 'Bearer test-token-' + Date.now();
    }

    // Add body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      request.body = {
        _smokeTest: true,
        _timestamp: Date.now(),
      };
    }

    return request;
  }

  /**
   * Helper: Execute HTTP request
   */
  private async executeRequest(
    _endpoint: ApiEndpoint,
    request: SmokeTestRequest
  ): Promise<SmokeTestResponse> {
    let lastError: any = null;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const response = await axios({
          method: request.method,
          url: request.endpoint,
          headers: request.headers,
          data: request.body,
          params: request.queryParams,
          timeout: this.timeout,
          validateStatus: () => true, // Don't throw on any status
        });

        const bodyString = JSON.stringify(response.data);
        const size = Buffer.byteLength(bodyString);

        return {
          statusCode: response.status,
          headers: response.headers,
          body: response.data,
          bodyType: this.detectBodyType(response.data),
          size,
          duration: response.headers['x-response-time'] || 0,
        };
      } catch (error) {
        lastError = error;

        if (attempt < this.retries) {
          await new Promise((resolve) => setTimeout(resolve, 100 * (attempt + 1)));
        }
      }
    }

    throw lastError;
  }

  /**
   * Helper: Detect response body type
   */
  detectBodyType(body: any): 'json' | 'text' | 'binary' | 'unknown' {
    if (typeof body === 'object') return 'json';
    if (typeof body === 'string') return 'text';
    if (Buffer.isBuffer(body)) return 'binary';
    return 'unknown';
  }

  /**
   * Helper: Get error message
   */
  private getErrorMessage(error: any): string {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        return 'Connection refused - endpoint not reachable';
      }
      if (error.code === 'ENOTFOUND') {
        return 'Host not found - check base URL';
      }
      if (error.code === 'ETIMEDOUT') {
        return 'Request timeout - endpoint is slow';
      }
      return error.message;
    }

    if (error instanceof Error) {
      return error.message;
    }

    return String(error);
  }

  /**
   * Helper: Classify error type
   */
  classifyError(error: any): 'ConnectionError' | 'TimeoutError' | 'ValidationError' | 'AuthError' | 'ServerError' | 'Unknown' {
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') return 'ConnectionError';
      if (error.code === 'ETIMEDOUT') return 'TimeoutError';
      if (error.response?.status === 401) return 'AuthError';
      if (error.response?.status === 400) return 'ValidationError';
      if (error.response?.status && error.response.status >= 500) return 'ServerError';
    }

    return 'Unknown';
  }
}
