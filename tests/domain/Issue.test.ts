import { Issue, IssueStatus } from '../src/domain/issue/Issue';
import { IssueId } from '../src/domain/issue/IssueId';
import { Severity } from '../src/domain/issue/Severity';

describe('IssueId - Value Object', () => {
  describe('generation', () => {
    it('should generate unique IssueIds', () => {
      const id1 = IssueId.generate();
      const id2 = IssueId.generate();
      expect(id1.getValue()).not.toBe(id2.getValue());
    });

    it('should create IssueId from string', () => {
      const value = 'test-issue-id-123';
      const id = IssueId.from(value);
      expect(id.getValue()).toBe(value);
    });

    it('should not allow empty IssueId', () => {
      expect(() => IssueId.from('')).toThrow('IssueId value cannot be empty');
      expect(() => IssueId.from('   ')).toThrow('IssueId value cannot be empty');
    });
  });

  describe('equality', () => {
    it('should compare IssueIds correctly', () => {
      const id1 = IssueId.from('same-id');
      const id2 = IssueId.from('same-id');
      const id3 = IssueId.from('different-id');

      expect(id1.equals(id2)).toBe(true);
      expect(id1.equals(id3)).toBe(false);
    });
  });

  describe('serialization', () => {
    it('should convert to string', () => {
      const id = IssueId.from('test-id-123');
      expect(id.toString()).toBe('test-id-123');
    });

    it('should convert to JSON', () => {
      const id = IssueId.from('test-id-123');
      expect(id.toJSON()).toBe('test-id-123');
    });
  });
});

describe('Issue - Domain Entity', () => {
  const baseProps = {
    title: 'Test Issue',
    description: 'Test Description',
    category: 'TEST',
    component: 'TestComponent',
    severity: Severity.MEDIUM,
    rootCause: 'Test root cause',
    recommendation: 'Test recommendation',
    consequenceIfResolved: 'System works',
    consequenceIfIgnored: 'System broken',
    detectedBy: 'TestRunner',
    buildVersion: '1.0.0'
  };

  describe('creation', () => {
    it('should create issue with valid props', () => {
      const issue = Issue.create(baseProps);
      expect(issue.getTitle()).toBe('Test Issue');
      expect(issue.getDescription()).toBe('Test Description');
      expect(issue.getCategory()).toBe('TEST');
      expect(issue.getComponent()).toBe('TestComponent');
      expect(issue.getSeverity()).toBe(Severity.MEDIUM);
      expect(issue.getStatus()).toBe(IssueStatus.OPEN);
    });

    it('should throw error for missing title', () => {
      expect(() => Issue.create({ ...baseProps, title: '' })).toThrow('Issue title is required');
    });

    it('should throw error for missing description', () => {
      expect(() => Issue.create({ ...baseProps, description: '' })).toThrow('Issue description is required');
    });

    it('should throw error for missing category', () => {
      expect(() => Issue.create({ ...baseProps, category: '' })).toThrow('Issue category is required');
    });

    it('should throw error for missing component', () => {
      expect(() => Issue.create({ ...baseProps, component: '' })).toThrow('Issue component is required');
    });

    it('should throw error for title exceeding 255 chars', () => {
      const longTitle = 'a'.repeat(256);
      expect(() => Issue.create({ ...baseProps, title: longTitle })).toThrow('Issue title must not exceed 255 characters');
    });

    it('should trim whitespace from properties', () => {
      const issue = Issue.create({
        ...baseProps,
        title: '  Test Issue  ',
        description: '  Test Description  '
      });
      expect(issue.getTitle()).toBe('Test Issue');
      expect(issue.getDescription()).toBe('Test Description');
    });
  });

  describe('persistence', () => {
    it('should convert to persistence format', () => {
      const issue = Issue.create(baseProps);
      const persisted = issue.toPersistence();

      expect(persisted.title).toBe('Test Issue');
      expect(persisted.issueId).toBeDefined();
      expect(persisted.status).toBe(IssueStatus.OPEN);
      expect(persisted.createdAt).toBeDefined();
      expect(persisted.updatedAt).toBeDefined();
    });

    it('should reconstruct from persistence', () => {
      const original = Issue.create(baseProps);
      const persisted = original.toPersistence();
      const reconstructed = Issue.fromPersistence(persisted);

      expect(reconstructed.getTitle()).toBe(original.getTitle());
      expect(reconstructed.getIssueId().getValue()).toBe(original.getIssueId().getValue());
      expect(reconstructed.getStatus()).toBe(original.getStatus());
    });

    it('should convert to JSON', () => {
      const issue = Issue.create(baseProps);
      const json = issue.toJSON();
      expect(json.title).toBe('Test Issue');
      expect(json.issueId).toBeDefined();
    });
  });

  describe('business logic', () => {
    it('should update status', () => {
      const issue = Issue.create(baseProps);
      expect(issue.getStatus()).toBe(IssueStatus.OPEN);

      issue.updateStatus(IssueStatus.IN_PROGRESS);
      expect(issue.getStatus()).toBe(IssueStatus.IN_PROGRESS);
    });

    it('should not update status if unchanged', () => {
      const issue = Issue.create(baseProps);
      const beforeUpdate = issue.getUpdatedAt();
      issue.updateStatus(IssueStatus.OPEN);

      expect(issue.getUpdatedAt().getTime()).toBe(beforeUpdate.getTime());
    });

    it('should update timestamp on status change', async () => {
      const issue = Issue.create(baseProps);
      const beforeUpdate = issue.getUpdatedAt();
      
      await new Promise(resolve => setTimeout(resolve, 10));
      issue.updateStatus(IssueStatus.IN_PROGRESS);

      expect(issue.getUpdatedAt().getTime()).toBeGreaterThan(beforeUpdate.getTime());
    });

    it('should check if issue is resolved', () => {
      const issue = Issue.create(baseProps);
      expect(issue.isResolved()).toBe(false);

      issue.updateStatus(IssueStatus.RESOLVED);
      expect(issue.isResolved()).toBe(true);
    });

    it('should check if issue is critical', () => {
      const criticalIssue = Issue.create({ ...baseProps, severity: Severity.CRITICAL });
      const normalIssue = Issue.create(baseProps);

      expect(criticalIssue.isCritical()).toBe(true);
      expect(normalIssue.isCritical()).toBe(false);
    });

    it('should check if issue is high priority', () => {
      const criticalIssue = Issue.create({ ...baseProps, severity: Severity.CRITICAL });
      const highIssue = Issue.create({ ...baseProps, severity: Severity.HIGH });
      const mediumIssue = Issue.create(baseProps);

      expect(criticalIssue.isHighPriority()).toBe(true);
      expect(highIssue.isHighPriority()).toBe(true);
      expect(mediumIssue.isHighPriority()).toBe(false);
    });

    it('should update recommendation', () => {
      const issue = Issue.create(baseProps);
      const newRecommendation = 'New recommendation';

      issue.updateRecommendation(newRecommendation);
      expect(issue.getRecommendation()).toBe(newRecommendation);
    });

    it('should not update recommendation with empty value', () => {
      const issue = Issue.create(baseProps);
      expect(() => issue.updateRecommendation('')).toThrow('Recommendation cannot be empty');
    });

    it('should update severity only when open', () => {
      const issue = Issue.create(baseProps);
      issue.updateSeverity(Severity.CRITICAL);
      expect(issue.getSeverity()).toBe(Severity.CRITICAL);

      issue.updateStatus(IssueStatus.RESOLVED);
      expect(() => issue.updateSeverity(Severity.HIGH)).toThrow(
        'Cannot update severity of non-open issues'
      );
    });
  });

  describe('getters', () => {
    it('should provide all getters', () => {
      const issue = Issue.create(baseProps);
      
      expect(issue.getIssueId()).toBeDefined();
      expect(issue.getTitle()).toBeDefined();
      expect(issue.getDescription()).toBeDefined();
      expect(issue.getCategory()).toBeDefined();
      expect(issue.getComponent()).toBeDefined();
      expect(issue.getSeverity()).toBeDefined();
      expect(issue.getRootCause()).toBeDefined();
      expect(issue.getRecommendation()).toBeDefined();
      expect(issue.getConsequenceIfResolved()).toBeDefined();
      expect(issue.getConsequenceIfIgnored()).toBeDefined();
      expect(issue.getDetectedBy()).toBeDefined();
      expect(issue.getBuildVersion()).toBeDefined();
      expect(issue.getTimestamp()).toBeDefined();
      expect(issue.getStatus()).toBeDefined();
      expect(issue.getCreatedAt()).toBeDefined();
      expect(issue.getUpdatedAt()).toBeDefined();
    });
  });
});

describe('Severity Enum', () => {
  it('should define all severity levels', () => {
    expect(Severity.CRITICAL).toBe('CRITICAL');
    expect(Severity.HIGH).toBe('HIGH');
    expect(Severity.MEDIUM).toBe('MEDIUM');
    expect(Severity.LOW).toBe('LOW');
    expect(Severity.INFO).toBe('INFO');
  });

  it('should have correct weights', () => {
    const { SeverityWeights } = require('../src/domain/issue/Severity');
    expect(SeverityWeights[Severity.CRITICAL]).toBe(5);
    expect(SeverityWeights[Severity.HIGH]).toBe(4);
    expect(SeverityWeights[Severity.MEDIUM]).toBe(3);
    expect(SeverityWeights[Severity.LOW]).toBe(2);
    expect(SeverityWeights[Severity.INFO]).toBe(1);
  });
});
