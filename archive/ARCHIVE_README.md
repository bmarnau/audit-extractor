# Archive Directory - Historical Documentation & Files

**Last Updated**: 2026-07-11  
**Archive Version**: 0.24.0  

---

## Overview

This directory contains archived files from previous development phases (Phase 1-18), old release notes, manuals, scripts, and legacy documentation. The archive is organized for easy reference and historical tracking.

---

## Directory Structure

### 📋 `/archive/release-notes/`

Historical release notes from versions 0.11.0 through 0.23.0.

**Contents**:
- `RELEASE_NOTES_0.11.0.md` - Initial release
- `RELEASE_NOTES_0.12.0.md` - 0.12 series
- `RELEASE_NOTES_0.13.0.md` - 0.13 series
- `RELEASE_NOTES_0.14.0.md` - 0.14 series
- `RELEASE_NOTES_0.15.0.md` - 0.15 series
- `RELEASE_NOTES_0.16.0.md` - 0.16 series
- `RELEASE_NOTES_0.17.0.md` - 0.17 series
- `RELEASE_NOTES_0.18.0.md` - 0.18 series
- `RELEASE_NOTES_0.20.0.md` - 0.20 series
- `RELEASE_NOTES_0.21.0.md` - 0.21 series
- `RELEASE_NOTES_0.23.0.md` - 0.23 series (Last pre-0.24 release)

**Current Version**: Use `RELEASE_NOTES_0.24.0.md` in root directory

---

### 📚 `/archive/manuals/`

Historical user manuals from versions 0.21.0 through 0.23.0.

**Contents**:
- `MANUAL-0.21.0.md` - v0.21 user guide (400+ pages)
- `MANUAL-0.22.0.md` - v0.22 user guide
- `MANUAL-0.23.0.md` - v0.23 user guide (Phase 23.0 foundation)

**Current Version**: Use `MANUAL-0.24.0.md` in root directory

---

### 📁 `/archive/legacy/`

Legacy documentation and supporting files from Phases 1-18, including:

#### Test Scripts
- `test-*.ps1` - Various test runners
- `Test-Prerequisites.ps1` - Environment checks
- `test-*.js` - Node.js test utilities

#### Startup/Shutdown Scripts
- `start-*.ps1/.cmd` - Service startup scripts
- `stop-*.ps1/.cmd` - Service shutdown scripts
- `health-check.ps1` - Health monitoring

#### Utility Scripts
- `backup-before-build.ps1` - Pre-build backup
- `restore-after-build.ps1` - Post-build restore
- `archive-obsolete.ps1` - Legacy archival tool
- `upload-schemas-fixed.ps1` - Schema management

#### Documentation
- `PHASE1_*.md` - Phase 1 documentation (8 files)
- `PHASE*.md` - Phases 2-18 documentation (50+ files)
- `PHASE*_*.md` - Detailed phase reports
- `SESSION_*.md` - Session completion reports
- `TEST-DOCUMENTATION.md` - Old testing guide
- `DOCUMENTATION-INDEX.md` - Legacy documentation index

#### Docker & Deployment References
- `DOCKER_QUICK_REFERENCE.md` - Docker quick guide
- `DOCKER_VOLUMES_REFERENCE.md` - Volume configuration reference
- `IMPLEMENTATION_SUMMARY.md` - Implementation notes

#### Test Data
- `test-invoice-*.json` - Sample invoice test data
- `test-schema-*.json` - Schema test files
- `schema-migration.sql` - Database schema migration

---

### 📄 `/archive/docs/`

Legacy documentation files (reserved for future use).

---

## Using the Archive

### To Reference Historical Information

```bash
# View release notes from specific version
cat archive/release-notes/RELEASE_NOTES_0.21.0.md

# Check historical manual
cat archive/manuals/MANUAL-0.23.0.md

# Find old implementation details
cat archive/legacy/PHASE18-COMPLETION-REPORT.md
```

### To Restore a File

```bash
# Copy file from archive to current directory
cp archive/legacy/DOCKER_QUICK_REFERENCE.md ./

# Or move it back permanently
mv archive/legacy/script.ps1 ./
```

### To Search Archive

```bash
# Search for content in all archived release notes
grep -r "breaking change" archive/release-notes/

# Find specific phase documentation
find archive/legacy -name "*PHASE18*"
```

---

## Important Versions

| Version | Release Date | Status | Archive Location |
|---------|------------|--------|------------------|
| 0.24.0 | 2026-07-11 | **CURRENT** | Root directory |
| 0.23.0 | 2026-07-10 | Archived | `archive/release-notes/` |
| 0.21.0 | 2026-07-XX | Archived | `archive/release-notes/` |
| 0.18.0 | 2026-07-XX | Archived | `archive/release-notes/` |
| 0.11.0 | 2026-XX-XX | Archived | `archive/release-notes/` |
| Phase 18 | 2026-XX-XX | Complete | `archive/legacy/` |
| Phase 1 | 2026-XX-XX | Complete | `archive/legacy/` |

---

## Current Active Files (Root Directory)

These files are the **active versions** for the current release (v0.24.0):

### Documentation
- `RELEASE_NOTES_0.24.0.md` - Current release information
- `MANUAL-0.24.0.md` - Current user manual
- `README.md` - Project overview
- `QUICKSTART.md` - Getting started guide
- `API_REFERENCE.md` - API documentation
- `TROUBLESHOOTING.md` - Troubleshooting guide
- `CONTRIBUTING.md` - Contribution guidelines
- `PROJECT.md` - Project description

### Configuration
- `package.json` - v0.24.0 (dependencies & metadata)
- `tsconfig.json` - TypeScript configuration
- `jest.config.js` - Test configuration
- `playwright.config.ts` - E2E test config
- `docker-compose.yml` - Multi-container setup

### Docker Images
- `Dockerfile.backend` - Backend service image
- `Dockerfile.frontend` - Frontend service image

---

## Archive Maintenance

### Adding to Archive

When deprecating files:
1. Move to appropriate `/archive/` subdirectory
2. Update this `ARCHIVE_README.md`
3. Commit with message: `Archive: [filename] → archive/[subdirectory]/`
4. Tag release if version-related

### Cleanup Policy

- Keep all archived files indefinitely for historical reference
- Archive new legacy files as they're deprecated
- Update this README when major reorganizations occur

---

## Quick Navigation

- **Current Release**: See `RELEASE_NOTES_0.24.0.md` in root
- **User Guide**: See `MANUAL-0.24.0.md` in root
- **Previous Versions**: Browse `archive/release-notes/`
- **Old Implementations**: Browse `archive/legacy/`
- **Test Utilities**: Search `archive/legacy/test-*.ps1`

---

**Archive Size**: Approximately 50+ MB of historical documentation and code  
**Last Reorganized**: 2026-07-11 (v0.24.0 cleanup)  
**Archiving Strategy**: Keep all - Never delete for historical tracking

---

*For current active development, refer to files in the root directory.*
