# 📋 Phase 17: Frontend Integration Plan

**Status**: Ready (waiting for Phase 16 tests to pass)  
**Date**: 8.7.2026  
**Trigger**: When Phase 16 all tests pass ✅

---

## 🎯 Phase 17 Objectives

Integriere Phase 16D React-Komponenten in die Hauptanwendung und verbinde sie mit Phase 15 Workflow.

---

## 📋 Implementation Checklist

### Step 1: Component Integration (~2 hours)

**Files to modify**:
- `frontend/src/App.tsx` - Main App shell
- `frontend/src/pages/` - Add schema management pages
- `frontend/src/layouts/` - Layout for schema views

**Tasks**:

```typescript
// 1. Import Phase 16D Components
import SchemaListComponent from './components/SchemaListComponent';
import SchemaEditorComponent from './components/SchemaEditorComponent';
import VersionHistoryComponent from './components/VersionHistoryComponent';

// 2. Add Router for Schema Management
<Route path="/schemas" element={<SchemaListComponent />} />
<Route path="/schema/:id/edit" element={<SchemaEditorComponent />} />
<Route path="/schema/:id/history" element={<VersionHistoryComponent />} />

// 3. Connect Navigation
- Add "Schema Management" menu item
- Link from SchemaUploadWizard to SchemaListComponent
- Add back-navigation from components
```

**Success Criteria**:
- ✅ Components render without errors
- ✅ Routing works
- ✅ Navigation accessible
- ✅ No TypeScript errors

---

### Step 2: API Hooks (React Queries) (~2 hours)

**Create**: `frontend/src/hooks/useSchemaAPI.ts`

```typescript
// Hook 1: useSchemas() - List all schemas
export const useSchemas = (page = 1, limit = 20) => {
  // GET /api/schemas?page=page&limit=limit
  // Return: { schemas, total, loading, error }
};

// Hook 2: useSchema() - Get single schema
export const useSchema = (schemaId: string) => {
  // GET /api/schema/:schemaId
  // Return: { schema, loading, error }
};

// Hook 3: useRules() - Get rules for schema
export const useRules = (schemaId: string) => {
  // GET /api/schema/:schemaId/rules
  // Return: { rules, stats, loading, error }
};

// Hook 4: useVersionHistory() - Get version history
export const useVersionHistory = (schemaId: string) => {
  // GET /api/schema/:schemaId/version-history
  // Return: { versions, loading, error }
};

// Hook 5: useCreateSchema() - Create schema
export const useCreateSchema = () => {
  // POST /api/schema/upload
  // Return: { createSchema, loading, error }
};

// Hook 6: useUpdateSchema() - Update schema
export const useUpdateSchema = (schemaId: string) => {
  // PATCH /api/schema/:schemaId
  // Return: { updateSchema, loading, error }
};

// Hook 7: useDeleteSchema() - Delete schema
export const useDeleteSchema = (schemaId: string) => {
  // DELETE /api/schema/:schemaId
  // Return: { deleteSchema, loading, error }
};
```

**Library**: React Query or SWR  
**Success Criteria**:
- ✅ All hooks implemented
- ✅ Error handling works
- ✅ Loading states functional
- ✅ No API errors

---

### Step 3: State Management (~1 hour)

**Option A**: Redux (if already used)
```typescript
// redux/schemaSlice.ts
export const schemaSlice = createSlice({
  name: 'schema',
  initialState: { schemas: [], current: null, versions: [] },
  reducers: {
    setSchemas: (state, action) => { state.schemas = action.payload },
    setCurrentSchema: (state, action) => { state.current = action.payload },
    setVersionHistory: (state, action) => { state.versions = action.payload }
  }
});
```

**Option B**: Context API (simpler)
```typescript
// SchemaContext.tsx
export const SchemaContext = createContext<SchemaContextType>(null);

export const SchemaProvider = ({ children }) => {
  const [schemas, setSchemas] = useState([]);
  const [currentSchema, setCurrentSchema] = useState(null);
  
  return (
    <SchemaContext.Provider value={{ schemas, setSchemas, ... }}>
      {children}
    </SchemaContext.Provider>
  );
};
```

**Success Criteria**:
- ✅ State centralized
- ✅ Components read from state
- ✅ Mutations update state
- ✅ No prop drilling

---

### Step 4: Component Updates (~2 hours)

**SchemaListComponent Updates**:
```typescript
// Add API integration
const { schemas, loading, error } = useSchemas();

// Add create button
<Button onClick={() => navigate('/schema/create')}>
  Create New Schema
</Button>

// Add actions in table
<TableCell>
  <IconButton onClick={() => navigate(`/schema/${id}/edit`)}>
    <EditIcon />
  </IconButton>
  <IconButton onClick={() => navigate(`/schema/${id}/history`)}>
    <HistoryIcon />
  </IconButton>
  <IconButton onClick={() => handleDelete(id)}>
    <DeleteIcon />
  </IconButton>
</TableCell>
```

**SchemaEditorComponent Updates**:
```typescript
// Load schema from API
useEffect(() => {
  fetchSchema(schemaId);
}, [schemaId]);

// Save to API
const handleSave = async (data) => {
  await updateSchema(schemaId, data);
  showSuccessMessage('Schema updated');
};
```

**VersionHistoryComponent Updates**:
```typescript
// Load versions from API
useEffect(() => {
  fetchVersionHistory(schemaId);
}, [schemaId]);

// Add restore button
<Button onClick={() => restoreVersion(versionId)}>
  Restore This Version
</Button>
```

**Success Criteria**:
- ✅ Components use hooks
- ✅ API calls work
- ✅ State updates flow
- ✅ Errors handled gracefully

---

### Step 5: Error Handling & Validation (~1 hour)

**Add Error Boundaries**:
```typescript
<ErrorBoundary>
  <SchemaListComponent />
</ErrorBoundary>
```

**Add Form Validation**:
```typescript
const validateSchema = (data) => {
  const errors = [];
  if (!data.name) errors.push('Name required');
  if (!data.schema) errors.push('Schema required');
  return errors;
};
```

**Add Success/Error Notifications**:
```typescript
<Snackbar open={showSuccess} message="Schema created" />
<Alert severity="error">{error?.message}</Alert>
```

**Success Criteria**:
- ✅ Error boundaries work
- ✅ Validation prevents bad data
- ✅ User sees clear messages
- ✅ Graceful failure handling

---

### Step 6: Integration Tests (~1 hour)

**File**: `tests/phase17-integration.test.ts`

```typescript
describe('Phase 17: Frontend Integration', () => {
  
  test('SchemaListComponent loads schemas', async () => {
    // Mock API
    // Render component
    // Check schemas render
  });
  
  test('SchemaEditorComponent updates schema', async () => {
    // Mock API
    // Render component
    // Change form
    // Submit
    // Check API called
  });
  
  test('VersionHistoryComponent shows versions', async () => {
    // Mock API
    // Render component
    // Check versions displayed
  });
  
  test('E2E: Schema upload -> edit -> view history', async () => {
    // Full workflow test
  });
});
```

**Success Criteria**:
- ✅ All tests pass
- ✅ Coverage > 80%
- ✅ No flaky tests
- ✅ Mock API works

---

### Step 7: Documentation & Commit (~1 hour)

**Create Documentation**:
- `PHASE_17_COMPLETION_REPORT.md` - What was done
- `frontend/README.md` - Updated with new components
- `RELEASE_NOTES_0.17.0.md` - New features

**Git Commit**:
```bash
git add -A
git commit -m "Phase 17: Frontend Integration Complete

Phase 17 Achievements:
- SchemaListComponent integrated with API
- SchemaEditorComponent connected to update endpoint
- VersionHistoryComponent shows version history
- React Query hooks for all schema operations
- Error handling and validation
- Integration tests passing
- Documentation updated

Components now fully functional with backend persistence"
```

**Success Criteria**:
- ✅ Documentation complete
- ✅ All changes committed
- ✅ RELEASE_NOTES updated
- ✅ Version bumped to 0.17.0

---

## 📊 Phase 17 Timeline

| Step | Task | Time | Status |
|------|------|------|--------|
| 1 | Component Integration | 2h | ⏳ Pending |
| 2 | API Hooks | 2h | ⏳ Pending |
| 3 | State Management | 1h | ⏳ Pending |
| 4 | Component Updates | 2h | ⏳ Pending |
| 5 | Error Handling | 1h | ⏳ Pending |
| 6 | Integration Tests | 1h | ⏳ Pending |
| 7 | Documentation | 1h | ⏳ Pending |
| **TOTAL** | | **~10h** | |

---

## 🎯 Success Criteria Phase 17

✅ All React components render  
✅ API integration working  
✅ Schema CRUD operations functional  
✅ Error handling in place  
✅ Integration tests passing  
✅ Documentation complete  
✅ Zero TypeScript errors  
✅ Git committed  

---

## 📋 Files to Create/Modify

### New Files:
- `frontend/src/hooks/useSchemaAPI.ts` (API hooks)
- `frontend/src/pages/SchemaManagementPage.tsx` (Main page)
- `tests/phase17-integration.test.ts` (Integration tests)
- `PHASE_17_COMPLETION_REPORT.md` (Documentation)
- `RELEASE_NOTES_0.17.0.md` (Release notes)

### Modified Files:
- `frontend/src/App.tsx` (Add routing)
- `frontend/src/components/SchemaListComponent.tsx` (Add API integration)
- `frontend/src/components/SchemaEditorComponent.tsx` (Add API integration)
- `frontend/src/components/VersionHistoryComponent.tsx` (Add API integration)
- `package.json` (Version bump to 0.17.0)

---

## 🚀 Launch Phase 17

**Trigger**: When Phase 16 tests all pass ✅

```bash
# Automated:
npm run phase17:start

# Manual:
# 1. Create Phase 17 structure
# 2. Implement steps 1-7 above
# 3. Run tests
# 4. Commit changes
```

---

## 📈 After Phase 17

### Phase 18: Advanced Features
- Batch operations (delete multiple schemas)
- Schema comparison (v1 vs v2 diff viewer)
- Rules export/import (JSON, CSV)
- Advanced filtering & search

### Phase 19: Optimization
- Performance tuning
- Caching strategy
- Progressive loading
- Virtual scrolling

### Phase 20: Production Ready
- Security audit
- Load testing
- Deployment preparation
- Monitoring setup

---

**Status**: Ready for Phase 16 Success ✅  
**Version**: 0.17.0 (planned)  
**Created**: 8.7.2026
