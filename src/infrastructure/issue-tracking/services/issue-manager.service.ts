/**
 * ISSUE MANAGER SERVICE
 * 
 * High-level issue management with automatic ID generation,
 * validation, and integration with other services
 */

import {
  Issue,
  IssueCategory,
  IssuePriority,
  IssueStatus,
  RootCauseType,
  ImpactArea,
  IssueFilter,
  IssueSummary,
  IssueReport,
} from '../types/issue.types';
import { IssueRepositoryService } from './issue-repository.service';
import { SeverityLevel } from '../../governance/types/severity.types';

export class IssueManagerService {
  private repository: IssueRepositoryService;
  private issueCounter: number = 0;

  constructor(repository: IssueRepositoryService) {
    this.repository = repository;
  }

  /**
   * Generate unique issue ID
   */
  private generateIssueId(): string {
    const timestamp = Date.now();
    this.issueCounter++;
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ISS-${timestamp}-${random}`;
  }

  /**
   * Determine priority from severity level
   */
  private mapSeverityToPriority(severity: SeverityLevel): IssuePriority {
    switch (severity) {
      case SeverityLevel.CRITICAL:
        return IssuePriority.CRITICAL;
      case SeverityLevel.HIGH:
        return IssuePriority.HIGH;
      case SeverityLevel.MEDIUM:
        return IssuePriority.MEDIUM;
      case SeverityLevel.LOW:
        return IssuePriority.LOW;
      case SeverityLevel.INFO:
        return IssuePriority.TRIVIAL;
      default:
        return IssuePriority.MEDIUM;
    }
  }

  /**
   * Create issue from test failure
   */
  createFromTestFailure(
    testName: string,
    testFile: string,
    errorMessage: string,
    errorStackTrace: string,
    buildVersion: string,
    category: IssueCategory = IssueCategory.TEST_FAILURE,
    affectedComponent: string = 'Unknown',
    severity: SeverityLevel = SeverityLevel.HIGH
  ): Issue {
    const issue: Issue = {
      issueId: this.generateIssueId(),
      category,
      subcategory: testFile,
      priority: this.mapSeverityToPriority(severity),
      severity,
      status: IssueStatus.OPEN,
      title: `Test Failure: ${testName}`,
      description: `Test failed during test run:\n\nTest: ${testName}\nFile: ${testFile}\n\nError: ${errorMessage}`,
      stackTrace: errorStackTrace,
      errorMessage,
      rootCause: this.classifyError(errorMessage),
      rootCauseDescription: `Error occurs in ${testFile}`,
      rootCauseFileLocation: testFile,
      impactAreas: [ImpactArea.BUILD_PIPELINE],
      affectedComponents: [affectedComponent],
      consequenceIfNotFixed:
        'Test failures block the release pipeline and must be resolved before deployment',
      recommendedAction: `Debug the test failure in ${testFile} and fix the root cause of: ${errorMessage}`,
      buildVersion,
      detectionMethod: 'AUTOMATED_TEST',
      discoveredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    return this.repository.createIssue(issue);
  }

  /**
   * Create issue from code quality problem
   */
  createFromCodeQuality(
    title: string,
    description: string,
    file: string,
    line?: number,
    category: IssueCategory = IssueCategory.LINTING_ERROR,
    buildVersion: string = 'current',
    component: string = 'code-quality'
  ): Issue {
    const issue: Issue = {
      issueId: this.generateIssueId(),
      category,
      priority: IssuePriority.MEDIUM,
      severity: SeverityLevel.MEDIUM,
      status: IssueStatus.OPEN,
      title,
      description,
      rootCause: RootCauseType.MISSING_VALIDATION,
      rootCauseFileLocation: line ? `${file}:${line}` : file,
      impactAreas: [ImpactArea.BUILD_PIPELINE],
      affectedComponents: [component],
      consequenceIfNotFixed:
        'Code quality issues may accumulate and degrade codebase maintainability',
      recommendedAction: `Fix code quality issue in ${file}${line ? ` at line ${line}` : ''}`,
      buildVersion,
      detectionMethod: 'CODE_REVIEW',
      discoveredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    return this.repository.createIssue(issue);
  }

  /**
   * Create issue from coverage gap
   */
  createFromCoverageGap(
    component: string,
    uncoveredLines: number,
    targetCoverage: number,
    actualCoverage: number,
    buildVersion: string
  ): Issue {
    const gap = targetCoverage - actualCoverage;
    const issue: Issue = {
      issueId: this.generateIssueId(),
      category: IssueCategory.COVERAGE_GAP,
      priority: gap > 15 ? IssuePriority.HIGH : IssuePriority.MEDIUM,
      severity: gap > 15 ? SeverityLevel.HIGH : SeverityLevel.MEDIUM,
      status: IssueStatus.OPEN,
      title: `Coverage Gap: ${component} (${actualCoverage.toFixed(1)}% vs ${targetCoverage}%)`,
      description: `Component '${component}' has insufficient test coverage.\n\nTarget: ${targetCoverage}%\nActual: ${actualCoverage.toFixed(1)}%\nGap: ${gap.toFixed(1)}%\nUncovered Lines: ${uncoveredLines}`,
      rootCause: RootCauseType.MISSING_TEST,
      impactAreas: [ImpactArea.CORE_FUNCTIONALITY],
      affectedComponents: [component],
      consequenceIfNotFixed:
        'Insufficient test coverage means untested code paths could fail in production',
      recommendedAction: `Add tests to cover the ${uncoveredLines} uncovered lines in ${component}`,
      buildVersion,
      detectionMethod: 'AUTOMATED_TEST',
      discoveredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    return this.repository.createIssue(issue);
  }

  /**
   * Create issue from performance problem
   */
  createFromPerformance(
    component: string,
    metric: string,
    threshold: number,
    actualValue: number,
    buildVersion: string
  ): Issue {
    const issue: Issue = {
      issueId: this.generateIssueId(),
      category: IssueCategory.PERFORMANCE_DEGRADATION,
      priority: actualValue > threshold * 1.5 ? IssuePriority.HIGH : IssuePriority.MEDIUM,
      severity: actualValue > threshold * 1.5 ? SeverityLevel.HIGH : SeverityLevel.MEDIUM,
      status: IssueStatus.OPEN,
      title: `Performance Issue: ${component} ${metric}`,
      description: `Performance degradation detected in '${component}'.\n\nMetric: ${metric}\nThreshold: ${threshold}\nActual: ${actualValue}\nOverage: ${((actualValue / threshold - 1) * 100).toFixed(1)}%`,
      rootCause: RootCauseType.ASYNC_ERROR,
      impactAreas: [ImpactArea.PERFORMANCE, ImpactArea.USER_EXPERIENCE],
      affectedComponents: [component],
      consequenceIfNotFixed:
        'Performance issues lead to poor user experience and can cause production incidents',
      recommendedAction: `Investigate and optimize ${component} to improve ${metric}`,
      buildVersion,
      detectionMethod: 'MONITORING',
      discoveredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    return this.repository.createIssue(issue);
  }

  /**
   * Create issue from regression detection
   */
  createFromRegression(
    testName: string,
    previousBuild: string,
    currentBuild: string,
    message: string
  ): Issue {
    const issue: Issue = {
      issueId: this.generateIssueId(),
      category: IssueCategory.TEST_REGRESSION,
      priority: IssuePriority.CRITICAL,
      severity: SeverityLevel.CRITICAL,
      status: IssueStatus.OPEN,
      title: `Regression: ${testName}`,
      description: `Test regression detected between builds.\n\nTest: ${testName}\nPrevious Build: ${previousBuild}\nCurrent Build: ${currentBuild}\n\nDetails: ${message}`,
      rootCause: RootCauseType.LOGIC_ERROR,
      impactAreas: [ImpactArea.BUILD_PIPELINE, ImpactArea.CORE_FUNCTIONALITY],
      affectedComponents: ['testing'],
      consequenceIfNotFixed:
        'Regressions indicate broken functionality that was previously working and blocks release',
      recommendedAction: `Fix regression in ${testName} - likely caused by recent changes between ${previousBuild} and ${currentBuild}`,
      buildVersion: currentBuild,
      detectionMethod: 'AUTOMATED_TEST',
      discoveredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    return this.repository.createIssue(issue);
  }

  /**
   * Create issue from dependency problem
   */
  createFromDependency(
    packageName: string,
    currentVersion: string,
    vulnerabilityDescription: string,
    buildVersion: string
  ): Issue {
    const issue: Issue = {
      issueId: this.generateIssueId(),
      category: IssueCategory.DEPRECATED_DEPENDENCY,
      priority: IssuePriority.HIGH,
      severity: SeverityLevel.HIGH,
      status: IssueStatus.OPEN,
      title: `Dependency Issue: ${packageName}@${currentVersion}`,
      description: `Dependency issue detected.\n\nPackage: ${packageName}\nCurrent Version: ${currentVersion}\n\nIssue: ${vulnerabilityDescription}`,
      rootCause: RootCauseType.DEPENDENCY_VERSION,
      impactAreas: [ImpactArea.DEPENDENCIES, ImpactArea.SECURITY],
      affectedComponents: ['dependencies'],
      consequenceIfNotFixed:
        'Vulnerable or outdated dependencies pose security risks and may cause compatibility issues',
      recommendedAction: `Update ${packageName} to a patched version`,
      buildVersion,
      detectionMethod: 'CODE_REVIEW',
      discoveredAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    return this.repository.createIssue(issue);
  }

  /**
   * Classify error message to root cause
   */
  private classifyError(errorMessage: string): RootCauseType {
    const msg = errorMessage.toLowerCase();

    if (msg.includes('undefined') || msg.includes('null')) return RootCauseType.NULL_REFERENCE;
    if (msg.includes('type') || msg.includes('is not')) return RootCauseType.TYPE_ERROR;
    if (msg.includes('timeout')) return RootCauseType.TIMING_ISSUE;
    if (msg.includes('race') || msg.includes('concurrent')) return RootCauseType.RACE_CONDITION;
    if (msg.includes('async') || msg.includes('await')) return RootCauseType.ASYNC_ERROR;
    if (msg.includes('boundary') || msg.includes('range')) return RootCauseType.BOUNDARY_CONDITION;

    return RootCauseType.LOGIC_ERROR;
  }

  /**
   * Assign issue to team member
   */
  assignIssue(issueId: string, assignee: string): Issue {
    return this.repository.updateIssue(issueId, {
      assignedTo: assignee,
      status: IssueStatus.ACKNOWLEDGED,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Resolve issue
   */
  resolveIssue(
    issueId: string,
    resolutionSummary: string,
    verificationMethod?: string,
    commitRef?: string
  ): Issue {
    return this.repository.updateIssue(issueId, {
      status: IssueStatus.RESOLVED,
      resolvedAt: new Date().toISOString(),
      resolution: {
        resolvedAt: new Date().toISOString(),
        resolvedBy: 'system',
        resolutionType: 'FIXED',
        resolutionSummary,
        verificationMethod,
        commitReference: commitRef,
      },
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Close issue after verification
   */
  closeIssue(issueId: string, closureNotes?: string): Issue {
    return this.repository.updateIssue(issueId, {
      status: IssueStatus.CLOSED,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Mark issue as wont-fix
   */
  markAsWontFix(issueId: string, reason: string): Issue {
    return this.repository.updateIssue(issueId, {
      status: IssueStatus.WONT_FIX,
      updatedAt: new Date().toISOString(),
    });
  }

  /**
   * Get issues blocking release
   */
  getReleaseBlocers(buildVersion?: string): Issue[] {
    const filter: IssueFilter = {
      priorities: [IssuePriority.CRITICAL],
      statuses: [IssueStatus.OPEN, IssueStatus.IN_PROGRESS],
    };

    if (buildVersion) {
      filter.buildVersions = [buildVersion];
    }

    return this.repository.filterIssues(filter);
  }

  /**
   * Generate comprehensive issue report
   */
  generateReport(filter?: IssueFilter): IssueReport {
    const issues = filter ? this.repository.filterIssues(filter) : this.repository.getAllIssues();
    const summary = this.repository.calculateSummary();
    const criticalBlockers = this.getReleaseBlocers();

    return {
      generatedAt: new Date().toISOString(),
      totalIssues: issues.length,
      summary,
      issues,
      criticalBlockers,
    };
  }

  /**
   * Get issues summary
   */
  getSummary(): IssueSummary {
    return this.repository.calculateSummary();
  }

  /**
   * Get repository
   */
  getRepository(): IssueRepositoryService {
    return this.repository;
  }
}
