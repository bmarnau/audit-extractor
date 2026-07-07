# Phase 14d Integration Guide

## Overview
Phase 14d provides 4 new React components for the learning feedback loop. These components integrate with the Phase 14c backend APIs to enable users to:
1. Correct extraction errors
2. Receive AI improvement suggestions
3. Monitor learning progress

## Components

### 1. ExtractionFeedbackForm
**Purpose:** Collect user corrections on extracted fields

**Import:**
```typescript
import { ExtractionFeedbackForm } from '@/components/learning';
```

**Props:**
```typescript
interface ExtractionFeedbackFormProps {
  resultId: string;              // Unique extraction result ID
  docType: string;               // Document type (e.g., 'invoice')
  extractedFields: Array<{       // Fields with confidence scores
    field: string;
    value: string;
    confidence: number;
  }>;
  onSuccess?: (feedbackId: string) => void;
  onError?: (error: string) => void;
}
```

**Example:**
```tsx
<ExtractionFeedbackForm
  resultId="result-001"
  docType="invoice"
  extractedFields={extractionResult.extractedFields}
  onSuccess={(feedbackId) => console.log('Feedback:', feedbackId)}
/>
```

**API Integration:**
- `POST /api/extract/extraction/:resultId/feedback`
- Body: `{ docType, fieldFeedback[], userEmail? }`

---

### 2. SuggestionReviewPanel
**Purpose:** Display AI-generated improvement suggestions

**Import:**
```typescript
import { SuggestionReviewPanel } from '@/components/learning';
```

**Props:**
```typescript
interface SuggestionReviewPanelProps {
  resultId: string;              // Extraction result ID
  docType: string;               // Document type
  onApply?: (appliedCount: number) => void;
  onError?: (error: string) => void;
}
```

**Example:**
```tsx
<SuggestionReviewPanel
  resultId="result-001"
  docType="invoice"
  onApply={(count) => console.log(`${count} improvements applied`)}
/>
```

**Features:**
- Auto-loads suggestions on mount
- Shows pattern comparison
- Displays example corrections
- Toggle selection (high-confidence auto-selected)
- Apply with confirmation dialog

**API Integration:**
- `GET /api/extract/extraction/:resultId/suggestions?docType=X`
- `POST /api/extract/rules/:docType/improve`

---

### 3. ImprovementDashboard
**Purpose:** Monitor learning progress and rule improvements

**Import:**
```typescript
import { ImprovementDashboard } from '@/components/learning';
```

**Props:**
```typescript
interface ImprovementDashboardProps {
  docType: string;               // Document type for metrics
}
```

**Example:**
```tsx
<ImprovementDashboard docType="invoice" />
```

**Features:**
- Success rate KPI (current % and trend)
- Applied suggestions counter
- Active feedback items
- Recent rule changes timeline
- Mock data in Phase 14d (integrate real API in Phase 15)

**Planned API Integration (Phase 15):**
- `GET /api/extract/rules/:docType/metrics`
- `GET /api/extract/learning/summary?docType=X`

---

### 4. LearningWorkflowContainer
**Purpose:** Unified integration of all learning components

**Import:**
```typescript
import { LearningWorkflowContainer } from '@/components/learning';
```

**Props:**
```typescript
interface LearningWorkflowContainerProps {
  result: {
    resultId: string;
    docType: string;
    extractedFields: Array<{ field: string; value: string; confidence: number }>;
    missingFields: Array<{ field: string; reason: string }>;
    quality: { successRate: number; confidence: number };
  };
  onFeedbackSubmitted?: (feedbackId: string) => void;
  onImprovementsApplied?: (count: number) => void;
}
```

**Example:**
```tsx
<LearningWorkflowContainer
  result={extractionResult}
  onFeedbackSubmitted={(id) => console.log('Feedback:', id)}
  onImprovementsApplied={(count) => console.log('Applied:', count)}
/>
```

**Layout:**
- **Main (2/3):** Results + Feedback Form + Suggestions
- **Sidebar (1/3):** Dashboard + Learning Tips

---

## Integration Steps

### Step 1: Import Components
```typescript
import {
  ExtractionFeedbackForm,
  SuggestionReviewPanel,
  ImprovementDashboard,
  LearningWorkflowContainer,
} from '@/components/learning';
```

### Step 2: Create Learning Route
In `frontend/src/pages/` or your routing system:
```typescript
// LearningPage.tsx
import { LearningWorkflowContainer } from '@/components/learning';

export function LearningPage() {
  const [result, setResult] = useState(null);

  // Load result from URL param or API
  useEffect(() => {
    const resultId = new URLSearchParams(window.location.search).get('result');
    // Fetch result...
  }, []);

  if (!result) return <Loader />;

  return (
    <LearningWorkflowContainer
      result={result}
      onFeedbackSubmitted={handleFeedback}
      onImprovementsApplied={handleImprove}
    />
  );
}
```

### Step 3: Link from Extraction Results
In `ExtractionWorkbench.tsx`:
```typescript
import { Link } from 'react-router-dom';

// In results display:
<Button
  component={Link}
  to={`/learning?result=${result.resultId}`}
  variant="contained"
>
  Provide Feedback
</Button>
```

### Step 4: Backend Verification
Ensure backend APIs are running on `:3000/api/extract`:
```bash
# Start backend
cd /path/to/extractor
npm run dev
```

Test endpoints:
```bash
# Feedback
curl -X POST http://localhost:3000/api/extract/extraction/result-001/feedback \
  -H "Content-Type: application/json" \
  -d '{"docType":"invoice","fieldFeedback":[...]}'

# Suggestions
curl http://localhost:3000/api/extract/extraction/result-001/suggestions?docType=invoice

# Apply improvements
curl -X POST http://localhost:3000/api/extract/rules/invoice/improve \
  -H "Content-Type: application/json" \
  -d '{"suggestions":[...]}'
```

---

## State Management Hook

Use the provided hook for state handling:
```typescript
import { useLearningWorkflow } from '@/hooks/useLearningWorkflow';

export function MyComponent() {
  const workflow = useLearningWorkflow();

  const handleSubmit = async () => {
    try {
      await workflow.submitFeedback('result-001', 'invoice', feedbackData);
      console.log(`${workflow.feedbackCount} feedback items submitted`);
    } catch (err) {
      console.error(workflow.error);
    }
  };

  return (
    <div>
      {workflow.feedbackSubmitting && <Spinner />}
      <button onClick={handleSubmit}>Submit</button>
    </div>
  );
}
```

---

## Testing

### Unit Tests (Recommended)
```typescript
// components/learning/ExtractionFeedbackForm.test.tsx
import { render, screen } from '@testing-library/react';
import { ExtractionFeedbackForm } from './ExtractionFeedbackForm';

test('submits feedback correctly', async () => {
  render(
    <ExtractionFeedbackForm
      resultId="test-001"
      docType="invoice"
      extractedFields={[...]}
    />
  );

  // Test interactions...
});
```

### Integration Tests
```bash
# Start backend
npm run dev

# In another terminal, run frontend tests
npm run test:integration

# Or use test script
node scripts/test-phase14d-integration.js
```

---

## Next Phases

### Phase 15: Real API Integration
- Replace mock data in ImprovementDashboard with real API calls
- Add metrics endpoint: `GET /api/extract/metrics/:docType`
- Add learning summary endpoint: `GET /api/extract/learning/summary`

### Phase 16: Advanced Features
- Multi-field pattern correlation
- Seasonal/temporal pattern detection
- Cross-document type learnings
- Automated A/B testing of rule changes

---

## Troubleshooting

**Issue:** Components not found
```
Error: Cannot find module '@/components/learning'
```
**Solution:** Verify `frontend/src/components/learning/` exists and `index.ts` exports are correct

**Issue:** API 404 errors
```
POST http://localhost:3000/api/extract/extraction/result-001/feedback 404
```
**Solution:** 
- Ensure backend is running: `npm run dev` in root directory
- Check port :3000 is not blocked
- Verify CORS headers in backend (`src/infrastructure/api/server.ts`)

**Issue:** Feedback not showing in suggestions
```
GET /api/extract/extraction/result-001/suggestions returns empty []
```
**Solution:**
- Wait a few seconds after submitting feedback (AI analysis happens async)
- Check `learning/feedback/` directory for recorded feedback files
- Ensure FeedbackService is initialized in backend

---

## Performance Notes

- Components use React.memo for optimization
- Lazy loading for heavy suggestions list
- Local state for form validation (no unnecessary re-renders)
- API calls debounced for search inputs

---

## Accessibility

- All form fields labeled properly
- Keyboard navigation for all buttons
- ARIA labels for confidence scores
- Color not the only indicator (icons + text)

---

*Phase 14d Integration Guide - Ready for Production*
