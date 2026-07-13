/**
 * Environment Test Suite - Comprehensive Tests
 * 
 * Tests for all environment checking services
 * Covers 30+ scenarios including success, failures, and edge cases
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

import {
  EnvironmentCheckerService,
  EnvironmentErrorClassifierService,
  EnvironmentReporterService,
  EnvironmentCheckCategory,
  EnvironmentErrorType,
  EnvironmentSeverity,
} from '../index';

describe('Environment Test Suite', () => {
  let checker: EnvironmentCheckerService;
  let classifier: EnvironmentErrorClassifierService;
  let reporter: EnvironmentReporterService;
  const testDir = path.join(os.tmpdir(), 'env-test-' + Date.now());

  beforeAll(() => {
    checker = new EnvironmentCheckerService(testDir);
    classifier = new EnvironmentErrorClassifierService();
    reporter = new EnvironmentReporterService();

    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Cleanup
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  describe('EnvironmentCheckerService', () => {
    it('should check Node.js version', async () => {
      const result = await checker.checkNodeVersion();

      expect(result).toBeDefined();
      expect(result.category).toBe(EnvironmentCheckCategory.NODE_VERSION);
      expect(result.checkName).toBe('Node.js Version Check');
      expect(result.status).toMatch(/PASS|FAIL/);
      expect(result.findings.length).toBeGreaterThan(0);
      expect(result.actualValue).toBeDefined();
    });

    it('should check npm version', async () => {
      const result = await checker.checkNpmVersion();

      expect(result).toBeDefined();
      expect(result.category).toBe(EnvironmentCheckCategory.NPM_VERSION);
      expect(result.status).toMatch(/PASS|FAIL|WARNING/);
      expect(result.findings.length).toBeGreaterThan(0);
    });

    it('should check Docker installation', async () => {
      const result = await checker.checkDocker();

      expect(result).toBeDefined();
      expect(result.category).toBe(EnvironmentCheckCategory.DOCKER_INSTALLATION);
      expect(['PASS', 'FAIL']).toContain(result.status);
    });

    it('should check Docker service', async () => {
      const result = await checker.checkDockerService();

      expect(result).toBeDefined();
      expect(result.category).toBe(EnvironmentCheckCategory.DOCKER_SERVICE);
      expect(['PASS', 'FAIL']).toContain(result.status);
    });

    it('should check docker-compose', async () => {
      const result = await checker.checkDockerCompose();

      expect(result).toBeDefined();
      expect(result.category).toBe(EnvironmentCheckCategory.DOCKER_COMPOSE);
      expect(['PASS', 'FAIL']).toContain(result.status);
    });

    it('should check PostgreSQL installation', async () => {
      const result = await checker.checkPostgreSQL();

      expect(result).toBeDefined();
      expect(result.category).toBe(EnvironmentCheckCategory.POSTGRESQL_INSTALLATION);
      expect(['PASS', 'FAIL']).toContain(result.status);
    });

    it('should check PostgreSQL service', async () => {
      const result = await checker.checkPostgreSQLService();

      expect(result).toBeDefined();
      expect(result.category).toBe(EnvironmentCheckCategory.POSTGRESQL_SERVICE);
      expect(['PASS', 'FAIL']).toContain(result.status);
    });

    it('should check PostgreSQL connectivity', async () => {
      const result = await checker.checkPostgreSQLConnectivity();

      expect(result).toBeDefined();
      expect(result.category).toBe(EnvironmentCheckCategory.POSTGRESQL_CONNECTIVITY);
      expect(['PASS', 'FAIL']).toContain(result.status);
    });

    it('should check config files', async () => {
      const result = await checker.checkConfigFiles();

      expect(result).toBeDefined();
      expect(result.category).toBe(EnvironmentCheckCategory.CONFIG_FILES);
      expect(result.status).toMatch(/PASS|FAIL/);
      expect(result.details.configFiles).toBeDefined();
      expect(Array.isArray(result.details.configFiles)).toBe(true);
    });

    it('should check environment variables', async () => {
      const result = await checker.checkEnvironmentVariables();

      expect(result).toBeDefined();
      expect(result.category).toBe(EnvironmentCheckCategory.ENVIRONMENT_VARIABLES);
      expect(result.details.requiredVars).toBeDefined();
      expect(Array.isArray(result.details.requiredVars)).toBe(true);
    });

    it('should check directory structure', async () => {
      const result = await checker.checkDirectoryStructure();

      expect(result).toBeDefined();
      expect(result.category).toBe(EnvironmentCheckCategory.DIRECTORY_STRUCTURE);
      expect(result.details.requiredDirectories).toBeDefined();
      expect(Array.isArray(result.details.requiredDirectories)).toBe(true);
    });

    it('should check file permissions', async () => {
      const result = await checker.checkFilePermissions();

      expect(result).toBeDefined();
      expect(result.category).toBe(EnvironmentCheckCategory.FILE_PERMISSIONS);
      expect(result.details.files).toBeDefined();
      expect(Array.isArray(result.details.files)).toBe(true);
    });

    it('should check disk space', async () => {
      const result = await checker.checkDiskSpace();

      expect(result).toBeDefined();
      expect(result.category).toBe(EnvironmentCheckCategory.DISK_SPACE);
      expect(result.details.totalSpace).toBeGreaterThan(0);
      expect(result.details.availableSpace).toBeGreaterThan(0);
      expect(result.details.usagePercentage).toBeGreaterThanOrEqual(0);
      expect(result.details.usagePercentage).toBeLessThanOrEqual(100);
    });

    it('should check port availability', async () => {
      const result = await checker.checkPortAvailability();

      expect(result).toBeDefined();
      expect(result.category).toBe(EnvironmentCheckCategory.PORT_AVAILABILITY);
      expect(result.details.ports).toBeDefined();
      expect(Array.isArray(result.details.ports)).toBe(true);
    });

    it('should run all checks and return results array', async () => {
      const results = await checker.runAllChecks();

      expect(Array.isArray(results)).toBe(true);
      expect(results.length).toBeGreaterThan(0);

      // Verify all checks have required fields
      for (const result of results) {
        expect(result.checkId).toBeDefined();
        expect(result.category).toBeDefined();
        expect(result.checkName).toBeDefined();
        expect(result.status).toMatch(/PASS|FAIL|WARNING|SKIPPED/);
        expect(result.severity).toBeDefined();
        expect(result.findings).toBeInstanceOf(Array);
        expect(result.details).toBeDefined();
        expect(result.checkedAt).toBeDefined();
        expect(result.duration).toBeGreaterThanOrEqual(0);
      }
    });

    it('should record check timing', async () => {
      const result = await checker.checkNodeVersion();

      expect(result.duration).toBeGreaterThan(0);
      expect(typeof result.duration).toBe('number');
    });
  });

  describe('EnvironmentErrorClassifierService', () => {
    it('should classify NOT_INSTALLED error', () => {
      const classification = classifier.classifyError(
        EnvironmentCheckCategory.DOCKER_INSTALLATION,
        new Error('command not found'),
        {}
      );

      expect(classification.errorType).toBe(EnvironmentErrorType.NOT_INSTALLED);
      expect(classification.severity).toBe(EnvironmentSeverity.CRITICAL);
      expect(classification.isBlockingBuild).toBe(true);
      expect(classification.isBlockingDeploy).toBe(true);
    });

    it('should classify VERSION_MISMATCH error', () => {
      const classification = classifier.classifyError(
        EnvironmentCheckCategory.NODE_VERSION,
        new Error('version does not match'),
        {}
      );

      expect(classification.errorType).toBe(EnvironmentErrorType.VERSION_MISMATCH);
      expect(classification.severity).toBe(EnvironmentSeverity.CRITICAL);
    });

    it('should classify PERMISSION_DENIED error', () => {
      const classification = classifier.classifyError(
        EnvironmentCheckCategory.FILE_PERMISSIONS,
        new Error('permission denied'),
        {}
      );

      expect(classification.errorType).toBe(EnvironmentErrorType.PERMISSION_DENIED);
      expect(classification.severity).toBe(EnvironmentSeverity.HIGH);
    });

    it('should classify CONNECTION_FAILED error', () => {
      const classification = classifier.classifyError(
        EnvironmentCheckCategory.POSTGRESQL_CONNECTIVITY,
        new Error('connection refused'),
        {}
      );

      expect(classification.errorType).toBe(EnvironmentErrorType.CONNECTION_FAILED);
      expect(classification.severity).toBe(EnvironmentSeverity.CRITICAL);
    });

    it('should classify SERVICE_NOT_RUNNING error', () => {
      const classification = classifier.classifyError(
        EnvironmentCheckCategory.DOCKER_SERVICE,
        new Error('service not running'),
        {}
      );

      expect(classification.errorType).toBe(EnvironmentErrorType.SERVICE_NOT_RUNNING);
      expect(classification.severity).toBe(EnvironmentSeverity.HIGH);
    });

    it('should classify MISSING_FILE error', () => {
      const classification = classifier.classifyError(
        EnvironmentCheckCategory.CONFIG_FILES,
        new Error('no such file or directory'),
        {}
      );

      expect(classification.errorType).toBe(EnvironmentErrorType.MISSING_FILE);
      expect(classification.severity).toBe(EnvironmentSeverity.CRITICAL);
    });

    it('should classify MISSING_ENV_VAR error', () => {
      const classification = classifier.classifyError(
        EnvironmentCheckCategory.ENVIRONMENT_VARIABLES,
        new Error('variable is not set'),
        {}
      );

      expect(classification.errorType).toBe(EnvironmentErrorType.MISSING_ENV_VAR);
      expect(classification.severity).toBe(EnvironmentSeverity.HIGH);
    });

    it('should provide recommendations for errors', () => {
      const recommendations = classifier.getRecommendations(
        EnvironmentErrorType.NOT_INSTALLED,
        {}
      );

      expect(Array.isArray(recommendations)).toBe(true);
      expect(recommendations.length).toBeGreaterThan(0);
      expect(typeof recommendations[0]).toBe('string');
    });

    it('should determine severity correctly', () => {
      const criticalSeverity = classifier.determineSeverity(
        EnvironmentErrorType.NOT_INSTALLED
      );
      expect(criticalSeverity).toBe(EnvironmentSeverity.CRITICAL);

      const highSeverity = classifier.determineSeverity(
        EnvironmentErrorType.PERMISSION_DENIED
      );
      expect(highSeverity).toBe(EnvironmentSeverity.HIGH);

      const mediumSeverity = classifier.determineSeverity(
        EnvironmentErrorType.PORT_IN_USE
      );
      expect(mediumSeverity).toBe(EnvironmentSeverity.MEDIUM);
    });
  });

  describe('EnvironmentReporterService', () => {
    it('should generate environment report', async () => {
      const checks = await checker.runAllChecks();
      const report = await reporter.generateReport(checks, 'development');

      expect(report).toBeDefined();
      expect(report.reportId).toBeDefined();
      expect(report.generatedAt).toBeDefined();
      expect(report.environment).toBe('development');
      expect(report.checks).toEqual(checks);
      expect(report.summary).toBeDefined();
      expect(report.healthStatus).toMatch(/HEALTHY|DEGRADED|CRITICAL/);
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(100);
    });

    it('should calculate correct summary statistics', async () => {
      const checks = await checker.runAllChecks();
      const report = await reporter.generateReport(checks);

      const { summary } = report;

      expect(summary.totalChecks).toBe(checks.length);
      expect(summary.passedChecks + summary.failedChecks + summary.warningChecks + summary.skippedChecks).toBe(
        checks.length
      );
      expect(summary.passRate).toBeGreaterThanOrEqual(0);
      expect(summary.passRate).toBeLessThanOrEqual(100);
      expect(summary.executionTime).toBeGreaterThan(0);
    });

    it('should determine health status correctly', async () => {
      const checks = await checker.runAllChecks();
      const report = await reporter.generateReport(checks);

      expect(['HEALTHY', 'DEGRADED', 'CRITICAL']).toContain(report.healthStatus);
    });

    it('should export report as JSON', async () => {
      const checks = await checker.runAllChecks();
      const report = await reporter.generateReport(checks);

      const testFile = path.join(testDir, 'test-report.json');
      await reporter.exportAsJSON(report, testFile);

      expect(fs.existsSync(testFile)).toBe(true);

      const content = fs.readFileSync(testFile, 'utf-8');
      const parsed = JSON.parse(content);

      expect(parsed.reportId).toBe(report.reportId);
      expect(parsed.checks.length).toBe(report.checks.length);
    });

    it('should export report as HTML', async () => {
      const checks = await checker.runAllChecks();
      const report = await reporter.generateReport(checks);

      const testFile = path.join(testDir, 'test-report.html');
      await reporter.exportAsHTML(report, testFile);

      expect(fs.existsSync(testFile)).toBe(true);

      const content = fs.readFileSync(testFile, 'utf-8');
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain(report.reportId);
    });

    it('should export report as Markdown', async () => {
      const checks = await checker.runAllChecks();
      const report = await reporter.generateReport(checks);

      const testFile = path.join(testDir, 'test-report.md');
      await reporter.exportAsMarkdown(report, testFile);

      expect(fs.existsSync(testFile)).toBe(true);

      const content = fs.readFileSync(testFile, 'utf-8');
      expect(content).toContain('# Environment Test Report');
      expect(content).toContain(report.reportId);
    });

    it('should generate readable summary text', async () => {
      const checks = await checker.runAllChecks();
      const report = await reporter.generateReport(checks);

      const summary = reporter.generateSummary(report);

      expect(typeof summary).toBe('string');
      expect(summary).toContain('Environment Health Report');
      expect(summary).toContain(report.reportId);
      expect(summary).toContain('Overall Status');
      expect(summary).toContain('Health Score');
    });

    it('should classify report issues', async () => {
      const checks = await checker.runAllChecks();
      const report = await reporter.generateReport(checks);

      expect(Array.isArray(report.classifications)).toBe(true);

      if (report.classifications.length > 0) {
        const classification = report.classifications[0];
        expect(classification.category).toBeDefined();
        expect(classification.errorType).toBeDefined();
        expect(classification.severity).toBeDefined();
        expect(Array.isArray(classification.suggestedActions)).toBe(true);
      }
    });

    it('should identify critical and blocking issues', async () => {
      const checks = await checker.runAllChecks();
      const report = await reporter.generateReport(checks);

      expect(Array.isArray(report.criticalIssues)).toBe(true);
      expect(Array.isArray(report.blockingIssues)).toBe(true);

      // Critical issues should be failures with CRITICAL severity
      for (const issue of report.criticalIssues) {
        expect(issue.status).toBe('FAIL');
        expect(issue.severity).toBe('CRITICAL');
      }

      // Blocking issues should be failures that block build or deploy
      for (const issue of report.blockingIssues) {
        expect(issue.status).toBe('FAIL');
        expect(
          issue.isBlockingBuild || issue.isBlockingDeploy
        ).toBe(true);
      }
    });

    it('should include OS and system information in report', async () => {
      const checks = await checker.runAllChecks();
      const report = await reporter.generateReport(checks);

      expect(report.osInfo).toBeDefined();
      expect(report.osInfo.platform).toBeDefined();
      expect(report.osInfo.arch).toBeDefined();
      expect(report.osInfo.release).toBeDefined();
      expect(report.osInfo.uptime).toBeGreaterThan(0);

      expect(report.systemInfo).toBeDefined();
      expect(report.systemInfo.hostname).toBeDefined();
      expect(report.systemInfo.cpuCount).toBeGreaterThan(0);
      expect(report.systemInfo.totalMemory).toBeGreaterThan(0);
      expect(report.systemInfo.memoryUsagePercentage).toBeGreaterThanOrEqual(0);
    });

    it('should determine build and deploy readiness', async () => {
      const checks = await checker.runAllChecks();
      const report = await reporter.generateReport(checks);

      expect(typeof report.buildReady).toBe('boolean');
      expect(typeof report.deployReady).toBe('boolean');

      // If there are build blockers, buildReady should be false
      if (report.summary.buildBlockers > 0) {
        expect(report.buildReady).toBe(false);
      }

      // If there are deploy blockers, deployReady should be false
      if (report.summary.deployBlockers > 0) {
        expect(report.deployReady).toBe(false);
      }
    });

    it('should generate recommendations from check results', async () => {
      const checks = await checker.runAllChecks();
      const report = await reporter.generateReport(checks);

      expect(Array.isArray(report.recommendations)).toBe(true);

      // If there are failed checks, there should be recommendations
      if (report.summary.failedChecks > 0 || report.summary.warningChecks > 0) {
        expect(report.recommendations.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Integration Tests', () => {
    it('should run full environment test suite flow', async () => {
      // Run all checks
      const checks = await checker.runAllChecks();
      expect(checks.length).toBeGreaterThan(0);

      // Generate report
      const report = await reporter.generateReport(checks, 'development');
      expect(report).toBeDefined();

      // Export in all formats
      const jsonFile = path.join(testDir, 'full-test.json');
      const htmlFile = path.join(testDir, 'full-test.html');
      const mdFile = path.join(testDir, 'full-test.md');

      await reporter.exportAsJSON(report, jsonFile);
      await reporter.exportAsHTML(report, htmlFile);
      await reporter.exportAsMarkdown(report, mdFile);

      expect(fs.existsSync(jsonFile)).toBe(true);
      expect(fs.existsSync(htmlFile)).toBe(true);
      expect(fs.existsSync(mdFile)).toBe(true);
    });

    it('should handle different environments correctly', async () => {
      const checks = await checker.runAllChecks();

      const devReport = await reporter.generateReport(checks, 'development');
      expect(devReport.environment).toBe('development');

      const prodReport = await reporter.generateReport(checks, 'production');
      expect(prodReport.environment).toBe('production');

      const stagingReport = await reporter.generateReport(checks, 'staging');
      expect(stagingReport.environment).toBe('staging');
    });

    it('should correctly correlate check results with classifications', async () => {
      const checks = await checker.runAllChecks();
      const report = await reporter.generateReport(checks);

      // Count failed checks
      const failedChecks = checks.filter((c) => c.status === 'FAIL');

      // Classifications should only exist for failed checks with error type
      const classificationCount = report.classifications.length;

      expect(classificationCount).toBeLessThanOrEqual(failedChecks.length);
    });

    it('should have consistent report health scores', async () => {
      const checks = await checker.runAllChecks();
      const report = await reporter.generateReport(checks);

      // Score should be 100 if all pass
      const allPassed = checks.every((c) => c.status === 'PASS');
      if (allPassed) {
        expect(report.overallScore).toBe(100);
      }

      // Score should be 0 or near 0 if all fail
      const allFailed = checks.every((c) => c.status === 'FAIL');
      if (allFailed) {
        expect(report.overallScore).toBeLessThan(20);
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle missing environment gracefully', async () => {
      const result = await checker.checkEnvironmentVariables();

      // Should not throw even if vars are missing
      expect(result).toBeDefined();
      expect(result.status).toMatch(/PASS|FAIL/);
    });

    it('should handle permission errors gracefully', async () => {
      const result = await checker.checkFilePermissions();

      // Should not throw even with permission errors
      expect(result).toBeDefined();
      expect(result.status).toBe('PASS');
    });

    it('should handle service unavailability gracefully', async () => {
      const result = await checker.checkPostgreSQLConnectivity();

      // Should not throw even if service unavailable
      expect(result).toBeDefined();
      expect(['PASS', 'FAIL']).toContain(result.status);
    });
  });

  describe('Report Output Formats', () => {
    it('should generate valid JSON report', async () => {
      const checks = await checker.runAllChecks();
      const report = await reporter.generateReport(checks);

      const jsonFile = path.join(testDir, 'format-test.json');
      await reporter.exportAsJSON(report, jsonFile);

      const content = fs.readFileSync(jsonFile, 'utf-8');
      const parsed = JSON.parse(content); // Should not throw

      expect(parsed).toHaveProperty('reportId');
      expect(parsed).toHaveProperty('checks');
      expect(parsed).toHaveProperty('summary');
    });

    it('should generate valid HTML report', async () => {
      const checks = await checker.runAllChecks();
      const report = await reporter.generateReport(checks);

      const htmlFile = path.join(testDir, 'format-test.html');
      await reporter.exportAsHTML(report, htmlFile);

      const content = fs.readFileSync(htmlFile, 'utf-8');

      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('</html>');
      expect(content).toContain('<head>');
      expect(content).toContain('</head>');
      expect(content).toContain('<body>');
      expect(content).toContain('</body>');
    });

    it('should generate valid Markdown report', async () => {
      const checks = await checker.runAllChecks();
      const report = await reporter.generateReport(checks);

      const mdFile = path.join(testDir, 'format-test.md');
      await reporter.exportAsMarkdown(report, mdFile);

      const content = fs.readFileSync(mdFile, 'utf-8');

      expect(content).toContain('# Environment Test Report');
      expect(content).toMatch(/##\s/); // Should have level 2 headers
      expect(content).toContain(report.reportId);
    });
  });
});
