# Code Review: Document Upload Validation - ACTUAL Status

**Date**: 2026-07-16  
**Audit**: Code inspection of upload endpoints  
**Finding Level**: CRITICAL ⚠️  

---

## Summary

The **Critical Issue "Missing Input Validation on Document Upload"** is **PARTIALLY ACCURATE**.

- ✅ **Some validation exists** in `src/infrastructure/api/routes/extract-phase14.ts`
- ❌ **But it's incomplete** - missing several security checks
- ❌ **The main endpoint** in `documents.ts` is only mock data (not real file upload)
- ⚠️ **Production risk** still exists due to incomplete validation

---

## What We Found

### 1. Existing Validation (extract-phase14.ts)

**Current Implementation** ✅

```typescript
// Lines 59-73 in extract-phase14.ts
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max ✅
  fileFilter: (_req: any, file: any, cb: any) => {
    const allowedMimes = [
      'application/pdf',
      'text/html',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
    ];
    if (allowedMimes.includes(file.mimetype) || 
        file.originalname.match(/\.(pdf|html|docx)$/i)) { // ✅ File type check
      cb(null, true);
    } else {
      cb(new Error('Only PDF, HTML, and DOCX files are allowed')); // ✅ Rejection
    }
  }
});
```

**What's Implemented**:
- ✅ File size limit: 50MB
- ✅ MIME type whitelist validation
- ✅ File extension pattern matching (.pdf, .html, .docx)
- ✅ Rejects non-whitelisted files

**What's Missing**:
- ❌ Magic byte verification (someone could rename .exe to .pdf)
- ❌ Filename sanitization (no protection against path traversal)
- ❌ Virus/malware scanning
- ❌ File integrity checking (MD5/SHA256 hash)
- ❌ Upload rate limiting
- ❌ User quota enforcement
- ❌ Audit logging of all uploads

---

### 2. Mock Endpoint (documents.ts)

**Current Implementation** (Lines 92-113)

```typescript
router.post('/upload', async (req: ApiRequest, res: Response) => {
  const { filename, format, content } = req.body as Record<string, unknown>;

  if (!filename || !format) {
    throw new ApiResponseError(
      'INVALID_REQUEST',
      400,
      'filename and format are required'
    );
  }

  if (!['pdf', 'docx', 'html'].includes(format as string)) { // ✅ Basic check
    throw new ApiResponseError(
      'INVALID_FORMAT',
      400,
      'format must be pdf, docx, or html',
      { allowedFormats: ['pdf', 'docx', 'html'] }
    );
  }
  
  // Rest is mock...
});
```

**Issue**: This endpoint is **mock** - it doesn't actually handle file uploads via multipart/form-data. It's only for JSON body validation.

**Real file uploads** go through the `extract-phase14.ts` routes which DO have multer validation.

---

## Detailed Validation Gap Analysis

| Security Check | Implemented | Location | Status |
|---|---|---|---|
| **File Size Limit** | ✅ 50MB | extract-phase14.ts:63 | ✅ GOOD |
| **MIME Type Validation** | ✅ Yes | extract-phase14.ts:65-70 | ✅ GOOD |
| **File Extension Whitelist** | ✅ pdf, html, docx | extract-phase14.ts:71 | ✅ GOOD |
| **Magic Byte Verification** | ❌ NO | N/A | 🔴 MISSING |
| **Filename Sanitization** | ❌ NO | N/A | 🔴 MISSING |
| **Virus Scanning** | ❌ NO | N/A | 🔴 MISSING |
| **File Hash Tracking** | ❌ NO | N/A | 🔴 MISSING |
| **Upload Rate Limiting** | ❌ NO | N/A | 🔴 MISSING |
| **User Quota Enforcement** | ❌ NO | N/A | 🔴 MISSING |
| **Audit Logging** | ❌ NO | N/A | 🔴 MISSING |

---

## Attack Scenarios Still Possible

### Scenario 1: Magic Byte Spoofing ⚠️

```
Attacker Action:
- Creates malicious executable: malware.exe (250 KB)
- Adds PDF magic bytes to beginning (4 bytes: %PDF-1.4)
- Renames to: invoice.pdf
- Uploads to system

Current System:
1. Checks MIME type: ✅ Claims to be PDF
2. Checks extension: ✅ Ends with .pdf
3. MIME check passes: ✅ Allowed
4. FILE STORED: ❌ Malware saved to disk!

Result: If file extracted/executed → Malware execution possible
```

**Fix Required**: Verify PDF magic bytes match actual file content
```typescript
const fileBuffer = file.buffer;
const magicBytes = fileBuffer.slice(0, 4).toString('hex');
if (magicBytes !== '25504446') { // %PDF in hex
  throw new Error('File content does not match claimed type');
}
```

### Scenario 2: Path Traversal ⚠️

```
Attacker Action:
- Uploads file named: "../../../var/www/html/shell.php"
- Or: "....//....//....//etc/passwd"

Current System:
- No sanitization of filename
- Filename stored as-is
- Could write outside intended directory

Result: Files could be written to arbitrary locations
```

**Fix Required**: Sanitize filename
```typescript
const sanitizedName = path.basename(file.originalname)
  .replace(/[^\w.-]/g, '_'); // Replace special chars
```

### Scenario 3: Simultaneous Large Uploads ⚠️

```
Attacker Action:
- Open 100 concurrent upload connections
- Upload 50MB file to each
- Total: 5GB being uploaded simultaneously

Current System:
- No rate limiting per user/IP
- No upload queue management
- Could exhaust server resources

Result: Disk I/O exhaustion, Server DoS
```

**Fix Required**: Add rate limiting
```typescript
const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10, // 10 uploads per 15 mins
  keyGenerator: (req) => req.user?.id || req.ip,
});
```

---

## Recommended Remediation Plan

### Phase 1: Critical (Do Immediately)

```typescript
// File: src/infrastructure/api/routes/extract-phase14.ts

// Add magic byte verification
function verifyFileMagic(file: any, extension: string): boolean {
  const magic = file.buffer.slice(0, 4);
  const signatures: { [key: string]: string } = {
    'pdf': '25504446', // %PDF
    'html': '3c212d2d', // <!--
    'docx': '504b0304', // PK.. (ZIP)
  };
  const expected = signatures[extension];
  return expected ? magic.toString('hex').startsWith(expected) : true;
}

// Add filename sanitization
function sanitizeFilename(filename: string): string {
  return path.basename(filename)
    .replace(/[^\w.-]/g, '_')
    .substring(0, 255);
}

// Update multer fileFilter
fileFilter: (_req: any, file: any, cb: any) => {
  try {
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    
    // 1. Check MIME type
    if (!allowedMimes.includes(file.mimetype)) {
      return cb(new Error('Invalid MIME type'));
    }
    
    // 2. Check extension
    if (!['pdf', 'html', 'docx'].includes(ext)) {
      return cb(new Error('Invalid file extension'));
    }
    
    // 3. Verify magic bytes
    if (!verifyFileMagic(file, ext)) {
      return cb(new Error('File content does not match claimed type'));
    }
    
    // 4. Sanitize filename
    file.originalname = sanitizeFilename(file.originalname);
    
    cb(null, true);
  } catch (err) {
    cb(err);
  }
};
```

### Phase 2: Enhanced Security (Next 48 Hours)

```typescript
// Add virus scanning
const NodeClam = require('clamscan');
const clamscan = await new NodeClam().init({
  clamdscan: { host: 'localhost', port: 3310 }
});

router.post('/extract-test', upload.single('file'), async (req, res) => {
  try {
    // Scan file for malware
    const { isInfected } = await clamscan.scanFile(req.file!.path);
    if (isInfected) {
      return res.status(400).json({
        success: false,
        error: 'File is infected with malware'
      });
    }
    // Continue processing...
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// Add rate limiting
import rateLimit from 'express-rate-limit';

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 uploads per 15 minutes
  keyGenerator: (req: any) => req.user?.id || req.ip,
  message: 'Too many uploads, please try again later',
  skip: (req: any) => req.user?.isAdmin, // Skip for admins
});

router.post(
  '/extract-test',
  uploadLimiter,
  upload.single('file'),
  async (req, res) => { /* ... */ }
);

// Add audit logging
async function logUpload(userId: string, filename: string, status: string, error?: string) {
  await db.auditLog.create({
    action: 'FILE_UPLOAD',
    userId,
    filename,
    status,
    error,
    timestamp: new Date(),
    ipAddress: req.ip,
  });
}
```

### Phase 3: User Quota & Storage (Next Week)

```typescript
// User quota enforcement
async function checkUserQuota(userId: string, fileSize: number) {
  const user = await db.users.findById(userId);
  const totalUsed = await getTotalUploadedSize(userId);
  
  if (totalUsed + fileSize > (user.quotaMB * 1024 * 1024)) {
    throw new Error(`Upload would exceed quota. Used: ${totalUsed / 1024 / 1024}MB / ${user.quotaMB}MB`);
  }
}

// File integrity tracking
await db.uploadedFiles.create({
  id: uuidv4(),
  userId,
  originalFilename: file.originalname,
  storedFilename: `${Date.now()}_${file.originalname}`,
  mimeType: file.mimetype,
  size: file.size,
  hash: hashFile(file.buffer), // SHA256
  uploadedAt: new Date(),
  status: 'ready',
});
```

---

## Implementation Checklist

### Phase 1: Critical Fixes (2-3 hours)
- [ ] Add magic byte verification function
- [ ] Add filename sanitization function
- [ ] Update multer fileFilter with all checks
- [ ] Add error handling and logging
- [ ] Write unit tests
- [ ] Test with malicious files (safe environment)

### Phase 2: Enhanced Security (4-6 hours)
- [ ] Set up ClamAV server
- [ ] Integrate virus scanning
- [ ] Add rate limiting middleware
- [ ] Configure rate limit thresholds
- [ ] Add upload audit logging
- [ ] Create monitoring dashboard

### Phase 3: Advanced (8-10 hours)
- [ ] Implement user quotas
- [ ] Add file integrity tracking (SHA256 hashing)
- [ ] Create storage management tools
- [ ] Implement retention policies
- [ ] Add quota enforcement to UI
- [ ] Create admin quota management interface

---

## Current Risk Assessment

### Before Fixes
| Risk | Probability | Impact | Overall |
|------|-------------|--------|---------|
| Magic byte spoofing | HIGH | CRITICAL | 🔴 CRITICAL |
| Path traversal | MEDIUM | HIGH | 🟠 HIGH |
| Concurrent upload DoS | MEDIUM | HIGH | 🟠 HIGH |
| Missing audit trail | HIGH | MEDIUM | 🟠 HIGH |

### After Phase 1
| Risk | Probability | Impact | Overall |
|------|-------------|--------|---------|
| Magic byte spoofing | LOW | CRITICAL | 🟠 HIGH |
| Path traversal | LOW | HIGH | 🟡 MEDIUM |
| Concurrent upload DoS | MEDIUM | HIGH | 🟠 HIGH |
| Missing audit trail | HIGH | MEDIUM | 🟠 HIGH |

### After All Phases
| Risk | Probability | Impact | Overall |
|------|-------------|--------|---------|
| Magic byte spoofing | MINIMAL | CRITICAL | 🟡 LOW |
| Path traversal | MINIMAL | HIGH | 🟢 LOW |
| Concurrent upload DoS | MINIMAL | HIGH | 🟢 LOW |
| Missing audit trail | LOW | MEDIUM | 🟢 LOW |

---

## Files to Modify

1. **Primary**: `src/infrastructure/api/routes/extract-phase14.ts`
   - Update multer configuration
   - Add validation functions
   - Add rate limiting
   - Add audit logging

2. **Secondary**: `src/infrastructure/api/routes/documents.ts`
   - Update mock endpoint to match real implementation
   - Add same validation

3. **New Files**:
   - `src/services/FileValidationService.ts` - Centralized validation
   - `src/services/FileSecurityService.ts` - Scanning & audit
   - `src/middleware/uploadRateLimiter.ts` - Rate limiting config

---

## Dependencies to Add

```json
{
  "dependencies": {
    "clamscan": "^2.1.0",
    "file-type": "^16.5.4",
    "crypto": "builtin",
    "express-rate-limit": "^6.7.0"
  }
}
```

---

## Conclusion

**Status**: 🟠 MEDIUM-HIGH RISK (not CRITICAL, but serious)

**Current State**:
- ✅ Basic validation exists (MIME type, extension, size)
- ❌ Advanced validation missing (magic bytes, sanitization, rate limiting)

**Recommendation**:
1. Implement Phase 1 fixes **immediately** (2-3 hours)
2. Complete Phase 2 within **48 hours**
3. Schedule Phase 3 for **next sprint**

**Priority**: HIGH - Complete Phase 1 before next release

---

**Next Steps**: 
1. Assign developer to implement Phase 1
2. Set up test environment
3. Run security tests with malicious file samples
4. Get security review approval before deployment

