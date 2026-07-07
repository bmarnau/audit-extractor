/**
 * Confidence Score - repräsentiert Sicherheitsgrad
 * 1.0 = exakt im Dokument gefunden
 * 0.8-0.99 = sehr wahrscheinlich
 * 0.5-0.79 = wahrscheinlich
 * < 0.5 = nicht ausreichend sicher, sollte leer sein
 */
export class ConfidenceScore {
  private readonly score: number;

  constructor(value: number) {
    if (value < 0 || value > 1) {
      throw new Error('Confidence score must be between 0 and 1');
    }
    this.score = value;
  }

  getValue(): number {
    return this.score;
  }

  isHighConfidence(): boolean {
    return this.score >= 0.95;
  }

  isAcceptable(): boolean {
    return this.score >= 0.8;
  }

  isLow(): boolean {
    return this.score < 0.5;
  }

  static exact(): ConfidenceScore {
    return new ConfidenceScore(1.0);
  }

  static high(): ConfidenceScore {
    return new ConfidenceScore(0.9);
  }

  static medium(): ConfidenceScore {
    return new ConfidenceScore(0.7);
  }

  static low(): ConfidenceScore {
    return new ConfidenceScore(0.5);
  }
}
