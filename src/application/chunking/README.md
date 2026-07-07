# src/application/chunking/

Intelligente Dokumenten-Zerlegung in Chunks.

## ChunkingEngine

Orchestriert verschiedene Chunking-Strategien zur intelligenten Dokumenten-Aufteilung.

### Features

- ✅ Maximale Chunkgröße
- ✅ Überlappung für Kontext
- ✅ Überschriftenerkennung
- ✅ Abschnittserkennung
- ✅ Mehrere Strategien (Semantic, Simple, Hybrid)
- ✅ Konfigurierbare Verarbeitung
- ✅ Keine Datengenerierung (nur echte Inhalte)

### Strategien

| Strategie | Beschreibung | Use Case |
|-----------|--------------|----------|
| **Semantic** | Respektiert Struktur (Überschriften, Absätze, Sections) | Standard, strukturierte Dokumente |
| **Simple** | Nur Größe-basiert | Schnell, unkomplexe Dokumente |
| **Hybrid** | Kombination von Semantic + Simple | Best-of-both, adaptive Verarbeitung |

## Verwendung

### Basic Chunking

```typescript
import { ChunkingEngine, SemanticChunkingStrategy } from '@application/chunking';

const engine = new ChunkingEngine();
engine.registerStrategy(new SemanticChunkingStrategy());

// Lade Document von Parser
const document = await parser.parse(fileBuffer, 'invoice.pdf');

// Chunke mit default config
const chunks = await engine.chunk(document);

// Result: DocumentChunk[]
chunks.forEach(chunk => {
  console.log(`Chunk ${chunk.id}:`);
  console.log(`  Text: ${chunk.text.substring(0, 50)}...`);
  console.log(`  Confidence: ${chunk.confidence}`);
  console.log(`  Size: ${chunk.offsetEnd - chunk.offsetStart} bytes`);
});
```

### Custom Configuration

```typescript
const customConfig = {
  maxChunkSize: 512,      // Bytes
  overlapSize: 50,        // Bytes
  minChunkSize: 100,      // Bytes (optional)
  preserveHeadings: true,
  preserveSections: true,
  respectParagraphs: true
};

const chunks = await engine.chunk(document, customConfig);
```

### Strategie auswählen

```typescript
// Semantic: Best für strukturierte Dokumente
const semanticChunks = await engine.chunkWithStrategy('semantic', document);

// Simple: Best für Speed
const simpleChunks = await engine.chunkWithStrategy('simple', document);

// Hybrid: Automatische Anpassung
const hybridChunks = await engine.chunkWithStrategy('hybrid', document);
```

## ChunkingConfig

```typescript
interface ChunkingConfig {
  maxChunkSize: number;        // Maximale Chunk-Größe in Bytes (default: 1024)
  overlapSize: number;         // Überlappung zwischen Chunks (default: 100)
  minChunkSize?: number;       // Minimale Chunk-Größe (default: maxChunkSize / 4)
  preserveHeadings?: boolean;  // Behalte Überschriften? (default: true)
  preserveSections?: boolean;  // Behalte Abschnitte? (default: true)
  respectParagraphs?: boolean; // Splitte nicht in Absatz-Mitte? (default: true)
}
```

## Output: DocumentChunk

```typescript
interface DocumentChunk {
  id: string;                 // Unique chunk ID
  text: string;              // Der Text (nicht erfunden!)
  pageNumber: number;        // Aus Source-Document
  sectionId: string;         // Aus Source-Document
  offsetStart: number;       // Byte-Position im Original
  offsetEnd: number;         // Byte-Position im Original
  confidence: number;        // 0-1 (basierend auf Struktur-Klarheit)
  isOcrExtracted: boolean;   // Nur wenn tatsächlich OCR
  type: string;              // "text", "heading", etc.
  tags?: string[];
}
```

## Konfiguration

### Default-Config ändern

```typescript
engine.setDefaultConfig({
  maxChunkSize: 2048,
  overlapSize: 200
});
```

### Verfügbare Strategien auflisten

```typescript
const strategies = engine.getAvailableStrategies();
// ["semantic", "simple", "hybrid"]
```

## Kritisch: Keine Datengenerierung!

### ❌ FALSCH

```typescript
// Erfundene Überschrift
{ text: "Summary of Invoice", confidence: 0.95 }

// Auto-generated Text
{ text: "This invoice contains...", confidence: 0.8 }

// Placeholder-Inhalte
{ text: "[Missing Section]", confidence: 0.0 }
```

### ✅ RICHTIG

```typescript
// Nur echte Texte
{ text: "Invoice Number: INV-2024-001", confidence: 0.99 }

// Nur wenn in Source vorhanden
{ text: undefined } -> Skip, nicht erfinden

// Confidence basierend auf Struktur-Klarheit
{ text: "Clear paragraph", confidence: 0.95 }
{ text: "Boundary text", confidence: 0.70 }
```

## Overlap-Beispiel

Mit `maxChunkSize: 100` und `overlapSize: 20`:

```
Chunk 1: "...Lorem ipsum dolor sit amet consectetur adipiscing"
                                          ↓ Overlap
Chunk 2: "consectetur adipiscing elit sed do eiusmod tempor..."
```

Der Text "consectetur adipiscing" ist in beiden Chunks - für Kontext-Erhaltung.

## Struktur-Erkennung

SemanticChunkingStrategy erkennt:

1. **Überschriften**: `# Heading`, `## Subheading` oder ALLCAPS
2. **Abschnitte**: Verschiedene `sectionId` in Source-Chunks
3. **Absätze**: Newlines trennen Absätze
4. **Grenzen**: `isStructureBoundary` für respektvolle Aufteilung

## Performance

| Strategie | Speed | Qualität | Best For |
|-----------|-------|----------|----------|
| Simple | ⚡⚡⚡ | ⭐⭐ | Große Mengen, egal |
| Semantic | ⚡⚡ | ⭐⭐⭐⭐ | Standard, Qualität wichtig |
| Hybrid | ⚡⚡ | ⭐⭐⭐⭐ | Adaptiv, alles |

## Error Handling

```typescript
import { ChunkingError } from '@application/chunking';

try {
  const chunks = await engine.chunk(document, invalidConfig);
} catch (error) {
  if (error instanceof ChunkingError) {
    console.error(`Chunking failed: ${error.message}`);
    console.error(`Strategy: ${error.strategy}`);
    console.error(`Document: ${error.documentId}`);
  }
}
```

## Tests

```bash
npm run test:unit -- ChunkingEngine
npm run test:unit -- ChunkingEngine --verbose
npm run test:coverage -- ChunkingEngine
```

## Workflow

```
Document (von Parser)
    ↓
ChunkingEngine.chunk()
    ↓
ChunkingStrategy (Semantic/Simple/Hybrid)
    ↓
DocumentChunk[] (mit Metadaten + Overlap)
    ↓
→ Extraction (RuleLoader + ExtractionEngine)
→ Validation (HallucinationValidator)
→ Results (ExtractionResult)
```

## Next Steps

- [ ] Performance Tuning für große Dokumente
- [ ] Machine Learning für Boundary-Detection
- [ ] Multilingual Heading Detection
- [ ] OCR-optimierte Chunking
- [ ] Streaming für sehr große Dateien

---

**Letzte Aktualisierung**: 2026-07-05
