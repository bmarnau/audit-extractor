/**
 * Validierungsfunktionen für Environment Checks
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { ValidationLogger } from '../logger/validation-logger';

/**
 * Extrahiert Versionsnummer aus Output
 */
export function parseVersion(output: string): string {
  const match = output.match(/(\d+\.\d+\.\d+)/);
  return match ? match[1] : 'unknown';
}

/**
 * Validiert Node.js Version
 */
export async function validateNodeVersion(
  logger: ValidationLogger,
  minVersion: string = '18.0.0'
): Promise<boolean> {
  try {
    const output = execSync('node --version', { encoding: 'utf-8' });
    const version = output.trim().replace('v', '');

    const versionParts = version.split('.');
    const minVersionParts = minVersion.split('.');

    const major = parseInt(versionParts[0]);
    const minMajor = parseInt(minVersionParts[0]);

    if (major >= minMajor) {
      logger.success('Node.js', `Version ${version} erforderliche Mindestversion erfüllt`, {
        version,
        minVersion,
      });
      return true;
    } else {
      logger.error('Node.js', `Version ${version} ist älter als erforderliche Mindestversion ${minVersion}`, {
        current: version,
        required: minVersion,
      });
      return false;
    }
  } catch (error) {
    logger.error(
      'Node.js',
      'Konnte Node.js Version nicht ermitteln',
      undefined,
      error instanceof Error ? error.stack : String(error)
    );
    return false;
  }
}

/**
 * Validiert npm Version
 */
export async function validateNpmVersion(
  logger: ValidationLogger,
  minVersion: string = '9.0.0'
): Promise<boolean> {
  try {
    const output = execSync('npm --version', { encoding: 'utf-8' });
    const version = output.trim();

    const versionParts = version.split('.');
    const minVersionParts = minVersion.split('.');

    const major = parseInt(versionParts[0]);
    const minMajor = parseInt(minVersionParts[0]);

    if (major >= minMajor) {
      logger.success('npm', `Version ${version} erforderliche Mindestversion erfüllt`, {
        version,
        minVersion,
      });
      return true;
    } else {
      logger.error('npm', `Version ${version} ist älter als erforderliche Mindestversion ${minVersion}`, {
        current: version,
        required: minVersion,
      });
      return false;
    }
  } catch (error) {
    logger.error(
      'npm',
      'Konnte npm Version nicht ermitteln',
      undefined,
      error instanceof Error ? error.stack : String(error)
    );
    return false;
  }
}

/**
 * Validiert Docker Installation
 */
export async function validateDockerInstallation(logger: ValidationLogger): Promise<boolean> {
  try {
    const dockerVersion = execSync('docker --version', { encoding: 'utf-8' });
    const dockerComposeVersion = execSync('docker-compose --version', { encoding: 'utf-8' });

    logger.success('Docker', 'Docker und Docker Compose installiert', {
      docker: dockerVersion.trim(),
      dockerCompose: dockerComposeVersion.trim(),
    });
    return true;
  } catch (error) {
    logger.error(
      'Docker',
      'Docker oder Docker Compose nicht installiert oder nicht im PATH',
      undefined,
      error instanceof Error ? error.stack : String(error)
    );
    return false;
  }
}

/**
 * Validiert Datenbankverbindung
 */
export async function validateDatabaseConnection(
  logger: ValidationLogger,
  connectionString: string
): Promise<boolean> {
  try {
    // Versuche mit psql zu verbinden
    const testQuery = execSync(
      `psql "${connectionString}" -c "SELECT NOW() as current_time;" --no-password`,
      { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );

    if (testQuery.includes('current_time')) {
      logger.success('Database', 'Verbindung zur PostgreSQL Datenbank erfolgreich', {
        connectionString: connectionString.split('@')[1] || 'localhost', // Nur Host zeigen, nicht Password
      });
      return true;
    } else {
      logger.error('Database', 'PostgreSQL Abfrage lieferte unerwartetes Ergebnis', {
        result: testQuery.substring(0, 100),
      });
      return false;
    }
  } catch (error) {
    logger.error(
      'Database',
      'Konnte sich nicht mit PostgreSQL verbinden. Stelle sicher dass die Datenbank läuft.',
      { connectionString: connectionString.split('@')[1] || 'unknown' },
      error instanceof Error ? error.stack : String(error)
    );
    return false;
  }
}

/**
 * Validiert Konfigurationsdateien
 */
export async function validateConfigurationFiles(
  logger: ValidationLogger,
  requiredFiles: string[] = [],
  projectRoot: string = process.cwd()
): Promise<boolean> {
  const defaultFiles = [
    'package.json',
    'tsconfig.json',
    'jest.config.js',
    'docker-compose.yml',
    '.env.local',
  ];

  const filesToCheck = requiredFiles.length > 0 ? requiredFiles : defaultFiles;
  const missingFiles: string[] = [];
  const foundFiles: string[] = [];

  for (const file of filesToCheck) {
    const filePath = path.join(projectRoot, file);
    if (fs.existsSync(filePath)) {
      foundFiles.push(file);
    } else {
      missingFiles.push(file);
    }
  }

  if (missingFiles.length === 0) {
    logger.success('Configuration', `Alle ${foundFiles.length} erforderlichen Konfigurationsdateien gefunden`, {
      files: foundFiles,
    });
    return true;
  } else if (missingFiles.length < filesToCheck.length) {
    logger.warning('Configuration', `${missingFiles.length} von ${filesToCheck.length} Konfigurationsdateien fehlen`, {
      missing: missingFiles,
      found: foundFiles,
    });
    return true; // Warnung, aber nicht kritisch
  } else {
    logger.error('Configuration', 'Erforderliche Konfigurationsdateien fehlen', {
      missing: missingFiles,
      required: filesToCheck,
    });
    return false;
  }
}

/**
 * Validiert Environment Variablen
 */
export async function validateEnvironmentVariables(
  logger: ValidationLogger,
  requiredVars: string[] = [],
  optionalVars: string[] = []
): Promise<boolean> {
  const defaultRequired = [
    'NODE_ENV',
    'DB_HOST',
    'DB_PORT',
    'DB_USER',
    'DB_PASS',
    'DB_NAME',
    'REDIS_HOST',
    'REDIS_PORT',
  ];

  const defaultOptional = ['VITE_API_URL', 'LOG_LEVEL'];

  const requiredToCheck = requiredVars.length > 0 ? requiredVars : defaultRequired;
  const optionalToCheck = optionalVars.length > 0 ? optionalVars : defaultOptional;

  const missingRequired: string[] = [];
  const missingOptional: string[] = [];
  const presentRequired: string[] = [];
  const presentOptional: string[] = [];

  // Prüfe erforderliche Variablen
  for (const varName of requiredToCheck) {
    if (process.env[varName]) {
      presentRequired.push(varName);
    } else {
      missingRequired.push(varName);
    }
  }

  // Prüfe optionale Variablen
  for (const varName of optionalToCheck) {
    if (process.env[varName]) {
      presentOptional.push(varName);
    } else {
      missingOptional.push(varName);
    }
  }

  let success = true;

  if (missingRequired.length > 0) {
    logger.error('Environment', 'Erforderliche Umgebungsvariablen fehlen', {
      missing: missingRequired,
      present: presentRequired.length,
    });
    success = false;
  } else {
    logger.success('Environment', 'Alle erforderlichen Umgebungsvariablen gesetzt', {
      count: presentRequired.length,
      variables: presentRequired,
    });
  }

  if (missingOptional.length > 0) {
    logger.warning('Environment', 'Optionale Umgebungsvariablen fehlen', {
      missing: missingOptional,
      present: presentOptional.length,
    });
  } else {
    logger.success('Environment', 'Alle optionalen Umgebungsvariablen gesetzt', {
      count: presentOptional.length,
      variables: presentOptional,
    });
  }

  return success;
}

/**
 * Validiert npm Dependencies
 */
export async function validateNpmDependencies(
  logger: ValidationLogger,
  projectRoot: string = process.cwd()
): Promise<boolean> {
  try {
    const packageJsonPath = path.join(projectRoot, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      logger.error('npm', 'package.json nicht gefunden', { path: packageJsonPath });
      return false;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const nodeModulesPath = path.join(projectRoot, 'node_modules');

    if (!fs.existsSync(nodeModulesPath)) {
      logger.error('npm', 'node_modules Directory nicht gefunden. Führe "npm install" aus.', {
        path: nodeModulesPath,
      });
      return false;
    }

    const dependencies = Object.keys(packageJson.dependencies || {});
    const devDependencies = Object.keys(packageJson.devDependencies || {});

    logger.success('npm', 'npm Dependencies installiert', {
      dependencies: dependencies.length,
      devDependencies: devDependencies.length,
      total: dependencies.length + devDependencies.length,
    });
    return true;
  } catch (error) {
    logger.error(
      'npm',
      'Fehler bei der Validierung von npm Dependencies',
      undefined,
      error instanceof Error ? error.stack : String(error)
    );
    return false;
  }
}

/**
 * Validiert Docker Compose Konfiguration
 */
export async function validateDockerComposeConfig(
  logger: ValidationLogger,
  projectRoot: string = process.cwd()
): Promise<boolean> {
  try {
    const composePath = path.join(projectRoot, 'docker-compose.yml');

    if (!fs.existsSync(composePath)) {
      logger.error('Docker Compose', 'docker-compose.yml nicht gefunden', { path: composePath });
      return false;
    }

    const output = execSync(`docker-compose -f "${composePath}" config`, { encoding: 'utf-8' });

    if (output.length > 0) {
      logger.success('Docker Compose', 'docker-compose.yml ist gültig', {
        path: composePath,
        size: output.length,
      });
      return true;
    }
  } catch (error) {
    logger.error(
      'Docker Compose',
      'docker-compose.yml hat Validierungsfehler',
      undefined,
      error instanceof Error ? error.message : String(error)
    );
    return false;
  }

  return false;
}
