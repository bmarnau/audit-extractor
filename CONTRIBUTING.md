# CONTRIBUTING.md

Beiträge zum Audit-Safe Document Extractor sind willkommen!

## Zusammenfassung

Dieses Projekt folgt strikten Standards für Revisionssicherheit und Halluzinations-Verhinderung. Alle Code-Änderungen müssen diese Prinzipien respektieren.

## Beitritts-Schritte

1. **Fork** des Repositories
2. **Feature-Branch** erstellen: `git checkout -b feature/dein-feature`
3. **Code** schreiben (siehe Richtlinien)
4. **Tests** schreiben und ausführen
5. **Push** und **Pull Request** öffnen

## Coding-Standards

### TypeScript

- **Strict Mode**: Immer aktiviert (`tsconfig.json`)
- **No `any`**: Verwende explizite Typen
- **No floating promises**: Alle Promises müssen await haben

```typescript
// ❌ FALSCH
const result: any = extract(...);

// ✅ RICHTIG
const result: ExtractionResult = extract(...);
```

### Keine Halluzinationen

Jeder Code, der Werte extrahiert:
- Muss eine `SourceReference` haben
- Muss ein `ConfidenceScore` haben
- Darf keine Werte erfinden

```typescript
// ❌ FALSCH
return { value: "guessed value" };

// ✅ RICHTIG
return {
  value: extractedValue,
  sources: [sourceReference],
  confidence: 0.95
};
```

### Linting & Formatting

```bash
npm run lint     # ESLint
npm run format   # Prettier
```

Erzwingen Sie diese IMMER vor dem Commit:
```bash
npm run lint
npm run format
npm run test
```

## Testing

- **Unit Tests**: Alle `src/` Dateien müssen Tests haben
- **Coverage**: Minimum 80%
- **Regression Tests**: Bekannte Extraktionen testen

```bash
npm run test              # Alle Tests
npm run test:watch       # Watch Mode
npm run test:coverage    # Coverage Report
```

Neuer Test? Vorlage:

```typescript
describe('FeatureName', () => {
  it('should do X', () => {
    // Arrange
    const input = ...;
    
    // Act
    const result = feature(input);
    
    // Assert
    expect(result).toBe(expected);
  });
});
```

## Commit-Nachricht-Format

Folge [Conventional Commits](https://www.conventionalcommits.org/):

```
type(scope): subject

feat(parser): add HTML parser support
fix(extraction): prevent hallucination in low-confidence values
test(engine): add regression tests for confidence filtering
docs(glossary): add new terms
```

**Types**:
- `feat`: Neue Feature
- `fix`: Bug-Fix
- `test`: Tests hinzufügen/ändern
- `docs`: Dokumentation
- `refactor`: Code-Umstrukturierung (kein Verhalten-Change)
- `perf`: Performance-Verbesserung

## Breaking Changes

Breaking Changes müssen dokumentiert sein:

1. In der Commit-Nachricht: `BREAKING CHANGE: description`
2. In [CHANGELOG.md](CHANGELOG.md)
3. Version erhöhen zu `MAJOR` (nach SemanticVersioning)

```
feat(schema): remove legacy field
BREAKING CHANGE: 'legacyId' field removed - clients must update rules
```

## Pull Request-Prozess

1. **Beschreibung**: Erkläre WARUM nicht nur WAS
2. **Tests**: "All tests passing"
3. **Coverage**: Minimum 80%
4. **Review**: Mindestens 1 Approval erforderlich
5. **Lint**: ESLint & Prettier

PR-Checkliste:
- [ ] Tests geschrieben
- [ ] ESLint & Prettier ausgeführt
- [ ] Coverage >= 80%
- [ ] Commit-Nachrichten valid
- [ ] Breaking Changes dokumentiert

## Dokumentation

Jedes neue Feature muss dokumentiert sein:

- Code-Comments für komplexe Logic
- README für öffentliche APIs
- Beispiele im `/examples` Ordner
- Glossar-Einträge im `/docs/glossary.md`

## Halluzinations-Policy

**Dies ist NICHT verhandelbar.**

Jeder PR, der Halluzinationen ermöglicht, wird **abgelehnt**:

```typescript
// ❌ WIRD ABGELEHNT
values.push(guessedValue); // Keine Quelle!

// ❌ WIRD ABGELEHNT
newValue = oldValue || defaultValue; // Implizite Annahme!

// ✅ OK
if (hasSource(value)) {
  values.push(value);
}
```

## Performance

- Keine **O(n²)** Algorithmen ohne Grund
- Profile vor Optimierung
- Benchmark-Results in PR dokumentieren

## Support

- **Fragen**: GitHub Discussions
- **Bugs**: GitHub Issues
- **Features**: GitHub Discussions → Design Document → PR

## Code of Conduct

Respekt, Transparenz, Quality-First. Keine Ausnahmen.

---

Danke für Ihren Beitrag! 🎉
