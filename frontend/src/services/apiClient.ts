/**
 * API Client Service
 * Handles HTTP requests with retry logic, error handling, and configuration
 */

import { API_CONFIG, getApiUrl } from '@/config/api.config';

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public userMessage: string = message
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiRequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp?: string;
  path?: string;
  duration?: number;
}

/**
 * Maps API errors to user-friendly messages
 */
function mapErrorToUserMessage(status: number, error: string): string {
  switch (status) {
    case 400:
      return 'Invalid request. Please check your input.';
    case 401:
      return 'Unauthorized. Please login again.';
    case 403:
      return 'You do not have permission to perform this action.';
    case 404:
      return 'Resource not found.';
    case 429:
      return 'Too many requests. Please try again later.';
    case 500:
    case 502:
    case 503:
      return 'Server error. Please try again later.';
    case 504:
      return 'Request timeout. Please try again.';
    default:
      return error || 'An error occurred. Please try again.';
  }
}

/**
 * Exponential backoff delay calculation
 */
function calculateBackoffDelay(attempt: number, initialDelay: number, multiplier: number): number {
  const delay = initialDelay * Math.pow(multiplier, attempt - 1);
  return Math.min(delay, API_CONFIG.RETRY.MAX_DELAY);
}

/**
 * Main API client with retry logic and error handling
 */
export class ApiClient {
  private static instance: ApiClient;

  private constructor() {}

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  /**
   * Make HTTP request with retry logic
   */
  async request<T = any>(
    path: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = API_CONFIG.TIMEOUTS.NORMAL,
      retries = API_CONFIG.RETRY.MAX_ATTEMPTS,
    } = options;

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await this.fetchWithTimeout<T>(
          path,
          { method, headers, body },
          timeout
        );
      } catch (error: any) {
        lastError = error;

        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
          if (error.status !== 429) {
            throw error;
          }
        }

        // Don't retry on last attempt
        if (attempt === retries) {
          break;
        }

        // Calculate backoff delay
        const delay = calculateBackoffDelay(
          attempt,
          API_CONFIG.RETRY.INITIAL_DELAY,
          API_CONFIG.RETRY.BACKOFF_MULTIPLIER
        );

        console.warn(
          `[ApiClient] Retry ${attempt}/${retries} after ${delay}ms for ${path}`,
          error.message
        );

        // Wait before retry
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    // All retries exhausted
    if (lastError) {
      throw lastError;
    }

    throw new Error('Unknown error');
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout<T = any>(
    path: string,
    init: RequestInit,
    timeout: number
  ): Promise<ApiResponse<T>> {
    const url = getApiUrl(path);
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...init,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...init.headers,
        },
      });

      clearTimeout(timeoutId);

      // Parse response
      let data: any;
      try {
        data = await response.json();
      } catch {
        data = { success: false, error: 'Invalid response format' };
      }

      // Handle error responses
      if (!response.ok) {
        const userMessage = mapErrorToUserMessage(
          response.status,
          data?.error || response.statusText
        );
        throw new ApiError(
          response.status,
          data?.error || response.statusText,
          userMessage
        );
      }

      return data as ApiResponse<T>;
    } catch (error: any) {
      clearTimeout(timeoutId);

      // Handle abort (timeout)
      if (error.name === 'AbortError') {
        throw new ApiError(
          504,
          'Request timeout',
          'Request took too long. Please try again.'
        );
      }

      // Re-throw API errors
      if (error instanceof ApiError) {
        throw error;
      }

      // Network errors
      if (!navigator.onLine) {
        throw new ApiError(
          0,
          'No internet connection',
          'Please check your internet connection and try again.'
        );
      }

      // Generic error
      throw new ApiError(
        0,
        error.message || 'Unknown error',
        'An unexpected error occurred. Please try again.'
      );
    }
  }

  /**
   * GET request
   */
  get<T = any>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  /**
   * POST request
   */
  post<T = any>(
    path: string,
    body?: any,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ) {
    return this.request<T>(path, { ...options, method: 'POST', body });
  }

  /**
   * PUT request
   */
  put<T = any>(
    path: string,
    body?: any,
    options?: Omit<ApiRequestOptions, 'method' | 'body'>
  ) {
    return this.request<T>(path, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE request
   */
  delete<T = any>(path: string, options?: Omit<ApiRequestOptions, 'method'>) {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}

export const apiClient = ApiClient.getInstance();
