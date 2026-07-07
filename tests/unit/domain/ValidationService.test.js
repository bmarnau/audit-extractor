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
const ValidationServiceImpl_1 = require("@domain/validation/ValidationServiceImpl");
const ValidationService_1 = require("@domain/validation/ValidationService");
describe('AjvValidationService', () => {
    let service;
    const testSchemaDir = path.join(__dirname, 'test-schemas');
    beforeAll(async () => {
        await fs.mkdir(testSchemaDir, { recursive: true });
        const invoiceSchema = {
            documentType: 'invoice',
            version: '1.0.0',
            description: 'Invoice schema for testing',
            fields: [
                {
                    fieldName: 'invoiceNumber',
                    fieldType: 'string',
                    isRequired: true,
                    description: 'Unique invoice number',
                },
                {
                    fieldName: 'invoiceDate',
                    fieldType: 'date',
                    isRequired: true,
                    description: 'Invoice date',
                },
                {
                    fieldName: 'totalAmount',
                    fieldType: 'amount',
                    isRequired: true,
                    description: 'Total amount',
                },
                {
                    fieldName: 'customerName',
                    fieldType: 'string',
                    isRequired: true,
                    description: 'Customer name',
                },
                {
                    fieldName: 'dueDate',
                    fieldType: 'date',
                    isRequired: false,
                    description: 'Payment due date',
                },
            ],
        };
        const contractSchema = {
            documentType: 'contract',
            version: '1.0.0',
            description: 'Contract schema for testing',
            fields: [
                {
                    fieldName: 'partyA',
                    fieldType: 'string',
                    isRequired: true,
                    description: 'First party',
                },
                {
                    fieldName: 'partyB',
                    fieldType: 'string',
                    isRequired: true,
                    description: 'Second party',
                },
                {
                    fieldName: 'termMonths',
                    fieldType: 'number',
                    isRequired: true,
                    description: 'Contract term in months',
                },
                {
                    fieldName: 'signatoryDate',
                    fieldType: 'date',
                    isRequired: false,
                    description: 'Date of signature',
                },
            ],
        };
        await fs.writeFile(path.join(testSchemaDir, 'invoice-v1.0.0.json'), JSON.stringify(invoiceSchema));
        await fs.writeFile(path.join(testSchemaDir, 'contract-v1.0.0.json'), JSON.stringify(contractSchema));
    });
    beforeEach(() => {
        service = new ValidationServiceImpl_1.AjvValidationService(testSchemaDir);
    });
    describe('loadSchema', () => {
        it('should load existing custom schema', async () => {
            const schema = await service.loadSchema('invoice');
            expect(schema).toBeDefined();
            expect(schema?.documentType).toBe('invoice');
            expect(schema?.requiredFields).toContain('invoiceNumber');
            expect(schema?.requiredFields).toContain('invoiceDate');
            expect(schema?.requiredFields).toContain('totalAmount');
            expect(schema?.optionalFields).toContain('dueDate');
        });
        it('should return null for non-existent schema', async () => {
            const schema = await service.loadSchema('unknown-type');
            expect(schema).toBeNull();
        });
        it('should cache loaded schemas', async () => {
            const schema1 = await service.loadSchema('invoice');
            const schema2 = await service.loadSchema('invoice');
            expect(schema1).toBe(schema2);
        });
        it('should handle versioned schema filenames', async () => {
            const schema = await service.loadSchema('invoice');
            expect(schema).toBeDefined();
            expect(schema?.documentType).toBe('invoice');
        });
    });
    describe('validate', () => {
        it('should validate correct extraction result', async () => {
            const result = {
                extractedFields: new Map([
                    ['invoiceNumber', { value: 'INV-001', confidence: 0.95, sources: [] }],
                    ['invoiceDate', { value: '2024-01-15', confidence: 0.95, sources: [] }],
                    ['totalAmount', { value: 1000, confidence: 0.95, sources: [] }],
                    ['customerName', { value: 'Acme Corp', confidence: 0.95, sources: [] }],
                ]),
                missingFields: [],
                warnings: [],
            };
            const validation = await service.validate(result, 'invoice');
            expect(validation.isValid).toBe(true);
            expect(validation.errors.length).toBe(0);
            expect(validation.missingFields.length).toBe(0);
        });
        it('should detect missing required fields', async () => {
            const result = {
                extractedFields: new Map([
                    ['invoiceNumber', { value: 'INV-001', confidence: 0.95, sources: [] }],
                    ['invoiceDate', { value: '2024-01-15', confidence: 0.95, sources: [] }],
                ]),
                missingFields: [],
                warnings: [],
            };
            const validation = await service.validate(result, 'invoice');
            expect(validation.missingFields).toContain('totalAmount');
            expect(validation.missingFields).toContain('customerName');
        });
        it('should allow optional fields to be missing', async () => {
            const result = {
                extractedFields: new Map([
                    ['invoiceNumber', { value: 'INV-001', confidence: 0.95, sources: [] }],
                    ['invoiceDate', { value: '2024-01-15', confidence: 0.95, sources: [] }],
                    ['totalAmount', { value: 1000, confidence: 0.95, sources: [] }],
                    ['customerName', { value: 'Acme Corp', confidence: 0.95, sources: [] }],
                ]),
                missingFields: [],
                warnings: [],
            };
            const validation = await service.validate(result, 'invoice');
            expect(validation.isValid).toBe(true);
            expect(validation.missingFields).not.toContain('dueDate');
        });
        it('should detect type mismatches', async () => {
            const result = {
                extractedFields: new Map([
                    ['invoiceNumber', { value: 'INV-001', confidence: 0.95, sources: [] }],
                    ['invoiceDate', { value: '2024-01-15', confidence: 0.95, sources: [] }],
                    ['totalAmount', { value: 'not-a-number', confidence: 0.95, sources: [] }],
                    ['customerName', { value: 'Acme Corp', confidence: 0.95, sources: [] }],
                ]),
                missingFields: [],
                warnings: [],
            };
            const validation = await service.validate(result, 'invoice');
            expect(validation.errors.length).toBeGreaterThan(0);
            expect(validation.isValid).toBe(false);
        });
        it('should throw error for unknown schema', async () => {
            const result = {
                extractedFields: new Map(),
                missingFields: [],
                warnings: [],
            };
            await expect(service.validate(result, 'unknown-type')).rejects.toThrow(ValidationService_1.ValidationServiceError);
        });
    });
    describe('loadAllSchemas', () => {
        it('should load all available schemas', async () => {
            const schemas = await service.loadAllSchemas();
            expect(schemas.length).toBeGreaterThanOrEqual(2);
            expect(schemas.some((s) => s.documentType === 'invoice')).toBe(true);
            expect(schemas.some((s) => s.documentType === 'contract')).toBe(true);
        });
    });
    describe('getSupportedDocumentTypes', () => {
        it('should return all supported document types', async () => {
            const types = await service.getSupportedDocumentTypes();
            expect(types).toContain('invoice');
            expect(types).toContain('contract');
        });
        it('should deduplicate document types', async () => {
            const types = await service.getSupportedDocumentTypes();
            const uniqueTypes = new Set(types);
            expect(uniqueTypes.size).toBe(types.length);
        });
    });
    describe('No Data Generation', () => {
        it('should not add default values to result', async () => {
            const result = {
                extractedFields: new Map([
                    ['invoiceNumber', { value: 'INV-001', confidence: 0.95, sources: [] }],
                    ['invoiceDate', { value: '2024-01-15', confidence: 0.95, sources: [] }],
                    ['totalAmount', { value: 1000, confidence: 0.95, sources: [] }],
                    ['customerName', { value: 'Acme Corp', confidence: 0.95, sources: [] }],
                ]),
                missingFields: [],
                warnings: [],
            };
            const validation = await service.validate(result, 'invoice');
            expect(result.extractedFields.size).toBe(4);
            expect(validation.missingFields).not.toContain('dueDate');
        });
        it('should not invent missing fields', async () => {
            const result = {
                extractedFields: new Map([
                    ['invoiceNumber', { value: 'INV-001', confidence: 0.95, sources: [] }],
                ]),
                missingFields: [],
                warnings: [],
            };
            const validation = await service.validate(result, 'invoice');
            expect(validation.missingFields).toEqual(expect.arrayContaining(['invoiceDate', 'totalAmount', 'customerName']));
            expect(validation.missingFields.length).toBe(3);
        });
    });
    afterAll(async () => {
        try {
            await fs.rm(testSchemaDir, { recursive: true });
        }
        catch {
        }
    });
});
//# sourceMappingURL=ValidationService.test.js.map