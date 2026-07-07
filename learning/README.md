# learning/

Speichert Lern-Daten und Optimierungsempfehlungen. **Generiert NIEMALS neue Geschäftsdaten!**

## Wichtig

Das Learning-System ist **nur für Statistik und Optimierung**, nicht für Datengenerierung:

- ✅ Erfolgreiche Extraktionen tracken
- ✅ Fehlerhafte Patterns identifizieren
- ✅ Optimierungsempfehlungen geben
- ✅ Ähnliche Fehler clustern

- ❌ Werte erfinden
- ❌ Fehlende Felder ergänzen
- ❌ Dokumente vervollständigen

## Struktur

```
learning/
├── corrections/      # Korrigierte Extraktionen
├── reflections/      # Erfolgreiche Patterns
├── embeddings/       # Vektorielle Darstellungen
└── README.md         # Diese Datei
```

## learning/corrections/

**Zweck**: Speichert Korrektionen für Training und Analyse.

**Format**:
```json
{
  "correctionId": "corr-001",
  "originalValue": "Meyer",
  "correctedValue": "Meyer GmbH",
  "field": "customerName",
  "documentId": "invoice-123",
  "reason": "Incomplete extraction",
  "correctedAt": "2024-01-15T11:00:00Z",
  "confidence": 0.5,
  "pattern": "company-name-pattern"
}
```

**Dateinamen**: `correction_DOCUMENTID_FIELD_TIMESTAMP.json`

**Verwendung**:
- Pattern-Optimierung
- Rule-Validierung
- Trainings-Datensatz

## learning/reflections/

**Zweck**: Speichert erfolgreiche Patterns und deren Häufigkeit.

**Format**:
```json
{
  "pattern": "invoice-header-pattern",
  "frequency": 47,
  "successRate": 0.94,
  "avgConfidence": 0.96,
  "lastObserved": "2024-01-15T10:35:00Z",
  "sourceDocuments": [
    "invoice-001", "invoice-002", ...
  ]
}
```

**Dateinamen**: `reflection_PATTERN_TIMESTAMP.json`

**Ausgaben des Learning-Systems**:
```typescript
learning.getOptimizationSuggestions()
// →
[
  "Pattern 'old-date-format' has low success rate 0.45 - review regex",
  "Pattern 'customer-name' works well (0.96) - consider for other fields",
  "New pattern 'vendor-id' emerged, frequency: 12"
]
```

## learning/embeddings/

**Zweck**: Speichert vektorielle Darstellungen für Similarity-Analyse.

**Format**:
```json
{
  "embeddingId": "emb-001",
  "text": "Invoice Number: INV-2024-001",
  "vector": [0.123, -0.456, 0.789, ..., 0.234],
  "model": "sentence-transformers/all-MiniLM-L6-v2",
  "dimension": 384,
  "createdAt": "2024-01-15T10:35:00Z"
}
```

**Dateinamen**: `embedding_DOCUMENTID_FIELD_TIMESTAMP.json`

**Verwendung**:
- Ähnliche Fehler clustern
- Pattern-Vergleich
- Semantic Similarity Analysis

## Ausgaben des Learning-Systems

### Statistik-Report
```json
{
  "totalPatterns": 42,
  "totalAttempts": 1247,
  "avgSuccessRate": 0.87,
  "improvementPotential": "High - 15 patterns have < 70% success rate"
}
```

### Optimierungs-Empfehlungen
```
1. Pattern 'date-pattern' (success: 0.42) → Review regex for OCR errors
2. Pattern 'amount-pattern' (success: 0.89) → Good! Reuse for other fields
3. New pattern detected: 'vendor-reference' (frequency: 8, success: 0.88)
```

## Best Practices

1. **Keine Autokorrekturen**: Empfehlungen sind nur Hinweise
2. **Manuelles Review**: Ein Mensch muss Änderungen genehmigen
3. **Versionierung**: Jede Optimierung wird dokumentiert
4. **Audit-Trail**: Wer hat was wann geändert?

## Archivierung

```bash
# Learning-Daten nach 1 Jahr archivieren
# Aber NICHT löschen!
tar -czf learning_archive_2023.tar.gz learning/
```

---

**Letzte Aktualisierung**: 2026-01-15  
**Verantwortung**: ML/Learning Team  
**Kritische Regel**: Data Generation ist NICHT erlaubt!
