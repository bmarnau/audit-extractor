/**
 * Frontend Version & Build Info
 * 
 * Centralized version metadata for frontend UI
 */

export const FRONTEND_VERSION = '0.13.0';
export const API_VERSION = '0.13.0';
export const PHASE = 13;

export const BUILD_INFO = {
  version: FRONTEND_VERSION,
  apiVersion: API_VERSION,
  phase: PHASE,
  buildTime: new Date().toISOString(),
  environment: import.meta.env.MODE,
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  logLevel: import.meta.env.VITE_LOG_LEVEL || 'warn',
  enableTracing: import.meta.env.VITE_ENABLE_TRACING === 'true',
};

/**
 * Log frontend startup info
 */
export function logFrontendInfo(): void {
  if (import.meta.env.VITE_LOG_LEVEL === 'debug') {
    console.group('🚀 Frontend Build Info');
    console.log(`Version: ${BUILD_INFO.version}`);
    console.log(`Phase: ${BUILD_INFO.phase}`);
    console.log(`Environment: ${BUILD_INFO.environment}`);
    console.log(`API URL: ${BUILD_INFO.apiUrl}`);
    console.log(`Build Time: ${BUILD_INFO.buildTime}`);
    console.groupEnd();
  }
}

export default BUILD_INFO;
