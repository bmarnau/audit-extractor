/**
 * Zentraler Logger für Environment Validierungsfehler
 * Sammelt und protokolliert alle Validierungsfehler und Warnungen
 */

export type LogLevel = 'error' | 'warning' | 'info' | 'success';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  details?: Record<string, any>;
  stack?: string;
}

export class ValidationLogger {
  private logs: LogEntry[] = [];
  private startTime: number = Date.now();

  /**
   * Logged einen Eintrag
   */
  log(
    level: LogLevel,
    component: string,
    message: string,
    details?: Record<string, any>,
    stack?: string
  ): void {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component,
      message,
      details,
      stack,
    };

    this.logs.push(entry);

    // Konsolen-Ausgabe für Echtzeit-Feedback
    this.printToConsole(entry);
  }

  error(component: string, message: string, details?: Record<string, any>, stack?: string): void {
    this.log('error', component, message, details, stack);
  }

  warning(component: string, message: string, details?: Record<string, any>): void {
    this.log('warning', component, message, details);
  }

  info(component: string, message: string, details?: Record<string, any>): void {
    this.log('info', component, message, details);
  }

  success(component: string, message: string, details?: Record<string, any>): void {
    this.log('success', component, message, details);
  }

  /**
   * Gibt alle Fehler zurück
   */
  getErrors(): LogEntry[] {
    return this.logs.filter((log) => log.level === 'error');
  }

  /**
   * Gibt alle Warnungen zurück
   */
  getWarnings(): LogEntry[] {
    return this.logs.filter((log) => log.level === 'warning');
  }

  /**
   * Gibt alle Logs zurück
   */
  getAllLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Prüft ob es kritische Fehler gibt
   */
  hasErrors(): boolean {
    return this.getErrors().length > 0;
  }

  /**
   * Setzt die Logs zurück
   */
  clear(): void {
    this.logs = [];
    this.startTime = Date.now();
  }

  /**
   * Gibt eine Zusammenfassung zurück
   */
  getSummary(): {
    total: number;
    errors: number;
    warnings: number;
    infos: number;
    successes: number;
    duration: number;
  } {
    return {
      total: this.logs.length,
      errors: this.getErrors().length,
      warnings: this.getWarnings().length,
      infos: this.logs.filter((log) => log.level === 'info').length,
      successes: this.logs.filter((log) => log.level === 'success').length,
      duration: Date.now() - this.startTime,
    };
  }

  /**
   * Exportiert Logs als JSON
   */
  toJSON(): { logs: LogEntry[]; summary: ReturnType<typeof this.getSummary> } {
    return {
      logs: this.logs,
      summary: this.getSummary(),
    };
  }

  /**
   * Konsolen-Output formatieren
   */
  private printToConsole(entry: LogEntry): void {
    const symbols = {
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      success: '✅',
    };

    const symbol = symbols[entry.level];
    const color = {
      error: '\x1b[31m', // Red
      warning: '\x1b[33m', // Yellow
      info: '\x1b[36m', // Cyan
      success: '\x1b[32m', // Green
    }[entry.level];

    const reset = '\x1b[0m';
    const timestamp = new Date(entry.timestamp).toLocaleTimeString();

    let output = `${symbol} [${timestamp}] ${color}${entry.component}${reset}: ${entry.message}`;

    if (entry.details && Object.keys(entry.details).length > 0) {
      output += `\n  Details: ${JSON.stringify(entry.details, null, 2)}`;
    }

    if (entry.stack) {
      output += `\n  Stack: ${entry.stack}`;
    }

    if (entry.level === 'error') {
      console.error(output);
    } else if (entry.level === 'warning') {
      console.warn(output);
    } else if (entry.level === 'success') {
      console.log(output);
    } else {
      console.log(output);
    }
  }
}

// Globale Logger-Instanz
export const globalLogger = new ValidationLogger();
