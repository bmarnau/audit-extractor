/**
 * Domain Layer - Test Registry Management
 *
 * Exports:
 * - TestRegistryEntry Entity und Value Objects
 * - Repository Interfaces
 * - Factory für DDD-konforme Erstellung
 * - Metadaten Definitionen
 */

export { TestRegistryEntry, type TestRegistryProps, type TestExecutionStats, type TestRegistryPersistenceData } from './TestRegistryEntry';
export { TestId } from './TestId';
export { TestCategory, SeverityImpact, TestCategoryDescriptions, SeverityImpactDescriptions } from './TestMetadata';
export { TestRegistryFactory } from './TestRegistryFactory';
export { TestRegistryRepository, type TestRegistryCatalogStatistics, type ComponentTestOverview } from './TestRegistryRepository';
