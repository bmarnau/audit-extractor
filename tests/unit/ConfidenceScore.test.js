"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ConfidenceScore_1 = require("@domain/ConfidenceScore");
describe('ConfidenceScore', () => {
    describe('constructor', () => {
        it('should accept valid scores', () => {
            expect(() => new ConfidenceScore_1.ConfidenceScore(0)).not.toThrow();
            expect(() => new ConfidenceScore_1.ConfidenceScore(0.5)).not.toThrow();
            expect(() => new ConfidenceScore_1.ConfidenceScore(1.0)).not.toThrow();
        });
        it('should reject invalid scores', () => {
            expect(() => new ConfidenceScore_1.ConfidenceScore(-0.1)).toThrow();
            expect(() => new ConfidenceScore_1.ConfidenceScore(1.1)).toThrow();
        });
    });
    describe('classification', () => {
        it('should classify scores correctly', () => {
            expect(new ConfidenceScore_1.ConfidenceScore(1.0).isHighConfidence()).toBe(true);
            expect(new ConfidenceScore_1.ConfidenceScore(0.9).isAcceptable()).toBe(true);
            expect(new ConfidenceScore_1.ConfidenceScore(0.4).isLow()).toBe(true);
            expect(new ConfidenceScore_1.ConfidenceScore(0.85).isAcceptable()).toBe(true);
        });
    });
    describe('factory methods', () => {
        it('should create predefined scores', () => {
            expect(ConfidenceScore_1.ConfidenceScore.exact().getValue()).toBe(1.0);
            expect(ConfidenceScore_1.ConfidenceScore.high().getValue()).toBe(0.9);
            expect(ConfidenceScore_1.ConfidenceScore.medium().getValue()).toBe(0.7);
            expect(ConfidenceScore_1.ConfidenceScore.low().getValue()).toBe(0.5);
        });
    });
});
//# sourceMappingURL=ConfidenceScore.test.js.map