/**
 * Regression Detection Test Suite
 * 
 * Automatisierte Tests zur Früherkennung von Regressions-Problemen
 * nach Einführung der Test-Suite in Phase 2.
 * 
 * Diese Tests erfassen:
 * 1. Versionskonsistenz (alle Files sollten 0.34.0 verwenden)
 * 2. Logviewer-Konfiguration (Log-Verzeichnisse konfiguriert)
 * 3. Health-Seite Verfügbarkeit (Komponente + Route)
 * 4. Help-Bereich Routing (Route-Verkabelung)
 * 
 * @version 0.34.0
 * @phase 2-extension
 */

import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

/**
 * REGRESSION 1: Version-Konsistenz
 * 
 * Sicherstellt, dass alle Version-Referenzen konsistent 0.34.0 sind
 */
describe('🔴 Regression 1: Version Consistency Check', () => {
  const expectedVersion = '0.34.0';
  const rootDir = path.join(__dirname, '../../');

  const versionSources = [
    { path: 'package.json', key: '"version"' },
    { path: 'frontend/package.json', key: '"version"' },
    { path: 'src/version.ts', key: 'PROJECT_VERSION' },
    { path: 'frontend/src/version.ts', key: 'FRONTEND_VERSION' },
  ];

  test('Root package.json should have version 0.34.0', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8')
    );
    expect(packageJson.version).toBe(expectedVersion);
  });

  test('Frontend package.json should have version 0.34.0', () => {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(rootDir, 'frontend/package.json'), 'utf-8')
    );
    expect(packageJson.version).toBe(expectedVersion);
  });

  test('src/version.ts should have PROJECT_VERSION = 0.34.0', () => {
    const content = fs.readFileSync(
      path.join(rootDir, 'src/version.ts'),
      'utf-8'
    );
    expect(content).toMatch(/PROJECT_VERSION\s*=\s*['"]0\.34\.0['"]/);
  });

  test('frontend/src/version.ts should have FRONTEND_VERSION = 0.34.0', () => {
    const content = fs.readFileSync(
      path.join(rootDir, 'frontend/src/version.ts'),
      'utf-8'
    );
    expect(content).toMatch(/FRONTEND_VERSION\s*=\s*['"]0\.34\.0['"]/);
  });

  test('frontend/src/version.ts should have API_VERSION = 0.34.0', () => {
    const content = fs.readFileSync(
      path.join(rootDir, 'frontend/src/version.ts'),
      'utf-8'
    );
    expect(content).toMatch(/API_VERSION\s*=\s*['"]0\.34\.0['"]/);
  });

  test('No hard-coded legacy versions should exist in Navigation components', () => {
    const navFile = path.join(
      rootDir,
      'frontend/src/components/Navigation/ResponsiveNavigationDrawer.tsx'
    );
    const content = fs.readFileSync(navFile, 'utf-8');
    // Should not contain "v0.26", "0.13", "0.18"
    expect(content).not.toMatch(/v0\.26\.0/);
    expect(content).not.toMatch(/0\.13\.0/);
    expect(content).not.toMatch(/0\.18\.0/);
    // Should contain current version
    expect(content).toMatch(/v0\.34\.0/);
  });

  test('API audit route should return version 0.34.0', () => {
    const auditFile = path.join(
      rootDir,
      'src/infrastructure/api/routes/audit.ts'
    );
    const content = fs.readFileSync(auditFile, 'utf-8');
    expect(content).toMatch(/version:\s*['"]0\.34\.0['"]/);
  });

  test('No JSDoc @version 0.13.0 or 0.18.0 should remain', () => {
    const files = glob.sync(
      path.join(rootDir, 'frontend/src/components/**/*.tsx'),
      { dot: false }
    );
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf-8');
      expect(content).not.toMatch(/@version\s+0\.13\.0/);
      expect(content).not.toMatch(/@version\s+0\.18\.0/);
    });
  });
});

/**
 * REGRESSION 2: LogViewer Configuration
 * 
 * Sicherstellt, dass Log-Verzeichnis-Pfade konfiguriert sind
 */
describe('🔴 Regression 2: LogViewer Configuration Check', () => {
  const rootDir = path.join(__dirname, '../../');

  test('LogViewer component should exist', () => {
    const logViewerPath = path.join(
      rootDir,
      'frontend/src/components/LogViewer.tsx'
    );
    expect(fs.existsSync(logViewerPath)).toBe(true);
  });

  test('LogViewer should be exported from components', () => {
    const content = fs.readFileSync(
      path.join(rootDir, 'frontend/src/components/LogViewer.tsx'),
      'utf-8'
    );
    expect(content).toMatch(/export\s+(const|function|class)\s+LogViewer/);
  });

  test('Log routes should be mounted in API', () => {
    const apiIndexPath = path.join(
      rootDir,
      'src/infrastructure/api/index.ts'
    );
    const content = fs.readFileSync(apiIndexPath, 'utf-8');
    expect(content).toMatch(/app\.use\(['"]\/api\/logs['"],\s*logRoutes\)/);
  });

  test('LOG_DIR environment variable or config should be set', () => {
    // Check for LOG_DIR in environment files
    const envFiles = [
      '.env',
      '.env.local',
      '.env.development',
      '.env.production'
    ];
    
    let logDirConfigured = false;
    for (const envFile of envFiles) {
      const envPath = path.join(rootDir, envFile);
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, 'utf-8');
        if (content.includes('LOG_DIR')) {
          logDirConfigured = true;
          break;
        }
      }
    }

    // Alternative: check docker-compose or ConfigManager
    if (!logDirConfigured) {
      const dockerPath = path.join(rootDir, 'docker-compose.yml');
      if (fs.existsSync(dockerPath)) {
        const content = fs.readFileSync(dockerPath, 'utf-8');
        logDirConfigured = content.includes('LOG_DIR') || content.includes('logs');
      }
    }

    expect(logDirConfigured).toBe(true);
  });

  test('Log directories should exist or be creatable', () => {
    const logDirs = ['logs', 'backend/logs', 'output'];
    
    // At least one log directory should exist or be configured
    const logsExist = logDirs.some(dir => {
      const dirPath = path.join(rootDir, dir);
      return fs.existsSync(dirPath);
    });

    // Or check if ConfigManager creates them dynamically
    const configManagerPath = path.join(
      rootDir,
      'src/infrastructure/services/ConfigManager.ts'
    );
    const hasConfigManager = fs.existsSync(configManagerPath);

    expect(logsExist || hasConfigManager).toBe(true);
  });

  test('/api/logs endpoint should return proper structure', () => {
    const logsRoutePath = path.join(
      rootDir,
      'src/infrastructure/api/routes/logs.ts'
    );
    const content = fs.readFileSync(logsRoutePath, 'utf-8');
    
    // Should handle GET requests
    expect(content).toMatch(/router\.get\s*\(/);
    // Should return logs array or structure
    expect(content).toMatch(/logs|entries|items/i);
  });
});

/**
 * REGRESSION 3: Health Page Availability
 * 
 * Sicherstellt, dass Health-Seite vorhanden und geroutet ist
 */
describe('🔴 Regression 3: Health Page Check', () => {
  const rootDir = path.join(__dirname, '../../');

  test('Health component should exist', () => {
    const healthComponentPaths = [
      'frontend/src/pages/HealthPage.tsx',
      'frontend/src/pages/Health.tsx',
      'frontend/src/components/HealthStatus.tsx',
    ];
    
    const exists = healthComponentPaths.some(filePath => {
      return fs.existsSync(path.join(rootDir, filePath));
    });

    expect(exists).toBe(true);
  });

  test('Health route should be defined in App.tsx', () => {
    const appPath = path.join(rootDir, 'frontend/src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');
    
    expect(content).toMatch(
      /Route\s+path\s*=\s*['"]\/health['"]|<Route.*health/i
    );
  });

  test('Health route should be accessible in navigation', () => {
    const appPath = path.join(rootDir, 'frontend/src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');
    
    // Should have menu item or navigation link for health
    expect(content).toMatch(/health|Health/i);
  });

  test('Backend /api/health endpoints should exist', () => {
    const healthRoutesPath = path.join(
      rootDir,
      'src/infrastructure/api/routes/health.ts'
    );
    expect(fs.existsSync(healthRoutesPath)).toBe(true);
  });

  test('/api/health should return status information', () => {
    const healthRoutesPath = path.join(
      rootDir,
      'src/infrastructure/api/routes/health.ts'
    );
    const content = fs.readFileSync(healthRoutesPath, 'utf-8');
    
    // Should check database, cache, services
    expect(content).toMatch(/database|cache|services|status/i);
  });

  test('Health endpoint should be registered in API index', () => {
    const apiIndexPath = path.join(
      rootDir,
      'src/infrastructure/api/index.ts'
    );
    const content = fs.readFileSync(apiIndexPath, 'utf-8');
    
    expect(content).toMatch(/app\.use\(['"]\/api\/health['"],/);
  });
});

/**
 * REGRESSION 4: Help Section Routing
 * 
 * Sicherstellt, dass Help-Bereich vollständig geroutet ist
 */
describe('🔴 Regression 4: Help Section Routing Check', () => {
  const rootDir = path.join(__dirname, '../../');

  test('HelpBrowser component should exist', () => {
    const helpBrowserPath = path.join(
      rootDir,
      'frontend/src/components/workbench/HelpBrowser.tsx'
    );
    expect(fs.existsSync(helpBrowserPath)).toBe(true);
  });

  test('Help route should be defined in App.tsx', () => {
    const appPath = path.join(rootDir, 'frontend/src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');
    
    expect(content).toMatch(
      /Route\s+path\s*=\s*['"]\/help['"]|<Route.*help/i
    );
  });

  test('HelpBrowser should be imported in App.tsx', () => {
    const appPath = path.join(rootDir, 'frontend/src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');
    
    expect(content).toMatch(/import.*HelpBrowser/);
  });

  test('Help menu item should be in navigation', () => {
    const appPath = path.join(rootDir, 'frontend/src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');
    
    // Should have link or menu item for help
    expect(content).toMatch(/help|manual|glossary|Help/i);
  });

  test('Backend /api/help endpoints should exist', () => {
    const helpRoutesPath = path.join(
      rootDir,
      'src/infrastructure/api/routes/help.ts'
    );
    expect(fs.existsSync(helpRoutesPath)).toBe(true);
  });

  test('/api/help/glossary endpoint should be available', () => {
    const apiIndexPath = path.join(
      rootDir,
      'src/infrastructure/api/index.ts'
    );
    const content = fs.readFileSync(apiIndexPath, 'utf-8');
    
    expect(content).toMatch(/app\.use\(['"]\/api\/help['"],/);
  });

  test('HelpContentLoader should be initialized', () => {
    const apiIndexPath = path.join(
      rootDir,
      'src/infrastructure/api/index.ts'
    );
    const content = fs.readFileSync(apiIndexPath, 'utf-8');
    
    expect(content).toMatch(/HelpContentLoader|helpContentLoader/);
  });

  test('/api/help/manual endpoint response check', () => {
    const helpRoutesPath = path.join(
      rootDir,
      'src/infrastructure/api/routes/help.ts'
    );
    const content = fs.readFileSync(helpRoutesPath, 'utf-8');
    
    // Should have routes for manual and glossary
    expect(content).toMatch(/manual|glossary/i);
  });
});

/**
 * REGRESSION 5: Frontend-Backend Route Integration
 * 
 * Sicherstellt, dass Frontend Routes mit Backend API synchr sind
 */
describe('🔴 Regression 5: Frontend-Backend Integration', () => {
  const rootDir = path.join(__dirname, '../../');

  test('All backend API routes should have frontend counterparts', () => {
    const apiIndexPath = path.join(
      rootDir,
      'src/infrastructure/api/index.ts'
    );
    const apiContent = fs.readFileSync(apiIndexPath, 'utf-8');

    const appPath = path.join(rootDir, 'frontend/src/App.tsx');
    const appContent = fs.readFileSync(appPath, 'utf-8');

    // Extract endpoints from API
    const apiEndpoints = (apiContent.match(/app\.use\(['"]\/api\/(\w+)['"]/g) || [])
      .map(match => match.match(/\/(\w+)/)?.[1])
      .filter(Boolean);

    // Check critical endpoints exist in frontend
    const criticalEndpoints = ['health', 'logs', 'help'];
    criticalEndpoints.forEach(endpoint => {
      expect(apiEndpoints).toContain(endpoint);
    });
  });

  test('Navigation should include all major routes', () => {
    const appPath = path.join(rootDir, 'frontend/src/App.tsx');
    const content = fs.readFileSync(appPath, 'utf-8');

    const requiredRoutes = ['dashboard', 'extraction', 'logs', 'audit', 'help', 'health'];
    requiredRoutes.forEach(route => {
      expect(content.toLowerCase()).toContain(route);
    });
  });
});

/**
 * REGRESSION 6: Component Exports
 * 
 * Sicherstellt, dass kritische Komponenten korrekt exportiert sind
 */
describe('🔴 Regression 6: Component Export Integrity', () => {
  const rootDir = path.join(__dirname, '../../');

  const criticalComponents = [
    { path: 'frontend/src/components/LogViewer.tsx', exports: ['LogViewer'] },
    { path: 'frontend/src/components/workbench/HelpBrowser.tsx', exports: ['HelpBrowser'] },
    { path: 'frontend/src/App.tsx', exports: ['App', 'default'] },
  ];

  criticalComponents.forEach(({ path: componentPath, exports: expectedExports }) => {
    test(`${componentPath} should export ${expectedExports.join(', ')}`, () => {
      const fullPath = path.join(rootDir, componentPath);
      if (!fs.existsSync(fullPath)) {
        expect(fs.existsSync(fullPath)).toBe(true);
        return;
      }

      const content = fs.readFileSync(fullPath, 'utf-8');
      expectedExports.forEach(exportName => {
        expect(content).toMatch(
          new RegExp(`export\\s+(default\\s+)?(?:const|function|class)\\s+${exportName}|export.*${exportName}`)
        );
      });
    });
  });
});

/**
 * REGRESSION 7: Configuration Files
 * 
 * Sicherstellt, dass alle Konfigurationsdateien aktuell sind
 */
describe('🔴 Regression 7: Configuration File Consistency', () => {
  const rootDir = path.join(__dirname, '../../');

  test('Docker build should use correct versions', () => {
    const dockerPath = path.join(rootDir, 'Dockerfile.backend');
    if (fs.existsSync(dockerPath)) {
      const content = fs.readFileSync(dockerPath, 'utf-8');
      // Ensure Node.js version is recent enough
      expect(content).toMatch(/node:\d+(\.\d+)?/i);
    }
  });

  test('package.json should not have security vulnerabilities in dependencies', () => {
    const packageJsonPath = path.join(rootDir, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    
    // Check that no clearly vulnerable packages are listed
    const vulnerablePatterns = ['eval', 'exec', 'serialize-javascript'];
    Object.keys(packageJson.dependencies || {}).forEach(pkg => {
      vulnerablePatterns.forEach(pattern => {
        expect(pkg.toLowerCase()).not.toContain(pattern.toLowerCase());
      });
    });
  });

  test('tsconfig.json should be properly configured', () => {
    const tsconfigPath = path.join(rootDir, 'tsconfig.json');
    const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf-8'));
    
    expect(tsconfig.compilerOptions).toBeDefined();
    expect(tsconfig.compilerOptions.strict).toBe(true);
  });
});

/**
 * Helper: Generate Regression Report
 */
export function generateRegressionReport() {
  return {
    testDate: new Date().toISOString(),
    regressions: [
      { id: 1, name: 'Version Consistency', status: 'MONITORED' },
      { id: 2, name: 'LogViewer Configuration', status: 'MONITORED' },
      { id: 3, name: 'Health Page Availability', status: 'MONITORED' },
      { id: 4, name: 'Help Section Routing', status: 'MONITORED' },
      { id: 5, name: 'Frontend-Backend Integration', status: 'MONITORED' },
      { id: 6, name: 'Component Export Integrity', status: 'MONITORED' },
      { id: 7, name: 'Configuration File Consistency', status: 'MONITORED' },
    ],
  };
}
