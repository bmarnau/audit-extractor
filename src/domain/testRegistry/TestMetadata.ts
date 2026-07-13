/**
 * Category Enum für Testkategorisierung
 * Definiert die verfügbaren Test-Kategorien
 */
export enum TestCategory {
  UNIT = 'UNIT',
  INTEGRATION = 'INTEGRATION',
  E2E = 'E2E',
  API = 'API',
  PERFORMANCE = 'PERFORMANCE',
  SECURITY = 'SECURITY',
  SMOKE = 'SMOKE',
  REGRESSION = 'REGRESSION',
  ACCESSIBILITY = 'ACCESSIBILITY',
  CONTRACT = 'CONTRACT'
}

/**
 * Test Category Beschreibungen
 */
export const TestCategoryDescriptions: Record<TestCategory, string> = {
  [TestCategory.UNIT]: 'Unit Tests - Individuelle Komponenten',
  [TestCategory.INTEGRATION]: 'Integration Tests - Mehrere Komponenten zusammen',
  [TestCategory.E2E]: 'End-to-End Tests - Komplette User Workflows',
  [TestCategory.API]: 'API Tests - REST/GraphQL Endpoints',
  [TestCategory.PERFORMANCE]: 'Performance Tests - Load und Stress Tests',
  [TestCategory.SECURITY]: 'Security Tests - Vulnerability und Security Checks',
  [TestCategory.SMOKE]: 'Smoke Tests - Schnelle Sanity Checks',
  [TestCategory.REGRESSION]: 'Regression Tests - Vergleich mit bekannten Ergebnissen',
  [TestCategory.ACCESSIBILITY]: 'Accessibility Tests - A11y Compliance',
  [TestCategory.CONTRACT]: 'Contract Tests - Service Contract Validierung'
};

/**
 * Severity Impact für Testergebnisse
 */
export enum SeverityImpact {
  CRITICAL = 'CRITICAL',     // Blockiert Build und Deployment
  HIGH = 'HIGH',              // Kritisches Feature betroffen
  MEDIUM = 'MEDIUM',          // Normales Feature betroffen
  LOW = 'LOW',                // Edge case oder minor Feature
  INFO = 'INFO'               // Informativ, kein funktionaler Impact
}

/**
 * Severity Impact Descriptions
 */
export const SeverityImpactDescriptions: Record<SeverityImpact, string> = {
  [SeverityImpact.CRITICAL]: 'Blockiert Build und Deployment',
  [SeverityImpact.HIGH]: 'Kritisches Feature betroffen',
  [SeverityImpact.MEDIUM]: 'Normales Feature betroffen',
  [SeverityImpact.LOW]: 'Edge case oder minor Feature',
  [SeverityImpact.INFO]: 'Informativ, kein funktionaler Impact'
};
