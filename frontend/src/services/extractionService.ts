/**
 * Mock Extraction Service
 * 
 * Simuliert den gesamten Extraktionsfluss mit allen Zwischenschritten.
 */

export interface ExtractionStep {
  stepNumber: number;
  stepName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  input: Record<string, unknown>;
  output: Record<string, unknown>;
  duration: number; // milliseconds
  timestamp: Date;
  error?: string;
}

export interface ExtractionWorkflow {
  id: string;
  documentId: string;
  documentName: string;
  startedAt: Date;
  completedAt?: Date;
  steps: ExtractionStep[];
  overallStatus: 'pending' | 'processing' | 'completed' | 'failed';
}

class ExtractionService {
  /**
   * Simuliert kompletten Extraktionsfluss.
   */
  async extractDocument(
    documentId: string,
    documentName: string,
    onStepComplete?: (step: ExtractionStep) => void
  ): Promise<ExtractionWorkflow> {
    const workflow: ExtractionWorkflow = {
      id: `extraction-${Date.now()}`,
      documentId,
      documentName,
      startedAt: new Date(),
      steps: [],
      overallStatus: 'processing',
    };

    try {
      // Step 1: Source Document
      await this.delay(500);
      workflow.steps.push(
        this.createStep(
          1,
          'Source Document',
          {
            documentId,
            fileName: documentName,
            fileSize: 245600,
            format: 'pdf',
          },
          {
            success: true,
            documentLoaded: true,
            pages: 2,
          }
        )
      );
      onStepComplete?.(workflow.steps[0]);

      // Step 2: Parser Result
      await this.delay(800);
      workflow.steps.push(
        this.createStep(
          2,
          'Parser Result',
          { documentFormat: 'pdf' },
          {
            extractedText: 'Rechnung Nr. INV-2024-001\nDatum: 15.01.2024\nKunde: Acme Corp\nBetrag: 1.250,00 EUR',
            textLength: 87,
            imagesFound: 2,
            tablesFound: 1,
          }
        )
      );
      onStepComplete?.(workflow.steps[1]);

      // Step 3: Chunks
      await this.delay(600);
      workflow.steps.push(
        this.createStep(
          3,
          'Chunking',
          {
            chunkingStrategy: 'semantic',
            maxChunkSize: 300,
          },
          {
            chunks: [
              'Rechnung Nr. INV-2024-001',
              'Datum: 15.01.2024',
              'Kunde: Acme Corp',
              'Betrag: 1.250,00 EUR',
            ],
            chunkCount: 4,
            avgChunkSize: 68,
          }
        )
      );
      onStepComplete?.(workflow.steps[2]);

      // Step 4: Rules
      await this.delay(400);
      workflow.steps.push(
        this.createStep(
          4,
          'Rule Application',
          { documentType: 'invoice' },
          {
            appliedRules: [
              { id: 'rule-001', name: 'Extract Invoice Number', regex: '/INV-\\d+/' },
              { id: 'rule-002', name: 'Extract Date', pattern: 'date' },
              { id: 'rule-003', name: 'Extract Customer', pattern: 'name' },
              { id: 'rule-004', name: 'Extract Amount', regex: '/\\d+,\\d{2}/' },
            ],
            ruleCount: 4,
          }
        )
      );
      onStepComplete?.(workflow.steps[3]);

      // Step 5: Prompt
      await this.delay(300);
      const prompt = `Sie sind ein Dokumentenextraktions-Assistent. Extrahieren Sie die folgenden Informationen aus diesem Dokument:

Dokument-Typ: Rechnung
Regeln:
- invoiceNumber: Eindeutige Rechnungsnummer
- invoiceDate: Rechnungsdatum
- customerName: Name des Kunden
- totalAmount: Gesamtbetrag

Dok
ument-Text:
${workflow.steps[1].output.extractedText}

Antwort als JSON:
{
  "invoiceNumber": "...",
  "invoiceDate": "...",
  "customerName": "...",
  "totalAmount": "..."
}`;

      workflow.steps.push(
        this.createStep(
          5,
          'LLM Prompt',
          { model: 'gpt-4', temperature: 0.3 },
          {
            prompt,
            promptLength: prompt.length,
            tokenEstimate: Math.ceil(prompt.length / 4),
          }
        )
      );
      onStepComplete?.(workflow.steps[4]);

      // Step 6: LLM Response
      await this.delay(1200);
      const llmResponse = {
        invoiceNumber: 'INV-2024-001',
        invoiceDate: '15.01.2024',
        customerName: 'Acme Corp',
        totalAmount: '1.250,00 EUR',
      };

      workflow.steps.push(
        this.createStep(
          6,
          'LLM Response',
          { model: 'gpt-4' },
          {
            response: llmResponse,
            responseLength: JSON.stringify(llmResponse).length,
            tokensUsed: 145,
          }
        )
      );
      onStepComplete?.(workflow.steps[5]);

      // Step 7: Validation
      await this.delay(400);
      workflow.steps.push(
        this.createStep(
          7,
          'Schema Validation',
          { schema: 'invoice-v1.0.0' },
          {
            isValid: true,
            validatedFields: 4,
            errors: [],
            warnings: [],
            missingFields: [],
          }
        )
      );
      onStepComplete?.(workflow.steps[6]);

      // Step 8: JSON Result
      await this.delay(200);
      const jsonResult = {
        extractedFields: {
          invoiceNumber: {
            value: 'INV-2024-001',
            confidence: 0.98,
            sources: ['Page 1, Section Header'],
          },
          invoiceDate: {
            value: '15.01.2024',
            confidence: 0.95,
            sources: ['Page 1, Line 2'],
          },
          customerName: {
            value: 'Acme Corp',
            confidence: 0.92,
            sources: ['Page 1, Addressee'],
          },
          totalAmount: {
            value: '1.250,00 EUR',
            confidence: 0.96,
            sources: ['Page 1, Total Line'],
          },
        },
        missingFields: [],
        warnings: [],
      };

      workflow.steps.push(
        this.createStep(
          8,
          'JSON Result',
          {},
          {
            result: jsonResult,
            fieldCount: 4,
            avgConfidence: 0.95,
          }
        )
      );
      onStepComplete?.(workflow.steps[7]);

      // Step 9: Reflection
      await this.delay(600);
      workflow.steps.push(
        this.createStep(
          9,
          'Quality Reflection',
          { reflectionModel: 'rule-based' },
          {
            completeness: 1.0,
            consistency: 0.98,
            traceability: 0.99,
            issues: [],
            suggestions: [
              'All required fields successfully extracted',
              'High confidence scores across all fields',
              'Complete source references provided',
            ],
          }
        )
      );
      onStepComplete?.(workflow.steps[8]);

      // Step 10: Quality Report
      await this.delay(400);
      workflow.steps.push(
        this.createStep(
          10,
          'Quality Report',
          {},
          {
            overallQuality: 0.96,
            auditTrail: {
              documentId,
              startTime: workflow.startedAt,
              endTime: new Date(),
              totalDuration: Date.now() - workflow.startedAt.getTime(),
            },
            confidenceDistribution: {
              high: 4,
              medium: 0,
              low: 0,
            },
            hallucinations: 0,
            validationErrors: 0,
          }
        )
      );
      onStepComplete?.(workflow.steps[9]);

      workflow.overallStatus = 'completed';
      workflow.completedAt = new Date();
    } catch (error) {
      workflow.overallStatus = 'failed';
    }

    return workflow;
  }

  /**
   * Erstellt einen Extraktionsschritt.
   */
  private createStep(
    stepNumber: number,
    stepName: string,
    input: Record<string, unknown>,
    output: Record<string, unknown>
  ): ExtractionStep {
    return {
      stepNumber,
      stepName,
      status: 'completed',
      input,
      output,
      duration: Math.floor(Math.random() * 500) + 100,
      timestamp: new Date(),
    };
  }

  /**
   * Verzögerung simulieren.
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const extractionService = new ExtractionService();
