"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const QualityEvaluatorImpl_1 = require("@application/quality/QualityEvaluatorImpl");
const QualityEvaluator_1 = require("@application/quality/QualityEvaluator");
function createTestResult() {
    return {
        resultId: `result-${Date.now()}`,
        documentReference: {
            documentId: 'doc-1',
            fileName: 'test.pdf',
            documentType: 'pdf',
            hash: 'abc123',
            uploadedAt: new Date(),
        },
        extractedFields: new Map(),
        missingFields: [],
        warnings: [],
        extractedAt: new Date(),
        version: '1.0.0',
        ruleSetVersion: '1.0.0',
    };
}
describe('MetricsBasedQualityEvaluator', () => {
    let evaluator;
    beforeEach(() => {
        evaluator = new QualityEvaluatorImpl_1.MetricsBasedQualityEvaluator();
    });
    describe('evaluate', () => {
        it('should evaluate perfect result', async () => {
            const result = createTestResult();
            result.extractedFields.set('invoiceNumber', {
                value: 'INV-001',
                confidence: 0.95,
                sources: [{ documentReference: result.documentReference, offsetStart: 0, offsetEnd: 7 }],
                extractedAt: new Date(),
            });
            result.extractedFields.set('totalAmount', {
                value: 1000,
                confidence: 0.9,
                sources: [{ documentReference: result.documentReference, offsetStart: 0, offsetEnd: 4 }],
                extractedAt: new Date(),
            });
            const score = await evaluator.evaluate(result, 2);
            expect(score.overallScore).toBeGreaterThan(0.9);
            expect(score.completeness).toBe(1.0);
            expect(score.verifiability).toBe(1.0);
        });
        it('should evaluate incomplete result', async () => {
            const result = createTestResult();
            result.extractedFields.set('invoiceNumber', {
                value: 'INV-001',
                confidence: 0.95,
                sources: [],
                extractedAt: new Date(),
            });
            result.missingFields = ['totalAmount', 'dueDate'];
            const score = await evaluator.evaluate(result, 3);
            expect(score.completeness).toBeLessThan(1.0);
            expect(score.details.extractedFieldCount).toBe(1);
            expect(score.details.missingFieldCount).toBe(2);
        });
        it('should evaluate result without sources', async () => {
            const result = createTestResult();
            result.extractedFields.set('invoiceNumber', {
                value: 'INV-001',
                confidence: 0.95,
                sources: [],
                extractedAt: new Date(),
            });
            result.extractedFields.set('totalAmount', {
                value: 1000,
                confidence: 0.9,
                sources: [{ documentReference: result.documentReference, offsetStart: 0, offsetEnd: 4 }],
                extractedAt: new Date(),
            });
            const score = await evaluator.evaluate(result, 2);
            expect(score.verifiability).toBe(0.5);
            expect(score.details.fieldsWithoutSources).toContain('invoiceNumber');
        });
    });
    describe('evaluateCompleteness', () => {
        it('should return 1.0 for all fields present', () => {
            const result = createTestResult();
            result.extractedFields.set('field1', { value: 'value1', confidence: 0.9, sources: [], extractedAt: new Date() });
            result.extractedFields.set('field2', { value: 'value2', confidence: 0.9, sources: [], extractedAt: new Date() });
            const score = evaluator.evaluateCompleteness(result, 2);
            expect(score).toBe(1.0);
        });
        it('should calculate partial completeness', () => {
            const result = createTestResult();
            result.extractedFields.set('field1', { value: 'value1', confidence: 0.9, sources: [], extractedAt: new Date() });
            const score = evaluator.evaluateCompleteness(result, 4);
            expect(score).toBe(0.25);
        });
        it('should clamp to max 1.0', () => {
            const result = createTestResult();
            result.extractedFields.set('field1', { value: 'value1', confidence: 0.9, sources: [], extractedAt: new Date() });
            result.extractedFields.set('field2', { value: 'value2', confidence: 0.9, sources: [], extractedAt: new Date() });
            const score = evaluator.evaluateCompleteness(result, 1);
            expect(score).toBe(1.0);
        });
    });
    describe('evaluateVerifiability', () => {
        it('should return 1.0 when all have sources', () => {
            const result = createTestResult();
            result.extractedFields.set('field1', {
                value: 'value1',
                confidence: 0.9,
                sources: [{ documentReference: result.documentReference, offsetStart: 0, offsetEnd: 4 }],
                extractedAt: new Date(),
            });
            const score = evaluator.evaluateVerifiability(result);
            expect(score).toBe(1.0);
        });
        it('should calculate partial verifiability', () => {
            const result = createTestResult();
            result.extractedFields.set('field1', { value: 'value1', confidence: 0.9, sources: [], extractedAt: new Date() });
            result.extractedFields.set('field2', {
                value: 'value2',
                confidence: 0.9,
                sources: [{ documentReference: result.documentReference, offsetStart: 0, offsetEnd: 4 }],
                extractedAt: new Date(),
            });
            const score = evaluator.evaluateVerifiability(result);
            expect(score).toBe(0.5);
        });
    });
    describe('evaluateConsistency', () => {
        it('should detect confidence out of range', () => {
            const result = createTestResult();
            result.extractedFields.set('field1', {
                value: 'value1',
                confidence: 1.5,
                sources: [],
                extractedAt: new Date(),
            });
            const score = evaluator.evaluateConsistency(result);
            expect(score).toBeLessThan(1.0);
        });
        it('should detect undefined values', () => {
            const result = createTestResult();
            result.extractedFields.set('field1', { value: undefined, confidence: 0.9, sources: [], extractedAt: new Date() });
            const score = evaluator.evaluateConsistency(result);
            expect(score).toBeLessThan(1.0);
        });
        it('should return 1.0 for consistent data', () => {
            const result = createTestResult();
            result.extractedFields.set('field1', { value: 'value1', confidence: 0.9, sources: [], extractedAt: new Date() });
            result.extractedFields.set('field2', { value: 123, confidence: 0.85, sources: [], extractedAt: new Date() });
            const score = evaluator.evaluateConsistency(result);
            expect(score).toBe(1.0);
        });
    });
    describe('evaluateSchemaConformity', () => {
        it('should return 1.0 when no schema', () => {
            const result = createTestResult();
            result.extractedFields.set('field1', { value: 'value1', confidence: 0.9, sources: [], extractedAt: new Date() });
            const score = evaluator.evaluateSchemaConformity(result);
            expect(score).toBe(1.0);
        });
        it('should validate against schema', () => {
            const evaluatorWithSchema = new QualityEvaluatorImpl_1.MetricsBasedQualityEvaluator({
                schema: {
                    properties: {
                        invoiceNumber: { type: 'string' },
                        totalAmount: { type: 'number' },
                    },
                },
            });
            const result = createTestResult();
            result.extractedFields.set('invoiceNumber', { value: 'INV-001', confidence: 0.9, sources: [], extractedAt: new Date() });
            result.extractedFields.set('unknownField', { value: 'value', confidence: 0.9, sources: [], extractedAt: new Date() });
            const score = evaluatorWithSchema.evaluateSchemaConformity(result);
            expect(score).toBe(0.5);
        });
    });
    describe('Weight Configuration', () => {
        it('should reject weights that do not sum to 1.0', () => {
            expect(() => {
                new QualityEvaluatorImpl_1.MetricsBasedQualityEvaluator({
                    weights: {
                        completeness: 0.5,
                        consistency: 0.3,
                        verifiability: 0.1,
                        schemaConformity: 0.05,
                    },
                });
            }).toThrow(QualityEvaluator_1.QualityEvaluatorError);
        });
        it('should accept valid weights', () => {
            const eval2 = new QualityEvaluatorImpl_1.MetricsBasedQualityEvaluator({
                weights: {
                    completeness: 0.4,
                    consistency: 0.3,
                    verifiability: 0.2,
                    schemaConformity: 0.1,
                },
            });
            expect(eval2).toBeDefined();
        });
    });
    describe('No Data Generation', () => {
        it('should not modify result during evaluation', async () => {
            const result = createTestResult();
            result.extractedFields.set('field1', { value: 'value1', confidence: 0.9, sources: [], extractedAt: new Date() });
            const originalSize = result.extractedFields.size;
            await evaluator.evaluate(result, 2);
            expect(result.extractedFields.size).toBe(originalSize);
            expect(result.extractedFields.get('field1')?.value).toBe('value1');
        });
        it('should not add/remove fields', async () => {
            const result = createTestResult();
            result.extractedFields.set('field1', { value: 'value1', confidence: 0.9, sources: [], extractedAt: new Date() });
            result.extractedFields.set('field2', { value: 'value2', confidence: 0.8, sources: [], extractedAt: new Date() });
            result.missingFields = ['field3'];
            const originalMissing = result.missingFields.length;
            await evaluator.evaluate(result, 3);
            expect(result.missingFields.length).toBe(originalMissing);
        });
    });
});
//# sourceMappingURL=QualityEvaluator.test.js.map