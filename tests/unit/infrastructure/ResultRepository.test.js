"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const path = __importStar(require("path"));
const fs = __importStar(require("fs/promises"));
const ResultRepositoryImpl_1 = require("@infrastructure/repositories/ResultRepositoryImpl");
function createTestResult(invoiceNumber = 'INV-001') {
    return {
        resultId: `result-${Date.now()}`,
        documentReference: {
            documentId: 'doc-1',
            fileName: 'test.pdf',
            documentType: 'pdf',
            hash: 'abc123',
            uploadedAt: new Date(),
        },
        extractedFields: new Map([
            [
                'invoiceNumber',
                {
                    value: invoiceNumber,
                    confidence: 0.95,
                    sources: [],
                    extractedAt: new Date(),
                },
            ],
        ]),
        missingFields: [],
        warnings: [],
        extractedAt: new Date(),
        version: '1.0.0',
        ruleSetVersion: '1.0.0',
    };
}
describe('FileSystemResultRepository', () => {
    let repository;
    const testJsonDir = path.join(__dirname, 'test-results-json');
    const testReportDir = path.join(__dirname, 'test-results-reports');
    beforeAll(async () => {
        await fs.mkdir(testJsonDir, { recursive: true });
        await fs.mkdir(testReportDir, { recursive: true });
    });
    beforeEach(() => {
        repository = new ResultRepositoryImpl_1.FileSystemResultRepository(testJsonDir, testReportDir);
    });
    describe('saveResult', () => {
        it('should save result with version 1', async () => {
            const result = {
                resultId: 'test-1',
                documentReference: {
                    documentId: 'doc-1',
                    fileName: 'test.pdf',
                    documentType: 'pdf',
                    hash: 'abc123',
                    uploadedAt: new Date(),
                },
                extractedFields: new Map([
                    [
                        'invoiceNumber',
                        {
                            value: 'INV-001',
                            confidence: 0.95,
                            sources: [],
                            extractedAt: new Date(),
                        },
                    ],
                ]),
                missingFields: [],
                warnings: [],
                extractedAt: new Date(),
                version: '1.0.0',
                ruleSetVersion: '1.0.0',
            };
            const versionInfo = await repository.saveResult(result, 'invoice_test');
            expect(versionInfo.version).toBe(1);
            expect(versionInfo.filePath).toContain('v1.json');
        });
        it('should auto-increment version numbers', async () => {
            const result = {
                resultId: 'test-2',
                documentReference: {
                    documentId: 'doc-2',
                    fileName: 'test.pdf',
                    documentType: 'pdf',
                    hash: 'abc123',
                    uploadedAt: new Date(),
                },
                extractedFields: new Map([
                    [
                        'invoiceNumber',
                        {
                            value: 'INV-001',
                            confidence: 0.95,
                            sources: [],
                            extractedAt: new Date(),
                        },
                    ],
                ]),
                missingFields: [],
                warnings: [],
                extractedAt: new Date(),
                version: '1.0.0',
                ruleSetVersion: '1.0.0',
            };
            const v1 = await repository.saveResult(result, 'invoice_versioning');
            const v2 = await repository.saveResult(result, 'invoice_versioning');
            const v3 = await repository.saveResult(result, 'invoice_versioning');
            expect(v1.version).toBe(1);
            expect(v2.version).toBe(2);
            expect(v3.version).toBe(3);
        });
    });
    describe('loadResult', () => {
        it('should load result by version', async () => {
            const original = createTestResult('INV-001');
            original.extractedFields.set('totalAmount', {
                value: 1000,
                confidence: 0.9,
                sources: [],
                extractedAt: new Date(),
            });
            await repository.saveResult(original, 'invoice_load');
            const loaded = await repository.loadResult('invoice_load', 1);
            expect(loaded).toBeDefined();
            expect(loaded?.extractedFields.get('invoiceNumber')?.value).toBe('INV-001');
            expect(loaded?.extractedFields.get('totalAmount')?.value).toBe(1000);
        });
        it('should return null for non-existent result', async () => {
            const loaded = await repository.loadResult('non_existent', 1);
            expect(loaded).toBeNull();
        });
        it('should load newest version if no version specified', async () => {
            const result1 = createTestResult('INV-001');
            await repository.saveResult(result1, 'invoice_newest');
            const result2 = createTestResult('INV-002');
            await repository.saveResult(result2, 'invoice_newest');
            const loaded = await repository.loadResult('invoice_newest');
            expect(loaded?.extractedFields.get('invoiceNumber')?.value).toBe('INV-002');
        });
    });
    describe('listVersions', () => {
        it('should list all versions in descending order', async () => {
            const result = createTestResult('INV-001');
            await repository.saveResult(result, 'invoice_list');
            await repository.saveResult(result, 'invoice_list');
            await repository.saveResult(result, 'invoice_list');
            const versions = await repository.listVersions('invoice_list');
            expect(versions.length).toBe(3);
            expect(versions[0].version).toBe(3);
            expect(versions[1].version).toBe(2);
            expect(versions[2].version).toBe(1);
        });
        it('should return empty array for non-existent base name', async () => {
            const versions = await repository.listVersions('non_existent');
            expect(versions).toEqual([]);
        });
    });
    describe('deleteVersion', () => {
        it('should delete specific version', async () => {
            const result = createTestResult('INV-001');
            await repository.saveResult(result, 'invoice_delete');
            const deleted = await repository.deleteVersion('invoice_delete', 1);
            expect(deleted).toBe(true);
            const versions = await repository.listVersions('invoice_delete');
            expect(versions.length).toBe(0);
        });
        it('should return false for non-existent version', async () => {
            const deleted = await repository.deleteVersion('non_existent', 99);
            expect(deleted).toBe(false);
        });
    });
    describe('saveReport', () => {
        it('should save markdown report', async () => {
            const content = '# Report\n\nTest content';
            const filePath = await repository.saveReport(content, 'invoice_report', 'markdown');
            expect(filePath).toContain('.md');
            expect(filePath).toContain(testReportDir);
        });
        it('should save HTML report', async () => {
            const content = '<html><body>Test</body></html>';
            const filePath = await repository.saveReport(content, 'invoice_html', 'html');
            expect(filePath).toContain('.html');
        });
    });
    describe('No Data Generation', () => {
        it('should not modify result during save', async () => {
            const result = createTestResult('INV-001');
            const originalSize = result.extractedFields.size;
            await repository.saveResult(result, 'invoice_integrity');
            expect(result.extractedFields.size).toBe(originalSize);
            expect(result.extractedFields.get('invoiceNumber')?.value).toBe('INV-001');
        });
        it('should preserve data types during serialization', async () => {
            const result = {
                resultId: 'test-types',
                documentReference: {
                    documentId: 'doc-1',
                    fileName: 'test.pdf',
                    documentType: 'pdf',
                    hash: 'abc123',
                    uploadedAt: new Date(),
                },
                extractedFields: new Map([
                    ['invoiceNumber', { value: 'INV-001', confidence: 0.95, sources: [], extractedAt: new Date() }],
                    ['totalAmount', { value: 1000.5, confidence: 0.9, sources: [], extractedAt: new Date() }],
                    ['isPaid', { value: true, confidence: 0.85, sources: [], extractedAt: new Date() }],
                ]),
                missingFields: [],
                warnings: [],
                extractedAt: new Date(),
                version: '1.0.0',
                ruleSetVersion: '1.0.0',
            };
            await repository.saveResult(result, 'invoice_types');
            const loaded = await repository.loadResult('invoice_types', 1);
            expect(typeof loaded?.extractedFields.get('invoiceNumber')?.value).toBe('string');
            expect(typeof loaded?.extractedFields.get('totalAmount')?.value).toBe('number');
            expect(typeof loaded?.extractedFields.get('isPaid')?.value).toBe('boolean');
        });
    });
    afterAll(async () => {
        try {
            await fs.rm(testJsonDir, { recursive: true });
            await fs.rm(testReportDir, { recursive: true });
        }
        catch {
        }
    });
});
//# sourceMappingURL=ResultRepository.test.js.map