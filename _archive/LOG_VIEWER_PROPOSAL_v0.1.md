# Log-Viewer Proposal v0.1

**Datum**: 8.7.2026  
**Status**: ✅ Concept Ready  
**Ziel**: Schnelle Fehlersuche in großen Logmengen mit intuitiver UI

---

## 📌 Executive Summary

Das aktuelle Log-System zeigt Logs in linearer Textform. Für schnelle Fehlersuche brauchen wir:

1. **Echtzeit-Filterung** nach Severity, Timestamp, Service
2. **Schnelle Fehlersuche** mit Highlighting
3. **Visuelle Hierarchie** zur schnellen Scan-Übersicht
4. **Export/Archiv** für Audit & Compliance
5. **Performance** auch bei 100.000+ Log-Zeilen

---

## 🎨 UI/UX Design

### Layout (Current → Proposed)

```
CURRENT:
┌─────────────────────────────────┐
│ Plain Text Logs                 │
│ [scrolling huge wall of text]   │
│ Hard to spot errors in chaos    │
└─────────────────────────────────┘

PROPOSED:
┌──────────────────────────────────────────────────────┐
│ [FILTER BAR]  [SEARCH]  [EXPORT]  [REALTIME TOGGLE]│
├──────────────────────────────────────────────────────┤
│ ✓ ERROR   ✓ WARN   ✓ INFO   ✓ DEBUG                │
│ ✓ Backend ✓ Frontend ✓ Database ✓ API              │
│ From: [2026-07-08 14:00]  To: [2026-07-08 16:00]   │
├──────────────────────────────────────────────────────┤
│ [14:32:15.001] 🔴 ERROR - Backend                  │
│   SchemaExtraction: Route /list not found            │
│   Stack: at SchemaExtractionRoutes.ts:45             │
│   [View Stack] [Share Error]                        │
│                                                       │
│ [14:32:18.234] 🟡 WARN - Database                   │
│   Connection pool low (8/10 available)               │
│                                                       │
│ [14:35:22.567] 🟢 INFO - API                        │
│   GET /api/schema/list - 200 OK (45ms)              │
│   [Details] [Replay Request]                        │
└──────────────────────────────────────────────────────┘
```

---

## 🔍 Feature-Breakdown

### 1. **Multi-Filter Panel** (Links)

```
SEVERITY FILTER:
 ☑ 🔴 ERROR       (47 logs)
 ☑ 🟡 WARN        (123 logs)
 ☑ 🟢 INFO        (2341 logs)
 ☑ ⚪ DEBUG       (5123 logs)

SERVICE FILTER:
 ☑ Backend        (1203 logs)
 ☑ Frontend       (345 logs)
 ☑ Database       (234 logs)
 ☑ API            (567 logs)
 ☑ Extraction     (89 logs)

TIME RANGE:
 From: [2026-07-08 14:00 ▼]
 To:   [2026-07-08 16:00 ▼]

QUICK ACTIONS:
 [Last 1 Hour]  [Last 24 Hours]  [Clear All]
```

### 2. **Search Bar** (Oben, Prominent)

```
┌────────────────────────────────────────────────────┐
│ 🔍 Search logs (e.g., "schema", "error", "uuid")  │
│ ✓ Regex Mode  ✓ Case Sensitive                    │
│ Found: 12 matches | Highlighting in results      │
└────────────────────────────────────────────────────┘
```

**Features**:
- Live-Suche während Eintippen
- Regex-Support für Power-User
- Automatisches Highlighting
- "Previous / Next" Navigation
- Match-Counter

### 3. **Log Entry Card** (Neue Struktur)

```
┌─────────────────────────────────────────────────────┐
│ [14:32:15.001]  🔴 ERROR  Backend  (3.2 KB)        │ ← Header
├─────────────────────────────────────────────────────┤
│ Error Type:   SchemaExtractionRoutes                │ ← Parsed Fields
│ Message:      Route /list not found                 │
│ Endpoint:     GET /api/schema/list                  │
│ User:         hans.mueller (admin)                  │
│ Request-ID:   req-93d8e4f2-7b91-4c91-92f1-c8e9... │
├─────────────────────────────────────────────────────┤
│ STACK TRACE:                                        │ ← Expandable
│ ▼ SchemaExtractionRoutes.ts:45                      │
│   at new Error (schema-routes.ts:45:15)             │
│   at Router.get (express.ts:234:8)                  │
│   [... 8 more lines]                                │
├─────────────────────────────────────────────────────┤
│ [DETAILS] [COPY LOG] [SHARE ERROR] [CONTEXT]       │ ← Actions
└─────────────────────────────────────────────────────┘
```

### 4. **Error Context Mode**

Bei Klick auf einen ERROR: Zeige umliegende Logs (±10 Zeilen)

```
[14:31:50] INFO - Backend started
[14:32:10] INFO - Schema endpoint mounted
[14:32:15] ⚠️  WARN - Database latency 450ms
>>> [14:32:15] 🔴 ERROR - Route /list not found  <<<
[14:32:16] INFO - Request requeued
[14:32:20] 🟡 WARN - Retry count exceeded
```

---

## 📊 Data Visualization

### Option A: Error Rate Timeline (oben)

```
Errors/Min Timeline:
┌─────────────────────────────────────────────┐
│         ╱╲      ╱╲                          │
│    ╱╲  ╱  ╲    ╱  ╲                         │
│   ╱  ╲╱    ╲  ╱    ╲____                    │
│  ╱___      ╲╱         ╰╮╰╮                  │
└─────────────────────────────────────────────┘
  14:00  14:15  14:30  14:45  15:00
```

Red spike = Error burst (14:32) → könnte Benutzer direkt zu dieser Zeit navigieren.

### Option B: Service Load Distribution

```
Backend:   ████████░░░░ 67%
Frontend:  ████░░░░░░░░ 28%
Database:  ██░░░░░░░░░░ 4%
API:       █░░░░░░░░░░░ 1%
```

---

## 🚀 Implementation Roadmap

### Phase 1: MVP (Week 1)
- ✅ Basic filter UI (Severity + Service)
- ✅ Search bar mit Highlighting
- ✅ Time range picker
- ✅ Log card display (expandable)
- Est. effort: 16h (React components, styling)

### Phase 2: Enhanced Search (Week 2)
- 🔄 Regex support
- 🔄 Saved searches
- 🔄 Error context mode
- Est. effort: 8h

### Phase 3: Analytics (Week 3)
- 🔄 Error rate timeline
- 🔄 Service load distribution
- 🔄 Trend analysis (errors over time)
- Est. effort: 12h

### Phase 4: Export & Compliance (Week 4)
- 🔄 CSV/JSON export
- 🔄 Report generation
- 🔄 Audit trail
- Est. effort: 8h

---

## 💾 Technical Architecture

### Frontend (React Component)

```typescript
// frontend/src/components/LogViewer/LogViewerV2.tsx

interface LogFilter {
  severities: SeverityLevel[];      // ERROR, WARN, INFO, DEBUG
  services: ServiceType[];           // Backend, Frontend, Database, API
  timeRange: { from: Date; to: Date };
  searchQuery?: string;
  useRegex?: boolean;
}

interface LogEntry {
  timestamp: ISO8601;
  severity: SeverityLevel;
  service: ServiceType;
  message: string;
  errorType?: string;
  stackTrace?: string[];
  context?: Record<string, any>;
  userId?: UUID;
  requestId?: UUID;
}

// Main component
<LogViewerV2
  filter={filter}
  onFilterChange={setFilter}
  logs={filteredLogs}
  loading={isLoading}
/>
```

### Backend API (Neue Endpoint)

```bash
# Enhanced Logs Endpoint
GET /api/logs/search
  ?severity=ERROR,WARN
  &service=Backend,Database
  &from=2026-07-08T14:00:00Z
  &to=2026-07-08T16:00:00Z
  &query=schema
  &limit=100
  &offset=0

Response:
{
  "logs": [ LogEntry[], ... ],
  "totalCount": 2341,
  "filteredCount": 47,
  "stats": {
    "errorCount": 12,
    "warnCount": 35,
    "avgResponseTime": 234,
    "topErrors": [ "Route not found", "Connection timeout", ... ]
  }
}
```

---

## 🎯 Use Cases

### Use Case 1: "Why did extraction fail at 14:32?"
1. Filtere auf ERROR severity
2. Setze Time range auf 14:30-14:35
3. Suche "extraction"
4. Expandiere Error → Stack trace
5. Sehe umliegende Logs für Context

### Use Case 2: "Show me all API endpoint errors today"
1. Filter: ERROR + API service
2. Auto-populate: Last 24 hours
3. Search: "endpoint" oder "404" oder "5xx"
4. [EXPORT] → CSV für Bug-Report

### Use Case 3: "Is Database performance degrading?"
1. Filter: Database service
2. Search: "latency" oder "slow"
3. View Timeline → erkenne Performance-Spike
4. Click spike → auto-navigate zu problematischer Zeit

---

## 🎨 Color Scheme

```
🔴 ERROR   → #E53935 (Red)
🟡 WARN    → #FBC02D (Amber)
🟢 INFO    → #43A047 (Green)
⚪ DEBUG   → #616161 (Grey)

Search highlight → #FFEB3B (Yellow background)
Selected error   → #E0F2F1 (Teal background)
```

---

## 📱 Responsive Design

```
Desktop (1920px):
┌──────────────────────────────────────────────────┐
│ [Filter Panel] [Main Log View]                   │
│ 20% width      80% width                         │
└──────────────────────────────────────────────────┘

Tablet (768px):
┌──────────────────────────────────────────────────┐
│ [▼ Filters]  [Main Log View]                     │
│ Collapsible    Full width                        │
└──────────────────────────────────────────────────┘

Mobile (375px):
┌──────────────────────┐
│ [Filters] [Search]   │
│ [Log View - Stacked] │
└──────────────────────┘
```

---

## 📋 Acceptance Criteria

- ✅ Filters (Severity + Service) aktiv & funkional
- ✅ Search bar findet Logs < 200ms (mit <5000 Logs)
- ✅ Stack traces expandierbar
- ✅ Time range picker mit Quick-Links
- ✅ Export in mindestens CSV format
- ✅ Mobile responsive (≥375px)
- ✅ Accessibility: WCAG 2.1 AA compliant
- ✅ Performance: Renders 1000 logs in <500ms

---

## 🔄 Dependencies

- **Frontend**: React 18.2, Material-UI 5.14 (vorhanden)
- **Backend**: Express (vorhanden), evtl. log filtering service
- **Data**: Existing logs from `/api/logs` endpoint (anpassen nötig)

---

## 📞 Next Steps

1. **Review**: Benutzerfeedback auf Proposal sammeln
2. **Prototype**: Quick UI mockup in Figma/Miro
3. **MVP Sprint**: Implementation Phase 1 starten
4. **Testing**: E2E tests für Filter + Search
5. **Deployment**: Phase 2026-07-15

---

**Proposed by**: GitHub Copilot  
**For**: AuditSafe Document Extraction v0.18.0+  
**Status**: Ready for Review ✅
