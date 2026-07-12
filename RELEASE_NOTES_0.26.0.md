# Release Notes v0.26.0

**Release Date**: 2026-07-12  
**Version**: 0.26.0  
**Phase**: 26 - Layout Improvements & Flex Architecture  

---

## Overview

Phase 26 focuses on comprehensive layout restructuring and content readability improvements. The application now uses a flex-based architecture for better content display and responsive behavior across all device sizes.

---

## Key Improvements

### 1. Flex-Based Layout Architecture ✅
- **Root Container**: Changed to `display: flex, flexDirection: column` for proper space distribution
- **AppBar**: Fixed positioning with proper z-index management
- **Main Container**: Flex row layout for sidebar + content side-by-side positioning
- **Content Area**: Flex: 1 with `overflow: auto` for proper scrolling behavior
- **Responsive Behavior**: Sidebar width adapts to breakpoints (280px desktop, 80px tablet, 0px mobile)

**Benefits:**
- Content no longer cuts off on right side
- Proper horizontal scrolling when needed
- Content area fully readable and accessible
- Better space utilization across all breakpoints

### 2. Responsive Navigation ✅
- **Desktop (>960px)**: Full sidebar (280px) with category labels and descriptions
- **Tablet (600-960px)**: Compact icon-only sidebar (80px) with tooltips
- **Mobile (<600px)**: Hamburger menu + bottom tab navigation
- Category expansion/collapse: 150ms animations
- Drawer transitions: 300ms smooth animations

### 3. Layout Components

#### ResponsiveNavigationDrawer.tsx
- Updated drawer height calculation: Uses `height: 100%` for flex parent
- Proper drawer sizing across all breakpoints
- Mobile overlay with backdrop for drawer
- Desktop/tablet permanent drawer positioning

#### App.tsx (Refactored)
- New AppContent child component for Router context
- Proper flex layout structure with column at root
- Sidebar + content flex row layout
- Mobile bottom navigation spacing (pb)
- BreadcrumbNavigation positioned correctly

#### MobileBottomNavigation.tsx
- Fixed at bottom with 5 category tabs
- Auto-navigation to first item in category
- Badges for unread/notification counts
- Hidden on tablet/desktop

#### BreadcrumbNavigation.tsx
- Dynamic breadcrumb generation from pathname
- Desktop/tablet only (hidden on mobile)
- Clickable navigation trail

---

## Technical Details

### Flex Layout Structure

```
Box (root, display: flex, flexDirection: column)
├── AppBar (position: fixed, zIndex: drawer + 1)
└── Box (main container, display: flex, flex: 1)
    ├── Sidebar (width: 280/80/0px, flexShrink: 0)
    ├── Mobile Overlay (position: absolute, zIndex: drawer)
    └── Main Content (flex: 1, overflow: auto)
        ├── BreadcrumbNavigation
        └── Routes (all 14 pages)
        
Mobile Bottom Navigation (position: fixed, bottom: 0)
```

### Breakpoint System

| Breakpoint | Sidebar | Content | Navigation |
|-----------|---------|---------|------------|
| Desktop >960px | 280px permanent | Full width - 280px | Full labels |
| Tablet 600-960px | 80px permanent | Full width - 80px | Icons only |
| Mobile <600px | 0px (hidden) | Full width | Hamburger + Bottom |

### Navigation Categories (5 Total)

1. **Extraction** (extraction)
   - Dashboard
   - Job Manager
   - Extraction Workbench

2. **Documents & Schema** (documents)
   - iReport Editor
   - Schema Wizard
   - Schema Management
   - Schema History
   - Document Gallery

3. **Rules & Learning** (rules)
   - Rule Editor
   - Learning Module
   - Knowledge Base

4. **Monitoring & Audit** (monitoring)
   - Audit Log Viewer
   - System Logs
   - Activity Reports

5. **System** (system)
   - Configuration
   - Backups
   - Help & Documentation

---

## Bug Fixes

### Content Layout Issues ✅
- **Issue**: Right half of content area not readable, abruptly cut off
- **Cause**: Incorrect flex layout structure, sidebar not properly positioned
- **Fix**: Restructured App.tsx with proper flex column at root, flex row for sidebar+content
- **Result**: Content fully readable and scrollable on all breakpoints

### Category Expansion Not Working ✅
- **Issue**: Clicking category headers didn't expand/collapse sub-items
- **Cause**: State not passed to ResponsiveNavigationDrawer, case sensitivity mismatch
- **Fix**: Added expandedCategories state with lowercase keys, passed onToggleCategory handler
- **Result**: Smooth category expansion/collapse with 150ms animations

### Router Context Error ✅
- **Issue**: "useLocation() may be used only in the context of a <Router> component"
- **Cause**: App.tsx used useLocation without BrowserRouter wrapper
- **Fix**: Created AppContent child component, wrapped App with BrowserRouter in main.tsx
- **Result**: Proper Router context hierarchy, all location hooks work correctly

---

## Cleanup Operations

### Files Archived ✅
The following obsolete files have been moved to `archive/` directory:
- `PHASE_24_FINAL_COMPLETION_REPORT.md`
- `PHASE_24_IMPLEMENTATION.md`
- `test-*.json`, `test-*.js`, `test-*.ps1` (all test files)
- Old `RELEASE_NOTES_0.11.0` through `0.20.0`

### Repository Structure
- Clean root directory with only active documentation
- Archive directory for historical references
- Reduced noise and improved navigation
- Better version control history clarity

---

## Documentation Updates

### Updated Files
- `MANUAL-0.25.0.md` → Renamed to `MANUAL-0.26.0.md` (planned)
- `OPERATIONS_MANUAL.md` → Version reference updated
- `App.tsx` → Version comment updated to v0.26.0
- `package.json` → Version updated to 0.26.0

### New Files
- `RELEASE_NOTES_0.26.0.md` (this file)

---

## Testing Results

### Responsive Breakpoints ✅
- ✅ Desktop (1920x1080): Sidebar (280px) + content visible, scrollable
- ✅ Tablet (768x1024): Icon-only sidebar (80px), responsive layout
- ✅ Mobile (375x667): Hamburger menu + bottom navigation
- ✅ Transitions: Smooth animations between breakpoints

### Navigation Functionality ✅
- ✅ Category expansion/collapse on all sizes
- ✅ Menu item navigation works (14 routes)
- ✅ Breadcrumb navigation displays correctly
- ✅ Dark mode toggle functional
- ✅ Mobile drawer overlay with backdrop

### Content Display ✅
- ✅ No horizontal overflow on any breakpoint
- ✅ Content scrollable with overflow:auto
- ✅ Tables/forms display correctly
- ✅ Layout responsive to viewport changes

---

## Performance

### Rendering
- Fixed AppBar eliminates layout shifts
- Flex layout reduces recalculations
- 150ms category animations (smooth)
- 300ms drawer animations (smooth)

### Bundle Size
- No additional dependencies
- Pure MUI + React layout changes
- ~2KB additional flex CSS

---

## Known Limitations

None identified in Phase 26.

---

## Upgrade Instructions

### From v0.25.0 to v0.26.0

1. **Update package.json**: Version automatically updated to 0.26.0
2. **Clear browser cache**: Hard refresh (Ctrl+Shift+R) to load new layout
3. **No database migration**: Backend compatibility maintained
4. **No API changes**: All endpoints remain unchanged

### Rollback (if needed)

Git can revert to v0.25.0:
```bash
git checkout tags/v0.25.0
```

---

## Future Improvements (Phase 27+)

- [ ] Add theme customization panel
- [ ] Implement sidebar width persistence (localStorage)
- [ ] Add keyboard shortcuts panel
- [ ] Animation performance optimization
- [ ] Accessibility audit (WCAG 2.1 AA)

---

## Contributors

- Layout Architecture: GitHub Copilot
- Testing & Validation: Phase 26 Team
- Documentation: Phase 26 Documentation

---

## Support

For issues or questions about v0.26.0, refer to:
- `MANUAL-0.26.0.md` - Complete operations manual
- `OPERATIONS_MANUAL.md` - Business operations guide
- `TROUBLESHOOTING.md` - Known issues and solutions

---

**End of Release Notes v0.26.0**
