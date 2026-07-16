#!/usr/bin/env node

/**
 * Auto-Update Navigation Tests Version (ESM)
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
 *   node scripts/sync-test-versions.mjs
 *   npm run sync:tests
 * 
 * @version 0.36.0
 * @phase 42
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ============================================================================
// CONFIGURATION
// ============================================================================

const PROJECT_ROOT = path.join(__dirname, '..');
const PACKAGE_JSON_PATH = path.join(PROJECT_ROOT, 'package.json');
const TEST_CONFIG_PATH = path.join(PROJECT_ROOT, 'tests', 'e2e', 'navigation-test.config.ts');
const NAVIGATION_TEST_PATH = path.join(PROJECT_ROOT, 'tests', 'e2e', 'navigation-comprehensive-test.test.ts');
const API_VERSION_TEST_PATH = path.join(PROJECT_ROOT, 'tests', 'e2e', 'navigation-api-version.test.ts');

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

function getAppVersion() {
  try {
    const packageJson = readJsonFile(PACKAGE_JSON_PATH);
    return packageJson.version;
  } catch (e) {
    console.error('❌ Could not determine app version from package.json');
    throw e;
  }
}

function updateTestConfigVersion(appVersion) {
  const testConfigContent = readTextFile(TEST_CONFIG_PATH);
  
  const buildDate = new Date().toISOString().split('T')[0];
  
  // Update APP_VERSION, TEST_VERSION, LAST_BUILD_DATE, and @version in header
  const updatedContent = testConfigContent
    .replace(
      /@version\s+[\d.]+/,
      `@version ${appVersion}`
    )
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
      `LAST_BUILD_DATE: '${buildDate}'`
    );
  
  writeTextFile(TEST_CONFIG_PATH, updatedContent);
  return true;
}

function updateNavigationTestVersion(appVersion) {
  const testContent = readTextFile(NAVIGATION_TEST_PATH);
  
  // Update test file header version and all references
  const updatedContent = testContent
    .replace(
      /@version\s+[\d.]+/,
      `@version ${appVersion}`
    )
    .replace(
      /COMPREHENSIVE NAVIGATION TEST SUITE v[\d.]+/g,
      `COMPREHENSIVE NAVIGATION TEST SUITE v${appVersion}`
    )
    .replace(
      /NAVIGATION TEST SUITE v[\d.]+/g,
      `NAVIGATION TEST SUITE v${appVersion}`
    )
    .replace(
      /Validiert für v[\d.]+/g,
      `Validiert für v${appVersion}`
    )
    .replace(
      /nach v[\d.]+/g,
      `nach v${appVersion}`
    )
    .replace(
      /NEW v[\d.]+/g,
      `NEW v${appVersion}`
    );
  
  writeTextFile(NAVIGATION_TEST_PATH, updatedContent);
  return true;
}

function updateApiVersionTest(appVersion) {
  const testContent = readTextFile(API_VERSION_TEST_PATH);
  
  // Update test file header version and all references
  const updatedContent = testContent
    .replace(
      /@version\s+[\d.]+/,
      `@version ${appVersion}`
    )
    .replace(
      /API VERIFICATION TEST SUITE v[\d.]+/g,
      `API VERIFICATION TEST SUITE v${appVersion}`
    )
    .replace(
      /TEST SUITE v[\d.]+/g,
      `TEST SUITE v${appVersion}`
    )
    .replace(
      /v[\d.]+\s+API/g,
      `v${appVersion} API`
    );
  
  writeTextFile(API_VERSION_TEST_PATH, updatedContent);
  return true;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

function main() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║        Navigation Tests Version Auto-Sync System               ║
║              (Phase 42 - Automation)                           ║
╚════════════════════════════════════════════════════════════════╝
  `);

  try {
    // Step 1: Get app version
    console.log('\n📋 Step 1: Reading application version...');
    const appVersion = getAppVersion();
    console.log(`   ✓ Application Version: ${appVersion}`);

    // Step 2: Update test config
    console.log('\n📋 Step 2: Updating master test configuration...');
    updateTestConfigVersion(appVersion);

    // Step 3: Update navigation test
    console.log('\n📋 Step 3: Updating navigation test file...');
    updateNavigationTestVersion(appVersion);

    // Step 4: Update API test
    console.log('\n📋 Step 4: Updating API test file...');
    updateApiVersionTest(appVersion);

    // Step 5: Summary
    console.log(`
╔════════════════════════════════════════════════════════════════╗
║                   ✅ SYNC COMPLETE                            ║
╚════════════════════════════════════════════════════════════════╝

✅ All tests synchronized to version ${appVersion}
✅ Build date updated to ${new Date().toISOString().split('T')[0]}
✅ Ready for test execution

Next: npm run test:nav:verify
    `);

  } catch (error) {
    console.error(`\n❌ Synchronization failed: ${error.message}`);
    process.exit(1);
  }
}

main();
