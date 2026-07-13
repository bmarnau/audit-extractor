import { IssueFactory } from '../src/domain/issue/IssueFactory';
import { Issue, IssueStatus } from '../src/domain/issue/Issue';
import { Severity } from '../src/domain/issue/Severity';

describe('IssueFactory', () => {
  describe('createIssue', () => {
    it('should create issue with props', () => {
      const props = {
        title: 'Test Issue',
        description: 'Test Description',
        category: 'TEST',
        component: 'TestComponent',
        severity: Severity.MEDIUM,
        rootCause: 'Test cause',
        recommendation: 'Test recommendation',
        consequenceIfResolved: 'Will work',
        consequenceIfIgnored: 'Will break',
        detectedBy: 'TestRunner',
        buildVersion: '1.0.0'
      };

      const issue = IssueFactory.createIssue(props);
      expect(issue.getTitle()).toBe('Test Issue');
      expect(issue).toBeInstanceOf(Issue);
    });
  });

  describe('createFromTestFailure', () => {
    it('should create issue from test failure', () => {
      const issue = IssueFactory.createFromTestFailure({
        testName: 'shouldCalculateTotal',
        testSuite: 'CalculatorTests',
        errorMessage: 'Expected 10 but got 11',
        failureReason: 'Off-by-one error in calculation',
        buildVersion: '1.0.0',
        component: 'Calculator',
        detectedBy: 'Jest'
      });

      expect(issue.getTitle()).toContain('Test Failure');
      expect(issue.getTitle()).toContain('shouldCalculateTotal');
      expect(issue.getCategory()).toBe('TEST_FAILURE');
      expect(issue.getSeverity()).toBe(Severity.HIGH);
      expect(issue.getComponent()).toBe('Calculator');
    });
  });

  describe('createFromApiTestFailure', () => {
    it('should create critical issue for 5xx status', () => {
      const issue = IssueFactory.createFromApiTestFailure({
        endpoint: '/api/users',
        method: 'GET',
        expectedStatus: 200,
        actualStatus: 500,
        responseBody: 'Internal Server Error',
        buildVersion: '1.0.0',
        detectedBy: 'Postman'
      });

      expect(issue.getTitle()).toContain('API Test Failed');
      expect(issue.getSeverity()).toBe(Severity.CRITICAL);
      expect(issue.getCategory()).toBe('API_TEST_FAILURE');
    });

    it('should create high issue for 4xx status', () => {
      const issue = IssueFactory.createFromApiTestFailure({
        endpoint: '/api/users',
        method: 'GET',
        expectedStatus: 200,
        actualStatus: 404,
        responseBody: 'Not Found',
        buildVersion: '1.0.0',
        detectedBy: 'Postman'
      });

      expect(issue.getSeverity()).toBe(Severity.HIGH);
    });
  });

  describe('createFromPerformanceFailure', () => {
    it('should create high severity for significant regression', () => {
      const issue = IssueFactory.createFromPerformanceFailure({
        testName: 'pageLoadTime',
        expectedDuration: 1000,
        actualDuration: 2000,
        unit: 'ms',
        buildVersion: '1.0.0',
        detectedBy: 'Lighthouse',
        component: 'Frontend'
      });

      expect(issue.getTitle()).toContain('Performance Regression');
      expect(issue.getSeverity()).toBe(Severity.HIGH);
      expect(issue.getCategory()).toBe('PERFORMANCE');
    });

    it('should create medium severity for minor regression', () => {
      const issue = IssueFactory.createFromPerformanceFailure({
        testName: 'pageLoadTime',
        expectedDuration: 1000,
        actualDuration: 1200,
        unit: 'ms',
        buildVersion: '1.0.0',
        detectedBy: 'Lighthouse',
        component: 'Frontend'
      });

      expect(issue.getSeverity()).toBe(Severity.MEDIUM);
    });
  });

  describe('createFromLintError', () => {
    it('should create issue from lint error', () => {
      const issue = IssueFactory.createFromLintError({
        filePath: 'src/utils/helpers.ts',
        lineNumber: 42,
        rule: 'no-unused-vars',
        message: 'Variable "unused" is defined but never used',
        buildVersion: '1.0.0',
        detectedBy: 'ESLint'
      });

      expect(issue.getTitle()).toContain('Lint Error');
      expect(issue.getCategory()).toBe('LINT_ERROR');
      expect(issue.getSeverity()).toBe(Severity.MEDIUM);
    });
  });

  describe('createFromValidationFailure', () => {
    it('should create issue from validation failure', () => {
      const issue = IssueFactory.createFromValidationFailure({
        fieldName: 'email',
        validationRule: 'must be valid email format',
        actualValue: 'invalid-email',
        component: 'Auth',
        buildVersion: '1.0.0',
        detectedBy: 'ValidationEngine'
      });

      expect(issue.getTitle()).toContain('Validation Error');
      expect(issue.getTitle()).toContain('email');
      expect(issue.getCategory()).toBe('VALIDATION_ERROR');
    });
  });

  describe('createFromIntegrationFailure', () => {
    it('should create critical issue from integration failure', () => {
      const issue = IssueFactory.createFromIntegrationFailure({
        serviceName: 'PaymentGateway',
        operation: 'processPayment',
        errorCode: 'AUTH_FAILED',
        errorMessage: 'Authentication with payment gateway failed',
        buildVersion: '1.0.0',
        detectedBy: 'IntegrationTest'
      });

      expect(issue.getTitle()).toContain('Integration Error');
      expect(issue.getSeverity()).toBe(Severity.CRITICAL);
      expect(issue.getCategory()).toBe('INTEGRATION_ERROR');
    });
  });

  describe('createTestIssue', () => {
    it('should create default test issue', () => {
      const issue = IssueFactory.createTestIssue();
      expect(issue.getTitle()).toBe('Test Issue');
      expect(issue.getCategory()).toBe('TEST');
    });

    it('should allow overrides for test issue', () => {
      const issue = IssueFactory.createTestIssue({
        title: 'Custom Test Issue',
        severity: Severity.CRITICAL
      });

      expect(issue.getTitle()).toBe('Custom Test Issue');
      expect(issue.getSeverity()).toBe(Severity.CRITICAL);
    });
  });

  describe('validate', () => {
    it('should validate valid props', () => {
      const props = {
        title: 'Valid Issue',
        description: 'Valid Description',
        category: 'TEST',
        component: 'Component',
        severity: Severity.MEDIUM,
        rootCause: 'Cause',
        recommendation: 'Recommendation',
        consequenceIfResolved: 'Resolved',
        consequenceIfIgnored: 'Ignored',
        detectedBy: 'Tester',
        buildVersion: '1.0.0'
      };

      const result = IssueFactory.validate(props);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid title', () => {
      const props = {
        title: '',
        description: 'Description',
        category: 'TEST',
        component: 'Component',
        severity: Severity.MEDIUM,
        rootCause: 'Cause',
        recommendation: 'Recommendation',
        consequenceIfResolved: 'Resolved',
        consequenceIfIgnored: 'Ignored',
        detectedBy: 'Tester',
        buildVersion: '1.0.0'
      };

      const result = IssueFactory.validate(props);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Title is required');
    });

    it('should reject invalid severity', () => {
      const props = {
        title: 'Issue',
        description: 'Description',
        category: 'TEST',
        component: 'Component',
        severity: 'INVALID' as any,
        rootCause: 'Cause',
        recommendation: 'Recommendation',
        consequenceIfResolved: 'Resolved',
        consequenceIfIgnored: 'Ignored',
        detectedBy: 'Tester',
        buildVersion: '1.0.0'
      };

      const result = IssueFactory.validate(props);
      expect(result.valid).toBe(false);
    });

    it('should return multiple errors', () => {
      const props = {
        title: '',
        description: '',
        category: 'TEST',
        component: 'Component',
        severity: Severity.MEDIUM,
        rootCause: '',
        recommendation: '',
        consequenceIfResolved: 'Resolved',
        consequenceIfIgnored: 'Ignored',
        detectedBy: 'Tester',
        buildVersion: '1.0.0'
      };

      const result = IssueFactory.validate(props);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
    });
  });

  describe('reconstituteFromPersistence', () => {
    it('should reconstruct from persistence data', () => {
      const original = IssueFactory.createTestIssue();
      const persisted = original.toPersistence();
      const reconstructed = IssueFactory.reconstituteFromPersistence(persisted);

      expect(reconstructed.getTitle()).toBe(original.getTitle());
      expect(reconstructed.getIssueId().getValue()).toBe(original.getIssueId().getValue());
    });
  });
});
