# 🔧 PHASE 1 - Integration Guide für Entwickler

**Wie man Phase 1 in bestehende Anwendungen integriert**

---

## 📦 Installation & Setup

### 1. Komponenten importieren

```typescript
import { ExampleDataLoader } from './src/application/generation/ExampleDataLoader';
import { PatternInferrer } from './src/application/generation/PatternInferrer';
import { RuleGenerator } from './src/application/generation/RuleGenerator';
import type { GeneratedRule, RuleGenerationRequest, RuleGenerationResult } from './src/domain/generation';
```

### 2. Service Container initialisieren

```typescript
// Einmalig beim App-Start
class RuleGenerationContainer {
  private exampleDataLoader: ExampleDataLoader;
  private patternInferrer: PatternInferrer;
  private ruleGenerator: RuleGenerator;

  constructor(examplesDir: string = './extraction-rules/examples') {
    this.exampleDataLoader = new ExampleDataLoader({ examplesDir });
    this.patternInferrer = new PatternInferrer();
    this.ruleGenerator = new RuleGenerator(
      this.exampleDataLoader,
      this.patternInferrer
    );
  }

  getGenerator(): RuleGenerator {
    return this.ruleGenerator;
  }
}

// Verwendung
const container = new RuleGenerationContainer();
const generator = container.getGenerator();
```

---

## 🎯 Use Cases

### Use Case 1: Single Report Generation

```typescript
// User generiert Ruleset für einen einzelnen Report

async function generateInvoiceRuleset() {
  const generator = container.getGenerator();

  const result = await generator.generate({
    reportName: 'invoice',
    schema: {
      id: 'invoice-schema-v1.0.0',
      documentType: 'invoice',
      fields: [
        {
          fieldName: 'invoiceNumber',
          fieldType: 'string',
          isRequired: true,
          constraints: { minLength: 3, maxLength: 50 }
        },
        // ... weitere Felder
      ]
    },
    exampleDataSource: {
      name: 'invoice-example'  // Lädt aus examples/invoice-example.json
    },
    version: '1.0.0'
  });

  if (result.success) {
    // Rules speichern
    await saveRuleset(result.rules, 'invoice', '1.0.0');
    console.log(`✅ ${result.successCount} Rules generiert`);
  } else {
    console.error('Generation failed:', result.error);
  }

  return result;
}
```

### Use Case 2: Batch Generation

```typescript
// Backend generiert Rulesets für mehrere Reports

async function generateMultipleRulesets() {
  const generator = container.getGenerator();

  const configurations = [
    {
      reportName: 'invoice',
      schema: invoiceSchema,
      exampleDataSource: { name: 'invoice-example' }
    },
    {
      reportName: 'po',
      schema: poSchema,
      exampleDataSource: { name: 'po-example' }
    },
    {
      reportName: 'contract',
      schema: contractSchema,
      exampleDataSource: { name: 'contract-example' }
    }
  ];

  const results = await Promise.all(
    configurations.map(config => 
      generator.generate(config).catch(err => ({
        success: false,
        error: err,
        reportName: config.reportName
      }))
    )
  );

  // Auswerten
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ ${successful.length} Reports erfolgreich`);
  console.log(`❌ ${failed.length} Reports fehlgeschlagen`);

  return results;
}
```

### Use Case 3: REST API Endpoint

```typescript
// Express.js Endpoint für Ruleset-Generierung

import express, { Request, Response } from 'express';

const app = express();
const container = new RuleGenerationContainer();

app.post('/api/ruleset/generate', async (req: Request, res: Response) => {
  try {
    const { reportName, schema, exampleDataSource, version } = req.body;

    // Validierung
    if (!reportName || !schema || !exampleDataSource) {
      return res.status(400).json({ 
        error: 'Missing required fields' 
      });
    }

    // Generation
    const generator = container.getGenerator();
    const result = await generator.generate({
      reportName,
      schema,
      exampleDataSource,
      version: version || '1.0.0'
    });

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json({
        error: result.error,
        message: 'Rule generation failed'
      });
    }
  } catch (error) {
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

app.listen(3000, () => {
  console.log('✅ API running on port 3000');
});
```

### Use Case 4: Web UI Integration

```typescript
// React/Vue Frontend component

async function handleGenerateRuleset(formData: {
  reportName: string;
  exampleFile: File;
  schemaFile: File;
}) {
  try {
    // 1. Dateien laden
    const exampleData = JSON.parse(await formData.exampleFile.text());
    const schemaData = JSON.parse(await formData.schemaFile.text());

    // 2. API aufrufen
    const response = await fetch('/api/ruleset/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reportName: formData.reportName,
        schema: schemaData,
        exampleDataSource: { data: exampleData },
        version: '1.0.0'
      })
    });

    // 3. Ergebnisse anzeigen
    if (response.ok) {
      const result = await response.json();
      showSuccessMessage(
        `✅ ${result.successCount} Rules generiert (${result.averageConfidence} Confidence)`
      );
      displayRules(result.rules);
    } else {
      const error = await response.json();
      showErrorMessage(`❌ ${error.message}`);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
```

---

## 🔐 Error Handling

### Comprehensive Error Handling

```typescript
async function generateWithErrorHandling(config: RuleGenerationRequest) {
  const generator = container.getGenerator();

  try {
    const result = await generator.generate(config);

    if (!result.success) {
      // Unterschiedliche Fehlertypen
      if (result.error?.includes('Path traversal')) {
        console.error('❌ Security Error: Suspicious file path detected');
        // Log für Security Team
        logSecurityEvent(result.error);
      } else if (result.error?.includes('Invalid field name')) {
        console.warn('⚠️ Schema Error:', result.error);
        // User-freundliche Meldung
        notifyUser('Please use valid field names (a-zA-Z0-9_)');
      } else if (result.error?.includes('File too large')) {
        console.warn('⚠️ Size Error:', result.error);
        notifyUser('File is too large (max 10MB)');
      } else {
        console.error('❌ Generation Error:', result.error);
      }
      return null;
    }

    // Erfolg mit Warnungen?
    if (result.warnings && result.warnings.length > 0) {
      console.warn('⚠️ Warnings:', result.warnings);
      // User informieren, aber trotzdem weitermachen
      notifyUser('Rules generated with warnings. Review recommended.');
    }

    return result.rules;
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    throw new Error('Failed to generate ruleset');
  }
}
```

### Retry Logic

```typescript
async function generateWithRetry(
  config: RuleGenerationRequest,
  maxRetries: number = 3,
  delayMs: number = 1000
) {
  const generator = container.getGenerator();
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await generator.generate(config);
      if (result.success) {
        return result;
      }
      lastError = new Error(result.error || 'Unknown error');
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    if (attempt < maxRetries) {
      console.log(`Retry ${attempt}/${maxRetries - 1}...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  throw lastError || new Error('Generation failed after retries');
}
```

---

## 📊 Monitoring & Logging

### Performance Monitoring

```typescript
import { performance } from 'perf_hooks';

async function generateWithMetrics(config: RuleGenerationRequest) {
  const generator = container.getGenerator();
  const startTime = performance.now();

  const result = await generator.generate(config);

  const endTime = performance.now();
  const duration = endTime - startTime;

  // Metriken erfassen
  const metrics = {
    reportName: config.reportName,
    duration,
    successCount: result.successCount || 0,
    warningCount: result.warningCount || 0,
    averageConfidence: result.averageConfidence || 0,
    success: result.success,
    timestamp: new Date().toISOString()
  };

  // Logging
  if (duration > 500) {
    console.warn('⚠️ Slow generation:', metrics);
  } else {
    console.log('✅ Generation metrics:', metrics);
  }

  // Monitoring System
  recordMetrics(metrics);

  return result;
}
```

### Audit Logging

```typescript
interface AuditLog {
  timestamp: Date;
  reportName: string;
  userId: string;
  action: 'generate' | 'update' | 'delete';
  status: 'success' | 'failed';
  duration: number;
  rulesGenerated: number;
  averageConfidence: number;
}

async function logAuditEvent(
  auditLog: AuditLog,
  auditLogger: AuditLogger
) {
  await auditLogger.log({
    ...auditLog,
    timestamp: new Date()
  });
}

// Verwendung
await logAuditEvent(
  {
    reportName: 'invoice',
    userId: 'user123',
    action: 'generate',
    status: 'success',
    duration: 150,
    rulesGenerated: 13,
    averageConfidence: 0.78
  },
  auditLogger
);
```

---

## 💾 Persistence

### Saving Rules to Database

```typescript
interface RulesetRepository {
  save(ruleset: Ruleset): Promise<void>;
  findByReportName(name: string): Promise<Ruleset | null>;
  findByVersion(name: string, version: string): Promise<Ruleset | null>;
}

async function persistRuleset(
  result: RuleGenerationResult,
  repository: RulesetRepository
) {
  if (!result.success) {
    throw new Error('Cannot persist failed generation');
  }

  const ruleset: Ruleset = {
    id: generateId(),
    reportName: result.reportName,
    version: '1.0.0',
    rules: result.rules,
    metadata: {
      generatedAt: new Date(),
      successCount: result.successCount,
      averageConfidence: result.averageConfidence,
      generatedBy: 'system'
    }
  };

  await repository.save(ruleset);
  console.log(`✅ Ruleset saved: ${ruleset.reportName}@${ruleset.version}`);
}
```

### Loading Rules from Cache

```typescript
class RulesetCache {
  private cache = new Map<string, GeneratedRule[]>();
  private ttlMs = 24 * 60 * 60 * 1000; // 24 hours

  set(key: string, rules: GeneratedRule[]) {
    this.cache.set(key, rules);
    setTimeout(() => this.cache.delete(key), this.ttlMs);
  }

  get(key: string): GeneratedRule[] | undefined {
    return this.cache.get(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }
}

// Verwendung
const cache = new RulesetCache();

async function getOrGenerateRules(
  reportName: string,
  config: RuleGenerationRequest
) {
  const cacheKey = `${reportName}-${config.version || '1.0.0'}`;

  // Check Cache
  if (cache.has(cacheKey)) {
    console.log('✅ Rules from cache');
    return cache.get(cacheKey);
  }

  // Generate & Cache
  const result = await generator.generate(config);
  if (result.success) {
    cache.set(cacheKey, result.rules);
  }

  return result.rules;
}
```

---

## 🧪 Testing Integration

### Unit Test Example

```typescript
describe('RuleGenerator Integration', () => {
  let generator: RuleGenerator;
  let exampleLoader: ExampleDataLoader;

  beforeEach(() => {
    exampleLoader = new ExampleDataLoader({
      examplesDir: './extraction-rules/examples'
    });
    const inferrer = new PatternInferrer();
    generator = new RuleGenerator(exampleLoader, inferrer);
  });

  it('should generate invoice rules successfully', async () => {
    const result = await generator.generate({
      reportName: 'invoice',
      schema: invoiceSchema,
      exampleDataSource: { name: 'invoice-example' },
      version: '1.0.0'
    });

    expect(result.success).toBe(true);
    expect(result.rules.length).toBeGreaterThan(0);
    expect(result.averageConfidence).toBeGreaterThan(0.5);
  });

  it('should reject invalid field names', async () => {
    const invalidSchema = {
      fields: [
        {
          fieldName: 'invoice-number',  // Invalid: contains hyphen
          fieldType: 'string',
          isRequired: true
        }
      ]
    };

    const result = await generator.generate({
      reportName: 'test',
      schema: invalidSchema,
      exampleDataSource: { data: {} }
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('Invalid field name');
  });
});
```

---

## 🚀 Deployment Checklist

- [x] Phase 1 Components implementiert
- [ ] Error Handling implementiert
- [ ] Monitoring & Logging konfiguriert
- [ ] Audit Logging konfiguriert
- [ ] Persistence (DB) vorbereitet
- [ ] Caching implementiert
- [ ] API Endpoints getestet
- [ ] Integration Tests geschrieben
- [ ] Dokumentation aktualisiert
- [ ] Security Review durchgeführt
- [ ] Performance Tests bestanden
- [ ] Deployment geplant

---

## 📞 Support & Resources

**Dokumentation:**
- `PHASE1_IMPLEMENTATION_PLAN.md` - Technical overview
- `TESTPLAN_PHASE1.md` - Test cases
- Inline JSDoc comments in code

**Examples:**
- `tests/integration/generation/RuleGenerationPipeline.test.ts` - Test examples
- `PHASE1_USER_GUIDE.md` - User examples

**Next Steps:**
- Phase 2: Multi-variant detection
- Phase 3: REST APIs & UI integration

---

**Happy Integrating!** 🚀
