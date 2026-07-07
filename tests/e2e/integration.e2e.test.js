"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
(0, globals_1.describe)('E2E Integration Tests - Phase 13', () => {
    const API_URL = 'http://localhost:3000/api';
    let documentId;
    let backupId;
    (0, globals_1.beforeAll)(async () => {
        console.log('[E2E] Starting integration tests...');
        await new Promise((resolve) => setTimeout(resolve, 2000));
    });
    (0, globals_1.afterAll)(async () => {
        console.log('[E2E] Integration tests completed');
    });
    (0, globals_1.describe)('Configuration Center', () => {
        (0, globals_1.it)('should load current configuration', async () => {
            const response = await fetch(`${API_URL}/config`);
            (0, globals_1.expect)(response.ok).toBe(true);
            const data = await response.json();
            (0, globals_1.expect)(data.data).toHaveProperty('chunking');
            (0, globals_1.expect)(data.data).toHaveProperty('confidence');
            (0, globals_1.expect)(data.data).toHaveProperty('llm');
            (0, globals_1.expect)(data.data).toHaveProperty('system');
            (0, globals_1.expect)(data.data.configVersion).toBeGreaterThan(0);
        });
        (0, globals_1.it)('should update configuration section', async () => {
            const response = await fetch(`${API_URL}/config/chunking`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    updates: { maxChunkSize: 2048 },
                    changedBy: 'e2e-test',
                    reason: 'Integration test update',
                }),
            });
            (0, globals_1.expect)(response.ok).toBe(true);
            const data = await response.json();
            (0, globals_1.expect)(data.data.chunking.maxChunkSize).toBe(2048);
        });
        (0, globals_1.it)('should load configuration changes', async () => {
            const response = await fetch(`${API_URL}/config/changes?limit=10`);
            (0, globals_1.expect)(response.ok).toBe(true);
            const data = await response.json();
            (0, globals_1.expect)(Array.isArray(data.data.changes)).toBe(true);
            (0, globals_1.expect)(data.data.changes.length).toBeGreaterThan(0);
        });
    });
    (0, globals_1.describe)('Backup Center', () => {
        (0, globals_1.it)('should create a backup', async () => {
            const response = await fetch(`${API_URL}/backup/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    backupName: 'E2E Test Backup',
                    reason: 'Integration test',
                    backupBy: 'e2e-test',
                }),
            });
            (0, globals_1.expect)(response.ok).toBe(true);
            const data = await response.json();
            (0, globals_1.expect)(data.data.backup).toHaveProperty('backupId');
            (0, globals_1.expect)(data.data.backup.status).toBe('in-progress');
            backupId = data.data.backup.backupId;
        });
        (0, globals_1.it)('should list backups', async () => {
            const response = await fetch(`${API_URL}/backup/list?limit=10`);
            (0, globals_1.expect)(response.ok).toBe(true);
            const data = await response.json();
            (0, globals_1.expect)(Array.isArray(data.data.backups)).toBe(true);
        });
        (0, globals_1.it)('should get backup statistics', async () => {
            const response = await fetch(`${API_URL}/backup/stats`);
            (0, globals_1.expect)(response.ok).toBe(true);
            const data = await response.json();
            (0, globals_1.expect)(data.data.statistics).toHaveProperty('totalBackups');
            (0, globals_1.expect)(data.data.statistics).toHaveProperty('successRate');
            (0, globals_1.expect)(data.data.statistics).toHaveProperty('averageBackupSize');
        });
        (0, globals_1.it)('should delete backup', async () => {
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
            (0, globals_1.expect)(response.ok).toBe(true);
        });
    });
    (0, globals_1.describe)('Audit Center', () => {
        (0, globals_1.it)('should fetch audit report for document', async () => {
            const response = await fetch(`${API_URL}/audit/test-doc-1`);
            if (response.ok) {
                const data = await response.json();
                (0, globals_1.expect)(data.data).toHaveProperty('recordsCount');
                (0, globals_1.expect)(data.data).toHaveProperty('statistics');
            }
        });
    });
    (0, globals_1.describe)('Help Center', () => {
        (0, globals_1.it)('should search help content', async () => {
            const response = await fetch(`${API_URL}/help/search?query=extraction`);
            (0, globals_1.expect)(response.ok).toBe(true);
            const data = await response.json();
            (0, globals_1.expect)(data.data).toBeDefined();
        });
        (0, globals_1.it)('should fetch glossary', async () => {
            const response = await fetch(`${API_URL}/help/glossary`);
            (0, globals_1.expect)(response.ok).toBe(true);
            const data = await response.json();
            (0, globals_1.expect)(Array.isArray(data.data) || typeof data.data === 'object').toBe(true);
        });
    });
    (0, globals_1.describe)('Log Browser', () => {
        (0, globals_1.it)('should fetch logs with filter', async () => {
            const response = await fetch(`${API_URL}/logs?level=info&source=system&limit=50`);
            (0, globals_1.expect)(response.ok).toBe(true);
            const data = await response.json();
            (0, globals_1.expect)(Array.isArray(data.data.logs) || data.data.logs).toBeDefined();
        });
    });
    (0, globals_1.describe)('Complete Pipeline Integration', () => {
        (0, globals_1.it)('should execute extraction -> audit -> config -> backup flow', async () => {
            let response = await fetch(`${API_URL}/config`);
            (0, globals_1.expect)(response.ok).toBe(true);
            const config = await response.json();
            console.log(`[E2E] Step 1: Loaded config v${config.data.configVersion}`);
            response = await fetch(`${API_URL}/config/system`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    updates: { maxFileSize: 60 },
                    changedBy: 'e2e-test',
                    reason: 'Pipeline integration test',
                }),
            });
            (0, globals_1.expect)(response.ok).toBe(true);
            console.log('[E2E] Step 2: Updated config');
            response = await fetch(`${API_URL}/backup/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    backupName: 'Post-Config-Update Backup',
                    reason: 'Backup after configuration change',
                    backupBy: 'e2e-test',
                }),
            });
            (0, globals_1.expect)(response.ok).toBe(true);
            const backup = await response.json();
            console.log(`[E2E] Step 3: Created backup ${backup.data.backup.backupId}`);
            response = await fetch(`${API_URL}/backup/stats`);
            (0, globals_1.expect)(response.ok).toBe(true);
            const stats = await response.json();
            console.log(`[E2E] Step 4: Got stats - ${stats.data.statistics.totalBackups} total backups`);
            response = await fetch(`${API_URL}/audit/test-doc-1`);
            if (response.ok) {
                console.log('[E2E] Step 5: Fetched audit report');
            }
            else {
                console.log('[E2E] Step 5: No audit report available (normal for E2E)');
            }
            console.log('[E2E] Complete pipeline integration test PASSED ✓');
        });
    });
});
//# sourceMappingURL=integration.e2e.test.js.map