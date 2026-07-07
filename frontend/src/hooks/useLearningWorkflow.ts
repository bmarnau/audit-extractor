/**
 * useLearningWorkflow Hook
 * Phase 14d: Helper for Learning & Feedback Integration
 */

import { useState, useCallback } from 'react';

export interface LearningWorkflowState {
  feedbackSubmitting: boolean;
  suggestionsLoading: boolean;
  improvementsApplying: boolean;
  feedbackCount: number;
  suggestionsCount: number;
  appliedImprovements: number;
  error: string | null;
}

export const useLearningWorkflow = () => {
  const [state, setState] = useState<LearningWorkflowState>({
    feedbackSubmitting: false,
    suggestionsLoading: false,
    improvementsApplying: false,
    feedbackCount: 0,
    suggestionsCount: 0,
    appliedImprovements: 0,
    error: null,
  });

  const submitFeedback = useCallback(async (resultId: string, docType: string, feedback: any) => {
    setState((prev) => ({ ...prev, feedbackSubmitting: true, error: null }));
    try {
      const response = await fetch(
        `http://localhost:3000/api/extract/extraction/${resultId}/feedback`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ docType, ...feedback }),
        }
      );

      if (!response.ok) throw new Error('Failed to submit feedback');
      const data = await response.json();

      setState((prev) => ({
        ...prev,
        feedbackCount: prev.feedbackCount + data.data.feedbackRecorded,
      }));

      return data.data;
    } catch (err: any) {
      setState((prev) => ({ ...prev, error: err.message }));
      throw err;
    } finally {
      setState((prev) => ({ ...prev, feedbackSubmitting: false }));
    }
  }, []);

  const loadSuggestions = useCallback(async (resultId: string, docType: string) => {
    setState((prev) => ({ ...prev, suggestionsLoading: true, error: null }));
    try {
      const response = await fetch(
        `http://localhost:3000/api/extract/extraction/${resultId}/suggestions?docType=${docType}`
      );

      if (!response.ok) throw new Error('Failed to load suggestions');
      const data = await response.json();

      setState((prev) => ({
        ...prev,
        suggestionsCount: data.data.suggestions?.length || 0,
      }));

      return data.data.suggestions || [];
    } catch (err: any) {
      setState((prev) => ({ ...prev, error: err.message }));
      throw err;
    } finally {
      setState((prev) => ({ ...prev, suggestionsLoading: false }));
    }
  }, []);

  const applyImprovements = useCallback(
    async (docType: string, suggestions: any[], applyAll: boolean = true) => {
      setState((prev) => ({ ...prev, improvementsApplying: true, error: null }));
      try {
        const response = await fetch(`http://localhost:3000/api/extract/rules/${docType}/improve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ suggestions, applyAll }),
        });

        if (!response.ok) throw new Error('Failed to apply improvements');
        const data = await response.json();

        setState((prev) => ({
          ...prev,
          appliedImprovements: prev.appliedImprovements + data.data.suggestionsApplied,
        }));

        return data.data;
      } catch (err: any) {
        setState((prev) => ({ ...prev, error: err.message }));
        throw err;
      } finally {
        setState((prev) => ({ ...prev, improvementsApplying: false }));
      }
    },
    []
  );

  const resetState = useCallback(() => {
    setState({
      feedbackSubmitting: false,
      suggestionsLoading: false,
      improvementsApplying: false,
      feedbackCount: 0,
      suggestionsCount: 0,
      appliedImprovements: 0,
      error: null,
    });
  }, []);

  return {
    ...state,
    submitFeedback,
    loadSuggestions,
    applyImprovements,
    resetState,
  };
};
