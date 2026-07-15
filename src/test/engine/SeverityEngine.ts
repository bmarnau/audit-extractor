/**
 * Severity Engine - Phase 38D
 * 
 * Zentrale Bewertung aller Fehler nach:
 * - Severity Level
 * - Auswirkung
 * - Handlungsempfehlung
 * 
 * Keine Test-Logik enthält Severity Bestimmung mehr.
 * Alles läuft über diese Engine.
 */

import { Severity, SEVERITY_ORDER } from '../models/TestRegistry';
import { TestFinding } from '../models/TestResultModel';

/**
 * Severity-Regel für ein spezifisches Fehlermuster
 */
export interface SeverityRule {
  /** Eindeutige Regel-ID */
  id: string;

  /** Welche Test-IDs matched diese Regel? */
  testIdPatterns: RegExp[];

  /** Welche Kategorien? */
  categories?: string[];

  /** Welche Fehlertypen? */
  errorTypes?: string[];

  /** Keywords im Fehlertext */
  keywords?: string[];

  /** Resulting Severity */
  severity: Severity;

  /** Auswirkung wenn dieser Fehler auftritt */
  impact: string;

  /** Was sollte man tun? */
  recommendation: string;

  /** Root Cause Kategorie */
  rootCauseCategory: string;

  /** Priority für Überprüfung (höher = wird zuerst geprüft) */
  priority: number;
}

/**
 * Standard Severity Rules
 */
export const STANDARD_SEVERITY_RULES: SeverityRule[] = [
  // ========================================================================
  // CRITICAL: System nicht nutzbar
  // ========================================================================
  {
    id: 'CRITICAL_BACKEND_UNREACHABLE',
    testIdPatterns: [/INF-001/, /SRV-001/],
    categories: ['INF'],
    errorTypes: ['EXCEPTION', 'TIMEOUT'],
    keywords: ['ECONNREFUSED', 'Host is unreachable'],
    severity: Severity.CRITICAL,
    impact: 'Backend service is completely unavailable. Application cannot start.',
    recommendation: 'Verify backend Docker container is running. Check network configuration. Validate connection string in environment variables.',
    rootCauseCategory: 'SERVICE_UNAVAILABLE',
    priority: 100
  },

  {
    id: 'CRITICAL_DATABASE_UNREACHABLE',
    testIdPatterns: [/INF-003/, /DAT-001/],
    categories: ['INF', 'DAT'],
    errorTypes: ['EXCEPTION'],
    keywords: ['database', 'connection refused', 'connect timeout', 'ECONNREFUSED'],
    severity: Severity.CRITICAL,
    impact: 'Database is unreachable. No data operations possible.',
    recommendation: 'Check PostgreSQL container status. Verify database connection string. Check Docker network configuration. Verify database credentials.',
    rootCauseCategory: 'DATABASE_CONNECTION',
    priority: 100
  },

  {
    id: 'CRITICAL_REDIS_UNREACHABLE',
    testIdPatterns: [/INF-004/, /DAT-003/],
    categories: ['INF', 'DAT'],
    errorTypes: ['EXCEPTION'],
    keywords: ['Redis', 'cache', 'ECONNREFUSED'],
    severity: Severity.CRITICAL,
    impact: 'Cache layer is unavailable. Performance will be severely impacted.',
    recommendation: 'Verify Redis container is running. Check Redis connection parameters. Review Docker network connectivity.',
    rootCauseCategory: 'CACHE_CONNECTION',
    priority: 100
  },

  {
    id: 'CRITICAL_AUTH_FAILURE',
    testIdPatterns: [/SRV-002/],
    keywords: ['401', '403', 'Unauthorized', 'Forbidden', 'authentication'],
    severity: Severity.CRITICAL,
    impact: 'Authentication is broken. Users cannot access the system.',
    recommendation: 'Review authentication configuration. Check API keys and credentials. Validate authorization middleware setup.',
    rootCauseCategory: 'AUTH_CONFIG',
    priority: 95
  },

  {
    id: 'CRITICAL_DATA_CORRUPTION',
    testIdPatterns: [/DAT-002/],
    keywords: ['write failed', 'data integrity', 'constraint violation'],
    severity: Severity.CRITICAL,
    impact: 'Database write operations are failing. Data integrity at risk.',
    recommendation: 'Check database schema and migrations. Verify database connectivity. Review write permissions and foreign keys.',
    rootCauseCategory: 'DATABASE_WRITE_FAILURE',
    priority: 95
  },

  // ========================================================================
  // HIGH: Kernfunktion eingeschränkt
  // ========================================================================
  {
    id: 'HIGH_API_TIMEOUT',
    testIdPatterns: [/API-.*/],
    keywords: ['timeout', 'ETIMEDOUT', 'timed out'],
    errorTypes: ['TIMEOUT'],
    severity: Severity.HIGH,
    impact: 'API requests are timing out. User experience degraded.',
    recommendation: 'Review API endpoint performance. Check for slow database queries. Increase timeout values if appropriate.',
    rootCauseCategory: 'PERFORMANCE',
    priority: 80
  },

  {
    id: 'HIGH_CONFIGURATION_MISSING',
    keywords: ['undefined', 'null', 'not set', 'missing', 'environment variable'],
    testIdPatterns: [/CFG-001/, /CFG-003/],
    severity: Severity.HIGH,
    impact: 'Application configuration is incomplete. Behavior may be undefined.',
    recommendation: 'Ensure all required environment variables are set. Review .env configuration. Validate startup configuration checks.',
    rootCauseCategory: 'CONFIG_ERROR',
    priority: 85
  },

  {
    id: 'HIGH_SCHEMA_VIOLATION',
    keywords: ['schema', 'validation', 'type mismatch', 'invalid format'],
    testIdPatterns: [/DAT-.*/, /API-.*/],
    severity: Severity.HIGH,
    impact: 'Data does not match expected schema. API contracts broken.',
    recommendation: 'Review data validation logic. Check input sanitization. Validate API response schemas.',
    rootCauseCategory: 'DATA_VALIDATION',
    priority: 75
  },

  {
    id: 'HIGH_RESOURCE_EXHAUSTION',
    testIdPatterns: [/INF-.*/],
    keywords: ['out of memory', 'memory', 'pool exhausted', 'too many connections'],
    severity: Severity.HIGH,
    impact: 'System resources are exhausted. Performance severely impacted.',
    recommendation: 'Investigate resource leak. Review connection pool settings. Monitor memory usage. Increase resource limits if needed.',
    rootCauseCategory: 'RESOURCE_MANAGEMENT',
    priority: 80
  },

  // ========================================================================
  // MEDIUM: Teilfunktion betroffen
  // ========================================================================
  {
    id: 'MEDIUM_PERFORMANCE_ISSUE',
    keywords: ['slow', 'duration', '>1000ms'],
    testIdPatterns: [/API-.*/, /UI-.*/],
    severity: Severity.MEDIUM,
    impact: 'Some operations are slow. User experience is impacted.',
    recommendation: 'Profile performance. Optimize slow queries. Review caching strategy.',
    rootCauseCategory: 'PERFORMANCE',
    priority: 50
  },

  {
    id: 'MEDIUM_MISSING_FEATURE',
    keywords: ['not implemented', 'TODO', 'stub', 'placeholder'],
    testIdPatterns: [/UI-.*/, /OPS-.*/],
    severity: Severity.MEDIUM,
    impact: 'Feature is not fully implemented. User workflow may be disrupted.',
    recommendation: 'Prioritize feature implementation. Review sprint backlog.',
    rootCauseCategory: 'NOT_IMPLEMENTED',
    priority: 40
  },

  {
    id: 'MEDIUM_DOCUMENTATION_MISSING',
    testIdPatterns: [/OPS-010/, /OPS-011/],
    keywords: ['documentation', 'README', 'manual'],
    severity: Severity.MEDIUM,
    impact: 'Documentation is incomplete. Users may struggle to understand features.',
    recommendation: 'Update documentation. Add missing sections. Review clarity.',
    rootCauseCategory: 'DOCUMENTATION',
    priority: 30
  },

  // ========================================================================
  // LOW: Kosmetisch oder Komfortfunktion
  // ========================================================================
  {
    id: 'LOW_UI_ISSUE',
    testIdPatterns: [/UI-010/, /UI-011/],
    keywords: ['responsive', 'accessibility', 'style'],
    severity: Severity.LOW,
    impact: 'UI has minor issues. Functionality is not affected.',
    recommendation: 'Fix UI presentation. Test on target devices.',
    rootCauseCategory: 'UI_PRESENTATION',
    priority: 10
  },

  {
    id: 'LOW_LOGGING_MISSING',
    testIdPatterns: [/OPS-.*/, /GOV-.*/],
    keywords: ['log', 'audit', 'trace'],
    severity: Severity.LOW,
    impact: 'Logging is incomplete. Troubleshooting may be harder.',
    recommendation: 'Add logging statements. Improve audit trail.',
    rootCauseCategory: 'LOGGING',
    priority: 10
  },

  // ========================================================================
  // INFO: Reine Information
  // ========================================================================
  {
    id: 'INFO_DEPRECATED_API',
    testIdPatterns: [],
    keywords: ['deprecated', 'outdated', 'legacy'],
    severity: Severity.INFO,
    impact: 'Using deprecated APIs or patterns.',
    recommendation: 'Plan migration to modern alternatives.',
    rootCauseCategory: 'TECHNICAL_DEBT',
    priority: 5
  }
];

/**
 * Severity Engine
 */
export class SeverityEngine {
  private rules: Map<string, SeverityRule>;

  constructor(customRules?: SeverityRule[]) {
    this.rules = new Map();

    // Lade Standard Rules
    STANDARD_SEVERITY_RULES.forEach(rule => {
      this.rules.set(rule.id, rule);
    });

    // Merge Custom Rules
    if (customRules) {
      customRules.forEach(rule => {
        this.rules.set(rule.id, rule);
      });
    }
  }

  /**
   * Findet alle Rules die für einen Fehler gelten
   */
  private findMatchingRules(error: {
    testId: string;
    category: string;
    errorType: string;
    message: string;
  }): SeverityRule[] {
    return Array.from(this.rules.values())
      .filter(rule => {
        // Test ID match
        if (
          rule.testIdPatterns &&
          rule.testIdPatterns.length > 0 &&
          !rule.testIdPatterns.some(p => p.test(error.testId))
        ) {
          return false;
        }

        // Category match
        if (rule.categories && !rule.categories.includes(error.category)) {
          return false;
        }

        // Error type match
        if (
          rule.errorTypes &&
          rule.errorTypes.length > 0 &&
          !rule.errorTypes.includes(error.errorType)
        ) {
          return false;
        }

        // Keyword match
        if (rule.keywords && rule.keywords.length > 0) {
          const hasKeyword = rule.keywords.some(
            kw => error.message.toLowerCase().includes(kw.toLowerCase())
          );
          if (!hasKeyword) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => b.priority - a.priority);
  }

  /**
   * Bewertet einen Fehler
   */
  evaluateError(error: {
    testId: string;
    category: string;
    errorType: string;
    message: string;
  }): {
    severity: Severity;
    impact: string;
    recommendation: string;
    rootCauseCategory: string;
    matchedRule: SeverityRule | null;
  } {
    const matchedRules = this.findMatchingRules(error);
    const matchedRule = matchedRules[0] || null;

    if (matchedRule) {
      return {
        severity: matchedRule.severity,
        impact: matchedRule.impact,
        recommendation: matchedRule.recommendation,
        rootCauseCategory: matchedRule.rootCauseCategory,
        matchedRule
      };
    }

    // Fallback: Schätze aufgrund des Fehlertyps
    return this.guessFromErrorType(error.errorType);
  }

  /**
   * Fallback: Rate Error Type
   */
  private guessFromErrorType(
    errorType: string
  ): {
    severity: Severity;
    impact: string;
    recommendation: string;
    rootCauseCategory: string;
    matchedRule: null;
  } {
    switch (errorType) {
      case 'EXCEPTION':
        return {
          severity: Severity.HIGH,
          impact: 'An unexpected exception occurred.',
          recommendation: 'Review error logs. Check stack trace.',
          rootCauseCategory: 'UNEXPECTED_ERROR',
          matchedRule: null
        };
      case 'TIMEOUT':
        return {
          severity: Severity.MEDIUM,
          impact: 'Operation timed out.',
          recommendation: 'Check service performance. Increase timeout if appropriate.',
          rootCauseCategory: 'TIMEOUT',
          matchedRule: null
        };
      case 'ASSERTION_FAILURE':
        return {
          severity: Severity.MEDIUM,
          impact: 'Test assertion failed.',
          recommendation: 'Review test expectations and actual behavior.',
          rootCauseCategory: 'TEST_FAILURE',
          matchedRule: null
        };
      default:
        return {
          severity: Severity.LOW,
          impact: 'Unknown error occurred.',
          recommendation: 'Investigate error details.',
          rootCauseCategory: 'UNKNOWN',
          matchedRule: null
        };
    }
  }

  /**
   * Kategorisiert mehrere Fehler
   */
  categorizeErrors(
    errors: Array<{
      testId: string;
      category: string;
      errorType: string;
      message: string;
    }>
  ): {
    bySeverity: { [key in Severity]: any[] };
    byRootCause: { [key: string]: any[] };
    summary: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      info: number;
    };
  } {
    const evaluated = errors.map(err => ({
      error: err,
      evaluation: this.evaluateError(err)
    }));

    const bySeverity: { [key in Severity]: any[] } = {
      [Severity.CRITICAL]: [],
      [Severity.HIGH]: [],
      [Severity.MEDIUM]: [],
      [Severity.LOW]: [],
      [Severity.INFO]: []
    };

    const byRootCause: { [key: string]: any[] } = {};

    evaluated.forEach(item => {
      bySeverity[item.evaluation.severity].push(item);

      if (!byRootCause[item.evaluation.rootCauseCategory]) {
        byRootCause[item.evaluation.rootCauseCategory] = [];
      }
      byRootCause[item.evaluation.rootCauseCategory].push(item);
    });

    return {
      bySeverity,
      byRootCause,
      summary: {
        critical: bySeverity[Severity.CRITICAL].length,
        high: bySeverity[Severity.HIGH].length,
        medium: bySeverity[Severity.MEDIUM].length,
        low: bySeverity[Severity.LOW].length,
        info: bySeverity[Severity.INFO].length
      }
    };
  }

  /**
   * Bestimmt ob ein Fehler blockierend ist
   */
  isBlocking(severity: Severity): boolean {
    return (
      severity === Severity.CRITICAL ||
      (severity === Severity.HIGH && SEVERITY_ORDER[severity] <= SEVERITY_ORDER[Severity.HIGH])
    );
  }

  /**
   * Gibt den nächsten Schritt nach Fehlerkategorisierung
   */
  getNextSteps(summary: { critical: number; high: number; medium: number }): string[] {
    const steps: string[] = [];

    if (summary.critical > 0) {
      steps.push('🔴 CRITICAL: Fix blocking issues immediately before deployment');
    }

    if (summary.high > 0) {
      steps.push('🟠 HIGH: Address quality issues. Deployment may be blocked.');
    }

    if (summary.medium > 0) {
      steps.push('🟡 MEDIUM: Plan fixes. Monitor in production.');
    }

    if (summary.critical === 0 && summary.high === 0) {
      steps.push('✅ No critical or high severity issues. System is stable.');
    }

    return steps;
  }

  /**
   * Debug: Gibt Rule-Übersicht aus
   */
  printRulesSummary(): void {
    console.log('\n════════════════════════════════════════════════════');
    console.log('         SEVERITY ENGINE RULES');
    console.log('════════════════════════════════════════════════════\n');

    const bySeverity: { [key: string]: SeverityRule[] } = {};

    Array.from(this.rules.values()).forEach(rule => {
      if (!bySeverity[rule.severity]) {
        bySeverity[rule.severity] = [];
      }
      bySeverity[rule.severity].push(rule);
    });

    Object.entries(bySeverity)
      .sort(([a], [b]) => SEVERITY_ORDER[a as Severity] - SEVERITY_ORDER[b as Severity])
      .forEach(([severity, rules]) => {
        console.log(`\n${severity}:`);
        rules.forEach(rule => {
          console.log(`  • ${rule.id}`);
          console.log(`    ${rule.impact}`);
        });
      });

    console.log('\n════════════════════════════════════════════════════\n');
  }
}

/**
 * Singleton Instance
 */
export const severityEngine = new SeverityEngine();
