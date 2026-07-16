# Phase 44: Single Source of Truth
## Projektweite Konsistenz & Zentrale Metadaten

**Version:** 0.37.0 → 0.37.0 (Nach Phase 44)  
**Status:** Planning & Analysis Phase  
**Ziel:** Eliminiere Versionsinkonistenzen und etabliere zentrale Autorität

---

## 1. Phase 44 Objectives (Detailliert)

### 1.1 Konsistenzanalyse
**Deliverable:** `docs/PROJECT_CONSISTENCY_ANALYSIS.md`

Audit aller Dateien auf:
- **Versionsnummern** (0.37.0 vs 0.37.0 vs andere)
- **Phase-Referenzen** (Phase 42, 43, 44 etc.)
- **Status-Indikatoren** (COMPLETE, PENDING, IN_PROGRESS)
- **Dokumentations-Duplikate** (README, OPERATIONS_MANUAL, etc.)
- **Veraltete Verweise** (alte API-Dokumentation, Legacy-Pfade)

**Scan-Targets:**
- 50+ `.md` Dateien (Dokumentation)
- `package.json` (Authoritative Source)
- `PHASE_*.md` (42, 43, 44, etc.)
- `*.json` Dateien (config, manifest)
- Frontend/Backend `*.ts` (Version-Kommentare)

### 1.2 Zentrale Metadaten Struktur
**Deliverable:** `project-metadata.json`

```json
{
  "project": {
    "name": "audit-safe-document-extractor",
    "description": "Document extraction and analysis system",
    "repository": "https://github.com/bmarnau/audit-extractor"
  },
  "versioning": {
    "current": "0.37.0",
    "authoritySource": "package.json",
    "lastUpdated": "2026-07-16T11:30:00Z",
    "updatePolicy": "Auto-sync from package.json only"
  },
  "currentPhase": {
    "number": 44,
    "name": "Single Source of Truth",
    "status": "in-progress",
    "startDate": "2026-07-16"
  },
  "phaseHistory": {
    "42": { "status": "complete", "version": "0.37.0", "completedDate": "2026-07-15" },
    "43": { "status": "complete", "version": "0.37.0", "completedDate": "2026-07-16" },
    "44": { "status": "in-progress", "version": "0.37.0", "estimatedCompletion": "2026-07-17" }
  },
  "build": {
    "typeScriptStrict": true,
    "testPassRate": 100,
    "compilationErrors": 0,
    "lastBuildTime": "2026-07-16T11:30:00Z"
  },
  "consistency": {
    "versionInconsistencies": 0,
    "documentationDuplicates": 0,
    "brokenReferences": 0,
    "lastValidatedAt": "2026-07-16T11:30:00Z"
  }
}
```

### 1.3 Automatisierte Validierung
**Deliverable:** `scripts/validate-project-consistency.mjs`

```bash
# Exit Code 0 = Konsistent
# Exit Code 1 = Inkonsistenzen gefunden

npm run consistency:check
```

**Prüfungen:**
- Version in `package.json` vs alle Dokumentationen
- Phase-Nummern korrekt sequenziert
- Keine duplicate TODOs/CHANGELOG-Einträge
- Alle externen Links gültig (READMEs, Pfade)
- Tags/Badges aktuell

### 1.4 Automatisierte Synchronisation
**Deliverable:** `scripts/sync-project-version.mjs`

```bash
# Liest package.json, updatet überall
npm run version:sync

# Oder: Nur checken ohne zu ändern
npm run version:check
```

**Sync-Logik:**
1. Read version from `package.json`
2. Update `project-metadata.json`
3. Update all `PHASE_*.md` references
4. Update CHANGELOG.md entry
5. Update README.md version badge
6. Create git commit (auto)

### 1.5 Dokumentations-Konsolidierung
**Targets:**
- `README.md` - Merge QUICKSTART content, remove duplication
- `CHANGELOG.md` - Single source for all version history
- `OPERATIONS_MANUAL.md` - Consolidate v35, v36, current
- `PROJECT.md` - Link to project-metadata.json
- Archive old versions → Git history preserved

---

## 2. Implementation Roadmap

### Phase 44A: Analysis & Design (Step 1)
**Duration:** 1-2 hours
**Deliverables:**
- `docs/PROJECT_CONSISTENCY_ANALYSIS.md` (full audit report)
- List of all inconsistencies found
- Prioritized fix list

**Activities:**
1. Scan all `.md` files for version strings
2. Scan all `.json` files for metadata
3. Check `package.json` as source of truth
4. Document all discrepancies
5. Categorize by severity (Critical/High/Medium/Low)

### Phase 44B: Tool Implementation (Step 2)
**Duration:** 2-3 hours
**Deliverables:**
- `project-metadata.json` (created)
- `scripts/validate-project-consistency.mjs` (implemented)
- `scripts/sync-project-version.mjs` (implemented)
- npm scripts updated

**Activities:**
1. Create validation script (with comprehensive checks)
2. Create sync script (safe, idempotent)
3. Test both scripts end-to-end
4. Integrate into CI/CD pipeline

### Phase 44C: Documentation Consolidation (Step 3)
**Duration:** 1-2 hours
**Deliverables:**
- Consolidated README.md
- Consolidated CHANGELOG.md
- Updated OPERATIONS_MANUAL.md
- Archive directory marked with deprecation notes

**Activities:**
1. Merge duplicate sections
2. Mark historical versions with dates
3. Create single source for each topic
4. Update all cross-references

### Phase 44D: Validation & Fixes (Step 4)
**Duration:** 1-2 hours
**Deliverables:**
- All consistency checks passing
- Git history clean
- Tests still passing

**Activities:**
1. Run validation script
2. Fix all inconsistencies found
3. Run tests (ensure no breaking changes)
4. Verify build succeeds
5. Final git commit

### Phase 44E: CI/CD Integration (Step 5)
**Duration:** 30 minutes
**Deliverables:**
- Consistency check in GitHub Actions
- Auto-sync before releases
- Pre-push validation

**Activities:**
1. Add consistency check to CI pipeline
2. Configure pre-commit hook
3. Document enforcement policy
4. Create runbook for manual fixes

---

## 3. Non-Functional Requirements

✅ **No new features**
✅ **No API changes**
✅ **No extraction logic changes**
✅ **No database schema changes**
✅ **Git history preserved** (no force-push)
✅ **All tests pass** (0 new failures)
✅ **Build succeeds** (0 TypeScript errors)
✅ **Backwards compatible** (100%)

---

## 4. Technical Specification

### 4.1 Version Authority Chain
```
package.json (AUTHORITY)
    ↓
project-metadata.json (SINGLE SOURCE OF TRUTH)
    ↓
PHASE_*.md (Derived references)
    ↓
README.md (Reference)
    ↓
CHANGELOG.md (Reference)
    ↓
Documentation files (Reference)
```

**Policy:** Keine manuelle Versions-Änderung möglich. Nur über `npm run version:sync`.

### 4.2 Consistency Checks

```typescript
checks: [
  'version_in_package_json_exists',
  'version_format_valid_semver',
  'project_metadata_version_matches',
  'phase_numbers_sequential',
  'all_phase_docs_exist',
  'changelog_entries_complete',
  'readme_version_badge_current',
  'no_duplicate_changelog_entries',
  'all_internal_links_valid',
  'no_orphaned_files',
  'git_history_clean'
]
```

### 4.3 Data Consolidation Targets

| File | Current Issues | Solution |
|------|---|---|
| `README.md` | 2 version mentions, 3 dupes | Single version + link to metadata |
| `CHANGELOG.md` | Entries in multiple files | Consolidate all in one file |
| `OPERATIONS_MANUAL*.md` | 5 versions exist | Keep current, archive others |
| `QUICKSTART.md` | Duplicates README | Link to README, mark deprecated |
| `PROJECT.md` | Outdated references | Link to project-metadata.json |

---

## 5. Expected Outcomes

### Before Phase 44
❌ Version inconsistencies: ~15-20 found  
❌ Duplicate documentation: ~8-10 sections  
❌ Broken references: ~3-5  
❌ Orphaned files: ~2-3  
❌ Manual sync needed: Every phase  

### After Phase 44
✅ Version inconsistencies: 0  
✅ Duplicate documentation: 0  
✅ Broken references: 0  
✅ Orphaned files: 0  
✅ Auto-sync: Every commit  

---

## 6. Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Breaking changes | Test all API endpoints post-consolidation |
| Git history loss | Use git rebase -i carefully, preserve commits |
| Script errors | Test on branch first, then merge to master |
| Merge conflicts | Plan consolidation order: docs → metadata → scripts |
| CI/CD breakage | Test locally before pushing to GitHub |

---

## 7. Success Criteria

✅ All 11 consistency checks pass  
✅ 0 discrepancies in final audit  
✅ All tests passing (16/16 Phase 43 + existing)  
✅ 0 TypeScript compilation errors  
✅ Documentation consolidated (no dupes)  
✅ Version sync automated  
✅ Runbook created for Phase 45+  

---

## 8. Phase 44 Quick Reference

**Key Files to Create:**
- `docs/PROJECT_CONSISTENCY_ANALYSIS.md`
- `project-metadata.json`
- `scripts/validate-project-consistency.mjs`
- `scripts/sync-project-version.mjs`

**Key Files to Modify:**
- `package.json` (add new scripts)
- `README.md` (consolidate)
- `CHANGELOG.md` (consolidate)
- `OPERATIONS_MANUAL.md` (archive old)

**Key Files to Archive:**
- Old `OPERATIONS_MANUAL_v*.md`
- Duplicate documentation

**Not Touching:**
- Any source code
- Any extraction logic
- Any API contracts
- Any database code

---

## 9. Next Steps

Ready to start Phase 44 Analysis?

1. **Step 1:** Run consistency scan → Identify all issues
2. **Step 2:** Create analysis report → Document findings
3. **Step 3:** Design metadata structure → Finalize format
4. **Step 4:** Implement validation script → Test thoroughly
5. **Step 5:** Implement sync script → Test thoroughly
6. **Step 6:** Consolidate documentation → Merge duplicates
7. **Step 7:** Run all validations → Fix issues
8. **Step 8:** Git commit & push → Mark complete

**Ready to proceed?** 🚀
