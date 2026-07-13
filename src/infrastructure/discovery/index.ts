/**
 * Discovery Module Exports
 * 
 * Public API for component discovery and test planning
 */

export { ComponentScanner, ComponentMetadata, ComponentInventory } from './ComponentScanner';
export { 
  TestDiscoveryEngine, 
  TestPlan, 
  TestType, 
  SuggestedTest,
  DiscoveryReport 
} from './TestDiscoveryEngine';
export { 
  ComponentDiscoveryService, 
  DiscoveryResult 
} from './ComponentDiscoveryService';

// Re-export for convenience
export * from './ComponentScanner';
export * from './TestDiscoveryEngine';
export * from './ComponentDiscoveryService';
