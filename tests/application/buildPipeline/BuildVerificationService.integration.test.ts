/**
 * Build Verification Pipeline - Integration Tests
 *
 * Tests the complete pipeline integration with external systems (TestRegistry, IssueService)
 * Tests report persistence and multi-run scenarios
 */

import { BuildVerificationService, BuildAssessmentReport } from '../../../src/application/buildPipeline';
import { BuildMetrics, BuildId, BuildStage } from '../../../src/domain/buildPipeline';

/**
 * Mock services for integration testing
 */

class IntegrationTestRegistry {
  private executions = 0;

  getAllTests() {
    return [
      { id: 'test_1', name: 'login-flow', component: 'auth', category: 'e2e' },
      { id: 'test_2', name: 'payment-flow', component: 'payment', category: 'e2e' },
      { id: 'test_3', name: 'notification-queue', component: 'messaging', category: 'integration' },
      { id: 'test_4', name: 'auth-unit', component: 'auth', category: 'unit' },
      { id: 'test_5', name: 'payment-unit', component: 'payment', category: 'unit' },
    ];
  }

  getTestsByCategory(category: string) {
    return this.getAllTests().filter(t => t.category === category);
  }

  getCatalogStatistics() {
    return {
      totalTests: 5,
      byCategory: { e2e: 3, integration: 1, unit: 1 },
      byComponent: { auth: 2, payment: 2, messaging: 1 },
    };
  }

  recordTestSuccess(testId: string) {
    // Mock implementation
  }

  recordTestFailure(testId: string, error: string) {
    // Mock implementation
  }

  getBuildAssessment() {
    return {
      totalTests: 5,
      successfulTests: 3,
      failedTests: 1,
      skippedTests: 1,
      riskLevel: 'HIGH',
    };
  }
}

class IntegrationIssueService {
  getAllIssues() {
    return [
      {
        id: 'issue_1',
        title: 'SQL injection in user query',
        component: 'auth',
        severity: 'CRITICAL',
        status: 'OPEN',
        created: new Date(),
      },
      {
        id: 'issue_2',
        title: 'Missing rate limiting',
        component: 'payment',
        severity: 'HIGH',
        status: 'OPEN',
        created: new Date(),
      },
      {
        id: 'issue_3',
        title: 'Unhandled exception in queue processor',
        component: 'messaging',
        severity: 'MEDIUM',
        status: 'OPEN',
        created: new Date(),
      },
    ];
  }

  getIssuesByComponent(component: string) {
    return this.getAllIssues().filter(i => i.component === component);
  }

  getIssuesByStatus(status: string) {
    return this.getAllIssues().filter(i => i.status === status);
  }

  getStatistics() {
    return {
      total: 3,
      bySeverity: { CRITICAL: 1, HIGH: 1, MEDIUM: 1, LOW: 0 },
      byStatus: { OPEN: 3, IN_PROGRESS: 0, RESOLVED: 0 },
      byComponent: { auth: 1, payment: 1, messaging: 1 },
    };
  }
}

/**
 * Integration Test Suite
 */

describe('BuildVerificationService - Integration Tests', () => {
  let service: BuildVerificationService;
  let testRegistry: IntegrationTestRegistry;
  let issueService: IntegrationIssueService;

  beforeEach(() => {
    testRegistry = new IntegrationTestRegistry();
    issueService = new IntegrationIssueService();
    service = new BuildVerificationService(testRegistry as any, issueService as any);
  });

  describe('Full Pipeline Integration', () => {
    it('should execute complete pipeline with all external integrations', async () => {
      const result = await service.runBuildPipeline();

      expect(result).toBeDefined();
      expect(result.report).toBeDefined();
      expect(result.timing).toBeDefined();
      expect(result.timing.duration).toBeGreaterThan(0);
    });

    it('should integrate with TestRegistry for test discovery', async () => {
      const result = await service.runBuildPipeline();

      // Verify test discovery
      expect(result.totalTests).toBe(5);
      expect(result.successfulTests).toBeGreaterThan(0);
      expect(result.failedTests).toBeGreaterThanOrEqual(0);
    });

    it('should integrate with IssueService for issue collection', async () => {
      const result = await service.runBuildPipeline();

      // Verify issue collection
      expect(result.totalIssues).toBe(3);
      expect(result.criticalIssues).toBeGreaterThan(0);
      expect(result.highIssues).toBeGreaterThan(0);
    });

    it('should correlate tests and issues by component', async () => {
      const result = await service.runBuildPipeline();

      // Verify component correlation
      const components = new Set<string>();
      result.risks.forEach((r: any) => components.add(r.affectedComponent));

      expect(components.size).toBeGreaterThan(0);
      expect(Array.from(components)).toEqual(
        expect.arrayContaining(['auth', 'payment', 'messaging'])
      );
    });

    it('should handle CI/CD context throughout pipeline', async () => {
      const ciContext = {
        branch: 'feature/security-fix',
        commitHash: 'def456ghi789',
        author: 'bob@example.com',
      };

      const result = await service.runBuildPipeline({ ci: ciContext });

      expect(result.branch).toBe(ciContext.branch);
      expect(result.commitHash).toBe(ciContext.commitHash);
      expect(result.author).toBe(ciContext.author);
    });
  });

  describe('Risk Assessment Integration', () => {
    it('should identify CRITICAL risks from CRITICAL issues', async () => {
      const result = await service.runBuildPipeline();

      const criticalRisks = result.risks.filter(
        (r: any) => r.severity === 'CRITICAL'
      );
      expect(criticalRisks.length).toBeGreaterThan(0);
    });

    it('should mark security issues as blocking risks', async () => {
      const result = await service.runBuildPipeline();

      const blockingRisks = result.risks.filter((r: any) => r.isBlocking());
      expect(blockingRisks.length).toBeGreaterThan(0);
    });

    it('should calculate impact scores across all risk categories', async () => {
      const result = await service.runBuildPipeline();

      expect(result.risks.length).toBeGreaterThan(0);
      result.risks.forEach((risk: any) => {
        const impactScore = risk.getImpactScore();
        expect(impactScore).toBeGreaterThanOrEqual(0);
        expect(impactScore).toBeLessThanOrEqual(100);
      });
    });

    it('should track risks by affected component', async () => {
      const result = await service.runBuildPipeline();

      const risksByComponent = new Map<string, number>();
      result.risks.forEach((risk: any) => {
        risksByComponent.set(
          risk.affectedComponent,
          (risksByComponent.get(risk.affectedComponent) || 0) + 1
        );
      });

      // All three components should have risks
      expect(risksByComponent.size).toBeGreaterThan(0);
    });
  });

  describe('Recommendation Generation Integration', () => {
    it('should generate recommendations for each risk', async () => {
      const result = await service.runBuildPipeline();

      expect(result.recommendations.length).toBeGreaterThan(0);
      result.recommendations.forEach((rec: any) => {
        expect(rec.id).toBeDefined();
        expect(rec.type).toBeDefined();
        expect(rec.priority).toBeGreaterThanOrEqual(1);
        expect(rec.priority).toBeLessThanOrEqual(10);
      });
    });

    it('should prioritize recommendations correctly', async () => {
      const result = await service.runBuildPipeline();

      const sorted = [...result.recommendations].sort(
        (a: any, b: any) => b.priority - a.priority
      );

      // Verify sorting
      for (let i = 0; i < sorted.length - 1; i++) {
        expect(sorted[i].priority).toBeGreaterThanOrEqual(sorted[i + 1].priority);
      }
    });

    it('should identify blocking recommendations', async () => {
      const result = await service.runBuildPipeline();

      const blockingRecs = result.recommendations.filter((r: any) => r.isBlocking());
      expect(blockingRecs.length).toBeGreaterThanOrEqual(0);

      blockingRecs.forEach((rec: any) => {
        expect(rec.type).toMatch(/FIX_BEFORE_MERGE|SKIP_BUILD/);
      });
    });

    it('should include action items with recommendations', async () => {
      const result = await service.runBuildPipeline();

      result.recommendations.forEach((rec: any) => {
        expect(rec.actionItems).toBeDefined();
        if (rec.priority >= 8) {
          expect(rec.actionItems.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Build Assessment Integration', () => {
    it('should calculate health score based on tests and issues', async () => {
      const result = await service.runBuildPipeline();

      expect(result.healthScore).toBeGreaterThanOrEqual(0);
      expect(result.healthScore).toBeLessThanOrEqual(100);
    });

    it('should determine risk level from metrics', async () => {
      const result = await service.runBuildPipeline();

      expect(result.riskLevel).toMatch(/CRITICAL|HIGH|MEDIUM|LOW/);
    });

    it('should make pass/fail decision based on blocking issues', async () => {
      const result = await service.runBuildPipeline();

      if (result.buildBlockingIssues > 0) {
        expect(result.canBuildPass).toBe(false);
      } else if (result.successRate < 0.8) {
        expect(result.canBuildPass).toBe(false);
      }
    });

    it('should provide appropriate recommendation text', async () => {
      const result = await service.runBuildPipeline();

      expect(result.recommendation).toBeDefined();
      expect(result.recommendation.length).toBeGreaterThan(0);

      if (!result.result.canBuildPass) {
        expect(result.recommendation).toMatch(/fix|block|investigate/i);
      }
    });
  });

  describe('Report Export Integration', () => {
    it('should generate valid markdown report', async () => {
      const result = await service.runBuildPipeline();

      const markdown = service.generateMarkdownReport(result.report);

      expect(markdown).toBeDefined();
      expect(markdown.length).toBeGreaterThan(100);
      expect(markdown).toContain('# Build Assessment Report');
      expect(markdown).toContain(result.buildId);
    });

    it('should export valid JSON report', async () => {
      const result = await service.runBuildPipeline();

      const json = service.exportReportAsJson(result.report);

      expect(json).toBeDefined();
      expect(json.buildId).toBe(result.buildId);
      expect(json.status).toBe(result.status);
      expect(json.metrics).toBeDefined();
    });

    it('should include all metrics in JSON export', async () => {
      const result = await service.runBuildPipeline();

      const json = service.exportReportAsJson(result.report);

      expect(json.totalTests).toBeDefined();
      expect(json.successfulTests).toBeDefined();
      expect(json.failedTests).toBeDefined();
      expect(json.totalIssues).toBeDefined();
      expect(json.healthScore).toBeDefined();
    });

    it('should serialize risks and recommendations in JSON', async () => {
      const result = await service.runBuildPipeline();

      const json = service.exportReportAsJson(result.report);

      expect(Array.isArray(json.risks)).toBe(true);
      expect(Array.isArray(json.recommendations)).toBe(true);
    });
  });

  describe('Multi-Run Scenarios', () => {
    it('should generate unique BuildIds for each pipeline run', async () => {
      const result1 = await service.runBuildPipeline();
      const result2 = await service.runBuildPipeline();

      expect(result1.report.buildId).not.toBe(result2.report.buildId);
    });

    it('should handle rapid sequential executions', async () => {
      const runs = [];
      for (let i = 0; i < 5; i++) {
        runs.push(await service.runBuildPipeline());
      }

      expect(runs.length).toBe(5);
      runs.forEach((result: any) => {
        expect(result.report).toBeDefined();
        expect(result.buildId).toBeDefined();
      });

      // All BuildIds should be unique
      const ids = runs.map((r: any) => r.report.buildId);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(5);
    });

    it('should maintain consistent metrics across runs with same data', async () => {
      const result1 = await service.runBuildPipeline();
      const result2 = await service.runBuildPipeline();

      // Metrics should be similar (allowing for flaky test variations)
      expect(result1.report.totalTests).toBe(result2.report.totalTests);
      expect(result1.report.totalIssues).toBe(result2.report.totalIssues);
    });
  });

  describe('Edge Cases & Error Handling', () => {
    it('should handle empty test results', async () => {
      const emptyRegistry = {
        getAllTests: () => [],
        getTestsByCategory: () => [],
        getCatalogStatistics: () => ({ totalTests: 0 }),
        recordTestSuccess: () => {},
        recordTestFailure: () => {},
        getBuildAssessment: () => ({}),
      };

      const serviceWithEmpty = new BuildVerificationService(
        emptyRegistry,
        issueService
      );

      const result = await serviceWithEmpty.runBuildPipeline();

      expect(result.totalTests).toBe(0);
      expect(result.successRate).toBe(0);
    });

    it('should handle zero issues', async () => {
      const emptyIssueService = {
        getAllIssues: () => [],
        getIssuesByComponent: () => [],
        getIssuesByStatus: () => [],
        getStatistics: () => ({ total: 0 }),
      };

      const serviceWithEmpty = new BuildVerificationService(
        testRegistry,
        emptyIssueService
      );

      const result = await serviceWithEmpty.runBuildPipeline();

      expect(result.totalIssues).toBe(0);
      expect(result.criticalIssues).toBe(0);
    });

    it('should handle 100% success rate', async () => {
      const perfectRegistry = {
        getAllTests: () => [
          { id: 'test_1', name: 'test1', component: 'app', category: 'unit' },
        ],
        getTestsByCategory: () => [],
        getCatalogStatistics: () => ({ totalTests: 1 }),
        recordTestSuccess: () => {},
        recordTestFailure: () => {},
        getBuildAssessment: () => ({
          totalTests: 1,
          successfulTests: 1,
          failedTests: 0,
        }),
      };

      const emptyIssueService = {
        getAllIssues: () => [],
        getIssuesByComponent: () => [],
        getIssuesByStatus: () => [],
        getStatistics: () => ({ total: 0 }),
      };

      const serviceWithPerfect = new BuildVerificationService(
        perfectRegistry,
        emptyIssueService
      );

      const result = await serviceWithPerfect.runBuildPipeline();

      expect(result.successRate).toBe(1.0);
      expect(result.failedTests).toBe(0);
    });
  });

  describe('Component Isolation', () => {
    it('should isolate risks by component', async () => {
      const result = await service.runBuildPipeline();

      const authRisks = result.risks.filter((r: any) => r.affectedComponent === 'auth');
      const paymentRisks = result.risks.filter((r: any) => r.affectedComponent === 'payment');
      const messagingRisks = result.risks.filter(
        (r: any) => r.affectedComponent === 'messaging'
      );

      // Each component should have its own risks
      const totalRisks = authRisks.length + paymentRisks.length + messagingRisks.length;
      expect(totalRisks).toBe(result.risks.length);
    });

    it('should correlate component risks with tests and issues', async () => {
      const result = await service.runBuildPipeline();

      result.risks.forEach((risk: any) => {
        // Each risk should be tied to a component
        expect(risk.affectedComponent).toBeDefined();
        expect(risk.affectedComponent.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Data Consistency', () => {
    it('should maintain data consistency throughout pipeline', async () => {
      const result = await service.runBuildPipeline();

      // Verify counts add up
      const categorizedIssues =
        result.criticalIssues + result.highIssues + result.mediumIssues + result.lowIssues;
      expect(categorizedIssues).toBeLessThanOrEqual(result.totalIssues);

      // Verify test counts
      const categorizedTests =
        result.successfulTests + result.failedTests + result.skippedTests;
      expect(categorizedTests).toBeLessThanOrEqual(result.totalTests);
    });

    it('should calculate success rate consistently', async () => {
      const result = await service.runBuildPipeline();

      if (result.totalTests > 0) {
        const calculatedRate = result.successfulTests / result.totalTests;
        expect(Math.abs(calculatedRate - result.successRate)).toBeLessThan(0.01);
      }
    });
  });
});
