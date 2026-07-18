# Docker Build Validation System

## Overview
Robustes Verifikationssystem zur Gewährleistung, dass alle kritischen Dateien (insbesondere Release Notes) während des Docker-Build-Prozesses korrekt in die Container kopiert werden.

## Scripts

### 1. **pre-build-check.ps1** - Pre-Build Validation
Überprüft VOR dem Docker-Build, ob alle erforderlichen Dateien lokal vorhanden sind.

**Verwendung:**
```powershell
.\scripts\pre-build-check.ps1 -ProjectRoot .
```

**Prüft:**
- ✅ Alle Package-Dateien
- ✅ Dockerfile vorhanden
- ✅ Backend-Daten Verzeichnis (`backend/src/data`)
- ✅ Alle `.md` Dokumentations-Dateien
- ✅ Release Notes nicht leer

---

### 2. **docker-build-validate.ps1** - Complete Build Pipeline
Führt den KOMPLETTEN Build-Prozess mit vollständiger Validierung durch.

**Verwendung:**
```powershell
.\scripts\docker-build-validate.ps1 -NoCache
```

**Prozess:**
1. ✅ Pre-Build Validierung
2. ✅ Docker Compose Build (mit `--no-cache`)
3. ✅ Container Startup
4. ✅ Post-Build File Verification
5. ✅ API Health Check
6. ✅ Release Notes Endpoint Test

**Output:**
- Detaillierter Report: `docker-build-report_TIMESTAMP.txt`
- Build Log: `docker-build_TIMESTAMP.log`

---

### 3. **verify-docker-copy.ps1** - Post-Build Verification
Überprüft NACH dem Docker-Build, ob alle Dateien im Container vorhanden sind.

**Verwendung:**
```powershell
.\scripts\verify-docker-copy.ps1 -ContainerName extractor-backend
```

**Prüft im Container:**
- ✅ `/app/backend/src/data/release-notes.json`
- ✅ `/app/backend/src/data/manual.json`
- ✅ `/app/RELEASE_NOTES_0.37.1.md`
- ✅ `/app/OPERATIONS_MANUAL.md`
- ✅ `/app/README.md`
- ✅ `/app/MANUAL-0.37.1.md`
- ✅ `/app/package.json`
- ✅ `/app/dist/index.js`

**Zeigt:**
- Dateigröße
- Zeilenanzahl
- Erste 5 Zeilen (als Sanity-Check)

---

### 4. **verify-runtime-files.ps1** - Runtime Verification
Überprüft NACH Container-Start, ob HelpContentLoader die Dateien findet und API-Endpoints funktionieren.

**Verwendung:**
```powershell
.\scripts\verify-runtime-files.ps1 -ContainerName extractor-backend
```

**Prüft:**
- ✅ Filesystem-Layout im Container
- ✅ Dateien lesbar
- ✅ HelpContentLoader Logs
- ✅ API Endpoints:
  - `GET /api/help`
  - `GET /api/help/release-notes`
  - `GET /api/help/documentation`

---

## Dockerfile Verification

Das `Dockerfile.backend` enthält jetzt integrierte Verifikation im Build-Prozess:

```dockerfile
# VERIFICATION: Ensure all critical files are present
RUN echo "🔍 Verifying critical files in container..." && \
    ls -lah /app/backend/src/data/ && \
    test -f /app/backend/src/data/release-notes.json || exit 1 && \
    test -f /app/RELEASE_NOTES_0.37.1.md || exit 1 && \
    ... (weitere Checks)
```

**Effekt:** Wenn Dateien NICHT korrekt kopiert wurden, **bricht der Docker-Build ab** mit klarer Fehlermeldung.

---

## Complete Workflow (Empfohlen)

```powershell
# 1. Kompletter Build mit aller Validierung
.\scripts\docker-build-validate.ps1 -NoCache

# 2. Nach erfolgreichem Build: Runtime-Checks
.\scripts\verify-runtime-files.ps1

# 3. Manueller Check (wenn nötig)
.\scripts\verify-docker-copy.ps1 -ContainerName extractor-backend

# 4. Logs anschauen
docker compose logs backend --tail 100 | Select-String "HelpContentLoader|release"
```

---

## Troubleshooting

### Problem: Release Notes Endpoint returns leere Liste

```powershell
# 1. Verifiziere lokale Dateien
.\scripts\pre-build-check.ps1

# 2. Verifiziere Container Dateien
.\scripts\verify-docker-copy.ps1

# 3. Verifiziere Runtime
.\scripts\verify-runtime-files.ps1

# 4. Prüfe HelpContentLoader Logs
docker compose logs backend | Select-String "HelpContentLoader"

# 5. Prüfe API Response
curl http://localhost:3000/api/help/release-notes | jq .
```

### Problem: Docker Build schlägt bei Verifikation fehl

```bash
# 1. Logs anschauen
docker compose build --no-cache 2>&1 | tail -50

# 2. Lokale Dateien überprüfen
ls -la backend/src/data/
ls -la *.md | grep -i release

# 3. Dateien sind leer?
wc -l backend/src/data/*.json
wc -l RELEASE_NOTES_0.37.1.md
```

---

## Key Improvements

| Feature | Vorher | Nachher |
|---------|--------|---------|
| Pre-Build Checks | ❌ Keine | ✅ Automatisch |
| Build-Zeit Verifikation | ❌ Keine | ✅ Im Dockerfile |
| Post-Build Checks | ❌ Keine | ✅ Automatisch |
| Runtime Checks | ❌ Keine | ✅ Automatisch |
| Reporting | ❌ Keine | ✅ Detaillierte Reports |
| API Endpoint Testing | ❌ Keine | ✅ Automatisch |
| Container Logs Check | ❌ Manuelle | ✅ Automatisiert |

---

## Environment Variables

```bash
# ProjectRoot (Standard: Current Directory)
.\scripts\docker-build-validate.ps1 -ProjectRoot C:\Users\bmarn\OneDrive\HTML\extractor

# Container Name (Standard: extractor-backend)
.\scripts\verify-docker-copy.ps1 -ContainerName my-backend-container

# No Cache Build
.\scripts\docker-build-validate.ps1 -NoCache $true
```

---

## CI/CD Integration

Diese Scripts können in GitHub Actions / Azure Pipelines eingebunden werden:

```yaml
- name: Build and Validate Docker
  run: |
    pwsh .\scripts\docker-build-validate.ps1 -NoCache
    pwsh .\scripts\verify-runtime-files.ps1
  shell: powershell
```

---

## Support

Bei Problemen:
1. Überprüfe `docker-build-report_*.txt`
2. Überprüfe `docker-build_*.log`
3. Führe `docker compose logs` aus
4. Überprüfe lokale Dateien mit `pre-build-check.ps1`
