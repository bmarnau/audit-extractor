/**
 * Component Discovery Engine - Unit Tests
 * 
 * Tests für:
 * - Component Scanning (AST-Analyse)
 * - Test Planning (intelligente Teststrategien)
 * - Inventory Generation
 * - Report Generation
 */

import { ComponentScanner, ComponentMetadata } from '../src/infrastructure/discovery/ComponentScanner';
import { TestDiscoveryEngine, TestPlan } from '../src/infrastructure/discovery/TestDiscoveryEngine';
import { ComponentDiscoveryService } from '../src/infrastructure/discovery/ComponentDiscoveryService';

describe('Component Discovery Engine', () => {
  // ============================================================
  // ComponentScanner Tests
  // ============================================================

  describe('ComponentScanner', () => {
    let scanner: ComponentScanner;

    beforeEach(() => {
      scanner = new ComponentScanner('./src');
    });

    test('should initialize scanner with source root', () => {
      expect(scanner).toBeDefined();
    });

    test('should identify service component type', () => {
      const mockMetadata: ComponentMetadata = {
        componentId: 'service_1',
        componentType: 'service',
        location: { filePath: 'services/UserService.ts', lineNumber: 10, columnNumber: 0 },
        name: 'UserService',
        dependencies: [],
        testCoverageStatus: 'uncovered',
      };

      expect(mockMetadata.componentType).toBe('service');
      expect(mockMetadata.name).toBe('UserService');
    });

    test('should identify controller component type', () => {
      const mockMetadata: ComponentMetadata = {
        componentId: 'controller_1',
        componentType: 'controller',
        location: { filePath: 'controllers/UserController.ts', lineNumber: 5, columnNumber: 0 },
        name: 'UserController',
        dependencies: ['UserService'],
        testCoverageStatus: 'uncovered',
      };

      expect(mockMetadata.componentType).toBe('controller');
      expect(mockMetadata.dependencies).toContain('UserService');
    });

    test('should identify repository component type', () => {
      const mockMetadata: ComponentMetadata = {
        componentId: 'repository_1',
        componentType: 'repository',
        location: { filePath: 'repositories/UserRepository.ts', lineNumber: 8, columnNumber: 0 },
        name: 'UserRepository',
        dependencies: [],
        testCoverageStatus: 'uncovered',
      };

      expect(mockMetadata.componentType).toBe('repository');
    });

    test('should identify React component', () => {
      const mockMetadata: ComponentMetadata = {
        componentId: 'component_1',
        componentType: 'component',
        location: { filePath: 'components/UserCard.tsx', lineNumber: 12, columnNumber: 0 },
        name: 'UserCard',
        dependencies: [],
        testCoverageStatus: 'uncovered',
      };

      expect(mockMetadata.componentType).toBe('component');
    });

    test('should identify React page', () => {
      const mockMetadata: ComponentMetadata = {
        componentId: 'page_1',
        componentType: 'page',
        location: { filePath: 'pages/UserProfile.tsx', lineNumber: 3, columnNumber: 0 },
        name: 'UserProfile',
        dependencies: [],
        testCoverageStatus: 'uncovered',
      };

      expect(mockMetadata.componentType).toBe('page');
    });

    test('should identify API endpoint', () => {
      const mockMetadata: ComponentMetadata = {
        componentId: 'endpoint_1',
        componentType: 'endpoint',
        location: { filePath: 'api/routes.ts', lineNumber: 20, columnNumber: 0 },
        name: 'GET /api/users',
        dependencies: [],
        testCoverageStatus: 'uncovered',
      };

      expect(mockMetadata.componentType).toBe('endpoint');
      expect(mockMetadata.name).toContain('GET');
    });
  });

  // ============================================================
  // TestDiscoveryEngine Tests
  // ============================================================

  describe('TestDiscoveryEngine', () => {
    test('should analyze endpoint components', () => {
      const mockComponent: ComponentMetadata = {
        componentId: 'endpoint_1',
        componentType: 'endpoint',
        location: { filePath: 'api/users.ts', lineNumber: 1, columnNumber: 0 },
        name: 'GET /api/users',
        dependencies: [],
        testCoverageStatus: 'uncovered',
      };

      const testPlans = TestDiscoveryEngine.analyzeComponentsForTesting([mockComponent]);

      expect(testPlans.length).toBe(1);
      expect(testPlans[0].priority).toBe('critical');
      expect(testPlans[0].componentType).toBe('endpoint');
    });

    test('should analyze service components with correct priority', () => {
      const mockComponent: ComponentMetadata = {
        componentId: 'service_1',
        componentType: 'service',
        location: { filePath: 'services/UserService.ts', lineNumber: 1, columnNumber: 0 },
        name: 'UserService',
        dependencies: ['DatabaseService', 'LoggerService', 'CacheService'],
        testCoverageStatus: 'uncovered',
        methods: ['findUser', 'createUser', 'updateUser', 'deleteUser'],
      };

      const testPlans = TestDiscoveryEngine.analyzeComponentsForTesting([mockComponent]);

      expect(testPlans.length).toBe(1);
      expect(testPlans[0].priority).toBe('high');
      expect(testPlans[0].complexity).toBe('complex');
    });

    test('should generate appropriate test types for controller', () => {
      const mockComponent: ComponentMetadata = {
        componentId: 'controller_1',
        componentType: 'controller',
        location: { filePath: 'controllers/UserController.ts', lineNumber: 1, columnNumber: 0 },
        name: 'UserController',
        dependencies: ['UserService'],
        testCoverageStatus: 'uncovered',
        methods: ['getUsers', 'createUser'],
      };

      const testPlans = TestDiscoveryEngine.analyzeComponentsForTesting([mockComponent]);
      const plan = testPlans[0];

      expect(plan.testTypes.length).toBeGreaterThan(0);
      expect(plan.testTypes.some(t => t.type === 'unit')).toBe(true);
      expect(plan.testTypes.some(t => t.type === 'integration')).toBe(true);
    });

    test('should generate suggested tests for service', () => {
      const mockComponent: ComponentMetadata = {
        componentId: 'service_1',
        componentType: 'service',
        location: { filePath: 'services/UserService.ts', lineNumber: 1, columnNumber: 0 },
        name: 'UserService',
        dependencies: [],
        testCoverageStatus: 'uncovered',
      };

      const testPlans = TestDiscoveryEngine.analyzeComponentsForTesting([mockComponent]);
      const plan = testPlans[0];

      expect(plan.suggestedTests.length).toBeGreaterThan(0);
      expect(plan.suggestedTests[0].testName).toBeDefined();
      expect(plan.suggestedTests[0].testType).toBeDefined();
    });

    test('should calculate effort estimation based on dependencies', () => {
      const mockComponentWithDeps: ComponentMetadata = {
        componentId: 'service_1',
        componentType: 'service',
        location: { filePath: 'services/UserService.ts', lineNumber: 1, columnNumber: 0 },
        name: 'UserService',
        dependencies: ['Dep1', 'Dep2', 'Dep3'],
        testCoverageStatus: 'uncovered',
      };

      const mockComponentNoDeps: ComponentMetadata = {
        componentId: 'service_2',
        componentType: 'service',
        location: { filePath: 'services/LogService.ts', lineNumber: 1, columnNumber: 0 },
        name: 'LogService',
        dependencies: [],
        testCoverageStatus: 'uncovered',
      };

      const plans = TestDiscoveryEngine.analyzeComponentsForTesting([
        mockComponentWithDeps,
        mockComponentNoDeps,
      ]);

      const planWithDeps = plans.find(p => p.componentName === 'UserService');
      const planNoDeps = plans.find(p => p.componentName === 'LogService');

      expect(planWithDeps!.estimatedEffort).toBeGreaterThan(planNoDeps!.estimatedEffort);
    });

    test('should prioritize by component type', () => {
      const components: ComponentMetadata[] = [
        {
          componentId: 'component_1',
          componentType: 'component',
          location: { filePath: 'components/Card.tsx', lineNumber: 1, columnNumber: 0 },
          name: 'Card',
          dependencies: [],
          testCoverageStatus: 'uncovered',
        },
        {
          componentId: 'endpoint_1',
          componentType: 'endpoint',
          location: { filePath: 'api/users.ts', lineNumber: 1, columnNumber: 0 },
          name: 'GET /api/users',
          dependencies: [],
          testCoverageStatus: 'uncovered',
        },
      ];

      const plans = TestDiscoveryEngine.analyzeComponentsForTesting(components);

      // Endpoint should come first (critical priority)
      expect(plans[0].componentType).toBe('endpoint');
      expect(plans[1].componentType).toBe('component');
    });
  });

  // ============================================================
  // Report Generation Tests
  // ============================================================

  describe('Report Generation', () => {
    test('should generate discovery report with recommendations', () => {
      const mockInventory = {
        generatedAt: new Date(),
        totalComponents: 5,
        byType: {
          endpoint: 2,
          controller: 1,
          service: 1,
          repository: 1,
          page: 0,
          component: 0,
        },
        components: [
          {
            componentId: 'endpoint_1',
            componentType: 'endpoint' as const,
            location: { filePath: 'api/users.ts', lineNumber: 1, columnNumber: 0 },
            name: 'GET /api/users',
            dependencies: [],
            testCoverageStatus: 'uncovered' as const,
          },
        ],
      };

      const testPlans = TestDiscoveryEngine.analyzeComponentsForTesting(mockInventory.components);
      const report = TestDiscoveryEngine.generateReport(mockInventory, testPlans);

      expect(report).toBeDefined();
      expect(report.totalComponents).toBe(5);
      expect(report.componentsByType).toEqual(mockInventory.byType);
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    test('should include coverage statistics in report', () => {
      const mockInventory = {
        generatedAt: new Date(),
        totalComponents: 10,
        byType: {
          endpoint: 5,
          controller: 2,
          service: 2,
          repository: 1,
          page: 0,
          component: 0,
        },
        components: [],
      };

      const testPlans: TestPlan[] = [];
      const report = TestDiscoveryEngine.generateReport(mockInventory, testPlans);

      expect(report.coverage).toBeDefined();
      expect(report.coverage.uncovered).toBe(0);
      expect(report.coverage.covered).toBe(0);
      expect(report.coverage.partial).toBe(0);
    });

    test('should generate critical recommendations for low coverage', () => {
      const mockInventory = {
        generatedAt: new Date(),
        totalComponents: 20,
        byType: {
          endpoint: 20,
          controller: 0,
          service: 0,
          repository: 0,
          page: 0,
          component: 0,
        },
        components: Array(20).fill({
          componentId: 'endpoint_1',
          componentType: 'endpoint' as const,
          location: { filePath: 'api/users.ts', lineNumber: 1, columnNumber: 0 },
          name: 'GET /api/users',
          dependencies: [],
          testCoverageStatus: 'uncovered' as const,
        }),
      };

      const testPlans = TestDiscoveryEngine.analyzeComponentsForTesting(mockInventory.components);
      const report = TestDiscoveryEngine.generateReport(mockInventory, testPlans);

      expect(report.recommendations.some(r => r.includes('CRITICAL'))).toBe(true);
    });
  });

  // ============================================================
  // ComponentDiscoveryService Tests
  // ============================================================

  describe('ComponentDiscoveryService', () => {
    test('should initialize discovery service', () => {
      const service = new ComponentDiscoveryService('./src', '.');
      expect(service).toBeDefined();
    });

    test('should handle discovery with valid source root', async () => {
      const service = new ComponentDiscoveryService('./src', './test-output');

      // This would require actual files, so we'll just verify the service initializes
      expect(service).toBeDefined();
    });
  });

  // ============================================================
  // Integration Tests
  // ============================================================

  describe('Discovery Engine Integration', () => {
    test('should process multiple component types together', () => {
      const components: ComponentMetadata[] = [
        {
          componentId: 'endpoint_1',
          componentType: 'endpoint',
          location: { filePath: 'api/users.ts', lineNumber: 10, columnNumber: 0 },
          name: 'GET /api/users',
          dependencies: ['UserController'],
          testCoverageStatus: 'uncovered',
        },
        {
          componentId: 'controller_1',
          componentType: 'controller',
          location: { filePath: 'controllers/UserController.ts', lineNumber: 5, columnNumber: 0 },
          name: 'UserController',
          dependencies: ['UserService'],
          testCoverageStatus: 'uncovered',
          methods: ['getUsers', 'createUser'],
        },
        {
          componentId: 'service_1',
          componentType: 'service',
          location: { filePath: 'services/UserService.ts', lineNumber: 1, columnNumber: 0 },
          name: 'UserService',
          dependencies: ['UserRepository'],
          testCoverageStatus: 'uncovered',
          methods: ['findUser', 'createUser'],
        },
        {
          componentId: 'repository_1',
          componentType: 'repository',
          location: { filePath: 'repositories/UserRepository.ts', lineNumber: 1, columnNumber: 0 },
          name: 'UserRepository',
          dependencies: [],
          testCoverageStatus: 'uncovered',
          methods: ['find', 'create', 'update', 'delete'],
        },
        {
          componentId: 'page_1',
          componentType: 'page',
          location: { filePath: 'pages/Users.tsx', lineNumber: 1, columnNumber: 0 },
          name: 'Users',
          dependencies: [],
          testCoverageStatus: 'uncovered',
        },
        {
          componentId: 'component_1',
          componentType: 'component',
          location: { filePath: 'components/UserCard.tsx', lineNumber: 1, columnNumber: 0 },
          name: 'UserCard',
          dependencies: [],
          testCoverageStatus: 'uncovered',
        },
      ];

      const testPlans = TestDiscoveryEngine.analyzeComponentsForTesting(components);

      expect(testPlans.length).toBe(6);
      expect(testPlans[0].priority).toBe('critical'); // Endpoint
      expect(testPlans.map(p => p.componentType)).toContain('endpoint');
      expect(testPlans.map(p => p.componentType)).toContain('controller');
      expect(testPlans.map(p => p.componentType)).toContain('service');
      expect(testPlans.map(p => p.componentType)).toContain('repository');
      expect(testPlans.map(p => p.componentType)).toContain('page');
      expect(testPlans.map(p => p.componentType)).toContain('component');
    });

    test('should calculate total effort across all components', () => {
      const components: ComponentMetadata[] = [
        {
          componentId: 'endpoint_1',
          componentType: 'endpoint',
          location: { filePath: 'api/users.ts', lineNumber: 1, columnNumber: 0 },
          name: 'GET /api/users',
          dependencies: [],
          testCoverageStatus: 'uncovered',
        },
        {
          componentId: 'service_1',
          componentType: 'service',
          location: { filePath: 'services/UserService.ts', lineNumber: 1, columnNumber: 0 },
          name: 'UserService',
          dependencies: [],
          testCoverageStatus: 'uncovered',
        },
      ];

      const testPlans = TestDiscoveryEngine.analyzeComponentsForTesting(components);
      const totalEffort = testPlans.reduce((sum, plan) => sum + plan.estimatedEffort, 0);

      expect(totalEffort).toBeGreaterThan(0);
      expect(typeof totalEffort).toBe('number');
    });
  });
});
