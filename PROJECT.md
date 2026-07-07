# PROJECT.md

Umfassende Projekt-Übersicht und Roadmap.

## Projekt-Information

**Name**: Audit-Safe Document Extractor  
**Version**: 0.15.0-rc1  
**Status**: ✅ Phase 14 COMPLETE | 🟡 Phase 15 PROPOSED (Schema-Driven Rule Generation)
**Sprache**: TypeScript  
**Lizenz**: MIT

## 🎯 Projektziel

Entwicklung eines **revisionssicheren Dokument-Extraktionssystems**, das:

- ✅ Keine Halluzinationen produziert
- ✅ Vollständige Provenance für jeden Wert
- ✅ Explizite Unsicherheit dokumentiert
- ✅ Audit-Trails mit Zeitstempel
- ✅ Strenge Validierung in TypeScript strict mode
- ✅ 80%+ Unit Test Coverage

**Nicht-Ziele**:
- ❌ Generative AI (Chat, Summarization)
- ❌ Automatische Korrekturen
- ❌ Data Imputation
- ❌ Machine Learning Model Training

## 📊 Implementierte Phasen

### ✅ Phase 2: Domain Models (100%)
- Document, DocumentChunk, ExtractedField<T>, SourceReference
- DocumentFormat + DocumentTypeEnum
- ExtractionResult aggregate
- 50+ tests

### ✅ Phase 3: RuleLoader (100%)
- ExtractionRule validation
- Rule schema loading
- Policy enforcement

### ✅ Phase 4a: Parser Framework (100%)
- PDF (pdf-parse) + DOCX (mammoth) + HTML (cheerio)
- ParserFactory routing
- Image references
- 180+ tests

### ✅ Phase 5: ExampleRepository (100%)
- Test example lifecycle
- Comparison metrics
- Filesystem-based loading
- 50+ tests

### ✅ Phase 6: ChunkingEngine (100%)
- SemanticChunkingStrategy
- SimpleChunkingStrategy
- HybridChunkingStrategy
- 40+ tests

### ✅ Phase 7: DocumentClassifier (100%)
- Feature-based classification (6 types)
- Confidence constraint (0.0-0.99)
- Uncertainty documentation
- 30+ tests

### ✅ Phase 10: ValidationService (100%)
- AJV JSON Schema validation
- Required/Optional detection
- NO data generation
- 15+ tests

### ✅ Phase 11: REST API + Frontend UI (100%)
- **Backend**: Express API with document/rule/extraction routes
- **Frontend**: RuleEditor component with 4-tab interface
- **API Client**: Centralized HTTP wrapper with error handling
- **Type Contracts**: Shared TypeScript interfaces
- **Mock Services**: Realistic delays, changelog tracking
- **Status**: Complete - Phase 11 (API Infrastructure)

### ✅ Phase 12: Centers & Orchestration (100%)
- **Config Center**: ConfigManager with versioning + changelog
- **Backup Center**: BackupService with compression + checksums  
- **Audit Center**: Field-level audit trail + export
- **Help Center**: Glossary search + documentation
- **Log Browser**: Multi-dimensional filtering + export
- All routes fully implemented with DI integration

### ✅ Phase 13: Frontend Workbench & Service Container (100%)
- **6 Frontend Components**: ExtractionWorkbench, ConfigEditor, AuditViewer, LogBrowser, HelpBrowser, BackupManager
- **Service Container**: Centralized DI with TSyringe (13 services)
- **REST API**: 15 endpoints (14/15 working, 1 performance tuning needed)
- **API Response Wrapper**: Unified format with data, timestamp, path, duration
- **Middleware Chain**: Request logging, JSON parsing, CORS, validation, response wrapping

### ✅ Phase 8: LLMExtractor (100%)
- **Files**: `src/application/LLMExtractor.ts`
- **Code**: LLM-based field extraction with source tracking
- **Tests**: Component tests (mock responses)
- **LOC**: ~380
- **Status**: Complete - Phase 8

### ✅ Phase 9: HallucinationValidator (100%)
- **Files**: `src/domain/HallucinationValidator.ts`
- **Code**: Hallucination detection with source verification
- **Tests**: Component tests
- **LOC**: ~265
- **Status**: Complete - Phase 9 Rewrite

### ⏳ Phase 8: LLMExtractor (NOT STARTED)
- Input: Document, Chunks, RuleSet, Schema
- Output: ExtractionResult with sourceReferences
- Halluzination prevention

### ⏳ Phase 9: HallucinationValidator (NOT STARTED)
- Verify sourceReferences point to actual chunks
- Discard hallucinated values
- Generate warnings

## 📊 Systemarchitektur

```
┌──────────────────────────────────────────────┐
│    PRESENTATION LAYER                        │
│  - AuditReportGenerator (Future: REST API)  │
└────────────────┬─────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────┐
│    APPLICATION LAYER                         │
│  - ChunkingEngine (Semantic/Simple/Hybrid)  │
│  - DocumentClassifier (Feature-based)       │
│  - ValidationService (AJV Schemas)          │
│  - LLMExtractor (Phase 8)                    │
│  - HallucinationValidator (Phase 9)         │
└────────────────┬─────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────┐
│    INFRASTRUCTURE LAYER                      │
│  - ParserFramework (PDF/DOCX/HTML)          │
│  - ExampleRepository (Filesystem)           │
│  - (Future: Database, APIs)                 │
└────────────────┬─────────────────────────────┘
                 │
┌────────────────▼─────────────────────────────┐
│    DOMAIN LAYER (Pure Logic)                 │
│  - Document, DocumentChunk, SourceReference │
│  - ExtractedField<T>, ExtractionResult      │
│  - ValidationRule, ConfidenceScore          │
│  - ExtractionRule                       │
│  - Validation (validateNoHallucination) │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│    INFRASTRUCTURE LAYER                 │
│  - ResultRepository                     │
│  - RuleSetRepository                    │
│  - DocumentHasher                       │
└─────────────────────────────────────────┘
```

## 🔐 Halluzinations-Schutz

**Mechanismen**:

1. **SourceReference Requirement**: Jeder Wert braucht Quelle
2. **Confidence Filtering**: Werte < 0.8 → null
3. **HallucinationValidator**: Automatische Überprüfung
4. **Audit Trail**: Komplette Dokumentation
5. **Unit Tests**: Regression Tests für kritische Cases

**Enforcement**:
- TypeScript strict mode
- Compile-Zeit Checks (Types)
- Runtime Checks (Validation)
- Test Coverage (Unit Tests)

## 🎓 Lernstrategie

**Darf NICHT**:
- ❌ Werte erfinden
- ❌ Fehlende Daten ergänzen
- ❌ Dokumente vervollständigen

**Darf**:
- ✅ Erfolgreiche Patterns tracken
- ✅ Fehlerhafte Patterns identifizieren
- ✅ Optimierungsempfehlungen geben
- ✅ Ähnliche Fehler clustern
- ✅ Statistiken sammeln

**Output**: Empfehlungen, nicht Werte.

## 📝 Extraktions-Regeln (Schema)

Rules sind **deklarativ**, nicht prozedural:

```json
{
  "fieldName": "invoiceNumber",
  "fieldType": "string",
  "isRequired": true,
  "constraints": {
    "pattern": "^[A-Z0-9-]+$",
    "minLength": 1,
    "maxLength": 50
  }
}
```

Rules sagen **WAS** gesucht wird, nicht **WIE** man es findet.

## 🔄 Versionierungsstrategie

Folge **Semantic Versioning** (MAJOR.MINOR.PATCH):

| Change | Beispiel | Version |
|--------|----------|---------|
| New required field | invoiceDate jetzt required | v1.0.0 → v2.0.0 (MAJOR) |
| New optional field | department hinzugefügt | v1.0.0 → v1.1.0 (MINOR) |
| Bug fix | Regex korrigiert | v1.0.0 → v1.0.1 (PATCH) |

**Breaking Changes**:
- Müssen als MAJOR markiert sein
- Müssen in CHANGELOG dokumentiert sein
- Benötigen Migration Guide

## 🧪 Teststrategie

### Unit Tests (80%+ Coverage Required)

```
domain/
├── ExtractionFieldName.test.ts    ✅
├── ConfidenceScore.test.ts        ✅
└── ExtractionRule.test.ts         ✅

application/
├── ExtractionEngine.test.ts       ✅
├── DocumentRuleAssociation.test.ts ✅
└── LearningComponent.test.ts      ✅

infrastructure/
├── ResultRepository.test.ts       ✅
└── RuleSetRepository.test.ts      ✅
```

### Regression Tests (Kritisch!)

Bekannte Extraktionen müssen weiterhin funktionieren:

```typescript
it('should still filter low-confidence values', () => {
  const result = engine.applyConfidenceFilter(
    { value: 'test', confidence: 0.5, sources: [] },
    0.8
  );
  expect(result.value).toBeNull();
});
```

## 🌿 Branch-Strategie

```
main (stable)
  ├── hotfix/issue-number
  │   └── → main, develop
  │
develop (development)
  ├── feature/feature-name
  │   └── → develop
  │
  ├── bugfix/bug-name
  │   └── → develop
  │
  └── docs/update-name
      └── → develop
```

**Rules**:
- `main` immer stable
- `develop` immer testbar
- Feature Branches von `develop`
- Hotfixes zu `main` UND `develop`
- Keine direkten Commits zu `main`

## 📅 Phasen-Status & Roadmap

### ✅ Completed Phases

| Phase | Name | Status | Version |
|-------|------|--------|---------|
| 2-4 | Core Engine + Parsers | ✅ DONE | v0.3 |
| 5-7 | Learning + Classification | ✅ DONE | v0.5 |
| 8-9 | LLM + Hallucination | ✅ DONE | v0.7 |
| 10 | Validation (AJV) | ✅ DONE | v0.8 |
| 11 | REST API + Frontend | ✅ DONE | v0.11 |
| 12 | Centers & Orchestration | ✅ DONE | v0.12 |
| 13 | Frontend Workbench | ✅ DONE | v0.13 |
| 14 | Learning Feedback Loop | ✅ DONE | v0.14 |

### 🟡 Proposed/Planned

| Phase | Name | Status | Priority | Est. Time |
|-------|------|--------|----------|-----------|
| **15** | **Schema-Driven Rule Generation** | 🟡 PROPOSED | HIGH | 4-5 weeks |
| 16 | Advanced Pattern Mining | 🟤 PLANNED | MEDIUM | 3-4 weeks |
| 17 | Multi-Document Synthesis | 🟤 PLANNED | LOW | 4-6 weeks |

---

## 🎯 Phase 15: Schema-Driven Rule Generation (NEXT)

**Problem**: Users can't automatically generate rules from JSON schemas + examples

**Solution**: 
1. Upload JSON schema (target structure)
2. Upload example JSON files (learn-by-example)
3. System auto-generates extraction rules
4. Run extraction with generated rules
5. Display validated results in frontend

**Key Components**:
- `SchemaAnalyzer` - Parse JSON Schema
- `ExampleAnalyzer` - Extract patterns from examples
- `RuleGenerator` - Auto-create rules
- `ResultMapper` - Map extracted → schema
- New Frontend Wizard (5-step workflow)

**See**: [PHASE-15-SCHEMA-DRIVEN-GENERATION.md](./PHASE-15-SCHEMA-DRIVEN-GENERATION.md)

**Acceptance Criteria**:
- ✅ Schema + Examples upload works
- ✅ Rules generated automatically
- ✅ Extraction with generated rules succeeds
- ✅ Results validated against schema
- ✅ Frontend displays hierarchical results with coverage %
- ✅ 80%+ test coverage
- ✅ All existing tests pass (no regression)
- [ ] Performance Optimization
- [ ] CLI Tool
- [ ] Docker Support

### 📈 Phase 3: Advanced (v2.0.0) - Q2 2024

- [ ] Multi-Document Extractions
- [ ] Batch Processing
- [ ] Advanced Learning (Embeddings)
- [ ] Web UI for Rule Management
- [ ] Integration Tests

### 🎯 Phase 4: Enterprise (v3.0.0) - Q3 2024

- [ ] Multi-tenancy Support
- [ ] Advanced Audit Logging
- [ ] RBAC & Authorization
- [ ] Compliance Features (GDPR, SOC2)
- [ ] Enterprise Support

## 📊 Metriken

**Qualität**:
- Unit Test Coverage: 80%+
- ESLint: 0 errors
- Type Errors: 0
- Hallucination Detection: 100%

**Performance**:
- Durchschnittliche Extraktionszeit: < 500ms
- Memory Usage: < 100MB pro Extraktion
- API Latency (Zukunft): < 1s

**Compliance**:
- Audit Trail: 100% Coverage
- SourceReference: 100% Required
- Confidence Score: Immer definiert

## 🤝 Team-Rollen

| Rolle | Verantwortung |
|-------|---------------|
| Architect | System Design, SOLID, Clean Code |
| Developer | Feature Implementation, Unit Tests |
| QA | Test Strategy, Coverage, Regression |
| DevOps | CI/CD, Deployment, Monitoring |
| Documentation | User Docs, API Docs, Glossar |

## 📞 Kommunikation

- **Bugs**: GitHub Issues
- **Features**: GitHub Discussions → Design Doc → PR
- **Questions**: GitHub Discussions
- **Security**: security@example.com (Future)

## 📖 Dokumentation

| Dokument | Zielgruppe | Pfad |
|----------|-----------|------|
| README.md | Alle | `/README.md` |
| QUICKSTART.md | Neue Entwickler | `/QUICKSTART.md` |
| ARCHITECTURE.md | Architekten | `/docs/ARCHITECTURE.md` |
| glossary.md | Alle | `/docs/glossary.md` |
| API Docs | Entwickler | `/docs/api/` (Zukunft) |
| Contributing | Beitrag-interessiert | `/CONTRIBUTING.md` |

## ⚠️ Kritische Policies

1. **Halluzinationen sind NICHT verhandelbar**
   - PRs mit Halluzinationen werden abgelehnt
   - Tests müssen existieren

2. **Tests sind Pflicht**
   - Neuer Code = Tests erforderlich
   - Coverage < 80% = Nicht mergebar

3. **Code Quality**
   - ESLint: 0 Errors
   - Prettier: Auto-formatted
   - TypeScript: strict mode

4. **Dokumentation**
   - Code Comments für komplexe Logic
   - README für neue Features
   - Glossar wird aktualisiert

## 🔗 Ressourcen

- GitHub: https://github.com/your-org/audit-safe-extractor
- Documentation: https://your-org.github.io/audit-safe-extractor
- Issues: https://github.com/your-org/audit-safe-extractor/issues
- Discussions: https://github.com/your-org/audit-safe-extractor/discussions

---

**Zuletzt aktualisiert**: 2026-01-15  
**Gültig für**: v1.0.0+
