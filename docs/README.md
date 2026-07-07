# docs/

Umfassende Projektdokumentation für Phase 1-15.

## 📊 Status & Roadmap

| Dokument | Zweck |
|----------|--------|
| [../SYSTEM-STATUS.md](../SYSTEM-STATUS.md) | 🟢 Phase 14 Complete, 🟡 Phase 15 Proposed |
| [../IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md) | Phasen-Übersicht (2-15) |
| [../PROJECT.md](../PROJECT.md) | Projekt-Roadmap & Phasen-Status |

## 🎯 Phase 15: Schema-Driven Rule Generation

| Dokument | Zweck |
|----------|--------|
| [PHASE-15-SCHEMA-DRIVEN-GENERATION.md](PHASE-15-SCHEMA-DRIVEN-GENERATION.md) | **[SPEC]** Technische Spezifikation + JSON Schema Draft-07 Referenz |
| [PHASE-15-USER-GUIDE.md](PHASE-15-USER-GUIDE.md) | **[USER]** Kompletter Nutzer-Workflow mit Beispielen |
| [JSON-SCHEMA-DRAFT-07-REFERENCE.md](JSON-SCHEMA-DRAFT-07-REFERENCE.md) | **[REFERENCE]** Vollständiges JSON Schema Draft-07 Handbuch |

**Problem**: Users müssen Extraktionsregeln manuell erstellen (30+ min).  
**Lösung (Phase 15)**: Automatische Regelsatz-Generierung aus JSON-Schema + Beispiele (2-3 min).

## 📖 Kern-Dokumentation

| Dokument | Zweck |
|----------|--------|
| [systemprompt.md](systemprompt.md) | AI System Prompt - Kernrichtlinien |
| [ARCHITECTURE.md](ARCHITECTURE.md) | System-Architektur & Datenfluss |
| [glossary.md](glossary.md) | Fachvokabular des Projekts |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | Beitrags-Richtlinien |
| [../CHANGELOG.md](../CHANGELOG.md) | Versions-Historie |
| [../QUICKSTART.md](../QUICKSTART.md) | Schnelleinstieg |
| [../USER-GUIDE.md](../USER-GUIDE.md) | Nutzer-Handbuch (all phases) |

## Unterordner

### architecture/
Tiefgehende architektur-Dokumentation:
- Schicht-Beschreibungen
- Komponenten-Interaktionen
- Design Patterns
- Extension Points

### prompts/
Prompt-Beispiele und Best Practices:
- System Prompts
- User Prompts
- Prompt Templates

### sprints/
Sprint-Planung und Roadmap:
- Sprint Goals
- Task Breakdown
- Milestones
- Release Planning

## Getting Started

1. **Lese**: [systemprompt.md](systemprompt.md)
2. **Verstehe**: [ARCHITECTURE.md](ARCHITECTURE.md)
3. **Lerne**: [glossary.md](glossary.md)
4. **Beitragen**: [../CONTRIBUTING.md](../CONTRIBUTING.md)

## Design Principles

Die fünf Säulen:

1. **Revisionssicherheit**: Alles nachverfolgbar
2. **Halluzinations-Freiheit**: Keine erfundenen Werte
3. **Transparenz**: Explizite Unsicherheit
4. **Strenge**: TypeScript strict, SOLID, Clean Code
5. **Testbarkeit**: 80%+ Coverage erforderlich

## Quick Links

- [README.md](../README.md) - Projektübersicht
- [QUICKSTART.md](../QUICKSTART.md) - Schnelleinstieg
- [package.json](../package.json) - Abhängigkeiten
- [tsconfig.json](../tsconfig.json) - TypeScript Config

---

**Letzte Aktualisierung**: 2026-07-06
