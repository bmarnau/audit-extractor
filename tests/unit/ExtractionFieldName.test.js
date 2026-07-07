"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ExtractionFieldName_1 = require("@domain/ExtractionFieldName");
describe('ExtractionFieldName', () => {
    describe('constructor', () => {
        it('should accept valid field names', () => {
            expect(() => new ExtractionFieldName_1.ExtractionFieldName('fieldName')).not.toThrow();
            expect(() => new ExtractionFieldName_1.ExtractionFieldName('_private')).not.toThrow();
            expect(() => new ExtractionFieldName_1.ExtractionFieldName('field_123')).not.toThrow();
        });
        it('should reject invalid field names', () => {
            expect(() => new ExtractionFieldName_1.ExtractionFieldName('')).toThrow();
            expect(() => new ExtractionFieldName_1.ExtractionFieldName('123field')).toThrow();
            expect(() => new ExtractionFieldName_1.ExtractionFieldName('field-name')).toThrow();
            expect(() => new ExtractionFieldName_1.ExtractionFieldName('field name')).toThrow();
        });
    });
    describe('equals', () => {
        it('should compare field names correctly', () => {
            const field1 = new ExtractionFieldName_1.ExtractionFieldName('test');
            const field2 = new ExtractionFieldName_1.ExtractionFieldName('test');
            const field3 = new ExtractionFieldName_1.ExtractionFieldName('different');
            expect(field1.equals(field2)).toBe(true);
            expect(field1.equals(field3)).toBe(false);
        });
    });
    describe('toString', () => {
        it('should return the field name', () => {
            const field = new ExtractionFieldName_1.ExtractionFieldName('myField');
            expect(field.toString()).toBe('myField');
        });
    });
});
//# sourceMappingURL=ExtractionFieldName.test.js.map