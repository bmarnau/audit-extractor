/**
 * DocumentClassifier Implementation
 *
 * Pattern-basierte Klassifikation mit Feature-Scoring.
 * Keine ML-Modelle - nur explizite Regeln.
 *
 * Kritisch: Confidence NEVER reaches 100%!
 */

import { Document } from '@core/models';
import {
  IDocumentClassifier,
  ClassificationResult,
  DocumentTypeEnum,
  ClassificationError,
} from './DocumentClassifier';

/**
 * Feature-basierte Klassifikation.
 */
export class FeatureBasedClassifier implements IDocumentClassifier {
  getSupportedTypes(): DocumentTypeEnum[] {
    return Object.values(DocumentTypeEnum);
  }

  async classify(document: Document): Promise<ClassificationResult> {
    try {
      // Kombiniere alle Chunks zu Text
      const fullText = (document.chunks ?? [])
        .map((c) => c.text)
        .join('\n')
        .toLowerCase();

      const scores = {
        [DocumentTypeEnum.INVOICE]: this.scoreInvoice(fullText),
        [DocumentTypeEnum.CONTRACT]: this.scoreContract(fullText),
        [DocumentTypeEnum.RESUME]: this.scoreResume(fullText),
        [DocumentTypeEnum.EMAIL]: this.scoreEmail(fullText),
        [DocumentTypeEnum.REPORT]: this.scoreReport(fullText),
      };

      // Finde beste Klassifikation
      const bestMatch = Object.entries(scores).reduce((best, current) =>
        current[1].score > best[1].score ? current : best
      );

      const documentType = bestMatch[0] as DocumentTypeEnum;
      let confidence = bestMatch[1].score;

      // Clampe auf 0.99 max (NEVER 100%!)
      confidence = Math.min(confidence, 0.99);

      // Wenn sehr niedrig, markiere als UNKNOWN
      if (confidence < 0.25) {
        return this.createUnknownResult(fullText, confidence);
      }

      // Sortiere Alternativen
      const alternativeTypes = Object.entries(scores)
        .filter(([type]) => type !== documentType)
        .map(([type, result]) => ({
          type: type as DocumentTypeEnum,
          confidence: Math.min(result.score, 0.99),
        }))
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 2);

      return {
        documentType,
        confidence,
        alternativeTypes: alternativeTypes.length > 0 ? alternativeTypes : undefined,
        reasoning: this.generateReasoning(documentType, bestMatch[1]),
        uncertainty: this.generateUncertainty(confidence, scores),
        indicators: bestMatch[1].indicators,
        classifiedAt: new Date(),
      };
    } catch (error) {
      throw new ClassificationError(
        `Classification failed: ${error instanceof Error ? error.message : String(error)}`,
        document.id
      );
    }
  }

  /**
   * Scoring für Invoice.
   * @private
   */
  private scoreInvoice(
    text: string
  ): { score: number; indicators: { matched: string[]; missing: string[] } } {
    const matched: string[] = [];
    const missing: string[] = [];
    let score = 0;

    // Positive Indikatoren
    const invoiceKeywords = ['invoice', 'rechnung', 'factuur', 'factura'];
    const hasInvoiceKeyword = invoiceKeywords.some((kw) => text.includes(kw));
    if (hasInvoiceKeyword) {
      score += 0.25;
      matched.push("contains 'invoice' or similar keyword");
    }

    if (text.includes('invoice number') || text.includes('invoice #')) {
      score += 0.20;
      matched.push('contains invoice number');
    }

    if (text.includes('amount') || text.includes('total')) {
      score += 0.15;
      matched.push('contains amount/total field');
    }

    if (text.includes('date') && text.includes('due')) {
      score += 0.15;
      matched.push('contains date and due date');
    }

    if (text.includes('line item') || text.includes('description')) {
      score += 0.10;
      matched.push('contains line items');
    }

    // Negative Indikatoren
    if (!text.includes('total') && !text.includes('amount')) {
      missing.push('no total amount found');
    }

    if (!text.includes('date')) {
      missing.push('no date found');
    }

    // Clampe auf 0-1
    score = Math.min(score, 1);

    return { score, indicators: { matched, missing } };
  }

  /**
   * Scoring für Contract.
   * @private
   */
  private scoreContract(
    text: string
  ): { score: number; indicators: { matched: string[]; missing: string[] } } {
    const matched: string[] = [];
    const missing: string[] = [];
    let score = 0;

    const contractKeywords = ['contract', 'agreement', 'terms', 'vertrag'];
    if (contractKeywords.some((kw) => text.includes(kw))) {
      score += 0.25;
      matched.push("contains 'contract' or 'agreement'");
    }

    if (text.includes('party') || text.includes('parties')) {
      score += 0.20;
      matched.push('contains party/parties');
    }

    if (text.includes('term') || text.includes('duration')) {
      score += 0.15;
      matched.push('contains term/duration');
    }

    if (text.includes('liability') || text.includes('indemnif')) {
      score += 0.15;
      matched.push('contains legal terms');
    }

    if (text.includes('signature') || text.includes('signed')) {
      score += 0.15;
      matched.push('contains signature field');
    }

    if (!text.includes('party')) {
      missing.push('no parties identified');
    }

    score = Math.min(score, 1);
    return { score, indicators: { matched, missing } };
  }

  /**
   * Scoring für Resume.
   * @private
   */
  private scoreResume(
    text: string
  ): { score: number; indicators: { matched: string[]; missing: string[] } } {
    const matched: string[] = [];
    const missing: string[] = [];
    let score = 0;

    if (text.includes('resume') || text.includes('cv') || text.includes('curriculum')) {
      score += 0.25;
      matched.push("contains 'resume' or 'CV'");
    }

    if (text.includes('experience') || text.includes('employment')) {
      score += 0.20;
      matched.push('contains experience/employment section');
    }

    if (text.includes('education') || text.includes('degree')) {
      score += 0.20;
      matched.push('contains education section');
    }

    if (text.includes('skills') || text.includes('competencies')) {
      score += 0.15;
      matched.push('contains skills section');
    }

    if (text.includes('objective') || text.includes('summary')) {
      score += 0.10;
      matched.push('contains objective/summary');
    }

    if (!text.includes('experience')) {
      missing.push('no experience section');
    }

    score = Math.min(score, 1);
    return { score, indicators: { matched, missing } };
  }

  /**
   * Scoring für Email.
   * @private
   */
  private scoreEmail(
    text: string
  ): { score: number; indicators: { matched: string[]; missing: string[] } } {
    const matched: string[] = [];
    const missing: string[] = [];
    let score = 0;

    if (text.includes('from:') || text.includes('to:') || text.includes('cc:')) {
      score += 0.25;
      matched.push('contains email headers');
    }

    if (text.includes('subject:')) {
      score += 0.20;
      matched.push('contains subject line');
    }

    if (text.match(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/)) {
      score += 0.20;
      matched.push('contains email address');
    }

    if (text.includes('dear') || text.includes('regards') || text.includes('sincerely')) {
      score += 0.15;
      matched.push('contains email salutation/closing');
    }

    if (!text.includes('subject')) {
      missing.push('no subject line');
    }

    score = Math.min(score, 1);
    return { score, indicators: { matched, missing } };
  }

  /**
   * Scoring für Report.
   * @private
   */
  private scoreReport(
    text: string
  ): { score: number; indicators: { matched: string[]; missing: string[] } } {
    const matched: string[] = [];
    const missing: string[] = [];
    let score = 0;

    const reportKeywords = ['report', 'analysis', 'assessment', 'summary'];
    if (reportKeywords.some((kw) => text.includes(kw))) {
      score += 0.25;
      matched.push("contains 'report' or similar");
    }

    if (text.includes('table of contents') || text.includes('executive')) {
      score += 0.20;
      matched.push('contains report structure');
    }

    if (text.includes('conclusion') || text.includes('findings')) {
      score += 0.20;
      matched.push('contains conclusion/findings');
    }

    if (text.includes('recommendation')) {
      score += 0.15;
      matched.push('contains recommendations');
    }

    if (text.includes('prepared by') || text.includes('report date')) {
      score += 0.10;
      matched.push('contains report metadata');
    }

    if (!text.includes('conclusion')) {
      missing.push('no conclusion section');
    }

    score = Math.min(score, 1);
    return { score, indicators: { matched, missing } };
  }

  /**
   * Erstellt UNKNOWN-Resultat.
   * @private
   */
  private createUnknownResult(_text: string, maxScore: number): ClassificationResult {
    return {
      documentType: DocumentTypeEnum.UNKNOWN,
      confidence: Math.max(maxScore, 0.1), // Min 10% confidence für UNKNOWN
      reasoning: 'Document did not match any known document type patterns clearly enough',
      uncertainty:
        'Classification inconclusive - document may be a mix of types or an unrecognized format',
      indicators: {
        matched: [],
        missing: ['Could not identify clear document type indicators'],
      },
      classifiedAt: new Date(),
    };
  }

  /**
   * Generiert Reasoning-Text.
   * @private
   */
  private generateReasoning(type: DocumentTypeEnum, scoreResult: any): string {
    const indicators = scoreResult.indicators.matched.join(', ');
    return `Classified as ${type} based on detected indicators: ${indicators}`;
  }

  /**
   * Generiert Uncertainty-Text.
   * @private
   */
  private generateUncertainty(
    confidence: number,
    _scores: Record<string, { score: number }>
  ): string | null {
    if (confidence > 0.80) {
      return null; // Keine Unsicherheit bei hohem Confidence
    }

    if (confidence > 0.60) {
      return 'Moderate confidence - alternative types are possible';
    }

    if (confidence > 0.40) {
      return 'Low confidence - document may belong to multiple categories';
    }

    return 'Very low confidence - document is ambiguous or of unknown type';
  }
}

// Re-export für externe Nutzung
export { DocumentTypeEnum };
