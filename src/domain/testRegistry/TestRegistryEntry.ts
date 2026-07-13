import { TestId } from './TestId';
import { TestCategory, SeverityImpact } from './TestMetadata';

/**
 * Test Registry Entry - Domain Entity
 * Aggregiert root für Test-Metadaten Verwaltung
 *
 * Verantwortlich für:
 * - Verwaltung von Test-Informationen
 * - Konsistenz der Test-Metadaten
 * - Test Discovery und Status Tracking
 */
export class TestRegistryEntry {
  private testId: TestId;
  private testName: string;
  private category: TestCategory;
  private description: string;
  private component: string;
  private severityImpact: SeverityImpact;
  private buildBlocking: boolean;
  private enabled: boolean;
  private framework: string;
  private tags: string[];
  private estimatedDuration?: number; // in milliseconds
  private dependencies: string[];      // andere Test-IDs von denen dieser Test abhängt
  private createdAt: Date;
  private updatedAt: Date;
  private lastExecuted?: Date;
  private executionStats: TestExecutionStats;

  private constructor(
    testId: TestId,
    testName: string,
    category: TestCategory,
    description: string,
    component: string,
    severityImpact: SeverityImpact,
    buildBlocking: boolean,
    enabled: boolean,
    framework: string,
    tags: string[] = [],
    estimatedDuration?: number,
    dependencies: string[] = []
  ) {
    this.validateInputs(testName, description, component, framework);

    this.testId = testId;
    this.testName = testName.trim();
    this.category = category;
    this.description = description.trim();
    this.component = component.trim();
    this.severityImpact = severityImpact;
    this.buildBlocking = buildBlocking;
    this.enabled = enabled;
    this.framework = framework.trim();
    this.tags = tags.map(t => t.toLowerCase());
    this.estimatedDuration = estimatedDuration;
    this.dependencies = dependencies;
    this.createdAt = new Date();
    this.updatedAt = new Date();
    this.executionStats = {
      totalRuns: 0,
      successCount: 0,
      failureCount: 0,
      skippedCount: 0,
      averageDuration: 0,
      flakiness: 0
    };
  }

  /**
   * Factory Methode für neue Test Registry Entries
   */
  static create(props: TestRegistryProps): TestRegistryEntry {
    return new TestRegistryEntry(
      TestId.generate(),
      props.testName,
      props.category,
      props.description,
      props.component,
      props.severityImpact,
      props.buildBlocking,
      props.enabled,
      props.framework,
      props.tags,
      props.estimatedDuration,
      props.dependencies
    );
  }

  /**
   * Rekonstruktion aus persistierten Daten
   */
  static fromPersistence(data: TestRegistryPersistenceData): TestRegistryEntry {
    const entry = new TestRegistryEntry(
      TestId.from(data.testId),
      data.testName,
      data.category,
      data.description,
      data.component,
      data.severityImpact,
      data.buildBlocking,
      data.enabled,
      data.framework,
      data.tags,
      data.estimatedDuration,
      data.dependencies
    );
    entry.createdAt = new Date(data.createdAt);
    entry.updatedAt = new Date(data.updatedAt);
    entry.lastExecuted = data.lastExecuted ? new Date(data.lastExecuted) : undefined;
    entry.executionStats = data.executionStats || entry.executionStats;
    return entry;
  }

  /**
   * Validierung der Eingaben
   */
  private validateInputs(
    testName: string,
    description: string,
    component: string,
    framework: string
  ): void {
    if (!testName || testName.trim().length === 0) {
      throw new Error('Test name is required');
    }
    if (testName.length > 255) {
      throw new Error('Test name must not exceed 255 characters');
    }
    if (!description || description.trim().length === 0) {
      throw new Error('Test description is required');
    }
    if (!component || component.trim().length === 0) {
      throw new Error('Test component is required');
    }
    if (!framework || framework.trim().length === 0) {
      throw new Error('Test framework is required');
    }
  }

  // ============ Getters ============

  getTestId(): TestId {
    return this.testId;
  }

  getTestName(): string {
    return this.testName;
  }

  getCategory(): TestCategory {
    return this.category;
  }

  getDescription(): string {
    return this.description;
  }

  getComponent(): string {
    return this.component;
  }

  getSeverityImpact(): SeverityImpact {
    return this.severityImpact;
  }

  isBuildBlocking(): boolean {
    return this.buildBlocking;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getFramework(): string {
    return this.framework;
  }

  getTags(): string[] {
    return [...this.tags];
  }

  getEstimatedDuration(): number | undefined {
    return this.estimatedDuration;
  }

  getDependencies(): string[] {
    return [...this.dependencies];
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getUpdatedAt(): Date {
    return this.updatedAt;
  }

  getLastExecuted(): Date | undefined {
    return this.lastExecuted;
  }

  getExecutionStats(): TestExecutionStats {
    return { ...this.executionStats };
  }

  // ============ Geschäftslogik ============

  /**
   * Aktiviert oder deaktiviert den Test
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
    this.updatedAt = new Date();
  }

  /**
   * Aktualisiert Build Blocking Status
   */
  setBuildBlocking(buildBlocking: boolean): void {
    this.buildBlocking = buildBlocking;
    this.updatedAt = new Date();
  }

  /**
   * Aktualisiert Severity Impact
   */
  setSeverityImpact(severityImpact: SeverityImpact): void {
    this.severityImpact = severityImpact;
    this.updatedAt = new Date();
  }

  /**
   * Aktualisiert Description
   */
  updateDescription(newDescription: string): void {
    if (!newDescription || newDescription.trim().length === 0) {
      throw new Error('Description cannot be empty');
    }
    this.description = newDescription.trim();
    this.updatedAt = new Date();
  }

  /**
   * Fügt Tags hinzu
   */
  addTags(tags: string[]): void {
    const newTags = tags.map(t => t.toLowerCase());
    this.tags = Array.from(new Set([...this.tags, ...newTags]));
    this.updatedAt = new Date();
  }

  /**
   * Entfernt Tags
   */
  removeTags(tags: string[]): void {
    const tagsToRemove = tags.map(t => t.toLowerCase());
    this.tags = this.tags.filter(t => !tagsToRemove.includes(t));
    this.updatedAt = new Date();
  }

  /**
   * Registriert erfolgreiche Ausführung
   */
  recordSuccess(duration: number): void {
    this.executionStats.totalRuns++;
    this.executionStats.successCount++;
    this.lastExecuted = new Date();
    this.updateAverageDuration(duration);
    this.updateFlakiness();
  }

  /**
   * Registriert fehlgeschlagene Ausführung
   */
  recordFailure(duration: number): void {
    this.executionStats.totalRuns++;
    this.executionStats.failureCount++;
    this.lastExecuted = new Date();
    this.updateAverageDuration(duration);
    this.updateFlakiness();
  }

  /**
   * Registriert übersprungene Ausführung
   */
  recordSkipped(): void {
    this.executionStats.totalRuns++;
    this.executionStats.skippedCount++;
    this.lastExecuted = new Date();
  }

  /**
   * Berechnet durchschnittliche Ausführungsdauer
   */
  private updateAverageDuration(newDuration: number): void {
    const executedCount = this.executionStats.successCount + this.executionStats.failureCount;
    const oldAverage = this.executionStats.averageDuration;
    this.executionStats.averageDuration = 
      (oldAverage * (executedCount - 1) + newDuration) / executedCount;
  }

  /**
   * Berechnet Flakiness Rate (Anteil von Erfolgen bei mehreren Läufen)
   */
  private updateFlakiness(): void {
    if (this.executionStats.totalRuns === 0) return;
    const successRate = this.executionStats.successCount / this.executionStats.totalRuns;
    this.executionStats.flakiness = 1 - successRate;
  }

  /**
   * Überprüft ob Test flaky ist
   */
  isFlaky(): boolean {
    return this.executionStats.flakiness > 0.3; // 30% Fehlerrate gilt als flaky
  }

  /**
   * Überprüft ob Test aktiv und nicht blockiert ist
   */
  isActive(): boolean {
    return this.enabled && !this.isFlaky();
  }

  /**
   * Gibt Success Rate zurück
   */
  getSuccessRate(): number {
    if (this.executionStats.totalRuns === 0) return 0;
    return this.executionStats.successCount / this.executionStats.totalRuns;
  }

  /**
   * Konvertiert zu Persistierungs-Format
   */
  toPersistence(): TestRegistryPersistenceData {
    return {
      testId: this.testId.getValue(),
      testName: this.testName,
      category: this.category,
      description: this.description,
      component: this.component,
      severityImpact: this.severityImpact,
      buildBlocking: this.buildBlocking,
      enabled: this.enabled,
      framework: this.framework,
      tags: this.tags,
      estimatedDuration: this.estimatedDuration,
      dependencies: this.dependencies,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      lastExecuted: this.lastExecuted?.toISOString(),
      executionStats: this.executionStats
    };
  }

  /**
   * Konvertiert zu JSON
   */
  toJSON(): TestRegistryPersistenceData {
    return this.toPersistence();
  }
}

/**
 * Execution Statistics
 */
export interface TestExecutionStats {
  totalRuns: number;
  successCount: number;
  failureCount: number;
  skippedCount: number;
  averageDuration: number;
  flakiness: number;
}

/**
 * Props für Test Registry Entry Erstellung
 */
export interface TestRegistryProps {
  testName: string;
  category: TestCategory;
  description: string;
  component: string;
  severityImpact: SeverityImpact;
  buildBlocking: boolean;
  enabled: boolean;
  framework: string;
  tags?: string[];
  estimatedDuration?: number;
  dependencies?: string[];
}

/**
 * Persistierungs-Format für Datenbank/JSON
 */
export interface TestRegistryPersistenceData {
  testId: string;
  testName: string;
  category: TestCategory;
  description: string;
  component: string;
  severityImpact: SeverityImpact;
  buildBlocking: boolean;
  enabled: boolean;
  framework: string;
  tags: string[];
  estimatedDuration?: number;
  dependencies: string[];
  createdAt: string;
  updatedAt: string;
  lastExecuted?: string;
  executionStats: TestExecutionStats;
}
