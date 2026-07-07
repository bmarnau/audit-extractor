# source-documents/

Speichert die Eingabe-Dokumente, die verarbeitet werden sollen.

## Struktur

```
source-documents/
├── pdf/          # PDF-Dateien
├── docx/         # Microsoft Word Dokumente
└── html/         # HTML-Dateien
```

## Richtlinien

- **Dateiformat**: Pro Typ ein Ordner
- **Benennung**: `DOKUMENTTYP_IDENTIFIER_DATUM.ext`
  - Beispiel: `invoice_acme_2024-01-15.pdf`
- **Größe**: Max. 100 MB pro Datei (unkomprimiert)
- **Sprache**: Beliebig, wird in Metadata dokumentiert

## Beispiele

```
pdf/
├── invoice_acme_2024-01-15.pdf
├── contract_vendor_2024-01-10.pdf
└── purchase_order_supplier_2024-01-05.pdf

docx/
├── proposal_client_2024-01-20.docx
└── manual_product_2024-01-18.docx

html/
├── webpage_pricing_2024-01-15.html
└── email_newsletter_2024-01-14.html
```

## Verarbeitung

1. Dokumente werden hochgeladen
2. SHA256-Hash wird berechnet (Integrität)
3. Parser konvertiert in einheitliches Format
4. Extraction-Rules werden zugeordnet
5. Extraktionsergebnisse werden in `results/` gespeichert

## Aufräumen

Alte Dokumente können gelöscht werden, wenn die Ergebnisse in `results/` archiviert wurden.
Hashes werden aufbewahrt für Audit-Trails.

---

**Letzte Aktualisierung**: 2026-01-15  
**Verantwortung**: Data Input Team
