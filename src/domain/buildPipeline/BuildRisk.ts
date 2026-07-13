/**
 * BuildRisk - Value Object für Risiken
 * 
 * Definiert und klassifiziert Risiken im Build-Prozess
 */

export enum RiskCategory {
  FLAKY_TESTS = 'FLAKY_TESTS',
  BLOCKING_ISSUES = 'BLOCKING_ISSUES',
  CRITICAL_ISSUES = 'CRITICAL_ISSUES',
  MISSING_TESTS = 'MISSING_TESTS',
  PERFORMANCE_DEGRADATION = 'PERFORMANCE_DEGRADATION',
  SECURITY_ISSUES = 'SECURITY_ISSUES',
  UNKNOWN_FAILURES = 'UNKNOWN_FAILURES',
  DEPENDENCY_ISSUES = 'DEPENDENCY_ISSUES'
}

export enum RiskSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export interface RiskData {
  id: string;
  category: RiskCategory;
  severity: RiskSeverity;
  description: string;
  affectedComponent: string;
  count: number;
  recommendation: string;
  detectedAt: Date;
}

export class BuildRisk {
  readonly id: string;
  readonly category: RiskCategory;
  readonly severity: RiskSeverity;
  readonly description: string;
  readonly affectedComponent: string;
  readonly count: number;
  readonly recommendation: string;
  readonly detectedAt: Date;

  constructor(data: RiskData) {
    this.id = data.id;
    this.category = data.category;
    this.severity = data.severity;
    this.description = data.description;
    this.affectedComponent = data.affectedComponent;
    this.count = data.count;
    this.recommendation = data.recommendation;
    this.detectedAt = data.detectedAt;
  }

  /**
   * Gibt Risk Impact Score zurück (0-100)
   */
  getImpactScore(): number {
    const baseScore: Record<RiskCategory, number> = {
      [RiskCategory.FLAKY_TESTS]: 30,
      [RiskCategory.BLOCKING_ISSUES]: 100,
      [RiskCategory.CRITICAL_ISSUES]: 80,
      [RiskCategory.MISSING_TESTS]: 50,
      [RiskCategory.PERFORMANCE_DEGRADATION]: 40,
      [RiskCategory.SECURITY_ISSUES]: 90,
      [RiskCategory.UNKNOWN_FAILURES]: 60,
      [RiskCategory.DEPENDENCY_ISSUES]: 70
    };

    const severityMultiplier: Record<RiskSeverity, number> = {
      [RiskSeverity.CRITICAL]: 1.5,
      [RiskSeverity.HIGH]: 1.2,
      [RiskSeverity.MEDIUM]: 0.8,
      [RiskSeverity.LOW]: 0.5
    };

    const countMultiplier = Math.min(this.count, 10) / 10; // 0-1

    return Math.min(
      100,
      baseScore[this.category] * severityMultiplier[this.severity] * (1 + countMultiplier)
    );
  }

  /**
   * Prüft ob Risk blockierend ist
   */
  isBlocking(): boolean {
    return (
      this.category === RiskCategory.BLOCKING_ISSUES ||
      (this.category === RiskCategory.CRITICAL_ISSUES && this.severity === RiskSeverity.CRITICAL) ||
      (this.category === RiskCategory.SECURITY_ISSUES && this.severity === RiskSeverity.CRITICAL)
    );
  }

  /**
   * Serialisierung
   */
  toJSON(): RiskData {
    return {
      id: this.id,
      category: this.category,
      severity: this.severity,
      description: this.description,
      affectedComponent: this.affectedComponent,
      count: this.count,
      recommendation: this.recommendation,
      detectedAt: this.detectedAt
    };
  }
}
