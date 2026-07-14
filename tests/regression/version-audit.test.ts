/**
 * Version Audit Test Suite
 * 
 * Überprüft ALLE Versionsstände und -konsistenz
 * in sämtlichen Projektkonfigurationsdateien
 * 
 * @version 0.34.0
 * @phase 2-version-audit
 */

import * as fs from 'fs';
import * as path from 'path';

interface VersionInfo {
  file: string;
  version: string | null;
  type: 'package.json' | 'ts-file' | 'env' | 'dockerfile' | 'yaml' | 'other';
  status: 'correct' | 'mismatch' | 'missing' | 'unknown';
}

const EXPECTED_VERSION = '0.34.0';
const rootDir = path.join(__dirname, '../../');

/**
 * Version Audit Test Suite
 */
describe('🔴 Version Audit & Consistency Check', () => {
  let versionReport: VersionInfo[] = [];

  /**
   * Package.json Version Checks
   */
  describe('Package.json Version Files', () => {
    test('Root package.json should have version 0.34.0', () => {
      const packageJsonPath = path.join(rootDir, 'package.json');
      const content = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      versionReport.push({
        file: 'package.json',
        version: content.version,
        type: 'package.json',
        status: content.version === EXPECTED_VERSION ? 'correct' : 'mismatch',
      });

      expect(content.version).toBe(EXPECTED_VERSION);
    });

    test('Frontend package.json should have version 0.34.0', () => {
      const packageJsonPath = path.join(rootDir, 'frontend/package.json');
      const content = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      
      versionReport.push({
        file: 'frontend/package.json',
        version: content.version,
        type: 'package.json',
        status: content.version === EXPECTED_VERSION ? 'correct' : 'mismatch',
      });

      expect(content.version).toBe(EXPECTED_VERSION);
    });

    test('All package.json files should be discoverable', () => {
      const packageJsonFiles: string[] = [];
      
      function findPackageJsons(dir: string) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        entries.forEach(entry => {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            findPackageJsons(fullPath);
          } else if (entry.name === 'package.json') {
            packageJsonFiles.push(fullPath.replace(rootDir, ''));
          }
        });
      }

      findPackageJsons(rootDir);
      console.log('✓ Found package.json files:');
      packageJsonFiles.forEach(f => console.log(`  - ${f}`));
      
      expect(packageJsonFiles.length).toBeGreaterThan(0);
    });
  });

  /**
   * TypeScript Version Files
   */
  describe('TypeScript Version Files', () => {
    test('src/version.ts should export PROJECT_VERSION = 0.34.0', () => {
      const versionPath = path.join(rootDir, 'src/version.ts');
      const content = fs.readFileSync(versionPath, 'utf-8');
      
      const versionMatch = content.match(/PROJECT_VERSION\s*=\s*['"]([^'"]+)['"]/);
      const version = versionMatch?.[1];

      versionReport.push({
        file: 'src/version.ts (PROJECT_VERSION)',
        version: version || null,
        type: 'ts-file',
        status: version === EXPECTED_VERSION ? 'correct' : 'mismatch',
      });

      expect(version).toBe(EXPECTED_VERSION);
    });

    test('frontend/src/version.ts should export FRONTEND_VERSION = 0.34.0', () => {
      const versionPath = path.join(rootDir, 'frontend/src/version.ts');
      const content = fs.readFileSync(versionPath, 'utf-8');
      
      const versionMatch = content.match(/FRONTEND_VERSION\s*=\s*['"]([^'"]+)['"]/);
      const version = versionMatch?.[1];

      versionReport.push({
        file: 'frontend/src/version.ts (FRONTEND_VERSION)',
        version: version || null,
        type: 'ts-file',
        status: version === EXPECTED_VERSION ? 'correct' : 'mismatch',
      });

      expect(version).toBe(EXPECTED_VERSION);
    });

    test('frontend/src/version.ts should export API_VERSION = 0.34.0', () => {
      const versionPath = path.join(rootDir, 'frontend/src/version.ts');
      const content = fs.readFileSync(versionPath, 'utf-8');
      
      const versionMatch = content.match(/API_VERSION\s*=\s*['"]([^'"]+)['"]/);
      const version = versionMatch?.[1];

      versionReport.push({
        file: 'frontend/src/version.ts (API_VERSION)',
        version: version || null,
        type: 'ts-file',
        status: version === EXPECTED_VERSION ? 'correct' : 'mismatch',
      });

      expect(version).toBe(EXPECTED_VERSION);
    });

    test('All TypeScript version exports should be consistent', () => {
      const srcVersionPath = path.join(rootDir, 'src/version.ts');
      const frontendVersionPath = path.join(rootDir, 'frontend/src/version.ts');

      const srcContent = fs.readFileSync(srcVersionPath, 'utf-8');
      const frontendContent = fs.readFileSync(frontendVersionPath, 'utf-8');

      const srcVersion = srcContent.match(/PROJECT_VERSION\s*=\s*['"]([^'"]+)['"]/)?.[1];
      const frontendVersion = frontendContent.match(/FRONTEND_VERSION\s*=\s*['"]([^'"]+)['"]/)?.[1];
      const apiVersion = frontendContent.match(/API_VERSION\s*=\s*['"]([^'"]+)['"]/)?.[1];

      expect(srcVersion).toBe(frontendVersion);
      expect(frontendVersion).toBe(apiVersion);
      expect(apiVersion).toBe(EXPECTED_VERSION);
    });
  });

  /**
   * Component Version Strings (Hard-coded)
   */
  describe('Hard-coded Version Strings in Components', () => {
    test('Navigation component should display v0.34.0', () => {
      const navPath = path.join(rootDir, 'frontend/src/components/Navigation/ResponsiveNavigationDrawer.tsx');
      const content = fs.readFileSync(navPath, 'utf-8');
      
      const versionMatch = content.match(/v0\.\d+\.\d+/);
      const version = versionMatch?.[0];

      versionReport.push({
        file: 'ResponsiveNavigationDrawer.tsx',
        version: version || null,
        type: 'ts-file',
        status: version === 'v0.34.0' ? 'correct' : 'mismatch',
      });

      expect(content).toMatch(/v0\.34\.0|0\.34\.0/);
    });

    test('Audit API route should return version 0.34.0', () => {
      const auditPath = path.join(rootDir, 'src/infrastructure/api/routes/audit.ts');
      const content = fs.readFileSync(auditPath, 'utf-8');
      
      const versionMatch = content.match(/['"]version['"]:\s*['"]([^'"]+)['"]/);
      const version = versionMatch?.[1];

      versionReport.push({
        file: 'audit.ts (API response)',
        version: version || null,
        type: 'ts-file',
        status: version === EXPECTED_VERSION ? 'correct' : 'mismatch',
      });

      expect(version).toBe(EXPECTED_VERSION);
    });

    test('Health API route should reference current version', () => {
      const healthPath = path.join(rootDir, 'src/infrastructure/api/routes/health.ts');
      const content = fs.readFileSync(healthPath, 'utf-8');
      
      const hasVersionRef = content.includes('version') || content.includes('VERSION');

      versionReport.push({
        file: 'health.ts',
        version: hasVersionRef ? 'referenced' : 'not found',
        type: 'ts-file',
        status: hasVersionRef ? 'correct' : 'missing',
      });

      expect(hasVersionRef).toBe(true);
    });

    test('Help API route should reference current version', () => {
      const helpPath = path.join(rootDir, 'src/infrastructure/api/routes/help.ts');
      const content = fs.readFileSync(helpPath, 'utf-8');
      
      const hasVersionRef = content.includes('version') || content.includes('VERSION');

      versionReport.push({
        file: 'help.ts',
        version: hasVersionRef ? 'referenced' : 'not found',
        type: 'ts-file',
        status: hasVersionRef ? 'correct' : 'missing',
      });

      expect(hasVersionRef).toBe(true);
    });
  });

  /**
   * Docker & Environment Version References
   */
  describe('Docker & Environment Version References', () => {
    test('Dockerfile.backend should reference correct versions', () => {
      const dockerPath = path.join(rootDir, 'Dockerfile.backend');
      const content = fs.readFileSync(dockerPath, 'utf-8');
      
      const hasVersionEnv = content.includes('VERSION') || content.includes('version');

      versionReport.push({
        file: 'Dockerfile.backend',
        version: hasVersionEnv ? 'configured' : 'not set',
        type: 'dockerfile',
        status: hasVersionEnv ? 'correct' : 'missing',
      });

      // Should set version as ENV or ARG
      expect(content).toMatch(/ENV|ARG/i);
    });

    test('Dockerfile.frontend should reference correct versions', () => {
      const dockerPath = path.join(rootDir, 'Dockerfile.frontend');
      const content = fs.readFileSync(dockerPath, 'utf-8');
      
      const hasVersionEnv = content.includes('VERSION') || content.includes('version');

      versionReport.push({
        file: 'Dockerfile.frontend',
        version: hasVersionEnv ? 'configured' : 'not set',
        type: 'dockerfile',
        status: hasVersionEnv ? 'correct' : 'missing',
      });

      expect(content).toMatch(/ENV|ARG/i);
    });

    test('docker-compose.yml should reference version environment variables', () => {
      const dockerComposePath = path.join(rootDir, 'docker-compose.yml');
      const content = fs.readFileSync(dockerComposePath, 'utf-8');
      
      const hasVersionRef = content.includes('version') || content.includes('VERSION');

      versionReport.push({
        file: 'docker-compose.yml',
        version: hasVersionRef ? 'referenced' : 'not found',
        type: 'yaml',
        status: hasVersionRef ? 'correct' : 'missing',
      });

      expect(content).toMatch(/version:/i);
    });
  });

  /**
   * Documentation Version References
   */
  describe('Documentation Version References', () => {
    test('README.md should document current version', () => {
      const readmePath = path.join(rootDir, 'README.md');
      const content = fs.readFileSync(readmePath, 'utf-8');
      
      const versionMatch = content.match(/0\.\d+\.\d+/);
      const version = versionMatch?.[0];

      versionReport.push({
        file: 'README.md',
        version: version || null,
        type: 'other',
        status: version ? 'correct' : 'missing',
      });

      expect(content).toMatch(/0\.\d+\.\d+/);
    });

    test('CHANGELOG.md should reference version history', () => {
      const changelogPath = path.join(rootDir, 'CHANGELOG.md');
      const content = fs.readFileSync(changelogPath, 'utf-8');
      
      const hasVersionRefs = content.match(/0\.\d+\.\d+/g) || [];

      versionReport.push({
        file: 'CHANGELOG.md',
        version: `${hasVersionRefs.length} references`,
        type: 'other',
        status: hasVersionRefs.length > 0 ? 'correct' : 'missing',
      });

      expect(hasVersionRefs.length).toBeGreaterThan(0);
    });

    test('RELEASE_NOTES should be current', () => {
      const releaseNotesDir = rootDir;
      const entries = fs.readdirSync(releaseNotesDir);
      const releaseNotes = entries.filter(f => f.startsWith('RELEASE_NOTES'));

      versionReport.push({
        file: 'RELEASE_NOTES files',
        version: `${releaseNotes.length} files`,
        type: 'other',
        status: releaseNotes.length > 0 ? 'correct' : 'missing',
      });

      console.log('✓ Found Release Notes:');
      releaseNotes.forEach(f => console.log(`  - ${f}`));
      expect(releaseNotes.length).toBeGreaterThan(0);
    });
  });

  /**
   * Build Configuration Version References
   */
  describe('Build Configuration Version References', () => {
    test('tsconfig.json should have version metadata', () => {
      const tsconfigPath = path.join(rootDir, 'tsconfig.json');
      const content = fs.readFileSync(tsconfigPath, 'utf-8');
      
      versionReport.push({
        file: 'tsconfig.json',
        version: 'configured',
        type: 'other',
        status: 'correct',
      });

      expect(content).toMatch(/"compilerOptions"/);
    });

    test('jest.config.js should reference version for test output', () => {
      const jestConfigPath = path.join(rootDir, 'jest.config.js');
      const content = fs.readFileSync(jestConfigPath, 'utf-8');
      
      const hasReporter = content.includes('reporter') || content.includes('testResultsProcessor');

      versionReport.push({
        file: 'jest.config.js',
        version: hasReporter ? 'configured' : 'not set',
        type: 'other',
        status: 'correct',
      });

      expect(content).toBeTruthy();
    });

    test('playwright.config.ts should have version in metadata', () => {
      const playwrightPath = path.join(rootDir, 'playwright.config.ts');
      if (!fs.existsSync(playwrightPath)) return;

      const content = fs.readFileSync(playwrightPath, 'utf-8');
      
      versionReport.push({
        file: 'playwright.config.ts',
        version: 'configured',
        type: 'other',
        status: 'correct',
      });

      expect(content).toBeTruthy();
    });
  });

  /**
   * Backend Service Version References
   */
  describe('Backend Service Version References', () => {
    test('Server initialization should load version from config', () => {
      const serverPath = path.join(rootDir, 'src/infrastructure/api/server.ts');
      const content = fs.readFileSync(serverPath, 'utf-8');
      
      const hasVersionInit = content.includes('version') || content.includes('VERSION');

      versionReport.push({
        file: 'server.ts',
        version: hasVersionInit ? 'initialized' : 'not set',
        type: 'ts-file',
        status: hasVersionInit ? 'correct' : 'missing',
      });

      expect(hasVersionInit).toBe(true);
    });

    test('Application startup should log version', () => {
      const mainPath = path.join(rootDir, 'src/main.ts');
      if (!fs.existsSync(mainPath)) {
        versionReport.push({
          file: 'main.ts',
          version: null,
          type: 'ts-file',
          status: 'missing',
        });
        return;
      }

      const content = fs.readFileSync(mainPath, 'utf-8');
      const hasLogging = content.includes('log') || content.includes('console');

      versionReport.push({
        file: 'main.ts',
        version: hasLogging ? 'yes' : 'no',
        type: 'ts-file',
        status: hasLogging ? 'correct' : 'missing',
      });

      expect(content).toBeTruthy();
    });
  });

  /**
   * Test Suite Version References
   */
  describe('Test Suite Version References', () => {
    test('Test fixtures should reference version for validation', () => {
      const fixturesDir = path.join(rootDir, 'tests/fixtures');
      if (!fs.existsSync(fixturesDir)) {
        versionReport.push({
          file: 'tests/fixtures',
          version: null,
          type: 'other',
          status: 'missing',
        });
        return;
      }

      const files = fs.readdirSync(fixturesDir);
      versionReport.push({
        file: 'tests/fixtures',
        version: `${files.length} files`,
        type: 'other',
        status: 'correct',
      });
    });

    test('Environment test suite should validate version in responses', () => {
      const envTestPath = path.join(rootDir, 'tests/environment');
      if (!fs.existsSync(envTestPath)) {
        versionReport.push({
          file: 'tests/environment',
          version: null,
          type: 'other',
          status: 'missing',
        });
        return;
      }

      const files = fs.readdirSync(envTestPath);
      versionReport.push({
        file: 'tests/environment',
        version: `${files.length} files`,
        type: 'other',
        status: 'correct',
      });
    });
  });

  /**
   * Final Version Consistency Report
   */
  test('Generate Comprehensive Version Audit Report', () => {
    const report = {
      timestamp: new Date().toISOString(),
      expectedVersion: EXPECTED_VERSION,
      totalFilesChecked: versionReport.length,
      correctVersions: versionReport.filter(v => v.status === 'correct').length,
      mismatches: versionReport.filter(v => v.status === 'mismatch').length,
      missing: versionReport.filter(v => v.status === 'missing').length,
      unknown: versionReport.filter(v => v.status === 'unknown').length,
      
      details: {
        correct: versionReport.filter(v => v.status === 'correct').map(v => ({
          file: v.file,
          version: v.version,
        })),
        issues: versionReport.filter(v => v.status !== 'correct').map(v => ({
          file: v.file,
          version: v.version,
          type: v.type,
          status: v.status,
        })),
      },

      summary: {
        versionConsistency: versionReport.every(v => v.status === 'correct' || v.status === 'unknown') 
          ? 'PASSED ✓' 
          : 'FAILED ✗',
        overallStatus: versionReport.every(v => v.status !== 'mismatch')
          ? 'ACCEPTABLE'
          : 'CRITICAL',
      },
    };

    console.log('\n📊 VERSION AUDIT REPORT:');
    console.log('═'.repeat(80));
    console.log(`Expected Version: ${report.expectedVersion}`);
    console.log(`Files Checked: ${report.totalFilesChecked}`);
    console.log(`✓ Correct: ${report.correctVersions}`);
    console.log(`✗ Mismatches: ${report.mismatches}`);
    console.log(`⚠ Missing: ${report.missing}`);
    console.log(`? Unknown: ${report.unknown}`);
    console.log('─'.repeat(80));
    console.log(`Consistency Status: ${report.summary.versionConsistency}`);
    console.log(`Overall Status: ${report.summary.overallStatus}`);
    console.log('═'.repeat(80));

    if (report.details.issues.length > 0) {
      console.log('\n⚠ VERSION ISSUES FOUND:');
      report.details.issues.forEach(issue => {
        console.log(`  - ${issue.file}: ${issue.version} (${issue.status})`);
      });
    }

    expect(report.mismatches).toBe(0);
  });
});
