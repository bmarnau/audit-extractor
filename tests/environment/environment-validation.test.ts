/**
 * Environment Validation Test Suite
 * Führt alle Environment Checks durch und generiert einen Report
 */

import * as path from 'path';
import {
  ValidationLogger,
  validateNodeVersion,
  validateNpmVersion,
  validateDockerInstallation,
  validateDatabaseConnection,
  validateConfigurationFiles,
  validateEnvironmentVariables,
  validateNpmDependencies,
  validateDockerComposeConfig,
  ReportGenerator,
} from '../../src/infrastructure/environment-validation';

describe('Environment Validation Suite', () => {
  let logger: ValidationLogger;
  const projectRoot = process.cwd();

  beforeEach(() => {
    logger = new ValidationLogger();
  });

  describe('Node.js Version Check', () => {
    it('should validate Node.js version', async () => {
      const result = await validateNodeVersion(logger, '18.0.0');
      expect(typeof result).toBe('boolean');
      expect(logger.getAllLogs().length).toBeGreaterThan(0);
    });

    it('should detect old Node.js version', async () => {
      const result = await validateNodeVersion(logger, '99.0.0');
      expect(result).toBe(false);
      expect(logger.hasErrors()).toBe(true);
    });
  });

  describe('npm Version Check', () => {
    it('should validate npm version', async () => {
      const result = await validateNpmVersion(logger, '9.0.0');
      expect(typeof result).toBe('boolean');
      expect(logger.getAllLogs().length).toBeGreaterThan(0);
    });

    it('should handle npm version validation', async () => {
      const result = await validateNpmVersion(logger, '9.0.0');
      const logs = logger.getAllLogs();
      expect(logs.some((log) => log.component === 'npm')).toBe(true);
    });
  });

  describe('Docker Installation Check', () => {
    it('should validate Docker installation', async () => {
      const result = await validateDockerInstallation(logger);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Configuration Files Check', () => {
    it('should validate required configuration files', async () => {
      const result = await validateConfigurationFiles(logger, [], projectRoot);
      expect(typeof result).toBe('boolean');
    });

    it('should report missing configuration files', async () => {
      const result = await validateConfigurationFiles(
        logger,
        ['non-existent-file.json', 'another-missing.yml'],
        projectRoot
      );
      expect(logger.getAllLogs().length).toBeGreaterThan(0);
    });
  });

  describe('Environment Variables Check', () => {
    it('should validate environment variables', async () => {
      const result = await validateEnvironmentVariables(logger);
      expect(typeof result).toBe('boolean');
    });

    it('should detect missing required variables', async () => {
      const result = await validateEnvironmentVariables(logger, ['NON_EXISTENT_VAR_12345']);
      expect(logger.getErrors().length).toBeGreaterThan(0);
    });

    it('should handle optional variables', async () => {
      const result = await validateEnvironmentVariables(logger, [], ['OPTIONAL_VAR_DOES_NOT_EXIST']);
      const warnings = logger.getWarnings();
      expect(warnings.length).toBeGreaterThan(0);
    });
  });

  describe('npm Dependencies Check', () => {
    it('should validate npm dependencies are installed', async () => {
      const result = await validateNpmDependencies(logger, projectRoot);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Docker Compose Config Check', () => {
    it('should validate docker-compose configuration', async () => {
      const result = await validateDockerComposeConfig(logger, projectRoot);
      expect(typeof result).toBe('boolean');
    });
  });

  describe('Complete Environment Validation', () => {
    it('should run all validation checks', async () => {
      // Node Version
      await validateNodeVersion(logger, '18.0.0');

      // npm Version
      await validateNpmVersion(logger, '9.0.0');

      // Docker
      await validateDockerInstallation(logger);

      // Configuration Files
      await validateConfigurationFiles(logger, [], projectRoot);

      // Environment Variables (mit realistischen Checks)
      await validateEnvironmentVariables(
        logger,
        ['NODE_ENV'],
        ['OPTIONAL_VAR']
      );

      // npm Dependencies
      await validateNpmDependencies(logger, projectRoot);

      // Docker Compose
      await validateDockerComposeConfig(logger, projectRoot);

      // Prüfe dass Logs erfasst wurden
      const allLogs = logger.getAllLogs();
      expect(allLogs.length).toBeGreaterThan(0);

      // Prüfe Summary
      const summary = logger.getSummary();
      expect(summary.total).toBeGreaterThan(0);
      expect(summary.duration).toBeGreaterThanOrEqual(0);
    });

    it('should generate validation report', async () => {
      // Führe Checks durch
      await validateNodeVersion(logger, '18.0.0');
      await validateNpmVersion(logger, '9.0.0');
      await validateConfigurationFiles(logger, [], projectRoot);

      // Generiere Report
      const report = ReportGenerator.generateReport(logger);

      // Validiere Report Struktur
      expect(report.timestamp).toBeDefined();
      expect(report.environment).toBeDefined();
      expect(report.environment.nodeVersion).toBeDefined();
      expect(report.environment.platform).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.summary.total).toBeGreaterThan(0);
      expect(report.details).toBeDefined();
      expect(Array.isArray(report.recommendations)).toBe(true);
    });

    it('should export report as JSON', async () => {
      await validateNodeVersion(logger, '18.0.0');
      const report = ReportGenerator.generateReport(logger);

      const outputPath = path.join(projectRoot, 'test-results', 'env-validation-report.json');

      // Sollte nicht werfen
      expect(() => {
        ReportGenerator.exportJSON(report, outputPath);
      }).not.toThrow();
    });

    it('should export report as Markdown', async () => {
      await validateNodeVersion(logger, '18.0.0');
      const report = ReportGenerator.generateReport(logger);

      const outputPath = path.join(projectRoot, 'test-results', 'env-validation-report.md');

      // Sollte nicht werfen
      expect(() => {
        ReportGenerator.exportMarkdown(report, outputPath);
      }).not.toThrow();
    });

    it('should export report as HTML', async () => {
      await validateNodeVersion(logger, '18.0.0');
      const report = ReportGenerator.generateReport(logger);

      const outputPath = path.join(projectRoot, 'test-results', 'env-validation-report.html');

      // Sollte nicht werfen
      expect(() => {
        ReportGenerator.exportHTML(report, outputPath);
      }).not.toThrow();
    });
  });

  describe('Logger Functionality', () => {
    it('should log different severity levels', () => {
      logger.success('Component', 'Success message');
      logger.info('Component', 'Info message');
      logger.warning('Component', 'Warning message');
      logger.error('Component', 'Error message');

      expect(logger.getAllLogs().length).toBe(4);
      expect(logger.getErrors().length).toBe(1);
      expect(logger.getWarnings().length).toBe(1);
    });

    it('should provide summary information', () => {
      logger.success('Test', 'First test');
      logger.success('Test', 'Second test');
      logger.error('Test', 'Third test');

      const summary = logger.getSummary();
      expect(summary.total).toBe(3);
      expect(summary.successes).toBe(2);
      expect(summary.errors).toBe(1);
      expect(summary.duration).toBeGreaterThanOrEqual(0);
    });

    it('should check for errors', () => {
      expect(logger.hasErrors()).toBe(false);

      logger.error('Component', 'An error');
      expect(logger.hasErrors()).toBe(true);
    });

    it('should clear logs', () => {
      logger.success('Test', 'Message');
      expect(logger.getAllLogs().length).toBe(1);

      logger.clear();
      expect(logger.getAllLogs().length).toBe(0);
    });

    it('should export logs as JSON', () => {
      logger.success('Test', 'Message 1');
      logger.error('Test', 'Message 2');

      const json = logger.toJSON();
      expect(json.logs).toBeDefined();
      expect(json.logs.length).toBe(2);
      expect(json.summary).toBeDefined();
    });
  });

  describe('Integration Test', () => {
    it('should complete full validation workflow', async () => {
      console.log('\n📋 Starting complete environment validation...\n');

      // Step 1: Node.js
      await validateNodeVersion(logger, '18.0.0');

      // Step 2: npm
      await validateNpmVersion(logger, '9.0.0');

      // Step 3: Docker
      await validateDockerInstallation(logger);

      // Step 4: Config Files
      await validateConfigurationFiles(logger, [], projectRoot);

      // Step 5: Environment Variables
      await validateEnvironmentVariables(logger, ['NODE_ENV']);

      // Step 6: npm Dependencies
      await validateNpmDependencies(logger, projectRoot);

      // Step 7: Docker Compose
      await validateDockerComposeConfig(logger, projectRoot);

      // Generate Report
      const report = ReportGenerator.generateReport(logger);

      console.log('\n📊 Validation Summary:');
      console.log(`   Total: ${report.summary.total}`);
      console.log(`   Passed: ${report.summary.passed}`);
      console.log(`   Failed: ${report.summary.failed}`);
      console.log(`   Warnings: ${report.summary.warnings}`);
      console.log(`   Status: ${report.summary.success ? '✅ OK' : '❌ FAILED'}\n`);

      // Export Reports
      const reportDir = path.join(projectRoot, 'test-results');
      ReportGenerator.exportJSON(report, path.join(reportDir, 'env-validation.json'));
      ReportGenerator.exportMarkdown(report, path.join(reportDir, 'env-validation.md'));
      ReportGenerator.exportHTML(report, path.join(reportDir, 'env-validation.html'));

      // Assertions
      expect(report.summary.total).toBeGreaterThan(0);
      expect(report.environment).toBeDefined();
      expect(report.details).toBeDefined();
    });
  });
});
