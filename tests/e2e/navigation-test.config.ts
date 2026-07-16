/**
 * Navigation Test Configuration & Versioning System
 * =========================================================
 * 
 * This configuration file maintains version synchronization between:
 * - Application version (package.json)
 * - Navigation structure (frontend/src/config/navigationConfig.ts)
 * - Test suite version (this file)
 * 
 * Version Format: MAJOR.MINOR.PATCH (e.g., 0.35.0)
 * 
 * @version 0.36.0
 * @phase 41
 * @lastUpdated 2026-07-16
 */

// ============================================================================
// VERSION MANAGEMENT
// ============================================================================

export const TEST_VERSION = {
  // Application version - synchronized with package.json
  APP_VERSION: '0.36.0',
  
  // Test suite version - incremented with each build
  TEST_VERSION: '0.36.0',
  
  // Last updated build date
  LAST_BUILD_DATE: '2026-07-16',
  
  // Build phase
  PHASE: 41,
  
  // Semantic versioning rules
  VERSION_RULES: {
    MAJOR: 'Breaking changes (e.g., new navigation structure)',
    MINOR: 'Features added (e.g., new routes, new nav items)',
    PATCH: 'Bug fixes (e.g., missing routes)',
  },
};

// ============================================================================
// NAVIGATION ENDPOINTS CONFIGURATION
// ============================================================================

export const NAVIGATION_ENDPOINTS = {
  BASE_URL: 'http://localhost:5173',
  API_BASE: 'http://localhost:3000/api',
  
  // All navigation routes with their API endpoints
  ROUTES: [
    {
      name: 'Home',
      path: '/',
      category: 'dashboard',
      version: '0.1.0',
      apiEndpoints: [],
    },
    {
      name: 'Schemas',
      path: '/schemas',
      category: 'schemas',
      version: '0.1.0',
      apiEndpoints: [
        { method: 'GET', path: '/api/schemas', description: 'List all schemas' },
      ],
    },
    {
      name: 'Create Schema',
      path: '/schemas/create',
      category: 'schemas',
      version: '0.1.0',
      apiEndpoints: [
        { method: 'POST', path: '/api/schemas', description: 'Upload new schema' },
      ],
    },
    {
      name: 'Jobs',
      path: '/jobs',
      category: 'jobs',
      version: '0.1.0',
      apiEndpoints: [
        { method: 'GET', path: '/api/jobs', description: 'List all jobs' },
      ],
    },
    {
      name: 'Rules',
      path: '/rules',
      category: 'rules',
      version: '0.1.0',
      apiEndpoints: [
        { method: 'GET', path: '/api/rules', description: 'List all rules' },
      ],
    },
    {
      name: 'Logs',
      path: '/logs',
      category: 'logs',
      version: '0.1.0',
      apiEndpoints: [
        { method: 'GET', path: '/api/logs', description: 'Get application logs' },
      ],
    },
    {
      name: 'Health',
      path: '/health',
      category: 'services',
      version: '0.1.0',
      apiEndpoints: [
        { method: 'GET', path: '/api/health', description: 'System health check' },
      ],
    },
    {
      name: 'API Docs',
      path: '/api/docs',
      category: 'services',
      version: '0.35.0', // NEW in v0.35.0
      apiEndpoints: [
        { method: 'GET', path: '/api/docs', description: 'API documentation' },
      ],
    },
    {
      name: 'Backups',
      path: '/backups',
      category: 'services',
      version: '0.1.0',
      apiEndpoints: [
        { method: 'GET', path: '/api/backup', description: 'List backups' },
        { method: 'POST', path: '/api/backup', description: 'Create backup' },
      ],
    },
    {
      name: 'Settings',
      path: '/settings',
      category: 'services',
      version: '0.35.0', // NEW in v0.35.0
      apiEndpoints: [
        { method: 'GET', path: '/api/settings', description: 'Get settings' },
        { method: 'PUT', path: '/api/settings', description: 'Update settings' },
      ],
    },
    {
      name: 'Help Center',
      path: '/help',
      category: 'help',
      version: '0.1.0',
      apiEndpoints: [
        { method: 'GET', path: '/api/help', description: 'Help documentation' },
      ],
    },
  ],
};

// ============================================================================
// API ENDPOINTS VERIFICATION
// ============================================================================

export const API_ENDPOINTS_VERIFICATION = {
  // Critical endpoints that must be available
  CRITICAL_ENDPOINTS: [
    '/api/health',
    '/api/schemas',
    '/api/jobs',
    '/api/rules',
    '/api/logs',
  ],
  
  // Optional endpoints (may not be available depending on version)
  OPTIONAL_ENDPOINTS: [
    '/api/docs',
    '/api/settings',
  ],
  
  // Deprecated endpoints (should not be used)
  DEPRECATED_ENDPOINTS: [],
};

// ============================================================================
// TEST COVERAGE MATRIX
// ============================================================================

export const TEST_COVERAGE = {
  TOTAL_NAVIGATION_ITEMS: 11,
  TOTAL_ROUTES: 11,
  TOTAL_API_ENDPOINTS: 9,
  
  TESTS: {
    'Navigation Categories': {
      count: 1,
      coverage: 'All 7 categories',
      version: '0.1.0',
    },
    'Dashboard Navigation': {
      count: 1,
      coverage: 'Home page',
      version: '0.1.0',
    },
    'Schemas Navigation': {
      count: 2,
      coverage: 'Schemas list and create',
      version: '0.1.0',
    },
    'Jobs Navigation': {
      count: 1,
      coverage: 'Jobs page',
      version: '0.35.0', // NEW in v0.35.0
    },
    'Rules Navigation': {
      count: 1,
      coverage: 'Rules page',
      version: '0.35.0', // NEW in v0.35.0
    },
    'Logs Navigation': {
      count: 1,
      coverage: 'Logs page',
      version: '0.35.0', // NEW in v0.35.0
    },
    'Services Navigation': {
      count: 4,
      coverage: 'Health, API Docs, Backups, Settings',
      version: '0.35.0',
    },
    'Help Navigation': {
      count: 1,
      coverage: 'Help Center',
      version: '0.1.0',
    },
    'All Routes Accessible': {
      count: 1,
      coverage: 'Verify all 11 routes are accessible',
      version: '0.35.0', // NEW comprehensive test
    },
    'Responsive Design': {
      count: 2,
      coverage: 'Desktop and mobile responsive',
      version: '0.1.0',
    },
  },
};

// ============================================================================
// BUILD METADATA (Updated automatically by CI/CD)
// ============================================================================

export const BUILD_METADATA = {
  // Timestamp of last test update
  LAST_TEST_UPDATE: new Date('2026-07-16').toISOString(),
  
  // Git commit hash (set by CI/CD pipeline)
  COMMIT_HASH: 'N/A',
  
  // CI/CD pipeline URL (set by CI/CD pipeline)
  PIPELINE_URL: 'N/A',
  
  // Total test files
  TEST_FILES: 1,
  
  // Total test cases
  TEST_CASES: 18,
};

// ============================================================================
// VERSION COMPATIBILITY MATRIX
// ============================================================================

export const VERSION_COMPATIBILITY = {
  '0.35.0': {
    routes: 11,
    navigationItems: 11,
    testCases: 18,
    newFeatures: ['API Docs', 'Settings', 'Jobs Nav Test', 'Rules Nav Test', 'Logs Nav Test'],
    fixedIssues: ['Missing routes for /api/docs, /settings', 'Removed deprecated /backup route'],
    dependencies: {
      react: '^18.2.0',
      'react-router-dom': '^6.0.0',
      '@mui/material': '^5.14.0',
      playwright: '^1.40.0',
    },
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a route requires API endpoint testing
 */
export function hasApiEndpoints(routeName: string): boolean {
  const route = NAVIGATION_ENDPOINTS.ROUTES.find(r => r.name === routeName);
  return route ? route.apiEndpoints.length > 0 : false;
}

/**
 * Get all routes for a specific version
 */
export function getRoutesForVersion(version: string) {
  return NAVIGATION_ENDPOINTS.ROUTES.filter(r => r.version <= version);
}

/**
 * Get new features in a specific version
 */
export function getNewFeaturesInVersion(version: string) {
  const versionInfo = VERSION_COMPATIBILITY[version as keyof typeof VERSION_COMPATIBILITY];
  return versionInfo?.newFeatures || [];
}

/**
 * Validate that all tests are up-to-date with current version
 */
export function validateTestVersion(currentVersion: string): { valid: boolean; message: string } {
  if (TEST_VERSION.APP_VERSION !== currentVersion) {
    return {
      valid: false,
      message: `Test version (${TEST_VERSION.TEST_VERSION}) does not match app version (${currentVersion})`,
    };
  }
  return {
    valid: true,
    message: `Test suite v${TEST_VERSION.TEST_VERSION} is synchronized with app v${currentVersion}`,
  };
}

export default TEST_VERSION;
