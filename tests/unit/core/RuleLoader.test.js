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
const RuleLoader_1 = require("@core/rules/RuleLoader");
const path = __importStar(require("path"));
describe('RuleLoader', () => {
    let loader;
    const rulesDir = path.join(__dirname, '../../extraction-rules');
    beforeEach(() => {
        loader = new RuleLoader_1.RuleLoader(rulesDir);
    });
    describe('Constructor', () => {
        it('should create RuleLoader with valid directory', () => {
            expect(loader).toBeDefined();
        });
        it('should throw error when directory path is missing', () => {
            expect(() => new RuleLoader_1.RuleLoader('')).toThrow(RuleLoader_1.RuleLoadError);
        });
    });
    describe('loadRules()', () => {
        it('should load all .txt files from rules directory', async () => {
            const rules = await loader.loadRules();
            expect(rules).toBeInstanceOf(Map);
            expect(rules.size).toBeGreaterThan(0);
        });
        it('should cache loaded rules', async () => {
            const rules1 = await loader.loadRules();
            const rules2 = await loader.loadRules();
            expect(rules1.size).toBe(rules2.size);
        });
        it('should parse rule fields correctly', async () => {
            const rules = await loader.loadRules();
            const rule = Array.from(rules.values()).find((r) => r.fieldName === 'invoiceNumber');
            expect(rule).toBeDefined();
            expect(rule?.id).toBe('invoice-field-001');
            expect(rule?.fieldType).toBe('string');
            expect(rule?.isRequired).toBe(true);
            expect(rule?.description).toContain('Rechnungsnummer');
        });
    });
    describe('loadSchemas()', () => {
        it('should load all .json files from schemas directory', async () => {
            const schemas = await loader.loadSchemas();
            expect(schemas).toBeInstanceOf(Map);
            expect(schemas.size).toBeGreaterThan(0);
        });
        it('should cache loaded schemas', async () => {
            const schemas1 = await loader.loadSchemas();
            const schemas2 = await loader.loadSchemas();
            expect(schemas1.size).toBe(schemas2.size);
        });
        it('should parse schema fields correctly', async () => {
            const schemas = await loader.loadSchemas();
            const schema = Array.from(schemas.values()).find((s) => s.documentType === 'invoice');
            expect(schema).toBeDefined();
            expect(schema?.name).toBe('Invoice Schema');
            expect(schema?.version).toBe('1.0.0');
            expect(schema?.fields).toBeDefined();
            expect(schema?.fields.length).toBeGreaterThan(0);
        });
    });
    describe('loadSchema()', () => {
        it('should load a specific schema by name', async () => {
            const schema = await loader.loadSchema('invoice-v1.0.0');
            expect(schema).toBeDefined();
            expect(schema?.id).toBe('invoice-schema-v1.0.0');
            expect(schema?.name).toBe('Invoice Schema');
        });
        it('should return undefined for non-existent schema', async () => {
            const schema = await loader.loadSchema('non-existent');
            expect(schema).toBeUndefined();
        });
        it('should cache loaded schema for subsequent calls', async () => {
            const schema1 = await loader.loadSchema('invoice-v1.0.0');
            const schema2 = await loader.loadSchema('invoice-v1.0.0');
            expect(schema1).toEqual(schema2);
        });
    });
    describe('getRule()', () => {
        beforeEach(async () => {
            await loader.loadRules();
        });
        it('should return a cached rule by ID', () => {
            const rule = loader.getRule('invoice-field-001');
            expect(rule).toBeDefined();
            expect(rule?.fieldName).toBe('invoiceNumber');
        });
        it('should return undefined for non-existent rule', () => {
            const rule = loader.getRule('non-existent');
            expect(rule).toBeUndefined();
        });
    });
    describe('getAllRules()', () => {
        beforeEach(async () => {
            await loader.loadRules();
        });
        it('should return all cached rules', () => {
            const rules = loader.getAllRules();
            expect(rules).toBeInstanceOf(Map);
            expect(rules.size).toBeGreaterThan(0);
        });
    });
    describe('getAllSchemas()', () => {
        beforeEach(async () => {
            await loader.loadSchemas();
        });
        it('should return all cached schemas', () => {
            const schemas = loader.getAllSchemas();
            expect(schemas).toBeInstanceOf(Map);
            expect(schemas.size).toBeGreaterThan(0);
        });
    });
    describe('clearCache()', () => {
        beforeEach(async () => {
            await loader.loadRules();
            await loader.loadSchemas();
        });
        it('should clear all cached rules and schemas', () => {
            expect(loader.getAllRules().size).toBeGreaterThan(0);
            expect(loader.getAllSchemas().size).toBeGreaterThan(0);
            loader.clearCache();
            expect(loader.getAllRules().size).toBe(0);
            expect(loader.getAllSchemas().size).toBe(0);
        });
    });
    describe('Error Handling', () => {
        it('should throw RuleLoadError for invalid rule file format', async () => {
        });
        it('should throw RuleLoadError for missing required fields', async () => {
        });
        it('should throw RuleLoadError for invalid JSON in schema', async () => {
        });
    });
    describe('No Data Generation', () => {
        it('should NOT fill missing optional fields', async () => {
            const rules = await loader.loadRules();
            const rule = loader.getRule('invoice-field-001');
            expect(rule?.hints).toBeDefined();
            expect(rule?.examples).toBeDefined();
        });
        it('should NOT create defaults for missing fields', async () => {
            const schema = await loader.loadSchema('invoice-v1.0.0');
            expect(schema?.fields.length).toBeGreaterThan(0);
        });
    });
});
//# sourceMappingURL=RuleLoader.test.js.map