#!/usr/bin/env node

/**
 * Validate Project Consistency
 * Checks that all project version and metadata are synchronized
 * Exit Code: 0 = PASS, 1 = FAIL (has errors)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const VALID_STATUSES = ['development', 'alpha', 'beta', 'release-candidate', 'released', 'deprecated'];

let errors = [];
let warnings = [];
let successes = [];

function error(msg) { 
  errors.push(`❌ ${msg}`); 
}

function warning(msg) { 
  warnings.push(`⚠️ ${msg}`); 
}

function success(msg) { 
  successes.push(`✅ ${msg}`); 
}

// Load JSON files
function loadJSON(filepath) {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch (e) {
    error(`Cannot read ${filepath}: ${e.message}`);
    return null;
  }
}

// VALIDATION STARTS HERE

// 1. Load root package.json (Authority)
console.log('🔍 Loading project metadata...\n');

const rootPkg = loadJSON(path.join(ROOT, 'package.json'));
if (!rootPkg) process.exit(1);

const rootVersion = rootPkg.version;
console.log(`📦 Authority Version from package.json: ${rootVersion}\n`);

// 2. Check frontend/package.json
const frontendPkg = loadJSON(path.join(ROOT, 'frontend', 'package.json'));
if (frontendPkg?.version !== rootVersion) {
  error(`frontend/package.json version (${frontendPkg?.version}) ≠ root version (${rootVersion})`);
} else {
  success(`frontend/package.json version: ${rootVersion}`);
}

// 3. Check frontend/src/version.ts
const versionFile = path.join(ROOT, 'frontend', 'src', 'version.ts');
const versionContent = fs.readFileSync(versionFile, 'utf-8');
const versionMatch = versionContent.match(/FRONTEND_VERSION\s*=\s*['"]([^'"]+)['"]/);
const tsVersion = versionMatch?.[1];
if (tsVersion !== rootVersion) {
  error(`frontend/src/version.ts (${tsVersion}) ≠ root version (${rootVersion})`);
} else {
  success(`frontend/src/version.ts version: ${rootVersion}`);
}

// 4. Check frontend/.env.production
const envFile = path.join(ROOT, 'frontend', '.env.production');
const envContent = fs.readFileSync(envFile, 'utf-8');
const envMatch = envContent.match(/VITE_APP_VERSION=([^\n]+)/);
const envVersion = envMatch?.[1];
if (envVersion !== rootVersion) {
  error(`frontend/.env.production VITE_APP_VERSION (${envVersion}) ≠ root version (${rootVersion})`);
} else {
  success(`frontend/.env.production version: ${rootVersion}`);
}

// 5. Check docker-compose.yml
const dockerCompose = fs.readFileSync(path.join(ROOT, 'docker-compose.yml'), 'utf-8');
const dockerMatch = dockerCompose.match(/FRONTEND_VERSION:\s*([^\n]+)/);
const dockerVersion = dockerMatch?.[1];
if (dockerVersion !== rootVersion) {
  error(`docker-compose.yml FRONTEND_VERSION (${dockerVersion}) ≠ root version (${rootVersion})`);
} else {
  success(`docker-compose.yml version: ${rootVersion}`);
}

// 6. Check project-metadata.json
const metadata = loadJSON(path.join(ROOT, 'project-metadata.json'));
if (metadata?.version !== rootVersion) {
  error(`project-metadata.json version (${metadata?.version}) ≠ root version (${rootVersion})`);
} else {
  success(`project-metadata.json version: ${rootVersion}`);
}

// 7. Check README.md version
const readmeContent = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf-8');
const readmeMatch = readmeContent.match(/\*\*Version\*?\s*[:\|]\s*([0-9.]+)/);
const readmeVersion = readmeMatch?.[1];
if (readmeVersion && readmeVersion !== rootVersion) {
  warning(`README.md version (${readmeVersion}) ≠ root version (${rootVersion})`);
}

// 8. Check CHANGELOG.md (latest entry)
const changelogContent = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf-8');
const changelogMatch = changelogContent.match(/##\s*\[?v?([0-9.]+)\]?/);
const changelogVersion = changelogMatch?.[1];
if (changelogVersion && changelogVersion !== rootVersion) {
  warning(`CHANGELOG.md latest entry (${changelogVersion}) ≠ root version (${rootVersion})`);
}

// 9. Check project-metadata.json releaseStatus
if (metadata) {
  if (!VALID_STATUSES.includes(metadata.releaseStatus)) {
    error(`project-metadata.json releaseStatus "${metadata.releaseStatus}" not in: ${VALID_STATUSES.join(', ')}`);
  } else {
    success(`releaseStatus is valid: ${metadata.releaseStatus}`);
  }
}

// 10. Check Operations Manual exists
if (metadata?.documentation?.currentOperationsManual) {
  const manualFile = metadata.documentation.currentOperationsManual;
  if (!fs.existsSync(path.join(ROOT, manualFile))) {
    error(`Operations Manual not found: ${manualFile}`);
  } else {
    success(`Operations Manual exists: ${manualFile}`);
  }
}

// 11. Check Release Notes exist
if (metadata?.documentation?.releaseNotesFile) {
  const releaseNotesFile = metadata.documentation.releaseNotesFile;
  if (!fs.existsSync(path.join(ROOT, releaseNotesFile))) {
    warning(`Release Notes not found: ${releaseNotesFile}`);
  } else {
    success(`Release Notes exists: ${releaseNotesFile}`);
  }
}

// SUMMARY OUTPUT

console.log('\n═══════════════════════════════════════════════════════════');
console.log('             PROJECT CONSISTENCY VALIDATION');
console.log('═══════════════════════════════════════════════════════════\n');

console.log(`📦 Authority: package.json v${rootVersion}\n`);

if (successes.length > 0) {
  console.log('✅ SUCCESSES:');
  successes.forEach(s => console.log(`   ${s}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️ WARNINGS:');
  warnings.forEach(w => console.log(`   ${w}`));
}

if (errors.length > 0) {
  console.log('\n❌ ERRORS:');
  errors.forEach(e => console.log(`   ${e}`));
}

console.log('\n═══════════════════════════════════════════════════════════');

const totalChecks = successes.length + warnings.length + errors.length;
const status = errors.length === 0 ? '✅ PASS' : '❌ FAIL';
console.log(`RESULT: ${status}`);
console.log(`Checked: ${totalChecks} items | Successes: ${successes.length} | Warnings: ${warnings.length} | Errors: ${errors.length}`);

console.log('═══════════════════════════════════════════════════════════\n');

process.exit(errors.length > 0 ? 1 : 0);
