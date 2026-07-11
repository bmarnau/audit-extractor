import 'reflect-metadata';
import { container } from 'tsyringe';
import { initializeServiceContainer } from '@infrastructure/di/ServiceContainer';
import { JobOrchestrator } from '@application/orchestration/JobOrchestrator';
import { join } from 'path';

/**
 * CLI Script: Execute Job Orchestration
 *
 * Usage: npm run job:execute JOB-ID
 *
 * Example: npm run job:execute JOB-0815
 *
 * This script:
 * 1. Loads job configuration
 * 2. Loads and validates schema
 * 3. Analyzes example files
 * 4. Validates sources
 * 5. Creates RuntimeJob
 * 6. Outputs execution-report.json
 */

async function main() {
  try {
    // ========================================================================
    // Parse arguments
    // ========================================================================
    const jobId = process.argv[2];
    const debugMode = process.argv.includes('--debug');

    if (!jobId) {
      console.error('Error: Job ID is required');
      console.error('Usage: npm run job:execute JOB-ID [--debug]');
      console.error('Example: npm run job:execute JOB-0815');
      console.error('Example with debug: npm run job:execute JOB-0815 --debug');
      process.exit(1);
    }

    console.log(`\n${'='.repeat(80)}`);
    console.log(`📋 Job Orchestration: ${jobId}`);
    console.log(`${'='.repeat(80)}\n`);

    if (debugMode) {
      console.log('🔧 [DEBUG] Debug mode enabled\n');
    }

    // ========================================================================
    // Initialize DI Container
    // ========================================================================
    console.log('🔧 Initializing services...');
    if (debugMode) {
      console.log('🔧 [DEBUG] Registering services...');
    }
    initializeServiceContainer();
    const orchestrator = container.resolve(JobOrchestrator);
    console.log('✓ Services initialized\n');

    // ========================================================================
    // Configure paths
    // ========================================================================
    const cwd = process.cwd();
    const jobsBasePath = join(cwd, 'data', 'jobs');
    const schemasBasePath = join(cwd, 'data-backups', '20260710_155130', 'schemas');
    const examplesBasePath = join(cwd, 'data', 'examples');
    const outputDir = join(cwd, 'output');
    const reportPath = join(outputDir, `${jobId}-execution-report.json`);

    console.log('📁 Paths:');
    console.log(`   Jobs:     ${jobsBasePath}`);
    console.log(`   Schemas:  ${schemasBasePath}`);
    console.log(`   Examples: ${examplesBasePath}`);
    console.log(`   Report:   ${reportPath}`);

    if (debugMode) {
      console.log('\n🔧 [DEBUG] Path configuration:');
      console.log(`   CWD: ${cwd}`);
      console.log(`   Output Dir: ${outputDir}`);
    }
    console.log('');

    // ========================================================================
    // Execute orchestration
    // ========================================================================
    console.log('⏳ Executing job orchestration...');
    if (debugMode) {
      console.log('🔧 [DEBUG] Starting 5-stage workflow\n');
    } else {
      console.log('');
    }
    const startTime = Date.now();

    const { runtimeJob, report } = await orchestrator.orchestrateJob(
      jobsBasePath,
      jobId,
      schemasBasePath,
      examplesBasePath,
      reportPath
    );

    const executionTime = Date.now() - startTime;

    // ========================================================================
    // Output results
    // ========================================================================
    console.log(`\n${'='.repeat(80)}`);
    console.log(`✅ Execution Complete`);
    console.log(`${'='.repeat(80)}\n`);

    console.log('📊 Summary:');
    console.log(`   Status:              ${report.status.toUpperCase()}`);
    console.log(`   Completion:          ${report.completionPercentage}%`);
    console.log(`   Execution Time:      ${executionTime}ms`);
    console.log(`   Duration (Report):   ${report.durationMs}ms\n`);

    console.log('✓ Results:');
    if (report.result.jobLoaded) console.log('   ✓ Job loaded');
    if (report.result.schemaLoaded) console.log('   ✓ Schema loaded');
    if (report.result.examplesAnalyzed) console.log('   ✓ Examples analyzed');
    if (report.result.sourcesValidated) console.log('   ✓ Sources validated');
    if (report.result.runtimeJobCreated) console.log('   ✓ RuntimeJob created');
    console.log('');

    console.log('📈 Statistics:');
    console.log(
      `   Validations: ${report.statistics.passedValidations}/${report.statistics.totalValidations} passed`
    );
    console.log(`   Errors:      ${report.errors.length}`);
    console.log(`   Warnings:    ${report.warnings.length}\n`);

    if (report.metadata) {
      console.log('📋 Metadata:');
      if (report.metadata.documentType)
        console.log(`   Document Type:    ${report.metadata.documentType}`);
      if (report.metadata.schemaName)
        console.log(`   Schema:           ${report.metadata.schemaName}`);
      if (report.metadata.schemaVersion)
        console.log(`   Schema Version:   ${report.metadata.schemaVersion}`);
      if (report.metadata.sourceCount)
        console.log(`   Sources:          ${report.metadata.sourceCount}`);
      if (report.metadata.exampleCount)
        console.log(`   Examples:         ${report.metadata.exampleCount}`);
      if (report.statistics.schemaFieldCount)
        console.log(
          `   Schema Fields:    ${report.statistics.schemaFieldCount} (${report.statistics.requiredFieldCount} required)`
        );
      console.log('');
    }

    console.log('🔍 Validations:');
    for (const validation of report.validations) {
      const icon = validation.status === 'passed' ? '✓' : '⚠';
      console.log(`   ${icon} ${validation.name}: ${validation.message}`);
    }
    console.log('');

    if (report.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      for (const warning of report.warnings) {
        console.log(`   [${warning.code}] ${warning.message}`);
        if (debugMode && warning.details) {
          console.log(`   [DEBUG] Details: ${JSON.stringify(warning.details)}`);
        }
      }
      console.log('');
    }

    if (report.errors.length > 0) {
      console.log('❌ Errors:');
      for (const error of report.errors) {
        console.log(`   [${error.code}] ${error.message}`);
        if (debugMode && error.details) {
          console.log(`   [DEBUG] Details: ${JSON.stringify(error.details)}`);
        }
      }
      console.log('');
    }

    console.log(`📄 Report: ${reportPath}\n`);

    if (runtimeJob) {
      console.log('🎯 RuntimeJob:');
      console.log(`   ID:       ${runtimeJob.jobId}`);
      console.log(`   Status:   ${runtimeJob.status}`);
      console.log(`   Type:     ${runtimeJob.documentType}`);
      console.log(`   Sources:  ${runtimeJob.sources.length}`);
      console.log(`   Schema:   ${runtimeJob.schema.schemaName}`);
      console.log('');
    }

    console.log(`${'='.repeat(80)}\n`);

    // Exit with appropriate code
    if (report.status === 'failure') {
      process.exit(1);
    }
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Fatal Error:');
    const error = err instanceof Error ? err : new Error(String(err));
    console.error(`Message: ${error.message}`);

    if (process.argv.includes('--debug')) {
      console.error('\n🔧 [DEBUG] Stack Trace:');
      console.error(error.stack);
      console.error('\n🔧 [DEBUG] Full Error:');
      console.error(JSON.stringify(err, null, 2));
    }

    process.exit(1);
  }
}

main();
