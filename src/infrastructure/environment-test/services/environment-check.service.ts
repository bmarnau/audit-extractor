/**
 * Environment Check Service
 * 
 * Core service for performing environment validation checks
 * Handles: Node, npm, Docker, PostgreSQL, Config, Env Vars, Directories, Permissions
 */

import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { execSync, spawn } from 'child_process';
import * as net from 'net';

import {
  EnvironmentCheckResult,
  EnvironmentCheckCategory,
  EnvironmentSeverity,
  EnvironmentErrorType,
  NodeVersionDetails,
  NpmVersionDetails,
  DockerDetails,
  PostgreSQLDetails,
  ConfigFileDetails,
  ConfigFileStatus,
  EnvironmentVariableDetails,
  RequiredEnvVar,
  DirectoryStructureDetails,
  DirectoryStatus,
  FilePermissionsDetails,
  FilePermissionStatus,
  DiskSpaceDetails,
  PortAvailabilityDetails,
  PortStatus,
  IEnvironmentChecker,
} from './environment.types';

/**
 * Environment Checker Service
 */
export class EnvironmentCheckerService implements IEnvironmentChecker {
  private startTime: number = 0;
  
  constructor(
    private projectRoot: string = process.cwd(),
    private requiredNodeVersion: { major: number; minor: number } = { major: 16, minor: 0 },
    private requiredNpmVersion: { major: number; minor: number } = { major: 7, minor: 0 }
  ) {}

  /**
   * Check Node.js version
   */
  async checkNodeVersion(): Promise<EnvironmentCheckResult> {
    const checkStart = Date.now();
    const checkId = `ENV-NODE-${Date.now()}`;

    try {
      const versionStr = process.version.replace('v', '');
      const [major, minor, patch] = versionStr.split('.').map(Number);

      const isCompatible =
        major > this.requiredNodeVersion.major ||
        (major === this.requiredNodeVersion.major &&
          minor >= this.requiredNodeVersion.minor);

      const details: NodeVersionDetails = {
        currentVersion: versionStr,
        majorVersion: major,
        minorVersion: minor,
        patchVersion: patch,
        requiredMajor: this.requiredNodeVersion.major,
        requiredMinor: this.requiredNodeVersion.minor,
        isCompatible,
      };

      const result: EnvironmentCheckResult = {
        checkId,
        category: EnvironmentCheckCategory.NODE_VERSION,
        checkName: 'Node.js Version Check',
        status: isCompatible ? 'PASS' : 'FAIL',
        severity: isCompatible ? EnvironmentSeverity.INFO : EnvironmentSeverity.CRITICAL,
        findings: [
          `Node.js version: ${versionStr}`,
          `Required: ${this.requiredNodeVersion.major}.${this.requiredNodeVersion.minor}+`,
          isCompatible ? 'Compatible version installed' : 'Incompatible version detected',
        ],
        details,
        recommendedActions: isCompatible
          ? []
          : [
              `Upgrade Node.js to v${this.requiredNodeVersion.major}.${this.requiredNodeVersion.minor} or later`,
              'Visit: https://nodejs.org/en/download/',
              'Or use nvm: nvm install --lts',
            ],
        actualValue: versionStr,
        requiredValue: `${this.requiredNodeVersion.major}.${this.requiredNodeVersion.minor}+`,
        checkedAt: new Date().toISOString(),
        duration: Date.now() - checkStart,
        isBlockingBuild: !isCompatible,
        isBlockingDeploy: !isCompatible,
      };

      return result;
    } catch (error) {
      return this.createFailedCheck(
        checkId,
        EnvironmentCheckCategory.NODE_VERSION,
        'Node.js Version Check',
        error,
        EnvironmentSeverity.CRITICAL,
        EnvironmentErrorType.NOT_INSTALLED,
        checkStart
      );
    }
  }

  /**
   * Check npm version
   */
  async checkNpmVersion(): Promise<EnvironmentCheckResult> {
    const checkStart = Date.now();
    const checkId = `ENV-NPM-${Date.now()}`;

    try {
      const output = execSync('npm --version', { encoding: 'utf-8' }).trim();
      const [major, minor, patch] = output.split('.').map(Number);

      const isCompatible =
        major > this.requiredNpmVersion.major ||
        (major === this.requiredNpmVersion.major &&
          minor >= this.requiredNpmVersion.minor);

      const lockfileExists = fs.existsSync(
        path.join(this.projectRoot, 'package-lock.json')
      );
      const nodeModulesExists = fs.existsSync(
        path.join(this.projectRoot, 'node_modules')
      );

      let installedPackages = 0;
      if (nodeModulesExists) {
        try {
          const items = fs.readdirSync(path.join(this.projectRoot, 'node_modules'));
          installedPackages = items.filter((i) => !i.startsWith('.')).length;
        } catch {}
      }

      const details: NpmVersionDetails = {
        currentVersion: output,
        lockfileExists,
        nodeModulesExists,
        installedPackages,
      };

      const result: EnvironmentCheckResult = {
        checkId,
        category: EnvironmentCheckCategory.NPM_VERSION,
        checkName: 'npm Version Check',
        status: isCompatible ? 'PASS' : 'FAIL',
        severity: isCompatible ? EnvironmentSeverity.INFO : EnvironmentSeverity.HIGH,
        findings: [
          `npm version: ${output}`,
          `Required: ${this.requiredNpmVersion.major}.${this.requiredNpmVersion.minor}+`,
          `package-lock.json exists: ${lockfileExists}`,
          `node_modules exists: ${nodeModulesExists}`,
          nodeModulesExists ? `${installedPackages} packages installed` : 'Dependencies not installed',
        ],
        details,
        recommendedActions: [
          ...(isCompatible ? [] : [`Upgrade npm: npm install -g npm@${this.requiredNpmVersion.major}`]),
          ...(!nodeModulesExists ? ['Run: npm install'] : []),
        ],
        actualValue: output,
        requiredValue: `${this.requiredNpmVersion.major}.${this.requiredNpmVersion.minor}+`,
        checkedAt: new Date().toISOString(),
        duration: Date.now() - checkStart,
        isBlockingBuild: !isCompatible,
        isBlockingDeploy: !isCompatible,
      };

      return result;
    } catch (error) {
      return this.createFailedCheck(
        checkId,
        EnvironmentCheckCategory.NPM_VERSION,
        'npm Version Check',
        error,
        EnvironmentSeverity.CRITICAL,
        EnvironmentErrorType.NOT_INSTALLED,
        checkStart
      );
    }
  }

  /**
   * Check Docker installation
   */
  async checkDocker(): Promise<EnvironmentCheckResult> {
    const checkStart = Date.now();
    const checkId = `ENV-DOCKER-${Date.now()}`;

    try {
      const dockerVersion = execSync('docker --version', {
        encoding: 'utf-8',
      }).trim();
      const composeInstalled = this.commandExists('docker-compose');
      const composeVersion = composeInstalled
        ? execSync('docker-compose --version', { encoding: 'utf-8' }).trim()
        : undefined;

      const details: DockerDetails = {
        isInstalled: true,
        version: dockerVersion,
        composeInstalled,
        composeVersion,
      };

      const result: EnvironmentCheckResult = {
        checkId,
        category: EnvironmentCheckCategory.DOCKER_INSTALLATION,
        checkName: 'Docker Installation Check',
        status: 'PASS',
        severity: EnvironmentSeverity.INFO,
        findings: [
          `Docker installed: ${dockerVersion}`,
          `docker-compose installed: ${composeInstalled}`,
          composeVersion ? `docker-compose version: ${composeVersion}` : '',
        ].filter(Boolean),
        details,
        recommendedActions: [],
        actualValue: dockerVersion,
        checkedAt: new Date().toISOString(),
        duration: Date.now() - checkStart,
        isBlockingBuild: false,
        isBlockingDeploy: false,
      };

      return result;
    } catch (error) {
      return this.createFailedCheck(
        checkId,
        EnvironmentCheckCategory.DOCKER_INSTALLATION,
        'Docker Installation Check',
        error,
        EnvironmentSeverity.HIGH,
        EnvironmentErrorType.NOT_INSTALLED,
        checkStart,
        {
          isInstalled: false,
          version: undefined,
          composeInstalled: false,
        }
      );
    }
  }

  /**
   * Check Docker service status
   */
  async checkDockerService(): Promise<EnvironmentCheckResult> {
    const checkStart = Date.now();
    const checkId = `ENV-DOCKER-SERVICE-${Date.now()}`;

    try {
      execSync('docker ps', { encoding: 'utf-8', stdio: 'pipe' });

      const result: EnvironmentCheckResult = {
        checkId,
        category: EnvironmentCheckCategory.DOCKER_SERVICE,
        checkName: 'Docker Service Status Check',
        status: 'PASS',
        severity: EnvironmentSeverity.INFO,
        findings: [
          'Docker daemon is running',
          'Docker socket is accessible',
        ],
        details: { isServiceRunning: true },
        recommendedActions: [],
        checkedAt: new Date().toISOString(),
        duration: Date.now() - checkStart,
        isBlockingBuild: false,
        isBlockingDeploy: false,
      };

      return result;
    } catch (error) {
      return this.createFailedCheck(
        checkId,
        EnvironmentCheckCategory.DOCKER_SERVICE,
        'Docker Service Status Check',
        error,
        EnvironmentSeverity.HIGH,
        EnvironmentErrorType.SERVICE_NOT_RUNNING,
        checkStart,
        { isServiceRunning: false }
      );
    }
  }

  /**
   * Check docker-compose functionality
   */
  async checkDockerCompose(): Promise<EnvironmentCheckResult> {
    const checkStart = Date.now();
    const checkId = `ENV-DOCKER-COMPOSE-${Date.now()}`;

    try {
      if (!this.commandExists('docker-compose')) {
        throw new Error('docker-compose not found in PATH');
      }

      const composePath = path.join(this.projectRoot, 'docker-compose.yml');
      const composeExists = fs.existsSync(composePath);

      execSync('docker-compose version', { encoding: 'utf-8', stdio: 'pipe' });

      const result: EnvironmentCheckResult = {
        checkId,
        category: EnvironmentCheckCategory.DOCKER_COMPOSE,
        checkName: 'docker-compose Functionality Check',
        status: 'PASS',
        severity: EnvironmentSeverity.INFO,
        findings: [
          'docker-compose is installed',
          `docker-compose.yml exists: ${composeExists}`,
          'docker-compose can execute commands',
        ],
        details: { composeInstalled: true, configExists: composeExists },
        recommendedActions: [],
        checkedAt: new Date().toISOString(),
        duration: Date.now() - checkStart,
        isBlockingBuild: false,
        isBlockingDeploy: false,
      };

      return result;
    } catch (error) {
      return this.createFailedCheck(
        checkId,
        EnvironmentCheckCategory.DOCKER_COMPOSE,
        'docker-compose Functionality Check',
        error,
        EnvironmentSeverity.MEDIUM,
        EnvironmentErrorType.NOT_INSTALLED,
        checkStart
      );
    }
  }

  /**
   * Check PostgreSQL installation
   */
  async checkPostgreSQL(): Promise<EnvironmentCheckResult> {
    const checkStart = Date.now();
    const checkId = `ENV-POSTGRES-${Date.now()}`;

    try {
      const version = execSync('psql --version', {
        encoding: 'utf-8',
      }).trim();

      const details: PostgreSQLDetails = {
        isInstalled: true,
        version,
      };

      const result: EnvironmentCheckResult = {
        checkId,
        category: EnvironmentCheckCategory.POSTGRESQL_INSTALLATION,
        checkName: 'PostgreSQL Installation Check',
        status: 'PASS',
        severity: EnvironmentSeverity.INFO,
        findings: [
          `PostgreSQL installed: ${version}`,
          'psql command available',
        ],
        details,
        recommendedActions: [],
        actualValue: version,
        checkedAt: new Date().toISOString(),
        duration: Date.now() - checkStart,
        isBlockingBuild: false,
        isBlockingDeploy: false,
      };

      return result;
    } catch (error) {
      return this.createFailedCheck(
        checkId,
        EnvironmentCheckCategory.POSTGRESQL_INSTALLATION,
        'PostgreSQL Installation Check',
        error,
        EnvironmentSeverity.MEDIUM,
        EnvironmentErrorType.NOT_INSTALLED,
        checkStart,
        { isInstalled: false }
      );
    }
  }

  /**
   * Check PostgreSQL service status
   */
  async checkPostgreSQLService(): Promise<EnvironmentCheckResult> {
    const checkStart = Date.now();
    const checkId = `ENV-POSTGRES-SERVICE-${Date.now()}`;

    try {
      // Try to connect to default PostgreSQL port
      const isRunning = await this.isPortListening(5432);

      const result: EnvironmentCheckResult = {
        checkId,
        category: EnvironmentCheckCategory.POSTGRESQL_SERVICE,
        checkName: 'PostgreSQL Service Status Check',
        status: isRunning ? 'PASS' : 'FAIL',
        severity: isRunning ? EnvironmentSeverity.INFO : EnvironmentSeverity.HIGH,
        findings: [
          isRunning
            ? 'PostgreSQL service is running on port 5432'
            : 'PostgreSQL service not responding on port 5432',
        ],
        details: { isServiceRunning: isRunning, port: 5432 },
        recommendedActions: !isRunning
          ? [
              'Start PostgreSQL service:',
              'Linux/Mac: brew services start postgresql',
              'Windows: net start PostgreSQL',
              'Or run with Docker: docker-compose up -d postgres',
            ]
          : [],
        checkedAt: new Date().toISOString(),
        duration: Date.now() - checkStart,
        isBlockingBuild: false,
        isBlockingDeploy: !isRunning,
      };

      return result;
    } catch (error) {
      return this.createFailedCheck(
        checkId,
        EnvironmentCheckCategory.POSTGRESQL_SERVICE,
        'PostgreSQL Service Status Check',
        error,
        EnvironmentSeverity.MEDIUM,
        EnvironmentErrorType.SERVICE_NOT_RUNNING,
        checkStart,
        { isServiceRunning: false }
      );
    }
  }

  /**
   * Check PostgreSQL connectivity
   */
  async checkPostgreSQLConnectivity(): Promise<EnvironmentCheckResult> {
    const checkStart = Date.now();
    const checkId = `ENV-POSTGRES-CONNECT-${Date.now()}`;

    try {
      const host = process.env.DB_HOST || 'localhost';
      const port = parseInt(process.env.DB_PORT || '5432');
      const user = process.env.DB_USER || 'postgres';
      const database = process.env.DB_NAME || 'postgres';

      // Simple connectivity check without password
      const canConnect = await this.testDatabaseConnection(host, port, user, database);

      const result: EnvironmentCheckResult = {
        checkId,
        category: EnvironmentCheckCategory.POSTGRESQL_CONNECTIVITY,
        checkName: 'PostgreSQL Connectivity Check',
        status: canConnect ? 'PASS' : 'FAIL',
        severity: canConnect ? EnvironmentSeverity.INFO : EnvironmentSeverity.HIGH,
        findings: [
          `Attempting connection to ${host}:${port}`,
          `Database: ${database}`,
          `User: ${user}`,
          canConnect ? 'Successfully connected to PostgreSQL' : 'Connection failed',
        ],
        details: { canConnect, host, port, database, user },
        recommendedActions: !canConnect
          ? [
              'Ensure PostgreSQL service is running',
              'Verify connection parameters in .env file',
              'Check database credentials',
              'Verify DB_HOST, DB_PORT, DB_USER, DB_NAME environment variables',
            ]
          : [],
        checkedAt: new Date().toISOString(),
        duration: Date.now() - checkStart,
        isBlockingBuild: false,
        isBlockingDeploy: !canConnect,
      };

      return result;
    } catch (error) {
      return this.createFailedCheck(
        checkId,
        EnvironmentCheckCategory.POSTGRESQL_CONNECTIVITY,
        'PostgreSQL Connectivity Check',
        error,
        EnvironmentSeverity.HIGH,
        EnvironmentErrorType.CONNECTION_FAILED,
        checkStart
      );
    }
  }

  /**
   * Check configuration files
   */
  async checkConfigFiles(): Promise<EnvironmentCheckResult> {
    const checkStart = Date.now();
    const checkId = `ENV-CONFIG-${Date.now()}`;

    try {
      const configFiles = [
        { path: 'package.json', required: true, format: 'json' as const },
        { path: 'tsconfig.json', required: true, format: 'json' as const },
        { path: '.env', required: false, format: 'env' as const },
        { path: '.env.example', required: false, format: 'env' as const },
        { path: 'docker-compose.yml', required: false, format: 'yaml' as const },
      ];

      const results: ConfigFileStatus[] = [];
      let validCount = 0;
      const missingRequired: string[] = [];

      for (const config of configFiles) {
        const fullPath = path.join(this.projectRoot, config.path);
        const exists = fs.existsSync(fullPath);

        let isValid = false;
        let validationError: string | undefined;
        let size = 0;
        let lastModified = '';

        if (exists) {
          try {
            const stat = fs.statSync(fullPath);
            size = stat.size;
            lastModified = stat.mtime.toISOString();

            // Validate format
            const content = fs.readFileSync(fullPath, 'utf-8');
            try {
              if (config.format === 'json') {
                JSON.parse(content);
                isValid = true;
              } else {
                isValid = true;
              }
            } catch (e) {
              validationError = (e as Error).message;
              isValid = false;
            }

            if (isValid) validCount++;
          } catch (e) {
            validationError = (e as Error).message;
          }
        } else if (config.required) {
          missingRequired.push(config.path);
        }

        results.push({
          filePath: config.path,
          exists,
          format: config.format,
          isValid,
          size,
          lastModified,
          validationError,
        });
      }

      const status = missingRequired.length === 0 ? 'PASS' : 'FAIL';
      const severity = missingRequired.length === 0 ? EnvironmentSeverity.INFO : EnvironmentSeverity.HIGH;

      const details: ConfigFileDetails = {
        configFiles: results,
        totalFiles: configFiles.length,
        validFiles: validCount,
        missingFiles: missingRequired,
      };

      const result: EnvironmentCheckResult = {
        checkId,
        category: EnvironmentCheckCategory.CONFIG_FILES,
        checkName: 'Configuration Files Check',
        status: status as any,
        severity,
        findings: [
          `Total config files checked: ${configFiles.length}`,
          `Valid files: ${validCount}`,
          ...missingRequired.map((f) => `Missing required file: ${f}`),
        ],
        details,
        recommendedActions: missingRequired.map((f) => `Create missing configuration file: ${f}`),
        checkedAt: new Date().toISOString(),
        duration: Date.now() - checkStart,
        isBlockingBuild: missingRequired.length > 0,
        isBlockingDeploy: missingRequired.length > 0,
      };

      return result;
    } catch (error) {
      return this.createFailedCheck(
        checkId,
        EnvironmentCheckCategory.CONFIG_FILES,
        'Configuration Files Check',
        error,
        EnvironmentSeverity.HIGH,
        EnvironmentErrorType.MISSING_FILE,
        checkStart
      );
    }
  }

  /**
   * Check environment variables
   */
  async checkEnvironmentVariables(): Promise<EnvironmentCheckResult> {
    const checkStart = Date.now();
    const checkId = `ENV-VARS-${Date.now()}`;

    try {
      const requiredVars: RequiredEnvVar[] = [
        { name: 'NODE_ENV', required: true, description: 'Node environment (development/production)' },
        { name: 'DB_HOST', required: true, description: 'Database host' },
        { name: 'DB_PORT', required: true, description: 'Database port' },
        { name: 'DB_USER', required: true, description: 'Database user' },
        { name: 'DB_NAME', required: true, description: 'Database name' },
        { name: 'API_PORT', required: false, description: 'API server port' },
        { name: 'FRONTEND_PORT', required: false, description: 'Frontend server port' },
      ];

      const presentVars: string[] = [];
      const missingVars: string[] = [];
      const invalidVars: any[] = [];

      for (const varDef of requiredVars) {
        const value = process.env[varDef.name];

        if (value) {
          presentVars.push(varDef.name);
          varDef.value = value;
          varDef.isValid = true;
        } else if (varDef.required) {
          missingVars.push(varDef.name);
        }
      }

      const details: EnvironmentVariableDetails = {
        requiredVars,
        presentVars,
        missingVars,
        invalidVars,
        totalRequired: requiredVars.filter((v) => v.required).length,
        totalPresent: presentVars.length,
      };

      const status = missingVars.length === 0 ? 'PASS' : 'FAIL';
      const severity = missingVars.length === 0 ? EnvironmentSeverity.INFO : EnvironmentSeverity.HIGH;

      const result: EnvironmentCheckResult = {
        checkId,
        category: EnvironmentCheckCategory.ENVIRONMENT_VARIABLES,
        checkName: 'Environment Variables Check',
        status: status as any,
        severity,
        findings: [
          `Total required variables: ${requiredVars.filter((v) => v.required).length}`,
          `Variables present: ${presentVars.length}`,
          ...missingVars.map((v) => `Missing required variable: ${v}`),
        ],
        details,
        recommendedActions: [
          ...(missingVars.length > 0
            ? [
                'Create or update .env file with missing variables:',
                ...missingVars.map((v) => `  ${v}=<value>`),
                'Or copy .env.example to .env and fill in values',
              ]
            : []),
        ],
        checkedAt: new Date().toISOString(),
        duration: Date.now() - checkStart,
        isBlockingBuild: false,
        isBlockingDeploy: missingVars.length > 0,
      };

      return result;
    } catch (error) {
      return this.createFailedCheck(
        checkId,
        EnvironmentCheckCategory.ENVIRONMENT_VARIABLES,
        'Environment Variables Check',
        error,
        EnvironmentSeverity.MEDIUM,
        EnvironmentErrorType.MISSING_ENV_VAR,
        checkStart
      );
    }
  }

  /**
   * Check directory structure
   */
  async checkDirectoryStructure(): Promise<EnvironmentCheckResult> {
    const checkStart = Date.now();
    const checkId = `ENV-DIRS-${Date.now()}`;

    try {
      const requiredDirs = [
        'src',
        'src/infrastructure',
        'backend',
        'frontend',
        'docs',
        'test-results',
        'node_modules',
      ];

      const results: DirectoryStatus[] = [];
      let existingCount = 0;
      const missing: string[] = [];

      for (const dir of requiredDirs) {
        const fullPath = path.join(this.projectRoot, dir);
        const exists = fs.existsSync(fullPath);

        if (exists) {
          existingCount++;
          try {
            const stat = fs.statSync(fullPath);
            const items = fs.readdirSync(fullPath);
            results.push({
              path: dir,
              exists: true,
              isReadable: true,
              isWritable: this.isWritable(fullPath),
              itemCount: items.length,
            });
          } catch {
            results.push({
              path: dir,
              exists: true,
              isReadable: false,
              isWritable: false,
            });
          }
        } else {
          missing.push(dir);
          results.push({
            path: dir,
            exists: false,
            isReadable: false,
            isWritable: false,
          });
        }
      }

      const details: DirectoryStructureDetails = {
        requiredDirectories: results,
        totalDirectories: requiredDirs.length,
        existingDirectories: existingCount,
        missingDirectories: missing,
      };

      const severity = missing.length === 0 ? EnvironmentSeverity.INFO : EnvironmentSeverity.MEDIUM;

      const result: EnvironmentCheckResult = {
        checkId,
        category: EnvironmentCheckCategory.DIRECTORY_STRUCTURE,
        checkName: 'Directory Structure Check',
        status: 'PASS',
        severity,
        findings: [
          `Total required directories: ${requiredDirs.length}`,
          `Existing directories: ${existingCount}`,
          ...missing.map((d) => `Missing directory: ${d}`),
        ],
        details,
        recommendedActions: missing.map((d) => `Create directory: mkdir -p ${d}`),
        checkedAt: new Date().toISOString(),
        duration: Date.now() - checkStart,
        isBlockingBuild: false,
        isBlockingDeploy: false,
      };

      return result;
    } catch (error) {
      return this.createFailedCheck(
        checkId,
        EnvironmentCheckCategory.DIRECTORY_STRUCTURE,
        'Directory Structure Check',
        error,
        EnvironmentSeverity.MEDIUM,
        EnvironmentErrorType.DIRECTORY_MISSING,
        checkStart
      );
    }
  }

  /**
   * Check file permissions
   */
  async checkFilePermissions(): Promise<EnvironmentCheckResult> {
    const checkStart = Date.now();
    const checkId = `ENV-PERMS-${Date.now()}`;

    try {
      const criticalFiles = [
        { path: 'package.json', shouldRead: true, shouldWrite: true },
        { path: 'src', shouldRead: true, shouldWrite: true },
        { path: 'test-results', shouldRead: true, shouldWrite: true },
      ];

      const results: FilePermissionStatus[] = [];
      const invalid: any[] = [];

      for (const file of criticalFiles) {
        const fullPath = path.join(this.projectRoot, file.path);
        const exists = fs.existsSync(fullPath);

        if (!exists) {
          results.push({
            filePath: file.path,
            readable: false,
            writable: false,
            executable: false,
            isValid: false,
          });
          continue;
        }

        try {
          const stat = fs.statSync(fullPath);
          const readable = this.canRead(fullPath);
          const writable = this.isWritable(fullPath);

          const isValid = readable === file.shouldRead && writable === file.shouldWrite;

          results.push({
            filePath: file.path,
            readable,
            writable,
            executable: false,
            isValid,
          });

          if (!isValid) {
            invalid.push({
              filePath: file.path,
              issue: `Expected: readable=${file.shouldRead} writable=${file.shouldWrite}, Got: readable=${readable} writable=${writable}`,
            });
          }
        } catch {
          results.push({
            filePath: file.path,
            readable: false,
            writable: false,
            executable: false,
            isValid: false,
          });
        }
      }

      const details: FilePermissionsDetails = {
        files: results,
        totalFiles: criticalFiles.length,
        validPermissions: results.filter((r) => r.isValid).length,
        invalidPermissions: invalid,
      };

      const severity = invalid.length === 0 ? EnvironmentSeverity.INFO : EnvironmentSeverity.MEDIUM;

      const result: EnvironmentCheckResult = {
        checkId,
        category: EnvironmentCheckCategory.FILE_PERMISSIONS,
        checkName: 'File Permissions Check',
        status: 'PASS',
        severity,
        findings: [
          `Total files checked: ${criticalFiles.length}`,
          `Valid permissions: ${results.filter((r) => r.isValid).length}`,
          ...invalid.map((p) => `Permission issue: ${p.filePath} - ${p.issue}`),
        ],
        details,
        recommendedActions: invalid.length > 0
          ? [
              'Fix file permissions:',
              ...invalid.map((p) => `  chmod appropriate-permissions ${p.filePath}`),
            ]
          : [],
        checkedAt: new Date().toISOString(),
        duration: Date.now() - checkStart,
        isBlockingBuild: invalid.length > 0,
        isBlockingDeploy: false,
      };

      return result;
    } catch (error) {
      return this.createFailedCheck(
        checkId,
        EnvironmentCheckCategory.FILE_PERMISSIONS,
        'File Permissions Check',
        error,
        EnvironmentSeverity.MEDIUM,
        EnvironmentErrorType.PERMISSION_DENIED,
        checkStart
      );
    }
  }

  /**
   * Check disk space
   */
  async checkDiskSpace(): Promise<EnvironmentCheckResult> {
    const checkStart = Date.now();
    const checkId = `ENV-DISK-${Date.now()}`;

    try {
      let totalSpace = 0;
      let availableSpace = 0;

      try {
        const output = execSync('df -B1 .', { encoding: 'utf-8' });
        const lines = output.trim().split('\n');
        const data = lines[1].split(/\s+/);
        totalSpace = parseInt(data[1]);
        availableSpace = parseInt(data[3]);
      } catch {
        // Fallback for systems where df doesn't work
        availableSpace = require('os').freemem();
        totalSpace = availableSpace * 2; // Estimate
      }

      const usedSpace = totalSpace - availableSpace;
      const usagePercentage = (usedSpace / totalSpace) * 100;
      const warningThreshold = 80;
      const criticalThreshold = 95;

      let severity = EnvironmentSeverity.INFO;
      if (usagePercentage > criticalThreshold) {
        severity = EnvironmentSeverity.CRITICAL;
      } else if (usagePercentage > warningThreshold) {
        severity = EnvironmentSeverity.HIGH;
      }

      const details: DiskSpaceDetails = {
        totalSpace,
        availableSpace,
        usedSpace,
        usagePercentage,
        isHealthy: usagePercentage < warningThreshold,
        warningThreshold,
        criticalThreshold,
      };

      const result: EnvironmentCheckResult = {
        checkId,
        category: EnvironmentCheckCategory.DISK_SPACE,
        checkName: 'Disk Space Check',
        status: usagePercentage < criticalThreshold ? 'PASS' : 'FAIL',
        severity,
        findings: [
          `Total disk space: ${this.formatBytes(totalSpace)}`,
          `Available space: ${this.formatBytes(availableSpace)}`,
          `Used space: ${this.formatBytes(usedSpace)}`,
          `Usage: ${usagePercentage.toFixed(2)}%`,
        ],
        details,
        recommendedActions:
          usagePercentage > warningThreshold
            ? [
                'Free up disk space',
                'Remove old log files, backups, or temporary files',
                'Consider increasing available storage',
              ]
            : [],
        checkedAt: new Date().toISOString(),
        duration: Date.now() - checkStart,
        isBlockingBuild: usagePercentage > criticalThreshold,
        isBlockingDeploy: usagePercentage > criticalThreshold,
      };

      return result;
    } catch (error) {
      return this.createFailedCheck(
        checkId,
        EnvironmentCheckCategory.DISK_SPACE,
        'Disk Space Check',
        error,
        EnvironmentSeverity.LOW,
        EnvironmentErrorType.UNKNOWN,
        checkStart
      );
    }
  }

  /**
   * Check port availability
   */
  async checkPortAvailability(): Promise<EnvironmentCheckResult> {
    const checkStart = Date.now();
    const checkId = `ENV-PORTS-${Date.now()}`;

    try {
      const portsToCheck = [
        { port: 3000, name: 'API Server', serviceType: 'API' as const },
        { port: 5173, name: 'Frontend Dev', serviceType: 'FRONTEND' as const },
        { port: 5432, name: 'PostgreSQL', serviceType: 'DATABASE' as const },
        { port: 2375, name: 'Docker', serviceType: 'DOCKER' as const },
      ];

      const portResults: PortStatus[] = [];
      let allAvailable = true;

      for (const portCheck of portsToCheck) {
        const isAvailable = await this.isPortAvailable(portCheck.port);
        portResults.push({
          port: portCheck.port,
          name: portCheck.name,
          isAvailable,
          serviceType: portCheck.serviceType,
        });

        if (!isAvailable) {
          allAvailable = false;
        }
      }

      const details: PortAvailabilityDetails = {
        ports: portResults,
        allAvailable,
      };

      const unavailablePorts = portResults.filter((p) => !p.isAvailable);

      const result: EnvironmentCheckResult = {
        checkId,
        category: EnvironmentCheckCategory.PORT_AVAILABILITY,
        checkName: 'Port Availability Check',
        status: allAvailable ? 'PASS' : 'WARNING',
        severity: EnvironmentSeverity.MEDIUM,
        findings: [
          `Total ports checked: ${portsToCheck.length}`,
          `Available ports: ${portResults.filter((p) => p.isAvailable).length}`,
          ...unavailablePorts.map((p) => `Port ${p.port} (${p.name}) is in use`),
        ],
        details,
        recommendedActions:
          unavailablePorts.length > 0
            ? [
                'Free up the following ports or use different ports:',
                ...unavailablePorts.map((p) => `  Port ${p.port}: ${p.name}`),
              ]
            : [],
        checkedAt: new Date().toISOString(),
        duration: Date.now() - checkStart,
        isBlockingBuild: false,
        isBlockingDeploy: false,
      };

      return result;
    } catch (error) {
      return this.createFailedCheck(
        checkId,
        EnvironmentCheckCategory.PORT_AVAILABILITY,
        'Port Availability Check',
        error,
        EnvironmentSeverity.LOW,
        EnvironmentErrorType.UNKNOWN,
        checkStart
      );
    }
  }

  /**
   * Run all environment checks
   */
  async runAllChecks(): Promise<EnvironmentCheckResult[]> {
    const checks = await Promise.all([
      this.checkNodeVersion(),
      this.checkNpmVersion(),
      this.checkDocker(),
      this.checkDockerService(),
      this.checkDockerCompose(),
      this.checkPostgreSQL(),
      this.checkPostgreSQLService(),
      this.checkPostgreSQLConnectivity(),
      this.checkConfigFiles(),
      this.checkEnvironmentVariables(),
      this.checkDirectoryStructure(),
      this.checkFilePermissions(),
      this.checkDiskSpace(),
      this.checkPortAvailability(),
    ]);

    return checks;
  }

  /**
   * Helper: Test database connection
   */
  private async testDatabaseConnection(
    host: string,
    port: number,
    user: string,
    database: string
  ): Promise<boolean> {
    return new Promise((resolve) => {
      const client = new net.Socket();
      const timeout = setTimeout(() => {
        client.destroy();
        resolve(false);
      }, 5000);

      client.on('connect', () => {
        clearTimeout(timeout);
        client.destroy();
        resolve(true);
      });

      client.on('error', () => {
        clearTimeout(timeout);
        resolve(false);
      });

      client.connect(port, host);
    });
  }

  /**
   * Helper: Check if port is listening
   */
  private isPortListening(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          resolve(true);
        } else {
          resolve(false);
        }
      });

      server.once('listening', () => {
        server.close();
        resolve(false);
      });

      server.listen(port, 'localhost');
    });
  }

  /**
   * Helper: Check if port is available
   */
  private async isPortAvailable(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          resolve(false);
        } else {
          resolve(true);
        }
      });

      server.once('listening', () => {
        server.close();
        resolve(true);
      });

      server.listen(port, '127.0.0.1');
    });
  }

  /**
   * Helper: Check if command exists
   */
  private commandExists(command: string): boolean {
    try {
      execSync(`command -v ${command}`, { stdio: 'ignore', shell: true });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Helper: Check if file is readable
   */
  private canRead(filePath: string): boolean {
    try {
      fs.accessSync(filePath, fs.constants.R_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Helper: Check if file is writable
   */
  private isWritable(filePath: string): boolean {
    try {
      fs.accessSync(filePath, fs.constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Helper: Format bytes
   */
  private formatBytes(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }

  /**
   * Helper: Create failed check result
   */
  private createFailedCheck(
    checkId: string,
    category: EnvironmentCheckCategory,
    checkName: string,
    error: any,
    severity: EnvironmentSeverity,
    errorType: EnvironmentErrorType,
    startTime: number,
    details?: any
  ): EnvironmentCheckResult {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      checkId,
      category,
      checkName,
      status: 'FAIL',
      severity,
      errorType,
      errorMessage,
      findings: [errorMessage],
      details: details || {},
      recommendedActions: [
        `Check installation and configuration of ${checkName}`,
        'Review logs for more details',
      ],
      checkedAt: new Date().toISOString(),
      duration: Date.now() - startTime,
      isBlockingBuild: severity === EnvironmentSeverity.CRITICAL,
      isBlockingDeploy: severity === EnvironmentSeverity.CRITICAL || severity === EnvironmentSeverity.HIGH,
    };
  }
}
