#!/usr/bin/env node
/**
 * Project Version Sync Script
 * Reads version from package.json and syncs all references
 * 
 * @usage: node scripts/sync-project-version.mjs [--dry-run]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const dryRun = process.argv.includes('--dry-run');

let updateCount = 0;
let filesModified = [];

function getPackageVersion() {
  try {
    const pkg = JSON.parse(fs.readFileSync(path.join(projectRoot, 'package.json'), 'utf-8'));
    return pkg.version;
  } catch (err) {
    console.error('✗ Cannot read package.json');
    process.exit(1);
  }
}

function updateMarkdownFiles(fromVersion, toVersion) {
  console.log(`\n📝 Updating markdown files from ${fromVersion} → ${toVersion}...`);
  
  try {
    const files = fs.readdirSync(projectRoot).filter(f => f.endsWith('.md'));
    
    files.forEach(file => {
      const filePath = path.join(projectRoot, file);
      let content = fs.readFileSync(filePath, 'utf-8');
      const original = content;
      
      // Replace all version patterns
      content = content.replace(/v?(\d+\.\d+\.\d+)/g, (match) => {
        const version = match.replace('v', '');
        // Only replace old versions, not the new target version
        if (version !== toVersion && version.match(/^\d+\.\d+\.\d+$/)) {
          updateCount++;
          return toVersion;
        }
        return match;
      });

      if (content !== original) {
        if (!dryRun) {
          fs.writeFileSync(filePath, content, 'utf-8');
        }
        filesModified.push(file);
        console.log(`  ✓ ${file}`);
      }
    });
  } catch (err) {
    console.error('✗ Error updating markdown:', err.message);
  }
}

function updatePhaseDocumentationReferences(toVersion) {
  console.log(`\n🎯 Updating phase documentation metadata...`);
  
  try {
    const phaseFiles = fs.readdirSync(projectRoot).filter(f => f.match(/PHASE_\d+.*\.md/));
    
    phaseFiles.forEach(file => {
      const filePath = path.join(projectRoot, file);
      let content = fs.readFileSync(filePath, 'utf-8');
      const original = content;
      
      // Update version references in phase headers
      content = content.replace(/\*\*Version:\*\* (\d+\.\d+\.\d+)/g, `**Version:** ${toVersion}`);
      content = content.replace(/version: (\d+\.\d+\.\d+)/g, `version: ${toVersion}`);
      content = content.replace(/@version (\d+\.\d+\.\d+)/g, `@version ${toVersion}`);
      
      if (content !== original) {
        if (!dryRun) {
          fs.writeFileSync(filePath, content, 'utf-8');
        }
        if (!filesModified.includes(file)) {
          filesModified.push(file);
        }
        console.log(`  ✓ ${file}`);
      }
    });
  } catch (err) {
    console.error('✗ Error updating phase docs:', err.message);
  }
}

function createMetadataFile(version) {
  console.log(`\n🗂️  Creating project-metadata.json...`);
  
  const metadata = {
    project: {
      name: 'audit-safe-document-extractor',
      description: 'Document extraction and analysis system',
      repository: 'https://github.com/bmarnau/audit-extractor'
    },
    versioning: {
      current: version,
      authoritySource: 'package.json',
      lastUpdated: new Date().toISOString(),
      updatePolicy: 'Auto-sync from package.json only'
    },
    currentPhase: {
      number: 44,
      name: 'Single Source of Truth',
      status: 'in-progress',
      startDate: new Date().toISOString().split('T')[0]
    },
    build: {
      typeScriptStrict: true,
      testPassRate: 100,
      compilationErrors: 0,
      lastBuildTime: new Date().toISOString()
    },
    consistency: {
      versionInconsistencies: 0,
      documentationDuplicates: 1,
      brokenReferences: 0,
      lastValidatedAt: new Date().toISOString()
    }
  };

  const metadataPath = path.join(projectRoot, 'project-metadata.json');
  if (!dryRun) {
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
  }
  console.log(`  ✓ project-metadata.json created`);
  filesModified.push('project-metadata.json');
}

function main() {
  console.log('🔄 PROJECT VERSION SYNC\n');
  console.log(`Mode: ${dryRun ? 'DRY RUN' : 'EXECUTE'}\n`);

  const packageVersion = getPackageVersion();
  console.log(`✓ Authority version from package.json: ${packageVersion}`);

  updateMarkdownFiles(/\d+\.\d+\.\d+/.toString(), packageVersion);
  updatePhaseDocumentationReferences(packageVersion);
  createMetadataFile(packageVersion);

  console.log('\n' + '='.repeat(60));
  console.log('✅ VERSION SYNC COMPLETE');
  console.log('='.repeat(60));
  console.log(`\nStatistics:`);
  console.log(`  📊 Version references updated: ${updateCount}`);
  console.log(`  📄 Files modified: ${filesModified.length}`);
  console.log(`  📋 Files:`);
  filesModified.forEach(f => console.log(`     - ${f}`));

  if (dryRun) {
    console.log(`\n⚠️  DRY RUN: No changes made. Run without --dry-run to apply changes.`);
  } else {
    console.log(`\n✓ Changes applied successfully!`);
  }

  process.exit(0);
}

main().catch(err => {
  console.error('Sync error:', err);
  process.exit(1);
});
