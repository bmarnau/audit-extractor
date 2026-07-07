/**
 * Hook: useApiError
 * 
 * Zentrale Error-Verwaltung für API-Operationen
 */

import { useState, useCallback } from 'react';
import { ApiError } from '../api/client';

export interface UseApiErrorResult {
  error: ApiError | null;
  isError: boolean;
  errorMessage: string;
  errorCode: string;
  errorDetails: Record<string, unknown>;
  setError: (error: ApiError | null) => void;
  clearError: () => void;
  handleApiError: (err: unknown) => ApiError | null;
}

export const useApiError = (): UseApiErrorResult => {
  const [error, setError] = useState<ApiError | null>(null);

  const handleApiError = useCallback((err: unknown): ApiError | null => {
    if (err instanceof ApiError) {
      setError(err);
      return err;
    }

    if (err instanceof Error) {
      const apiError = new ApiError('UNKNOWN_ERROR', 0, err.message);
      setError(apiError);
      return apiError;
    }

    const apiError = new ApiError('UNKNOWN_ERROR', 0, 'An unknown error occurred');
    setError(apiError);
    return apiError;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    isError: error !== null,
    errorMessage: error?.message || '',
    errorCode: error?.code || '',
    errorDetails: error?.details || {},
    setError,
    clearError,
    handleApiError,
  };
};
