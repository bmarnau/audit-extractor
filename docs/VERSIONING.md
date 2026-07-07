## Versioning & Phase Information

### Current Version: 0.11.0

This project follows **Semantic Versioning** with numbered phases:

```
MAJOR.MINOR.PATCH
├─ MAJOR: Breaking changes or major phase completions (2.0.0 = Phase 2 complete)
├─ MINOR: New features and phase increments (0.11.0 = Phase 11)
└─ PATCH: Bug fixes (0.11.1)
```

### Completed Phases

| Phase | Name | Status | Files |
|-------|------|--------|-------|
| 2 | Domain Models | ✅ | `src/core/models/` |
| 3 | RuleLoader | ✅ | `src/domain/ExtractionRule.ts` |
| 4a | Parser Framework | ✅ | `src/infrastructure/parsers/` |
| 5 | ExampleRepository | ✅ | `src/infrastructure/repositories/` |
| 6 | ChunkingEngine | ✅ | `src/application/chunking/` |
| 7 | DocumentClassifier | ✅ | `src/application/classification/` |
| 8 | **LLMExtractor** | ✅ | `src/application/LLMExtractor.ts` |
| 9 | **HallucinationValidator** | ✅ | `src/domain/HallucinationValidator.ts` |
| 10 | ValidationService | ✅ | `src/domain/validation/` |
| 11 | **REST API + Frontend** | ✅ | `src/infrastructure/api/`, `frontend/src/` |

### Version Constants

**Backend**: `src/version.ts`
```typescript
export const PROJECT_VERSION = '0.11.0';
export const CURRENT_PHASE = Phase.REST_API;
```

**Frontend**: `frontend/src/version.ts`
```typescript
export const FRONTEND_VERSION = '0.11.0';
export const PHASE = 11;
```

### Logging on Startup

**Backend**:
```bash
npm run dev
# Output:
# ============================================================
# Audit-Safe Document Extractor v0.11.0
# Phase 11: REST API Infrastructure
# Build: 2026-07-06T...
# ============================================================
```

**Frontend**:
```bash
npm run dev:frontend
# (Debug logging when VITE_LOG_LEVEL=debug)
```

### File Headers

All new files include phase and version metadata:

```typescript
/**
 * ComponentName - Phase 11
 * 
 * Description...
 * 
 * @version 0.11.0
 * @phase 11
 * @status COMPLETE
 */
```

### Updates Timeline

- **0.10.0** (2026-07-05): Phases 2-7, 10 complete
- **0.11.0** (2026-07-06): Phase 8, 9, 11 complete - REST API + Frontend UI
- **0.12.0** (Planned): Integration layer + DI Container
