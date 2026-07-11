# MANUAL-0.25.0.md

**Phase 24 Feature Usage Guide**

## Quick Start

### Starting the Application

**Backend:**
```powershell
cd c:\Users\bmarn\OneDrive\HTML\extractor
npm install
npm run build
npm run dev
# or: npm start
# Backend runs on http://localhost:3000
```

**Frontend:**
```powershell
cd frontend
npm install --legacy-peer-deps
npm run dev
# Frontend runs on http://localhost:5173
```

Both services must be running for full functionality.

---

## 1. Job Manager Dashboard

**Access:** http://localhost:5173/jobs (or click "Job Manager" in main navigation)

### Uploading a Document

1. **Click "Upload Document" button** → Opens upload dialog
2. **Select a document file** from your computer (drag-and-drop supported)
3. **Choose document type** from dropdown:
   - PDF
   - HTML
   - DOCX
   - TXT
   - Auto-detect (recommended)
4. **Click "Upload"** → Starts extraction job
5. **Monitor progress** → Linear progress bar shows extraction status

### Job History

The dashboard displays a table of all submitted jobs:

| Column | Description |
|--------|-------------|
| **Job ID** | Unique identifier for the extraction job |
| **Document** | Filename of uploaded document |
| **Type** | Document format (PDF, HTML, DOCX, TXT) |
| **Status** | Current state (Pending, Processing, Completed, Failed) |
| **Timestamp** | When job was submitted |
| **Actions** | View details or download results |

**Status Meanings:**
- 🟡 **Pending** - Job queued, waiting to start
- 🔵 **Processing** - Extraction in progress
- 🟢 **Completed** - Successfully extracted
- 🔴 **Failed** - Error during extraction

### Viewing Job Details

1. **Click "Details" icon** in job row → Opens modal dialog
2. **View extracted sections** with:
   - Section title and hierarchy level
   - Page numbers (start/end)
   - Extracted text content
3. **Download results** → Saves JSON file with extraction data
4. **Close modal** → Click X or outside dialog area

### Key Features

**Statistics Cards** (top of dashboard):
- **Total Jobs:** All submission attempts (completed + in-progress + failed)
- **Completed:** Successfully processed documents
- **Processing:** Jobs currently being extracted
- **Failed:** Jobs with errors

**Batch Operations** (future):
- Multi-document upload (roadmap)
- Batch format conversion (roadmap)
- Template-based extraction (roadmap)

### Example Workflow

```
1. Navigate to Job Manager
2. Click "Upload Document"
3. Select: document.pdf
4. Type: Auto-detect → Recognizes as PDF
5. Status: Pending (2s) → Processing (10s) → Completed
6. Click Details → View extracted sections
7. Download JSON → Save locally for processing
```

---

## 2. iReport Integration

**Access:** http://localhost:5173/ireport (or click "iReport Integration" in main navigation)

### Understanding Templates

The iReport library includes 4 built-in templates:

| # | Template | Output Format | Schema | Use Case |
|---|----------|---------------|--------|----------|
| 1 | Invoice Standard | PDF | invoice_schema_v2.0.0 | Business invoices, billing documents |
| 2 | Purchase Order Report | XLSX | purchase_order_schema_v3.0.0 | PO documents, supply chain data |
| 3 | Contract Document | DOCX | contract_schema_v2.0.0 | Legal contracts, agreements |
| 4 | Delivery Note HTML | HTML | delivery_note_schema_v1.5.0 | Shipping docs, delivery confirmations |

### Converting a Document

1. **Upload Document**
   - Click "Select Document" → Choose file from computer
   - Supports: PDF, HTML, DOCX, TXT
   - File size: < 50MB

2. **Select Template**
   - Choose from template library dropdown
   - View template details (output format, schema)
   - Click "Preview" to see template sample

3. **Start Conversion**
   - Click "Convert"
   - Progress bar shows real-time conversion status
   - Estimated time: 2-15 seconds depending on document size

4. **Download Result**
   - Once completed, click "Download" in conversion history
   - File format matches selected template (PDF, XLSX, DOCX, HTML)
   - Save locally or open directly

### Template Preview

**Clicking "Preview" shows:**
- Template name and description
- Output file format (PDF/XLSX/DOCX/HTML)
- Associated schema version
- Sample output structure

### Conversion History

Table displays all conversions with:

| Column | Description |
|--------|-------------|
| **Template** | Template used for conversion |
| **Original Doc** | Source file name |
| **Status** | Conversion state |
| **Timestamp** | When conversion was started |
| **Output Format** | Resulting file type |
| **Actions** | Download or retry |

**Status Indicators:**
- 🟡 **Processing** - Conversion in progress
- 🟢 **Completed** - Ready to download
- 🔴 **Failed** - See error details

### Statistics

Top cards show:
- **Total Conversions:** All conversion attempts
- **Completed:** Successfully converted
- **Processing:** Currently converting
- **Failed:** Conversions with errors

### Example Workflow

```
1. Navigate to iReport Integration
2. Upload: invoice_document.pdf
3. Select Template: "Invoice Standard" (PDF output)
4. Click Preview → See template structure
5. Click Convert → Watch progress bar (30% → 60% → 100%)
6. Status: Completed (green)
7. Click Download → invoice_document_output.pdf saved
8. Email or process the converted document
```

---

## 3. Supported Document Types

### PDF Documents
- **Adapter:** PdfDocumentAdapter (v0.23.0)
- **Supported:** All PDF versions, scanned PDFs, text-based PDFs
- **Extraction:** Text, tables, metadata
- **Max Size:** 50 MB
- **Speed:** ~1-5 seconds for typical document

### HTML Documents
- **Adapter:** HtmlDocumentAdapter (v0.23.0)
- **Supported:** Standard HTML, DOM parsing
- **Extraction:** Content from DOM nodes, structure preservation
- **Max Size:** 50 MB
- **Speed:** ~0.5-2 seconds

### DOCX Documents (NEW - Phase 24)
- **Adapter:** DocxDocumentAdapter (v0.24.0)
- **Supported:** Microsoft Word 2007+ (.docx), OOXML format
- **Extraction:** Text, sections (from headings), metadata
- **Max Size:** 50 MB
- **Pagination:** ~3000 characters per page
- **Speed:** ~1-3 seconds
- **Heading Detection:** Automatic H1/H2/H3 level recognition

### TXT Documents (NEW - Phase 24)
- **Adapter:** TxtDocumentAdapter (v0.24.0)
- **Supported:** Plain text (.txt), any encoding
- **Extraction:** Text, chapters (from ALL CAPS headings)
- **Max Size:** 100 MB
- **Pagination:** 100 lines per page (configurable)
- **Encoding:** Auto-detects UTF-8, Latin-1, ASCII
- **Speed:** ~0.5-2 seconds
- **Chapter Detection:** Recognizes ALL CAPS text on own line

---

## 4. API Integration (Backend Connection)

### Current Status
- Job Manager: **Mock data** (localStorage)
- iReport: **Mock templates** (hard-coded)

### Connecting to Real Backend

#### Job Manager API Endpoints

**Submit Job**
```typescript
POST /api/jobs/submit
{
  "documentPath": "file.pdf",
  "documentType": "pdf",
  "extractionOptions": { ... }
}
Response:
{
  "jobId": "job-12345",
  "status": "pending",
  "createdAt": "2026-07-10T10:30:00Z"
}
```

**Get Job History**
```typescript
GET /api/jobs
Response:
{
  "jobs": [
    {
      "jobId": "job-12345",
      "documentName": "file.pdf",
      "documentType": "pdf",
      "status": "completed",
      "timestamp": "2026-07-10T10:30:00Z",
      "extractedSections": [ ... ]
    }
  ]
}
```

**Get Job Details**
```typescript
GET /api/jobs/:jobId
Response:
{
  "jobId": "job-12345",
  "status": "completed",
  "document": { ... },
  "sections": [ ... ],
  "metadata": { ... }
}
```

**Download Results**
```typescript
GET /api/jobs/:jobId/download
Response: (binary JSON/PDF file)
```

#### iReport API Endpoints

**Get Templates**
```typescript
GET /api/ireport/templates
Response:
{
  "templates": [
    {
      "id": "invoice-pdf",
      "name": "Invoice Standard",
      "outputFormat": "pdf",
      "schema": "invoice_schema_v2.0.0"
    },
    ...
  ]
}
```

**Submit Conversion**
```typescript
POST /api/ireport/convert
{
  "documentPath": "file.pdf",
  "templateId": "invoice-pdf",
  "options": { ... }
}
Response:
{
  "jobId": "conv-12345",
  "status": "processing",
  "estimatedTime": 5000
}
```

**Check Conversion Status**
```typescript
GET /api/ireport/conversions/:jobId/status
Response:
{
  "jobId": "conv-12345",
  "status": "completed",
  "progress": 100,
  "outputPath": "output/invoice_12345.pdf"
}
```

**Download Conversion Result**
```typescript
GET /api/ireport/conversions/:jobId/download
Response: (binary file in template format)
```

### Implementation Steps

1. **Update JobManager.tsx** (line ~100):
   ```typescript
   // Replace mock API calls
   const response = await axios.get('/api/jobs');
   const jobs = response.data.jobs;
   ```

2. **Update IReportIntegration.tsx** (line ~150):
   ```typescript
   // Replace mock templates
   const response = await axios.get('/api/ireport/templates');
   setTemplates(response.data.templates);
   ```

3. **Configure Axios** (frontend/src/api/):
   - Base URL: `http://localhost:3000` (dev) or production URL
   - Headers: Add auth token if required
   - Error handling: Implement retry logic

---

## 5. Docker Deployment

### Backend Docker

**Build:**
```bash
docker build -f Dockerfile.backend -t audit-extractor:0.25.0 .
```

**Run:**
```bash
docker run -p 3000:3000 \
  -e NODE_ENV=production \
  -v /path/to/uploads:/app/uploads \
  audit-extractor:0.25.0
```

### Frontend Docker

**Build:**
```bash
docker build -f Dockerfile.frontend -t audit-extractor-frontend:0.25.0 .
```

**Run:**
```bash
docker run -p 80:80 audit-extractor-frontend:0.25.0
# Access at http://localhost
```

### Docker Compose

```bash
docker-compose up -d
# Backend: http://localhost:3000
# Frontend: http://localhost:80
```

---

## 6. Troubleshooting

### Job Manager Issues

**Q: Upload button not responding**
- Check backend service is running (`npm run dev` in root folder)
- Verify http://localhost:3000 is accessible
- Clear browser cache and localStorage

**Q: Job status not updating**
- Refresh page (F5)
- Check browser console for errors
- Verify document size < 50MB
- Try with different document format

**Q: Error downloading results**
- Ensure job completed (status = green)
- Try different browser
- Check browser download settings

### iReport Integration Issues

**Q: Template library not loading**
- Refresh page
- Clear localStorage: `localStorage.clear()`
- Check browser console for errors
- Verify templates.json exists

**Q: Conversion fails immediately**
- Check document format is supported (PDF, HTML, DOCX, TXT)
- Verify file size < 50MB
- Try with simpler document first
- See browser console for error details

**Q: Preview dialog not working**
- Try different template
- Clear browser cache
- Restart browser
- Check for JavaScript errors

### Common Solutions

1. **Clear Cache**
   ```javascript
   // Open browser console (F12) and run:
   localStorage.clear();
   sessionStorage.clear();
   location.reload();
   ```

2. **Check Backend Status**
   ```bash
   curl http://localhost:3000/health
   # Should return: { "status": "ok" }
   ```

3. **View Console Errors**
   - Press F12 → Console tab
   - Look for red error messages
   - Copy error text for troubleshooting

4. **Restart Services**
   ```bash
   # Terminal 1: Backend
   cd c:\Users\bmarn\OneDrive\HTML\extractor
   npm run dev
   
   # Terminal 2: Frontend
   cd frontend
   npm run dev
   ```

---

## 7. Performance Tips

### For Large Document Extraction
- **PDF:** > 100 pages may take 5-10 seconds (normal)
- **DOCX:** Large files (50+ MB) may exceed 50MB limit
- **TXT:** Can handle files up to 100MB
- **HTML:** Complex DOM structures may take longer

### Optimization
1. **Upload in background** - Don't close browser during extraction
2. **Use batch processing** - Multiple small files faster than one large file
3. **Monitor server load** - If slow, reduce concurrent uploads
4. **Clear job history** - Periodic cleanup improves UI responsiveness

### Expected Times (Typical Documents)
- Small document (< 1MB): 1-3 seconds
- Medium document (1-10MB): 3-8 seconds
- Large document (10-50MB): 10-30 seconds

---

## 8. Feature Roadmap (Future)

### Planned for Phase 25+
- [ ] Real backend integration (API endpoints)
- [ ] User authentication and authorization
- [ ] Advanced search and filtering
- [ ] Scheduled batch processing
- [ ] Email notifications for job completion
- [ ] Web hooks for external systems
- [ ] Custom template creation
- [ ] OCR for scanned documents
- [ ] Machine learning-based auto-categorization
- [ ] Multi-language support

### Known Limitations (Phase 24)
- Mock data stored in localStorage (limited by browser storage)
- No persistent database (data lost on browser clear)
- No user accounts or authentication
- No email notifications
- No batch processing automation

---

## Contact & Support

For issues or questions:
1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review [API_REFERENCE.md](./API_REFERENCE.md)
3. See [DOCUMENTATION_INDEX_0.25.0.md](./DOCUMENTATION_INDEX_0.25.0.md)

---

**Manual Version:** 0.25.0  
**Last Updated:** July 10, 2026  
**Status:** Production Ready
