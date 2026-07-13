import { Issue, IssueProps, IssueStatus } from './Issue';
import { Severity } from './Severity';
import { IssueId } from './IssueId';

/**
 * Issue Factory für DDD-konforme Erstellung von Issues
 *
 * Verantwortlich für:
 * - Konsistente Issue-Erstellung
 * - Business-Rule Validierung
 * - Standardwerte und Defaults
 * - Rekonstruktion aus verschiedenen Quellen
 */
export class IssueFactory {
  /**
   * Erstellt ein neues Issue mit allen erforderlichen Informationen
   */
  static createIssue(props: IssueProps): Issue {
    return Issue.create(props);
  }

  /**
   * Erstellt ein Issue aus Test-Fehler
   * Häufiger Use-Case: Testlauf generiert Issue
   */
  static createFromTestFailure(props: {
    testName: string;
    testSuite: string;
    errorMessage: string;
    failureReason: string;
    buildVersion: string;
    component: string;
    detectedBy: string;
  }): Issue {
    return Issue.create({
      title: `Test Failure: ${props.testName}`,
      description: `Test Suite: ${props.testSuite}\nError: ${props.errorMessage}`,
      category: 'TEST_FAILURE',
      component: props.component,
      severity: Severity.HIGH,
      rootCause: props.failureReason,
      recommendation: 'Review test and fix failing code or update test expectations',
      consequenceIfResolved: 'Test suite will pass, CI/CD pipeline continues',
      consequenceIfIgnored: 'Test remains red, blocks deployment pipeline',
      detectedBy: props.detectedBy,
      buildVersion: props.buildVersion,
      timestamp: new Date()
    });
  }

  /**
   * Erstellt ein Issue aus Lint-Fehler
   */
  static createFromLintError(props: {
    filePath: string;
    lineNumber: number;
    rule: string;
    message: string;
    buildVersion: string;
    detectedBy: string;
  }): Issue {
    return Issue.create({
      title: `Lint Error: ${props.rule}`,
      description: `File: ${props.filePath}:${props.lineNumber}\nMessage: ${props.message}`,
      category: 'LINT_ERROR',
      component: props.filePath.split('/')[0],
      severity: Severity.MEDIUM,
      rootCause: `Code violates lint rule: ${props.rule}`,
      recommendation: 'Apply linter auto-fix or manually adjust code',
      consequenceIfResolved: 'Code quality improved, linter passes',
      consequenceIfIgnored: 'Build may fail, code quality decreases',
      detectedBy: props.detectedBy,
      buildVersion: props.buildVersion,
      timestamp: new Date()
    });
  }

  /**
   * Erstellt ein Issue aus API Test Fehler
   */
  static createFromApiTestFailure(props: {
    endpoint: string;
    method: string;
    expectedStatus: number;
    actualStatus: number;
    responseBody: string;
    buildVersion: string;
    detectedBy: string;
  }): Issue {
    return Issue.create({
      title: `API Test Failed: ${props.method} ${props.endpoint}`,
      description: `Expected Status: ${props.expectedStatus}, Actual: ${props.actualStatus}\nResponse: ${props.responseBody.substring(0, 200)}...`,
      category: 'API_TEST_FAILURE',
      component: 'API',
      severity: props.actualStatus >= 500 ? Severity.CRITICAL : Severity.HIGH,
      rootCause: `API endpoint returned unexpected status or response`,
      recommendation: 'Fix API implementation to match contract specification',
      consequenceIfResolved: 'API works as documented, integration tests pass',
      consequenceIfIgnored: 'API contract broken, client integrations fail',
      detectedBy: props.detectedBy,
      buildVersion: props.buildVersion,
      timestamp: new Date()
    });
  }

  /**
   * Erstellt ein Issue aus Performance-Test Fehler
   */
  static createFromPerformanceFailure(props: {
    testName: string;
    expectedDuration: number;
    actualDuration: number;
    unit: string;
    buildVersion: string;
    detectedBy: string;
    component: string;
  }): Issue {
    const duration = props.actualDuration - props.expectedDuration;
    return Issue.create({
      title: `Performance Regression: ${props.testName}`,
      description: `Expected: ${props.expectedDuration}${props.unit}, Actual: ${props.actualDuration}${props.unit} (${duration > 0 ? '+' : ''}${duration}${props.unit})`,
      category: 'PERFORMANCE',
      component: props.component,
      severity: duration > props.expectedDuration * 0.5 ? Severity.HIGH : Severity.MEDIUM,
      rootCause: 'Performance degradation detected',
      recommendation: 'Profile code and optimize bottlenecks',
      consequenceIfResolved: 'Performance meets SLA requirements',
      consequenceIfIgnored: 'System will be slow, user experience degrades',
      detectedBy: props.detectedBy,
      buildVersion: props.buildVersion,
      timestamp: new Date()
    });
  }

  /**
   * Erstellt ein Issue aus Validierungs-Fehler
   */
  static createFromValidationFailure(props: {
    fieldName: string;
    validationRule: string;
    actualValue: string;
    component: string;
    buildVersion: string;
    detectedBy: string;
  }): Issue {
    return Issue.create({
      title: `Validation Error: ${props.fieldName}`,
      description: `Field "${props.fieldName}" failed validation: ${props.validationRule}\nActual value: ${props.actualValue}`,
      category: 'VALIDATION_ERROR',
      component: props.component,
      severity: Severity.MEDIUM,
      rootCause: `Invalid data provided for ${props.fieldName}`,
      recommendation: 'Implement proper input validation and error handling',
      consequenceIfResolved: 'Data integrity is maintained',
      consequenceIfIgnored: 'Invalid data enters system, causes downstream errors',
      detectedBy: props.detectedBy,
      buildVersion: props.buildVersion,
      timestamp: new Date()
    });
  }

  /**
   * Erstellt ein Issue aus Integrations-Fehler
   */
  static createFromIntegrationFailure(props: {
    serviceName: string;
    operation: string;
    errorCode: string;
    errorMessage: string;
    buildVersion: string;
    detectedBy: string;
  }): Issue {
    return Issue.create({
      title: `Integration Error: ${props.serviceName} - ${props.operation}`,
      description: `Service: ${props.serviceName}\nOperation: ${props.operation}\nError Code: ${props.errorCode}\nMessage: ${props.errorMessage}`,
      category: 'INTEGRATION_ERROR',
      component: props.serviceName,
      severity: Severity.CRITICAL,
      rootCause: `${props.serviceName} service integration failed`,
      recommendation: `Check ${props.serviceName} service status, credentials, and API compatibility`,
      consequenceIfResolved: 'Integration restored, system can communicate with external service',
      consequenceIfIgnored: 'Feature dependent on integration becomes unavailable',
      detectedBy: props.detectedBy,
      buildVersion: props.buildVersion,
      timestamp: new Date()
    });
  }

  /**
   * Rekonstruiert ein Issue aus persistierten Daten
   */
  static reconstituteFromPersistence(data: any): Issue {
    return Issue.fromPersistence(data);
  }

  /**
   * Erstellt ein leeres/Platzhalter Issue für Testing
   */
  static createTestIssue(overrides?: Partial<IssueProps>): Issue {
    const defaults: IssueProps = {
      title: 'Test Issue',
      description: 'This is a test issue',
      category: 'TEST',
      component: 'TEST_COMPONENT',
      severity: Severity.MEDIUM,
      rootCause: 'Test root cause',
      recommendation: 'Test recommendation',
      consequenceIfResolved: 'Test will be fixed',
      consequenceIfIgnored: 'Test will remain broken',
      detectedBy: 'TEST_RUNNER',
      buildVersion: '1.0.0-test',
      timestamp: new Date()
    };

    return Issue.create({
      ...defaults,
      ...overrides
    });
  }

  /**
   * Validiert ein Issue Props Objekt
   */
  static validate(props: IssueProps): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!props.title || props.title.trim().length === 0) {
      errors.push('Title is required');
    }
    if (props.title && props.title.length > 255) {
      errors.push('Title must not exceed 255 characters');
    }
    if (!props.description || props.description.trim().length === 0) {
      errors.push('Description is required');
    }
    if (!props.category || props.category.trim().length === 0) {
      errors.push('Category is required');
    }
    if (!props.component || props.component.trim().length === 0) {
      errors.push('Component is required');
    }
    if (!Object.values(Severity).includes(props.severity)) {
      errors.push(`Invalid severity: ${props.severity}`);
    }
    if (!props.rootCause || props.rootCause.trim().length === 0) {
      errors.push('RootCause is required');
    }
    if (!props.recommendation || props.recommendation.trim().length === 0) {
      errors.push('Recommendation is required');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
