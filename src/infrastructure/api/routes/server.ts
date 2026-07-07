/**
 * Legacy Route Server Helpers - Stub
 * 
 * Re-exports for Phase 11 legacy routes
 */

import { Request } from 'express';

export interface ApiRequest extends Request {
  startTime?: number;
  user?: { id: string; role: string };
}

export class ApiResponseError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiResponseError';
  }
}

export function createSuccessResponse<T>(data: T, message = 'Success') {
  return {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
}

export function createErrorResponse(error: ApiResponseError | Error) {
  if (error instanceof ApiResponseError) {
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      timestamp: new Date().toISOString(),
    };
  }
  return {
    success: false,
    error: {
      code: 'UNKNOWN_ERROR',
      message: error.message,
    },
    timestamp: new Date().toISOString(),
  };
}
