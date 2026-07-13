/**
 * Risk Analyzer Service
 * 
 * Analyzes API endpoints for potential risks and security issues
 * Identifies missing authentication, validation, error handling, etc.
 */

import {
  ApiEndpoint,
  IRiskAnalyzer,
  RiskAnalysis,
  RiskIssue,
  RiskIssueType,
  SmokeTestResult,
} from '../api-discovery.types';

/**
 * Risk Analyzer Service
 */
export class RiskAnalyzerService implements IRiskAnalyzer {
  private riskWeights: Record<RiskIssueType, number> = {
    [RiskIssueType.AUTHENTICATION_MISSING]: 25,
    [RiskIssueType.VALIDATION_MISSING]: 20,
    [RiskIssueType.ERROR_HANDLING_MISSING]: 15,
    [RiskIssueType.RATE_LIMITING_MISSING]: 15,
    [RiskIssueType.LOGGING_MISSING]: 10,
    [RiskIssueType.DOCUMENTATION_MISSING]: 10,
    [RiskIssueType.NO_TEST_COVERAGE]: 15,
    [RiskIssueType.DEPRECATED]: 10,
    [RiskIssueType.SLOW_RESPONSE]: 12,
    [RiskIssueType.LARGE_PAYLOAD]: 8,
    [RiskIssueType.UNSAFE_METHOD]: 18,
    [RiskIssueType.BROKEN_RESPONSE_SCHEMA]: 20,
    [RiskIssueType.SECURITY_ISSUE]: 30,
    [RiskIssueType.UNIMPLEMENTED]: 25,
  };

  /**
   * Analyze single endpoint
   */
  async analyzeEndpoint(
    endpoint: ApiEndpoint,
    testResult?: SmokeTestResult
  ): Promise<RiskAnalysis> {
    const issues: RiskIssue[] = [];

    // Check 1: Authentication
    if (endpoint.requiresAuth && !endpoint.authType) {
      issues.push({
        type: RiskIssueType.AUTHENTICATION_MISSING,
        severity: 'CRITICAL',
        message: 'Endpoint requires authentication but auth type is not specified',
      });
    }

    // Check 2: Validation
    if (!endpoint.bodySchema && ['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      issues.push({
        type: RiskIssueType.VALIDATION_MISSING,
        severity: 'HIGH',
        message: 'Endpoint accepts request body but no validation schema defined',
      });
    }

    // Check 3: Test coverage
    if (!endpoint.hasTests) {
      issues.push({
        type: RiskIssueType.NO_TEST_COVERAGE,
        severity: 'HIGH',
        message: 'Endpoint has no test coverage',
      });
    }

    // Check 4: Deprecated
    if (endpoint.deprecated) {
      issues.push({
        type: RiskIssueType.DEPRECATED,
        severity: 'MEDIUM',
        message: 'Endpoint is marked as deprecated',
      });
    }

    // Check 5: Not implemented
    if (!endpoint.isImplemented) {
      issues.push({
        type: RiskIssueType.UNIMPLEMENTED,
        severity: 'CRITICAL',
        message: 'Endpoint is not implemented',
      });
    }

    // Check 6: Documentation
    if (!endpoint.description) {
      issues.push({
        type: RiskIssueType.DOCUMENTATION_MISSING,
        severity: 'LOW',
        message: 'Endpoint lacks description/documentation',
      });
    }

    // Check 7: Unsafe methods
    if (endpoint.method === 'DELETE' && !endpoint.requiresAuth) {
      issues.push({
        type: RiskIssueType.UNSAFE_METHOD,
        severity: 'CRITICAL',
        message: 'DELETE endpoint does not require authentication',
      });
    }

    // Check from test results
    if (testResult && !testResult.passed) {
      // Check 8: Response time
      if (testResult.duration > 5000) {
        issues.push({
          type: RiskIssueType.SLOW_RESPONSE,
          severity: 'MEDIUM',
          message: `Endpoint is slow: ${testResult.duration}ms response time`,
          details: { responseDuration: testResult.duration },
        });
      }

      // Check 9: Broken response
      const failedChecks = testResult.checks.filter((c) => !c.passed);
      if (failedChecks.some((c) => c.name.includes('Response'))) {
        issues.push({
          type: RiskIssueType.BROKEN_RESPONSE_SCHEMA,
          severity: 'HIGH',
          message: 'Response structure does not match expected schema',
          details: {
            failedChecks: failedChecks.map((c) => c.name),
          },
        });
      }

      // Check 10: Auth failures
      if (testResult.error && testResult.error.includes('401')) {
        issues.push({
          type: RiskIssueType.SECURITY_ISSUE,
          severity: 'CRITICAL',
          message: 'Authentication check failed',
        });
      }
    }

    // Calculate risk score
    const riskScore = this.calculateRiskScore(issues);

    // Determine risk level
    let riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' = 'INFO';
    if (riskScore >= 80) riskLevel = 'CRITICAL';
    else if (riskScore >= 60) riskLevel = 'HIGH';
    else if (riskScore >= 40) riskLevel = 'MEDIUM';
    else if (riskScore >= 20) riskLevel = 'LOW';

    // Generate recommendations
    const recommendations = this.generateRecommendations(endpoint, issues);

    return {
      endpointId: endpoint.endpointId,
      path: endpoint.path,
      method: endpoint.method,
      riskLevel,
      riskScore,
      issues,
      recommendations,
      analyzedAt: new Date().toISOString(),
    };
  }

  /**
   * Analyze all endpoints
   */
  async analyzeAll(
    endpoints: ApiEndpoint[],
    testResults?: SmokeTestResult[]
  ): Promise<RiskAnalysis[]> {
    const results: RiskAnalysis[] = [];

    for (const endpoint of endpoints) {
      const testResult = testResults?.find((r) => r.endpointId === endpoint.endpointId);
      const analysis = await this.analyzeEndpoint(endpoint, testResult);
      results.push(analysis);
    }

    return results;
  }

  /**
   * Calculate risk score
   */
  calculateRiskScore(issues: RiskIssue[]): number {
    if (issues.length === 0) return 0;

    let score = 0;

    for (const issue of issues) {
      const weight = this.riskWeights[issue.type] || 10;

      // Severity multiplier
      let severityMultiplier = 0.5; // LOW
      if (issue.severity === 'MEDIUM') severityMultiplier = 0.75;
      if (issue.severity === 'HIGH') severityMultiplier = 1.0;
      if (issue.severity === 'CRITICAL') severityMultiplier = 1.5;

      score += weight * severityMultiplier;
    }

    // Normalize to 0-100
    return Math.min(100, Math.round(score / 2));
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(_endpoint: ApiEndpoint, issues: RiskIssue[]): string[] {
    const recommendations: string[] = [];

    for (const issue of issues) {
      switch (issue.type) {
        case RiskIssueType.AUTHENTICATION_MISSING:
          recommendations.push('Add authentication requirement to endpoint');
          recommendations.push('Define authType (JWT, OAuth2, APIKey, etc.)');
          break;

        case RiskIssueType.VALIDATION_MISSING:
          recommendations.push('Define request body validation schema');
          recommendations.push('Add input validation middleware');
          break;

        case RiskIssueType.NO_TEST_COVERAGE:
          recommendations.push('Add unit tests for this endpoint');
          recommendations.push('Add integration tests');
          break;

        case RiskIssueType.ERROR_HANDLING_MISSING:
          recommendations.push('Add error handling middleware');
          recommendations.push('Document error responses');
          break;

        case RiskIssueType.DOCUMENTATION_MISSING:
          recommendations.push('Add endpoint description');
          recommendations.push('Document request/response formats');
          break;

        case RiskIssueType.DEPRECATED:
          recommendations.push('Plan migration path for clients');
          recommendations.push('Set deprecation timeline');
          recommendations.push('Implement deprecation warnings');
          break;

        case RiskIssueType.UNSAFE_METHOD:
          recommendations.push('Add authentication requirement');
          recommendations.push('Add request logging');
          recommendations.push('Consider rate limiting');
          break;

        case RiskIssueType.SLOW_RESPONSE:
          recommendations.push('Optimize endpoint performance');
          recommendations.push('Add caching if appropriate');
          recommendations.push('Check for database query issues');
          break;

        case RiskIssueType.BROKEN_RESPONSE_SCHEMA:
          recommendations.push('Fix response format to match schema');
          recommendations.push('Add schema validation tests');
          break;

        case RiskIssueType.UNIMPLEMENTED:
          recommendations.push('Complete endpoint implementation');
          recommendations.push('Add tests before marking as implemented');
          break;

        case RiskIssueType.SECURITY_ISSUE:
          recommendations.push('Review security configuration');
          recommendations.push('Test authentication/authorization');
          break;

        case RiskIssueType.RATE_LIMITING_MISSING:
          recommendations.push('Implement rate limiting');
          recommendations.push('Configure rate limit headers');
          break;

        case RiskIssueType.LOGGING_MISSING:
          recommendations.push('Add request/response logging');
          recommendations.push('Log security events');
          break;
      }
    }

    // Remove duplicates
    return [...new Set(recommendations)];
  }

  /**
   * Get summary of all issues
   */
  getSummary(analyses: RiskAnalysis[]) {
    const critical = analyses.filter((a) => a.riskLevel === 'CRITICAL').length;
    const high = analyses.filter((a) => a.riskLevel === 'HIGH').length;
    const medium = analyses.filter((a) => a.riskLevel === 'MEDIUM').length;
    const low = analyses.filter((a) => a.riskLevel === 'LOW').length;

    const avgRiskScore = Math.round(
      analyses.reduce((sum, a) => sum + a.riskScore, 0) / analyses.length
    );

    return {
      totalEndpoints: analyses.length,
      critical,
      high,
      medium,
      low,
      averageRiskScore: avgRiskScore,
      criticalPercentage: Math.round((critical / analyses.length) * 100),
    };
  }
}
