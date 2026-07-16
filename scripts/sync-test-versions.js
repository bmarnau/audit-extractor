#!/usr/bin/env node

/**
 * Auto-Update Navigation Tests Version
 * =========================================================
 * 
 * This script automatically synchronizes the navigation test versions
 * with the application version from package.json
 * 
 * Run this script whenever:
 * 1. package.json version is updated
 * 2. A new feature is added to navigation
 * 3. Before deploying a new version
 * 
 * Usage:
 *   node scripts/sync-test-versions.js
 *   npm run sync-tests
 * 
 * @version 0.35.0
 * @phase 41
 */

const fs = require('fs');
const path = require('path');

// ============================================================================
// CONFIGURATION
// ============================================================================

const PROJECT_ROOT = path.join(__dirname, '..');
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');
const TEST_CONFIG_PATH = path.join(PROJECT_ROOT, 'tests', 'e2e', 'navigation-test.config.ts');
const NAVIGATION_TEST_PATH = path.join(PROJECT_ROOT, 'tests', 'e2e', 'navigation-comprehensive-test.test.ts');

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function readJsonFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(content);
  } catch (e) {
    console.error(`❌ Failed to read ${filePath}`);
    throw e;
  }
}

function readTextFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (e) {
    console.error(`❌ Failed to read ${filePath}`);
    throw e;
  }
}

function writeTextFile(filePath, content) {
  try {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Updated: ${path.relative(PROJECT_ROOT, filePath)}`);
  } catch (e) {
    console.error(`❌ Failed to write ${filePath}`);
    throw e;
  }
}

function updateTestConfigVersion(appVersion) {
  const testConfigContent = readTextFile(TEST_CONFIG_PATH);
  
  // Update APP_VERSION
  const updatedContent = testConfigContent
    .replace(
      /APP_VERSION:\s*['"][\d.]+['"]/,
      `APP_VERSION: '${appVersion}'`
    )
    .replace(
      /TEST_VERSION:\s*['"][\d.]+['"]/,
      `TEST_VERSION: '${appVersion}'`
    )
    .replace(
      /LAST_BUILD_DATE:\s*['"][\d-]+['"]/,
      `LAST_BUILD_DATE: '${new Date().toISOString().split('T')[0]}'`
    );
  
  writeTextFile(TEST_CONFIG_PATH, updatedContent);
  return true;
}

function updateNavigationTestVersion(appVersion) {
  const testContent = readTextFile(NAVIGATION_TEST_PATH);
  
  // Update test file header version
  const updatedContent = testContent
    .replace(
      /@version\s+[\d.]+/,
      `@version ${appVersion}`
    )
    .replace(
      /NAVIGATION TEST SUITE v[\d.]+/,
      `NAVIGATION TEST SUITE v${appVersion}`
    );
  
  writeTextFile(NAVIGATION_TEST_PATH, updatedContent);
  return true;
}

function getAppVersion() {
  try {
    const packageJson = readJsonFile(PACKAGE_JSON_PATH);
    return packageJson.version;
  } catch (e) {
    console.error('❌ Could not determine app version from package.json');
    throw e;
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║        Navigation Tests Version Auto-Sync System               ║
║              (Phase 41 - Automation)                           ║
╚════════════════════════════════════════════════════════════════╝
  `);

  try {
    // Step 1: Get app version
    console.log('\n📋 Step 1: Reading application version...');
    const appVersion = getAppVersion();
    console.log(`   ✓ Application Version: ${appVersion}`);

    // Step 2: Update test config
    console.log('\n📋 Step 2: Updating test configuration...');
    updateTestConfigVersion(appVersion);

    // Step 3: Update test files
    console.log('\n📋 Step 3: Updating test files...');
    updateNavigationTestVersion(appVersion);

    // Step 4: Verify updates
    console.log('\n📋 Step 4: Verifying updates...');
    const updatedConfig = readTextFile(TEST_CONFIG_PATH);
    if (updatedConfig.includes(`APP_VERSION: '${appVersion}'`)) {
      console.log(`   ✅ Test configuration synchronized to v${appVersion}`);
    }

    // Summary
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                    SYNC COMPLETED ✅                           ║
╠════════════════════════════════════════════════════════════════╣
║                                                                ║
║  Updated Files:                                               ║
║  ✅ tests/e2e/navigation-test.config.ts                       ║
║  ✅ tests/e2e/navigation-comprehensive-test.test.ts           ║
║                                                                ║
║  New Version: ${appVersion}                                      ║
║  Timestamp: ${new Date().toISOString()}                 ║
║                                                                ║
║  Next Steps:                                                  ║
║  1. Run tests: npm run test:nav                               ║
║  2. Commit changes: git commit -m "chore: sync tests v${appVersion}"║
║  3. Deploy: npm run build && docker-compose up               ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    `);

  } catch (error) {
    console.error(`\n❌ Sync failed: ${error.message}`);
    process.exit(1);
  }
}

// Run
main();
