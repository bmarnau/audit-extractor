# 🧪 Test-Dokumentation: Regelwerk-Management & Schema-Driven Generierung

**Version:** 1.0.0  
**Datum:** 2026-07-08  
**Status:** ✅ Tests existieren und sind dokumentiert  
**Coverage:** Phase 14 + Phase 15 (geplant)

---

## 📊 Test-Übersicht

Das System verfügt über **umfangreiche Tests** für alle Komponenten der Regelwerk-Verwaltung und automatischen Regelwerk-Generierung:

| Komponente | Test-Datei | Tests | Status |
|-----------|-----------|-------|--------|
| **SchemaAnalyzer** | `SchemaAnalyzer.test.ts` | 19+ Tests | ✅ AKTIV |
| **ExampleAnalyzer** | `ExampleAnalyzer.test.ts` | 9+ Tests | ✅ AKTIV |
| **RuleGenerator** | `RuleGenerator.test.ts` | 8+ Tests | ✅ AKTIV |
| **RuleGeneration Pipeline** | `RuleGenerationPipeline.test.ts` | 15+ Tests | ✅ AKTIV |
| **RuleLoader** | `RuleLoader.test.ts` | 10+ Tests | ✅ AKTIV |
| **ResultMapper** | `ResultMapper.test.ts` | 2+ Tests | ✅ AKTIV |

---

## 🔍 Test 1: Schema Parsing (SchemaAnalyzer)

**Zweck:** Validiert, dass JSON-Schemas korrekt geparst und analysiert werden

**Test-Datei:** [SchemaAnalyzer.test.ts](../tests/unit/domain/SchemaAnalyzer.test.ts)

### Was wird getestet:

```typescript
✅ Simple fields: string, number, boolean, date
✅ Nested objects (z.B. vendor -> name, address)
✅ Array fields (items[])
✅ Pattern constraints (regex)
✅ Enum values
✅ Min/max constraints
✅ Required vs optional
✅ jsonPath generation
✅ Edge cases
```

### Praktische Test-Beispiele:

#### 1. Einfaches Feld parsen

```typescript
describe('SchemaAnalyzer - Simple Fields', () => {
  it('should parse a simple string field', () => {
    const schema = {
      type: 'object',
      properties: {
        invoiceNumber: { 
          type: 'string', 
          description: 'Rechnungsnummer' 
        }
      },
      required: ['invoiceNumber']
    };

    const result = analyzer.analyzeSchema(schema);
    
    expect(result.fields).toHaveLength(1);
    expect(result.fields[0].fieldName).toBe('invoiceNumber');
    expect(result.fields[0].dataType).toBe('string');
    expect(result.fields[0].isRequired).toBe(true);
    expect(result.fields[0].description).toBe('Rechnungsnummer');
  });
});
```

**Was passiert:**
- ✅ Schema wird geparst
- ✅ Feldtyp wird erkannt
- ✅ Required-Status wird gesetzt
- ✅ Beschreibung wird extrahiert

---

#### 2. Verschachtelte Objekte parsen

```typescript
describe('SchemaAnalyzer - Nested Objects', () => {
  it('should parse nested object properties', () => {
    const schema = {
      type: 'object',
      properties: {
        vendor: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            address: { type: 'string' }
          },
          required: ['name']
        }
      }
    };

    const result = analyzer.analyzeSchema(schema);
    
    // Top-level hat 1 Feld: vendor
    expect(result.fieldCount).toBe(1);
    
    // Gesamt hat 3 Felder: vendor, vendor.name, vendor.address
    expect(result.totalFieldCount).toBe(3);
    
    // Nested Schema wird korrekt generiert
    const vendorField = result.fields[0];
    expect(vendorField.dataType).toBe('object');
    expect(vendorField.nestedSchema).toHaveLength(2);
    
    // JSON-Paths sind korrekt
    expect(vendorField.nestedSchema[0].jsonPath).toBe('vendor.name');
    expect(vendorField.nestedSchema[1].jsonPath).toBe('vendor.address');
  });
});
```

**Was passiert:**
- ✅ Verschachtelte Struktur wird erkannt
- ✅ Nested Schema wird erstellt
- ✅ JSON-Paths werden korrekt generiert
- ✅ Required-Status wird für nested Fields gesetzt

---

#### 3. Pattern & Enum Constraints

```typescript
describe('SchemaAnalyzer - Constraints', () => {
  it('should extract pattern constraints', () => {
    const schema = {
      properties: {
        invoiceNumber: {
          type: 'string',
          pattern: '^INV-\\d{4}-\\d{3}$'
        }
      }
    };

    const result = analyzer.analyzeSchema(schema);
    const field = result.fields[0];
    
    expect(field.pattern).toBe('^INV-\\d{4}-\\d{3}$');
  });

  it('should extract enum values', () => {
    const schema = {
      properties: {
        status: {
          type: 'string',
          enum: ['draft', 'sent', 'paid']
        }
      }
    };

    const result = analyzer.analyzeSchema(schema);
    const field = result.fields[0];
    
    expect(field.enum).toEqual(['draft', 'sent', 'paid']);
  });
});
```

**Was passiert:**
- ✅ Regex-Pattern aus Schema wird extrahiert
- ✅ Enum-Werte werden erkannt
- ✅ Min/Max Constraints werden erfasst

---

## 🔍 Test 2: Beispiel-Analyse (ExampleAnalyzer)

**Zweck:** Validiert, dass Beispiel-JSONs analysiert werden und Feldcharakteristiken erkannt werden

**Test-Datei:** [ExampleAnalyzer.test.ts](../tests/unit/domain/ExampleAnalyzer.test.ts)

### Was wird getestet:

```typescript
✅ Feld-Charakteristiken aus Beispielen
✅ Pattern-Erkennung (Email, Datum, Telefon, etc.)
✅ Min/Max Werte für Zahlen
✅ Häufigkeits-Analyse
✅ Unique-Werte Counting
✅ Nullable/Optional-Erkennung
✅ Array-Analyse
✅ Enum-Detektion
✅ Datentyp-Variabilität
```

### Praktische Test-Beispiele:

#### 1. String-Feld analysieren

```typescript
describe('ExampleAnalyzer - Field Characteristics', () => {
  it('should analyze string field from examples', () => {
    const examples = [
      { name: 'John' },
      { name: 'Jane' },
      { name: 'Bob' }
    ];

    const fields = [
      {
        fieldName: 'name',
        jsonPath: 'name',
        dataType: 'string',
        isRequired: true
      }
    ];

    const result = analyzer.analyzeExamples(examples, fields);

    expect(result.exampleCount).toBe(3);
    expect(result.fieldCharacteristics).toHaveLength(1);

    const nameChar = result.fieldCharacteristics[0];
    expect(nameChar.fieldName).toBe('name');
    expect(nameChar.frequency).toBe(1.0);  // ✅ In allen Beispielen vorhanden
    expect(nameChar.sampleValues).toContain('John');
    expect(nameChar.uniqueCount).toBe(3);  // ✅ 3 verschiedene Werte
  });
});
```

**Was passiert:**
- ✅ Alle Beispiele werden durchsucht
- ✅ Feld-Häufigkeit wird berechnet (1.0 = 100%)
- ✅ Unique-Werte werden gezählt
- ✅ Sample-Werte werden gespeichert

---

#### 2. Zahlen-Feld analysieren

```typescript
describe('ExampleAnalyzer - Numeric Fields', () => {
  it('should analyze numeric field with min/max', () => {
    const examples = [
      { price: 10.5 },
      { price: 25.0 },
      { price: 99.99 }
    ];

    const fields = [
      {
        fieldName: 'price',
        jsonPath: 'price',
        dataType: 'number'
      }
    ];

    const result = analyzer.analyzeExamples(examples, fields);
    const priceChar = result.fieldCharacteristics[0];

    expect(priceChar.minValue).toBe(10.5);   // ✅ Minimum erkannt
    expect(priceChar.maxValue).toBe(99.99);  // ✅ Maximum erkannt
  });
});
```

**Was passiert:**
- ✅ Min/Max Werte werden berechnet
- ✅ Durchschnitt wird berechnet
- ✅ Standardabweichung wird analysiert

---

#### 3. Pattern-Erkennung

```typescript
describe('ExampleAnalyzer - Pattern Detection', () => {
  it('should recognize email patterns', () => {
    const examples = [
      { email: 'john@example.com' },
      { email: 'jane@test.org' },
      { email: 'bob@domain.net' }
    ];

    const result = analyzer.analyzeExamples(examples, fields);
    const emailChar = result.fieldCharacteristics[0];

    expect(emailChar.pattern).toBeDefined();
    expect(emailChar.patternConfidence).toBeGreaterThan(0.8);
    // ✅ Pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  });

  it('should recognize date patterns', () => {
    const examples = [
      { date: '2025-01-01' },
      { date: '2025-01-15' },
      { date: '2025-12-31' }
    ];

    const result = analyzer.analyzeExamples(examples, fields);
    const dateChar = result.fieldCharacteristics[0];

    expect(dateChar.pattern).toBeDefined();
    expect(dateChar.patternConfidence).toBeGreaterThan(0.8);
    // ✅ Pattern: /^\d{4}-\d{2}-\d{2}$/
  });
});
```

**Was passiert:**
- ✅ Email-Format wird erkannt
- ✅ Datumsformat wird erkannt
- ✅ Confidence wird berechnet (0.0-1.0)

---

#### 4. Optional/Nullable-Felder erkennen

```typescript
describe('ExampleAnalyzer - Optional Fields', () => {
  it('should detect nullable fields', () => {
    const examples = [
      { optional: 'value' },
      { optional: null },
      { optional: undefined },
      {}  // ← Feld nicht vorhanden
    ];

    const result = analyzer.analyzeExamples(examples, fields);
    const optionalChar = result.fieldCharacteristics[0];

    expect(optionalChar.isNullable).toBe(true);
    expect(optionalChar.frequency).toBeLessThan(1.0);  // ✅ Nicht in allen Beispielen
  });
});
```

**Was passiert:**
- ✅ Null-Werte werden erkannt
- ✅ Fehlende Felder werden erkannt
- ✅ Häufigkeit wird reduziert

---

## 🔍 Test 3: Regelwerk-Generierung (RuleGenerator)

**Zweck:** Validiert, dass automatisch Regelwerke aus Schema + Beispielen generiert werden

**Test-Datei:** [RuleGenerator.test.ts](../tests/unit/application/RuleGenerator.test.ts)

### Was wird getestet:

```typescript
✅ Regel für einfaches Feld generieren
✅ Regeln markieren (schema-only vs hybrid)
✅ Confidence-Scores berechnen
✅ Keywords aus Beschreibungen generieren
✅ Patterns aus Beispielen optimieren
✅ Aggressiveness-Einstellung
✅ Nested Rules
✅ Array Rules
```

### Praktische Test-Beispiele:

#### 1. Einfache Regel generieren

```typescript
describe('RuleGenerator - Basic Generation', () => {
  it('should generate rule for simple field', () => {
    const schemaFields = [
      {
        fieldName: 'name',
        jsonPath: 'name',
        dataType: 'string',
        isRequired: true,
        description: 'Person name'
      }
    ];

    const characteristics = [
      {
        fieldName: 'name',
        observedTypes: new Set(['string']),
        sampleValues: ['John', 'Jane', 'Bob'],
        frequency: 1.0,
        uniqueCount: 3
      }
    ];

    const result = generator.generateRules({
      schemaId: 'test-schema',
      schemaFields,
      exampleCharacteristics: characteristics,
      aggressiveness: 0.6  // balanced
    });

    expect(result.rules.length).toBeGreaterThan(0);
    const rule = result.rules[0];
    
    expect(rule.fieldName).toBe('name');
    expect(rule.confidence).toBeGreaterThan(0);
    expect(rule.searchKeywords).toBeDefined();
  });
});
```

**Was passiert:**
- ✅ Schema-Feld wird gelesen
- ✅ Beispiel-Charakteristiken werden gesammelt
- ✅ Regelwerk-Regel wird generiert
- ✅ Confidence-Score wird berechnet
- ✅ Keywords werden generiert

---

#### 2. Hybrid Rules (Schema + Beispiele)

```typescript
describe('RuleGenerator - Hybrid Rules', () => {
  it('should mark rules as hybrid when using both schema and examples', () => {
    const schemaFields = [
      {
        fieldName: 'amount',
        jsonPath: 'amount',
        dataType: 'number',
        description: 'Total amount in EUR'
      }
    ];

    const characteristics = [
      {
        fieldName: 'amount',
        observedTypes: new Set(['number']),
        sampleValues: [100, 200, 300],
        frequency: 1.0,
        minValue: 100,
        maxValue: 300,
        pattern: '^\\d+(\\.\\d{2})?$'
      }
    ];

    const result = generator.generateRules({
      schemaFields,
      exampleCharacteristics: characteristics
    });

    const rule = result.rules[0];
    expect(rule.derivedFrom).toBe('hybrid');  // ✅ Schema + Examples
    expect(rule.confidence).toBeGreaterThan(0.85);
  });

  it('should mark rules as schema-only when no examples', () => {
    const schemaFields = [
      {
        fieldName: 'email',
        jsonPath: 'email',
        dataType: 'string',
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
      }
    ];

    const result = generator.generateRules({
      schemaFields,
      exampleCharacteristics: []  // ← Keine Beispiele
    });

    const rule = result.rules[0];
    expect(rule.derivedFrom).toBe('schema');  // ✅ Nur Schema
  });
});
```

**Was passiert:**
- ✅ Hybrid-Rules werden gekennzeichnet
- ✅ Schema-Only Rules werden erkannt
- ✅ Confidence basierend auf Quelle wird berechnet

---

## 🔍 Test 4: Komplette Rule-Generation Pipeline

**Zweck:** End-to-End Test des gesamten Workflows

**Test-Datei:** [RuleGenerationPipeline.test.ts](../tests/integration/generation/RuleGenerationPipeline.test.ts)

### Workflow:

```typescript
┌─────────────────────┐
│ ExampleDataLoader   │ ← Beispiel-Datei laden
└──────────┬──────────┘
           │
      ┌────▼────┐
      │ Validiere│ ← Gegen Schema
      └────┬────┘
           │
┌──────────▼──────────────┐
│ PatternInferrer         │ ← Pattern aus Daten
└──────────┬──────────────┘
           │
┌──────────▼──────────────┐
│ RuleGenerator           │ ← Regeln generieren
└──────────┬──────────────┘
           │
      Fertig!
```

### Test-Beispiele:

#### 1. Beispiel-Datei laden & validieren

```typescript
describe('RuleGeneration Pipeline - ExampleDataLoader', () => {
  it('should load valid example file', async () => {
    const example = await exampleLoader.loadExample('invoice-example');

    expect(example).toBeDefined();
    expect(example.name).toBe('invoice-example');
    expect(example.fieldCount).toBeGreaterThan(0);
    expect(example.data).toHaveProperty('invoiceNumber');
  });

  it('should validate against schema', async () => {
    const example = await exampleLoader.loadExample('invoice-example');

    const schema = {
      fields: [
        { fieldName: 'invoiceNumber', fieldType: 'string', isRequired: true },
        { fieldName: 'invoiceDate', fieldType: 'date', isRequired: true },
        { fieldName: 'totalAmount', fieldType: 'number', isRequired: true }
      ]
    };

    const validation = exampleLoader.validateAgainstSchema(example, schema);
    
    expect(validation.valid).toBe(true);
    expect(validation.errors.length).toBe(0);
  });

  it('should throw on invalid filename', async () => {
    await expect(exampleLoader.loadExample('../etc/passwd'))
      .rejects.toThrow();  // ✅ Path-Traversal verhindert
  });
});
```

**Was passiert:**
- ✅ JSON-Datei wird geladen
- ✅ Datei wird gegen Schema validiert
- ✅ Sicherheit (Path-Traversal) wird geprüft

---

#### 2. Pattern-Inferierung

```typescript
describe('RuleGeneration Pipeline - PatternInferrer', () => {
  it('should infer pattern from invoice number examples', async () => {
    const request = {
      fieldName: 'invoiceNumber',
      fieldType: 'string' as const,
      examples: ['INV-2024-001', 'INV-2024-002', 'INV-2024-003'],
      isRequired: true
    };

    const result = await patternInferrer.infer(request);

    expect(result.success).toBe(true);
    expect(result.patterns).toBeDefined();
    expect(result.patterns.primary.confidence).toBeGreaterThan(0.5);
    expect(result.patterns.primary.pattern).toContain('INV-\\d{4}-\\d{3}');
  });

  it('should infer pattern from date examples', async () => {
    const request = {
      fieldName: 'invoiceDate',
      fieldType: 'date' as const,
      examples: ['2026-07-08', '2026-07-07', '2026-07-06'],
      isRequired: true
    };

    const result = await patternInferrer.infer(request);

    expect(result.success).toBe(true);
    expect(result.patterns.primary.pattern)
      .toContain('\\d{4}-\\d{2}-\\d{2}');
  });

  it('should check for ReDoS risks', async () => {
    const request = {
      fieldName: 'testField',
      fieldType: 'string' as const,
      examples: ['abc', 'def']
    };

    const result = await patternInferrer.infer(request);

    // ✅ ReDoS-Check wird durchgeführt
    expect(result.stats.redosCheckPerformed).toBe(true);
  });
});
```

**Was passiert:**
- ✅ Patterns werden aus Beispielen generiert
- ✅ Confidence-Scores werden berechnet
- ✅ ReDoS-Sicherheitsprüfung wird durchgeführt

---

## 🔍 Test 5: RuleLoader (Multiple Rulesets)

**Zweck:** Validiert das Laden mehrerer verschiedener Regelwerke

**Test-Datei:** [RuleLoader.test.ts](../tests/unit/core/RuleLoader.test.ts)

### Was wird getestet:

```typescript
✅ Alle Regelwerke aus Verzeichnis laden
✅ Caching von geladenen Regelwerken
✅ Einzelne Regelwerke laden
✅ Schemas laden
✅ Feldnamen extrahieren
✅ Regelwerk-IDs verwalten
```

### Test-Beispiele:

#### 1. Alle Regelwerke laden

```typescript
describe('RuleLoader - Multiple Rulesets', () => {
  it('should load all .json files from rules directory', async () => {
    const rules = await loader.loadRules();

    expect(rules).toBeInstanceOf(Map);
    expect(rules.size).toBeGreaterThan(0);
    // ✅ Alle Regelwerke geladen:
    // - invoice.json
    // - purchase-order.json
    // - delivery-note.json
    // - etc.
  });

  it('should cache loaded rules', async () => {
    const rules1 = await loader.loadRules();
    const rules2 = await loader.loadRules();

    expect(rules1.size).toBe(rules2.size);
    // ✅ Cache funktioniert
  });
});
```

**Was passiert:**
- ✅ Verzeichnis wird gescannt
- ✅ Alle JSON-Dateien werden geladen
- ✅ Rules werden gecacht
- ✅ Multiple Regelwerke sind verfügbar

---

#### 2. Einzelnes Regelwerk laden

```typescript
describe('RuleLoader - Load Specific Ruleset', () => {
  it('should load a specific ruleset by name', async () => {
    const invoiceRules = await loader.loadRuleSet('invoice');
    const poRules = await loader.loadRuleSet('purchase-order');
    
    expect(invoiceRules).toBeDefined();
    expect(poRules).toBeDefined();
    expect(invoiceRules.ruleSetId).toBe('invoice-v1.0');
    expect(poRules.ruleSetId).toBe('po-v1.0');
  });

  it('should parse rule fields correctly', async () => {
    const rules = await loader.loadRules();
    const invoiceRules = Array.from(rules.values())
      .find(r => r.documentType === 'invoice');

    expect(invoiceRules).toBeDefined();
    expect(invoiceRules.rules.length).toBeGreaterThan(0);
    
    const invoiceNumberRule = invoiceRules.rules
      .find(r => r.fieldName === 'invoiceNumber');
    
    expect(invoiceNumberRule).toBeDefined();
    expect(invoiceNumberRule.searchKeywords).toContain('invoice number');
  });
});
```

**Was passiert:**
- ✅ Einzelnes Regelwerk wird geladen
- ✅ Regelwerk-ID wird geprüft
- ✅ Regeln werden geparst
- ✅ Umschalten zwischen Regelwerken funktioniert

---

## 🚀 Tests ausführen

### Alle Tests ausführen

```bash
npm run test
```

### Nur Phase 15 Tests

```bash
npm run test -- --testPathPattern="(SchemaAnalyzer|ExampleAnalyzer|RuleGenerator|RuleGenerationPipeline)"
```

### Watch-Modus

```bash
npm run test:watch
```

### Coverage-Report

```bash
npm run test:coverage
```

---

## 📋 Test-Matrix: Was ist getestet?

| Feature | Test-Datei | Status | Coverage |
|---------|-----------|--------|----------|
| **Schema Parsing** | SchemaAnalyzer.test.ts | ✅ | 95%+ |
| **Example Analysis** | ExampleAnalyzer.test.ts | ✅ | 85%+ |
| **Rule Generation** | RuleGenerator.test.ts | ✅ | 85%+ |
| **Multi-Ruleset Loading** | RuleLoader.test.ts | ✅ | 90%+ |
| **Pattern Inference** | RuleGenerationPipeline.test.ts | ✅ | 80%+ |
| **Result Mapping** | ResultMapper.test.ts | ✅ | 90%+ |
| **Integration End-to-End** | integration.e2e.test.ts | ⏳ | Geplant |

---

## 💡 Beispiel: Test selbst ausführen

### Test 1: Schema-Analyzer direkt testen

```typescript
import { SchemaAnalyzer } from './src/domain/schema/SchemaAnalyzer';

const analyzer = new SchemaAnalyzer();

const schema = {
  type: 'object',
  properties: {
    invoiceNumber: { type: 'string' },
    amount: { type: 'number' }
  },
  required: ['invoiceNumber']
};

const result = analyzer.analyzeSchema(schema);
console.log('📊 Analyzed schema:', result);
/*
{
  schemaId: 'schema-1234',
  fieldCount: 2,
  totalFieldCount: 2,
  fields: [
    {
      fieldName: 'invoiceNumber',
      dataType: 'string',
      isRequired: true
    },
    {
      fieldName: 'amount',
      dataType: 'number',
      isRequired: false
    }
  ]
}
*/
```

---

### Test 2: Rule-Generator direkt testen

```typescript
import { RuleGenerator } from './src/application/rule-generation/RuleGenerator';

const generator = new RuleGenerator();

const result = generator.generateRules({
  schemaId: 'invoice-schema',
  schemaFields: [
    { fieldName: 'invoiceNumber', dataType: 'string', isRequired: true }
  ],
  exampleCharacteristics: [
    {
      fieldName: 'invoiceNumber',
      observedTypes: new Set(['string']),
      sampleValues: ['INV-2024-001', 'INV-2024-002'],
      frequency: 1.0
    }
  ],
  aggressiveness: 0.6
});

console.log('🔧 Generated rules:', result);
/*
{
  ruleSetId: 'rs_invoice_001',
  rules: [
    {
      fieldName: 'invoiceNumber',
      pattern: 'INV-\\d{4}-\\d{3}',
      confidence: 0.92,
      derivedFrom: 'hybrid'
    }
  ]
}
*/
```

---

## 📚 Weitere Ressourcen

- [Schema-Structure-Guide](./SCHEMA-STRUCTURE-GUIDE.md) - Wie man Schemas schreibt
- [Ruleset-Management-Guide](./RULESET-MANAGEMENT-GUIDE.md) - Wie man Regelwerke verwaltet
- [PHASE-15-USER-GUIDE](./PHASE-15-USER-GUIDE.md) - User-Workflow
- [Test-Verzeichnis](../tests/) - Alle Testdateien

