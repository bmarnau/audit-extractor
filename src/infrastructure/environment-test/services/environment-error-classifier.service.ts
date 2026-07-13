/**
 * Environment Error Classifier Service
 * 
 * Automatically classifies environment errors with severity, type, and recommendations
 */

import {
  EnvironmentCheckCategory,
  EnvironmentErrorType,
  EnvironmentSeverity,
  EnvironmentClassification,
  IEnvironmentErrorClassifier,
} from '../environment.types';

/**
 * Error Classifier Service
 */
export class EnvironmentErrorClassifierService implements IEnvironmentErrorClassifier {
  /**
   * Classify error based on category and details
   */
  classifyError(
    category: EnvironmentCheckCategory,
    error: Error | string,
    details?: Record<string, any>
  ): EnvironmentClassification {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorType = this.determineErrorType(category, errorMessage, details);
    const severity = this.determineSeverity(errorType);
    const isBlockingBuild = this.isBlockingBuild(errorType);
    const isBlockingDeploy = this.isBlockingDeploy(errorType);
    const rootCause = this.determineRootCause(errorType, errorMessage);
    const suggestedActions = this.getRecommendations(errorType, details);

    return {
      category,
      errorType,
      severity,
      isBlockingBuild,
      isBlockingDeploy,
      rootCause,
      suggestedActions,
    };
  }

  /**
   * Determine error type from error message
   */
  private determineErrorType(
    category: EnvironmentCheckCategory,
    errorMessage: string,
    details?: Record<string, any>
  ): EnvironmentErrorType {
    const message = errorMessage.toLowerCase();

    // Check for specific patterns
    if (
      message.includes('not found') ||
      message.includes('no such file') ||
      message.includes('enoent') ||
      message.includes('command not found')
    ) {
      return EnvironmentErrorType.NOT_INSTALLED;
    }

    if (
      message.includes('not in path') ||
      message.includes('path') ||
      message.includes('$PATH')
    ) {
      return EnvironmentErrorType.NOT_IN_PATH;
    }

    if (
      message.includes('permission denied') ||
      message.includes('eacces') ||
      message.includes('access denied')
    ) {
      return EnvironmentErrorType.PERMISSION_DENIED;
    }

    if (
      message.includes('connection refused') ||
      message.includes('connection failed') ||
      message.includes('econnrefused') ||
      message.includes('timeout')
    ) {
      return EnvironmentErrorType.CONNECTION_FAILED;
    }

    if (
      message.includes('service not running') ||
      message.includes('service unavailable') ||
      message.includes('enotfound')
    ) {
      return EnvironmentErrorType.SERVICE_NOT_RUNNING;
    }

    if (message.includes('version')) {
      return EnvironmentErrorType.VERSION_MISMATCH;
    }

    if (
      message.includes('invalid') ||
      message.includes('malformed') ||
      message.includes('syntax error')
    ) {
      return EnvironmentErrorType.INVALID_FILE_FORMAT;
    }

    if (message.includes('is not set') || message.includes('undefined variable')) {
      return EnvironmentErrorType.MISSING_ENV_VAR;
    }

    if (message.includes('directory')) {
      return EnvironmentErrorType.DIRECTORY_MISSING;
    }

    if (message.includes('disk') || message.includes('space')) {
      return EnvironmentErrorType.INSUFFICIENT_DISK_SPACE;
    }

    if (message.includes('port') || message.includes('already in use')) {
      return EnvironmentErrorType.PORT_IN_USE;
    }

    // Fallback based on category
    switch (category) {
      case EnvironmentCheckCategory.NODE_VERSION:
      case EnvironmentCheckCategory.NPM_VERSION:
        return EnvironmentErrorType.VERSION_MISMATCH;

      case EnvironmentCheckCategory.DOCKER_INSTALLATION:
      case EnvironmentCheckCategory.POSTGRESQL_INSTALLATION:
        return EnvironmentErrorType.NOT_INSTALLED;

      case EnvironmentCheckCategory.DOCKER_SERVICE:
      case EnvironmentCheckCategory.POSTGRESQL_SERVICE:
        return EnvironmentErrorType.SERVICE_NOT_RUNNING;

      case EnvironmentCheckCategory.POSTGRESQL_CONNECTIVITY:
        return EnvironmentErrorType.CONNECTION_FAILED;

      case EnvironmentCheckCategory.CONFIG_FILES:
        return EnvironmentErrorType.MISSING_FILE;

      case EnvironmentCheckCategory.ENVIRONMENT_VARIABLES:
        return EnvironmentErrorType.MISSING_ENV_VAR;

      case EnvironmentCheckCategory.FILE_PERMISSIONS:
        return EnvironmentErrorType.PERMISSION_DENIED;

      case EnvironmentCheckCategory.DIRECTORY_STRUCTURE:
        return EnvironmentErrorType.DIRECTORY_MISSING;

      default:
        return EnvironmentErrorType.UNKNOWN;
    }
  }

  /**
   * Determine severity level from error type
   */
  determineSeverity(errorType: EnvironmentErrorType): EnvironmentSeverity {
    switch (errorType) {
      case EnvironmentErrorType.NOT_INSTALLED:
      case EnvironmentErrorType.CONNECTION_FAILED:
      case EnvironmentErrorType.SERVICE_NOT_RUNNING:
      case EnvironmentErrorType.VERSION_MISMATCH:
      case EnvironmentErrorType.MISSING_FILE:
        return EnvironmentSeverity.CRITICAL;

      case EnvironmentErrorType.NOT_IN_PATH:
      case EnvironmentErrorType.INVALID_FILE_FORMAT:
      case EnvironmentErrorType.MISSING_ENV_VAR:
      case EnvironmentErrorType.PERMISSION_DENIED:
      case EnvironmentErrorType.DIRECTORY_MISSING:
        return EnvironmentSeverity.HIGH;

      case EnvironmentErrorType.INSUFFICIENT_DISK_SPACE:
      case EnvironmentErrorType.PORT_IN_USE:
      case EnvironmentErrorType.CONFIGURATION_ERROR:
        return EnvironmentSeverity.MEDIUM;

      default:
        return EnvironmentSeverity.LOW;
    }
  }

  /**
   * Check if error is blocking build
   */
  private isBlockingBuild(errorType: EnvironmentErrorType): boolean {
    const blockingTypes = [
      EnvironmentErrorType.NOT_INSTALLED,
      EnvironmentErrorType.VERSION_MISMATCH,
      EnvironmentErrorType.MISSING_FILE,
      EnvironmentErrorType.PERMISSION_DENIED,
      EnvironmentErrorType.INVALID_FILE_FORMAT,
    ];

    return blockingTypes.includes(errorType);
  }

  /**
   * Check if error is blocking deploy
   */
  private isBlockingDeploy(errorType: EnvironmentErrorType): boolean {
    const blockingTypes = [
      EnvironmentErrorType.NOT_INSTALLED,
      EnvironmentErrorType.VERSION_MISMATCH,
      EnvironmentErrorType.SERVICE_NOT_RUNNING,
      EnvironmentErrorType.CONNECTION_FAILED,
      EnvironmentErrorType.MISSING_ENV_VAR,
      EnvironmentErrorType.INSUFFICIENT_DISK_SPACE,
    ];

    return blockingTypes.includes(errorType);
  }

  /**
   * Determine root cause description
   */
  private determineRootCause(errorType: EnvironmentErrorType, errorMessage: string): string {
    const rootCauses: Record<EnvironmentErrorType, string> = {
      [EnvironmentErrorType.VERSION_MISMATCH]:
        'Installed version does not meet minimum requirements',
      [EnvironmentErrorType.NOT_INSTALLED]:
        'Required tool/service is not installed on this system',
      [EnvironmentErrorType.NOT_IN_PATH]:
        'Tool is installed but not available in system PATH',
      [EnvironmentErrorType.SERVICE_NOT_RUNNING]:
        'Service is installed but not currently running',
      [EnvironmentErrorType.SERVICE_NOT_AVAILABLE]:
        'Service exists but is unavailable or unreachable',
      [EnvironmentErrorType.CONNECTION_FAILED]:
        'Unable to establish connection to required service',
      [EnvironmentErrorType.MISSING_FILE]:
        'Required configuration or data file is missing',
      [EnvironmentErrorType.INVALID_FILE_FORMAT]:
        'Configuration file exists but has invalid format',
      [EnvironmentErrorType.MISSING_ENV_VAR]:
        'Required environment variable is not set',
      [EnvironmentErrorType.INVALID_ENV_VAR]:
        'Environment variable exists but has invalid value',
      [EnvironmentErrorType.PERMISSION_DENIED]:
        'Insufficient permissions to access required file or directory',
      [EnvironmentErrorType.DIRECTORY_MISSING]:
        'Required directory does not exist',
      [EnvironmentErrorType.INSUFFICIENT_DISK_SPACE]:
        'Insufficient disk space available',
      [EnvironmentErrorType.PORT_IN_USE]:
        'Required port is already in use by another process',
      [EnvironmentErrorType.CONFIGURATION_ERROR]:
        'Configuration is invalid or misconfigured',
      [EnvironmentErrorType.UNKNOWN]: `Unknown error: ${errorMessage}`,
    };

    return rootCauses[errorType] || 'Unknown error occurred';
  }

  /**
   * Get recommended actions for error type
   */
  getRecommendations(
    errorType: EnvironmentErrorType,
    details?: Record<string, any>
  ): string[] {
    const recommendations: Record<EnvironmentErrorType, string[]> = {
      [EnvironmentErrorType.VERSION_MISMATCH]: [
        'Upgrade to the required version',
        'Check https://nodejs.org or https://www.npmjs.com for latest versions',
        'Use version managers (nvm, npm, etc.)',
      ],

      [EnvironmentErrorType.NOT_INSTALLED]: [
        'Install the missing tool/service',
        'Verify installation completed successfully',
        'Add to system PATH if needed',
      ],

      [EnvironmentErrorType.NOT_IN_PATH]: [
        'Add installation directory to system PATH',
        'Use absolute path to executable',
        'Restart terminal/IDE after PATH changes',
      ],

      [EnvironmentErrorType.SERVICE_NOT_RUNNING]: [
        'Start the service',
        'Check service status and logs',
        'Verify service configuration',
        'Ensure service is set to start automatically',
      ],

      [EnvironmentErrorType.SERVICE_NOT_AVAILABLE]: [
        'Check service health and status',
        'Review service logs for errors',
        'Verify network connectivity',
        'Restart the service',
      ],

      [EnvironmentErrorType.CONNECTION_FAILED]: [
        'Verify service is running',
        'Check network connectivity',
        'Verify hostname/port configuration',
        'Check firewall rules',
        'Review service logs',
      ],

      [EnvironmentErrorType.MISSING_FILE]: [
        'Create the missing configuration file',
        'Copy from template or example file',
        'Verify file path and location',
      ],

      [EnvironmentErrorType.INVALID_FILE_FORMAT]: [
        'Fix syntax errors in configuration file',
        'Validate JSON/YAML format',
        'Compare with example/template files',
        'Check encoding (should be UTF-8)',
      ],

      [EnvironmentErrorType.MISSING_ENV_VAR]: [
        'Set the required environment variable',
        'Add to .env file or system environment',
        'Use .env.example as template',
        'Reload environment after changes',
      ],

      [EnvironmentErrorType.INVALID_ENV_VAR]: [
        'Update environment variable with valid value',
        'Check variable format and constraints',
        'Verify against documentation',
      ],

      [EnvironmentErrorType.PERMISSION_DENIED]: [
        'Fix file permissions using chmod',
        'Check file/directory ownership',
        'Run with appropriate privileges if needed',
        'Verify access control lists (ACL)',
      ],

      [EnvironmentErrorType.DIRECTORY_MISSING]: [
        'Create the missing directory',
        'Verify directory path is correct',
        'Check parent directories exist',
      ],

      [EnvironmentErrorType.INSUFFICIENT_DISK_SPACE]: [
        'Free up disk space',
        'Remove old log files and temporary files',
        'Move data to external storage if needed',
        'Consider upgrading storage capacity',
      ],

      [EnvironmentErrorType.PORT_IN_USE]: [
        'Use a different port if possible',
        'Stop the process using the port',
        'Change configuration to use alternate port',
      ],

      [EnvironmentErrorType.CONFIGURATION_ERROR]: [
        'Review configuration documentation',
        'Check configuration file syntax',
        'Validate all required settings are present',
      ],

      [EnvironmentErrorType.UNKNOWN]: [
        'Review error message and logs',
        'Check documentation and FAQ',
        'Search for similar issues online',
        'Contact support if needed',
      ],
    };

    return recommendations[errorType] || ['Unable to determine recommended actions'];
  }
}
