/**
 * Environment Validation Suite
 * 
 * Exportiert alle Validierungs-Funktionen, Logger und Report Generator
 */

export { ValidationLogger, globalLogger, type LogLevel, type LogEntry } from './logger/validation-logger';

export {
  validateNodeVersion,
  validateNpmVersion,
  validateDockerInstallation,
  validateDatabaseConnection,
  validateConfigurationFiles,
  validateEnvironmentVariables,
  validateNpmDependencies,
  validateDockerComposeConfig,
  parseVersion,
} from './validators/environment-validators';

export { ReportGenerator, type ValidationReport } from './report/report-generator';
