# PHASE 45: CONSISTENCY IMPLEMENTATION PLAN

**Date**: 2026-07-16  
**Status**: 🟡 IMPLEMENTATION READY  
**Authority**: package.json (0.37.1)  

---

## Umsetzungsstrategie

Basierend auf dem Audit (PROJECT_CONSISTENCY_AUDIT_PHASE45.md) werden die Probleme in **5 Work Streams** behoben.

---

## STREAM 1: Zentrale Projektmetadaten

### 1.1 Erstelle project-metadata.json

**Datei**: `project-metadata.json` (Root)

```json
{
  "productName": "Audit-Safe Document Extractor",
  "shortName": "audit-extractor",
  "description": "Revisionssicheres Dokument-Extraktionssystem mit API Discovery Framework, Governance Integration, Job-basierter Orchestrierung, fehlerresistenter Verarbeitung und vollständiger Docker-Containerisierung",
  
  "version": "0.37.1",
  "releaseStatus": "development",
  
  "developmentPhase": {
    "number": 45,
    "name": "Project Consistency - Single Source of Truth",
    "completedPhases": [
      { "number": 44, "name": "Critical Issue Analysis - Missing Input Validation" },
      { "number": 43, "name": "Navigation System Complete Fix & Docker Rebuild" },
      { "number": 42, "name": "Quality Assurance & Feature Completion" }
    ]
  },
  
  "build": {
    "date": null,
    "commit": null,
    "branch": "main",
    "timestamp": null
  },
  
  "documentation": {
    "currentOperationsManual": "OPERATIONS_MANUAL.md",
    "releaseNotesFile": "RELEASE_NOTES_0.37.1.md",
    "changelogFile": "CHANGELOG.md",
    "lastUpdated": "2026-07-16T00:00:00Z"
  },
  
  "repository": {
    "owner": "bmarnau",
    "name": "audit-extractor",
    "url": "https://github.com/bmarnau/audit-extractor"
  },
  
  "tech": {
    "nodeVersion": "^20.0.0",
    "reactVersion": "18.2.0",
    "typeScriptVersion": "5.3.3"
  }
}
```

### 1.2 Validierungsregeln für project-metadata.json

- `version` muss mit `package.json` exakt übereinstimmen
- `releaseStatus` muss einen definierten Wert haben (development, alpha, beta, rc, released, deprecated)
- `developmentPhase.number` darf nicht HIGHER sein als aktuelle Phase (wird validiert)
- `currentOperationsManual` muss auf existierende Datei verweisen
- `releaseNotesFile` muss auf existierende Datei verweisen

---

## STREAM 2: Zentrale Versionsquelle (package.json)

### 2.1 Authority bestätigen

✅ **Root `package.json`** bleibt die Authority:

```json
{
  "version": "0.37.1",  // ← Authority für alle anderen Dateien
  "description": "...",
  "scripts": { /* ... */ }
}
```

### 2.2 Abhängige Versionsquellen

Folgende Dateien müssen **automatisch synchron** bleiben:

| Datei | Feld | Sync-Methode |
|-------|------|-------------|
| frontend/package.json | version | Via sync-script |
| frontend/src/version.ts | FRONTEND_VERSION | Via sync-script |
| docker-compose.yml | FRONTEND_VERSION env | Via sed/PowerShell |
| project-metadata.json | version | Via sync-script |

### 2.3 Sync Mechanism

**NICHT npm version - zu disruptiv!**

Stattdessen: **Custom sync-script** der **LIEST** von Root und **SCHREIBT** zu Abhängigen.

---

## STREAM 3: Validierungsskripte

### 3.1 Neues Hauptskript: validate-project-consistency.mjs

**Datei**: `scripts/validate-project-consistency.mjs`

```javascript
#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const VALID_STATUSES = ['development', 'alpha', 'beta', 'release-candidate', 'released', 'deprecated'];

let errors = [];
let warnings = [];
let successes = [];

function error(msg) { errors.push(`❌ ${msg}`); }
function warning(msg) { warnings.push(`⚠️ ${msg}`); }
function success(msg) { successes.push(`✅ ${msg}`); }

// Load JSON files
function loadJSON(filepath) {
  try {
    return JSON.parse(fs.readFileSync(filepath, 'utf-8'));
  } catch (e) {
    error(`Cannot read ${filepath}: ${e.message}`);
    return null;
  }
}

// 1. Load root package.json (Authority)
const rootPkg = loadJSON(path.join(ROOT, 'package.json'));
if (!rootPkg) process.exit(1);
const rootVersion = rootPkg.version;

// 2. Check frontend/package.json
const frontendPkg = loadJSON(path.join(ROOT, 'frontend', 'package.json'));
if (frontendPkg?.version !== rootVersion) {
  error(`frontend/package.json version (${frontendPkg?.version}) ≠ root version (${rootVersion})`);
} else {
  success(`frontend/package.json sync: ${rootVersion}`);
}

// 3. Check frontend/src/version.ts
const versionFile = path.join(ROOT, 'frontend', 'src', 'version.ts');
const versionContent = fs.readFileSync(versionFile, 'utf-8');
const versionMatch = versionContent.match(/FRONTEND_VERSION\s*=\s*['"]([^'"]+)['"]/);
const tsVersion = versionMatch?.[1];
if (tsVersion !== rootVersion) {
  error(`frontend/src/version.ts (${tsVersion}) ≠ root version (${rootVersion})`);
} else {
  success(`frontend/src/version.ts sync: ${rootVersion}`);
}

// 4. Check docker-compose.yml
const dockerCompose = fs.readFileSync(path.join(ROOT, 'docker-compose.yml'), 'utf-8');
const dockerMatch = dockerCompose.match(/FRONTEND_VERSION:\s*([^\n]+)/);
const dockerVersion = dockerMatch?.[1];
if (dockerVersion !== rootVersion) {
  error(`docker-compose.yml FRONTEND_VERSION (${dockerVersion}) ≠ root version (${rootVersion})`);
} else {
  success(`docker-compose.yml sync: ${rootVersion}`);
}

// 5. Check project-metadata.json
const metadata = loadJSON(path.join(ROOT, 'project-metadata.json'));
if (metadata?.version !== rootVersion) {
  error(`project-metadata.json version (${metadata?.version}) ≠ root version (${rootVersion})`);
} else {
  success(`project-metadata.json sync: ${rootVersion}`);
}

// 6. Check README.md
const readmeContent = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf-8');
const readmeMatch = readmeContent.match(/Version\*?\s*[:\|]\s*([0-9.]+)/);
const readmeVersion = readmeMatch?.[1];
if (readmeVersion && readmeVersion !== rootVersion) {
  warning(`README.md version (${readmeVersion}) ≠ root version (${rootVersion})`);
}

// 7. Check CHANGELOG.md (latest entry)
const changelogContent = fs.readFileSync(path.join(ROOT, 'CHANGELOG.md'), 'utf-8');
const changelogMatch = changelogContent.match(/##\s*\[?v?([0-9.]+)\]?/);
const changelogVersion = changelogMatch?.[1];
if (changelogVersion && changelogVersion !== rootVersion) {
  warning(`CHANGELOG.md latest entry (${changelogVersion}) ≠ root version (${rootVersion})`);
}

// 8. Check project-metadata.json release status
if (metadata) {
  if (!VALID_STATUSES.includes(metadata.releaseStatus)) {
    error(`project-metadata.json releaseStatus "${metadata.releaseStatus}" not in: ${VALID_STATUSES.join(', ')}`);
  } else {
    success(`releaseStatus is valid: ${metadata.releaseStatus}`);
  }
}

// 9. Check Operations Manual exists
const manualFile = metadata?.documentation?.currentOperationsManual;
if (manualFile && !fs.existsSync(path.join(ROOT, manualFile))) {
  error(`Operations Manual not found: ${manualFile}`);
} else if (manualFile) {
  success(`Operations Manual exists: ${manualFile}`);
}

// 10. Check Release Notes exist
const releaseNotesFile = metadata?.documentation?.releaseNotesFile;
if (releaseNotesFile && !fs.existsSync(path.join(ROOT, releaseNotesFile))) {
  warning(`Release Notes not found: ${releaseNotesFile}`);
} else if (releaseNotesFile) {
  success(`Release Notes exists: ${releaseNotesFile}`);
}

// Summary
console.log('\n═══════════════════════════════════════════════════════════');
console.log('PROJECT CONSISTENCY CHECK');
console.log('═══════════════════════════════════════════════════════════\n');

console.log(`📦 Authority Version: ${rootVersion}\n`);

if (successes.length > 0) {
  console.log('SUCCESSES:');
  successes.forEach(s => console.log(`  ${s}`));
}

if (warnings.length > 0) {
  console.log('\nWARNINGS:');
  warnings.forEach(w => console.log(`  ${w}`));
}

if (errors.length > 0) {
  console.log('\nERRORS:');
  errors.forEach(e => console.log(`  ${e}`));
}

console.log('\n═══════════════════════════════════════════════════════════');
const status = errors.length === 0 ? '✅ PASS' : '❌ FAIL';
console.log(`RESULT: ${status}`);
console.log(`Checked: ${successes.length + warnings.length + errors.length} items`);
console.log('═══════════════════════════════════════════════════════════\n');

process.exit(errors.length > 0 ? 1 : 0);
```

### 3.2 Sync-Skript: sync-project-version.mjs

**Datei**: `scripts/sync-project-version.mjs`

```javascript
#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

// 1. Read authority version
const rootPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8'));
const version = rootPkg.version;

console.log(`📦 Syncing version: ${version}\n`);

let updated = 0;

// 2. Update frontend/package.json
const frontendPkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'frontend', 'package.json'), 'utf-8'));
frontendPkg.version = version;
fs.writeFileSync(path.join(ROOT, 'frontend', 'package.json'), JSON.stringify(frontendPkg, null, 2) + '\n');
console.log(`✅ Updated frontend/package.json`);
updated++;

// 3. Update frontend/src/version.ts
let versionContent = fs.readFileSync(path.join(ROOT, 'frontend', 'src', 'version.ts'), 'utf-8');
versionContent = versionContent.replace(
  /FRONTEND_VERSION\s*=\s*['"][^'"]+['"]/,
  `FRONTEND_VERSION = '${version}'`
);
fs.writeFileSync(path.join(ROOT, 'frontend', 'src', 'version.ts'), versionContent);
console.log(`✅ Updated frontend/src/version.ts`);
updated++;

// 4. Update project-metadata.json
const metadata = JSON.parse(fs.readFileSync(path.join(ROOT, 'project-metadata.json'), 'utf-8'));
metadata.version = version;
fs.writeFileSync(path.join(ROOT, 'project-metadata.json'), JSON.stringify(metadata, null, 2) + '\n');
console.log(`✅ Updated project-metadata.json`);
updated++;

// 5. Update docker-compose.yml
let docker = fs.readFileSync(path.join(ROOT, 'docker-compose.yml'), 'utf-8');
docker = docker.replace(
  /FRONTEND_VERSION:\s*[^\n]+/,
  `FRONTEND_VERSION: ${version}`
);
fs.writeFileSync(path.join(ROOT, 'docker-compose.yml'), docker);
console.log(`✅ Updated docker-compose.yml`);
updated++;

console.log(`\n✅ Synced ${updated} files to version ${version}`);
```

### 3.3 Update package.json Scripts

```json
{
  "scripts": {
    "consistency:check": "node scripts/validate-project-consistency.mjs",
    "consistency:sync": "node scripts/sync-project-version.mjs",
    "validate": "npm run consistency:check && npm run lint && npm run build"
  }
}
```

---

## STREAM 4: Dokumentation aktualisieren

### 4.1 Dateien mit version: 0.37.0 → 0.37.1

**26 Dateien müssen aktualisiert werden:**

Priority 1 (Benutzer-Facing):
- README.md
- OPERATIONS_MANUAL.md
- API_ENDPOINTS_COMPLETE_REFERENCE.md

Priority 2 (Build/Testing):
- CHANGELOG.md
- BUILD_PIPELINE_SYSTEM.md

Priority 3 (Phase Docs - historisch):
- PHASE_38C_COMPLETION_REPORT.md
- PHASE_40_RELEASE_NOTES_NAVIGATION_COMPLETE.md
- PHASE_41_COMPLETION.md
- PHASE_42_*.md (alle)
- etc.

### 4.2 Frontend .env.production - FIX

**Datei**: `frontend/.env.production`

```env
# BEFORE:
VITE_APP_VERSION=0.18.0  ← VERALTET!

# AFTER:
VITE_APP_VERSION=0.37.1  ← AKTUELL
```

### 4.3 Dokumentations-Index erstellen

**Neue Datei**: `docs/README.md`

```markdown
# Dokumentations-Index

## 📄 Aktuelle Dokumentation

### Operations & Bedienung
- **[OPERATIONS_MANUAL.md](../OPERATIONS_MANUAL.md)** - Haupthandbuch (v0.37.1)
- **[DOCKER_OPERATIONS_GUIDE.md](../DOCKER_OPERATIONS_GUIDE.md)** - Docker Betrieb

### API & Entwicklung
- **[API_ENDPOINTS_COMPLETE_REFERENCE.md](../API_ENDPOINTS_COMPLETE_REFERENCE.md)** - API Dokumentation
- **[API_DISCOVERY_QUICK_REFERENCE.md](../API_DISCOVERY_QUICK_REFERENCE.md)** - Quick Reference

### Release & Changelog
- **[CHANGELOG.md](../CHANGELOG.md)** - Änderungen pro Version
- **[RELEASE_NOTES_0.37.1.md](../RELEASE_NOTES_0.37.1.md)** - Release Notes (aktuell)

## 📚 Historische Dokumentation

Archivierte Manuals: `archive/manuals/`
Archivierte Release Notes: `archive/release-notes/`
Archivierte Phase-Dokumente: `_archive/`

## 🏛️ Architektur & Design

- [docs/architecture/](./architecture/)
- [docs/operations/](./operations/)
- [docs/testing/](./testing/)

```

---

## STREAM 5: Tests hinzufügen

### 5.1 Version Consistency Tests

**Neue Datei**: `tests/unit/version-consistency.test.ts`

```typescript
import fs from 'fs';
import path from 'path';

describe('Version Consistency', () => {
  const ROOT = path.join(__dirname, '../../');

  const rootPkg = JSON.parse(
    fs.readFileSync(path.join(ROOT, 'package.json'), 'utf-8')
  );
  const rootVersion = rootPkg.version;

  test('root package.json defines version', () => {
    expect(rootVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('frontend/package.json matches root', () => {
    const frontendPkg = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'frontend', 'package.json'), 'utf-8')
    );
    expect(frontendPkg.version).toBe(rootVersion);
  });

  test('frontend/src/version.ts matches root', () => {
    const versionFile = fs.readFileSync(
      path.join(ROOT, 'frontend', 'src', 'version.ts'),
      'utf-8'
    );
    const match = versionFile.match(/FRONTEND_VERSION\s*=\s*['"]([^'"]+)['"]/);
    expect(match?.[1]).toBe(rootVersion);
  });

  test('docker-compose.yml matches root', () => {
    const docker = fs.readFileSync(
      path.join(ROOT, 'docker-compose.yml'),
      'utf-8'
    );
    const match = docker.match(/FRONTEND_VERSION:\s*([^\n]+)/);
    expect(match?.[1]).toBe(rootVersion);
  });

  test('project-metadata.json matches root', () => {
    const metadata = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'project-metadata.json'), 'utf-8')
    );
    expect(metadata.version).toBe(rootVersion);
  });

  test('project-metadata.json has valid releaseStatus', () => {
    const metadata = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'project-metadata.json'), 'utf-8')
    );
    const valid = ['development', 'alpha', 'beta', 'release-candidate', 'released', 'deprecated'];
    expect(valid).toContain(metadata.releaseStatus);
  });

  test('Operations Manual file exists', () => {
    const metadata = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'project-metadata.json'), 'utf-8')
    );
    const manualFile = metadata.documentation.currentOperationsManual;
    expect(fs.existsSync(path.join(ROOT, manualFile))).toBe(true);
  });

  test('Release Notes file exists', () => {
    const metadata = JSON.parse(
      fs.readFileSync(path.join(ROOT, 'project-metadata.json'), 'utf-8')
    );
    const releaseFile = metadata.documentation.releaseNotesFile;
    expect(fs.existsSync(path.join(ROOT, releaseFile))).toBe(true);
  });
});
```

### 5.2 Update package.json test scripts

```json
{
  "scripts": {
    "test:consistency": "jest --testMatch='**/tests/unit/version-consistency.test.ts'",
    "test": "jest",
    "validate": "npm run consistency:check && npm run test:consistency && npm run build"
  }
}
```

---

## Implementierungs-Reihenfolge

### Phase 1: Grundlagen (30 min)

- [ ] `project-metadata.json` erstellen
- [ ] `scripts/validate-project-consistency.mjs` erstellen
- [ ] `scripts/sync-project-version.mjs` erstellen

### Phase 2: Skripte testen (20 min)

- [ ] `npm run consistency:check` → sollte errors zeigen
- [ ] `npm run consistency:sync` → synchronisiert Dateien
- [ ] `npm run consistency:check` → sollte pass sein

### Phase 3: Dokumentation (20 min)

- [ ] `frontend/.env.production` fix VITE_APP_VERSION
- [ ] `README.md` update version to 0.37.1
- [ ] `OPERATIONS_MANUAL.md` → 0.37.1
- [ ] `docs/README.md` neu erstellen

### Phase 4: Weitere Dokumentation (30 min)

- [ ] Übrige 23 Dateien version aktualisieren
- [ ] RELEASE_NOTES_0.37.1.md erstellen
- [ ] CHANGELOG.md prüfen und ggf. aktualisieren

### Phase 5: Tests (30 min)

- [ ] `tests/unit/version-consistency.test.ts` erstellen
- [ ] npm test ausführen
- [ ] `npm run consistency:check` ausführen
- [ ] `npm run build` ausführen

### Phase 6: Finalisierung (20 min)

- [ ] Alle 5 Work Streams auf Vollständigkeit prüfen
- [ ] Abschluss-Bericht erstellen
- [ ] Git commit mit allen Änderungen

---

## Total Effort

- Geschätzte Zeit: **2-3 Stunden**
- Automatisierbar: Ja (mit Skripten)
- Risiko: Niedrig (nur Dokumentations- und Metadaten-Änderungen)
- Breaking Changes: Nein

---

## Success Criteria (Acceptance)

✅ Alle Checks passen (npm run consistency:check)
✅ Alle Tests passen (npm test:consistency)
✅ package.json bleibt Authority
✅ Frontend zeigt korrekte Version an
✅ Docker-Compose hat aktuelle Version
✅ Dokumentation ist konsistent
✅ Keine doppelten "aktuellen" Manuals
✅ Build erfolgreich (npm run build)

