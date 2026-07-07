# Testset: invoice_001

**Referenz-Extraktionsergebnis für Phase 12 Integration Testing**

## Überblick

Dieses Testset enthält eine vollständige Beispiel-Rechnungsextraktionen mit allen 9 Pipeline-Schritten dokumentiert.

## Dateien

### 1. Quellendokument
- **Datei**: `examples/source/invoice_001.txt`
- **Format**: Text (Mock PDF)
- **Inhalt**: Deutsch-sprachige Rechnung mit:
  - Rechnungssteller: TechSolve GmbH
  - Rechnungsempfänger: Acme Corporation GmbH
  - 4 Positionen
  - Gesamtbetrag: 38.080,00 EUR
  - Vollständige Bankdetails

### 2. Extraktionsregeln
- **Datei**: `extraction-rules/invoice.txt`
- **Beschreibung**: 16 Extraktionsfelder mit:
  - Patterns und Suchkriterien
  - Confidence-Schwellen (min. 85-98%)
  - Validierungsregeln
  - Post-Extraction Anforderungen

### 3. Schema
- **Datei**: `extraction-rules/schemas/invoice-v1.0.0.json`
- **Format**: JSON Schema Draft-07
- **Validiert**: Alle 16 Felder mit Typen und Constraints

### 4. Erwartetes Ergebnis
- **Datei**: `examples/expected-json/invoice_001.json`
- **Struktur**: Komplettes Extraktionsergebnis mit:
  - Alle 16 Felder erfolgreich extrahiert
  - Confidence Scores (91-98%)
  - SourceReferences mit Chunk-IDs, Seiten, Text-Snippets
  - Audit Trail der 6 Pipeline-Schritte
  - Qualitätsmetriken

## Erwartete Extraktionsergebnisse

| Feld | Wert | Confidence | Status |
|------|------|-----------|---------|
| invoiceNumber | INV-202406-0142 | 0.98 | ✅ PASS |
| invoiceDate | 2024-07-06 | 0.97 | ✅ PASS |
| dueDate | 2024-08-31 | 0.96 | ✅ PASS |
| customerName | Acme Corporation GmbH | 0.95 | ✅ PASS |
| customerEmail | info@acmecorp.de | 0.94 | ✅ PASS |
| customerAddress (komplett) | Berlin, 10115 | 0.92-0.94 | ✅ PASS |
| vendorName | TechSolve GmbH | 0.96 | ✅ PASS |
| vendorTaxId | DE287654321 | 0.97 | ✅ PASS |
| lineItems (4 Positionen) | 15000 + 9000 + 5500 + 2500 | 0.91-0.95 | ✅ PASS |
| subtotal | 32.000,00 EUR | 0.95 | ✅ PASS |
| taxRate | 19 % | 0.97 | ✅ PASS |
| taxAmount | 6.080,00 EUR | 0.95 | ✅ PASS |
| totalAmount | 38.080,00 EUR | 0.98 | ✅ PASS |
| currency | EUR | 0.98 | ✅ PASS |
| paymentTerms | NET30 | 0.96 | ✅ PASS |
| bankDetails (komplett) | IBAN + BIC | 0.94-0.97 | ✅ PASS |

## Pipeline Audit Trail

```
Step 1 (14:32:15): extraction_started
Step 2 (14:32:18): parsing_complete
Step 3 (14:32:20): chunking_complete (4 chunks)
Step 4 (14:32:22): extraction_complete
Step 5 (14:32:23): hallucination_check (No hallucinations)
Step 6 (14:32:24): validation_complete (All valid)

Total Duration: 9 seconds
Quality Score: 0.945
Hallucination Risk: 0.02
```

## Validierungen

✅ **Numerisch**:
- totalAmount (38.080) = subtotal (32.000) + tax (6.080)
- All line items sum correctly

✅ **Logisch**:
- invoiceDate (06.07.2024) < dueDate (31.08.2024)
- customerName ≠ vendorName
- All required fields present

✅ **Format**:
- invoiceNumber matches pattern: INV-XXXXXX
- Dates in ISO format: YYYY-MM-DD
- Tax ID matches: DE + 9 digits
- IBAN/BIC valid

## Verwendung

Dieses Testset dient zur Validierung:

1. **End-to-End Extraktion**: Parser → Chunking → Extraction → Validation
2. **SourceReference Tracking**: Jedes Feld trackt seine Quelle
3. **Quality Scoring**: Confidence Metrics korrekt berechnet
4. **Hallucination Detection**: Keine Halluzinationen erkannt
5. **Audit Trail**: Komplette Nachvollziehbarkeit

## Integration Testing

**Test-Szenarien**:

```bash
# 1. Parser Test
POST /api/extract
Body: { file: invoice_001.txt }
Expected: Parsed document with chunks

# 2. Extraction Pipeline Test
POST /api/extract/pipeline
Body: { documentId: invoice_001, schema: invoice }
Expected: 16 fields extracted with confidence > 0.90

# 3. Quality Evaluation
POST /api/extract/quality
Body: { result: {...} }
Expected: qualityScore >= 0.94

# 4. Audit Report Export
POST /api/audit/export
Body: { documentId: invoice_001, format: json }
Expected: Complete audit trail with SourceReferences
```

## Referenz-Dokumentation

- 📄 Schema: [invoice-v1.0.0.json](../extraction-rules/schemas/invoice-v1.0.0.json)
- 📋 Regeln: [invoice.txt](../extraction-rules/invoice.txt)
- 📑 Ergebnis: [invoice_001.json](expected-json/invoice_001.json)
- 📝 Quelle: [invoice_001.txt](source/invoice_001.txt)

---

**Version**: 1.0.0 (Phase 12)  
**Created**: 2024-07-06  
**Status**: ✅ REFERENCE DATASET COMPLETE
