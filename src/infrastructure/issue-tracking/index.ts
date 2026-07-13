/**
 * ISSUE TRACKING MODULE EXPORTS
 */

// Types
export * from './types/issue.types';

// Services
export { IssueRepositoryService } from './services/issue-repository.service';
export { IssueManagerService } from './services/issue-manager.service';
export { GovernanceIssueIntegrator } from './services/governance-issue.integrator';

// Singleton instances for convenience
import { IssueRepositoryService } from './services/issue-repository.service';
import { IssueManagerService } from './services/issue-manager.service';
import path from 'path';

const issueRepositoryPath = path.join(process.cwd(), 'test-results', 'issues-repository.json');
export const issueRepository = new IssueRepositoryService(issueRepositoryPath);
export const issueManager = new IssueManagerService(issueRepository);
