/**
 * Test Catalog V1 - Phase 38
 * 
 * Definiert alle 28 technischen Tests nach dem Testkatalog.
 * Kategorie: INF (Infrastruktur), DAT (Persistenz), SRV (Services), 
 *            API, CFG (Konfiguration), OPS (Betrieb), UI (Frontend), GOV (Governance)
 */

import {
  TestDefinition,
  Severity,
  TestCategory
} from '../models/TestRegistry';

// ============================================================================
// INFRASTRUCTURE TESTS (INF)
// ============================================================================

export const INF001: TestDefinition = {
  id: 'INF-001',
  category: TestCategory.INFRASTRUCTURE,
  title: 'Backend erreichbar',
  description: 'Überprüft, ob der Backend-Service (http://localhost:3000) erreichbar ist',
  severity: Severity.CRITICAL,
  implemented: true,
  tags: ['critical', 'connectivity']
};

export const INF002: TestDefinition = {
  id: 'INF-002',
  category: TestCategory.INFRASTRUCTURE,
  title: 'Frontend erreichbar',
  description: 'Überprüft, ob der Frontend-Service (http://localhost:5173) erreichbar ist',
  severity: Severity.CRITICAL,
  implemented: true,
  tags: ['critical', 'connectivity']
};

export const INF003: TestDefinition = {
  id: 'INF-003',
  category: TestCategory.INFRASTRUCTURE,
  title: 'PostgreSQL erreichbar',
  description: 'Überprüft, ob die PostgreSQL-Datenbank erreichbar ist (Port 5432)',
  severity: Severity.CRITICAL,
  implemented: true,
  tags: ['critical', 'connectivity'],
  dependsOn: ['INF-001']
};

export const INF004: TestDefinition = {
  id: 'INF-004',
  category: TestCategory.INFRASTRUCTURE,
  title: 'Redis erreichbar',
  description: 'Überprüft, ob der Redis-Cache erreichbar ist (Port 6379)',
  severity: Severity.CRITICAL,
  implemented: true,
  tags: ['critical', 'connectivity'],
  dependsOn: ['INF-001']
};

export const INF005: TestDefinition = {
  id: 'INF-005',
  category: TestCategory.INFRASTRUCTURE,
  title: 'Docker Container healthy',
  description: 'Überprüft, ob alle Docker-Container (backend, frontend, postgres, redis) healthy sind',
  severity: Severity.CRITICAL,
  implemented: true,
  tags: ['critical', 'docker']
};

// ============================================================================
// PERSISTENCE TESTS (DAT)
// ============================================================================

export const DAT001: TestDefinition = {
  id: 'DAT-001',
  category: TestCategory.PERSISTENCE,
  title: 'Datenbank lesbar',
  description: 'Überprüft, ob Datenbankabfragen durchgeführt werden können',
  severity: Severity.CRITICAL,
  implemented: true,
  tags: ['critical', 'database'],
  dependsOn: ['INF-003']
};

export const DAT002: TestDefinition = {
  id: 'DAT-002',
  category: TestCategory.PERSISTENCE,
  title: 'Datenbank schreibbar',
  description: 'Überprüft, ob Datenbankschreibvorgänge durchgeführt werden können (Test-Transaktion)',
  severity: Severity.CRITICAL,
  implemented: true,
  tags: ['critical', 'database'],
  dependsOn: ['DAT-001']
};

export const DAT003: TestDefinition = {
  id: 'DAT-003',
  category: TestCategory.PERSISTENCE,
  title: 'Redis lesbar',
  description: 'Überprüft, ob Redis-Lesezugriffe funktionieren',
  severity: Severity.CRITICAL,
  implemented: true,
  tags: ['critical', 'cache'],
  dependsOn: ['INF-004']
};

export const DAT004: TestDefinition = {
  id: 'DAT-004',
  category: TestCategory.PERSISTENCE,
  title: 'Redis schreibbar',
  description: 'Überprüft, ob Redis-Schreibzugriffe funktionieren',
  severity: Severity.CRITICAL,
  implemented: true,
  tags: ['critical', 'cache'],
  dependsOn: ['DAT-003']
};

export const DAT010: TestDefinition = {
  id: 'DAT-010',
  category: TestCategory.PERSISTENCE,
  title: 'Backup Verzeichnis vorhanden',
  description: 'Überprüft, ob das /data/backups Verzeichnis existiert und beschreibbar ist',
  severity: Severity.HIGH,
  implemented: true,
  tags: ['backup']
};

export const DAT011: TestDefinition = {
  id: 'DAT-011',
  category: TestCategory.PERSISTENCE,
  title: 'Restore Verzeichnis vorhanden',
  description: 'Überprüft, ob das /data/restores Verzeichnis existiert und lesbar ist',
  severity: Severity.HIGH,
  implemented: true,
  tags: ['backup']
};

export const DAT012: TestDefinition = {
  id: 'DAT-012',
  category: TestCategory.PERSISTENCE,
  title: 'Ergebnisverzeichnis schreibbar',
  description: 'Überprüft, ob das /output Verzeichnis für Extraktionsergebnisse beschreibbar ist',
  severity: Severity.HIGH,
  implemented: true,
  tags: ['output']
};

// ============================================================================
// CORE SERVICES TESTS (SRV)
// ============================================================================

export const SRV001: TestDefinition = {
  id: 'SRV-001',
  category: TestCategory.CORE_SERVICES,
  title: 'Health Endpoint erreichbar',
  description: 'Überprüft, ob GET /health antwortet',
  severity: Severity.CRITICAL,
  implemented: true,
  tags: ['critical', 'health'],
  dependsOn: ['INF-001']
};

export const SRV002: TestDefinition = {
  id: 'SRV-002',
  category: TestCategory.CORE_SERVICES,
  title: 'Config Endpoint erreichbar',
  description: 'Überprüft, ob GET /api/config antwortet',
  severity: Severity.CRITICAL,
  implemented: true,
  tags: ['critical', 'config'],
  dependsOn: ['INF-001']
};

export const SRV003: TestDefinition = {
  id: 'SRV-003',
  category: TestCategory.CORE_SERVICES,
  title: 'Job Service verfügbar',
  description: 'Überprüft, ob der Job-Service initialisiert ist',
  severity: Severity.CRITICAL,
  implemented: true,
  tags: ['critical', 'jobs'],
  dependsOn: ['SRV-001']
};

export const SRV010: TestDefinition = {
  id: 'SRV-010',
  category: TestCategory.CORE_SERVICES,
  title: 'Audit Service verfügbar',
  description: 'Überprüft, ob der Audit-Service verfügbar ist',
  severity: Severity.HIGH,
  implemented: false,
  tags: ['audit']
};

export const SRV011: TestDefinition = {
  id: 'SRV-011',
  category: TestCategory.CORE_SERVICES,
  title: 'Revision Service verfügbar',
  description: 'Überprüft, ob der Revision-Service verfügbar ist',
  severity: Severity.HIGH,
  implemented: false,
  tags: ['revision']
};

export const SRV012: TestDefinition = {
  id: 'SRV-012',
  category: TestCategory.CORE_SERVICES,
  title: 'Backup Service verfügbar',
  description: 'Überprüft, ob der Backup-Service verfügbar ist',
  severity: Severity.HIGH,
  implemented: false,
  tags: ['backup']
};

// ============================================================================
// API STABILITY TESTS (API)
// ============================================================================

export const API001: TestDefinition = {
  id: 'API-001',
  category: TestCategory.API,
  title: 'Core API Smoke Test',
  description: 'Grundlegende API Verfügbarkeitsprüfung (200 OK Responses)',
  severity: Severity.HIGH,
  implemented: true,
  tags: ['smoke', 'api'],
  dependsOn: ['INF-001']
};

export const API002: TestDefinition = {
  id: 'API-002',
  category: TestCategory.API,
  title: 'Schema API',
  description: 'Überprüft Schema Endpoints: GET /api/schema/schemas',
  severity: Severity.HIGH,
  implemented: true,
  tags: ['api', 'schema'],
  dependsOn: ['API-001']
};

export const API003: TestDefinition = {
  id: 'API-003',
  category: TestCategory.API,
  title: 'Job API',
  description: 'Überprüft Job Endpoints: GET /api/jobs, POST /api/jobs',
  severity: Severity.HIGH,
  implemented: false,
  tags: ['api', 'jobs']
};

export const API004: TestDefinition = {
  id: 'API-004',
  category: TestCategory.API,
  title: 'Rules API',
  description: 'Überprüft Rules Endpoints: GET /api/rules',
  severity: Severity.HIGH,
  implemented: false,
  tags: ['api', 'rules']
};

export const API010: TestDefinition = {
  id: 'API-010',
  category: TestCategory.API,
  title: 'API Dokumentation erreichbar',
  description: 'Überprüft, ob API-Dokumentation unter /api-docs verfügbar ist',
  severity: Severity.MEDIUM,
  implemented: false,
  tags: ['documentation']
};

export const API011: TestDefinition = {
  id: 'API-011',
  category: TestCategory.API,
  title: 'API Discovery vollständig',
  description: 'Überprüft, ob GET /api/discovery alle verfügbaren Endpoints auflistet',
  severity: Severity.MEDIUM,
  implemented: false,
  tags: ['discovery']
};

// ============================================================================
// CONFIGURATION TESTS (CFG)
// ============================================================================

export const CFG001: TestDefinition = {
  id: 'CFG-001',
  category: TestCategory.CONFIGURATION,
  title: 'Konfiguration lesbar',
  description: 'Überprüft, ob die Konfigurationsdatei lesbar ist und alle Keys vorhanden sind',
  severity: Severity.HIGH,
  implemented: true,
  tags: ['config'],
  dependsOn: ['SRV-002']
};

export const CFG002: TestDefinition = {
  id: 'CFG-002',
  category: TestCategory.CONFIGURATION,
  title: 'Konfiguration validierbar',
  description: 'Überprüft, ob die Konfiguration validiert werden kann',
  severity: Severity.HIGH,
  implemented: false,
  tags: ['config']
};

export const CFG003: TestDefinition = {
  id: 'CFG-003',
  category: TestCategory.CONFIGURATION,
  title: 'Pflichtparameter vorhanden',
  description: 'Überprüft, ob alle erforderlichen Konfigurationsparameter gesetzt sind',
  severity: Severity.HIGH,
  implemented: false,
  tags: ['config']
};

export const CFG010: TestDefinition = {
  id: 'CFG-010',
  category: TestCategory.CONFIGURATION,
  title: 'Versionen konsistent',
  description: 'Überprüft, ob Version in package.json, frontend/package.json und Code konsistent ist',
  severity: Severity.MEDIUM,
  implemented: true,
  tags: ['versioning']
};

export const CFG011: TestDefinition = {
  id: 'CFG-011',
  category: TestCategory.CONFIGURATION,
  title: 'Build Metadaten vorhanden',
  description: 'Überprüft, ob build-metadata.json mit Version, Hash, Timestamp vorhanden ist',
  severity: Severity.MEDIUM,
  implemented: true,
  tags: ['build']
};

// ============================================================================
// OPERATIONS TESTS (OPS)
// ============================================================================

export const OPS001: TestDefinition = {
  id: 'OPS-001',
  category: TestCategory.OPERATIONS,
  title: 'Logging aktiv',
  description: 'Überprüft, ob Logging-Ausgaben generiert werden',
  severity: Severity.MEDIUM,
  implemented: true,
  tags: ['logging']
};

export const OPS002: TestDefinition = {
  id: 'OPS-002',
  category: TestCategory.OPERATIONS,
  title: 'Log Verzeichnis vorhanden',
  description: 'Überprüft, ob das Logging-Verzeichnis existiert und schreibbar ist',
  severity: Severity.MEDIUM,
  implemented: true,
  tags: ['logging']
};

export const OPS003: TestDefinition = {
  id: 'OPS-003',
  category: TestCategory.OPERATIONS,
  title: 'Monitoring aktiv',
  description: 'Überprüft, ob Monitoring/Metriken verfügbar sind',
  severity: Severity.MEDIUM,
  implemented: false,
  tags: ['monitoring']
};

export const OPS010: TestDefinition = {
  id: 'OPS-010',
  category: TestCategory.OPERATIONS,
  title: 'Dokumentation verfügbar',
  description: 'Überprüft, ob README, CONTRIBUTING und andere Doku-Dateien vorhanden sind',
  severity: Severity.LOW,
  implemented: true,
  tags: ['documentation']
};

export const OPS011: TestDefinition = {
  id: 'OPS-011',
  category: TestCategory.OPERATIONS,
  title: 'Release Notes vorhanden',
  description: 'Überprüft, ob RELEASE_NOTES für die aktuelle Version vorhanden sind',
  severity: Severity.LOW,
  implemented: true,
  tags: ['documentation']
};

// ============================================================================
// FRONTEND TESTS (UI)
// ============================================================================

export const UI001: TestDefinition = {
  id: 'UI-001',
  category: TestCategory.FRONTEND,
  title: 'Startseite erreichbar',
  description: 'Überprüft, ob http://localhost:5173/ lädt und HTML zurückgibt',
  severity: Severity.MEDIUM,
  implemented: true,
  tags: ['ui', 'frontend'],
  dependsOn: ['INF-002']
};

export const UI002: TestDefinition = {
  id: 'UI-002',
  category: TestCategory.FRONTEND,
  title: 'Navigation vorhanden',
  description: 'Überprüft, ob die Navigationskomponenten vorhanden sind',
  severity: Severity.MEDIUM,
  implemented: true,
  tags: ['ui', 'navigation']
};

export const UI003: TestDefinition = {
  id: 'UI-003',
  category: TestCategory.FRONTEND,
  title: 'Routing funktioniert',
  description: 'Überprüft, ob Frontend-Routing zu verschiedenen Seiten funktioniert',
  severity: Severity.MEDIUM,
  implemented: false,
  tags: ['ui', 'routing']
};

export const UI010: TestDefinition = {
  id: 'UI-010',
  category: TestCategory.FRONTEND,
  title: 'Responsive Test',
  description: 'Überprüft responsive Layout auf verschiedenen Bildschirmgrößen',
  severity: Severity.LOW,
  implemented: false,
  tags: ['ui', 'responsive']
};

export const UI011: TestDefinition = {
  id: 'UI-011',
  category: TestCategory.FRONTEND,
  title: 'Accessibility Basisprüfung',
  description: 'Überprüft grundlegende Accessibility-Standards (WCAG 2.1 AA)',
  severity: Severity.LOW,
  implemented: false,
  tags: ['ui', 'accessibility']
};

// ============================================================================
// GOVERNANCE TESTS (GOV)
// ============================================================================

export const GOV001: TestDefinition = {
  id: 'GOV-001',
  category: TestCategory.GOVERNANCE,
  title: 'Test Registry konsistent',
  description: 'Überprüft, ob der Test-Katalog konsistent ist (keine Duplikate, gültige IDs)',
  severity: Severity.LOW,
  implemented: true,
  tags: ['governance']
};

export const GOV002: TestDefinition = {
  id: 'GOV-002',
  category: TestCategory.GOVERNANCE,
  title: 'Discovery Framework funktionsfähig',
  description: 'Überprüft, ob API-Discovery Framework alle Endpoints korrekt erfasst',
  severity: Severity.LOW,
  implemented: false,
  tags: ['governance', 'discovery']
};

export const GOV003: TestDefinition = {
  id: 'GOV-003',
  category: TestCategory.GOVERNANCE,
  title: 'Governance Framework funktionsfähig',
  description: 'Überprüft, ob Governance Framework (Test Registry, Katalog) funktioniert',
  severity: Severity.LOW,
  implemented: true,
  tags: ['governance']
};

// ============================================================================
// Test Catalog
// ============================================================================

export const TEST_CATALOG: TestDefinition[] = [
  // Infrastructure
  INF001, INF002, INF003, INF004, INF005,
  
  // Persistence
  DAT001, DAT002, DAT003, DAT004, DAT010, DAT011, DAT012,
  
  // Core Services
  SRV001, SRV002, SRV003, SRV010, SRV011, SRV012,
  
  // API
  API001, API002, API003, API004, API010, API011,
  
  // Configuration
  CFG001, CFG002, CFG003, CFG010, CFG011,
  
  // Operations
  OPS001, OPS002, OPS003, OPS010, OPS011,
  
  // Frontend
  UI001, UI002, UI003, UI010, UI011,
  
  // Governance
  GOV001, GOV002, GOV003
];

/**
 * Gibt die Anzahl der Tests pro Kategorie zurück
 */
export function getTestCountByCategory() {
  const counts: { [key: string]: number } = {};
  TEST_CATALOG.forEach(test => {
    counts[test.category] = (counts[test.category] || 0) + 1;
  });
  return counts;
}

/**
 * Gibt die implementierten Tests zurück
 */
export function getImplementedTests() {
  return TEST_CATALOG.filter(t => t.implemented);
}

/**
 * Gibt die nicht implementierten Tests zurück
 */
export function getNotImplementedTests() {
  return TEST_CATALOG.filter(t => !t.implemented);
}

/**
 * Gibt Tests nach Severity zurück
 */
export function getTestsBySeverity(severity: Severity) {
  return TEST_CATALOG.filter(t => t.severity === severity);
}

