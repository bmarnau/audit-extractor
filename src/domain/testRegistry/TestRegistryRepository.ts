import { TestRegistryEntry } from './TestRegistryEntry';
import { TestId } from './TestId';
import { TestCategory, SeverityImpact } from './TestMetadata';

/**
 * Repository Interface für Test Registry Persistierung
 *
 * Definiert Verträge für:
 * - Speicherung und Abruf von Test-Metadaten
 * - Suche und Filterung
 * - Test-Katalog Management
 *
 * Implementierungen können: JSON, Datenbank, Cloud Storage verwenden
 */
export interface TestRegistryRepository {
  /**
   * Registriert einen neuen Test
   */
  register(entry: TestRegistryEntry): Promise<void>;

  /**
   * Aktualisiert einen registrierten Test
   */
  update(entry: TestRegistryEntry): Promise<void>;

  /**
   * Findet einen Test nach ID
   */
  findById(id: TestId): Promise<TestRegistryEntry | null>;

  /**
   * Gibt alle registrierten Tests zurück
   */
  findAll(): Promise<TestRegistryEntry[]>;

  /**
   * Findet Tests nach Kategorie
   */
  findByCategory(category: TestCategory): Promise<TestRegistryEntry[]>;

  /**
   * Findet Tests nach Komponente
   */
  findByComponent(component: string): Promise<TestRegistryEntry[]>;

  /**
   * Findet Tests nach Severity Impact
   */
  findBySeverityImpact(severity: SeverityImpact): Promise<TestRegistryEntry[]>;

  /**
   * Findet nur Build-Blocking Tests
   */
  findBuildBlockingTests(): Promise<TestRegistryEntry[]>;

  /**
   * Findet nur aktivierte Tests
   */
  findEnabledTests(): Promise<TestRegistryEntry[]>;

  /**
   * Findet deaktivierte Tests
   */
  findDisabledTests(): Promise<TestRegistryEntry[]>;

  /**
   * Findet Tests nach Framework
   */
  findByFramework(framework: string): Promise<TestRegistryEntry[]>;

  /**
   * Findet Tests mit Tags
   */
  findByTags(tags: string[]): Promise<TestRegistryEntry[]>;

  /**
   * Sucht Tests nach Name mit Wildcard
   */
  findByNameContains(searchTerm: string): Promise<TestRegistryEntry[]>;

  /**
   * Findet flaky Tests
   */
  findFlakyTests(): Promise<TestRegistryEntry[]>;

  /**
   * Findet Tests mit Abhängigkeiten
   */
  findByDependencies(testIds: string[]): Promise<TestRegistryEntry[]>;

  /**
   * Gibt Katalog-Statistiken zurück
   */
  getStatistics(): Promise<TestRegistryCatalogStatistics>;

  /**
   * Gibt Komponenten-Übersicht zurück
   */
  getComponentOverview(component: string): Promise<ComponentTestOverview>;

  /**
   * Löscht einen Test aus Registry
   */
  deregister(id: TestId): Promise<void>;

  /**
   * Zählt alle Tests
   */
  count(): Promise<number>;

  /**
   * Prüft ob Test existiert
   */
  exists(id: TestId): Promise<boolean>;

  /**
   * Speichert mehrere Tests (Batch)
   */
  registerMany(entries: TestRegistryEntry[]): Promise<void>;

  /**
   * Löscht alle Tests
   */
  deleteAll(): Promise<void>;

  /**
   * Exportiert Registry als JSON
   */
  exportAsJson(): Promise<any[]>;
}

/**
 * Test Registry Katalog Statistiken
 */
export interface TestRegistryCatalogStatistics {
  total: number;
  byCategory: Record<TestCategory, number>;
  byComponent: Record<string, number>;
  byFramework: Record<string, number>;
  bySeverityImpact: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
    INFO: number;
  };
  enabledCount: number;
  disabledCount: number;
  buildBlockingCount: number;
  flakyTestsCount: number;
  averageSuccessRate: number;
}

/**
 * Komponenten-spezifische Test-Übersicht
 */
export interface ComponentTestOverview {
  component: string;
  totalTests: number;
  categories: Record<TestCategory, number>;
  buildBlockingTests: number;
  enabledTests: number;
  flakyTests: number;
  averageSuccessRate: number;
  frameworks: string[];
  tests: TestRegistryEntry[];
}
