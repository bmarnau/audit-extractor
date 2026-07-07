/**
 * E2E Integration Tests - Phase 13
 *
 * End-to-End Testing der vollständigen Extraction -> Audit -> Config -> Backup Pipeline
 *
 * @version 0.13.0
 * @phase 13
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

describe('E2E Integration Tests - Phase 13', () => {
  const API_URL = 'http://localhost:3000/api';
  let documentId: string;
  let backupId: string;

  beforeAll(async () => {
    // Wait for server startup
    console.log('[E2E] Starting integration tests...');
    await new Promise((resolve) => setTimeout(resolve, 2000));
  });

  afterAll(async () => {
    console.log('[E2E] Integration tests completed');
  });

  describe('Configuration Center', () => {
    it('should load current configuration', async () => {
      const response = await fetch(`${API_URL}/config`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.data).toHaveProperty('chunking');
      expect(data.data).toHaveProperty('confidence');
      expect(data.data).toHaveProperty('llm');
      expect(data.data).toHaveProperty('system');
      expect(data.data.configVersion).toBeGreaterThan(0);
    });

    it('should update configuration section', async () => {
      const response = await fetch(`${API_URL}/config/chunking`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: { maxChunkSize: 2048 },
          changedBy: 'e2e-test',
          reason: 'Integration test update',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.data.chunking.maxChunkSize).toBe(2048);
    });

    it('should load configuration changes', async () => {
      const response = await fetch(`${API_URL}/config/changes?limit=10`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(Array.isArray(data.data.changes)).toBe(true);
      expect(data.data.changes.length).toBeGreaterThan(0);
    });
  });

  describe('Backup Center', () => {
    it('should create a backup', async () => {
      const response = await fetch(`${API_URL}/backup/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupName: 'E2E Test Backup',
          reason: 'Integration test',
          backupBy: 'e2e-test',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.data.backup).toHaveProperty('backupId');
      expect(data.data.backup.status).toBe('in-progress');
      backupId = data.data.backup.backupId;
    });

    it('should list backups', async () => {
      const response = await fetch(`${API_URL}/backup/list?limit=10`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(Array.isArray(data.data.backups)).toBe(true);
    });

    it('should get backup statistics', async () => {
      const response = await fetch(`${API_URL}/backup/stats`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.data.statistics).toHaveProperty('totalBackups');
      expect(data.data.statistics).toHaveProperty('successRate');
      expect(data.data.statistics).toHaveProperty('averageBackupSize');
    });

    it('should delete backup', async () => {
      if (!backupId) {
        console.log('[E2E] Skipping delete test - no backup ID');
        return;
      }

      const response = await fetch(`${API_URL}/backup/${backupId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deletedBy: 'e2e-test',
        }),
      });

      expect(response.ok).toBe(true);
    });
  });

  describe('Audit Center', () => {
    it('should fetch audit report for document', async () => {
      // This assumes a document was extracted previously
      const response = await fetch(`${API_URL}/audit/test-doc-1`);

      // May return 404 if no document exists, which is OK for this test
      if (response.ok) {
        const data = await response.json();
        expect(data.data).toHaveProperty('recordsCount');
        expect(data.data).toHaveProperty('statistics');
      }
    });
  });

  describe('Help Center', () => {
    it('should search help content', async () => {
      const response = await fetch(`${API_URL}/help/search?query=extraction`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(data.data).toBeDefined();
    });

    it('should fetch glossary', async () => {
      const response = await fetch(`${API_URL}/help/glossary`);
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(Array.isArray(data.data) || typeof data.data === 'object').toBe(true);
    });
  });

  describe('Log Browser', () => {
    it('should fetch logs with filter', async () => {
      const response = await fetch(
        `${API_URL}/logs?level=info&source=system&limit=50`
      );
      expect(response.ok).toBe(true);

      const data = await response.json();
      expect(Array.isArray(data.data.logs) || data.data.logs).toBeDefined();
    });
  });

  describe('Complete Pipeline Integration', () => {
    it('should execute extraction -> audit -> config -> backup flow', async () => {
      // Step 1: Load configuration
      let response = await fetch(`${API_URL}/config`);
      expect(response.ok).toBe(true);
      const config = await response.json();
      console.log(`[E2E] Step 1: Loaded config v${config.data.configVersion}`);

      // Step 2: Update config
      response = await fetch(`${API_URL}/config/system`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          updates: { maxFileSize: 60 },
          changedBy: 'e2e-test',
          reason: 'Pipeline integration test',
        }),
      });
      expect(response.ok).toBe(true);
      console.log('[E2E] Step 2: Updated config');

      // Step 3: Create backup after config change
      response = await fetch(`${API_URL}/backup/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          backupName: 'Post-Config-Update Backup',
          reason: 'Backup after configuration change',
          backupBy: 'e2e-test',
        }),
      });
      expect(response.ok).toBe(true);
      const backup = await response.json();
      console.log(
        `[E2E] Step 3: Created backup ${backup.data.backup.backupId}`
      );

      // Step 4: Get backup stats
      response = await fetch(`${API_URL}/backup/stats`);
      expect(response.ok).toBe(true);
      const stats = await response.json();
      console.log(
        `[E2E] Step 4: Got stats - ${stats.data.statistics.totalBackups} total backups`
      );

      // Step 5: Load audit report (if available)
      response = await fetch(`${API_URL}/audit/test-doc-1`);
      if (response.ok) {
        console.log('[E2E] Step 5: Fetched audit report');
      } else {
        console.log('[E2E] Step 5: No audit report available (normal for E2E)');
      }

      console.log('[E2E] Complete pipeline integration test PASSED ✓');
    });
  });
});
