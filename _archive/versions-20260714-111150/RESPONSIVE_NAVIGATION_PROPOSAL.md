# Responsive Navigation Design - Proposer

## Problem mit aktueller Navigation

Die aktuelle Navigation hat 14 flache Menüpunkte:
- ❌ Nicht kategorisiert
- ❌ Auf Mobile schwer zu scannen
- ❌ Keine Gruppierung nach Funktionsbereichen
- ❌ Keine Shortcuts für häufige Features
- ❌ Keine Breadcrumb-Navigation

---

## Empfohlene Navigation Structure

### **1. Kategorisierte Navigation**

```
📊 EXTRACTION (Hauptfunktionen)
  ├─ Dashboard
  ├─ Job Manager (neu)
  └─ Extraction Workbench

📄 DOCUMENTS & SCHEMA
  ├─ Documents
  ├─ Schema Management
  ├─ Schema Upload
  └─ iReport Integration (neu)

⚙️ RULES & LEARNING
  ├─ Rule Editor
  ├─ Learning Center
  └─ Version History

🔍 MONITORING & AUDIT
  ├─ Audit Trail
  ├─ Logs
  └─ Backups

⚙️ SYSTEM
  ├─ Configuration
  └─ Help Center
```

**Vorteile:**
- ✅ Logical Grouping
- ✅ Max 5 Items pro Kategorie
- ✅ Schneller Zugriff
- ✅ Bessere Mental Models

---

## Desktop Navigation (≥ 960px)

### Layout: Sidebar + Top Bar

```
┌────────────────────────────────────────────────┐
│  ☰ Audit-Safe    Search...      🌙  👤       │
├──────────────┬──────────────────────────────────┤
│ 📊 Extraction│                                  │
│ ├ Dashboard  │                                  │
│ ├ Job Mgr    │   MAIN CONTENT                   │
│ └ Workbench  │                                  │
│              │                                  │
│ 📄 Documents │                                  │
│ ├ Documents  │                                  │
│ ├ Schemas    │                                  │
│ ├ Upload     │                                  │
│ └ iReport    │                                  │
│              │                                  │
│ ⚙️ Rules     │                                  │
│ ├ Rules      │                                  │
│ ├ Learning   │                                  │
│ └ History    │                                  │
│              │                                  │
│ 🔍 Monitoring│                                  │
│ ├ Audit      │                                  │
│ ├ Logs       │                                  │
│ └ Backups    │                                  │
│              │                                  │
│ ⚙️ System    │                                  │
│ ├ Config     │                                  │
│ └ Help       │                                  │
└──────────────┴──────────────────────────────────┘
```

**Features:**
- Sidebar bleibt sichtbar (noch Platz)
- Kategorie-Header klickbar (Collapse/Expand)
- Icons + Labels für bessere Erkennbarkeit
- Hover-Effekte

---

## Tablet Navigation (600px - 960px)

### Layout: Hamburger + Collapsed Sidebar

```
┌────────────────────────────────┐
│ ☰ Audit-Safe  Search 🌙 👤   │
├────────────────────────────────┤
│ [Icons nur Sidebar]            │
│ 📊 📄 ⚙️ 🔍 ⚙️  [Toggle]       │
│                                │
│ MAIN CONTENT                   │
│                                │
│                                │
└────────────────────────────────┘
```

**Features:**
- Icons-only Sidebar (80px width)
- Tooltip bei Hover
- Hamburger-Menü für Kategorien
- Bottom-Sheet für Navigation

---

## Mobile Navigation (< 600px)

### Layout: Hamburger + Bottom Navigation

```
┌──────────────────────────┐
│ ☰  Dashboard    🌙 👤   │   ← Top Bar
├──────────────────────────┤
│                          │
│  MAIN CONTENT            │
│                          │
│                          │
├──────────────────────────┤
│ 📊 📄 ⚙️  🔍 ⚙️ ☰      │   ← Bottom Navigation
└──────────────────────────┘
```

**Features:**
- Hamburger-Menü (oben)
- Bottom Navigation für 5 Hauptkategorien
- Swipe-Support
- Tab-Aktivität anzeigen

---

## Implementierungs-Details

### **1. Navigation Kategorien (TypeScript Interface)**

```typescript
interface NavCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  color?: string;
  items: NavItem[];
  collapsible?: boolean;
}

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  badge?: number;  // for notifications
}
```

### **2. Responsive Breakpoints**

| Device | Width | Layout | Sidebar | Bottom Nav |
|--------|-------|--------|---------|------------|
| Mobile | <600px | Hamburger | None | Icons (5) |
| Tablet | 600-960px | Icons-only | Collapsed | Tooltips |
| Desktop | >960px | Full Width | Expanded | Full Labels |

### **3. Kategorien Definition**

```typescript
const navigationCategories: NavCategory[] = [
  {
    id: 'extraction',
    label: 'Extraction',
    icon: <ExtractIcon />,
    color: '#2196f3',
    items: [
      { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
      { label: 'Job Manager', path: '/jobs', icon: <JobIcon />, badge: 2 },
      { label: 'Extraction Workbench', path: '/workbench', icon: <WorkbenchIcon /> },
    ]
  },
  {
    id: 'documents',
    label: 'Documents & Schema',
    icon: <DocumentIcon />,
    color: '#4caf50',
    items: [
      { label: 'Documents', path: '/documents', icon: <DocumentsIcon /> },
      { label: 'Schema Management', path: '/schemas', icon: <SchemaIcon /> },
      { label: 'Schema Upload', path: '/schema-wizard', icon: <CloudUploadIcon /> },
      { label: 'iReport Integration', path: '/ireport', icon: <ReportIcon /> },
    ]
  },
  // ... weitere Kategorien
];
```

---

## Features für Better UX

### **1. Breadcrumb Navigation**
```
Home > Documents > Schema Management > Invoice Schema
```

### **2. Search/Quick Access**
```
CMD+K / CTRL+K zum Öffnen der Command Palette
```

### **3. Recently Used**
```
Zuletzt verwendet:
• Job Manager (5 min ago)
• Schema Upload (1 hour ago)
• Dashboard
```

### **4. Favorites/Pinning**
```
User kann bis zu 5 Favoriten an den Top "anpinnen"
```

### **5. Notifications Badge**
```
Job Manager [2]  ← 2 ungelöste Jobs
```

---

## Mobile-Spezifische Features

### **1. Bottom Sheet für Navigation**

```
Swipe up → Zeigt volle Navigation
Tap ☰ → Toggle Hamburger-Menü
```

### **2. Landscape Mode**

```
┌────────────────────────────────────────┐
│ ☰  Dash  Search 🌙 👤                 │
├───────────────┬────────────────────────┤
│ 📊 📄 ⚙️ 🔍  │ MAIN CONTENT           │
│ ⚙️ ☰          │                        │
│               │                        │
└───────────────┴────────────────────────┘
```

---

## Animation & Transitions

### **1. Drawer Animation (Hamburger)**
- Slide-in from left (300ms)
- Scrim overlay fade-in
- Smooth close

### **2. Category Expand/Collapse**
- Slide down items (150ms)
- Rotate arrow icon
- Smooth height transition

### **3. Active Link Highlight**
- Left border indicator
- Background highlight
- Color coded by category

---

## Accessibility (a11y)

- ✅ ARIA labels für alle Navigation-Items
- ✅ Keyboard navigation (Arrow keys, Tab, Enter)
- ✅ Semantic HTML (`<nav>`, `<ul>`, `<li>`)
- ✅ Focus management
- ✅ Skip navigation link

---

## Performance Optimization

### **1. Lazy Load Categories**
```typescript
// Nur aktive Kategorie expanded
const [expandedCategory, setExpandedCategory] = useState('extraction');
```

### **2. Virtual Scrolling** (wenn >20 Items)
```typescript
import { FixedSizeList } from 'react-window';
```

### **3. Memoization**
```typescript
const NavItem = React.memo(({item}) => {...});
```

---

## Browser Support

- ✅ Chrome/Edge 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Mobile Chrome/Safari

---

## Migration Path

### **Phase 1: Add Categories (No Breaking Change)**
- Neue Komponente: `NavigationCategories.tsx`
- Alte Navigation noch parallel
- Feature Flag zum Umschalten

### **Phase 2: Responsive Layout**
- Desktop: Volle Sidebar mit Kategorien
- Tablet: Icons-only Sidebar
- Mobile: Hamburger-Menü

### **Phase 3: Polish & Features**
- Breadcrumbs
- Search/Command Palette
- Recently Used
- Favorites Pinning
- Notifications

---

## Estimated Implementation Time

| Komponente | Zeit | Komplexität |
|------------|------|-------------|
| Category Navigation | 4h | Mittel |
| Responsive Layouts | 6h | Mittel |
| Animations | 3h | Leicht |
| Breadcrumbs | 2h | Leicht |
| Search/Command | 5h | Hoch |
| Testing | 4h | Mittel |
| **Total** | **24h** | |

---

## Files to Create/Modify

```
frontend/src/
├── components/
│   ├── Navigation/
│   │   ├── NavigationDrawer.tsx       (Kategorien-basierte Drawer)
│   │   ├── NavigationCategories.ts    (Datendefinition)
│   │   ├── NavCategoryGroup.tsx       (Kategorie-Komponente)
│   │   ├── NavItem.tsx                (Einzelnes Menü-Item)
│   │   ├── BottomNavigation.tsx       (Mobile Bottom Nav)
│   │   └── Breadcrumb.tsx             (Breadcrumb-Navigation)
│   ├── SearchPalette.tsx              (Command Palette / Search)
│   └── App.tsx                        (Anpassungen für neue Navigation)
├── hooks/
│   ├── useNavigation.ts               (Navigations-State)
│   └── useResponsive.ts               (Responsive Breakpoints)
├── styles/
│   └── navigation.module.css           (CSS Modules)
└── utils/
    └── navigationConfig.ts             (Navigation Konfiguration)
```

---

## Next Steps

1. ✅ Diesen Vorschlag reviewen
2. 🔄 Design in Figma/Miro visualisieren
3. 🔄 Component-Struktur prüfen
4. 🔄 Implementation starten mit Phase 1
