/**
 * PatternInferrer - Inferriert Regex-Patterns aus Beispiel-Werten
 *
 * Algorithmus:
 * 1. Analyse: Erkenne Struktur in den Beispielen
 * 2. Generalisierung: Konvertiere zu Regex-Pattern
 * 3. Validierung: Teste gegen alle Beispiele
 * 4. Sicherheit: Prüfe auf ReDoS-Anfälligkeit
 * 5. Scoring: Berechne Confidence
 */

import {
  InferredPattern,
  AlternativePatterns,
  InferenceRequest,
  InferenceResult,
  validateInferenceRequest
} from '@domain/generation/PatternInference';

/**
 * PatternInferrer - Inferriert Patterns aus Beispielen
 */
export class PatternInferrer {
  /** Timeout für Regex-Matching (ms) */
  private readonly matchTimeoutMs = 100;

  constructor() {}

  /**
   * Hauptmethode: Inferriere Patterns aus Beispielen
   */
  async infer(request: InferenceRequest): Promise<InferenceResult> {
    const startTime = Date.now();

    // Validierung
    const validation = validateInferenceRequest(request);
    if (!validation.valid) {
      return {
        request,
        patterns: null as any,
        stats: {
          durationMs: 0,
          patternsAnalyzed: 0,
          variantsFound: 0,
          averageConfidence: 0,
          minConfidence: 0,
          maxConfidence: 0,
          issues: validation.errors,
          redosCheckPerformed: false,
          performanceTestPerformed: false
        },
        success: false,
        error: `Validation failed: ${validation.errors.join(', ')}`,
        inferredAt: new Date()
      };
    }

    try {
      // 1. Basis-Pattern generieren
      const basicPattern = this.generateBasicPattern(request.examples);

      // 2. Alternativen generieren
      const alternatives = this.generateAlternatives(request.examples);

      // 3. Alle Patterns bewerten
      const patterns = this.evaluatePatterns(
        basicPattern,
        alternatives,
        request.examples
      );

      // 4. ReDoS-Check durchführen
      const redosCheck = this.checkReDoS(patterns.primary.pattern);

      // 5. Performance-Test durchführen
      const performanceTest = this.testPerformance(
        patterns.primary.pattern,
        request.sourceTexts || []
      );

      const durationMs = Date.now() - startTime;

      return {
        request,
        patterns,
        stats: {
          durationMs,
          patternsAnalyzed: alternatives.length + 1,
          variantsFound: alternatives.length,
          averageConfidence: this.calculateAverageConfidence(patterns),
          minConfidence: this.calculateMinConfidence(patterns),
          maxConfidence: this.calculateMaxConfidence(patterns),
          issues: [...redosCheck.issues, ...performanceTest.issues],
          redosCheckPerformed: true,
          performanceTestPerformed: true
        },
        success: true,
        inferredAt: new Date()
      };
    } catch (error) {
      return {
        request,
        patterns: null as any,
        stats: {
          durationMs: Date.now() - startTime,
          patternsAnalyzed: 0,
          variantsFound: 0,
          averageConfidence: 0,
          minConfidence: 0,
          maxConfidence: 0,
          issues: [],
          redosCheckPerformed: false,
          performanceTestPerformed: false
        },
        success: false,
        error: error instanceof Error ? error.message : String(error),
        inferredAt: new Date()
      };
    }
  }

  /**
   * Generiere Basis-Pattern aus Beispielen
   */
  private generateBasicPattern(examples: string[]): string {
    if (examples.length === 0) {
      return '.*';
    }

    // 1. Analysiere erstes Beispiel
    const firstExample = examples[0];

    // 2. Erkenne Struktur (Prefix, Zahl, Suffix, etc.)
    const structure = this.analyzeStructure(firstExample);

    // 3. Generalisiere zu Regex
    const pattern = this.structureToRegex(structure);

    // 4. Prüfe gegen alle Beispiele
    const testResult = this.testPatternAgainstExamples(pattern, examples);

    // Falls nicht alle Beispiele passen: Versuche es generischer
    if (testResult.matchRate < 0.9) {
      return this.createGenericPattern(examples);
    }

    return pattern;
  }

  /**
   * Analysiere Struktur eines Beispiels
   */
  private analyzeStructure(example: string): {
    prefix?: string;
    numbers?: { start: number; end: number; count: number };
    suffix?: string;
    structure: string;
  } {
    // Erkenne verschiedene Muster

    // Pattern 1: "INV-2024-001" (prefix-number-number)
    if (/^[A-Z]+-\d+-\d+/.test(example)) {
      const match = example.match(/^([A-Z]+)(-(\d+))?(-(\d+))?(.*)$/);
      if (match) {
        return {
          prefix: match[1],
          structure: 'prefix-number-number'
        };
      }
    }

    // Pattern 2: "Invoice #2024001" (text + number)
    if (/^[A-Za-z\s]+#\d+/.test(example)) {
      const match = example.match(/^([A-Za-z\s#]+)(\d+)(.*)$/);
      if (match) {
        return {
          prefix: match[1],
          structure: 'text-number'
        };
      }
    }

    // Pattern 3: "2024-07-08" (date format)
    if (/^\d{4}-\d{2}-\d{2}/.test(example)) {
      return {
        structure: 'date-iso'
      };
    }

    // Pattern 4: "08.07.2024" (date format)
    if (/^\d{2}\.\d{2}\.\d{4}/.test(example)) {
      return {
        structure: 'date-de'
      };
    }

    // Fallback: generisches Pattern
    return {
      structure: 'generic'
    };
  }

  /**
   * Konvertiere Struktur zu Regex
   */
  private structureToRegex(structure: {
    prefix?: string;
    structure: string;
  }): string {
    switch (structure.structure) {
      case 'prefix-number-number':
        return `${structure.prefix}(-\\d{4})?(-\\d{3})?`;

      case 'text-number':
        return `${structure.prefix}\\d+`;

      case 'date-iso':
        return '\\d{4}-\\d{2}-\\d{2}';

      case 'date-de':
        return '\\d{2}\\.\\d{2}\\.\\d{4}';

      case 'generic':
      default:
        return '[A-Za-z0-9\\-_]+';
    }
  }

  /**
   * Teste Pattern gegen Beispiele
   */
  private testPatternAgainstExamples(
    pattern: string,
    examples: string[]
  ): { matchRate: number; matches: number } {
    let matches = 0;

    try {
      const regex = new RegExp(`^${pattern}$`);

      for (const example of examples) {
        if (regex.test(example)) {
          matches++;
        }
      }
    } catch (e) {
      // Ungültiges Regex - zurück zu 0 Matches
      matches = 0;
    }

    return {
      matchRate: examples.length > 0 ? matches / examples.length : 0,
      matches
    };
  }

  /**
   * Erstelle generisches Pattern für schwierige Fälle
   */
  private createGenericPattern(examples: string[]): string {
    // Nutze gemeinsames Prefix/Suffix
    if (examples.length === 0) return '.*';

    // Finde längsten gemeinsamen Prefix
    let commonPrefix = '';
    for (let i = 0; i < examples[0].length; i++) {
      const char = examples[0][i];
      if (examples.every(ex => ex[i] === char)) {
        commonPrefix += char;
      } else {
        break;
      }
    }

    // Finde längsten gemeinsamen Suffix
    let commonSuffix = '';
    for (let i = 1; i <= Math.min(...examples.map(ex => ex.length)); i++) {
      const char = examples[0][examples[0].length - i];
      if (examples.every(ex => ex[ex.length - i] === char)) {
        commonSuffix = char + commonSuffix;
      } else {
        break;
      }
    }

    if (commonPrefix || commonSuffix) {
      return `${this.escapeRegex(commonPrefix)}.*${this.escapeRegex(commonSuffix)}`;
    }

    // Fallback
    return '.+';
  }

  /**
   * Escape Regex-Spezialzeichen
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Generiere Alternativen
   */
  private generateAlternatives(examples: string[]): InferredPattern[] {
    const alternatives: InferredPattern[] = [];

    // Alternative 1: Nur Zahlen
    if (examples.some(ex => /^\d+$/.test(ex))) {
      alternatives.push({
        pattern: '\\d+',
        matchCount: examples.filter(ex => /^\d+$/.test(ex)).length,
        totalExamples: examples.length,
        confidence: examples.filter(ex => /^\d+$/.test(ex)).length / examples.length,
        description: 'Numbers only',
        specificity: 0.3,
        hasReDoSRisk: false
      });
    }

    // Alternative 2: Alphanumerisch
    if (examples.some(ex => /^[A-Za-z0-9]+$/.test(ex))) {
      alternatives.push({
        pattern: '[A-Za-z0-9]+',
        matchCount: examples.filter(ex => /^[A-Za-z0-9]+$/.test(ex)).length,
        totalExamples: examples.length,
        confidence: examples.filter(ex => /^[A-Za-z0-9]+$/.test(ex)).length / examples.length,
        description: 'Alphanumeric',
        specificity: 0.4,
        hasReDoSRisk: false
      });
    }

    return alternatives;
  }

  /**
   * Bewerte alle Patterns
   */
  private evaluatePatterns(
    primaryPattern: string,
    alternatives: InferredPattern[],
    examples: string[]
  ): AlternativePatterns {
    const testResult = this.testPatternAgainstExamples(primaryPattern, examples);

    const primary: InferredPattern = {
      pattern: primaryPattern,
      matchCount: testResult.matches,
      totalExamples: examples.length,
      confidence: testResult.matchRate,
      description: `Generated pattern matching ${testResult.matchRate * 100}% of examples`,
      specificity: 0.7,
      hasReDoSRisk: false
    };

    return {
      primary,
      alternatives,
      recommendation: testResult.matchRate >= 0.8 ? 'primary' : 'alternative',
      reasoning:
        testResult.matchRate >= 0.8
          ? 'Primary pattern has good confidence'
          : 'Primary pattern has low confidence, alternatives might be better',
      requiresManualReview: testResult.matchRate < 0.7,
      reviewReason:
        testResult.matchRate < 0.7
          ? 'Low confidence - user should review'
          : undefined
    };
  }

  /**
   * Prüfe auf ReDoS-Anfälligkeit
   */
  private checkReDoS(pattern: string): { issues: string[] } {
    const issues: string[] = [];

    // Check 1: Nested quantifiers
    if (/(\+|\*){2}/.test(pattern)) {
      issues.push('Pattern has nested quantifiers (potential ReDoS risk)');
    }

    // Check 2: Alternation mit overlap
    if (/\(.*\|.*\)/.test(pattern) && /\*/.test(pattern)) {
      issues.push('Pattern has alternation with quantifier (potential ReDoS risk)');
    }

    // Check 3: Catastrophic backtracking pattern
    if (/(.*)*/.test(pattern) || /(.+)+/.test(pattern)) {
      issues.push('Pattern has catastrophic backtracking risk');
    }

    return { issues };
  }

  /**
   * Teste Performance des Patterns
   */
  private testPerformance(pattern: string, sourceTexts: string[]): {
    issues: string[];
  } {
    const issues: string[] = [];

    try {
      const regex = new RegExp(pattern);
      const testTexts = sourceTexts.slice(0, 10); // Test max 10

      for (const text of testTexts) {
        const start = performance.now();
        regex.test(text);
        const duration = performance.now() - start;

        if (duration > this.matchTimeoutMs) {
          issues.push(
            `Pattern matching took ${duration}ms (timeout: ${this.matchTimeoutMs}ms)`
          );
        }
      }
    } catch (e) {
      issues.push(`Pattern performance test failed: ${e instanceof Error ? e.message : String(e)}`);
    }

    return { issues };
  }

  /**
   * Hilfsmethoden
   */
  private calculateAverageConfidence(patterns: AlternativePatterns): number {
    const allPatterns = [patterns.primary, ...patterns.alternatives];
    return allPatterns.reduce((sum, p) => sum + p.confidence, 0) / allPatterns.length;
  }

  private calculateMinConfidence(patterns: AlternativePatterns): number {
    const allPatterns = [patterns.primary, ...patterns.alternatives];
    return Math.min(...allPatterns.map(p => p.confidence));
  }

  private calculateMaxConfidence(patterns: AlternativePatterns): number {
    const allPatterns = [patterns.primary, ...patterns.alternatives];
    return Math.max(...allPatterns.map(p => p.confidence));
  }
}
