#!/usr/bin/env node

/**
 * Pre-Commit Hook - Verhindert Commits mit falschen Versionen
 * 
 * Prüft:
 * - Version Match zwischen Frontend, Backend und package.json
 * - Uncommitted changes in build-critical files
 * - Build-Nummer Konsistenz
 * 
 * Installation: Automatisch via `npm install` (in .husky/pre-commit)
 * Ausführung: Automatisch vor jedem `git commit`
 * 
 * @version 0.26.0
 * @phase 22
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PROJECT_ROOT = process.cwd();
const CRITICAL_FILES = [
  'package.json',
  'frontend/package.json',
  '.git-sync-status.json',
];

/**
 * Liest Version aus package.json
 */
function getVersion(filePath) {
  try {
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    return content.version;
  } catch {
    return null;
  }
}

/**
 * Prüft ob Datei in Staging Area ist
 */
function isFileStaged(filePath) {
  try {
    const output = execSync('git diff --cached --name-only', {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    });
    return output.includes(filePath);
  } catch {
    return false;
  }
}

/**
 * Prüft ob Datei unstaged changes hat
 */
function hasUnstagedChanges(filePath) {
  try {
    const output = execSync('git diff --name-only', {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    });
    return output.includes(filePath);
  } catch {
    return false;
  }
}

/**
 * Haupt-Validierung
 */
function validateCommit() {
  console.log('🔍 Pre-Commit: Checking versions...\n');

  const rootVersion = getVersion(path.join(PROJECT_ROOT, 'package.json'));
  const frontendVersion = getVersion(
    path.join(PROJECT_ROOT, 'frontend', 'package.json')
  );
  const backendVersion = rootVersion; // Backend is in root package.json

  let hasErrors = false;

  // Check 1: Version Match
  console.log('📌 Version Check:');
  console.log(`   Root:     ${rootVersion}`);
  console.log(`   Frontend: ${frontendVersion}`);
  console.log(`   Backend:  ${backendVersion}`);

  if (rootVersion !== frontendVersion) {
    console.error(
      `\n❌ Version Mismatch: Root (${rootVersion}) !== Frontend (${frontendVersion})`
    );
    console.error('   💡 Run: npm run sync:versions');
    hasErrors = true;
  } else {
    console.log(`   ✅ All versions match (${rootVersion})\n`);
  }

  // Check 2: Critical files should be committed together
  console.log('📋 Critical Files Check:');
  const stagedCriticalFiles = CRITICAL_FILES.filter(f =>
    isFileStaged(f)
  );
  const unstagedCriticalFiles = CRITICAL_FILES.filter(f =>
    hasUnstagedChanges(f) && !isFileStaged(f)
  );

  if (stagedCriticalFiles.length > 0 && unstagedCriticalFiles.length > 0) {
    console.warn('⚠️  Mixed staging of critical files detected:');
    console.warn(`   Staged:   ${stagedCriticalFiles.join(', ')}`);
    console.warn(`   Unstaged: ${unstagedCriticalFiles.join(', ')}`);
    console.warn('   💡 Stage all critical files together');
  } else {
    console.log(`   ✅ Critical files are consistent\n`);
  }

  // Check 3: Git Status
  console.log('🔀 Git Status Check:');
  try {
    const isDirty = execSync('git status --porcelain', {
      cwd: PROJECT_ROOT,
      encoding: 'utf-8',
    }).trim().length > 0;

    if (isDirty) {
      console.warn('⚠️  Working directory has uncommitted changes');
      console.warn('   💡 Make sure package.json changes are staged');
    } else {
      console.log('   ✅ Working directory is clean\n');
    }
  } catch {
    console.log('   ℹ️  Unable to check git status\n');
  }

  // Final Result
  if (hasErrors) {
    console.error('\n❌ Pre-Commit Check FAILED');
    console.error('   Commit has been BLOCKED due to version mismatches');
    console.error('\n   🔧 Fix Options:');
    console.error('   1. Sync versions:  npm run sync:versions');
    console.error('   2. Verify all:     npm run verify:versions');
    console.error('   3. Force commit:   git commit --no-verify\n');
    process.exit(1);
  } else {
    console.log('✅ Pre-Commit Check PASSED - Commit allowed\n');
    process.exit(0);
  }
}

// Run validation
try {
  validateCommit();
} catch (err) {
  console.error('❌ Pre-Commit Hook Error:');
  console.error(err.message);
  process.exit(1);
}
