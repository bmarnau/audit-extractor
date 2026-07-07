# src/

Quellcode des Audit-Safe Document Extractors.

## Verzeichnisstruktur

```
src/
├── domain/              # Domain Logic (pure, framework-independent)
│   ├── ExtractionFieldName.ts
│   ├── ConfidenceScore.ts
│   ├── ExtractionModels.ts
│   ├── ExtractionRule.ts
│   └── index.ts
│
├── application/         # Application Layer (use cases, services)
│   ├── ExtractionEngine.ts
│   ├── DocumentRuleAssociation.ts
│   ├── LearningComponent.ts
│   └── index.ts
│
├── infrastructure/      # Infrastructure Layer (I/O, persistence)
│   ├── ResultRepository.ts
│   ├── RuleSetRepository.ts
│   └── index.ts
│
├── presentation/        # Presentation Layer (API, reporting)
│   ├── AuditReportGenerator.ts
│   └── index.ts
│
└── index.ts            # Main export
```

## Architektur-Schichten

### Domain Layer (`domain/`)
- Geschäftslogik, vollkommen unabhängig von außen
- Value Objects: `ExtractionFieldName`, `ConfidenceScore`
- Domain Interfaces: `ExtractionResult`, `ExtractedValue`
- Validierung: `validateNoHallucination`, `validateAgainstRule`

**Regel**: Domain kennt nur sich selbst, nicht Application oder Infrastructure.

### Application Layer (`application/`)
- Use Cases und Services
- `ExtractionEngine`: Kern-Business-Logic
- `ProvenanceAuditor`: Audit-Trail-Tracking
- `DocumentRuleAssociation`: Rule Routing
- `LearningComponent`: Statistiken (KEIN Data Generation)

**Regel**: Application kennt Domain, aber nicht Presentation.

### Infrastructure Layer (`infrastructure/`)
- Externe Integration (Dateisystem, Datenbanken, etc.)
- `ResultRepository`: JSON Serialisierung & Speicherung
- `RuleSetRepository`: Rule Management
- `DocumentHasher`: SHA256 Hashing

**Regel**: Infrastructure kennt Application, wird aber von ihr injiziert.

### Presentation Layer (`presentation/`)
- API und Reporting
- `AuditReportGenerator`: JSON, CSV, Markdown Reports
- HTTP Endpoints (zukünftig)
- CLI Interface (zukünftig)

**Regel**: Presentation ist oberste Schicht, kennt alles andere.

## Import-Konventionen

```typescript
// ✅ RICHTIG: Relative Imports in der gleichen Schicht
import { ExtractionFieldName } from './ExtractionFieldName';

// ✅ RICHTIG: Alias-Imports über tsconfig paths
import { ExtractionEngine } from '@application/ExtractionEngine';
import { ConfidenceScore } from '@domain/ConfidenceScore';

// ❌ FALSCH: Kreuzweise Imports
// domain/ sollte nicht application/ kennen
```

## Adding New Features

1. **Domain**: Define model und validation
2. **Application**: Implement service
3. **Infrastructure**: Add persistence
4. **Presentation**: Expose via API
5. **Tests**: Schreibe Unit Tests für jede Schicht

---

**Letzte Aktualisierung**: 2026-01-15
