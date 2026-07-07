# tests/

Unit Tests für alle Komponenten.

## Struktur

```
tests/
├── unit/
│   ├── domain/
│   │   ├── ExtractionFieldName.test.ts
│   │   ├── ConfidenceScore.test.ts
│   │   └── ExtractionRule.test.ts
│   │
│   ├── application/
│   │   ├── ExtractionEngine.test.ts
│   │   ├── DocumentRuleAssociation.test.ts
│   │   └── LearningComponent.test.ts
│   │
│   └── infrastructure/
│       ├── ResultRepository.test.ts
│       └── RuleSetRepository.test.ts
│
└── integration/          # (Future)
    └── end-to-end.test.ts
```

## Coverage-Anforderungen

- **Global**: 80%+
- **Critical Path**: 95%+
  - ExtractionEngine
  - HallucinationValidator
  - ConfidenceScoring

## Running Tests

```bash
npm run test              # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

## Test-Vorlage

```typescript
import { FeatureToTest } from '@domain/Feature';

describe('FeatureToTest', () => {
  describe('Method1', () => {
    it('should do X when Y', () => {
      // Arrange
      const input = new FeatureToTest('value');
      
      // Act
      const result = input.method1();
      
      // Assert
      expect(result).toEqual('expected');
    });

    it('should throw when invalid', () => {
      // Arrange
      const input = new FeatureToTest('invalid');
      
      // Act & Assert
      expect(() => input.method1()).toThrow();
    });
  });
});
```

## Regression Tests

Tests, die bekannte Extraktionen validieren:

```typescript
describe('Regression: Halluzination Prevention', () => {
  it('should reject values without sources', () => {
    const value = {
      value: 'some text',
      confidence: 0.9,
      sources: []
    };
    
    expect(() => validateNoHallucination(value))
      .toThrow('No source provided');
  });
});
```

---

**Letzte Aktualisierung**: 2026-01-15
