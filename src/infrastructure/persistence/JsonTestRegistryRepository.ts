import * as fs from 'fs';
import * as path from 'path';
import { TestRegistryEntry, TestRegistryPersistenceData } from '../../domain/testRegistry/TestRegistryEntry';
import { TestId } from '../../domain/testRegistry/TestId';
import { TestRegistryRepository, TestRegistryCatalogStatistics, ComponentTestOverview } from '../../domain/testRegistry/TestRegistryRepository';
import { TestCategory, SeverityImpact } from '../../domain/testRegistry/TestMetadata';

/**
 * In-Memory JSON-Based Test Registry Repository
 *
 * Implementiert TestRegistryRepository mit:
 * - In-Memory Map für Schnellzugriff
 * - JSON Persistierung zu Dateisystem
 * - Vollständige Query-Unterstützung
 */
export class JsonTestRegistryRepository implements TestRegistryRepository {
  private inMemoryRegistry: Map<string, TestRegistryEntry> = new Map();
  private dataPath: string;

  constructor(dataPath: string = './data/test-registry') {
    this.dataPath = dataPath;
    this.initializeDataDirectory();
    this.loadFromDisk();
  }

  /**
   * Initialisiert Datenverzeichnis
   */
  private initializeDataDirectory(): void {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
  }

  /**
   * Lädt Registry vom Dateisystem
   */
  private loadFromDisk(): void {
    const filePath = this.getRegistryFilePath();
    if (fs.existsSync(filePath)) {
      try {
        const data = fs.readFileSync(filePath, 'utf-8');
        const entries: TestRegistryPersistenceData[] = JSON.parse(data);
        this.inMemoryRegistry.clear();
        entries.forEach(entry => {
          const testEntry = TestRegistryEntry.fromPersistence(entry);
          this.inMemoryRegistry.set(entry.testId, testEntry);
        });
      } catch (error) {
        console.error('Error loading test registry from disk:', error);
        this.inMemoryRegistry.clear();
      }
    }
  }

  /**
   * Speichert Registry auf Dateisystem
   */
  private saveToDisk(): void {
    const filePath = this.getRegistryFilePath();
    const data = Array.from(this.inMemoryRegistry.values()).map(entry => entry.toPersistence());
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Gibt Pfad zur Registry-Datei zurück
   */
  private getRegistryFilePath(): string {
    return path.join(this.dataPath, 'tests.json');
  }

  /**
   * Registriert einen neuen Test
   */
  async register(entry: TestRegistryEntry): Promise<void> {
    const testId = entry.getTestId().getValue();
    if (this.inMemoryRegistry.has(testId)) {
      throw new Error(`Test ${testId} already registered`);
    }
    this.inMemoryRegistry.set(testId, entry);
    this.saveToDisk();
  }

  /**
   * Aktualisiert einen Test
   */
  async update(entry: TestRegistryEntry): Promise<void> {
    const testId = entry.getTestId().getValue();
    if (!this.inMemoryRegistry.has(testId)) {
      throw new Error(`Test ${testId} not found`);
    }
    this.inMemoryRegistry.set(testId, entry);
    this.saveToDisk();
  }

  /**
   * Findet einen Test nach ID
   */
  async findById(id: TestId): Promise<TestRegistryEntry | null> {
    return this.inMemoryRegistry.get(id.getValue()) || null;
  }

  /**
   * Gibt alle Tests zurück
   */
  async findAll(): Promise<TestRegistryEntry[]> {
    return Array.from(this.inMemoryRegistry.values());
  }

  /**
   * Findet Tests nach Kategorie
   */
  async findByCategory(category: TestCategory): Promise<TestRegistryEntry[]> {
    return Array.from(this.inMemoryRegistry.values()).filter(
      entry => entry.getCategory() === category
    );
  }

  /**
   * Findet Tests nach Komponente
   */
  async findByComponent(component: string): Promise<TestRegistryEntry[]> {
    const normalizedComponent = component.toLowerCase();
    return Array.from(this.inMemoryRegistry.values()).filter(
      entry => entry.getComponent().toLowerCase() === normalizedComponent
    );
  }

  /**
   * Findet Tests nach Severity Impact
   */
  async findBySeverityImpact(severity: SeverityImpact): Promise<TestRegistryEntry[]> {
    return Array.from(this.inMemoryRegistry.values()).filter(
      entry => entry.getSeverityImpact() === severity
    );
  }

  /**
   * Findet Build-Blocking Tests
   */
  async findBuildBlockingTests(): Promise<TestRegistryEntry[]> {
    return Array.from(this.inMemoryRegistry.values()).filter(
      entry => entry.isBuildBlocking()
    );
  }

  /**
   * Findet aktivierte Tests
   */
  async findEnabledTests(): Promise<TestRegistryEntry[]> {
    return Array.from(this.inMemoryRegistry.values()).filter(
      entry => entry.isEnabled()
    );
  }

  /**
   * Findet deaktivierte Tests
   */
  async findDisabledTests(): Promise<TestRegistryEntry[]> {
    return Array.from(this.inMemoryRegistry.values()).filter(
      entry => !entry.isEnabled()
    );
  }

  /**
   * Findet Tests nach Framework
   */
  async findByFramework(framework: string): Promise<TestRegistryEntry[]> {
    const normalizedFramework = framework.toLowerCase();
    return Array.from(this.inMemoryRegistry.values()).filter(
      entry => entry.getFramework().toLowerCase() === normalizedFramework
    );
  }

  /**
   * Findet Tests nach Tags
   */
  async findByTags(tags: string[]): Promise<TestRegistryEntry[]> {
    const normalizedTags = tags.map(t => t.toLowerCase());
    return Array.from(this.inMemoryRegistry.values()).filter(
      entry => {
        const entryTags = entry.getTags();
        return normalizedTags.some(tag => entryTags.includes(tag));
      }
    );
  }

  /**
   * Sucht Tests nach Name
   */
  async findByNameContains(searchTerm: string): Promise<TestRegistryEntry[]> {
    const normalizedTerm = searchTerm.toLowerCase();
    return Array.from(this.inMemoryRegistry.values()).filter(
      entry => entry.getTestName().toLowerCase().includes(normalizedTerm)
    );
  }

  /**
   * Findet flaky Tests
   */
  async findFlakyTests(): Promise<TestRegistryEntry[]> {
    return Array.from(this.inMemoryRegistry.values()).filter(
      entry => entry.isFlaky()
    );
  }

  /**
   * Findet Tests mit Abhängigkeiten
   */
  async findByDependencies(testIds: string[]): Promise<TestRegistryEntry[]> {
    return Array.from(this.inMemoryRegistry.values()).filter(
      entry => {
        const dependencies = entry.getDependencies();
        return testIds.some(id => dependencies.includes(id));
      }
    );
  }

  /**
   * Gibt Katalog-Statistiken zurück
   */
  async getStatistics(): Promise<TestRegistryCatalogStatistics> {
    const all = Array.from(this.inMemoryRegistry.values());
    const byCategory: Record<TestCategory, number> = {} as any;
    const byComponent: Record<string, number> = {};
    const byFramework: Record<string, number> = {};
    const bySeverityImpact = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      INFO: 0
    };

    let enabledCount = 0;
    let buildBlockingCount = 0;
    let flakyCount = 0;
    let totalSuccessRate = 0;

    all.forEach(entry => {
      // By Category
      const category = entry.getCategory();
      byCategory[category] = (byCategory[category] || 0) + 1;

      // By Component
      const component = entry.getComponent();
      byComponent[component] = (byComponent[component] || 0) + 1;

      // By Framework
      const framework = entry.getFramework();
      byFramework[framework] = (byFramework[framework] || 0) + 1;

      // By Severity
      const severity = entry.getSeverityImpact();
      bySeverityImpact[severity]++;

      // Enabled/Disabled
      if (entry.isEnabled()) enabledCount++;

      // Build Blocking
      if (entry.isBuildBlocking()) buildBlockingCount++;

      // Flaky
      if (entry.isFlaky()) flakyCount++;

      // Success Rate
      totalSuccessRate += entry.getSuccessRate();
    });

    return {
      total: all.length,
      byCategory,
      byComponent,
      byFramework,
      bySeverityImpact,
      enabledCount,
      disabledCount: all.length - enabledCount,
      buildBlockingCount,
      flakyTestsCount: flakyCount,
      averageSuccessRate: all.length > 0 ? totalSuccessRate / all.length : 0
    };
  }

  /**
   * Gibt Komponenten-Übersicht zurück
   */
  async getComponentOverview(component: string): Promise<ComponentTestOverview> {
    const componentTests = await this.findByComponent(component);
    const byCategory: Record<TestCategory, number> = {} as any;
    const frameworks = new Set<string>();
    let buildBlockingCount = 0;
    let enabledCount = 0;
    let flakyCount = 0;
    let totalSuccessRate = 0;

    componentTests.forEach(test => {
      const category = test.getCategory();
      byCategory[category] = (byCategory[category] || 0) + 1;

      frameworks.add(test.getFramework());

      if (test.isBuildBlocking()) buildBlockingCount++;
      if (test.isEnabled()) enabledCount++;
      if (test.isFlaky()) flakyCount++;

      totalSuccessRate += test.getSuccessRate();
    });

    return {
      component,
      totalTests: componentTests.length,
      categories: byCategory,
      buildBlockingTests: buildBlockingCount,
      enabledTests: enabledCount,
      flakyTests: flakyCount,
      averageSuccessRate: componentTests.length > 0 ? totalSuccessRate / componentTests.length : 0,
      frameworks: Array.from(frameworks),
      tests: componentTests
    };
  }

  /**
   * Deregistriert einen Test
   */
  async deregister(id: TestId): Promise<void> {
    this.inMemoryRegistry.delete(id.getValue());
    this.saveToDisk();
  }

  /**
   * Zählt alle Tests
   */
  async count(): Promise<number> {
    return this.inMemoryRegistry.size;
  }

  /**
   * Prüft ob Test existiert
   */
  async exists(id: TestId): Promise<boolean> {
    return this.inMemoryRegistry.has(id.getValue());
  }

  /**
   * Registriert mehrere Tests
   */
  async registerMany(entries: TestRegistryEntry[]): Promise<void> {
    entries.forEach(entry => {
      const testId = entry.getTestId().getValue();
      if (this.inMemoryRegistry.has(testId)) {
        throw new Error(`Test ${testId} already registered`);
      }
      this.inMemoryRegistry.set(testId, entry);
    });
    this.saveToDisk();
  }

  /**
   * Löscht alle Tests
   */
  async deleteAll(): Promise<void> {
    this.inMemoryRegistry.clear();
    this.saveToDisk();
  }

  /**
   * Exportiert Registry als JSON
   */
  async exportAsJson(): Promise<any[]> {
    return Array.from(this.inMemoryRegistry.values()).map(entry => entry.toPersistence());
  }

  /**
   * Exponiert In-Memory Registry für Tests
   */
  getInMemoryRegistry(): Map<string, TestRegistryEntry> {
    return this.inMemoryRegistry;
  }

  /**
   * Setzt In-Memory Registry für Tests
   */
  setInMemoryRegistry(registry: Map<string, TestRegistryEntry>): void {
    this.inMemoryRegistry = registry;
  }
}
