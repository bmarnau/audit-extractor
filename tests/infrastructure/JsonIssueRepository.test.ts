import { JsonIssueRepository } from '../src/infrastructure/persistence/JsonIssueRepository';
import { IssueFactory } from '../src/domain/issue/IssueFactory';
import { Issue, IssueStatus } from '../src/domain/issue/Issue';
import { IssueId } from '../src/domain/issue/IssueId';
import { Severity } from '../src/domain/issue/Severity';
import path from 'path';
import fs from 'fs/promises';

describe('JsonIssueRepository - Infrastructure Layer', () => {
  let repository: JsonIssueRepository;
  const testDir = path.join(__dirname, '../test-repo');

  beforeAll(async () => {
    try {
      await fs.rm(testDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore
    }
    await fs.mkdir(testDir, { recursive: true });
  });

  beforeEach(async () => {
    repository = new JsonIssueRepository(testDir);
    await repository.initialize();
  });

  afterEach(async () => {
    await repository.deleteAll();
  });

  describe('initialization', () => {
    it('should initialize repository', async () => {
      const repo = new JsonIssueRepository(testDir);
      await repo.initialize();
      expect(repo.getStorageDir()).toBe(testDir);
    });

    it('should create storage directory if not exists', async () => {
      const newDir = path.join(testDir, 'new-dir');
      const repo = new JsonIssueRepository(newDir);
      await repo.initialize();

      const exists = await fs
        .access(newDir)
        .then(() => true)
        .catch(() => false);
      expect(exists).toBe(true);
    });

    it('should load existing issues from file', async () => {
      const issue = IssueFactory.createTestIssue();
      await repository.save(issue);

      const repo2 = new JsonIssueRepository(testDir);
      await repo2.initialize();
      const loaded = await repo2.findById(issue.getIssueId());
      expect(loaded?.getTitle()).toBe('Test Issue');
    });
  });

  describe('save and retrieve', () => {
    it('should save and retrieve issue', async () => {
      const issue = IssueFactory.createTestIssue();
      await repository.save(issue);

      const retrieved = await repository.findById(issue.getIssueId());
      expect(retrieved).not.toBeNull();
      expect(retrieved?.getTitle()).toBe(issue.getTitle());
    });

    it('should return null for non-existent issue', async () => {
      const nonExistentId = IssueId.from('non-existent');
      const result = await repository.findById(nonExistentId);
      expect(result).toBeNull();
    });

    it('should update existing issue', async () => {
      const issue = IssueFactory.createTestIssue();
      await repository.save(issue);

      issue.updateStatus(IssueStatus.RESOLVED);
      await repository.update(issue);

      const retrieved = await repository.findById(issue.getIssueId());
      expect(retrieved?.getStatus()).toBe(IssueStatus.RESOLVED);
    });

    it('should throw error updating non-existent issue', async () => {
      const issue = IssueFactory.createTestIssue();
      await expect(repository.update(issue)).rejects.toThrow();
    });
  });

  describe('queries', () => {
    beforeEach(async () => {
      const issue1 = IssueFactory.createTestIssue({
        title: 'Critical Issue',
        severity: Severity.CRITICAL,
        component: 'Component1',
        category: 'TEST'
      });

      const issue2 = IssueFactory.createTestIssue({
        title: 'High Priority Issue',
        severity: Severity.HIGH,
        component: 'Component2',
        category: 'BUG'
      });

      const issue3 = IssueFactory.createTestIssue({
        title: 'Medium Issue',
        severity: Severity.MEDIUM,
        component: 'Component1',
        category: 'TEST'
      });

      await repository.saveMany([issue1, issue2, issue3]);
    });

    it('should find all issues', async () => {
      const issues = await repository.findAll();
      expect(issues).toHaveLength(3);
    });

    it('should find by severity', async () => {
      const critical = await repository.findBySeverity(Severity.CRITICAL);
      expect(critical).toHaveLength(1);
      expect(critical[0].getSeverity()).toBe(Severity.CRITICAL);
    });

    it('should find by component', async () => {
      const issues = await repository.findByComponent('Component1');
      expect(issues).toHaveLength(2);
    });

    it('should find by category', async () => {
      const issues = await repository.findByCategory('TEST');
      expect(issues).toHaveLength(2);
    });

    it('should find by status', async () => {
      const openIssues = await repository.findByStatus(IssueStatus.OPEN);
      expect(openIssues.length).toBeGreaterThan(0);
    });

    it('should find by title contains', async () => {
      const issues = await repository.findByTitleContains('Critical');
      expect(issues).toHaveLength(1);
      expect(issues[0].getTitle()).toContain('Critical');
    });

    it('should be case-insensitive for title search', async () => {
      const issues = await repository.findByTitleContains('critical');
      expect(issues).toHaveLength(1);
    });

    it('should find by date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const issues = await repository.findByDateRange(yesterday, tomorrow);
      expect(issues.length).toBeGreaterThan(0);
    });

    it('should find by build version', async () => {
      const issues = await repository.findByBuildVersion('1.0.0-test');
      expect(issues.length).toBeGreaterThan(0);
    });
  });

  describe('statistics', () => {
    beforeEach(async () => {
      await repository.saveMany([
        IssueFactory.createTestIssue({
          severity: Severity.CRITICAL,
          component: 'Frontend',
          category: 'BUG'
        }),
        IssueFactory.createTestIssue({
          severity: Severity.HIGH,
          component: 'Backend',
          category: 'PERFORMANCE'
        }),
        IssueFactory.createTestIssue({
          severity: Severity.MEDIUM,
          component: 'Frontend',
          category: 'BUG'
        })
      ]);
    });

    it('should get statistics', async () => {
      const stats = await repository.getStatistics();

      expect(stats.total).toBe(3);
      expect(stats.bySeverity.CRITICAL).toBe(1);
      expect(stats.bySeverity.HIGH).toBe(1);
      expect(stats.bySeverity.MEDIUM).toBe(1);
      expect(stats.byComponent['Frontend']).toBe(2);
      expect(stats.byComponent['Backend']).toBe(1);
    });

    it('should get component statistics', async () => {
      const stats = await repository.getComponentStatistics('Frontend');

      expect(stats.component).toBe('Frontend');
      expect(stats.totalIssues).toBe(2);
      expect(stats.criticalCount).toBe(1);
      expect(stats.mediumCount).toBe(1);
      expect(stats.recentIssues.length).toBeLessThanOrEqual(5);
    });
  });

  describe('delete operations', () => {
    it('should delete issue', async () => {
      const issue = IssueFactory.createTestIssue();
      await repository.save(issue);

      await repository.delete(issue.getIssueId());
      const retrieved = await repository.findById(issue.getIssueId());
      expect(retrieved).toBeNull();
    });

    it('should delete all issues', async () => {
      await repository.saveMany([
        IssueFactory.createTestIssue(),
        IssueFactory.createTestIssue(),
        IssueFactory.createTestIssue()
      ]);

      await repository.deleteAll();
      const all = await repository.findAll();
      expect(all).toHaveLength(0);
    });
  });

  describe('count and exists', () => {
    beforeEach(async () => {
      await repository.saveMany([
        IssueFactory.createTestIssue(),
        IssueFactory.createTestIssue(),
        IssueFactory.createTestIssue()
      ]);
    });

    it('should count issues', async () => {
      const count = await repository.count();
      expect(count).toBe(3);
    });

    it('should check existence', async () => {
      const allIssues = await repository.findAll();
      const firstId = allIssues[0].getIssueId();

      const exists = await repository.exists(firstId);
      expect(exists).toBe(true);

      const notExists = await repository.exists(IssueId.from('non-existent'));
      expect(notExists).toBe(false);
    });
  });

  describe('batch operations', () => {
    it('should save many issues', async () => {
      const issues = [
        IssueFactory.createTestIssue({ title: 'Issue 1' }),
        IssueFactory.createTestIssue({ title: 'Issue 2' }),
        IssueFactory.createTestIssue({ title: 'Issue 3' })
      ];

      await repository.saveMany(issues);
      const all = await repository.findAll();
      expect(all).toHaveLength(3);
    });
  });

  describe('persistence to file', () => {
    it('should persist data to JSON file', async () => {
      const issue = IssueFactory.createTestIssue();
      await repository.save(issue);

      const filePath = path.join(testDir, 'issues.json');
      const fileContent = await fs.readFile(filePath, 'utf-8');
      const data = JSON.parse(fileContent);

      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBeGreaterThan(0);
      expect(data[0].title).toBe('Test Issue');
    });

    it('should load data from JSON file on initialization', async () => {
      const issue1 = IssueFactory.createTestIssue({ title: 'Persisted Issue' });
      await repository.save(issue1);

      const repo2 = new JsonIssueRepository(testDir);
      await repo2.initialize();

      const all = await repo2.findAll();
      expect(all.length).toBeGreaterThan(0);
      expect(all[0].getTitle()).toContain('Persisted');
    });
  });

  describe('storage directory management', () => {
    it('should get storage directory', () => {
      expect(repository.getStorageDir()).toBe(testDir);
    });

    it('should not allow changing directory after initialization', () => {
      expect(() => {
        repository.setStorageDir('/new/path');
      }).toThrow();
    });

    it('should allow setting storage dir before initialization', async () => {
      const repo = new JsonIssueRepository(testDir);
      const newDir = path.join(testDir, 'alternative');
      repo.setStorageDir(newDir);
      await repo.initialize();
      expect(repo.getStorageDir()).toBe(newDir);
    });
  });

  describe('in-memory operations for testing', () => {
    it('should get in-memory issues', async () => {
      const issue = IssueFactory.createTestIssue();
      await repository.save(issue);

      const inMemory = repository.getInMemoryIssues();
      expect(inMemory.size).toBeGreaterThan(0);
    });

    it('should set in-memory issues', () => {
      const issues = new Map();
      const issue = IssueFactory.createTestIssue();
      issues.set(issue.getIssueId().getValue(), issue);

      repository.setInMemoryIssues(issues);
      const inMemory = repository.getInMemoryIssues();
      expect(inMemory.size).toBe(1);
    });
  });
});
