# Example Schemas for Testing

Dieses Verzeichnis enthält 2 produktionsreife Beispiel-Schemas zur Demonstration und zum Testen der Schema-basierten Extraction.

---

## Schema 1: Invoice Extraction (Dokument-basiert)

**Datei**: `invoice-schema.json`  
**Beispiel**: `invoice-example-1.json`

### Zweck
Automatische Extraction von Rechnungsdaten aus PDF, Word und Bild-Dokumenten.

### Unterstützte Felder
- **Rechnungskopf**: Nummer, Datum, Fälligkeitsdatum
- **Rechnungssteller**: Name, Adresse, Steuernummer, E-Mail
- **Rechnungsempfänger**: Name, Adresse
- **Rechnungspositionen**: Beschreibung, Menge, Einzelpreis, Gesamtpreis
- **Summen**: Zwischensumme, Steuersatz, Steuerbetrag, Gesamtbetrag
- **Zahlungsdetails**: Zahlungsbedingungen, Bankkonten

### Extraction-Anwendungsfall

```bash
# 1. Schema hochladen
curl -X POST http://localhost:3000/api/schema/upload \
  -F "schema=@invoice-schema.json" \
  -F "examples=@invoice-example-1.json" \
  -F "schemaName=invoice-2026"

# Response:
# {
#   "schemaId": "uuid-xxxxx",
#   "fieldsCount": 15,
#   "examplesCount": 1
# }

# 2. Regeln generieren
curl -X POST http://localhost:3000/api/schema/uuid-xxxxx/generate-rules \
  -H "Content-Type: application/json" \
  -d '{"aggressiveness": 0.8, "customKeywords": ["invoice", "total", "amount"]}'

# Response:
# {
#   "rules": [
#     { "field": "invoiceNumber", "confidence": 0.98, "patterns": [...] },
#     { "field": "totalAmount", "confidence": 0.95, "patterns": [...] },
#     ...
#   ],
#   "stats": { "averageConfidence": 0.94, "rulesCount": 13 }
# }

# 3. Regeln verwenden
# Die generierten Regeln können jetzt auf echte PDF-/Word-Rechnungen angewandt werden
```

### Confidence-Schwellwerte (Erwartung)
- **invoiceNumber**: 0.95+ (eindeutiges Format)
- **totalAmount**: 0.92+ (häufig in Bold/Großdruck)
- **invoiceDate**: 0.93+ (spezifisches Datumsformat)
- **vendor/name**: 0.88+ (normalerweise oben)
- **lineItems**: 0.85+ (Tabellenerkennung erforderlich)

---

## Schema 2: REST API Response Extraction (JSON-basiert)

**Datei**: `api-response-schema.json`  
**Beispiel**: `api-response-example-1.json`

### Zweck
Automatische Struktur-Extraction aus REST API Responses zur Compliance und Audit-Logging.

### Unterstützte Felder
- **Request-Info**: Endpoint, Methode, Zeitstempel
- **Benutzer**: Benutzer-ID, Name, E-Mail, Rolle, Abteilung
- **Response**: Status-Code, Response-Zeit, Datensätze
- **Pagination**: Seite, Gesamtseiten, Einträge pro Seite
- **Compliance**: GDPR-Konformität, Verschlüsselung, Audit-Logging
- **Metadaten**: Request-ID, Correlation-ID, Cache-Status

### Extraction-Anwendungsfall

```bash
# 1. Schema hochladen
curl -X POST http://localhost:3000/api/schema/upload \
  -F "schema=@api-response-schema.json" \
  -F "examples=@api-response-example-1.json" \
  -F "schemaName=api-response-audit"

# Response:
# {
#   "schemaId": "uuid-yyyyy",
#   "fieldsCount": 22,
#   "examplesCount": 1
# }

# 2. Regeln generieren (mit Compliance-Focus)
curl -X POST http://localhost:3000/api/schema/uuid-yyyyy/generate-rules \
  -H "Content-Type: application/json" \
  -d '{
    "aggressiveness": 0.9,
    "customKeywords": [
      "responseCode", "userId", "complianceFlags",
      "gdprCompliant", "auditLogged", "timestamp"
    ]
  }'

# Response:
# {
#   "rules": [
#     { "field": "responseCode", "confidence": 0.99, "patterns": [...] },
#     { "field": "userId", "confidence": 0.96, "patterns": [...] },
#     { "field": "gdprCompliant", "confidence": 0.97, "patterns": [...] },
#     ...
#   ],
#   "stats": { "averageConfidence": 0.95, "rulesCount": 18 }
# }

# 3. API-Logs parsen
# Die generierten Regeln können auf REST-API Logs angewandt werden,
# um automatisch Compliance-Metriken zu extrahieren
```

### Compliance-Fokus
- **GDPR-Tracking**: Findet GDPR-Konformitäts-Flags automatisch
- **Audit-Logging**: Extrahiert Request-ID & Correlation-ID
- **Sicherheit**: Erkennt Verschlüsselung & Authentifizierung
- **Performance**: Response-Zeiten für SLA-Überwachung

---

## Wie man diese Schemas testet

### Option 1: Über Docker (empfohlen)
```bash
# Starte die App
.\start-docker.ps1

# Öffne die Frontend (http://localhost)
# Oder teste mit curl (siehe Beispiele oben)
```

### Option 2: Über lokale Entwicklung
```bash
# Terminal 1: Backend starten
npm --prefix backend start

# Terminal 2: Frontend starten
npm --prefix frontend run dev

# Browser: http://localhost:5173
```

### Option 3: Direkt mit curl
```bash
# Alle curl-Beispiele siehe oben
```

---

## Statistiken

| Metrik | Invoice | API Response |
|--------|---------|--------------|
| Schemafelder | 15 | 22 |
| Erforderliche Felder | 6 | 6 |
| Schachtelungstiefe | 3 (vendor/buyer/lineItems) | 4 (user/request/response/metadata) |
| Erwartet. Confidence | 0.90-0.98 | 0.93-0.99 |

---

## Nächste Schritte

1. **Hochladen**: Verwende Upload-Endpoint um diese Schemas in die App zu laden
2. **Generieren**: Lasse Regeln mit verschiedenen Aggressiveness-Werten generieren
3. **Testen**: Wende die Regeln auf echte Daten an
4. **Optimieren**: Passe customKeywords an für bessere Ergebnisse
5. **Exportieren**: Speichere erfolgreiche Regeln für Produktionsverwendung

---

**Version**: 0.18.0  
**Erstellt**: 8.7.2026  
**Für**: Schema-driven Rule Generation (Phase 15+)
