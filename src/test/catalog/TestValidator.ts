/**
 * Test Validator - Phase 38
 * 
 * Validierungslogik für Test-Definitionsintegrität und Katalog-Konsistenz.
 */

import { TEST_CATALOG } from './TestCatalog';
import { TestDefinition, validateTestDefinition, Severity } from '../models/TestRegistry';
import { testFactory } from './TestFactory';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Zentrale Validierungsklasse
 */
export class TestValidator {
  /**
   * Validiert den gesamten Test-Katalog
   */
  static validateCatalog(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 1. Prüfe auf Duplikate
    const idMap = new Map<string, TestDefinition>();
    TEST_CATALOG.forEach(test => {
      if (idMap.has(test.id)) {
        errors.push(`Duplicate test ID: ${test.id}`);
      }
      idMap.set(test.id, test);
    });

    // 2. Validiere jede Test-Definition
    TEST_CATALOG.forEach(test => {
      const testErrors = validateTestDefinition(test);
      testErrors.forEach(err => errors.push(`[${test.id}] ${err}`));
    });

    // 3. Prüfe Abhängigkeiten
    TEST_CATALOG.forEach(test => {
      if (test.dependsOn) {
        test.dependsOn.forEach(depId => {
          if (!idMap.has(depId)) {
            errors.push(`[${test.id}] Dependency not found: ${depId}`);
          }
        });
      }
    });

    // 4. Prüfe auf zirkuläre Abhängigkeiten
    const circularDeps = this.checkCircularDependencies();
    circularDeps.forEach(cycle => {
      errors.push(`Circular dependency detected: ${cycle.join(' -> ')}`);
    });

    // 5. Consistency Warnings
    const unreferencedTests = this.findUnreferencedTests();
    unreferencedTests.forEach(testId => {
      warnings.push(`Test ${testId} is not referenced by any other test`);
    });

    const unusedDependencies = this.findUnusedDependencies();
    unusedDependencies.forEach(testId => {
      warnings.push(`Test ${testId} has dependencies but is never required by others`);
    });

    // 6. Check ID Format Consistency
    TEST_CATALOG.forEach(test => {
      if (!/^[A-Z]{3}-\d{3}$/.test(test.id)) {
        errors.push(`[${test.id}] Invalid ID format. Expected CAT-NNN`);
      }
    });

    // 7. Check Severity Distribution
    const severityCount = {
      CRITICAL: 0,
      HIGH: 0,
      MEDIUM: 0,
      LOW: 0,
      INFO: 0
    };

    TEST_CATALOG.forEach(test => {
      severityCount[test.severity as keyof typeof severityCount]++;
    });

    if (severityCount.CRITICAL === 0) {
      warnings.push('No CRITICAL tests defined');
    }

    // 8. Check for orphaned tests
    const allCategories = new Set(TEST_CATALOG.map(t => t.category));
    allCategories.forEach(category => {
      const categoryTests = TEST_CATALOG.filter(t => t.category === category);
      if (categoryTests.length === 0) {
        errors.push(`Category ${category} has no tests`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Prüft auf zirkuläre Abhängigkeiten
   */
  static checkCircularDependencies(): string[][] {
    const cycles: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (testId: string, path: string[]): void => {
      visited.add(testId);
      recursionStack.add(testId);
      path.push(testId);

      const test = testFactory.getTestById(testId);
      if (test && test.dependsOn) {
        test.dependsOn.forEach(depId => {
          if (!visited.has(depId)) {
            dfs(depId, [...path]);
          } else if (recursionStack.has(depId)) {
            const cycleStart = path.indexOf(depId);
            const cycle = path.slice(cycleStart).concat(depId);
            cycles.push(cycle);
          }
        });
      }

      recursionStack.delete(testId);
    };

    TEST_CATALOG.forEach(test => {
      if (!visited.has(test.id)) {
        dfs(test.id, []);
      }
    });

    return cycles;
  }

  /**
   * Findet Tests die nicht von anderen referenziert werden
   */
  static findUnreferencedTests(): string[] {
    const referenced = new Set<string>();

    TEST_CATALOG.forEach(test => {
      if (test.dependsOn) {
        test.dependsOn.forEach(depId => referenced.add(depId));
      }
    });

    return TEST_CATALOG.map(t => t.id).filter(id => !referenced.has(id));
  }

  /**
   * Findet Tests mit Abhängigkeiten die von niemand benötigt werden
   */
  static findUnusedDependencies(): string[] {
    const hasOutgoingDeps = new Set<string>();
    const hasIncomingDeps = new Set<string>();

    TEST_CATALOG.forEach(test => {
      if (test.dependsOn && test.dependsOn.length > 0) {
        hasOutgoingDeps.add(test.id);
        test.dependsOn.forEach(depId => hasIncomingDeps.add(depId));
      }
    });

    return Array.from(hasOutgoingDeps).filter(id => !hasIncomingDeps.has(id));
  }

  /**
   * Validiert ein spezifisches Test Objekt
   */
  static validateTest(test: TestDefinition): ValidationResult {
    const errors = validateTestDefinition(test);
    const warnings: string[] = [];

    // Additional validations
    if (test.description.length < 10) {
      warnings.push('Description should be at least 10 characters');
    }

    if (!test.implemented && !test.tags?.includes('placeholder')) {
      warnings.push('Unimplemented test should have "placeholder" tag');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Prüft, ob alle kritischen Tests implementiert sind
   */
  static areCriticalTestsImplemented(): boolean {
    const criticalTests = TEST_CATALOG.filter(t => t.severity === 'CRITICAL');
    return criticalTests.every(t => t.implemented);
  }

  /**
   * Gibt einen Bericht über den Implementierungsstatus aus
   */
  static getImplementationReport() {
    const stats = testFactory.getStatistics();
    const byCategory: { [key: string]: { implemented: number; total: number; percent: number } } = {};

    testFactory.getCategories().forEach(category => {
      const tests = testFactory.getTestsByCategory(category);
      const implemented = tests.filter(t => t.implemented).length;
      byCategory[category] = {
        implemented,
        total: tests.length,
        percent: Math.round((implemented / tests.length) * 100)
      };
    });

    return {
      overall: stats.implementationStatus,
      byCategory,
      criticalImplemented: this.areCriticalTestsImplemented(),
      criticalCount: stats.severityDistribution.critical
    };
  }

  /**
   * Gibt einen strukturierten Validierungsbericht aus
   */
  static printValidationReport(): void {
    const result = this.validateCatalog();

    console.log('\n════════════════════════════════════════════════════');
    console.log('         TEST CATALOG VALIDATION REPORT');
    console.log('════════════════════════════════════════════════════');

    if (result.valid) {
      console.log('\n✓ CATALOG VALID');
    } else {
      console.log('\n✗ CATALOG INVALID');
    }

    if (result.errors.length > 0) {
      console.log(`\nErrors (${result.errors.length}):`);
      result.errors.forEach(err => console.log(`  ✗ ${err}`));
    }

    if (result.warnings.length > 0) {
      console.log(`\nWarnings (${result.warnings.length}):`);
      result.warnings.forEach(warn => console.log(`  ⚠ ${warn}`));
    }

    console.log('\n════════════════════════════════════════════════════\n');
  }

  /**
   * Gibt einen Implementierungsbericht aus
   */
  static printImplementationReport(): void {
    const report = this.getImplementationReport();

    console.log('\n════════════════════════════════════════════════════');
    console.log('      TEST IMPLEMENTATION STATUS REPORT');
    console.log('════════════════════════════════════════════════════');

    console.log(`\nOverall: ${report.overall.implemented}/${report.overall.total} (${report.overall.percent}%)`);

    console.log('\nBy Category:');
    Object.entries(report.byCategory)
      .sort()
      .forEach(([category, stats]) => {
        const icon = stats.percent === 100 ? '✓' : stats.percent === 0 ? '✗' : '◐';
        console.log(`  ${icon} ${category}: ${stats.implemented}/${stats.total} (${stats.percent}%)`);
      });

    console.log(`\nCritical Tests Implemented: ${report.criticalImplemented ? '✓' : '✗'} (${report.criticalCount} total)`);

    console.log('\n════════════════════════════════════════════════════\n');
  }
}

/**
 * Validierungsfunktionen als exports
 */
export function validateCatalog(): ValidationResult {
  return TestValidator.validateCatalog();
}

export function validateTest(test: TestDefinition): ValidationResult {
  return TestValidator.validateTest(test);
}
