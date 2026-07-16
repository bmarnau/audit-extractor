/**
 * Environment & Application Constants
 * Consolidated from scattered hardcoded values across components
 * Phase 4 Refactoring Task 2
 */

/**
 * API Configuration
 */
export const API_CONFIG = {
  // Base URL with fallback to localhost for development
  BASE_URL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  
  // HTTP timeout values (milliseconds)
  FETCH_TIMEOUT: 3000,
  BUILD_OPERATION_TIMEOUT: 2000,
  SYNC_OPERATION_TIMEOUT: 2000,
  DEFAULT_TIMEOUT: 30000,
};

/**
 * Polling & Timing Configuration
 */
export const TIMING_CONFIG = {
  // Job polling interval
  JOB_POLL_INTERVAL: 5000,
  
  // UI feedback timeouts
  TOAST_DISPLAY_DURATION: 3000,
  MESSAGE_DISPLAY_DURATION: 3000,
  SUCCESS_FEEDBACK_DURATION: 2000,
  COPY_SUCCESS_FEEDBACK_DURATION: 2000,
  
  // Operation delays
  OPERATION_DELAY: 1200,
  STANDARD_DELAY: 1000,
};

/**
 * Validation & Limits Configuration
 */
export const VALIDATION_CONFIG = {
  // Schema validation limits
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_EXTRACT_RULES: 5000,
};

/**
 * System Configuration
 */
export const SYSTEM_CONFIG = {
  // Wakeup status check
  WAKEUP_CHECK_ENDPOINT: 'http://localhost:3000/api/system/wakeup/status',
  WAKEUP_TRIGGER_ENDPOINT: 'http://localhost:3000/api/system/wakeup',
};

// Export all configs as default object for convenience
export default {
  API_CONFIG,
  TIMING_CONFIG,
  VALIDATION_CONFIG,
  SYSTEM_CONFIG,
};
