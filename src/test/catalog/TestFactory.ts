/**
 * Test Factory - Phase 38
 * 
 * Factory für die Erstellung von Test-Instanzen aus dem Katalog.
 * Stellt sicher, dass alle Tests konsistent initialisiert werden.
 */

import { TEST_CATALOG, getImplementedTests } from './TestCatalog';
import { TestDefinition } from '../models/TestRegistry';

/**
 * Factory Singleton Pattern für Test-Verwaltung
 */
export class TestFactory {
  private static instance: TestFactory;
  private testMap: Map<string, TestDefinition>;

  private constructor() {
    this.testMap = new Map();
    this.registerAll();
  }

  /**
   * Singleton getInstance
   */
  static getInstance(): TestFactory {
    if (!TestFactory.instance) {
      TestFactory.instance = new TestFactory();
    }
    return TestFactory.instance;
  }

  /**
   * Registriert alle Tests aus dem Katalog
   */
  private registerAll(): void {
    TEST_CATALOG.forEach(test => {
      this.testMap.set(test.id, test);
    });
  }

  /**
   * Gibt einen Test nach ID zurück
   */
  getTestById(testId: string): TestDefinition | undefined {
    return this.testMap.get(testId);
  }

  /**
   * Gibt alle Tests zurück
   */
  getAllTests(): TestDefinition[] {
    return Array.from(this.testMap.values());
  }

  /**
   * Gibt nur implementierte Tests zurück
   */
  getImplementedTests(): TestDefinition[] {
    return getImplementedTests();
  }

  /**
   * Gibt nur nicht implementierte Tests zurück
   */
  getNotImplementedTests(): TestDefinition[] {
    return this.getAllTests().filter(t => !t.implemented);
  }

  /**
   * Gibt Tests nach Kategorie zurück
   */
  getTestsByCategory(category: string): TestDefinition[] {
    return this.getAllTests().filter(t => t.category === category);
  }

  /**
   * Gibt Tests nach Severity zurück
   */
  getTestsBySeverity(severity: string): TestDefinition[] {
    return this.getAllTests().filter(t => t.severity === severity);
  }

  /**
   * Gibt Tests nach Tag zurück
   */
  getTestsByTag(tag: string): TestDefinition[] {
    return this.getAllTests().filter(t => t.tags?.includes(tag));
  }

  /**
   * Validiert, dass eine Test-ID existiert
   */
  testExists(testId: string): boolean {
    return this.testMap.has(testId);
  }

  /**
   * Gibt alle Kategorien zurück
   */
  getCategories(): string[] {
    const categories = new Set<string>();
    this.getAllTests().forEach(t => categories.add(t.category));
    return Array.from(categories).sort();
  }

  /**
   * Gibt alle Severity-Levels zurück, die im Katalog verwendet werden
   */
  getSeverities(): string[] {
    const severities = new Set<string>();
    this.getAllTests().forEach(t => severities.add(t.severity));
    return Array.from(severities);
  }

  /**
   * Gibt alle Tags zurück
   */
  getAllTags(): string[] {
    const tags = new Set<string>();
    this.getAllTests().forEach(t => {
      t.tags?.forEach(tag => tags.add(tag));
    });
    return Array.from(tags).sort();
  }

  /**
   * Zählt Tests pro Kategorie
   */
  countTestsByCategory(): { [category: string]: number } {
    const counts: { [category: string]: number } = {};
    this.getAllTests().forEach(test => {
      counts[test.category] = (counts[test.category] || 0) + 1;
    });
    return counts;
  }

  /**
   * Gibt Test-Statistiken zurück
   */
  getStatistics() {
    const all = this.getAllTests();
    const implemented = this.getImplementedTests();

    return {
      total: all.length,
      implemented: implemented.length,
      notImplemented: all.length - implemented.length,
      categories: this.getCategories().length,
      countsByCategory: this.countTestsByCategory(),
      severityDistribution: {
        critical: all.filter(t => t.severity === 'CRITICAL').length,
        high: all.filter(t => t.severity === 'HIGH').length,
        medium: all.filter(t => t.severity === 'MEDIUM').length,
        low: all.filter(t => t.severity === 'LOW').length,
        info: all.filter(t => t.severity === 'INFO').length
      },
      implementationStatus: {
        percent: Math.round((implemented.length / all.length) * 100),
        implemented: implemented.length,
        total: all.length
      }
    };
  }

  /**
   * Gibt kritische Tests zurück (müssen vor allen anderen ausgeführt werden)
   */
  getCriticalTests(): TestDefinition[] {
    return this.getTestsBySeverity('CRITICAL');
  }

  /**
   * Gibt die Abhängigkeitskette für einen Test zurück
   */
  getTestDependencies(testId: string): TestDefinition[] {
    const test = this.getTestById(testId);
    if (!test || !test.dependsOn) return [];

    const dependencies: TestDefinition[] = [];
    test.dependsOn.forEach(depId => {
      const dep = this.getTestById(depId);
      if (dep) {
        dependencies.push(dep);
      }
    });
    return dependencies;
  }

  /**
   * Sortiert Tests topologisch nach Abhängigkeiten
   */
  sortByDependencies(tests: TestDefinition[]): TestDefinition[] {
    const sorted: TestDefinition[] = [];
    const visited = new Set<string>();

    const visit = (test: TestDefinition) => {
      if (visited.has(test.id)) return;
      visited.add(test.id);

      const deps = this.getTestDependencies(test.id);
      deps.forEach(dep => visit(dep));

      sorted.push(test);
    };

    tests.forEach(test => visit(test));
    return sorted;
  }

  /**
   * Sorgt für deterministische Ausführungsreihenfolge
   */
  getExecutionOrder(tests?: TestDefinition[]): TestDefinition[] {
    const testsToSort = tests || this.getImplementedTests();
    
    // 1. Nach Dependency sortieren
    const withDeps = this.sortByDependencies(testsToSort);
    
    // 2. Nach Severity sortieren (CRITICAL first)
    const severityOrder: { [key: string]: number } = {
      'CRITICAL': 1,
      'HIGH': 2,
      'MEDIUM': 3,
      'LOW': 4,
      'INFO': 5
    };

    return withDeps.sort((a, b) => {
      const severityDiff = (severityOrder[a.severity] || 0) - (severityOrder[b.severity] || 0);
      if (severityDiff !== 0) return severityDiff;
      
      // Fallback: nach Kategorie und ID
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return a.id.localeCompare(b.id);
    });
  }

  /**
   * Debug: Gibt Katalog-Übersicht aus
   */
  printCatalogSummary(): void {
    const stats = this.getStatistics();
    
    console.log('\n════════════════════════════════════════════════════');
    console.log('         TEST CATALOG SUMMARY');
    console.log('════════════════════════════════════════════════════');
    console.log(`\nTotal Tests: ${stats.total}`);
    console.log(`  ✓ Implemented: ${stats.implemented} (${stats.implementationStatus.percent}%)`);
    console.log(`  ✗ Not Implemented: ${stats.notImplemented}`);
    console.log(`\nCategories: ${stats.categories}`);
    
    console.log('\nTests per Category:');
    Object.entries(stats.countsByCategory).forEach(([cat, count]) => {
      console.log(`  ${cat}: ${count}`);
    });
    
    console.log('\nSeverity Distribution:');
    Object.entries(stats.severityDistribution).forEach(([sev, count]) => {
      console.log(`  ${sev}: ${count}`);
    });
    
    console.log('\n════════════════════════════════════════════════════\n');
  }
}

/**
 * Convenience Export
 */
export const testFactory = TestFactory.getInstance();
