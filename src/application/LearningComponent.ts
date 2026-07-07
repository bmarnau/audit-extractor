/**
 * LearningComponent
 * WICHTIG: Darf NIEMALS neue Fakten generieren
 * Darf NIEMALS Werte halluzinieren
 */
export interface LearningEntry {
  pattern: string;
  frequency: number;
  successRate: number;
  lastObserved: Date;
  sourceDocuments: string[];
}

export class LearningComponent {
  private patterns: Map<string, LearningEntry> = new Map();

  /**
   * Lernt: Welche Extraktions-Muster funktionieren gut?
   * NICHT: Neue Daten hinzufügen
   */
  recordSuccessfulExtraction(
    pattern: string,
    documentId: string,
    confidence: number
  ): void {
    const existing = this.patterns.get(pattern) || {
      pattern,
      frequency: 0,
      successRate: 0,
      lastObserved: new Date(),
      sourceDocuments: []
    };

    existing.frequency++;
    existing.successRate =
      (existing.successRate * (existing.frequency - 1) + confidence) /
      existing.frequency;
    existing.lastObserved = new Date();

    if (!existing.sourceDocuments.includes(documentId)) {
      existing.sourceDocuments.push(documentId);
    }

    this.patterns.set(pattern, existing);
  }

  /**
   * Lernt: Welche Regeln funktionieren nicht gut?
   * NICHT: Regeln ändern oder Werte erfinden
   */
  recordFailedExtraction(pattern: string, _reason: string): void {
    const existing = this.patterns.get(pattern);
    if (existing) {
      // Statistik nur: Frequenz erhöhen, SuccessRate sinkt
      existing.frequency++;
      existing.lastObserved = new Date();
      this.patterns.set(pattern, existing);
    }
  }

  /**
   * Empfehlung: Welche Regeln sollten überprüft werden?
   * NICHT: Automatisch ändern
   */
  getOptimizationSuggestions(
    minimumFrequency: number = 5,
    maximumSuccessRate: number = 0.7
  ): string[] {
    const suggestions: string[] = [];

    for (const [pattern, entry] of this.patterns.entries()) {
      if (
        entry.frequency >= minimumFrequency &&
        entry.successRate < maximumSuccessRate
      ) {
        suggestions.push(
          `Pattern '${pattern}' has low success rate (${entry.successRate.toFixed(2)}) after ${entry.frequency} attempts - review rule`
        );
      }
    }

    return suggestions;
  }

  /**
   * Statistiken: Wie gut funktioniert das System?
   */
  getStatistics() {
    const totalPatterns = this.patterns.size;
    const totalAttempts = Array.from(this.patterns.values()).reduce(
      (sum, e) => sum + e.frequency,
      0
    );
    const avgSuccessRate =
      totalPatterns > 0
        ? Array.from(this.patterns.values()).reduce((sum, e) => sum + e.successRate, 0) /
          totalPatterns
        : 0;

    return {
      totalPatterns,
      totalAttempts,
      avgSuccessRate: avgSuccessRate.toFixed(2),
      patterns: Array.from(this.patterns.values())
    };
  }

  /**
   * Warnung: Dieses Modell DARF NICHT verwendet werden, um Dokumente zu vervollständigen
   */
  validateNoDataGeneration(): void {
    // Diese Methode existiert als Dokumentation
    // Das Lernsystem speichert nur Muster und Häufigkeiten
    // Es speichert KEINE erfundenen oder komplementierten Werte
  }
}
