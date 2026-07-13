/**
 * Domain Layer - Issue Management Aggregate Root
 *
 * Exports:
 * - Issue Entity und Value Objects
 * - Repository Interfaces
 * - Factory für DDD-konforme Erstellung
 * - Severity Definitionen
 */

export { Issue, IssueStatus, type IssueProps, type IssuePersistenceData } from './Issue';
export { IssueId } from './IssueId';
export { Severity, SeverityWeights, SeverityDescriptions } from './Severity';
export { IssueFactory } from './IssueFactory';
export { IssueRepository, type IssueStatistics, type ComponentStatistics } from './IssueRepository';
