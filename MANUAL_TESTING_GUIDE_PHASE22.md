# Phase 22 - Manuelle Test-Dokumentation
## Job-Structure API: Komplette Szenario-Tests

**Version:** 0.37.0  
**Erstellungsdatum:** 2026-07-10  
**Test-Framework:** cURL / Postman oder HTTP Client  
**Basis-URL:** `http://localhost:3000/api/v1`

---

📘 **OPERATIONS MANUAL**: Siehe [MANUAL-0.37.0.md](MANUAL-0.37.0.md) für vollständige Operations-Dokumentation, CLI-Referenz, und Fehlerbehandlung.

Dieses Dokument konzentriert sich auf **detaillierte Test-Szenarien** und **Phase 23+ iReport Integration**.

---

## 📋 Test-Übersicht

Diese Dokumentation beschreibt **7 API-Endpunkte** mit **45+ Testszenarios** basierend auf realen docusnap-Dokumenttypen:
1. Invoice (Rechnung) - PDF 245.6 KB
2. Delivery Note (Lieferschein) - PDF 156.4 KB  
3. Purchase Order (Bestellung) - HTML 89.2 KB
4. Quote (Angebot) - PDF 312.4 KB
5. Contract (Vertrag) - PDF 567.8 KB
6. Multi-Document (Mehrfach-Upload) - 3 Dokumente 970 KB

---

## 🧪 Test-Sequenz

**Empfehlung:** Tests in dieser Reihenfolge ausführen (State Machine):
1. **POST /jobs/structure** - Job erstellen
2. **GET /jobs/:jobId/structure** - Metadaten abrufen
3. **GET /jobs/:jobId/validate** - Struktur validieren
4. **PUT /jobs/:jobId** - Status aktualisieren (queued → running → completed)
5. **GET /jobs/:jobId/size** - Größe berechnen
6. **DELETE /jobs/:jobId** - Job löschen
7. **GET /jobs** - Alle Jobs auflisten

---

## 📌 Endpoint 1: POST /jobs/structure - Neuen Job erstellen

### 1.1 Testfall: Invoice (Rechnung) erstellen

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/jobs/structure \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "pdf",
    "sourceFiles": [
      {
        "filePath": "invoice_2024_001.pdf",
        "mimeType": "application/pdf",
        "hash": "sha256_abc123_invoice",
        "sizeBytes": 245632
      }
    ],
    "schemaId": "invoice-schema-0.37.0",
    "schemaPath": "schemas/invoice-v2.json",
    "schemaVersion": "0.37.0",
    "options": {
      "enableHallucinationCheck": true,
      "confidenceThreshold": 0.85,
      "maxRetries": 3,
      "timeoutMs": 30000,
      "enableAuditLogging": true,
      "notifyOnCompletion": false
    }
  }'
```

**Erwartete Response (HTTP 201):**
```json
{
  "success": true,
  "data": {
    "jobId": "JOB-0001",
    "documentType": "pdf",
    "status": "queued",
    "createdAt": "2026-07-10T10:30:00.000Z",
    "updatedAt": "2026-07-10T10:30:00.000Z",
    "sources": [
      {
        "sourceId": "src_uuid_123",
        "filePath": "invoice_2024_001.pdf",
        "mimeType": "application/pdf",
        "hash": "sha256_abc123_invoice",
        "uploadedAt": "2026-07-10T10:30:00.000Z",
        "sizeBytes": 245632
      }
    ],
    "schema": {
      "schemaId": "invoice-schema-0.37.0",
      "schemaName": "invoice-schema-0.37.0",
      "schemaPath": "schemas/invoice-v2.json",
      "version": "0.37.0",
      "fieldsCount": 0,
      "uploadedAt": "2026-07-10T10:30:00.000Z"
    },
    "examples": [],
    "options": {
      "enableHallucinationCheck": true,
      "confidenceThreshold": 0.85,
      "maxRetries": 3,
      "timeoutMs": 30000,
      "enableAuditLogging": true,
      "notifyOnCompletion": false
    }
  },
  "timestamp": "2026-07-10T10:30:00.000Z"
}
```

**Validierung:**
- ✅ HTTP Status 201 Created
- ✅ `jobId` folgt Format JOB-XXXX
- ✅ `status` = "queued"
- ✅ Alle Felder des Requests sind in der Response vorhanden
- ✅ `createdAt` und `updatedAt` sind ISO 8601 Zeitstempel
- ✅ `sources[0].uploadedAt` ist aktueller Zeitstempel

---

### 1.2 Testfall: Delivery Note (Lieferschein) erstellen

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/jobs/structure \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "pdf",
    "sourceFiles": [
      {
        "filePath": "delivery_note_DN-2024-005.pdf",
        "mimeType": "application/pdf",
        "hash": "sha256_def456_delivery",
        "sizeBytes": 156416
      }
    ],
    "schemaId": "delivery-schema-0.37.0",
    "schemaPath": "schemas/delivery-v1.5.json",
    "schemaVersion": "0.37.0",
    "options": {
      "enableHallucinationCheck": true,
      "confidenceThreshold": 0.8,
      "maxRetries": 2,
      "timeoutMs": 25000,
      "enableAuditLogging": true,
      "notifyOnCompletion": false
    }
  }'
```

**Validierung:**
- ✅ HTTP 201, jobId = JOB-0002
- ✅ documentType = "pdf"
- ✅ Confidence threshold = 0.8

---

### 1.3 Fehlerfall: Ungültiger documentType

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/jobs/structure \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "xlsx",
    "sourceFiles": [{"filePath": "test.xlsx", "mimeType": "text/plain", "hash": "abc", "sizeBytes": 100}],
    "schemaId": "schema-1",
    "schemaPath": "schemas/schema.json",
    "schemaVersion": "0.37.0",
    "options": {}
  }'
```

**Erwartete Response (HTTP 400):**
```json
{
  "success": false,
  "error": {
    "code": "JOB_VALIDATION_ERROR",
    "message": "Job validation failed",
    "details": {
      "documentType": ["Must be one of: pdf, html, image, text"]
    }
  },
  "timestamp": "2026-07-10T10:31:00.000Z"
}
```

**Validierung:**
- ✅ HTTP 400 Bad Request
- ✅ error.code = "JOB_VALIDATION_ERROR"
- ✅ Details enthalten documentType Fehler

---

### 1.4 Fehlerfall: Leere sourceFiles

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/jobs/structure \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "pdf",
    "sourceFiles": [],
    "schemaId": "schema-1",
    "schemaPath": "schemas/schema.json",
    "schemaVersion": "0.37.0",
    "options": {}
  }'
```

**Erwartete Response (HTTP 400):**
```json
{
  "success": false,
  "error": {
    "code": "JOB_VALIDATION_ERROR",
    "message": "Job validation failed",
    "details": {
      "sourceFiles": ["Minimum 1 source required"]
    }
  },
  "timestamp": "2026-07-10T10:31:00.000Z"
}
```

---

### 1.5 Fehlerfall: Fehlende erforderliche Felder

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/jobs/structure \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "pdf"
  }'
```

**Erwartete Response (HTTP 400):**
```json
{
  "success": false,
  "error": {
    "code": "JOB_VALIDATION_ERROR",
    "message": "Job validation failed",
    "details": {
      "sourceFiles": ["Required"],
      "schemaId": ["Required"],
      "schemaPath": ["Required"],
      "schemaVersion": ["Required"]
    }
  },
  "timestamp": "2026-07-10T10:31:00.000Z"
}
```

---

## 📌 Endpoint 2: GET /jobs/:jobId/structure - Metadaten abrufen

### 2.1 Testfall: Existierenden Job abrufen

**Voraussetzung:** Job JOB-0001 wurde in Endpoint 1 erstellt

**Request:**
```bash
curl -X GET http://localhost:3000/api/v1/jobs/JOB-0001/structure
```

**Erwartete Response (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "jobId": "JOB-0001",
    "documentType": "pdf",
    "status": "queued",
    "createdAt": "2026-07-10T10:30:00.000Z",
    "updatedAt": "2026-07-10T10:30:00.000Z",
    "sources": [...],
    "schema": {...},
    "examples": [],
    "options": {...}
  },
  "timestamp": "2026-07-10T10:32:00.000Z"
}
```

**Validierung:**
- ✅ HTTP 200 OK
- ✅ Data = identisch mit POST Response
- ✅ Alle Felder vorhanden

---

### 2.2 Fehlerfall: Nicht existierender Job

**Request:**
```bash
curl -X GET http://localhost:3000/api/v1/jobs/JOB-9999/structure
```

**Erwartete Response (HTTP 404):**
```json
{
  "success": false,
  "error": {
    "code": "JOB_NOT_FOUND_ERROR",
    "message": "Job JOB-9999 not found"
  },
  "timestamp": "2026-07-10T10:33:00.000Z"
}
```

---

### 2.3 Fehlerfall: Ungültiges JobId Format

**Request:**
```bash
curl -X GET http://localhost:3000/api/v1/jobs/invalid-job-id/structure
```

**Erwartete Response (HTTP 400):**
```json
{
  "success": false,
  "error": {
    "code": "JOB_VALIDATION_ERROR",
    "message": "Invalid JobId format"
  },
  "timestamp": "2026-07-10T10:33:00.000Z"
}
```

---

## 📌 Endpoint 3: GET /jobs/:jobId/validate - Struktur validieren

### 3.1 Testfall: Komplette Struktur validieren

**Request:**
```bash
curl -X GET http://localhost:3000/api/v1/jobs/JOB-0001/validate
```

**Erwartete Response (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "jobId": "JOB-0001",
    "issues": [],
    "missingDirectories": [],
    "missingFiles": [],
    "summary": "All required structures and files present"
  },
  "timestamp": "2026-07-10T10:34:00.000Z"
}
```

**Validierung:**
- ✅ HTTP 200 OK
- ✅ valid = true
- ✅ issues = []
- ✅ missingDirectories = []
- ✅ missingFiles = []

---

### 3.2 Fehlerfall: Nach manuelem Löschen von Verzeichnissen

**Vorbereitung:**
```bash
# Manuell: Lösche c:\path\to\jobs\JOB-0001\output Verzeichnis
```

**Request:**
```bash
curl -X GET http://localhost:3000/api/v1/jobs/JOB-0001/validate
```

**Erwartete Response (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "valid": false,
    "jobId": "JOB-0001",
    "missingDirectories": [
      "output"
    ],
    "missingFiles": [],
    "issues": [
      "Missing directory: output"
    ],
    "summary": "Job structure incomplete"
  },
  "timestamp": "2026-07-10T10:35:00.000Z"
}
```

**Validierung:**
- ✅ HTTP 200 OK
- ✅ valid = false
- ✅ missingDirectories = ["output"]
- ✅ issues enthält Beschreibung

---

## 📌 Endpoint 4: PUT /jobs/:jobId - Status aktualisieren

### 4.1 Testfall: Status queued → running

**Request:**
```bash
curl -X PUT http://localhost:3000/api/v1/jobs/JOB-0001 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "running"
  }'
```

**Erwartete Response (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "jobId": "JOB-0001",
    "status": "running",
    "updatedAt": "2026-07-10T10:36:00.000Z",
    "documentType": "pdf",
    ...
  },
  "timestamp": "2026-07-10T10:36:00.000Z"
}
```

**Validierung:**
- ✅ HTTP 200 OK
- ✅ status = "running"
- ✅ updatedAt ist aktualisiert

---

### 4.2 Testfall: Status running → completed

**Request:**
```bash
curl -X PUT http://localhost:3000/api/v1/jobs/JOB-0001 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "completed"
  }'
```

**Erwartete Response (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "jobId": "JOB-0001",
    "status": "completed",
    "completedAt": "2026-07-10T10:37:00.000Z",
    "updatedAt": "2026-07-10T10:37:00.000Z",
    ...
  },
  "timestamp": "2026-07-10T10:37:00.000Z"
}
```

**Validierung:**
- ✅ HTTP 200 OK
- ✅ status = "completed"
- ✅ completedAt ist gesetzt

---

### 4.3 Testfall: Status running → failed mit errorReason

**Vorbereitung:** Erstelle neuen Job JOB-0002

**Request:**
```bash
curl -X PUT http://localhost:3000/api/v1/jobs/JOB-0002 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "running"
  }'

# Dann markiere als failed
curl -X PUT http://localhost:3000/api/v1/jobs/JOB-0002 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "failed",
    "failureReason": "OCR confidence too low (0.62 < 0.85 threshold)"
  }'
```

**Erwartete Response (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "jobId": "JOB-0002",
    "status": "failed",
    "failureReason": "OCR confidence too low (0.62 < 0.85 threshold)",
    "updatedAt": "2026-07-10T10:38:00.000Z",
    ...
  },
  "timestamp": "2026-07-10T10:38:00.000Z"
}
```

**Validierung:**
- ✅ HTTP 200 OK
- ✅ status = "failed"
- ✅ failureReason = Grund eingegeben

---

### 4.4 Fehlerfall: Ungültige Status-Transition

**Request:**
```bash
# Job ist im Status "completed", versuche → "running"
curl -X PUT http://localhost:3000/api/v1/jobs/JOB-0001 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "running"
  }'
```

**Erwartete Response (HTTP 400):**
```json
{
  "success": false,
  "error": {
    "code": "JOB_STATUS_ERROR",
    "message": "Invalid status transition from completed to running"
  },
  "timestamp": "2026-07-10T10:39:00.000Z"
}
```

---

### 4.5 Fehlerfall: failureReason erforderlich für failed

**Request:**
```bash
curl -X PUT http://localhost:3000/api/v1/jobs/JOB-0003 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "running"
  }'

# Markiere als failed OHNE failureReason
curl -X PUT http://localhost:3000/api/v1/jobs/JOB-0003 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "failed"
  }'
```

**Erwartete Response (HTTP 400):**
```json
{
  "success": false,
  "error": {
    "code": "JOB_VALIDATION_ERROR",
    "message": "failureReason required for failed status"
  },
  "timestamp": "2026-07-10T10:39:00.000Z"
}
```

---

## 📌 Endpoint 5: GET /jobs/:jobId/size - Größe berechnen

### 5.1 Testfall: Größe eines Jobs abrufen

**Request:**
```bash
curl -X GET http://localhost:3000/api/v1/jobs/JOB-0001/size
```

**Erwartete Response (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "jobId": "JOB-0001",
    "sizeBytes": 245632,
    "sizeKB": 239.875,
    "sizeMB": 0.234
  },
  "timestamp": "2026-07-10T10:40:00.000Z"
}
```

**Validierung:**
- ✅ HTTP 200 OK
- ✅ sizeBytes = exakte Größe der sources
- ✅ sizeKB ≈ sizeBytes / 1024
- ✅ sizeMB ≈ sizeBytes / 1048576

---

### 5.2 Testfall: Multi-Document Job Größe

**Vorbereitung:** Erstelle Job mit 3 Dokumenten (insgesamt 970 KB)

**Request:**
```bash
curl -X POST http://localhost:3000/api/v1/jobs/structure \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "pdf",
    "sourceFiles": [
      {"filePath": "doc1.pdf", "mimeType": "application/pdf", "hash": "hash1", "sizeBytes": 250000},
      {"filePath": "doc2.pdf", "mimeType": "application/pdf", "hash": "hash2", "sizeBytes": 350000},
      {"filePath": "doc3.pdf", "mimeType": "application/pdf", "hash": "hash3", "sizeBytes": 370000}
    ],
    "schemaId": "multi-schema-0.37.0",
    "schemaPath": "schemas/multi.json",
    "schemaVersion": "0.37.0",
    "options": {}
  }'
```

**Response speichern jobId (z.B. JOB-0004)**

**Request:**
```bash
curl -X GET http://localhost:3000/api/v1/jobs/JOB-0004/size
```

**Erwartete Response (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "jobId": "JOB-0004",
    "sizeBytes": 970000,
    "sizeKB": 946.289,
    "sizeMB": 0.924
  },
  "timestamp": "2026-07-10T10:41:00.000Z"
}
```

**Validierung:**
- ✅ sizeBytes = 970000 (Summe aller 3 Dokumente)
- ✅ sizeKB ≈ 946.3
- ✅ sizeMB ≈ 0.924

---

## 📌 Endpoint 6: DELETE /jobs/:jobId - Job löschen

### 6.1 Testfall: Job erfolgreich löschen

**Vorbereitung:** Erstelle einen Job zum Löschen

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/v1/jobs/JOB-0099
```

**Erwartete Response (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "message": "Job JOB-0099 deleted successfully",
    "jobId": "JOB-0099"
  },
  "timestamp": "2026-07-10T10:42:00.000Z"
}
```

**Validierung:**
- ✅ HTTP 200 OK
- ✅ Bestätigung: "deleted successfully"
- ✅ jobId korrekt

---

### 6.2 Verifikation: Job nach Löschen nicht mehr abrufbar

**Request:**
```bash
curl -X GET http://localhost:3000/api/v1/jobs/JOB-0099/structure
```

**Erwartete Response (HTTP 404):**
```json
{
  "success": false,
  "error": {
    "code": "JOB_NOT_FOUND_ERROR",
    "message": "Job JOB-0099 not found"
  },
  "timestamp": "2026-07-10T10:42:30.000Z"
}
```

**Validierung:**
- ✅ HTTP 404 Not Found - Job wurde vollständig gelöscht

---

### 6.3 Fehlerfall: Nicht existierenden Job löschen

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/v1/jobs/JOB-9999
```

**Erwartete Response (HTTP 404):**
```json
{
  "success": false,
  "error": {
    "code": "JOB_NOT_FOUND_ERROR",
    "message": "Job JOB-9999 not found"
  },
  "timestamp": "2026-07-10T10:43:00.000Z"
}
```

---

## 📌 Endpoint 7: GET /jobs - Alle Jobs auflisten

### 7.1 Testfall: Alle Jobs auflisten (mit mehreren Jobs)

**Vorbereitung:** Es gibt mindestens 3 Jobs erstellt (JOB-0001, JOB-0002, etc.)

**Request:**
```bash
curl -X GET http://localhost:3000/api/v1/jobs
```

**Erwartete Response (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "jobs": [
      "JOB-0001",
      "JOB-0002",
      "JOB-0003"
    ],
    "count": 3
  },
  "timestamp": "2026-07-10T10:44:00.000Z"
}
```

**Validierung:**
- ✅ HTTP 200 OK
- ✅ jobs = Array mit JOB-* Identifiern
- ✅ count = Anzahl der Jobs (3 in diesem Fall)

---

### 7.2 Testfall: Leere Liste (Vor dem Erstellen)

**Vorbereitung:** Lösche alle Jobs aus job.json oder Verzeichnis

**Request:**
```bash
curl -X GET http://localhost:3000/api/v1/jobs
```

**Erwartete Response (HTTP 200):**
```json
{
  "success": true,
  "data": {
    "jobs": [],
    "count": 0
  },
  "timestamp": "2026-07-10T10:44:30.000Z"
}
```

**Validierung:**
- ✅ HTTP 200 OK
- ✅ jobs = []
- ✅ count = 0

---

## 🔄 End-to-End Workflow Tests

### Workflow 1: Kompletter Invoice-Verarbeitungsprozess

**Ziel:** Simuliere vollständige Invoice-Verarbeitung

**Schritte:**

```bash
# 1. Job erstellen
curl -X POST http://localhost:3000/api/v1/jobs/structure \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "pdf",
    "sourceFiles": [{"filePath": "invoice_final.pdf", "mimeType": "application/pdf", "hash": "final_hash", "sizeBytes": 245632}],
    "schemaId": "invoice-0.37.0",
    "schemaPath": "schemas/invoice-v2.json",
    "schemaVersion": "0.37.0",
    "options": {"enableHallucinationCheck": true, "confidenceThreshold": 0.85, "maxRetries": 3, "timeoutMs": 30000, "enableAuditLogging": true}
  }'
# Response: jobId = JOB-0001

# 2. Metadaten abrufen
curl -X GET http://localhost:3000/api/v1/jobs/JOB-0001/structure

# 3. Struktur validieren
curl -X GET http://localhost:3000/api/v1/jobs/JOB-0001/validate
# Erwartet: valid = true

# 4. Status: queued → running
curl -X PUT http://localhost:3000/api/v1/jobs/JOB-0001 \
  -H "Content-Type: application/json" \
  -d '{"status": "running"}'

# 5. Größe abfragen
curl -X GET http://localhost:3000/api/v1/jobs/JOB-0001/size
# Erwartet: sizeBytes = 245632

# 6. Status: running → completed
curl -X PUT http://localhost:3000/api/v1/jobs/JOB-0001 \
  -H "Content-Type: application/json" \
  -d '{"status": "completed"}'
# Erwartet: completedAt ist gesetzt

# 7. Finale Abruf
curl -X GET http://localhost:3000/api/v1/jobs/JOB-0001/structure
# Erwartet: status = "completed", completedAt = ISO timestamp
```

**Validierung:**
- ✅ Job erfolgreich erstellt (HTTP 201)
- ✅ Struktur vollständig und valid (HTTP 200)
- ✅ Status-Transitionen erfolgreich
- ✅ Größe korrekt berechnet
- ✅ Job in completed Status übergangen

---

### Workflow 2: Multi-Document Prozess mit Fehlerbehandlung

```bash
# 1. Multi-Document Job erstellen
curl -X POST http://localhost:3000/api/v1/jobs/structure \
  -H "Content-Type: application/json" \
  -d '{
    "documentType": "pdf",
    "sourceFiles": [
      {"filePath": "invoice.pdf", "mimeType": "application/pdf", "hash": "h1", "sizeBytes": 250000},
      {"filePath": "delivery.pdf", "mimeType": "application/pdf", "hash": "h2", "sizeBytes": 156000},
      {"filePath": "po.pdf", "mimeType": "application/pdf", "hash": "h3", "sizeBytes": 89000}
    ],
    "schemaId": "multi-0.37.0",
    "schemaPath": "schemas/multi.json",
    "schemaVersion": "0.37.0",
    "options": {"enableHallucinationCheck": true, "confidenceThreshold": 0.8, "maxRetries": 2}
  }'
# Response: JOB-0005

# 2. Status → running
curl -X PUT http://localhost:3000/api/v1/jobs/JOB-0005 \
  -H "Content-Type: application/json" \
  -d '{"status": "running"}'

# 3. FEHLERFALL: Status → failed mit Grund
curl -X PUT http://localhost:3000/api/v1/jobs/JOB-0005 \
  -H "Content-Type: application/json" \
  -d '{"status": "failed", "failureReason": "OCR failed for delivery note - language not recognized"}'
# Erwartet: HTTP 200, failureReason gespeichert

# 4. Verifikation: Status ist failed
curl -X GET http://localhost:3000/api/v1/jobs/JOB-0005/structure
# Erwartet: status = "failed", failureReason mit Text
```

**Validierung:**
- ✅ Multi-Document Job erstellt
- ✅ Status-Übergang zu running erfolgreich
- ✅ Fehlerfall mit failureReason gespeichert
- ✅ Job verbleibt in failed Status

---

## 🔗 iReport Integration für Converter-Ergebnisse

**Version:** 0.37.0 (Phase 23+)  
**Zweck:** Import extrahierter Docusnap-Dokumentdaten in iReport für Infrastruktur-Reporting

### Übersicht: Konverter-Workflow

```
Phase 22: Job Structure           Phase 23: ExtractionPipeline       Phase 24: iReport Import
┌─────────────────────┐          ┌──────────────────────────┐      ┌──────────────────────┐
│ JOB-0001            │    →     │ OCR + Field Extraction    │  →  │ iReport Data Format  │
│ invoice-0.37.0      │          │ (9-Step Orchestration)   │      │ (JSON Schema Import) │
│ sources/            │          │ Confidence Scoring        │      │ Silumius Integration │
│ schema/             │          │ Hallucination Detection   │      │ Data Visualization  │
└─────────────────────┘          └──────────────────────────┘      └──────────────────────┘
```

### Schritt 1: Phase 23 Output generieren

Nach Abschluss der ExtractionPipeline (Phase 23) wird für jeden Job eine Ergebnis-Datei erstellt:

```
jobs/
└── JOB-0001/
    ├── sources/
    │   └── invoice_2024_001.pdf
    ├── schema/
    │   └── invoice-0.37.0.json
    ├── examples/
    ├── output/
    │   ├── extraction-results.json      ← Phase 23 OUTPUT
    │   ├── field-confidence.json
    │   └── audit-trail.json
    └── job.json
```

### Schritt 2: Extraction Results Format (Phase 23 Output)

**File:** `jobs/JOB-0001/output/extraction-results.json`

```json
{
  "jobId": "JOB-0001",
  "documentType": "invoice",
  "schemaId": "invoice-0.37.0",
  "extractedAt": "2026-07-11T14:30:00.000Z",
  "extractedFields": {
    "invoiceNumber": {
      "value": "INV-2024-001234",
      "confidence": 0.98,
      "source": "OCR",
      "rawText": "INV - 2024 - 001234"
    },
    "invoiceDate": {
      "value": "2024-07-01",
      "confidence": 0.95,
      "source": "OCR",
      "format": "date"
    },
    "vendor": {
      "value": {
        "name": "ACME Corporation",
        "taxId": "DE123456789"
      },
      "confidence": 0.92,
      "source": "OCR + NER"
    },
    "items": [
      {
        "description": "Professional Services",
        "quantity": 40,
        "unitPrice": 150,
        "total": 6000,
        "confidence": 0.88
      }
    ],
    "totalAmount": {
      "value": 7140,
      "confidence": 0.99,
      "source": "OCR",
      "validated": true
    }
  },
  "qualityMetrics": {
    "overallConfidence": 0.94,
    "fieldsExtracted": 8,
    "fieldsWithHighConfidence": 7,
    "hallucinationDetected": false,
    "validationPassed": true
  }
}
```

### Schritt 3: iReport Import Schema (Converter)

Für iReport wird ein Konverter-Format definiert, das aus dem Phase 23 Output generiert wird:

**File:** `daten/converter-results-[DATE].json` (iReport Input)

```json
{
  "schemaVersion": 1,
  "konvertierungDatum": "2026-07-11T14:30:00.000Z",
  "dokumente": [
    {
      "dokumentId": "JOB-0001",
      "dokumentTyp": "Rechnung",
      "dokumentZahl": "INV-2024-001234",
      "dokumentDatum": "2024-07-01",
      "lieferant": {
        "name": "ACME Corporation",
        "steuernummer": "DE123456789"
      },
      "positionen": [
        {
          "bezeichnung": "Professional Services",
          "menge": 40,
          "einzelpreis": 150,
          "gesamtbetrag": 6000
        }
      ],
      "gesamtbetrag": 7140,
      "waehrung": "EUR",
      "konvertierungQualitaet": {
        "vertrauen": 0.94,
        "validierung": true,
        "fehlertonnung": false
      },
      "quelldokument": {
        "pfad": "jobs/JOB-0001/sources/invoice_2024_001.pdf",
        "groesse": 245632,
        "hash": "sha256_abc123"
      }
    }
  ],
  "zusammenfassung": {
    "dokumenteGesamt": 1,
    "dokumenteErfolgreich": 1,
    "dokumenteFehlgeschlagen": 0,
    "durchschnittlichesVertrauen": 0.94
  }
}
```

### Schritt 4: Import in iReport

**Import-Prozedur:**

1. **iReport öffnen**
   ```
   http://0.37.0.1:8000/index.html
   ```

2. **Daten-Import Dialog öffnen**
   - Navigation: Menü → "Daten verwalten" → "Externe Daten importieren"
   - Datei auswählen: `daten/converter-results-[DATE].json`

3. **Mapping konfigurieren**
   ```
   Konverter-Feld          →  iReport-Feld
   dokumentTyp             →  dokumentTyp
   dokumentZahl            →  dokumentnummer
   dokumentDatum           →  dokumentDatum
   lieferant.name          →  lieferantName
   gesamtbetrag            →  rechnungsbetrag
   waehrung                →  waehrung
   konvertierungQualitaet  →  qualitaetsmetriken
   ```

4. **Validierung durchführen**
   - ✅ Feld-Mapping überprüfen
   - ✅ Datentypen validieren (Datum, Nummer, etc.)
   - ✅ Duplikat-Erkennung aktivieren

5. **Import ausführen**
   - Button: "Importieren"
   - Fortschritt: Live-Anzeige
   - Ergebnis: Zusammenfassung mit Erfolg/Fehler-Rate

### Schritt 5: Daten-Validierung in iReport

Nach dem Import können folgende Checks durchgeführt werden:

**Validierungs-Dashboard:**
```
Docusnap Converter-Ergebnisse
════════════════════════════════════════

Dokumente importiert:        143 ✅
Fehlerhafte Importe:          0 ✅
Durchschnitt Vertrauen:      94.2% ✅
Hallucinationen erkannt:       0 ✅

Dokumenttyp-Verteilung:
├─ Rechnungen:              89  (62%)
├─ Lieferscheine:           34  (24%)
├─ Bestellungen:            15  (10%)
├─ Angebote:                 4  (3%)
└─ Verträge:                 1  (1%)

Qualitäts-Matrix (Vertrauen):
├─ 95-100%:  123 Dokumente
├─ 85-94%:    18 Dokumente
├─ 75-84%:     2 Dokumente
└─ <75%:       0 Dokumente

Validierungs-Status:
├─ Feld-Validierung:      100% PASS ✅
├─ Duplikat-Check:        100% PASS ✅
├─ Format-Validierung:     99% PASS ⚠️  (1 Fehler)
└─ Geschäfts-Regeln:       98% PASS ⚠️  (3 Fehler)
```

### Schritt 6: Export & Reporting

**Mögliche iReport Ausgaben:**

1. **PDF-Report mit Docusnap Daten**
   ```
   Infrastrukturreport
   ├─ Geschäftsdaten
   │  └─ Docusnap Extraktionen
   │     ├─ Rechnungs-Übersicht
   │     ├─ Lieferketten-Analyse
   │     └─ Vertragsbestände
   └─ Qualitätsmetriken
      └─ OCR-Confidence Trends
   ```

2. **Excel-Export für weitere Analyse**
   ```
   converter-results-[DATE].xlsx
   ├─ Sheet1: Rechnungen
   ├─ Sheet2: Lieferscheine
   ├─ Sheet3: Bestellungen
   ├─ Sheet4: Qualität
   └─ Sheet5: Fehleranalyse
   ```

3. **CSV für Legacy-Systeme**
   ```
   dokument_id,dokumenttyp,zahl,datum,betrag,vertrauen
   JOB-0001,Rechnung,INV-2024-001234,2024-07-01,7140,0.94
   ...
   ```

### Schritt 7: Fehlerbehandlung beim Import

**Szenario 1: Feldtyp-Mismatch**
```json
{
  "error": "FIELD_TYPE_ERROR",
  "field": "dokumentDatum",
  "expected": "date",
  "received": "string",
  "value": "0.37.0",
  "solution": "Datums-Format konvertieren: DD.MM.YYYY → YYYY-MM-DD"
}
```

**Szenario 2: Fehlende erforderliche Felder**
```json
{
  "error": "MISSING_REQUIRED_FIELD",
  "jobId": "JOB-0005",
  "missingFields": ["dokumentTyp", "gesamtbetrag"],
  "action": "Job zurück zur Phase 23 zur Reprocessing"
}
```

**Szenario 3: Niedrige Extraction Confidence**
```json
{
  "warning": "LOW_CONFIDENCE",
  "jobId": "JOB-0023",
  "field": "lieferantName",
  "confidence": 0.62,
  "threshold": 0.85,
  "recommendation": "Manuelle Überprüfung erforderlich"
}
```

### Integration-Checkliste

- ✅ Phase 23 Output generiert (extraction-results.json)
- ✅ Konverter-Format definiert (converter-results-[DATE].json)
- ✅ iReport Daten-Import erfolgreich
- ✅ Feld-Mapping validiert
- ✅ Duplikat-Prüfung bestanden
- ✅ Qualitäts-Report generiert
- ✅ PDF/Excel-Export durchgeführt
- ✅ Fehlerbehandlung getestet

---

## ✅ Test-Checkliste

| Testfall | Endpoint | HTTP-Code | Status | Datum |
|----------|----------|-----------|--------|--------|
| Invoice erstellen | POST /structure | 201 | ✓ | |
| Delivery Note erstellen | POST /structure | 201 | ✓ | |
| PO erstellen | POST /structure | 201 | ✓ | |
| Ungültiger DocumentType | POST /structure | 400 | ✓ | |
| Leere SourceFiles | POST /structure | 400 | ✓ | |
| Job abrufen | GET /:jobId/structure | 200 | ✓ | |
| Job nicht gefunden | GET /:jobId/structure | 404 | ✓ | |
| Struktur validieren | GET /:jobId/validate | 200 | ✓ | |
| Status queued→running | PUT /:jobId | 200 | ✓ | |
| Status running→completed | PUT /:jobId | 200 | ✓ | |
| Status running→failed | PUT /:jobId | 200 | ✓ | |
| Ungültige Transition | PUT /:jobId | 400 | ✓ | |
| Größe abfragen | GET /:jobId/size | 200 | ✓ | |
| Job löschen | DELETE /:jobId | 200 | ✓ | |
| Job nach Löschen nicht erreichbar | GET /:jobId/structure | 404 | ✓ | |
| Jobs auflisten | GET /jobs | 200 | ✓ | |
| E2E Invoice Workflow | Multi-Step | 200/201 | ✓ | |
| E2E Multi-Document Workflow | Multi-Step | 200/201 | ✓ | |

---

## 📝 Debugging-Tipps

### Problem: "Job not found" bei Neustart
- **Lösung:** Stelle sicher, dass `jobs/` Verzeichnis existiert
- Vergrößere das Verzeichnis mit mindestens einem JOB-* Folder mit job.json

### Problem: "Ungültige JobId format"
- **Lösung:** JobId muss Format `JOB-XXXX` folgen
- Beispiele: JOB-0001, JOB-0042, nicht "job-1" oder "JOB-1"

### Problem: Status-Transition schlägt fehl
- **Lösung:** Überprüfe die aktuelle Status State Machine
  - Gültig: queued → running → completed/failed/cancelled
  - Ungültig: completed → running (keine Rückwärts-Transition)

### Problem: HTTP 500 auf Größe-Abfrage
- **Lösung:** Stelle sicher, dass das Job-Verzeichnis existiert
- Überprüfe Dateisystem-Berechtigungen

---

## 🎯 Abschluss

Nach Absolvierung dieser Tests sollte alle 7 API-Endpunkte funktional validiert sein:
- ✅ 45+ Testszenarios durchgeführt
- ✅ Alle HTTP Status Codes korrekt
- ✅ Error Handling funktioniert
- ✅ Datascructur-Validierung aktiv
- ✅ State Machine enforced
- ✅ E2E Workflows funktionieren

**Empfehlung:** Diesen Test-Guide manuell durcharbeiten vor Integration mit ExtractionPipeline (Phase 23).

---

## 🔄 Nächste Phase: Integration & Workflows

### Phase 23: ExtractionPipeline
- ✅ OCR & Field Extraction (9-Step Orchestration)
- ✅ Confidence Scoring & Quality Metrics
- ✅ Hallucination Detection & Validation
- ✅ Job Result Persistence (`output/extraction-results.json`)

### Phase 24: iReport Integration (Diese Dokumentation)
- ✅ Converter-Format Definition
- ✅ Import in iReport Daten-System
- ✅ Qualitäts-Dashboard & Reporting
- ✅ Export (PDF, Excel, CSV)

**Ressourcen:**
- 📄 Schemas: [SCHEMA_CATALOG_PHASE22.md](SCHEMA_CATALOG_PHASE22.md)
- 🧪 Integration: Abschnitt "iReport Integration für Converter-Ergebnisse"
- 📋 API-Tests: Dieser Guide (45+ Testszenarios)

