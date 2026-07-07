# 📖 BENUTZERHANDBUCH: Extraction mit Regeln

## Phase 14 - Dokumente extrahieren mit Regelwerk

**Zielgruppe:** Alle Nutzer (auch ohne technische Kenntnisse)  
**Letzte Aktualisierung:** 2026-07-07  
**Version:** 1.0.0

---

## 🎯 Überblick in 30 Sekunden

```
Du brauchst 3 Dinge:
1️⃣  Ein Dokument (PDF oder HTML)
2️⃣  Einen Dokumenttyp (z.B. "Rechnungen")
3️⃣  Die Extraktionsregeln (werden automatisch geladen)

→ System extrahiert automatisch Daten
→ Zeigt Dir Ergebnisse + Verbesserungsvorschläge
→ Regeln werden mit jedem Upload besser
```

---

## 📁 Verzeichnis-Struktur verstehen

Das System nutzt diese Ordner:

```
📦 Projekt-Root
├── 📂 extraction-rules/
│   ├── invoice.json          ← Regeln für Rechnungen
│   ├── po.json               ← Regeln für Bestellungen (später)
│   ├── delivery-note.json    ← Regeln für Lieferscheine (später)
│   └── schemas/
│       └── *.json            ← Datenstruktur-Definitionen
│
├── 📂 source-documents/
│   ├── 📂 html/              ← Hier kommen HTML-Dateien hin
│   │   └── invoice.html      (Beispiel)
│   ├── 📂 pdf/               ← Hier kommen PDF-Dateien hin
│   │   └── invoice.pdf       (Beispiel)
│   └── 📂 docx/              ← Hier kommen DOCX-Dateien hin
│
├── 📂 results/
│   ├── 📂 json/              ← Extraktions-Ergebnisse (Auto-Generiert)
│   │   ├── extraction-1720347000123-abc12345.json
│   │   ├── extraction-1720347015456-def67890.json
│   │   └── ...
│   └── 📂 reports/           ← Qualitäts-Reports (später)
│
└── 📂 learning/
    ├── 📂 reflections/       ← Lern-Daten (Auto-Generiert)
    │   └── invoice-batch-2026-07-07.json
    └── 📂 corrections/       ← Manuelle Regel-Edits (Auto-Generiert)
        └── manual-edits-log.json
```

**Wichtig:**
- ✅ Du brauchst NUR: Dokumente in `source-documents/{html,pdf}/` ablegen
- ✅ Regelwerk wird AUTOMATISCH aus `extraction-rules/` geladen
- ✅ Ergebnisse erscheinen AUTOMATISCH in `results/json/`
- ✅ Lern-Daten sammeln sich AUTOMATISCH in `learning/`

---

## 🚀 SCHRITT 1: Dokumenttyp wählen

**Frage: Welche Art von Dokument möchte ich extrahieren?**

Verfügbare Dokumenttypen:

| Typ | Datei | Beschreibung | Status |
|-----|-------|-------------|--------|
| **Rechnungen** | `invoice.json` | Rechnungsnummern, Kundendaten, Beträge | ✅ Produktiv |
| Bestellungen | `po.json` | (wird noch implementiert) | ⏳ Geplant |
| Lieferscheine | `delivery-note.json` | (wird noch implementiert) | ⏳ Geplant |

**Beispiel:** Du hast eine Rechnung PDF → Wähle `invoice` Dokumenttyp

---

## 🚀 SCHRITT 2: Dokument hochladen

### Option A: Über Web-Oberfläche (Später)

```
1. Öffne: http://localhost:5173
2. Gehe zu: "Extraction Workbench"
3. Wähle: Dokumenttyp (z.B. "Rechnungen")
4. Klick: "Datei wählen" oder Drag & Drop
5. Klick: "Extrahieren"
6. Warte: 1-3 Sekunden
7. Ergebnis: JSON mit gefundenen Feldern
```

### Option B: Über API (Für Entwickler)

```bash
# Beispiel: PDF-Datei hochladen
curl -X POST http://localhost:3000/api/extract/pdf \
  -F "document=@invoice.pdf" \
  -F "docType=invoice"

# Beispiel: HTML-Datei hochladen
curl -X POST http://localhost:3000/api/extract/html \
  -F "document=@invoice.html" \
  -F "docType=invoice"
```

---

## 📊 SCHRITT 3: Ergebnisse verstehen

Nach erfolgreichem Upload erhältst du ein JSON-Ergebnis:

```json
{
  "resultId": "extraction-1720347000123-abc12345",
  "documentReference": {
    "fileName": "invoice.pdf",
    "docType": "invoice",
    "uploadedAt": "2026-07-07T14:30:00Z"
  },
  "extractedFields": [
    {
      "field": "invoiceNumber",
      "value": "INV-202406-0142",
      "confidence": 0.92,
      "sources": [...]
    },
    {
      "field": "customerName",
      "value": "Acme Corporation GmbH",
      "confidence": 0.88,
      "sources": [...]
    },
    {
      "field": "totalAmount",
      "value": "38.080,00",
      "confidence": 0.91,
      "sources": [...]
    }
  ],
  "missingFields": ["dueDate", "paymentTerms"],
  "warnings": [
    {
      "field": "dueDate",
      "level": "warning",
      "message": "Optional field \"dueDate\" not found"
    }
  ]
}
```

**Wie interpretiere ich das?**

| Feld | Bedeutung | Beispiel |
|------|-----------|----------|
| `extractedFields` | ✅ Diese Felder wurden gefunden | invoiceNumber, customerName, totalAmount |
| `missingFields` | ❌ Diese Felder wurden NICHT gefunden | dueDate, paymentTerms |
| `confidence` | 🎯 Wie sicher ist die Extraktion? (0-1) | 0.92 = 92% sicher |
| `warnings` | ⚠️ Hinweise & Probleme | "Optional field not found" |

---

## 💡 SCHRITT 4: Regeln verstehen & verbessern

### Was ist eine "Regel"?

Eine Regel ist eine **Beschreibung, wie ein Feld zu finden ist**:

```json
{
  "field": "invoiceNumber",
  "pattern": "(INV-[0-9]{6}|Invoice #[0-9]{4}-[0-9]{2})",
  "confidence": 0.92,
  "required": true,
  "description": "Eindeutige Rechnungsnummer (z.B. INV-202406-0142)"
}
```

**Was bedeuten die Teile?**

- **field:** Der Name des Feldes (z.B. `invoiceNumber`)
- **pattern:** Suchmuster (Regex) um das Feld zu finden
- **confidence:** Wie zuverlässig ist dieses Muster? (0-1)
- **required:** Muss dieses Feld vorhanden sein?
- **description:** Erklärung für Menschen

### Beispiel: Wie findet das System eine Rechnungsnummer?

```
Dokument enthält:
"RECHNUNG INV-202406-0142 vom 06.07.2024"

Regel Pattern:
"(INV-[0-9]{6})"  ← Sucht nach "INV-" gefolgt von 6 Ziffern

Ergebnis:
✅ Gefunden: "INV-202406-0142"
```

### Regeln verbessern: 3 Optionen

#### Option 1: Vertrauen auf AI-Vorschläge ✨

Wenn die Extraktion nur 65% sicher ist:

```
⚠️ System zeigt: "Rechnungsdatum nur 65% sicher"
💡 System schlägt vor: "Pattern sollte auch 'Datum:' berücksichtigen"
👆 Du klickst: "Vorschlag übernehmen"
✅ Neue Confidence: 92%
```

#### Option 2: Manuell editieren (Fortgeschritten)

```
Aktuelle Regel:
pattern: "INV-[0-9]{6}"

Problem:
"Invoice-2024-06" wurde nicht erkannt (aber sollte!)

Neue Regel:
pattern: "(INV-[0-9]{6}|Invoice-[0-9]{4}-[0-9]{2})"

Ergebnis:
✅ Beide Formate funktionieren jetzt
✅ System speichert automatisch
✅ Alle nächsten Extraktion nutzen die bessere Regel
```

#### Option 3: Feedback nach Extraktion geben

```
1. Du erhältst Extraktions-Ergebnis
2. Du siehst: "Rechnungsdatum = 15.06.2024"
3. Du merkst: Das ist falsch! Sollte 06.07.2024 sein
4. Du klickst: "Diese Extraktion ist falsch"
5. System speichert das Feedback
6. System schlägt Regel-Verbesserung vor
7. Nächste Extraction nutzt bessere Regel
```

---

## 📈 SCHRITT 5: Qualität überwachen

### Wie gut funktioniert mein Regelwerk?

**API Endpoint:** `GET http://localhost:3000/api/extract/quality`

**Ergebnis zeigt:**

```json
{
  "summary": {
    "totalExtractions": 347,
    "successfulExtractions": 326,
    "overallSuccessRate": 0.94
  },
  "byDocType": {
    "invoice": {
      "count": 347,
      "avgSuccessRate": 0.94,
      "totalFields": 2541,
      "successfulFields": 2388
    }
  }
}
```

**Wie interpretiere ich das?**

- **totalExtractions:** Wie viele Dokumente wurden extrahiert? (347)
- **successfulExtractions:** Wie viele hatten mind. 80% Erfolgsrate? (326)
- **overallSuccessRate:** Durchschnittliche Erfolgsrate? (94% ✅)

**Ziele:**

| Erfolgsrate | Status | Aktion |
|---|---|---|
| 90-100% | ✅ Sehr gut | Keine Änderungen nötig |
| 75-89% | 🟡 Okay | Überprüfe problematische Felder |
| < 75% | ❌ Schlecht | Regeln überarbeiten |

---

## 🔄 SCHRITT 6: Batch-Extraktion (viele Dokumente)

Wenn du 100 Rechnungen auf einmal extrahieren möchtest:

```
1. Lege alle PDFs in: source-documents/pdf/
2. Öffne Web-Oberfläche → "Extraction Workbench"
3. Klick: "Batch Mode"
4. Wähle: "Rechnungen" (invoice)
5. Klick: "Alle Dateien extrahieren"
6. System verarbeitet automatisch alle
7. Ergebnis: Excel-Export mit allen Feldern
```

**Ergebnis-Struktur:**

```
results/json/
├── extraction-1720347000001-id1.json  ← Rechnung 1
├── extraction-1720347000002-id2.json  ← Rechnung 2
├── extraction-1720347000003-id3.json  ← Rechnung 3
└── ...
```

---

## 🧠 SCHRITT 7: Learning Loop verstehen

Das ist die Stärke des Systems: **Regeln werden mit jedem Upload besser!**

### Der Lern-Prozess:

```
1️⃣  Tag 1: Du ladest 10 Rechnungen hoch
    → System extrahiert mit aktuellen Regeln
    → Erfolgsrate: 80%
    → System speichert Feedback

2️⃣  Tag 2: Du verbesserst 2 problematische Regeln
    → Startest manuell 5 neue Rechnungen
    → Erfolgsrate: 88%
    → System merkt sich Verbesserung

3️⃣  Tag 3: System nutzt jetzt bessere Regeln
    → Startest weitere 15 Rechnungen
    → Erfolgsrate: 94%
    → System schlägt weitere Optimierungen vor

4️⃣  Nach 1 Monat:
    → 500 Rechnungen verarbeitet
    → Erfolgsrate: 96%
    → Regeln sind gut trainiert
```

**Wo sehe ich die Lern-Daten?**

```
learning/
├── reflections/
│   ├── invoice-batch-2026-07-01.json  ← Auswertung Batch 1
│   ├── invoice-batch-2026-07-02.json  ← Auswertung Batch 2
│   └── invoice-batch-2026-07-07.json  ← Auswertung Batch heute
│
└── corrections/
    └── manual-edits-log.json          ← Alle Regel-Änderungen
```

---

## 🛠️ ADVANCED: Regel-Editor (Für Power-User)

### Regel Pattern testen: `/api/extract/validate`

```bash
curl -X POST http://localhost:3000/api/extract/validate \
  -H "Content-Type: application/json" \
  -d '{
    "pattern": "(INV-[0-9]{6})",
    "sampleText": "RECHNUNG INV-202406-0142 vom 06.07.2024"
  }'
```

**Antwort:**

```json
{
  "matched": true,
  "value": "INV-202406-0142",
  "confidence": 0.9,
  "matchCount": 1
}
```

### Alle verfügbaren Regelsätze auflisten: `/api/extract/rules`

```bash
curl http://localhost:3000/api/extract/rules
```

**Antwort:**

```json
{
  "rulesList": [
    {
      "docType": "invoice",
      "version": "1.0.5",
      "fieldCount": 8,
      "lastModified": "2026-07-07",
      "modifyCount": 5,
      "successRate": 0.94
    }
  ]
}
```

---

## ❓ FAQ - Häufige Fragen

### F: Wo speichert das System die Ergebnisse?

**A:** Automatisch in `results/json/` - jedes Ergebnis bekommt eine eindeutige ID:
```
extraction-1720347000123-abc12345.json
```

### F: Kann ich die Ergebnisse wieder löschen?

**A:** Ja, manuell - aber denk dran: Die Lern-Daten helfen dem System zu lernen!
Besser: Verschieben in `results/json/archive/` statt löschen.

### F: Was ist wenn 100% der Felder nicht gefunden werden?

**A:** Das ist normal! Gründe:
1. Dokument-Format ist sehr unterschiedlich
2. Regel-Pattern ist zu spezifisch
3. Feld fehlt im Dokument

Lösung: Regel anpassen oder zusätzliche Dokumenttypen definieren.

### F: Kann ich mehrere Dokumenttypen kombinieren?

**A:** Nicht direkt, aber: Du kannst ein Dokument mit verschiedenen Regelsätzen testen:
```bash
# Mit Rechnung-Regeln versuchen
POST /api/extract/pdf?docType=invoice

# Mit Bestellung-Regeln versuchen
POST /api/extract/pdf?docType=po
```

### F: Wie lange dauert eine Extraktion?

**A:** In der Regel < 1 Sekunde:
- PDF Parser: ~100-300ms
- Regel-Matching: ~10-50ms
- JSON Serialisierung: ~5ms

Bei großen PDFs (> 50 MB): kann bis zu 5 Sekunden dauern.

---

## 📞 Support & Troubleshooting

### Problem: "Datei wird nicht erkannt"

```
Error: Only PDF, HTML, and DOCX files are allowed
```

**Lösung:**
- Prüfe Datei-Endung (.pdf, .html, .docx)
- Prüfe Datei-Größe (Max: 50 MB)
- Versuche PDF/HTML statt DOCX (DOCX kommt später)

### Problem: "Keine Felder gefunden"

```
extractedFields: []
missingFields: [all fields]
```

**Mögliche Gründe:**
1. Dokumenttyp ist falsch gewählt (probier einen anderen)
2. Dokumentformat ist ungewöhnlich (z.B. gescanntes Bild statt Text-PDF)
3. Regel-Pattern ist zu streng

**Lösung:**
1. Versuche `POST /api/extract/validate` um Pattern zu testen
2. Passe Regel an oder melde das Problem

### Problem: "Confidence Score ist sehr niedrig (< 0.5)"

**Bedeutung:** System ist unsicher bei diesem Feld

**Lösungen:**
1. Warte auf AI-Vorschlag zur Regel-Verbesserung
2. Überprüfe ob Feld im Dokument vorhanden ist
3. Melde Feedback: "Diese Extraktion ist falsch"

---

## 🎓 Best Practices

### ✅ Was sollte ich tun

1. **Regelmäßig feedgeben:** Nach jeder Extraktion: "War das korrekt?"
2. **Batches ähnlicher Dokumente:** Rechnungen von gleichem Anbieter zusammen verarbeiten
3. **Quality-Reports checken:** Monatlich: `GET /api/extract/quality`
4. **Learning-Daten verfolguen:** Schaue in `learning/reflections/` was das System lernt

### ❌ Was sollte ich vermeiden

1. **Falsche Dokumenttypen mischen:** Rechnungen + Bestellungen zusammen = schlecht
2. **Ignorieren von Warnings:** Wenn Confidence < 70%: Rule überprüfen!
3. **Zu spezifische Patterns:** Pattern: `INV-202406` findet nur DIESEN Monat!
4. **Keine Backups:** Mache regelmäßig Backups von `results/` und `extraction-rules/`

---

## 📅 Nächste Schritte (Roadmap)

- [x] Phase 14a: PDF + HTML Extraction
- [ ] Phase 14b: Rule Management UI
- [ ] Phase 14c: Learning & Feedback Loop
- [ ] Phase 14d: Multiple Document Types (PO, Delivery Notes)
- [ ] Phase 14e: Batch Processing UI
- [ ] Phase 15: Export zu Excel/CSV
- [ ] Phase 16: Multi-User RBAC

---

## 📚 Weitere Ressourcen

- [API Dokumentation](./PHASE14-API.md) - Für Entwickler
- [Rule-Format Spezifikation](./RULE-FORMAT.md) - Wie schreibe ich Regeln?
- [Architektur-Übersicht](../docs/ARCHITECTURE.md) - Wie funktioniert das System?

---

**Viel Erfolg beim Extrahieren! 🎉**

Fragen? → Frag nach Support oder check die API-Dokumentation.
