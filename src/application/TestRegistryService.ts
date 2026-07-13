import { TestRegistryEntry } from '../domain/testRegistry/TestRegistryEntry';
import { TestId } from '../domain/testRegistry/TestId';
import { TestRegistryRepository, TestRegistryCatalogStatistics, ComponentTestOverview } from '../domain/testRegistry/TestRegistryRepository';
import { TestRegistryFactory } from '../domain/testRegistry/TestRegistryFactory';
import { TestCategory, SeverityImpact } from '../domain/testRegistry/TestMetadata';

/**
 * TestRegistryService - Application Service
 *
 * Orchestriert:
 * - Test-Registration und Discovery
 * - Katalog-Management
 * - Governance Reports
 * - Build Assessment
 */
export class TestRegistryService {
  constructor(private readonly registry: TestRegistryRepository) {}

  /**
   * Registriert einen neuen Test
   */
  async registerTest(testData: any): Promise<TestRegistryEntry> {
    const validation = TestRegistryFactory.validate(testData);
    if (!validation.valid) {
      throw new Error(`Test validation failed: ${validation.errors.join(', ')}`);
    }
    
    const entry = TestRegistryFactory.createEntry(testData);
    await this.registry.register(entry);
    return entry;
  }

  /**
   * Registriert einen Unit-Test
   */
  async registerUnitTest(testData: any): Promise<TestRegistryEntry> {
    const entry = TestRegistryFactory.createUnitTest(testData);
    await this.registry.register(entry);
    return entry;
  }

  /**
   * Registriert einen Integration-Test
   */
  async registerIntegrationTest(testData: any): Promise<TestRegistryEntry> {
    const entry = TestRegistryFactory.createIntegrationTest(testData);
    await this.registry.register(entry);
    return entry;
  }

  /**
   * Registriert einen E2E-Test
   */
  async registerE2ETest(testData: any): Promise<TestRegistryEntry> {
    const entry = TestRegistryFactory.createE2ETest(testData);
    await this.registry.register(entry);
    return entry;
  }

  /**
   * Registriert einen API-Test
   */
  async registerApiTest(testData: any): Promise<TestRegistryEntry> {
    const entry = TestRegistryFactory.createApiTest(testData);
    await this.registry.register(entry);
    return entry;
  }

  /**
   * Registriert einen Performance-Test
   */
  async registerPerformanceTest(testData: any): Promise<TestRegistryEntry> {
    const entry = TestRegistryFactory.createPerformanceTest(testData);
    await this.registry.register(entry);
    return entry;
  }

  /**
   * Registriert einen Security-Test
   */
  async registerSecurityTest(testData: any): Promise<TestRegistryEntry> {
    const entry = TestRegistryFactory.createSecurityTest(testData);
    await this.registry.register(entry);
    return entry;
  }

  /**
   * Registriert mehrere Tests
   */
  async registerMany(testDataList: any[]): Promise<TestRegistryEntry[]> {
    const entries = TestRegistryFactory.createBatch(testDataList);
    await this.registry.registerMany(entries);
    return entries;
  }

  /**
   * Findet einen Test nach ID
   */
  async getTestById(testId: string): Promise<TestRegistryEntry | null> {
    return this.registry.findById(TestId.from(testId));
  }

  /**
   * Gibt alle registrierten Tests zurück
   */
  async getAllTests(): Promise<TestRegistryEntry[]> {
    return this.registry.findAll();
  }

  /**
   * Findet Tests nach Kategorie
   */
  async getTestsByCategory(category: TestCategory): Promise<TestRegistryEntry[]> {
    return this.registry.findByCategory(category);
  }

  /**
   * Findet Tests nach Komponente
   */
  async getTestsByComponent(component: string): Promise<TestRegistryEntry[]> {
    return this.registry.findByComponent(component);
  }

  /**
   * Findet Tests nach Severity Impact
   */
  async getTestsBySeverityImpact(severity: SeverityImpact): Promise<TestRegistryEntry[]> {
    return this.registry.findBySeverityImpact(severity);
  }

  /**
   * Gibt alle Build-Blocking Tests zurück
   */
  async getBuildBlockingTests(): Promise<TestRegistryEntry[]> {
    return this.registry.findBuildBlockingTests();
  }

  /**
   * Gibt alle aktivierten Tests zurück
   */
  async getEnabledTests(): Promise<TestRegistryEntry[]> {
    return this.registry.findEnabledTests();
  }

  /**
   * Gibt alle deaktivierten Tests zurück
   */
  async getDisabledTests(): Promise<TestRegistryEntry[]> {
    return this.registry.findDisabledTests();
  }

  /**
   * Findet Tests nach Framework
   */
  async getTestsByFramework(framework: string): Promise<TestRegistryEntry[]> {
    return this.registry.findByFramework(framework);
  }

  /**
   * Findet Tests nach Tags
   */
  async getTestsByTags(tags: string[]): Promise<TestRegistryEntry[]> {
    return this.registry.findByTags(tags);
  }

  /**
   * Sucht Tests nach Name
   */
  async searchTests(searchTerm: string): Promise<TestRegistryEntry[]> {
    return this.registry.findByNameContains(searchTerm);
  }

  /**
   * Findet flaky Tests
   */
  async getFlakyTests(): Promise<TestRegistryEntry[]> {
    return this.registry.findFlakyTests();
  }

  /**
   * Findet abhängige Tests
   */
  async getTestsByDependencies(testIds: string[]): Promise<TestRegistryEntry[]> {
    return this.registry.findByDependencies(testIds);
  }

  /**
   * Aktualisiert Test-Status
   */
  async updateTestEnabled(testId: string, enabled: boolean): Promise<TestRegistryEntry | null> {
    const entry = await this.registry.findById(TestId.from(testId));
    if (!entry) return null;

    entry.setEnabled(enabled);
    await this.registry.update(entry);
    return entry;
  }

  /**
   * Aktualisiert Build Blocking Status
   */
  async updateBuildBlocking(testId: string, buildBlocking: boolean): Promise<TestRegistryEntry | null> {
    const entry = await this.registry.findById(TestId.from(testId));
    if (!entry) return null;

    entry.setBuildBlocking(buildBlocking);
    await this.registry.update(entry);
    return entry;
  }

  /**
   * Aktualisiert Severity Impact
   */
  async updateSeverityImpact(testId: string, severity: SeverityImpact): Promise<TestRegistryEntry | null> {
    const entry = await this.registry.findById(TestId.from(testId));
    if (!entry) return null;

    entry.setSeverityImpact(severity);
    await this.registry.update(entry);
    return entry;
  }

  /**
   * Registriert erfolgreiche Test-Ausführung
   */
  async recordTestSuccess(testId: string, durationMs: number): Promise<void> {
    const entry = await this.registry.findById(TestId.from(testId));
    if (!entry) throw new Error(`Test ${testId} not found`);

    entry.recordSuccess(durationMs);
    await this.registry.update(entry);
  }

  /**
   * Registriert fehlgeschlagene Test-Ausführung
   */
  async recordTestFailure(testId: string, durationMs: number): Promise<void> {
    const entry = await this.registry.findById(TestId.from(testId));
    if (!entry) throw new Error(`Test ${testId} not found`);

    entry.recordFailure(durationMs);
    await this.registry.update(entry);
  }

  /**
   * Registriert übersprungene Test-Ausführung
   */
  async recordTestSkipped(testId: string): Promise<void> {
    const entry = await this.registry.findById(TestId.from(testId));
    if (!entry) throw new Error(`Test ${testId} not found`);

    entry.recordSkipped();
    await this.registry.update(entry);
  }

  /**
   * Gibt Katalog-Statistiken zurück
   */
  async getCatalogStatistics(): Promise<TestRegistryCatalogStatistics> {
    return this.registry.getStatistics();
  }

  /**
   * Gibt Komponenten-Übersicht zurück
   */
  async getComponentOverview(component: string): Promise<ComponentTestOverview> {
    return this.registry.getComponentOverview(component);
  }

  /**
   * Gibt alle Komponenten-Übersichten zurück
   */
  async getAllComponentOverviews(): Promise<ComponentTestOverview[]> {
    const all = await this.registry.findAll();
    const components = Array.from(new Set(all.map((t: TestRegistryEntry) => t.getComponent())));
    return Promise.all(
      components.map(component => this.registry.getComponentOverview(component))
    );
  }

  /**
   * Gibt Build Assessment Report zurück
   */
  async getBuildAssessment(): Promise<BuildAssessmentReport> {
    const stats = await this.registry.getStatistics();
    const buildBlockingTests = await this.registry.findBuildBlockingTests();
    const flakyTests = await this.registry.findFlakyTests();
    const criticalImpactTests = await this.registry.findBySeverityImpact(SeverityImpact.CRITICAL);

    const blockingFlakyTests = buildBlockingTests.filter(t => t.isFlaky());

    return {
      buildCanPass: blockingFlakyTests.length === 0,
      totalBuildBlockingTests: buildBlockingTests.length,
      blockingFlakyTests: blockingFlakyTests.length,
      criticalTestsCount: criticalImpactTests.length,
      averageSuccessRate: stats.averageSuccessRate,
      recommendation: this.generateBuildRecommendation(blockingFlakyTests, criticalImpactTests)
    };
  }

  /**
   * Generiert Build-Empfehlung basierend auf Status
   */
  private generateBuildRecommendation(
    blockingFlakyTests: TestRegistryEntry[],
    criticalTests: TestRegistryEntry[]
  ): string {
    if (blockingFlakyTests.length > 0) {
      return `⚠️ ${blockingFlakyTests.length} flaky build-blocking test(s) detected. Consider disabling or fixing: ${blockingFlakyTests.map((t: TestRegistryEntry) => t.getTestName()).join(', ')}`;
    }
    if (criticalTests.filter(t => !t.isEnabled()).length > 0) {
      return 'ℹ️ Some critical tests are disabled. Enable them to improve build reliability.';
    }
    return '✅ Build assessment passed. All build-blocking tests are stable.';
  }

  /**
   * Deregistriert einen Test
   */
  async deregisterTest(testId: string): Promise<void> {
    await this.registry.deregister(TestId.from(testId));
  }

  /**
   * Gibt Anzahl der Tests zurück
   */
  async getTestCount(): Promise<number> {
    return this.registry.count();
  }

  /**
   * Prüft ob Test existiert
   */
  async testExists(testId: string): Promise<boolean> {
    return this.registry.exists(TestId.from(testId));
  }

  /**
   * Exportiert Registry als JSON
   */
  async exportCatalog(): Promise<any[]> {
    return this.registry.exportAsJson();
  }

  /**
   * Generiert Handbuch aus Registry
   */
  async generateManual(): Promise<ManualContent> {
    const all = await this.registry.findAll();
    const byCategory = new Map<TestCategory, TestRegistryEntry[]>();

    for (const test of all) {
      const category = test.getCategory();
      if (!byCategory.has(category)) {
        byCategory.set(category, []);
      }
      byCategory.get(category)!.push(test);
    }

    return {
      title: 'Test Registry Manual',
      generatedAt: new Date(),
      totalTests: all.length,
      chapters: Array.from(byCategory.entries()).map(([category, tests]) => ({
        category,
        tests: tests.map(t => ({
          name: t.getTestName(),
          description: t.getDescription(),
          component: t.getComponent(),
          framework: t.getFramework(),
          buildBlocking: t.isBuildBlocking(),
          tags: t.getTags()
        }))
      }))
    };
  }
}

/**
 * Build Assessment Report
 */
export interface BuildAssessmentReport {
  buildCanPass: boolean;
  totalBuildBlockingTests: number;
  blockingFlakyTests: number;
  criticalTestsCount: number;
  averageSuccessRate: number;
  recommendation: string;
}

/**
 * Manual Content für Handbuch-Generierung
 */
export interface ManualContent {
  title: string;
  generatedAt: Date;
  totalTests: number;
  chapters: {
    category: TestCategory;
    tests: {
      name: string;
      description: string;
      component: string;
      framework: string;
      buildBlocking: boolean;
      tags: string[];
    }[];
  }[];
}
