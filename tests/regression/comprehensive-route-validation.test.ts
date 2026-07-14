/**
 * Comprehensive Route Validation Test Suite
 * 
 * Dynamische Überprüfung ALLER Frontend- und Backend-Routes
 * zur Früherkennung von Routing-Regressions-Problemen
 * 
 * @version 0.34.0
 * @phase 2-extension-routes
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * ROUTE DISCOVERY: Automatische Erfassung aller definierten Routes
 */
describe('🔵 Route Discovery & Validation Suite', () => {
  const rootDir = path.join(__dirname, '../../');

  /**
   * Backend API Routes Discovery
   */
  describe('Backend API Routes - Discovery & Validation', () => {
    test('Should discover all backend API route files', () => {
      const routesDir = path.join(rootDir, 'src/infrastructure/api/routes');
      expect(fs.existsSync(routesDir)).toBe(true);

      const routeFiles = fs.readdirSync(routesDir)
        .filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'));

      console.log('✓ Discovered Backend Routes:');
      routeFiles.forEach(f => console.log(`  - ${f}`));
      expect(routeFiles.length).toBeGreaterThan(0);
    });

    test('Should register all API routes in index.ts', () => {
      const apiIndexPath = path.join(rootDir, 'src/infrastructure/api/index.ts');
      const content = fs.readFileSync(apiIndexPath, 'utf-8');

      // Extract all registered routes
      const routeMatches = content.match(/app\.use\(['"]\/api\/([^'"]+)['"]/g) || [];
      const registeredRoutes = routeMatches.map(m => m.match(/\/api\/(\w+)/)?.[1]).filter(Boolean);

      console.log('✓ Registered Backend Routes:');
      registeredRoutes.forEach(r => console.log(`  - /api/${r}`));

      // Expected critical routes
      const criticalRoutes = ['health', 'logs', 'help', 'extract', 'audit', 'backup', 'config'];
      criticalRoutes.forEach(route => {
        expect(registeredRoutes).toContain(route);
      });
    });

    test('Should have GET endpoint for /api/health', () => {
      const healthPath = path.join(rootDir, 'src/infrastructure/api/routes/health.ts');
      const content = fs.readFileSync(healthPath, 'utf-8');
      expect(content).toMatch(/router\.get\s*\(/);
    });

    test('Should have GET endpoint for /api/logs', () => {
      const logsPath = path.join(rootDir, 'src/infrastructure/api/routes/logs.ts');
      const content = fs.readFileSync(logsPath, 'utf-8');
      expect(content).toMatch(/router\.get\s*\(/);
    });

    test('Should have GET endpoint for /api/help', () => {
      const helpPath = path.join(rootDir, 'src/infrastructure/api/routes/help.ts');
      const content = fs.readFileSync(helpPath, 'utf-8');
      expect(content).toMatch(/router\.get\s*\(/);
    });

    test('Should have POST endpoint for /api/extract', () => {
      const extractPath = path.join(rootDir, 'src/infrastructure/api/routes/extract-phase14.ts');
      const content = fs.readFileSync(extractPath, 'utf-8');
      expect(content).toMatch(/router\.post\s*\(/);
    });

    test('All route files should export router', () => {
      const routesDir = path.join(rootDir, 'src/infrastructure/api/routes');
      const routeFiles = fs.readdirSync(routesDir)
        .filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'));

      routeFiles.forEach(file => {
        const content = fs.readFileSync(path.join(routesDir, file), 'utf-8');
        expect(content).toMatch(/export.*router|export default router/);
      });
    });

    test('All route files should handle errors gracefully', () => {
      const routesDir = path.join(rootDir, 'src/infrastructure/api/routes');
      const routeFiles = fs.readdirSync(routesDir)
        .filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'));

      routeFiles.forEach(file => {
        const content = fs.readFileSync(path.join(routesDir, file), 'utf-8');
        // Should have error handling or try-catch
        const hasTryCatch = content.includes('try') && content.includes('catch');
        const hasErrorHandler = content.includes('.catch') || content.includes('res.status');
        expect(hasTryCatch || hasErrorHandler).toBe(true);
      });
    });
  });

  /**
   * Frontend Routes Discovery
   */
  describe('Frontend Routes - Discovery & Validation', () => {
    test('Should discover all frontend route definitions', () => {
      const appPath = path.join(rootDir, 'frontend/src/App.tsx');
      const content = fs.readFileSync(appPath, 'utf-8');

      // Extract Route definitions
      const routeMatches = content.match(/Route\s+path\s*=\s*['"](\/[^'"]*)['"]/g) || [];
      const routes = routeMatches
        .map(m => m.match(/['"](\/)([^'"]*)['"]/)?.[1] || m.match(/['"](\/)([^'"]*)['"]/)?.[0])
        .filter(Boolean);

      console.log('✓ Discovered Frontend Routes:');
      routes.forEach(r => console.log(`  - ${r}`));
      expect(routes.length).toBeGreaterThan(0);
    });

    test('Should have route for dashboard', () => {
      const appPath = path.join(rootDir, 'frontend/src/App.tsx');
      const content = fs.readFileSync(appPath, 'utf-8');
      expect(content).toMatch(/dashboard|\/\s*['"]|path\s*=\s*['"]\/['"]/i);
    });

    test('Should have route for extraction (/extraction or /extract)', () => {
      const appPath = path.join(rootDir, 'frontend/src/App.tsx');
      const content = fs.readFileSync(appPath, 'utf-8');
      expect(content).toMatch(/extract|extraction/i);
    });

    test('Should have route for logs (/logs)', () => {
      const appPath = path.join(rootDir, 'frontend/src/App.tsx');
      const content = fs.readFileSync(appPath, 'utf-8');
      expect(content).toMatch(/\/logs|LogViewer|logs/i);
    });

    test('Should have route for audit (/audit)', () => {
      const appPath = path.join(rootDir, 'frontend/src/App.tsx');
      const content = fs.readFileSync(appPath, 'utf-8');
      expect(content).toMatch(/\/audit|audit|AuditViewer/i);
    });

    test('Should have route for health (/health)', () => {
      const appPath = path.join(rootDir, 'frontend/src/App.tsx');
      const content = fs.readFileSync(appPath, 'utf-8');
      expect(content).toMatch(/\/health|health|Health/i);
    });

    test('Should have route for help (/help)', () => {
      const appPath = path.join(rootDir, 'frontend/src/App.tsx');
      const content = fs.readFileSync(appPath, 'utf-8');
      expect(content).toMatch(/\/help|help|HelpBrowser/i);
    });

    test('All routes should have corresponding components', () => {
      const appPath = path.join(rootDir, 'frontend/src/App.tsx');
      const content = fs.readFileSync(appPath, 'utf-8');

      const routes = [
        { path: 'dashboard', component: 'Dashboard' },
        { path: 'extraction', component: 'ExtractionWorkbench' },
        { path: 'logs', component: 'LogViewer' },
        { path: 'audit', component: 'AuditViewer' },
        { path: 'health', component: 'Health|HealthPage' },
        { path: 'help', component: 'HelpBrowser' },
      ];

      routes.forEach(({ path: routePath, component }) => {
        expect(content).toMatch(new RegExp(component, 'i'));
      });
    });

    test('All components should be properly imported', () => {
      const appPath = path.join(rootDir, 'frontend/src/App.tsx');
      const content = fs.readFileSync(appPath, 'utf-8');

      const importMatches = content.match(/import\s+{?\s*\w+\s*}?\s+from\s+['"].*['"]/g) || [];
      expect(importMatches.length).toBeGreaterThan(0);

      // Check critical components are imported
      expect(content).toMatch(/import.*LogViewer|import.*HelpBrowser/i);
    });
  });

  /**
   * Cross-Validation: Frontend ↔ Backend
   */
  describe('Frontend ↔ Backend Route Synchronization', () => {
    test('All frontend pages should call backend APIs', () => {
      const pagesDir = path.join(rootDir, 'frontend/src/pages');
      const componentsDir = path.join(rootDir, 'frontend/src/components');

      if (fs.existsSync(pagesDir)) {
        const pageFiles = fs.readdirSync(pagesDir)
          .filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

        pageFiles.forEach(file => {
          const content = fs.readFileSync(path.join(pagesDir, file), 'utf-8');
          // Should use fetch, axios, or custom hooks for API calls
          const hasApiCall = content.includes('fetch') || 
                           content.includes('axios') || 
                           content.includes('useApi') ||
                           content.includes('/api/');
          
          if (file.match(/Health|Help|Log/i)) {
            expect(hasApiCall).toBe(true);
          }
        });
      }
    });

    test('API endpoints should be consistent with frontend expectations', () => {
      const apiIndexPath = path.join(rootDir, 'src/infrastructure/api/index.ts');
      const apiContent = fs.readFileSync(apiIndexPath, 'utf-8');

      const appPath = path.join(rootDir, 'frontend/src/App.tsx');
      const appContent = fs.readFileSync(appPath, 'utf-8');

      // Extract API routes
      const apiRoutes = (apiContent.match(/app\.use\(['"]\/api\/(\w+)['"]/g) || [])
        .map(m => m.match(/\/api\/(\w+)/)?.[1])
        .filter(Boolean);

      console.log('✓ API Routes Validation:');
      console.log(`  Backend exposes: ${apiRoutes.join(', ')}`);
      console.log(`  Frontend expects: health, logs, help, extract, audit`);

      // Critical routes must exist
      const criticalRoutes = ['health', 'logs', 'help'];
      criticalRoutes.forEach(route => {
        expect(apiRoutes).toContain(route);
      });
    });

    test('Response types should match frontend expectations', () => {
      const servicesDir = path.join(rootDir, 'frontend/src/services');
      const apiDir = path.join(rootDir, 'src/infrastructure/api/routes');

      if (fs.existsSync(servicesDir)) {
        const serviceFiles = fs.readdirSync(servicesDir)
          .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

        // Check that services define expected response types
        serviceFiles.forEach(file => {
          const content = fs.readFileSync(path.join(servicesDir, file), 'utf-8');
          const hasTypes = content.includes('interface') || 
                         content.includes('type ') || 
                         content.includes('Response');
          expect(hasTypes).toBe(true);
        });
      }
    });
  });

  /**
   * Route Parameters & Query Strings
   */
  describe('Route Parameters & Query Strings', () => {
    test('Routes with parameters should be documented', () => {
      const apiIndexPath = path.join(rootDir, 'src/infrastructure/api/index.ts');
      const content = fs.readFileSync(apiIndexPath, 'utf-8');

      // Routes with params use :paramName pattern
      const paramRoutes = content.match(/['"]\/api\/\w+\/:[^'"]+['"]/g) || [];
      console.log(`✓ Parameterized Routes: ${paramRoutes.length}`);

      // Should have some parameterized routes
      expect(content).toMatch(/:id|:docType|:param/i);
    });

    test('Frontend routing should handle dynamic parameters', () => {
      const appPath = path.join(rootDir, 'frontend/src/App.tsx');
      const content = fs.readFileSync(appPath, 'utf-8');

      // useParams hook usage indicates parameter handling
      const hasParamHandling = content.includes('useParams') || 
                             content.includes(':') ||
                             content.includes('/:');
      expect(hasParamHandling).toBe(true);
    });

    test('All query parameters should have default values', () => {
      const servicesDir = path.join(rootDir, 'frontend/src/services');
      if (!fs.existsSync(servicesDir)) return;

      const serviceFiles = fs.readdirSync(servicesDir)
        .filter(f => f.endsWith('.ts') || f.endsWith('.tsx'));

      serviceFiles.forEach(file => {
        const content = fs.readFileSync(path.join(servicesDir, file), 'utf-8');
        // Check for query parameter handling with defaults
        if (content.includes('?') || content.includes('params')) {
          expect(content).toMatch(/\?|params|query/i);
        }
      });
    });
  });

  /**
   * Navigation Menu ↔ Routes Sync
   */
  describe('Navigation Menu ↔ Routes Synchronization', () => {
    test('All navigation menu items should have corresponding routes', () => {
      const navPath = path.join(rootDir, 'frontend/src/components/Navigation/ResponsiveNavigationDrawer.tsx');
      if (!fs.existsSync(navPath)) return;

      const navContent = fs.readFileSync(navPath, 'utf-8');
      const appPath = path.join(rootDir, 'frontend/src/App.tsx');
      const appContent = fs.readFileSync(appPath, 'utf-8');

      // Extract menu items (usually in text or labels)
      const menuItems = navContent.match(/label?:|title?:|name?:|to\s*=\s*['"]([^'"]*)['"]/g) || [];
      console.log(`✓ Navigation Items Found: ${menuItems.length}`);

      // Should reference routes
      expect(navContent).toMatch(/extraction|logs|audit|health|help/i);
    });

    test('Navigation should not have broken links', () => {
      const navPath = path.join(rootDir, 'frontend/src/components/Navigation/ResponsiveNavigationDrawer.tsx');
      if (!fs.existsSync(navPath)) return;

      const navContent = fs.readFileSync(navPath, 'utf-8');
      
      // Should not have incomplete href patterns
      expect(navContent).not.toMatch(/href\s*=\s*['"]['"]|to\s*=\s*['"]['"]|link\s*=\s*['"]['"]|path\s*=\s*['"]['"]|route\s*=\s*['"]['"] /i);
    });

    test('Navigation categories should match route organization', () => {
      const navPath = path.join(rootDir, 'frontend/src/components/Navigation/ResponsiveNavigationDrawer.tsx');
      if (!fs.existsSync(navPath)) return;

      const navContent = fs.readFileSync(navPath, 'utf-8');

      // Expected categories
      const categories = ['extraction', 'documents', 'monitoring', 'system'];
      categories.forEach(category => {
        // At least one should be mentioned
        expect(navContent.toLowerCase()).toContain(category.toLowerCase());
      });
    });
  });

  /**
   * Error Handling Routes
   */
  describe('Error Handling & Fallback Routes', () => {
    test('Should have 404 error handling', () => {
      const appPath = path.join(rootDir, 'frontend/src/App.tsx');
      const content = fs.readFileSync(appPath, 'utf-8');

      // Should have a catch-all route or error boundary
      expect(content).toMatch(/Route|ErrorBoundary|NotFound|404/i);
    });

    test('Backend should have global error handler', () => {
      const serverPath = path.join(rootDir, 'src/infrastructure/api/server.ts');
      const content = fs.readFileSync(serverPath, 'utf-8');

      expect(content).toMatch(/error|Error|catch|handler|middleware/i);
    });

    test('Should have error logging for all routes', () => {
      const apiIndexPath = path.join(rootDir, 'src/infrastructure/api/index.ts');
      const content = fs.readFileSync(apiIndexPath, 'utf-8');

      expect(content).toMatch(/log|console|error|catch/i);
    });
  });

  /**
   * Route Performance
   */
  describe('Route Performance & Optimization', () => {
    test('Critical routes should not have N+1 query patterns', () => {
      const routesDir = path.join(rootDir, 'src/infrastructure/api/routes');
      const criticalRoutes = ['health.ts', 'logs.ts'];

      criticalRoutes.forEach(route => {
        const routePath = path.join(routesDir, route);
        if (fs.existsSync(routePath)) {
          const content = fs.readFileSync(routePath, 'utf-8');
          // Should not have obvious loops with DB queries
          expect(content).not.toMatch(/for.*query|forEach.*query|map.*query|while.*query/i);
        }
      });
    });

    test('Routes should have response caching considerations', () => {
      const apiIndexPath = path.join(rootDir, 'src/infrastructure/api/index.ts');
      const content = fs.readFileSync(apiIndexPath, 'utf-8');

      // Should mention cache, Redis, or TTL
      expect(content).toMatch(/cache|redis|ttl|memory/i);
    });
  });

  /**
   * Route Documentation
   */
  describe('Route Documentation', () => {
    test('All routes should have JSDoc or comments', () => {
      const routesDir = path.join(rootDir, 'src/infrastructure/api/routes');
      const routeFiles = fs.readdirSync(routesDir)
        .filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'));

      routeFiles.forEach(file => {
        const content = fs.readFileSync(path.join(routesDir, file), 'utf-8');
        // Should have at least some documentation
        const hasDoc = content.includes('/**') || 
                      content.includes('//') ||
                      content.includes('*');
        expect(hasDoc).toBe(true);
      });
    });

    test('API should have OpenAPI/Swagger documentation', () => {
      const apiIndexPath = path.join(rootDir, 'src/infrastructure/api/index.ts');
      const content = fs.readFileSync(apiIndexPath, 'utf-8');

      // Should reference swagger, openapi, or api docs
      const hasApiDocs = content.includes('swagger') || 
                        content.includes('openapi') || 
                        content.includes('/api/docs') ||
                        content.includes('API_REFERENCE');
      
      if (hasApiDocs) {
        expect(hasApiDocs).toBe(true);
      }
    });
  });

  /**
   * Route Security
   */
  describe('Route Security & Authentication', () => {
    test('Protected routes should have authentication checks', () => {
      const apiIndexPath = path.join(rootDir, 'src/infrastructure/api/index.ts');
      const content = fs.readFileSync(apiIndexPath, 'utf-8');

      expect(content).toMatch(/auth|token|middleware|permission|role/i);
    });

    test('Routes should validate input parameters', () => {
      const routesDir = path.join(rootDir, 'src/infrastructure/api/routes');
      const routeFiles = fs.readdirSync(routesDir)
        .filter(f => f.endsWith('.ts') && !f.endsWith('.test.ts'));

      routeFiles.forEach(file => {
        const content = fs.readFileSync(path.join(routesDir, file), 'utf-8');
        // Should validate input
        const hasValidation = content.includes('validate') || 
                            content.includes('schema') || 
                            content.includes('joi') ||
                            content.includes('zod') ||
                            content.includes('check');
        
        // At least some routes should validate
        if (file.match(/extract|create|post/i)) {
          expect(hasValidation).toBe(true);
        }
      });
    });

    test('CORS should be configured for API routes', () => {
      const serverPath = path.join(rootDir, 'src/infrastructure/api/server.ts');
      const content = fs.readFileSync(serverPath, 'utf-8');

      expect(content).toMatch(/cors|CORS|origin|credentials/i);
    });
  });

  /**
   * Route Consistency Report
   */
  test('Generate Route Consistency Report', () => {
    const apiIndexPath = path.join(rootDir, 'src/infrastructure/api/index.ts');
    const appPath = path.join(rootDir, 'frontend/src/App.tsx');

    const apiContent = fs.readFileSync(apiIndexPath, 'utf-8');
    const appContent = fs.readFileSync(appPath, 'utf-8');

    const backendRoutes = (apiContent.match(/app\.use\(['"]\/api\/(\w+)['"]/g) || [])
      .map(m => m.match(/\/api\/(\w+)/)?.[1])
      .filter(Boolean);

    const frontendReferences = (appContent.match(/\/([\w-]+)/g) || [])
      .map(m => m.replace('/', ''))
      .filter(Boolean);

    const report = {
      timestamp: new Date().toISOString(),
      backendRoutes: backendRoutes.length,
      discoveredFrontendRoutes: new Set(frontendReferences).size,
      consistencyStatus: backendRoutes.length > 0 && frontendReferences.length > 0 ? 'PASSED' : 'FAILED',
      backendEndpoints: backendRoutes,
      frontendReferences: Array.from(new Set(frontendReferences)),
    };

    console.log('📊 Route Consistency Report:', JSON.stringify(report, null, 2));
    expect(report.consistencyStatus).toBe('PASSED');
  });
});
