/**
 * Hook: useExtraction
 * 
 * Verwaltet Extraktions-Workflow-Zustand.
 */

import { useState, useCallback } from 'react';
import {
  extractionService,
  ExtractionWorkflow,
  ExtractionStep,
} from '../services/extractionService';

interface UseExtractionResult {
  workflow: ExtractionWorkflow | null;
  loading: boolean;
  error: string | null;
  currentStep: ExtractionStep | null;
  progress: number; // 0-100
  startExtraction: (documentId: string, documentName: string) => Promise<void>;
  reset: () => void;
}

export const useExtraction = (): UseExtractionResult => {
  const [workflow, setWorkflow] = useState<ExtractionWorkflow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentStep = workflow?.steps[workflow.steps.length - 1] || null;
  const progress = workflow ? (workflow.steps.length / 10) * 100 : 0;

  const startExtraction = useCallback(
    async (documentId: string, documentName: string) => {
      try {
        setLoading(true);
        setError(null);

        const result = await extractionService.extractDocument(
          documentId,
          documentName,
          (step) => {
            // Update workflow bei jedem Schritt
            setWorkflow((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                steps: [...prev.steps, step],
              };
            });
          }
        );

        setWorkflow(result);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Extraction failed');
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const reset = useCallback(() => {
    setWorkflow(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    workflow,
    loading,
    error,
    currentStep,
    progress,
    startExtraction,
    reset,
  };
};
