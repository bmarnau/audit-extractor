/**
 * Regression Monitoring Configuration
 * 
 * Zentrale Konfiguration für automatische Regression-Erkennung
 * @version 0.34.0
 * @phase 2-extension
 */

export interface RegressionRule {
  id: string;
  name: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  checks: RegressionCheck[];
  autoFix?: boolean;
  notifyOn: 'failure' | 'warning' | 'always';
}

export interface RegressionCheck {
  name: string;
  type: 'file-exists' | 'file-contains' | 'version-match' | 'route-defined' | 'export-exists';
  target: string;
  pattern?: string | string[];
  expectedValue?: string;
  errorMessage: string;
}

/**
 * Alle überwachten Regressions-Regeln
 */
export const REGRESSION_RULES: RegressionRule[] = [
  // REGRESSION 1: Version Konsistenz
  {
    id: 'REG-001',
    name: 'Version Consistency',
    description: 'Sicherstellt, dass alle Versionsnummern 0.34.0 sind',
    severity: 'critical',
    category: 'version',
    notifyOn: 'failure',
    autoFix: false,
    checks: [
      {
        name: 'package.json version',
        type: 'version-match',
        target: 'package.json',
        expectedValue: '0.34.0',
        errorMessage: 'Root package.json must have version 0.34.0',
      },
      {
        name: 'frontend package.json version',
        type: 'version-match',
        target: 'frontend/package.json',
        expectedValue: '0.34.0',
        errorMessage: 'Frontend package.json must have version 0.34.0',
      },
      {
        name: 'src/version.ts PROJECT_VERSION',
        type: 'file-contains',
        target: 'src/version.ts',
        pattern: "PROJECT_VERSION = '0.34.0'",
        errorMessage: 'src/version.ts must define PROJECT_VERSION = 0.34.0',
      },
      {
        name: 'frontend/src/version.ts FRONTEND_VERSION',
        type: 'file-contains',
        target: 'frontend/src/version.ts',
        pattern: "FRONTEND_VERSION = '0.34.0'",
        errorMessage: 'frontend/src/version.ts must define FRONTEND_VERSION = 0.34.0',
      },
      {
        name: 'Navigation Display Version',
        type: 'file-contains',
        target: 'frontend/src/components/Navigation/ResponsiveNavigationDrawer.tsx',
        pattern: 'v0.34.0',
        errorMessage: 'Navigation must display v0.34.0',
      },
      {
        name: 'Audit API Version',
        type: 'file-contains',
        target: 'src/infrastructure/api/routes/audit.ts',
        pattern: "version: '0.34.0'",
        errorMessage: 'Audit API must return version 0.34.0',
      },
    ],
  },

  // REGRESSION 2: LogViewer Konfiguration
  {
    id: 'REG-002',
    name: 'LogViewer Configuration',
    description: 'Sicherstellt, dass LogViewer richtig konfiguriert ist',
    severity: 'critical',
    category: 'logging',
    notifyOn: 'failure',
    autoFix: false,
    checks: [
      {
        name: 'LogViewer component exists',
        type: 'file-exists',
        target: 'frontend/src/components/LogViewer.tsx',
        errorMessage: 'LogViewer component must exist',
      },
      {
        name: 'LogViewer is exported',
        type: 'file-contains',
        target: 'frontend/src/components/LogViewer.tsx',
        pattern: 'export.*LogViewer',
        errorMessage: 'LogViewer must be exported from component',
      },
      {
        name: 'Log routes mounted in API',
        type: 'file-contains',
        target: 'src/infrastructure/api/index.ts',
        pattern: "app.use('/api/logs'",
        errorMessage: 'Log routes must be mounted at /api/logs',
      },
      {
        name: 'Logs route file exists',
        type: 'file-exists',
        target: 'src/infrastructure/api/routes/logs.ts',
        errorMessage: 'Log routes file must exist',
      },
      {
        name: 'Log directory configured',
        type: 'file-contains',
        target: 'docker-compose.yml',
        pattern: ['LOG_DIR', 'logs'],
        errorMessage: 'Log directory must be configured in docker-compose',
      },
    ],
  },

  // REGRESSION 3: Health-Seite
  {
    id: 'REG-003',
    name: 'Health Page Availability',
    description: 'Sicherstellt, dass Health-Seite verfügbar und geroutet ist',
    severity: 'critical',
    category: 'ui-routing',
    notifyOn: 'failure',
    autoFix: false,
    checks: [
      {
        name: 'Health component exists',
        type: 'file-exists',
        target: 'frontend/src/pages/HealthPage.tsx',
        errorMessage: 'Health component must exist at frontend/src/pages/HealthPage.tsx',
      },
      {
        name: 'Health route defined in App.tsx',
        type: 'file-contains',
        target: 'frontend/src/App.tsx',
        pattern: ['/health', 'HealthPage', 'Health'],
        errorMessage: 'Health route must be defined in App.tsx',
      },
      {
        name: 'Backend health routes exist',
        type: 'file-exists',
        target: 'src/infrastructure/api/routes/health.ts',
        errorMessage: 'Backend health routes must exist',
      },
      {
        name: 'Health endpoint registered',
        type: 'file-contains',
        target: 'src/infrastructure/api/index.ts',
        pattern: "app.use('/api/health'",
        errorMessage: 'Health endpoint must be registered in API',
      },
    ],
  },

  // REGRESSION 4: Help-Bereich Routing
  {
    id: 'REG-004',
    name: 'Help Section Routing',
    description: 'Sicherstellt, dass Help-Bereich vollständig geroutet ist',
    severity: 'critical',
    category: 'ui-routing',
    notifyOn: 'failure',
    autoFix: false,
    checks: [
      {
        name: 'HelpBrowser component exists',
        type: 'file-exists',
        target: 'frontend/src/components/workbench/HelpBrowser.tsx',
        errorMessage: 'HelpBrowser component must exist',
      },
      {
        name: 'Help route defined in App.tsx',
        type: 'file-contains',
        target: 'frontend/src/App.tsx',
        pattern: ['/help', 'HelpBrowser', 'Help'],
        errorMessage: 'Help route must be defined in App.tsx',
      },
      {
        name: 'HelpBrowser imported in App.tsx',
        type: 'file-contains',
        target: 'frontend/src/App.tsx',
        pattern: 'import.*HelpBrowser',
        errorMessage: 'HelpBrowser must be imported in App.tsx',
      },
      {
        name: 'Backend help routes exist',
        type: 'file-exists',
        target: 'src/infrastructure/api/routes/help.ts',
        errorMessage: 'Backend help routes must exist',
      },
      {
        name: 'Help endpoint registered',
        type: 'file-contains',
        target: 'src/infrastructure/api/index.ts',
        pattern: "app.use('/api/help'",
        errorMessage: 'Help endpoint must be registered in API',
      },
      {
        name: 'HelpContentLoader initialized',
        type: 'file-contains',
        target: 'src/infrastructure/api/index.ts',
        pattern: 'HelpContentLoader',
        errorMessage: 'HelpContentLoader must be initialized',
      },
    ],
  },

  // REGRESSION 5: Komponenten-Exporte
  {
    id: 'REG-005',
    name: 'Component Export Integrity',
    description: 'Sicherstellt, dass kritische Komponenten korrekt exportiert sind',
    severity: 'high',
    category: 'code-quality',
    notifyOn: 'failure',
    autoFix: false,
    checks: [
      {
        name: 'LogViewer exported',
        type: 'export-exists',
        target: 'frontend/src/components/LogViewer.tsx',
        pattern: 'LogViewer',
        errorMessage: 'LogViewer must be exported',
      },
      {
        name: 'HelpBrowser exported',
        type: 'export-exists',
        target: 'frontend/src/components/workbench/HelpBrowser.tsx',
        pattern: 'HelpBrowser',
        errorMessage: 'HelpBrowser must be exported',
      },
      {
        name: 'App exported',
        type: 'export-exists',
        target: 'frontend/src/App.tsx',
        pattern: ['App', 'default'],
        errorMessage: 'App component must be exported',
      },
    ],
  },
];

/**
 * Regressions-Kategorien für Reporting
 */
export const REGRESSION_CATEGORIES = {
  version: {
    name: 'Version Management',
    description: 'Versionsverwaltung und -konsistenz',
    rules: 1,
  },
  logging: {
    name: 'Logging & Monitoring',
    description: 'Log-Verzeichnis und Logviewer-Konfiguration',
    rules: 1,
  },
  'ui-routing': {
    name: 'UI & Routing',
    description: 'Frontend-Routes und Navigation',
    rules: 2,
  },
  'code-quality': {
    name: 'Code Quality',
    description: 'Komponenten-Exporte und Struktur',
    rules: 1,
  },
};

/**
 * Regressions-Severities
 */
export const SEVERITY_LEVELS = {
  critical: {
    level: 0,
    description: 'Deployment blockierend',
    action: 'MUST FIX',
  },
  high: {
    level: 1,
    description: 'Funktionalität beeinträchtigt',
    action: 'URGENT',
  },
  medium: {
    level: 2,
    description: 'Qualitätsproblem',
    action: 'SHOULD FIX',
  },
  low: {
    level: 3,
    description: 'Kosmetisches Problem',
    action: 'NICE TO FIX',
  },
};

/**
 * Regressions-Notifikations-Konfiguration
 */
export const NOTIFICATION_CONFIG = {
  channels: ['console', 'github-actions', 'email'],
  slackWebhook: process.env.SLACK_WEBHOOK_URL,
  recipients: {
    critical: ['team@example.com'],
    high: ['dev@example.com'],
    medium: [],
  },
  frequency: {
    critical: 'immediate',
    high: 'per-commit',
    medium: 'daily',
  },
};

/**
 * Regressions-Ausschluss-Regeln (falls nötig)
 */
export const REGRESSION_EXCLUSIONS: string[] = [
  // Beispiel: 'tests/mocks/**' - Test-Mocks können abweichen
];

export default {
  rules: REGRESSION_RULES,
  categories: REGRESSION_CATEGORIES,
  severities: SEVERITY_LEVELS,
  notifications: NOTIFICATION_CONFIG,
  exclusions: REGRESSION_EXCLUSIONS,
};
