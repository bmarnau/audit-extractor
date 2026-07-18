# Environment Validation Report

**Status**: ✅ BESTANDEN
**Datum**: 18.7.2026, 07:06:43

## Übersicht

| Metrik | Wert |
|--------|------|
| Gesamt Checks | 8 |
| Bestanden | 6 |
| Fehler | 0 |
| Warnungen | 2 |

## System Information

- **Node Version**: v24.16.0
- **Platform**: win32
- **Architecture**: x64
- **Working Directory**: C:\Users\bmarn\OneDrive\HTML\extractor

## ⚠️ Warnungen

- **Configuration**: 1 von 5 Konfigurationsdateien fehlen
  - Details: {"missing":["jest.config.js"],"found":["package.json","tsconfig.json","docker-compose.yml",".env.local"]}
- **Environment**: Optionale Umgebungsvariablen fehlen
  - Details: {"missing":["VITE_API_URL","LOG_LEVEL"],"present":0}

## ✅ Erfolgreich

- **Node.js**: Version 24.16.0 erforderliche Mindestversion erfüllt
- **npm**: Version 11.17.0 erforderliche Mindestversion erfüllt
- **Docker**: Docker und Docker Compose installiert
- **Environment**: Alle erforderlichen Umgebungsvariablen gesetzt
- **npm**: npm Dependencies installiert
- **Docker Compose**: docker-compose.yml ist gültig

## 💡 Empfehlungen

- Einige Konfigurationsdateien fehlen - diese könnten optional sein
- Einige optionale Umgebungsvariablen sind nicht gesetzt
