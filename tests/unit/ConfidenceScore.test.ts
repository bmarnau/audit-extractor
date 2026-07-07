import { ConfidenceScore } from '@domain/ConfidenceScore';

describe('ConfidenceScore', () => {
  describe('constructor', () => {
    it('should accept valid scores', () => {
      expect(() => new ConfidenceScore(0)).not.toThrow();
      expect(() => new ConfidenceScore(0.5)).not.toThrow();
      expect(() => new ConfidenceScore(1.0)).not.toThrow();
    });

    it('should reject invalid scores', () => {
      expect(() => new ConfidenceScore(-0.1)).toThrow();
      expect(() => new ConfidenceScore(1.1)).toThrow();
    });
  });

  describe('classification', () => {
    it('should classify scores correctly', () => {
      expect(new ConfidenceScore(1.0).isHighConfidence()).toBe(true);
      expect(new ConfidenceScore(0.9).isAcceptable()).toBe(true);
      expect(new ConfidenceScore(0.4).isLow()).toBe(true);
      expect(new ConfidenceScore(0.85).isAcceptable()).toBe(true);
    });
  });

  describe('factory methods', () => {
    it('should create predefined scores', () => {
      expect(ConfidenceScore.exact().getValue()).toBe(1.0);
      expect(ConfidenceScore.high().getValue()).toBe(0.9);
      expect(ConfidenceScore.medium().getValue()).toBe(0.7);
      expect(ConfidenceScore.low().getValue()).toBe(0.5);
    });
  });
});
