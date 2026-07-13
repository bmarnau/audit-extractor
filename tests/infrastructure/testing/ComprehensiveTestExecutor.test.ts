/**
 * Comprehensive Test Executor - Unit Tests
 * 
 * Tests for:
 * - TestSeverityClassifier
 * - TestResultAggregator
 * - CompactReportGenerator
 */

import {
  TestResult,
  TestSeverityClassifier,
  TestResultAggregator,
  CompactReportGenerator,
  ComponentTestResults,
  TestExecutionReport,
} from '../../../src/infrastructure/testing/ComprehensiveTestExecutor';

describe('Phase 31: Comprehensive Test Executor', () => {
  describe('TestSeverityClassifier', () => {
    describe('classifyFailure', () => {
      it('should classify CRITICAL for endpoint timeout', () => {
        const severity = TestSeverityClassifier.classifyFailure(
          'endpoint',
          'e2e',
          'Timeout after 30000ms',
          30000
        );
        expect(severity).toBe('CRITICAL');
      });

      it('should classify CRITICAL for null connection error', () => {
        const severity = TestSeverityClassifier.classifyFailure(
          'service',
          'integration',
          'Cannot read property of null',
          100
        );
        expect(severity).toBe('CRITICAL');
      });

      it('should classify CRITICAL for database connection failure', () => {
        const severity = TestSeverityClassifier.classifyFailure(
          'repository',
          'integration',
          'Database connection refused',
          5000
        );
        expect(severity).toBe('CRITICAL');
      });

      it('should classify HIGH for service business logic error', () => {
        const severity = TestSeverityClassifier.classifyFailure(
          'service',
          'unit',
          'Expected true, got false',
          50
        );
        expect(severity).toBe('HIGH');
      });

      it('should classify HIGH for controller unit test failure', () => {
        const severity = TestSeverityClassifier.classifyFailure(
          'controller',
          'unit',
          'Assertion failed',
          25
        );
        expect(severity).toBe('HIGH');
      });

      it('should classify MEDIUM for page rendering error', () => {
        const severity = TestSeverityClassifier.classifyFailure(
          'page',
          'component',
          'Props validation failed',
          100
        );
        expect(severity).toBe('MEDIUM');
      });

      it('should classify MEDIUM for component rendering error', () => {
        const severity = TestSeverityClassifier.classifyFailure(
          'component',
          'unit',
          'Rendering failed',
          30
        );
        expect(severity).toBe('MEDIUM');
      });
    });

    describe('mapStatusToInitialSeverity', () => {
      it('should map FAILED to HIGH', () => {
        const severity = TestSeverityClassifier.mapStatusToInitialSeverity('FAILED', 'service');
        expect(severity).toBe('HIGH');
      });

      it('should map PASSED to INFO', () => {
        const severity = TestSeverityClassifier.mapStatusToInitialSeverity('PASSED', 'service');
        expect(severity).toBe('INFO');
      });

      it('should map SKIPPED to INFO', () => {
        const severity = TestSeverityClassifier.mapStatusToInitialSeverity('SKIPPED', 'service');
        expect(severity).toBe('INFO');
      });
    });
  });

  describe('TestResultAggregator', () => {
    let aggregator: TestResultAggregator;

    beforeEach(() => {
      aggregator = new TestResultAggregator();
    });

    describe('addResult', () => {
      it('should add single test result', () => {
        const result: TestResult = {
          testId: 'test_1',
          componentId: 'service_auth',
          componentName: 'AuthService',
          componentType: 'service',
          testName: 'should authenticate',
          testType: 'unit',
          status: 'PASSED',
          severity: 'INFO',
          duration: 25,
          timestamp: new Date(),
        };

        aggregator.addResult(result);

        expect((aggregator as any).results).toHaveLength(1);
        expect((aggregator as any).results[0]).toEqual(result);
      });

      it('should aggregate multiple results by component', () => {
        const results: TestResult[] = [
          {
            testId: 'test_1',
            componentId: 'service_auth',
            componentName: 'AuthService',
            componentType: 'service',
            testName: 'should authenticate',
            testType: 'unit',
            status: 'PASSED',
            severity: 'INFO',
            duration: 25,
            timestamp: new Date(),
          },
          {
            testId: 'test_2',
            componentId: 'service_auth',
            componentName: 'AuthService',
            componentType: 'service',
            testName: 'should handle error',
            testType: 'unit',
            status: 'FAILED',
            severity: 'HIGH',
            duration: 15,
            error: 'Expected true got false',
            timestamp: new Date(),
          },
          {
            testId: 'test_3',
            componentId: 'service_user',
            componentName: 'UserService',
            componentType: 'service',
            testName: 'should create user',
            testType: 'unit',
            status: 'PASSED',
            severity: 'INFO',
            duration: 30,
            timestamp: new Date(),
          },
        ];

        results.forEach(r => aggregator.addResult(r));

        const componentResults = (aggregator as any).componentResults;
        expect(componentResults.size).toBe(2);
        expect(componentResults.get('service_auth').totalTests).toBe(2);
        expect(componentResults.get('service_user').totalTests).toBe(1);
      });

      it('should calculate component statistics correctly', () => {
        const passedResults: TestResult[] = [
          {
            testId: 'test_1',
            componentId: 'service_1',
            componentName: 'Service1',
            componentType: 'service',
            testName: 'test1',
            testType: 'unit',
            status: 'PASSED',
            severity: 'INFO',
            duration: 10,
            timestamp: new Date(),
          },
          {
            testId: 'test_2',
            componentId: 'service_1',
            componentName: 'Service1',
            componentType: 'service',
            testName: 'test2',
            testType: 'unit',
            status: 'PASSED',
            severity: 'INFO',
            duration: 10,
            timestamp: new Date(),
          },
        ];

        const failedResults: TestResult[] = [
          {
            testId: 'test_3',
            componentId: 'service_1',
            componentName: 'Service1',
            componentType: 'service',
            testName: 'test3',
            testType: 'unit',
            status: 'FAILED',
            severity: 'HIGH',
            duration: 10,
            error: 'Error',
            timestamp: new Date(),
          },
        ];

        const results = [...passedResults, ...failedResults];

        results.forEach(r => aggregator.addResult(r));

        const componentResults = (aggregator as any).componentMap.get('service_1');
        expect(componentResults.totalTests).toBe(3);
        expect(componentResults.passedTests).toBe(2);
        expect(componentResults.failedTests).toBe(1);
        expect(componentResults.successRate).toBe(66.67);
      });
    });

    describe('generateReport', () => {
      it('should generate report with all metrics', () => {
        const results: TestResult[] = [
          {
            testId: 'test_1',
            componentId: 'service_1',
            componentName: 'Service1',
            componentType: 'service',
            testName: 'test1',
            testType: 'unit',
            status: 'PASSED',
            severity: 'INFO',
            duration: 10,
            timestamp: new Date(),
          },
          {
            testId: 'test_2',
            componentId: 'service_1',
            componentName: 'Service1',
            componentType: 'service',
            testName: 'test2',
            testType: 'unit',
            status: 'FAILED',
            severity: 'CRITICAL',
            duration: 20,
            error: 'Error',
            timestamp: new Date(),
          },
        ];

        results.forEach(r => aggregator.addResult(r));

        const report = aggregator.generateReport('exec_test', new Date(), new Date());

        expect(report.totalTests).toBe(2);
        expect(report.passedTests).toBe(1);
        expect(report.failedTests).toBe(1);
        expect(report.criticalFailures).toBe(1);
        expect(report.totalComponents).toBe(1);
      });

      it('should calculate overall success rate', () => {
        // 8 passed, 2 failed = 80%
      const passedResults: TestResult[] = Array.from({ length: 8 }, (_, i) => ({
        testId: `test_${i}`,
        componentId: 'service_1',
        componentName: 'Service1',
        componentType: 'service' as const,
        testName: `test${i}`,
        testType: 'unit' as const,
        status: 'PASSED' as const,
        severity: 'INFO' as const,
        duration: 10,
        timestamp: new Date(),
      }));

      const failedResults: TestResult[] = Array.from({ length: 2 }, (_, i) => ({
        testId: `test_${i + 8}`,
        componentId: 'service_1',
        componentName: 'Service1',
        componentType: 'service' as const,
        testName: `test${i + 8}`,
        testType: 'unit' as const,
        status: 'FAILED' as const,
        severity: 'HIGH' as const,
        duration: 10,
        error: 'Error',
        timestamp: new Date(),
      }));

      const results = [...passedResults, ...failedResults];
        const report = aggregator.generateReport('exec_test', new Date(), new Date());

        expect(report.overallSuccessRate).toBeCloseTo(80, 1);
      });
    });

    describe('sorting methods', () => {
      it('getResultsSortedBySeverity should sort correctly', () => {
        const results: TestResult[] = [
          {
            testId: 'test_1',
            componentId: 'comp_1',
            componentName: 'Comp1',
            componentType: 'component',
            testName: 'test1',
            testType: 'unit',
            status: 'FAILED',
            severity: 'LOW',
            duration: 10,
            error: 'Error',
            timestamp: new Date(),
          },
          {
            testId: 'test_2',
            componentId: 'comp_2',
            componentName: 'Comp2',
            componentType: 'component',
            testName: 'test2',
            testType: 'unit',
            status: 'FAILED',
            severity: 'CRITICAL',
            duration: 10,
            error: 'Error',
            timestamp: new Date(),
          },
          {
            testId: 'test_3',
            componentId: 'comp_3',
            componentName: 'Comp3',
            componentType: 'component',
            testName: 'test3',
            testType: 'unit',
            status: 'FAILED',
            severity: 'MEDIUM',
            duration: 10,
            error: 'Error',
            timestamp: new Date(),
          },
        ];

        results.forEach(r => aggregator.addResult(r));
        const sorted = aggregator.getResultsSortedBySeverity();

        expect(sorted[0].severity).toBe('CRITICAL');
        expect(sorted[1].severity).toBe('MEDIUM');
        expect(sorted[2].severity).toBe('LOW');
      });

      it('getComponentsSortedBySeverity should sort correctly', () => {
        const results: TestResult[] = [
          {
            testId: 'test_1',
            componentId: 'comp_1',
            componentName: 'Comp1',
            componentType: 'component',
            testName: 'test1',
            testType: 'unit',
            status: 'FAILED',
            severity: 'LOW',
            duration: 10,
            error: 'Error',
            timestamp: new Date(),
          },
          {
            testId: 'test_2',
            componentId: 'comp_2',
            componentName: 'Comp2',
            componentType: 'service',
            testName: 'test2',
            testType: 'integration',
            status: 'FAILED',
            severity: 'CRITICAL',
            duration: 10,
            error: 'Error',
            timestamp: new Date(),
          },
        ];

        results.forEach(r => aggregator.addResult(r));
        const sorted = aggregator.getComponentsSortedBySeverity();

        expect(sorted[0].highestSeverity).toBe('CRITICAL');
        expect(sorted[1].highestSeverity).toBe('LOW');
      });
    });
  });

  describe('CompactReportGenerator', () => {
    let report: TestExecutionReport;

    beforeEach(() => {
      const now = new Date();
      const later = new Date(now.getTime() + 45000); // 45 seconds

      report = {
        executionId: 'exec_test',
        startTime: now,
        endTime: later,
        duration: 45,
        totalTests: 155,
        totalComponents: 152,
        passedTests: 152,
        failedTests: 3,
        skippedTests: 0,
        overallSuccessRate: 98.1,
        criticalFailures: 2,
        highFailures: 1,
        mediumFailures: 0,
        lowFailures: 0,
        passingComponents: 145,
        failingComponents: 7,
        partialComponents: 0,
        testResults: [
          {
            testId: 'test_1',
            componentId: 'service_1',
            componentName: 'AjvValidationService',
            componentType: 'service',
            testName: 'should validate schema',
            testType: 'unit',
            status: 'FAILED',
            severity: 'CRITICAL',
            duration: 23,
            error: 'Expected null, got undefined',
            timestamp: now,
          },
          {
            testId: 'test_2',
            componentId: 'service_2',
            componentName: 'AuthService',
            componentType: 'service',
            testName: 'should authenticate',
            testType: 'integration',
            status: 'FAILED',
            severity: 'CRITICAL',
            duration: 45,
            error: 'Connection timeout',
            timestamp: now,
          },
          {
            testId: 'test_3',
            componentId: 'service_3',
            componentName: 'UserService',
            componentType: 'service',
            testName: 'should create user',
            testType: 'unit',
            status: 'FAILED',
            severity: 'HIGH',
            duration: 12,
            error: 'Validation failed',
            timestamp: now,
          },
        ],
        componentResults: [
          {
            componentId: 'service_1',
            componentName: 'AjvValidationService',
            componentType: 'service',
            totalTests: 5,
            passedTests: 3,
            failedTests: 2,
            skippedTests: 0,
            timeoutTests: 0,
            errorTests: 0,
            successRate: 60,
            duration: 100,
            criticalFailures: 2,
            highFailures: 0,
            mediumFailures: 0,
            lowFailures: 0,
            status: 'PARTIAL',
            highestSeverity: 'CRITICAL',
          },
        ],
        blockers: [
          'AjvValidationService.validate(): Expected null, got undefined',
          'AuthService.authenticate(): Connection timeout',
        ],
        recommendations: [
          '🔴 BLOCKER: 2 critical failures must be fixed',
          '⚠️  WARNING: 1.9% test failure rate',
        ],
      };
    });

    describe('toTerminal', () => {
      it('should generate terminal output string', () => {
        const output = CompactReportGenerator.toTerminal(report);

        expect(output).toContain('TEST EXECUTION REPORT');
        expect(output).toContain('155');
        expect(output).toContain('98.1');
        expect(output).toContain('CRITICAL');
        expect(output).toContain('AjvValidationService');
      });

      it('should include severity distribution', () => {
        const output = CompactReportGenerator.toTerminal(report);

        expect(output).toContain('CRITICAL: 2');
        expect(output).toContain('HIGH: 1');
      });

      it('should include blockers section', () => {
        const output = CompactReportGenerator.toTerminal(report);

        expect(output).toContain('BLOCKERS');
        expect(output).toContain('Expected null, got undefined');
      });
    });

    describe('toJSON', () => {
      it('should generate valid JSON string', () => {
        const jsonStr = CompactReportGenerator.toJSON(report);
        const parsed = JSON.parse(jsonStr);

        expect(parsed.executionId).toBe('exec_test');
        expect(parsed.summary.totalTests).toBe(155);
        expect(parsed.severity.CRITICAL).toBe(2);
      });

      it('should include all required fields', () => {
        const jsonStr = CompactReportGenerator.toJSON(report);
        const parsed = JSON.parse(jsonStr);

        expect(parsed.timestamp).toBeDefined();
        expect(parsed.duration).toBeDefined();
        expect(parsed.summary).toBeDefined();
        expect(parsed.severity).toBeDefined();
        expect(parsed.failedTests).toBeDefined();
      });
    });

    describe('toMarkdown', () => {
      it('should generate markdown output', () => {
        const markdown = CompactReportGenerator.toMarkdown(report);

        expect(markdown).toContain('#');
        expect(markdown).toContain('**Test Execution Report**');
        expect(markdown).toContain('155');
      });

      it('should include all sections', () => {
        const markdown = CompactReportGenerator.toMarkdown(report);

        expect(markdown).toContain('Summary');
        expect(markdown).toContain('Severity Distribution');
        expect(markdown).toContain('Blockers');
        expect(markdown).toContain('Recommendations');
      });

      it('should format as valid markdown', () => {
        const markdown = CompactReportGenerator.toMarkdown(report);

        expect(markdown).toContain('|'); // Tables
        expect(markdown).toContain('-'); // Headers
        expect(markdown).toContain('```'); // Code blocks
      });
    });
  });

  describe('Integration Tests', () => {
    it('should complete full workflow: collect, classify, aggregate, report', () => {
      const aggregator = new TestResultAggregator();

      // Simulate test results
      const passed: TestResult[] = [
        {
          testId: 'test_2',
          componentId: 'service_auth',
          componentName: 'AuthService',
          componentType: 'service',
          testName: 'should verify token',
          testType: 'unit',
          status: 'PASSED',
          severity: 'INFO',
          duration: 25,
          timestamp: new Date(),
        },
      ];

      const failed: TestResult[] = [
        {
          testId: 'test_1',
          componentId: 'endpoint_auth',
          componentName: 'AuthEndpoint',
          componentType: 'endpoint',
          testName: 'POST /auth should authenticate',
          testType: 'integration',
          status: 'FAILED',
          severity: 'CRITICAL',
          duration: 5000,
          error: 'Request timeout',
          timestamp: new Date(),
        },
        {
          testId: 'test_3',
          componentId: 'service_auth',
          componentName: 'AuthService',
          componentType: 'service',
          testName: 'should handle error',
          testType: 'unit',
          status: 'FAILED',
          severity: 'HIGH',
          duration: 15,
          error: 'Assertion failed',
          timestamp: new Date(),
        },
      ];

      const results = [...failed, ...passed];

      // Add all results
      results.forEach(r => aggregator.addResult(r));

      // Generate report
      const now = new Date();
      const report = aggregator.generateReport('exec_integration', now, new Date());

      // Verify aggregation
      expect(report.totalTests).toBe(3);
      expect(report.passedTests).toBe(1);
      expect(report.failedTests).toBe(2);
      expect(report.criticalFailures).toBe(1);
      expect(report.highFailures).toBe(1);
      expect(report.totalComponents).toBe(2);

      // Generate output formats
      const terminal = CompactReportGenerator.toTerminal(report);
      const json = CompactReportGenerator.toJSON(report);
      const markdown = CompactReportGenerator.toMarkdown(report);

      // Verify outputs exist and contain expected content
      expect(terminal.length).toBeGreaterThan(0);
      expect(JSON.parse(json)).toBeDefined();
      expect(markdown.length).toBeGreaterThan(0);
      expect(markdown).toContain('AuthEndpoint');
      expect(markdown).toContain('CRITICAL');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero tests', () => {
      const aggregator = new TestResultAggregator();
      const report = aggregator.generateReport('exec_empty', new Date(), new Date());

      expect(report.totalTests).toBe(0);
      expect(report.overallSuccessRate).toBe(0);
      expect(report.failedTests).toBe(0);
    });

    it('should handle all passing tests', () => {
      const aggregator = new TestResultAggregator();

      Array.from({ length: 100 }, (_, i) => ({
        testId: `test_${i}`,
        componentId: 'service_1',
        componentName: 'Service1',
        componentType: 'service' as const,
        testName: `test${i}`,
        testType: 'unit' as const,
        status: 'PASSED' as const,
        severity: 'INFO' as const,
        duration: 10,
        timestamp: new Date(),
      })).forEach(r => aggregator.addResult(r));

      const report = aggregator.generateReport('exec_all_pass', new Date(), new Date());

      expect(report.totalTests).toBe(100);
      expect(report.passedTests).toBe(100);
      expect(report.failedTests).toBe(0);
      expect(report.overallSuccessRate).toBe(100);
      expect(report.criticalFailures).toBe(0);
    });

    it('should handle all failing tests', () => {
      const aggregator = new TestResultAggregator();

      const failingResults: TestResult[] = Array.from({ length: 10 }, (_, i) => ({
        testId: `test_${i}`,
        componentId: 'service_1',
        componentName: 'Service1',
        componentType: 'service' as const,
        testName: `test${i}`,
        testType: 'unit' as const,
        status: 'FAILED' as const,
        severity: 'HIGH' as const,
        duration: 10,
        error: 'Error',
        timestamp: new Date(),
      }));

      failingResults.forEach(r => aggregator.addResult(r));

      const report = aggregator.generateReport('exec_all_fail', new Date(), new Date());

      expect(report.totalTests).toBe(10);
      expect(report.passedTests).toBe(0);
      expect(report.failedTests).toBe(10);
      expect(report.overallSuccessRate).toBe(0);
    });
  });
});
