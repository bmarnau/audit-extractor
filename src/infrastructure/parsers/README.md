# src/infrastructure/parsers/

Parser Framework für Datei-Extraktion.

## Übersicht

```
DocumentParser (Interface)
    ↓
BaseParser (Abstract)
    ├── PdfParser (pdf-parse)
    ├── DocxParser (mammoth)
    └── HtmlParser (cheerio)
        ↓
    ParserFactory (Automatische Auswahl)
```

## Parser

| Parser | Format | Library | Status |
|--------|--------|---------|--------|
| **PdfParser** | .pdf | pdf-parse | ✅ |
| **DocxParser** | .docx | mammoth | ✅ |
| **HtmlParser** | .html, .htm | cheerio | ✅ |

## Verwendung

### Automatische Parser-Auswahl (empfohlen)

```typescript
import { ParserFactory } from '@infrastructure/parsers';

const fileBuffer = await fs.readFile('document.pdf');
const document = await ParserFactory.parse(fileBuffer, 'document.pdf');
```

### Manuell - Spezifischer Parser

```typescript
import { PdfParser } from '@infrastructure/parsers';

const parser = new PdfParser();
const document = await parser.parse(fileBuffer, 'invoice.pdf');
```

### Prüfen ob Format unterstützt

```typescript
const isSupported = ParserFactory.isSupported('document.pdf'); // true
const isSupported = ParserFactory.isSupported('data.xlsx');    // false

const formats = ParserFactory.getSupportedFormats(); 
// ["pdf", "docx", "html"]
```

## Methoden (DocumentParser Interface)

```typescript
// Prüft ob Parser zuständig ist
canHandle(fileName: string): boolean

// Komplettes Parsing: Text + Metadaten + Images
parse(fileBuffer: Buffer, fileName: string): Promise<Document>

// Nur Text extrahieren
extractText(fileBuffer: Buffer): Promise<string>

// Nur Metadaten
extractMetadata(fileBuffer: Buffer, fileName: string): Promise<Record<string, unknown>>

// Image-REFERENZEN (NICHT die Bilder!)
extractImages(fileBuffer: Buffer): Promise<Record<string, unknown>[]>

// Format-String
getSupportedFormat(): string
```

## Kritisch: Keine Datengenerierung!

### ❌ FALSCH

```typescript
// Auto-fill fehlender Metadaten
metadata: {
  author: "Unknown",  // ← Erfunden!
  title: data.title || "Untitled"  // ← Default!
}

// Image-Beschreibung erfinden
images: [{
  description: "A document"  // ← Auto-generated!
}]

// Fehlende Felder füllen
chunks: [
  { text: "..." },
  { text: "GENERATED SUMMARY" }  // ← Hallucination!
]
```

### ✅ RICHTIG

```typescript
// Nur echte Daten
metadata: {
  author: undefined,  // Falls nicht vorhanden
  title: data.title   // Nur wenn extrahierbar
}

// Nur Referenzen
images: [{
  path: "image-0",
  alt: "Existing alt text"  // Nur falls im HTML
  // NO: description (nur wenn vorhanden!)
}]

// Nur extrahierte Chunks
chunks: [
  { text: "..." },
  { text: "..." }
]
```

## BaseParser Features

- ✅ SHA256 Hash für Document-ID
- ✅ Automatic page number detection
- ✅ Chunk creation aus Text
- ✅ Metadata normalisierung
- ✅ Image reference handling
- ✅ Error handling mit ParsingError

## Fehlerbehandlung

```typescript
import { ParsingError } from '@infrastructure/parsers';

try {
  const doc = await ParserFactory.parse(buffer, 'file.pdf');
} catch (error) {
  if (error instanceof ParsingError) {
    console.error(`Parser error in ${error.fileName}: ${error.message}`);
    console.error(`Format: ${error.format}`);
  }
}
```

## Tests

```bash
npm run test:unit -- ParserFactory
npm run test:unit -- PdfParser
npm run test:unit -- HtmlParser
```

### Test-Abdeckung

- ✅ Format detection
- ✅ canHandle() validation
- ✅ Unsupported format rejection
- ✅ No data generation enforcement
- ✅ Metadata extraction
- ✅ Text extraction
- ✅ Image reference handling
- ✅ Error handling

## Nächste Schritte

- [ ] Integration mit DocumentLoader
- [ ] Batch-Parsing von source-documents/
- [ ] Caching von geparsten Documents
- [ ] Performance-Optimierung für große Dateien
- [ ] Erweiterte PDF-Image-Extraction

---

**Letzte Aktualisierung**: 2026-07-05
