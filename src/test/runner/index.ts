/**
 * Test Runner Module Exports - Phase 38C
 * 
 * Zentrale Exports für alle Runner Komponenten.
 */

export { TechnicalTestRunner } from './TechnicalTestRunner.js';

// Convenience Export
export async function runTechnicalTests(mode: 'FULL' | 'CRITICAL' | 'SMOKE' = 'FULL') {
  const { TechnicalTestRunner } = await import('./TechnicalTestRunner.js');
  const runner = new TechnicalTestRunner({
    executionMode: mode,
    parallel: true,
    maxConcurrent: 4
  });
  return runner.execute();
}
