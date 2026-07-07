import { ExtractionResult, ExtractedValue, DocumentReference } from '@domain/ExtractionModels';
import { ExtractionRule } from '@domain/ExtractionRule';

/**
 * DocumentRuleAssociationService
 * Findet die richtige Regel-Konfiguration für ein Dokument
 */
export class DocumentRuleAssociationService {
  associate(
    documentReference: DocumentReference,
    availableRuleSets: Map<string, ExtractionRule[]>
  ): ExtractionRule[] {
    // Strategie 1: Nach Dokumenttyp
    const typeBasedRules = availableRuleSets.get(documentReference.documentType);
    if (typeBasedRules) {
      return typeBasedRules;
    }

    // Strategie 2: Nach Dateinamen-Pattern
    for (const [key, rules] of availableRuleSets.entries()) {
      if (this.matchesPattern(documentReference.fileName, key)) {
        return rules;
      }
    }

    // Fallback: Leere Regelset
    return [];
  }

  private matchesPattern(fileName: string, pattern: string): boolean {
    const regex = new RegExp(pattern, 'i');
    return regex.test(fileName);
  }
}

/**
 * ExtractionResultBuilder
 * SOLID: Single Responsibility - baut Ergebnisse zusammen
 */
export class ExtractionResultBuilder {
  private resultId: string = '';
  private documentReference: DocumentReference | null = null;
  private extractedFields: Map<string, ExtractedValue<any>> = new Map();
  private missingFields: string[] = [];
  private warnings: any[] = [];
  private version: string = '1.0.0';
  private ruleSetVersion: string = '1.0.0';

  withResultId(id: string): this {
    this.resultId = id;
    return this;
  }

  withDocument(doc: DocumentReference): this {
    this.documentReference = doc;
    return this;
  }

  addExtractedField<T>(
    fieldName: string,
    value: ExtractedValue<T>
  ): this {
    this.extractedFields.set(fieldName, value);
    return this;
  }

  addMissingField(fieldName: string): this {
    if (!this.missingFields.includes(fieldName)) {
      this.missingFields.push(fieldName);
    }
    return this;
  }

  addWarning(warning: any): this {
    this.warnings.push(warning);
    return this;
  }

  setVersion(version: string): this {
    this.version = version;
    return this;
  }

  setRuleSetVersion(version: string): this {
    this.ruleSetVersion = version;
    return this;
  }

  build(): ExtractionResult {
    if (!this.documentReference) {
      throw new Error('DocumentReference is required');
    }
    if (!this.resultId) {
      throw new Error('ResultId is required');
    }

    return {
      resultId: this.resultId,
      documentReference: this.documentReference,
      extractedFields: this.extractedFields,
      missingFields: this.missingFields,
      warnings: this.warnings,
      extractedAt: new Date(),
      version: this.version,
      ruleSetVersion: this.ruleSetVersion
    };
  }
}
