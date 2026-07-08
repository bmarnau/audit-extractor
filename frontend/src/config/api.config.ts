/**
 * API Configuration
 * Environment-aware API endpoint setup
 * 
 * ⚠️  Uses import.meta.env for Vite compatibility
 * NEVER use process.env in Vite apps (causes browser errors)
 */

// Vite environment variables (from .env.development / .env.production)
const VITE_API_URL = '/api';  // Use relative URL with Vite proxy
const VITE_ENV = import.meta.env.MODE || 'development';

export const API_CONFIG = {
  // API Base URL - supports environment-based configuration
  BASE_URL: '',  // Empty for relative URLs with Vite proxy
  
  // Extract endpoints
  EXTRACT: {
    FEEDBACK: (resultId: string) => `/api/extract/extraction/${resultId}/feedback`,
    SUGGESTIONS: (resultId: string, docType: string) => 
      `/api/extract/extraction/${resultId}/suggestions?docType=${docType}`,
    IMPROVE_RULES: (docType: string) => `/api/extract/rules/${docType}/improve`,
    RESULTS: (resultId: string) => `/api/extract/results/${resultId}`,
  },

  // Timeouts
  TIMEOUTS: {
    SHORT: 5000,      // 5s - quick operations
    NORMAL: 10000,    // 10s - API calls
    LONG: 30000,      // 30s - batch operations
  },

  // Retry configuration
  RETRY: {
    MAX_ATTEMPTS: 3,
    INITIAL_DELAY: 1000,    // 1s
    MAX_DELAY: 10000,       // 10s
    BACKOFF_MULTIPLIER: 2,  // Exponential backoff
  },

  // Rate limiting
  RATE_LIMIT: {
    REQUESTS_PER_MINUTE: 60,
    REQUESTS_PER_HOUR: 1000,
  },
} as const;

/**
 * Get full API URL
 */
export function getApiUrl(path: string): string {
  const base = API_CONFIG.BASE_URL.replace(/\/$/, ''); // Remove trailing slash
  return `${base}${path}`;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return VITE_ENV === 'production';
}

/**
 * Get API base URL for current environment
 * Always use relative URL /api for compatibility with Nginx reverse proxy
 */
export function getApiBaseUrl(): string {
  return '/api';  // Use relative URL - works with Nginx proxy in Docker and Vite dev proxy
}
