# Quick Start: Fix Document Upload Validation

**Priority**: 🔴 CRITICAL  
**Effort**: Phase 1 = 2-3 hours  
**Assigned To**: [DEVELOPER NAME]  
**Target Date**: TODAY  

---

## What's the Problem?

The document upload endpoint has **incomplete validation**:
- ✅ File size limit exists (50MB)
- ✅ MIME type checking exists
- ✅ File extension whitelist exists
- ❌ **Missing**: Magic byte verification
- ❌ **Missing**: Filename sanitization  
- ❌ **Missing**: Rate limiting
- ❌ **Missing**: Audit logging

**Risk**: Attackers could upload malware by spoofing file types.

---

## Phase 1: Quick Fix (2-3 Hours)

### Step 1: Edit extract-phase14.ts

Open: `src/infrastructure/api/routes/extract-phase14.ts`

**At line 59**, replace the multer configuration:

```typescript
// BEFORE (current code):
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowedMimes = [
      'application/pdf',
      'text/html',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (allowedMimes.includes(file.mimetype) || 
        file.originalname.match(/\.(pdf|html|docx)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, HTML, and DOCX files are allowed'));
    }
  }
});

// AFTER (new code):
// Helper function: Verify file magic bytes
function verifyFileMagic(buffer: Buffer, extension: string): boolean {
  const signatures: { [key: string]: string } = {
    pdf: '25504446',  // %PDF
    html: '3c21',     // <!--
    docx: '504b0304', // PK.. (ZIP header)
  };
  
  const hex = buffer.slice(0, 4).toString('hex');
  const expected = signatures[extension.toLowerCase()];
  
  if (!expected) return true; // Unknown type, allow
  return hex.startsWith(expected);
}

// Helper function: Sanitize filename
function sanitizeFilename(filename: string): string {
  return path.basename(filename)
    .replace(/[^\w.-]/g, '_')     // Replace special chars
    .substring(0, 255);            // Limit length
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req: any, file: any, cb: any) => {
    try {
      const ext = path.extname(file.originalname).toLowerCase().slice(1);
      
      // Check 1: File extension
      if (!['pdf', 'html', 'docx'].includes(ext)) {
        return cb(new Error('File extension not allowed'));
      }
      
      // Check 2: MIME type
      const allowedMimes = [
        'application/pdf',
        'text/html',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      if (!allowedMimes.includes(file.mimetype)) {
        return cb(new Error('File type not allowed'));
      }
      
      // Check 3: Magic bytes (NEW)
      if (!verifyFileMagic(file.buffer, ext)) {
        return cb(new Error('File content does not match claimed type (magic byte mismatch)'));
      }
      
      // Check 4: Sanitize filename (NEW)
      file.originalname = sanitizeFilename(file.originalname);
      
      cb(null, true);
    } catch (err) {
      cb(err);
    }
  }
});
```

### Step 2: Add Rate Limiting

At the top of the file, add imports:

```typescript
import rateLimit from 'express-rate-limit';
```

Then before the routes, add:

```typescript
// Rate limiting for upload endpoint
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                  // 20 uploads per window
  keyGenerator: (req: any) => req.user?.id || req.ip,
  message: 'Too many uploads. Please try again later.',
  skip: (req: any) => req.user?.role === 'admin', // Skip for admins
  standardHeaders: true,
  legacyHeaders: false,
});
```

### Step 3: Apply Rate Limiter to Route

Find the upload routes (search for `/extract-test` POST handler) and add the limiter:

```typescript
// BEFORE:
router.post('/extract-test', upload.single('file'), async (req, res) => {

// AFTER:
router.post('/extract-test', uploadLimiter, upload.single('file'), async (req, res) => {
```

### Step 4: Add Audit Logging

Add logging at the start of upload handler:

```typescript
router.post('/extract-test', uploadLimiter, upload.single('file'), async (req, res) => {
  const file = req.file;
  const userId = (req as any).user?.id || 'anonymous';
  const timestamp = new Date().toISOString();
  
  // Log upload attempt
  console.log(`[${timestamp}] Upload attempt: user=${userId}, file=${file?.originalname}, size=${file?.size}`);
  
  // ... rest of handler
});
```

---

## Step 5: Install Rate Limiter Package

Run in terminal:

```bash
npm install express-rate-limit
```

---

## Phase 1 Testing Checklist

After making changes, test these scenarios:

### Test 1: Normal PDF Upload ✅

```bash
# Should SUCCEED
curl -X POST http://localhost:3000/api/extract-test \
  -F "file=@sample.pdf"
  
Expected: 200 OK
```

### Test 2: Malicious Executable as PDF ❌

```bash
# Create a test file that LOOKS like PDF but is executable
# (This is a SAFE test - just test the validation, not actual execution)

# Create file with PDF header but binary content
(echo -n '%PDF-1.4'; cat /usr/bin/whoami) > fake-pdf.pdf

# Try to upload
curl -X POST http://localhost:3000/api/extract-test \
  -F "file=@fake-pdf.pdf"
  
Expected: 400 Bad Request - "File content does not match claimed type"
```

### Test 3: Rate Limiting ⏱️

```bash
# Try to upload 25 times in quick succession
for i in {1..25}; do
  curl -X POST http://localhost:3000/api/extract-test \
    -F "file=@sample.pdf"
done

Expected: Requests 1-20 succeed, requests 21-25 get 429 Too Many Requests
```

### Test 4: Filename Sanitization 🔒

```bash
# Try filename with path traversal
curl -X POST http://localhost:3000/api/extract-test \
  -F "file=@../../etc/passwd"
  
Expected: 
- File accepted
- But stored as: _____etc_passwd (sanitized)
```

---

## Phase 1 Verification

After implementation, verify:

- [ ] Code compiles with no errors
- [ ] `npm run build` succeeds
- [ ] All 4 test scenarios above pass
- [ ] No console errors in browser
- [ ] Upload endpoint still works for valid files
- [ ] Rate limiter working (429 on excess requests)

---

## Phase 2: Virus Scanning (Optional - Next 48 Hours)

If you want to add virus scanning:

```bash
# Install ClamAV
apt-get install clamav clamav-daemon

# Test it works
clamscan /path/to/test/file.pdf
```

Then add to code:

```typescript
import { Clamscan } from 'clamscan';

const clamscan = await new Clamscan().init({
  clamdscan: { host: 'localhost', port: 3310 }
});

// In upload handler, after file is received:
const { isInfected } = await clamscan.scanFile(file.path);
if (isInfected) {
  // Delete file and reject
  throw new Error('File contains malware');
}
```

---

## Common Issues & Fixes

### Issue: "verifyFileMagic is not defined"
**Fix**: Make sure the function is defined BEFORE the multer config

### Issue: "rateLimit is not imported"
**Fix**: Add at top: `import rateLimit from 'express-rate-limit';`

### Issue: "Cannot read property 'buffer' of undefined"
**Fix**: Make sure multer is configured for memory storage (it is)

### Issue: "path is not defined"
**Fix**: Add at top: `import path from 'path';`

---

## Files to Modify

1. `src/infrastructure/api/routes/extract-phase14.ts` ✏️

---

## Estimated Time

| Task | Time |
|------|------|
| Code changes | 45 min |
| Testing | 45 min |
| Documentation | 30 min |
| **Total** | **2 hours** |

---

## When Complete

1. ✅ Create PR with changes
2. ✅ Get code review approved
3. ✅ Merge to main
4. ✅ Deploy to staging
5. ✅ Run integration tests
6. ✅ Deploy to production
7. ✅ Monitor for issues

---

## Questions?

Refer to detailed analysis:
- Full security analysis: [CRITICAL_ISSUE_ANALYSIS_INPUT_VALIDATION.md](./CRITICAL_ISSUE_ANALYSIS_INPUT_VALIDATION.md)
- Code review: [CODE_REVIEW_UPLOAD_VALIDATION.md](./CODE_REVIEW_UPLOAD_VALIDATION.md)

**Contact**: [Your Name]  
**Deadline**: End of day TODAY

---

