/**
 * Client-Side Error Logging & Monitoring
 * Tracks errors, performance metrics, and user analytics
 */

// Vite environment variables
const VITE_ENV = import.meta.env.MODE || 'development';
const VITE_LOG_SERVER = import.meta.env.VITE_LOG_SERVER || '';
const VITE_LOG_LEVEL = import.meta.env.VITE_LOG_LEVEL || 'warn';

export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: any;
  stack?: string;
  userAgent?: string;
  url?: string;
}

export interface ErrorMetric {
  errorId: string;
  errorType: string;
  message: string;
  count: number;
  firstOccurrence: string;
  lastOccurrence: string;
  affectedUsers: number;
}

const MAX_LOGS = 100; // Store last 100 logs
const LOGS_KEY = 'audit-safe:logs';
const METRICS_KEY = 'audit-safe:error-metrics';

/**
 * Logger Service
 * Client-side logging with local storage and optional server sync
 */
export class Logger {
  private static logs: LogEntry[] = [];
  private static metrics: Map<string, ErrorMetric> = new Map();
  private static serverEndpoint = VITE_LOG_SERVER;

  /**
   * Initialize logger from localStorage
   */
  static initialize(): void {
    try {
      const stored = localStorage.getItem(LOGS_KEY);
      if (stored) {
        this.logs = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to initialize logger:', error);
    }
  }

  /**
   * Log message
   */
  static log(
    level: 'info' | 'warn' | 'error' | 'debug',
    message: string,
    context?: any
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this.logs.push(entry);
    if (this.logs.length > MAX_LOGS) {
      this.logs.shift();
    }

    // Persist to localStorage
    try {
      localStorage.setItem(LOGS_KEY, JSON.stringify(this.logs));
    } catch (error) {
      console.error('Failed to persist logs:', error);
    }

    // Log to console in development
    if (VITE_ENV === 'development') {
      console[level === 'debug' ? 'log' : level](`[${level.toUpperCase()}] ${message}`, context);
    }

    // Send critical errors to server
    if (level === 'error' && this.serverEndpoint) {
      this.sendToServer(entry).catch(err =>
        console.error('Failed to send error to server:', err)
      );
    }
  }

  /**
   * Log info
   */
  static info(message: string, context?: any): void {
    this.log('info', message, context);
  }

  /**
   * Log warning
   */
  static warn(message: string, context?: any): void {
    this.log('warn', message, context);
  }

  /**
   * Log error
   */
  static error(message: string, error?: any, context?: any): void {
    const fullContext = {
      ...context,
      error: error?.message,
      stack: error?.stack,
    };
    this.log('error', message, fullContext);
    this.trackErrorMetric(message, error?.name || 'Unknown');
  }

  /**
   * Log debug
   */
  static debug(message: string, context?: any): void {
    if (VITE_LOG_LEVEL === 'debug') {
      this.log('debug', message, context);
    }
  }

  /**
   * Track error metrics for monitoring
   */
  static trackErrorMetric(message: string, errorType: string): void {
    const key = `${errorType}:${message}`;
    const existing = this.metrics.get(key);

    if (existing) {
      existing.count++;
      existing.lastOccurrence = new Date().toISOString();
    } else {
      this.metrics.set(key, {
        errorId: `${Date.now()}-${Math.random()}`,
        errorType,
        message,
        count: 1,
        firstOccurrence: new Date().toISOString(),
        lastOccurrence: new Date().toISOString(),
        affectedUsers: 1,
      });
    }

    // Save metrics
    try {
      localStorage.setItem(
        METRICS_KEY,
        JSON.stringify(Array.from(this.metrics.values()))
      );
    } catch (error) {
      console.error('Failed to save metrics:', error);
    }
  }

  /**
   * Get all logs
   */
  static getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs by level
   */
  static getLogsByLevel(level: LogEntry['level']): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Get error logs
   */
  static getErrors(): LogEntry[] {
    return this.getLogsByLevel('error');
  }

  /**
   * Get error metrics
   */
  static getMetrics(): ErrorMetric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Clear logs
   */
  static clearLogs(): void {
    this.logs = [];
    this.metrics.clear();
    try {
      localStorage.removeItem(LOGS_KEY);
      localStorage.removeItem(METRICS_KEY);
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  }

  /**
   * Export logs for support/debugging
   */
  static exportLogs(): {
    logs: LogEntry[];
    metrics: ErrorMetric[];
    exportedAt: string;
  } {
    return {
      logs: this.getLogs(),
      metrics: this.getMetrics(),
      exportedAt: new Date().toISOString(),
    };
  }

  /**
   * Send logs to server
   */
  private static async sendToServer(entry: LogEntry): Promise<void> {
    if (!this.serverEndpoint) return;

    try {
      await fetch(this.serverEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...entry,
          clientId: this.getClientId(),
        }),
      });
    } catch (error) {
      console.error('Failed to send log to server:', error);
    }
  }

  /**
   * Get or generate client ID for tracking
   */
  private static getClientId(): string {
    let clientId = localStorage.getItem('audit-safe:client-id');
    if (!clientId) {
      clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('audit-safe:client-id', clientId);
    }
    return clientId;
  }
}

/**
 * Global error handler
 */
export function setupGlobalErrorHandler(): void {
  Logger.initialize();

  // Unhandled errors
  window.addEventListener('error', (event) => {
    Logger.error(
      `Uncaught Error: ${event.message}`,
      event.error,
      {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      }
    );
  });

  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    Logger.error(
      `Unhandled Promise Rejection: ${event.reason}`,
      event.reason instanceof Error ? event.reason : new Error(String(event.reason))
    );
  });
}

/**
 * React Error Boundary integration
 */
export function handleReactError(error: Error, errorInfo: React.ErrorInfo): void {
  Logger.error('React Component Error', error, {
    componentStack: errorInfo.componentStack,
  });
}

export default Logger;
