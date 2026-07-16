/**
 * Security Audit Logging Module
 * 
 * Comprehensive logging for security-related events:
 * - File uploads (success/failure)
 * - Validation failures
 * - Rate limit violations
 * - Suspicious activity
 * 
 * Logs are written to: `logs/security-audit.log`
 * Format: JSON for easy parsing and analysis
 * 
 * @version 1.0.0
 * @phase 44
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROJECT_ROOT = path.join(__dirname, '../../../..');
const LOGS_DIR = path.join(PROJECT_ROOT, 'logs');

/**
 * Ensure logs directory exists
 */
async function ensureLogsDir(): Promise<void> {
  try {
    await fs.mkdir(LOGS_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create logs directory:', err);
  }
}

/**
 * Security event types
 */
export enum SecurityEventType {
  FILE_UPLOAD_SUCCESS = 'FILE_UPLOAD_SUCCESS',
  FILE_UPLOAD_FAILED = 'FILE_UPLOAD_FAILED',
  MAGIC_BYTES_MISMATCH = 'MAGIC_BYTES_MISMATCH',
  INVALID_FILENAME = 'INVALID_FILENAME',
  FILE_SIZE_EXCEEDED = 'FILE_SIZE_EXCEEDED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
}

export enum SecurityEventSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

/**
 * Security event structure
 */
export interface SecurityEvent {
  timestamp: string;
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  clientIdentifier: string; // IP or user ID
  fileName?: string;
  fileSize?: number;
  message: string;
  details?: Record<string, any>;
  userId?: string;
  ipAddress?: string;
}

/**
 * Write security event to audit log
 */
async function writeAuditLog(event: SecurityEvent): Promise<void> {
  try {
    await ensureLogsDir();

    const logFile = path.join(LOGS_DIR, 'security-audit.log');
    const logEntry = JSON.stringify(event) + '\n';

    await fs.appendFile(logFile, logEntry, 'utf-8');

    // Also log to console if error or critical
    if (event.severity === SecurityEventSeverity.ERROR || event.severity === SecurityEventSeverity.CRITICAL) {
      console.warn(`[SECURITY] ${event.eventType}: ${event.message}`);
    }
  } catch (err) {
    console.error('Failed to write security audit log:', err);
  }
}

/**
 * Extract IP and user info from request
 */
function extractRequestInfo(req: any): { ipAddress: string; userId?: string } {
  const ipAddress =
    req.ip ||
    req.connection?.remoteAddress ||
    req.socket?.remoteAddress ||
    req.connection?.socket?.remoteAddress ||
    'unknown';

  return {
    ipAddress,
    userId: req.user?.id,
  };
}

/**
 * Log successful file upload
 */
export async function logFileUploadSuccess(
  req: any,
  fileName: string,
  fileSize: number,
  resultId: string
): Promise<void> {
  const { ipAddress, userId } = extractRequestInfo(req);

  const event: SecurityEvent = {
    timestamp: new Date().toISOString(),
    eventType: SecurityEventType.FILE_UPLOAD_SUCCESS,
    severity: SecurityEventSeverity.INFO,
    clientIdentifier: userId ? `user:${userId}` : `ip:${ipAddress}`,
    fileName,
    fileSize,
    message: `File uploaded successfully: ${fileName} (${fileSize} bytes)`,
    details: {
      resultId,
      magicBytesVerified: true,
      filenameSanitized: true,
    },
    userId,
    ipAddress,
  };

  await writeAuditLog(event);
}

/**
 * Log file upload failure
 */
export async function logFileUploadFailure(
  req: any,
  fileName: string,
  errorMessage: string,
  reason: string
): Promise<void> {
  const { ipAddress, userId } = extractRequestInfo(req);

  const event: SecurityEvent = {
    timestamp: new Date().toISOString(),
    eventType: SecurityEventType.FILE_UPLOAD_FAILED,
    severity: SecurityEventSeverity.WARNING,
    clientIdentifier: userId ? `user:${userId}` : `ip:${ipAddress}`,
    fileName,
    message: `File upload failed: ${errorMessage}`,
    details: {
      reason,
    },
    userId,
    ipAddress,
  };

  await writeAuditLog(event);
}

/**
 * Log magic bytes mismatch (potential attack)
 */
export async function logMagicBytesMismatch(
  req: any,
  fileName: string,
  declaredExtension: string,
  detectedType: string
): Promise<void> {
  const { ipAddress, userId } = extractRequestInfo(req);

  const event: SecurityEvent = {
    timestamp: new Date().toISOString(),
    eventType: SecurityEventType.MAGIC_BYTES_MISMATCH,
    severity: SecurityEventSeverity.ERROR,
    clientIdentifier: userId ? `user:${userId}` : `ip:${ipAddress}`,
    fileName,
    message: `Magic bytes mismatch detected - potential file type spoofing attack`,
    details: {
      declaredExtension,
      detectedType,
      action: 'File rejected',
    },
    userId,
    ipAddress,
  };

  await writeAuditLog(event);
}

/**
 * Log invalid filename
 */
export async function logInvalidFilename(
  req: any,
  fileName: string,
  reason: string
): Promise<void> {
  const { ipAddress, userId } = extractRequestInfo(req);

  const event: SecurityEvent = {
    timestamp: new Date().toISOString(),
    eventType: SecurityEventType.INVALID_FILENAME,
    severity: SecurityEventSeverity.WARNING,
    clientIdentifier: userId ? `user:${userId}` : `ip:${ipAddress}`,
    fileName,
    message: `Invalid filename rejected - potential path traversal attack`,
    details: {
      reason,
      action: 'File rejected',
    },
    userId,
    ipAddress,
  };

  await writeAuditLog(event);
}

/**
 * Log file size exceeded
 */
export async function logFileSizeExceeded(
  req: any,
  fileName: string,
  actualSize: number,
  maxSize: number
): Promise<void> {
  const { ipAddress, userId } = extractRequestInfo(req);

  const event: SecurityEvent = {
    timestamp: new Date().toISOString(),
    eventType: SecurityEventType.FILE_SIZE_EXCEEDED,
    severity: SecurityEventSeverity.WARNING,
    clientIdentifier: userId ? `user:${userId}` : `ip:${ipAddress}`,
    fileName,
    fileSize: actualSize,
    message: `File size exceeds limit`,
    details: {
      actualSize: `${(actualSize / 1024 / 1024).toFixed(2)}MB`,
      maxSize: `${(maxSize / 1024 / 1024).toFixed(2)}MB`,
    },
    userId,
    ipAddress,
  };

  await writeAuditLog(event);
}

/**
 * Log rate limit violation
 */
export async function logRateLimitViolation(
  req: any,
  clientIdentifier: string,
  currentCount: number,
  maxRequests: number,
  resetTime: Date
): Promise<void> {
  const { ipAddress, userId } = extractRequestInfo(req);

  const event: SecurityEvent = {
    timestamp: new Date().toISOString(),
    eventType: SecurityEventType.RATE_LIMIT_EXCEEDED,
    severity: SecurityEventSeverity.WARNING,
    clientIdentifier,
    message: `Rate limit exceeded for upload endpoint`,
    details: {
      currentRequests: currentCount,
      maxRequests,
      resetTime: resetTime.toISOString(),
      action: 'Request rejected',
    },
    userId,
    ipAddress,
  };

  await writeAuditLog(event);
}

/**
 * Log suspicious activity
 */
export async function logSuspiciousActivity(
  req: any,
  description: string,
  severity: SecurityEventSeverity = SecurityEventSeverity.WARNING
): Promise<void> {
  const { ipAddress, userId } = extractRequestInfo(req);

  const event: SecurityEvent = {
    timestamp: new Date().toISOString(),
    eventType: SecurityEventType.SUSPICIOUS_ACTIVITY,
    severity,
    clientIdentifier: userId ? `user:${userId}` : `ip:${ipAddress}`,
    message: description,
    userId,
    ipAddress,
  };

  await writeAuditLog(event);
}

/**
 * Log validation error
 */
export async function logValidationError(
  req: any,
  fileName: string,
  validationErrors: string[]
): Promise<void> {
  const { ipAddress, userId } = extractRequestInfo(req);

  const event: SecurityEvent = {
    timestamp: new Date().toISOString(),
    eventType: SecurityEventType.VALIDATION_ERROR,
    severity: SecurityEventSeverity.WARNING,
    clientIdentifier: userId ? `user:${userId}` : `ip:${ipAddress}`,
    fileName,
    message: `File validation failed`,
    details: {
      errors: validationErrors,
    },
    userId,
    ipAddress,
  };

  await writeAuditLog(event);
}

/**
 * Query audit logs (for reporting/analysis)
 * Returns: Array of events filtered by criteria
 */
export async function queryAuditLogs(filter?: {
  eventType?: SecurityEventType;
  severity?: SecurityEventSeverity;
  clientIdentifier?: string;
  startTime?: Date;
  endTime?: Date;
  limit?: number;
}): Promise<SecurityEvent[]> {
  try {
    const logFile = path.join(LOGS_DIR, 'security-audit.log');
    const content = await fs.readFile(logFile, 'utf-8');
    const lines = content.split('\n').filter((line) => line.trim());

    let events: SecurityEvent[] = lines.map((line) => JSON.parse(line));

    // Apply filters
    if (filter) {
      if (filter.eventType) {
        events = events.filter((e) => e.eventType === filter.eventType);
      }
      if (filter.severity) {
        events = events.filter((e) => e.severity === filter.severity);
      }
      if (filter.clientIdentifier) {
        events = events.filter((e) => e.clientIdentifier === filter.clientIdentifier);
      }
      if (filter.startTime) {
        events = events.filter((e) => new Date(e.timestamp) >= filter.startTime!);
      }
      if (filter.endTime) {
        events = events.filter((e) => new Date(e.timestamp) <= filter.endTime!);
      }
    }

    // Return most recent first, apply limit
    events = events.reverse();
    if (filter?.limit) {
      events = events.slice(0, filter.limit);
    }

    return events;
  } catch (err) {
    console.error('Failed to query audit logs:', err);
    return [];
  }
}
