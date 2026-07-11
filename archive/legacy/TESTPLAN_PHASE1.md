# 🧪 PHASE 1 TESTPLAN & TESTLAUF

**Projekt:** Multi-Report Ruleset Generation  
**Phase:** 1 - Automatische Regelwerk-Generierung  
**Datum:** 2026-07-08  
**Status:** READY FOR TESTING

---

## 📋 Test-Matrix

### Test-Set 1: ExampleDataLoader

| Test-Fall | Input | Expected Output | Status |
|-----------|-------|---|---|
| **Load Invoice Example** | `loadExample('invoice-example')` | LoadedExample mit 16 Feldern | ⏳ |
| **Load PO Example** | `loadExample('po-example')` | LoadedExample mit 17 Feldern | ⏳ |
| **Load Contract Example** | `loadExample('contract-example')` | LoadedExample mit 23 Feldern | ⏳ |
| **Path Traversal Protection** | `loadExample('../etc/passwd')` | Throws SecurityError | ⏳ |
| **Non-existent File** | `loadExample('nonexistent')` | Throws FileNotFound | ⏳ |
| **Schema Validation** | Load + Validate against Invoice Schema | Valid: true | ⏳ |
| **Field Name Extraction** | Get field names from invoice | Contains invoiceNumber, invoiceDate, etc. | ⏳ |
| **Get Field Values** | getFieldValues(example, 'invoiceNumber') | ['INV-2024-001'] | ⏳ |

### Test-Set 2: PatternInferrer

| Test-Fall | Input | Expected Output | Status |
|-----------|-------|---|---|
| **Invoice Number Pattern** | examples: ['INV-2024-001', 'INV-2024-002'] | Pattern contains `INV-[0-9]` | ⏳ |
| **Date Pattern (ISO)** | examples: ['2026-07-08', '2026-07-07'] | Pattern: `\d{4}-\d{2}-\d{2}` | ⏳ |
| **Empty Examples** | examples: [] | InferenceResult.success = false | ⏳ |
| **Invalid Field Name** | fieldName: 'invalid-field!' | Validation.valid = false | ⏳ |
| **ReDoS Check** | Any pattern | stats.redosCheckPerformed = true | ⏳ |
| **Confidence Calculation** | 3 examples, all matching | confidence >= 0.9 | ⏳ |
| **Alternative Patterns** | Multiple pattern variants possible | alternatives.length > 0 | ⏳ |

### Test-Set 3: RuleGenerator

| Test-Fall | Input | Expected Output | Status |
|-----------|-------|---|---|
| **Generate Invoice Rules** | invoice-schema + invoice-example | 13 GeneratedRules, all valid | ⏳ |
| **Generate PO Rules** | po-schema + po-example | 17 GeneratedRules, all valid | ⏳ |
| **Generate Contract Rules** | contract-schema + contract-example | 23 GeneratedRules, all valid | ⏳ |
| **Invalid Report Name** | reportName: 'Invalid Report!' | success = false, error thrown | ⏳ |
| **Missing Schema Fields** | Empty fields array | success = false | ⏳ |
| **No Example Data** | schema only, no examples | success = true, default patterns | ⏳ |
| **Average Confidence** | Multiple rules | averageConfidence: 0.0-1.0 | ⏳ |
| **Generated Metadata** | Complete ruleset | Each rule has: ruleId, generatedAt, confidence | ⏳ |

### Test-Set 4: Security Tests

| Test-Fall | Input | Expected Output | Status |
|-----------|-------|---|---|
| **Path Traversal** | filename: '../etc/passwd' | SecurityError thrown | ⏳ |
| **SQL Injection Attempt** | fieldName with SQL code | Validation.valid = false | ⏳ |
| **JSON Depth Limit** | Very deep nested JSON | Throws error if depth > 5 | ⏳ |
| **Field Name Injection** | Special characters in field name | Rejected by validation | ⏳ |
| **Large File Protection** | File > 10MB | Throws FileTooLarge error | ⏳ |
| **Regex DoS Protection** | Dangerous pattern | ReDoS issues flagged | ⏳ |

---

## 🏃 Testlauf-Vorbereitung

### Voraussetzungen
- ✅ Domain Models erstellt
- ✅ ExampleDataLoader implementiert
- ✅ PatternInferrer implementiert
- ✅ RuleGenerator implementiert
- ✅ Beispieldaten erstellt (invoice-example.json, po-example.json, contract-example.json)
- ✅ Schemas erstellt (invoice-schema-v1.0.0.json, po-schema-v1.0.0.json, contract-schema-v1.0.0.json)
- ✅ Tests geschrieben

### Manueller Testlauf (TypeScript)

```typescript
// 1. Setup
const examplesDir = path.join(process.cwd(), 'extraction-rules', 'examples');
const exampleLoader = new ExampleDataLoader({ examplesDir });
const patternInferrer = new PatternInferrer();
const ruleGenerator = new RuleGenerator(exampleLoader, patternInferrer);

// 2. Test 1: Load Examples
const invoiceExample = await exampleLoader.loadExample('invoice-example');
console.log('✅ Invoice Example Loaded:', invoiceExample.fieldCount, 'fields');

// 3. Test 2: Infer Patterns
const invoiceNumberInference = await patternInferrer.infer({
  fieldName: 'invoiceNumber',
  fieldType: 'string',
  examples: ['INV-2024-001', 'INV-2024-002', 'INV-2024-003']
});
console.log('✅ Pattern Inferred:', invoiceNumberInference.patterns.primary.pattern);

// 4. Test 3: Generate Rules
const ruleGenResult = await ruleGenerator.generate({
  reportName: 'invoice',
  schema: invoiceSchema,
  exampleDataSource: { name: 'invoice-example' },
  version: '1.0.0'
});
console.log('✅ Rules Generated:', ruleGenResult.rules.length, 'rules');
```

---

## ✅ Erwartete Test-Ergebnisse

### Erfolgreich-Kriterium
```
✅ Alle ExampleDataLoader-Tests: PASS
✅ Alle PatternInferrer-Tests: PASS
✅ Alle RuleGenerator-Tests: PASS
✅ Alle Security-Tests: PASS
✅ Average Code Coverage: ≥ 85%
✅ No TypeScript Warnings
✅ All Generated Rules Valid
```

### Metriken für Invoice-Generierung
```
Files Processed: 1 (invoice-example.json)
Schemas Processed: 1 (invoice-schema-v1.0.0.json)
Rules Generated: 13
Average Confidence: ≥ 0.65
Duration: < 500ms
Errors: 0
Warnings: < 3
```

### Metriken für PO-Generierung
```
Files Processed: 1 (po-example.json)
Schemas Processed: 1 (po-schema-v1.0.0.json)
Rules Generated: 17
Average Confidence: ≥ 0.65
Duration: < 500ms
```

### Metriken für Contract-Generierung
```
Files Processed: 1 (contract-example.json)
Schemas Processed: 1 (contract-schema-v1.0.0.json)
Rules Generated: 23
Average Confidence: ≥ 0.60
Duration: < 500ms
```

---

## 🎯 Success Criteria

- [x] Verzeichnisstruktur erstellt
- [x] Domain Models implementiert
- [x] ExampleDataLoader implementiert
- [x] PatternInferrer implementiert
- [x] RuleGenerator implementiert
- [x] Beispieldaten erstellt
- [x] Schemas erstellt
- [x] Tests geschrieben
- [ ] Tests BESTANDEN (runnen lassen!)
- [ ] Security Audit bestanden
- [ ] Performance Tests bestanden
- [ ] Dokumentation aktualisiert

---

## 📊 Nächste Schritte

1. ✅ Alle Code-Dateien implementiert
2. 👉 **JETZT: Testlauf durchführen**
3. 👉 Security-Audit durchführen
4. 👉 Dokumentation finalisieren
5. 👉 Phase 1 abschließen

---

## 🔗 Referenzen

- `PHASE1_IMPLEMENTATION_PLAN.md` - Detaillierter Plan
- `MULTI_REPORT_RULESET_ANALYSIS.md` - Anforderungs-Analyse
- Tests: `tests/integration/generation/RuleGenerationPipeline.test.ts`
- Beispieldaten: `extraction-rules/examples/*.json`
- Schemas: `extraction-rules/schemas/*.json`
