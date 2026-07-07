# Frontend: Document Extraction Dashboard

React-basierte Benutzeroberfläche für die Audit-Safe Document Extractor.

## Features

- **Responsive Design**: Funktioniert auf Desktop, Tablet und Mobilgeräten
- **Dark Mode Support**: Vorbereitet für helles/dunkles Theme
- **Document Explorer**: Upload, Anzeige und Verwaltung von Dokumenten
- **Extraction Workbench**: Transparente Visualisierung des kompletten Extraktionsflusses (10 Schritte)
- **Material UI**: Moderne, barrierefreie UI-Komponenten

## Struktur

```
frontend/
├── src/
│   ├── components/        # React-Komponenten
│   │   ├── DocumentExplorer.tsx
│   │   └── ExtractionWorkbench.tsx
│   ├── pages/            # Seiten-Komponenten
│   ├── services/         # Business-Logik (Mock/API)
│   │   ├── documentService.ts
│   │   └── extractionService.ts
│   ├── hooks/            # Custom React Hooks
│   │   ├── useDocuments.ts
│   │   └── useExtraction.ts
│   ├── App.tsx           # Hauptkomponente mit Router
│   └── main.tsx          # Entry Point
├── public/               # Statische Assets
├── package.json
├── vite.config.ts
├── tsconfig.json
└── index.html
```

## Installation

```bash
cd frontend
npm install
```

## Entwicklung

```bash
npm run dev
# Öffnet http://localhost:5173
```

## Build

```bash
npm run build
# Erzeugt dist/ Ordner
```

## Navigation

- **Dashboard**: System-Übersicht (kommend)
- **Documents**: Document Explorer (Upload, Preview, Delete)
- **Extraction Workbench**: Kompletter Extraktionsfluss mit 10 Schritten
- **Configuration**: Einstellungen (kommend)
- **System Status**: Systemstatus (kommend)
- **Backups**: Backup-Verwaltung (kommend)
- **Help**: Hilfe und Dokumentation (kommend)

## ExtractionWorkbench

10 Schritte mit vollständiger Transparenz:

1. **Source Document** - Quelldatei-Info
2. **Parser Result** - Extrahierter Text
3. **Chunks** - Dokumentenzerlegung
4. **Rules** - Angewendete Regeln
5. **Prompt** - LLM-Eingabe
6. **LLM Response** - Modell-Output
7. **Validation** - Schema-Prüfung
8. **JSON Result** - Bereinigtes Ergebnis
9. **Reflection** - Quality Assessment
10. **Quality Report** - Audit Trail

Alle Zwischenschritte sind inspizierbar. Keine versteckten Operationen.

## Mock Service

Der Document Service simuliert Backend-Operationen mit lokalen Daten. 
Der Extraction Service simuliert den vollständigen Extraktionsfluss.
Später können diese gegen echte REST API ausgetauscht werden:

```typescript
// Zukünftig
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
const response = await fetch(`${API_BASE}/extract`);
```

## Responsive Design

- **Desktop**: Full Navigation + Sidebar
- **Tablet**: Collapsible Drawer
- **Mobile**: Hamburger Menu + Touch-freundliche Buttons

## Dark Mode

Dark Mode wird durch den Toggle in der App Bar aktiviert. 
Die Einstellung wird später in localStorage gespeichert.

## Technologie-Stack

- React 18
- TypeScript
- Vite
- React Router v6
- Material-UI v5
- Emotion (CSS-in-JS)
