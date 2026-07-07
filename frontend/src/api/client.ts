/**
 * API Client - Centralized fetch wrapper with error handling (Phase 11)
 * 
 * @version 0.11.0
 * @phase 11
 * @status COMPLETE - Production-ready with request logging and error handling
 */

import { ApiErrorResponse } from './types';

export interface ApiClientConfig {
  baseUrl: string;
  timeout?: number;
  headers?: Record<string, string>;
  onError?: (error: ApiError) => void;
}

export class ApiError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private config: Required<ApiClientConfig>;
  private requestLog: Array<{
    timestamp: Date;
    method: string;
    url: string;
    statusCode?: number;
    duration: number;
  }> = [];

  constructor(config: ApiClientConfig) {
    this.config = {
      baseUrl: config.baseUrl,
      timeout: config.timeout || 30000,
      headers: config.headers || {},
      onError: config.onError || (() => {}),
    };
  }

  async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    options?: {
      body?: unknown;
      headers?: Record<string, string>;
      params?: Record<string, string | number>;
    }
  ): Promise<T> {
    const startTime = performance.now();
    const url = this.buildUrl(endpoint, options?.params);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...this.config.headers,
          ...options?.headers,
        },
        body: options?.body ? JSON.stringify(options.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const duration = performance.now() - startTime;
      this.logRequest(method, endpoint, response.status, duration);

      if (!response.ok) {
        const error = await this.handleErrorResponse(response);
        this.config.onError?.(error);
        throw error;
      }

      if (response.status === 204) {
        return {} as T; // No content
      }

      return (await response.json()) as T;
    } catch (err) {
      const duration = performance.now() - startTime;
      this.logRequest(method, endpoint, undefined, duration);

      if (err instanceof ApiError) {
        throw err;
      }

      if (err instanceof TypeError && err.message.includes('fetch')) {
        const apiError = new ApiError(
          'NETWORK_ERROR',
          0,
          'Network request failed. Check your connection.',
          { originalError: err.message }
        );
        this.config.onError?.(apiError);
        throw apiError;
      }

      if (err instanceof DOMException && err.name === 'AbortError') {
        const apiError = new ApiError(
          'TIMEOUT',
          0,
          `Request timeout after ${this.config.timeout}ms`,
          {}
        );
        this.config.onError?.(apiError);
        throw apiError;
      }

      throw err;
    }
  }

  async get<T>(
    endpoint: string,
    options?: { headers?: Record<string, string>; params?: Record<string, string | number> }
  ): Promise<T> {
    return this.request<T>('GET', endpoint, options);
  }

  async post<T>(
    endpoint: string,
    body?: unknown,
    options?: { headers?: Record<string, string>; params?: Record<string, string | number> }
  ): Promise<T> {
    return this.request<T>('POST', endpoint, { body, ...options });
  }

  async put<T>(
    endpoint: string,
    body?: unknown,
    options?: { headers?: Record<string, string>; params?: Record<string, string | number> }
  ): Promise<T> {
    return this.request<T>('PUT', endpoint, { body, ...options });
  }

  async delete<T>(
    endpoint: string,
    options?: { headers?: Record<string, string>; params?: Record<string, string | number> }
  ): Promise<T> {
    return this.request<T>('DELETE', endpoint, options);
  }

  async patch<T>(
    endpoint: string,
    body?: unknown,
    options?: { headers?: Record<string, string>; params?: Record<string, string | number> }
  ): Promise<T> {
    return this.request<T>('PATCH', endpoint, { body, ...options });
  }

  private buildUrl(
    endpoint: string,
    params?: Record<string, string | number>
  ): string {
    const baseUrl = this.config.baseUrl.endsWith('/') 
      ? this.config.baseUrl.slice(0, -1)
      : this.config.baseUrl;
    
    const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    let url = `${baseUrl}${path}`;

    if (params && Object.keys(params).length > 0) {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        query.append(key, String(value));
      });
      url += `?${query.toString()}`;
    }

    return url;
  }

  private async handleErrorResponse(response: Response): Promise<ApiError> {
    const contentType = response.headers.get('content-type');
    let data: ApiErrorResponse | null = null;

    try {
      if (contentType?.includes('application/json')) {
        data = await response.json();
      }
    } catch {
      // Failed to parse JSON
    }

    const code = data?.error?.code || 'UNKNOWN_ERROR';
    const message = data?.error?.message || response.statusText || 'Unknown error occurred';
    const details = data?.error?.details || {};

    return new ApiError(code, response.status, message, details);
  }

  private logRequest(
    method: string,
    endpoint: string,
    statusCode: number | undefined,
    duration: number
  ): void {
    this.requestLog.push({
      timestamp: new Date(),
      method,
      url: endpoint,
      statusCode,
      duration,
    });

    // Keep only last 50 requests
    if (this.requestLog.length > 50) {
      this.requestLog.shift();
    }

    // Log to console in development
    if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
      console.log(
        `[API] ${method} ${endpoint} ${statusCode || '?'} (${duration.toFixed(0)}ms)`
      );
    }
  }

  getRequestLog() {
    return [...this.requestLog];
  }

  clearRequestLog() {
    this.requestLog = [];
  }
}

// Initialize global API client
const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
export const apiClient = new ApiClient({
  baseUrl: apiBaseUrl,
  timeout: 30000,
  onError: (error: ApiError) => {
    console.error(`[API Error] ${error.code}: ${error.message}`, error.details);
  },
});
