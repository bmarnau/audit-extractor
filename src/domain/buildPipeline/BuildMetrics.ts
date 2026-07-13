/**
 * BuildMetrics - Value Object für Build-Metriken
 * 
 * Aggregiert alle wichtigen Metriken eines Build-Durchlaufs
 */

export interface BuildMetricsData {
  totalTests: number;
  successfulTests: number;
  failedTests: number;
  skippedTests: number;
  totalIssues: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  testDuration: number; // milliseconds
  successRate: number; // 0-1
  buildBlockingIssues: number;
  flakyTests: number;
}

export class BuildMetrics {
  readonly totalTests: number;
  readonly successfulTests: number;
  readonly failedTests: number;
  readonly skippedTests: number;
  readonly totalIssues: number;
  readonly criticalIssues: number;
  readonly highIssues: number;
  readonly mediumIssues: number;
  readonly lowIssues: number;
  readonly testDuration: number;
  readonly successRate: number;
  readonly buildBlockingIssues: number;
  readonly flakyTests: number;

  constructor(data: BuildMetricsData) {
    this.totalTests = data.totalTests;
    this.successfulTests = data.successfulTests;
    this.failedTests = data.failedTests;
    this.skippedTests = data.skippedTests;
    this.totalIssues = data.totalIssues;
    this.criticalIssues = data.criticalIssues;
    this.highIssues = data.highIssues;
    this.mediumIssues = data.mediumIssues;
    this.lowIssues = data.lowIssues;
    this.testDuration = data.testDuration;
    this.successRate = data.successRate;
    this.buildBlockingIssues = data.buildBlockingIssues;
    this.flakyTests = data.flakyTests;
  }

  /**
   * Berechnet Build Health Score (0-100)
   */
  calculateHealthScore(): number {
    if (this.totalTests === 0) return 100;
    
    const successPenalty = (1 - this.successRate) * 50; // 0-50 points
    const issuePenalty = Math.min(this.totalIssues * 5, 30); // 0-30 points
    const blockingPenalty = this.buildBlockingIssues * 10; // 0+ points
    
    const score = Math.max(0, 100 - successPenalty - issuePenalty - blockingPenalty);
    return Math.round(score);
  }

  /**
   * Bestimmt Risk Level basierend auf Metriken
   */
  determineRiskLevel(): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    if (this.buildBlockingIssues > 0 || this.successRate < 0.7) return 'CRITICAL';
    if (this.criticalIssues > 0 || this.successRate < 0.85) return 'HIGH';
    if (this.totalIssues > 5 || this.successRate < 0.95) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Bestimmt ob Build passieren kann
   */
  canBuildPass(): boolean {
    return (
      this.buildBlockingIssues === 0 &&
      this.successRate >= 0.8 &&
      this.criticalIssues === 0
    );
  }

  /**
   * Gibt eine Zusammenfassung zurück
   */
  getSummary(): string {
    const riskLevel = this.determineRiskLevel();
    const healthScore = this.calculateHealthScore();
    return `Build Health: ${healthScore}/100 | Risk: ${riskLevel} | Tests: ${this.successfulTests}/${this.totalTests} | Issues: ${this.totalIssues} (${this.criticalIssues} critical)`;
  }

  /**
   * Serialisierung
   */
  toJSON(): BuildMetricsData {
    return {
      totalTests: this.totalTests,
      successfulTests: this.successfulTests,
      failedTests: this.failedTests,
      skippedTests: this.skippedTests,
      totalIssues: this.totalIssues,
      criticalIssues: this.criticalIssues,
      highIssues: this.highIssues,
      mediumIssues: this.mediumIssues,
      lowIssues: this.lowIssues,
      testDuration: this.testDuration,
      successRate: this.successRate,
      buildBlockingIssues: this.buildBlockingIssues,
      flakyTests: this.flakyTests
    };
  }
}
