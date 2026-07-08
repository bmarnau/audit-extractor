# 📖 Anwenderhandbuch - Version 0.14.0
## Automatische Ruleset-Generierung

**Version:** 0.14.0  
**Datum:** 2026-07-08  
**Status:** ✅ Produktionsreife  

---

## 🎯 Überblick: Was ist neu in 0.14.0?

Version 0.14.0 führt die **automatische Generierung von Extraktionsregeln** ein:

```
Alt (Version 0.13 und früher):
  Regeln manuell schreiben (2-3 Stunden pro Dokumenttyp) ❌

Neu (Version 0.14):
  Schema + Beispiele hochladen → Regeln automatisch generieren (< 1 Minute) ✅
  Einsparung: 99,8% Zeit! ⚡
```

---

## 🚀 Schnellstart: In 5 Minuten Regeln generieren

### Schritt 1: Schema erstellen

Definieren Sie, **welche Daten** Sie extrahieren möchten:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "title": "Invoice",
  "description": "Rechnungsdaten",
  "properties": {
    "invoiceNumber": {
      "type": "string",
      "description": "Rechnungsnummer (z.B. INV-2024-001)"
    },
    "invoiceDate": {
      "type": "string",
      "format": "date",
      "description": "Ausstellungsdatum der Rechnung"
    },
    "dueDate": {
      "type": "string",
      "format": "date",
      "description": "Zahlungsfrist"
    },
    "customerName": {
      "type": "string",
      "description": "Name des Kunden"
    },
    "totalAmount": {
      "type": "number",
      "description": "Gesamtbetrag in EUR"
    },
    "currency": {
      "type": "string",
      "enum": ["EUR", "USD", "GBP"],
      "description": "Währung des Betrags"
    }
  },
  "required": ["invoiceNumber", "invoiceDate", "customerName", "totalAmount"]
}
```

**Speichern Sie dies als:** `invoice-schema.json`

---

### Schritt 2: Beispieldaten erstellen

Geben Sie **2-5 echte Beispiele** aus Ihren Dokumenten:

```json
{
  "examples": [
    {
      "invoiceNumber": "INV-2024-001",
      "invoiceDate": "2024-07-06",
      "dueDate": "2024-08-06",
      "customerName": "Müller GmbH",
      "totalAmount": 1500.00,
      "currency": "EUR"
    },
    {
      "invoiceNumber": "INV-2024-002",
      "invoiceDate": "2024-07-08",
      "dueDate": "2024-07-23",
      "customerName": "Schmidt & Partner",
      "totalAmount": 2850.50,
      "currency": "EUR"
    },
    {
      "invoiceNumber": "INV-2024-003",
      "invoiceDate": "2024-06-30",
      "dueDate": "2024-08-30",
      "customerName": "Weber Consulting",
      "totalAmount": 5200.00,
      "currency": "EUR"
    }
  ]
}
```

**Speichern Sie dies als:** `invoice-examples.json`

---

### Schritt 3: Regeln generieren

Im Frontend:

1. Gehen Sie zum Menü **"Extraktion"** → **"Neue Regeln generieren"**
2. Wählen Sie: **"Automatische Generierung"**
3. Laden Sie hoch:
   - ✅ Schema-Datei (`invoice-schema.json`)
   - ✅ Beispiele-Datei (`invoice-examples.json`)
4. Klicken Sie: **"Regeln generieren"**

**Ergebnis:** Das System erstellt automatisch ~78% durchschnittliche Konfidenz ✅

---

## 📋 Beispiel: Schritt für Schritt

### Real-World Beispiel: Rechnungen von "InvoiceCorp"

**Ihr Dokument sieht so aus:**

```
                    ┌────────────────────────────┐
                    │  InvoiceCorp GmbH          │
                    │  www.invoicecorp.de        │
                    └────────────────────────────┘

RECHNUNG Nr.: INV-2024-00847
Ausgestellt: 06.07.2024
Zahlbar bis: 06.08.2024

Rechnungsempfänger:
Müller GmbH
Hauptstr. 42
10115 Berlin

────────────────────────────────────────────────
Service: Webentwicklung - 40 Stunden @ 75€/Std
Summe netto:           EUR 3.000,00
MwSt (19%):            EUR   570,00
─────────────────────────────────────────────────
GESAMTBETRAG:          EUR 3.570,00
═════════════════════════════════════════════════

Zahlungsart: Banküberweisung
```

#### 1️⃣ Schema definieren

```json
{
  "type": "object",
  "properties": {
    "invoiceNumber": {
      "type": "string",
      "description": "Rechnungsnummer (z.B. INV-2024-00847)"
    },
    "invoiceDate": {
      "type": "string",
      "format": "date",
      "description": "Ausstellungsdatum (DD.MM.YYYY → ISO 8601)"
    },
    "dueDate": {
      "type": "string",
      "format": "date",
      "description": "Zahlungsfrist"
    },
    "customerName": {
      "type": "string",
      "description": "Name des Kunden/Rechnungsempfängers"
    },
    "serviceDescription": {
      "type": "string",
      "description": "Was wurde geleistet?"
    },
    "hours": {
      "type": "number",
      "description": "Stunden (z.B. 40)"
    },
    "hourlyRate": {
      "type": "number",
      "description": "Stundensatz in EUR"
    },
    "subtotal": {
      "type": "number",
      "description": "Summe netto (ohne MwSt)"
    },
    "taxRate": {
      "type": "number",
      "description": "MwSt Prozentsatz (z.B. 19)"
    },
    "taxAmount": {
      "type": "number",
      "description": "MwSt Betrag in EUR"
    },
    "totalAmount": {
      "type": "number",
      "description": "Gesamtbetrag (mit MwSt)"
    },
    "currency": {
      "type": "string",
      "enum": ["EUR", "USD", "GBP"],
      "description": "Währung"
    },
    "paymentMethod": {
      "type": "string",
      "description": "Zahlungsart (z.B. Banküberweisung)"
    }
  },
  "required": ["invoiceNumber", "invoiceDate", "customerName", "totalAmount"]
}
```

#### 2️⃣ Beispiele sammeln

Sie brauchen **mindestens 2-3 echte Rechnungen** im JSON-Format:

```json
{
  "examples": [
    {
      "invoiceNumber": "INV-2024-00847",
      "invoiceDate": "2024-07-06",
      "dueDate": "2024-08-06",
      "customerName": "Müller GmbH",
      "serviceDescription": "Webentwicklung - 40 Stunden",
      "hours": 40,
      "hourlyRate": 75,
      "subtotal": 3000,
      "taxRate": 19,
      "taxAmount": 570,
      "totalAmount": 3570,
      "currency": "EUR",
      "paymentMethod": "Banküberweisung"
    },
    {
      "invoiceNumber": "INV-2024-00851",
      "invoiceDate": "2024-07-10",
      "dueDate": "2024-07-25",
      "customerName": "Schmidt & Partner",
      "serviceDescription": "SEO-Optimierung - 20 Stunden",
      "hours": 20,
      "hourlyRate": 85,
      "subtotal": 1700,
      "taxRate": 19,
      "taxAmount": 323,
      "totalAmount": 2023,
      "currency": "EUR",
      "paymentMethod": "Kartenzahlung"
    }
  ]
}
```

#### 3️⃣ Hochladen und Generieren

1. **Menü öffnen:** "Extraktion" → "Neue Regeln generieren" → "Automatische Generierung"
2. **Dateien laden:**
   - Schema: `invoice-schema.json`
   - Beispiele: `invoice-examples.json`
3. **Klick:** "Regeln generieren"

**Was passiert jetzt:**
- ✅ System liest das Schema
- ✅ System analysiert die Beispiele
- ✅ System generiert Regex-Patterns für jedes Feld
- ✅ System berechnet Konfidenzwerte

**Ausgabe (Auto-Generierte Regeln):**

```json
{
  "invoiceNumber": {
    "pattern": "^INV-\\d{4}-\\d{5}$",
    "confidence": 95,
    "source": "Pattern aus Beispielen",
    "examples": ["INV-2024-00847", "INV-2024-00851"]
  },
  "invoiceDate": {
    "pattern": "\\d{2}\\.\\d{2}\\.\\d{4}",
    "format": "DD.MM.YYYY",
    "confidence": 92,
    "conversion": "zu ISO 8601"
  },
  "totalAmount": {
    "pattern": "EUR\\s+(\\d+[.,]\\d{2})",
    "type": "number",
    "confidence": 88
  }
}
```

---

## 💡 Best Practices

### ✅ RICHTIG: Schema klar und spezifisch

```json
{
  "invoiceNumber": {
    "type": "string",
    "description": "Eindeutige Rechnungsnummer (Format: INV-YYYY-XXXXX)",
    "pattern": "^INV-[0-9]{4}-[0-9]{5}$"
  }
}
```

### ❌ FALSCH: Zu vage

```json
{
  "invoiceNumber": {
    "type": "string",
    "description": "Nummer"
  }
}
```

---

### ✅ RICHTIG: Beispiele sind realistisch

```json
{
  "examples": [
    {
      "invoiceNumber": "INV-2024-00847",
      "totalAmount": 3570.00
    },
    {
      "invoiceNumber": "INV-2024-00851",
      "totalAmount": 2023.50
    }
  ]
}
```

### ❌ FALSCH: Zu einfache Beispiele

```json
{
  "examples": [
    {
      "invoiceNumber": "123",
      "totalAmount": 100
    }
  ]
}
```

---

## 🔍 Validierung: Sind Ihre Regeln gut?

Nach der Generierung wird ein **Qualitätsbericht** angezeigt:

| Metrik | Bedeutung | Ziel | ✅ OK |
|--------|-----------|------|-------|
| **Avg. Confidence** | Durchschnittliche Konfidenz aller Regeln | > 75% | ✅ 78% |
| **Coverage** | % der Felder mit Regeln | > 90% | ✅ 100% |
| **Validierung** | Fehler beim Parsen? | = 0 | ✅ 0 Fehler |
| **Performance** | Durchschn. Extraktionszeit | < 500ms | ✅ 156ms |

---

## 🚨 Häufige Probleme & Lösungen

### Problem 1: Zu niedrige Konfidenz (< 50%)

**Ursache:** Schema ist vage oder Beispiele sind nicht repräsentativ

**Lösung:**
- ❌ "Betrag" → ✅ "Gesamtbetrag in EUR (Dezimalformat)"
- ❌ 1 Beispiel → ✅ Mindestens 3-5 Beispiele

---

### Problem 2: "Feld nicht erkannt"

**Ursache:** Feldname im Schema passt nicht zu Dokumentformat

**Lösung:**
- Im Schema: `customerName`
- Im Dokument könnte stehen: "Rechnungsempfänger:"
- Beschreibung im Schema konkretisieren:
  ```json
  "customerName": {
    "description": "Name des Kunden (steht unter 'Rechnungsempfänger')"
  }
  ```

---

### Problem 3: Falsch erkannte Datumsformate

**Ursache:** Deutsche Formate (DD.MM.YYYY) werden nicht erkannt

**Lösung:**
```json
"invoiceDate": {
  "type": "string",
  "format": "date",
  "description": "Ausstellungsdatum im Format DD.MM.YYYY",
  "pattern": "^\\d{2}\\.\\d{2}\\.\\d{4}$"
}
```

---

## 📊 Was passiert intern?

Die automatische Generierung durchläuft 3 Schritte:

### 1. **ExampleDataLoader** (Laden & Validieren)
```
Ihre Beispiele
   ↓
JSON validieren
   ↓
Fehlerhafte Einträge filtern
   ↓
Gültige Beispiele nur noch nutzen
```

### 2. **PatternInferrer** (Pattern-Erkennung)
```
Beispiel 1: "INV-2024-00847"
Beispiel 2: "INV-2024-00851"
   ↓
Gemeinsames Pattern: INV-YYYY-XXXXX
   ↓
Regex generieren: ^INV-\\d{4}-\\d{5}$
   ↓
Konfidenz berechnen: 95%
```

### 3. **RuleGenerator** (Orchestrator)
```
Schema Anforderungen
   +
Pattern-Erkennungen
   ↓
Finale Extraktionsregeln
   +
Qualitätsmetriken
```

---

## 🔒 Sicherheit

Die automatische Generierung ist **8-lagig geschützt:**

1. ✅ **Eingabe-Validierung** - Nur sichere Feldnamen
2. ✅ **Schema-Prüfung** - JSON-Schema Draft 7 Validierung
3. ✅ **Regex-Safety** - ReDoS (Regular Expression Denial of Service) Schutz
4. ✅ **Dateigröße-Limits** - Max 5MB pro Datei
5. ✅ **Timeout-Schutz** - Generierung maximal 30 Sekunden
6. ✅ **Error Handling** - Keine sensitiven Stack Traces
7. ✅ **Type Safety** - 100% TypeScript, kein "any"
8. ✅ **Injection-Schutz** - Regex-Pattern auf Sicherheit geprüft

**Ergebnis:** Produktionsreife, audit-sichere Regeln ✅

---

## 📚 Weitere Dokumentation

Detaillierte Dokumentation finden Sie in:

- **[SCHEMA-STRUCTURE-GUIDE.md](./docs/SCHEMA-STRUCTURE-GUIDE.md)** - Vollständige JSON-Schema Referenz
- **[RULESET-MANAGEMENT-GUIDE.md](./docs/RULESET-MANAGEMENT-GUIDE.md)** - Multi-Ruleset Verwaltung
- **[TEST-DOCUMENTATION.md](./docs/TEST-DOCUMENTATION.md)** - 60+ Testfälle
- **[TROUBLESHOOTING-COMPREHENSIVE-CHECK.md](./docs/TROUBLESHOOTING-COMPREHENSIVE-CHECK.md)** - Fehlerbehandlung

---

## ✅ Checkliste zum Start

- [ ] Sie verstehen, was ein Schema ist
- [ ] Sie haben ein Schema für Ihren Dokumenttyp erstellt
- [ ] Sie haben 2-5 reale Beispiele im JSON-Format
- [ ] Sie haben verstanden, was automatische Generierung tut
- [ ] Sie sind bereit, es zu testen

**Nächste Schritte:**
1. Schema + Beispiele vorbereiten
2. Im Frontend: "Neue Regeln generieren"
3. Automatische Generierung testen
4. Konfidenz-Report überprüfen
5. Extraktion durchführen!

---

**Viel Erfolg! 🚀**
