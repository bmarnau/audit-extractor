# results/

Speichert die Extraktionsergebnisse nach erfolgreicher Verarbeitung.

## Struktur

```
results/
├── json/        # Extraktionsergebnisse (JSON)
├── images/      # Referenz-Bilder (bei Bedarf)
├── reports/     # Audit-Reports (Markdown, HTML)
└── README.md    # Diese Datei
```

## results/json/

**Zweck**: Speichert strukturierte Extraktionsergebnisse.

**Format**:
```json
{
  "resultId": "result-001",
  "documentReference": {
    "documentId": "invoice-123",
    "fileName": "Invoice_2024.pdf",
    "hash": "sha256:abc123..."
  },
  "extractedFields": [
    {
      "field": "invoiceNumber",
      "value": "INV-2024-001",
      "confidence": 0.99,
      "sources": [...]
    }
  ],
  "missingFields": [],
  "warnings": [],
  "extractedAt": "2024-01-15T10:35:00Z"
}
```

**Dateinamen**: `result_DOKUMENTID_TIMESTAMP.json`
- Beispiel: `result_invoice-123_2024-01-15T103500Z.json`

## results/images/

**Zweck**: Speichert Referenz-Bilder zur Validierung.

**Nicht für**:
- ❌ Screenshot des kompletten Dokuments
- ❌ OCR-Output

**Für**:
- ✅ Relevante Textausschnitte (als Bilder)
- ✅ Tabellen (zur visuellen Überprüfung)

## results/reports/

**Zweck**: Generiert lesbare Audit-Reports.

**Formate**:
- `result_RESULTID.md` (Markdown-Report)
- `result_RESULTID.html` (HTML-Report)
- `audit_trail_TIMESTAMP.json` (Audit-Trail)

**Beispiel Report** (Markdown):
```markdown
# Extraction Result: result-001

**Document**: Invoice_2024.pdf  
**Extracted at**: 2024-01-15T10:35:00Z

## Extracted Fields (3 / 8)

### invoiceNumber
- Value: INV-2024-001
- Confidence: 99%
- Source: Page 1, Header

### customerName
- Value: Acme Corporation
- Confidence: 95%
- Source: Page 1, "Bill To"

## Missing Fields (5)
- invoiceDate
- customerAddress
- dueDate
- paymentTerms
- lineItems
```

## Archivierung

1. **Nach 30 Tagen**: Results werden komprimiert
2. **Nach 90 Tagen**: Results können archiviert werden
3. **Audit-Trail**: Wird immer aufbewahrt (indefinit)

## Aufräumen

```bash
# Nur Test-Results löschen
rm results/json/result_test_*.json

# Alte Results archivieren (nicht löschen!)
tar -czf results_archive_2024-01.tar.gz results/
```

---

**Letzte Aktualisierung**: 2026-01-15  
**Verantwortung**: Output & Reporting Team
