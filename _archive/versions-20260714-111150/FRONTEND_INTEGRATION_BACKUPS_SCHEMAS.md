# Frontend Integration Guide - Backups & Schemas (Phase 21)

**Version:** 1.0.0  
**Phase:** 21  
**Date:** 2026-07-10  
**Status:** Ready for Manual Testing

---

## 📋 Overview

This guide explains how to integrate and display **Backups** and **Schemas** in your React frontend application. Both resources are now accessible through TypeScript API clients with full error handling and type safety.

---

## 🔧 Available API Clients

### 1. Backup Client (`backupClient.ts`)

**Location:** `frontend/src/api/backupClient.ts`

**Singleton Export:** `backupClient`

**Key Methods:**

```typescript
// Create a new backup
async createBackup(backupName: string, reason?: string, backupBy?: string): Promise<BackupMetadata>

// List all backups
async listBackups(limit?: number): Promise<BackupListResponse>

// Get backup statistics
async getStatistics(): Promise<BackupStatistics>

// Get backup details
async getBackupDetails(backupId: string): Promise<BackupMetadata>

// Download backup file
async downloadBackup(backupId: string): Promise<void>

// Restore from backup
async restoreFromBackup(backupId: string, restoreRequest: RestoreRequest): Promise<RestoreResult>

// Delete backup
async deleteBackup(backupId: string): Promise<void>

// Poll backup status during creation/restoration
async pollBackupStatus(backupId: string, maxAttempts?: number, interval?: number): Promise<BackupMetadata>
```

### 2. Schema Client (`schemaClient.ts`)

**Location:** `frontend/src/api/schemaClient.ts`

**Singleton Export:** `schemaClient`

**Key Methods:**

```typescript
// Upload a new schema
async uploadSchema(request: SchemaUploadRequest): Promise<{ schemaId: string; schemaName: string; ... }>

// Get schema details
async getSchema(schemaId: string): Promise<SchemaMetadata>

// Generate extraction rules from schema
async generateRules(schemaId: string, request?: RuleGenerationRequest): Promise<RuleSet>

// Get previously generated rules
async getRules(schemaId: string): Promise<RuleSet>

// Delete schema
async deleteSchema(schemaId: string): Promise<void>

// Get available schemas
async getAvailableSchemas(): Promise<SchemaMetadata[]>

// Export schema as JSON
async exportSchema(schemaId: string, filename?: string): Promise<void>

// Import schema from file
async importSchemaFromFile(file: File, name?: string, examples?: any[]): Promise<...>
```

---

## 🎨 Component Examples

### Example 1: Backup List Component

```typescript
// frontend/src/components/BackupList.tsx

import { useEffect, useState } from 'react';
import { backupClient } from '@/api/backupClient';
import type { BackupMetadata } from '@/api/backupClient';

export function BackupList() {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setLoading(true);
      const response = await backupClient.listBackups(20);
      setBackups(response.backups);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (backupId: string) => {
    if (!confirm('Are you sure you want to delete this backup?')) return;
    
    try {
      await backupClient.deleteBackup(backupId);
      setBackups(backups.filter(b => b.backupId !== backupId));
    } catch (err) {
      setError((err as Error).message);
    }
  };

  const handleDownload = async (backupId: string) => {
    try {
      await backupClient.downloadBackup(backupId);
    } catch (err) {
      setError((err as Error).message);
    }
  };

  if (loading) return <div>Loading backups...</div>;
  if (error) return <div style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div>
      <h2>Backups ({backups.length})</h2>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Date</th>
            <th>Size</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {backups.map(backup => (
            <tr key={backup.backupId}>
              <td>{backup.backupName}</td>
              <td>{new Date(backup.timestamp).toLocaleString()}</td>
              <td>{(backup.totalSize / 1024 / 1024).toFixed(2)} MB</td>
              <td>{backup.status}</td>
              <td>
                <button onClick={() => handleDownload(backup.backupId)}>Download</button>
                <button onClick={() => handleDelete(backup.backupId)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Example 2: Schema Manager Component

```typescript
// frontend/src/components/SchemaManager.tsx

import { useState } from 'react';
import { schemaClient } from '@/api/schemaClient';
import type { SchemaMetadata } from '@/api/schemaClient';

export function SchemaManager() {
  const [schemas, setSchemas] = useState<SchemaMetadata[]>([]);
  const [selectedSchema, setSelectedSchema] = useState<SchemaMetadata | null>(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (file: File) => {
    try {
      setLoading(true);
      const schema = JSON.parse(await file.text());
      const result = await schemaClient.uploadSchema({
        schema,
        examples: [],
        name: file.name.replace('.json', ''),
      });
      alert(`Schema uploaded: ${result.schemaId}`);
    } catch (err) {
      alert(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateRules = async (schemaId: string) => {
    try {
      setLoading(true);
      const ruleSet = await schemaClient.generateRules(schemaId, {
        aggressiveness: 0.7,
      });
      alert(`Generated ${ruleSet.rules.length} rules with avg confidence ${(ruleSet.stats.averageConfidence * 100).toFixed(1)}%`);
    } catch (err) {
      alert(`Error: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Schema Manager</h2>
      
      <div>
        <h3>Upload Schema</h3>
        <input 
          type="file" 
          accept=".json" 
          onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
          disabled={loading}
        />
      </div>

      {selectedSchema && (
        <div>
          <h3>Schema: {selectedSchema.name}</h3>
          <p>Examples: {selectedSchema.exampleCount}</p>
          <button 
            onClick={() => handleGenerateRules(selectedSchema.id)}
            disabled={loading}
          >
            Generate Rules
          </button>
          <button onClick={() => schemaClient.exportSchema(selectedSchema.id)}>
            Export
          </button>
          <button onClick={() => schemaClient.deleteSchema(selectedSchema.id)}>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
```

### Example 3: Create Backup Component

```typescript
// frontend/src/components/CreateBackupForm.tsx

import { useState } from 'react';
import { backupClient } from '@/api/backupClient';

export function CreateBackupForm({ onSuccess }: { onSuccess: () => void }) {
  const [backupName, setBackupName] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!backupName.trim()) {
      setError('Backup name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const backup = await backupClient.createBackup(
        backupName,
        reason || undefined,
        'manual-test'
      );

      alert(`Backup created: ${backup.backupId}`);
      setBackupName('');
      setReason('');
      onSuccess();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3>Create New Backup</h3>
      
      {error && <div style={{ color: 'red' }}>{error}</div>}
      
      <div>
        <label>
          Backup Name: *
          <input
            type="text"
            value={backupName}
            onChange={(e) => setBackupName(e.target.value)}
            placeholder="e.g., daily-backup-2024-01-10"
            disabled={loading}
            required
          />
        </label>
      </div>

      <div>
        <label>
          Reason:
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Optional: reason for this backup"
            disabled={loading}
          />
        </label>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Creating...' : 'Create Backup'}
      </button>
    </form>
  );
}
```

---

## 📂 Current System Data

### Available Backups

The system has the following backups ready for manual testing:

```
Location: backups/
Available: All previous backups are accessible and listed via API
- Total Size: 55+ files backed up
- Latest: system-specific backups
- Restoration: Available via /api/backup/:backupId/restore
```

### Available Schemas

The system has the following schemas ready for testing:

```
Location: schemas/
Available: Schema files in JSON format
- JSON Schema validation supported
- Example data: Included with each schema
- Rule Generation: Automatic extraction rules from schema + examples
```

---

## 🔌 API Integration Points

### TypeScript Types

All API responses are fully typed:

```typescript
// For Backups
import { BackupMetadata, BackupListResponse, BackupStatistics } from '@/api/backupClient';

// For Schemas
import { SchemaMetadata, RuleSet, ExtractionRule } from '@/api/schemaClient';
```

### Error Handling

Both clients provide descriptive error messages:

```typescript
try {
  const backup = await backupClient.createBackup('my-backup');
} catch (error) {
  console.error('Backup creation failed:', error.message);
  // Error: Failed to create backup: Network error - Unable to connect to API (http://localhost:3000)
}
```

### Environment Configuration

API base URL is configurable via environment variable:

```env
# .env or .env.local
VITE_API_BASE_URL=http://localhost:3000
```

If not set, defaults to `http://localhost:3000`

---

## 🧪 Testing the Integration

### 1. Run the Integration Test Script

```powershell
# From project root
.\test-backup-schema-integration.ps1

# Or with custom API URL
.\test-backup-schema-integration.ps1 -ApiUrl http://localhost:3000
```

### 2. Check API Endpoints Directly

```bash
# List backups
curl http://localhost:3000/api/backup/list

# Get backup statistics
curl http://localhost:3000/api/backup/stats

# List schemas (if endpoint exists)
curl http://localhost:3000/api/schema/list
```

### 3. Test in Frontend Console

```javascript
// Open browser console (F12)

// Test backup API
import { backupClient } from './src/api/backupClient.ts';

// List backups
const backups = await backupClient.listBackups();
console.log(backups);

// Get statistics
const stats = await backupClient.getStatistics();
console.log(stats);
```

---

## 📋 API Endpoint Reference

### Backup Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/backup/create` | Create new backup |
| GET | `/api/backup/list?limit=50` | List backups |
| GET | `/api/backup/stats` | Get backup statistics |
| GET | `/api/backup/{id}` | Get backup details |
| GET | `/api/backup/{id}/download` | Download backup file |
| POST | `/api/backup/{id}/restore` | Restore from backup |
| DELETE | `/api/backup/{id}` | Delete backup |

### Schema Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/schema/upload` | Upload schema with examples |
| GET | `/api/schema/{id}` | Get schema details |
| POST | `/api/schema/{id}/generate-rules` | Generate extraction rules |
| GET | `/api/schema/{id}/rules` | Get generated rules |
| DELETE | `/api/schema/{id}` | Delete schema |

---

## ✅ Verification Checklist

Before proceeding with frontend development, verify:

- [x] Backup API endpoints are registered in `/api/backup`
- [x] Schema API endpoints are registered in `/api/schema`
- [x] Backend is running and responding on port 3000
- [x] TypeScript API clients created (`backupClient.ts`, `schemaClient.ts`)
- [x] Integration test script created and executable
- [x] All test data (backups, schemas) present in local directories
- [x] Docker containers persisting data correctly
- [x] Error handling comprehensive and descriptive

---

## 🚀 Next Steps for Frontend Development

1. **Create UI Components:**
   - Backup list and download interface
   - Backup creation and restoration UI
   - Schema upload and management interface
   - Rule generation and review UI

2. **Integrate with Existing Features:**
   - Link backup creation to Job API
   - Display schema information alongside job configurations
   - Show backup restoration status

3. **Add Advanced Features:**
   - Scheduled backups
   - Backup versioning and comparison
   - Schema template library
   - Rule management and editing

4. **Complete Testing:**
   - Full end-to-end workflow testing
   - Error scenario handling
   - Performance under load
   - UI/UX validation

---

## 📞 Support

For issues or questions about the Backup/Schema API integration:

1. Check the [API_REFERENCE.md](API_REFERENCE.md) for detailed endpoint documentation
2. Run `test-backup-schema-integration.ps1` to verify system health
3. Check backend logs in Docker container
4. Refer to [MANUAL-0.21.0.md](MANUAL-0.21.0.md) for operational details

---

**System Status: ✅ READY FOR MANUAL TESTING**

All API endpoints operational, data persisted, and frontend clients ready for integration.
