# Audit-Safe Document Extractor - Architektur-Übersicht

## System-Schichten

```
┌─────────────────────────────────────────────┐
│         PRESENTATION LAYER                  │
│  - AuditReportGenerator (JSON/CSV/MD)      │
│  - CLI/API Endpoints                        │
└─────────────┬───────────────────────────────┘
              │
┌─────────────▼───────────────────────────────┐
│      APPLICATION LAYER (Use Cases)          │
│  - ExtractionEngine (Core Logic)            │
│  - ProvenanceAuditor (Nachverfolgung)       │
│  - DocumentRuleAssociation (Routing)        │
│  - LearningComponent (Statistiken)          │
│  - ExtractionResultBuilder (Builder)        │
└─────────────┬───────────────────────────────┘
              │
┌─────────────▼───────────────────────────────┐
│        DOMAIN LAYER (Pure Business Logic)   │
│  - ExtractionFieldName (Value Object)       │
│  - ConfidenceScore (Value Object)           │
│  - ExtractionRule (Domain Entity)           │
│  - ExtractionModels (Interfaces)            │
│  - Validierung (validateNoHallucination)    │
└─────────────┬───────────────────────────────┘
              │
┌─────────────▼───────────────────────────────┐
│    INFRASTRUCTURE LAYER (I/O & Persistence)│
│  - ResultRepository (JSON Serialisierung)   │
│  - RuleSetRepository (Rule Management)      │
│  - DocumentHasher (SHA256 Integrity)        │
└─────────────────────────────────────────────┘
```

## Datenfluss - Extraktions-Pipeline

```
Quelldokument
    │
    ▼
┌──────────────────────────────┐
│ DocumentRuleAssociation      │  ← Findet passende Regelset
└──────────────────────────────┘
    │
    ▼
┌──────────────────────────────┐
│ ExtractionEngine.extract()   │  ← Extrahiert mit Quelle
│  - Validierung               │
│  - Confidence Check          │
└──────────────────────────────┘
    │
    ▼
┌──────────────────────────────┐
│ applyConfidenceFilter()      │  ← Filtert unsichere Werte
│  - Halluzinations-Check      │
│  - null-Setting wenn < 0.8   │
└──────────────────────────────┘
    │
    ▼
┌──────────────────────────────┐
│ generateWarnings()           │  ← Identifiziert Probleme
│  - Fehlende Felder          │
│  - Low-Confidence Flags      │
└──────────────────────────────┘
    │
    ▼
┌──────────────────────────────┐
│ ExtractionResult             │  ← Finales Ergebnis
│  - extractedFields           │
│  - missingFields             │
│  - warnings                  │
│  - auditTrail               │
└──────────────────────────────┘
    │
    ▼
┌──────────────────────────────┐
│ ResultRepository.save()      │  ← Persistierung
└──────────────────────────────┘
    │
    ▼
┌──────────────────────────────┐
│ AuditReportGenerator         │  ← Berichterstattung
│  - JSON, CSV, Markdown       │
└──────────────────────────────┘
```

## Halluzinations-Verhinderung

```
Extrahierter Wert
    │
    ├─ Hat Quelle?
    │   ├─ NEIN → Halluzination!
    │   └─ JA → Weiter
    │
    ├─ Confidence >= 0.8?
    │   ├─ NEIN → Auf null setzen
    │   └─ JA → Weiter
    │
    ├─ Erfüllt Constraints?
    │   ├─ NEIN → Warning + uncertainty
    │   └─ JA → Weiter
    │
    ├─ Required? Und null?
    │   ├─ JA → Error-Warning
    │   └─ NEIN → OK
    │
    └─ ✅ Sicher akzeptiert
```

## Provenance Tracking

Jeder extrahierte Wert hat:

```typescript
ExtractedValue {
  value: T | null,           // Der Wert selbst
  confidence: 0-1,           // Sicherheitsgrad
  sources: [                 // Wo kommt es her?
    {
      documentReference: {
        documentId: string,
        fileName: string,
        hash: string,        // SHA256 für Integrität
      },
      pageNumber?: number,
      sectionId?: string,
      textSnippet?: string,  // Exakte Textstelle
      offsetStart?: number,  // Byte-Position
      offsetEnd?: number     // Byte-Position
    }
  ],
  uncertainty?: string,      // Warum ist confidence nicht 1.0?
  extractedAt: Date         // Zeitstempel
}
```

## Learning-System (Statistiken nur!)

```
Recording:
  ✅ Erfolgreiche Extraktion: Pattern + Confidence
  ✅ Fehlgeschlagene Extraktion: Pattern + Grund
  ✅ Häufigkeit tracken
  ✅ Success-Rate berechnen

Analyse:
  ✅ Welche Patterns haben niedrige Success-Rate?
  ✅ Welche Regeln sollten überprüft werden?
  ✅ Optimierungs-Empfehlungen

❌ NICHT erlaubt:
  ❌ Werte erfinden
  ❌ Fehlende Daten ergänzen
  ❌ Automatische Regeländerungen
  ❌ Dokumente vervollständigen
```

## SOLID-Implementierung

### Single Responsibility
- `ExtractionFieldName`: Nur Feldname-Validierung
- `ConfidenceScore`: Nur Score-Verwaltung
- `ProvenanceAuditor`: Nur Audit-Tracking
- `AuditReportGenerator`: Nur Formatierung

### Open/Closed
- `ExtractionRule` ist offen für neue Constraints
- `AuditReportGenerator` ist offen für neue Formate
- Neue Dokumenttypen ohne Code-Änderung möglich

### Liskov Substitution
- Alle `ExtractedValue<T>` sind austauschbar
- Interface-basierte Architektur

### Interface Segregation
- `ExtractionRule` nur was nötig ist
- `SourceLocation` nur Verweis-Informationen
- `ExtractionWarning` nur notwendige Felder

### Dependency Inversion
- `ExtractionEngine` abhängig von `ExtractionRule[]` (Interface)
- `ResultRepository` abstrakt über Pfade
- Dependency Injection für alle Services

## Test-Strategie

```
Unit Tests:
  ✅ ExtractionFieldName - Validierung
  ✅ ConfidenceScore - Range & Classification
  ✅ ExtractionEngine - Extract, Filter, Warnings
  ✅ ProvenanceAuditor - Tracking
  ✅ LearningComponent - Statistiken

Integration Tests (TODO):
  ⚠️ ExtractionEngine + RuleSetRepository
  ⚠️ ResultRepository + Serialisierung
  ⚠️ DocumentRuleAssociation + RuleRouting

End-to-End Tests (TODO):
  ⚠️ Kompletter Extraktions-Flow
  ⚠️ Mit echten Dokumenten
  ⚠️ Audit-Trail Validierung
```

## Performance & Skalierbarkeit

- **Memory**: Extraktionen streamen, nicht laden
- **Speed**: ProvenanceAuditor ist O(1) pro Entry
- **Storage**: Nur Metadaten + Snippets, nicht ganze Dokumente
- **Concurrency**: Thread-safe Map für Results

## Security & Audit

- **Document Hash**: SHA256 für Integritätsprüfung
- **Audit Trail**: Unveränderbar, zeitgestempelt
- **No Tampering**: ResultRepository uses append-only
- **Traceability**: Jeder Wert → exakte Quellenangabe

## Erweiterungspunkte

```typescript
// 1. Neue Dokumenttypen
interface SourceLocation {
  // ADD: scanningMetadata, OCRConfidence, etc.
}

// 2. Neue Extraktionstypen
type FieldType = 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object' | 'custom';

// 3. Neue Validierungs-Regeln
interface ExtractionRule {
  // ADD: customValidators, transformers
}

// 4. Neue Report-Formate
class AuditReportGenerator {
  // ADD: generateXML(), generateSQL(), etc.
}

// 5. Neue Learning-Metriken
class LearningComponent {
  // ADD: patternSimilarity, falsePositiveRate, etc.
}
```

---

**Wichtigste Philosophie**: Trust but verify. Jeder Wert ist verdächtig, bis er bewiesen ist.
