/**
 * Security & Validation Utilities
 * GDPR-compliant data handling, input validation, and security checks
 */

/**
 * Email validation (RFC 5322 simplified)
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Check if string contains suspicious patterns
 */
export function isSuspiciousInput(input: string): boolean {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onclick=/i,
    /fetch\(/i,
    /eval\(/i,
    /document\./i,
    /window\./i,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Hash email for GDPR compliance (one-way hashing)
 */
export async function hashEmail(email: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(email.toLowerCase());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Data retention policy: Calculate retention expiry date
 */
export function calculateRetentionExpiry(createdAt: Date, retentionDays: number = 90): Date {
  const expiry = new Date(createdAt);
  expiry.setDate(expiry.getDate() + retentionDays);
  return expiry;
}

/**
 * Check if data should be deleted based on retention policy
 */
export function isRetentionExpired(createdAt: string, retentionDays: number = 90): boolean {
  const created = new Date(createdAt);
  const expiry = calculateRetentionExpiry(created, retentionDays);
  return new Date() > expiry;
}

/**
 * Generate GDPR-compliant data export
 */
export function generateGDPRExport(userData: any) {
  return {
    exportedAt: new Date().toISOString(),
    exportVersion: '1.0.0',
    dataTypes: ['extraction_results', 'feedback_items', 'user_metadata'],
    data: userData,
    notice: 'This export contains personal data. Handle with care and comply with GDPR.',
  };
}

/**
 * Generate privacy notice
 */
export const PRIVACY_NOTICE = `
Data Collection and Privacy:
- User emails are collected only with explicit consent
- Data is stored locally and optionally synced to server
- All data can be deleted on request (right to be forgotten)
- Data retention: 90 days by default (configurable)
- No data sharing with third parties
- GDPR compliant processing
`;

/**
 * Validate GDPR consent
 */
export function validateGDPRConsent(consentGiven: boolean, dataTypes: string[]): boolean {
  if (!consentGiven) {
    console.warn('GDPR consent not given');
    return false;
  }

  const requiredTypes = ['personal_data', 'processing'];
  return requiredTypes.every(type => dataTypes.includes(type));
}

/**
 * Create audit log entry for GDPR compliance
 */
export function createAuditLogEntry(
  action: 'data_collection' | 'data_processing' | 'data_deletion' | 'data_export',
  details: any,
  email?: string
): {
  timestamp: string;
  action: string;
  details: any;
  emailHash?: string;
} {
  return {
    timestamp: new Date().toISOString(),
    action,
    details,
    emailHash: email ? 'hashed' : undefined, // Never store raw email in logs
  };
}

/**
 * Content Security Policy (CSP) headers
 */
export const CSP_HEADERS = {
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    font-src 'self' data:;
    connect-src 'self' http://localhost:3000 https://api.audit-extractor.app;
    frame-ancestors 'none';
  `.replace(/\s+/g, ' ').trim(),
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

/**
 * Validate API response for security issues
 */
export function validateAPIResponse(response: any): boolean {
  // Check for suspicious patterns
  const responseStr = JSON.stringify(response);
  if (isSuspiciousInput(responseStr)) {
    console.error('Suspicious content detected in API response');
    return false;
  }

  // Check response structure
  if (typeof response !== 'object' || response === null) {
    return false;
  }

  return true;
}

/**
 * Rate limiting check
 */
export class RateLimiter {
  private requests: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 60, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  isAllowed(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => time > now - this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      return false;
    }

    this.requests.push(now);
    return true;
  }

  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => time > now - this.windowMs);
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

export default {
  validateEmail,
  sanitizeInput,
  isSuspiciousInput,
  hashEmail,
  calculateRetentionExpiry,
  isRetentionExpired,
  generateGDPRExport,
  validateGDPRConsent,
  createAuditLogEntry,
  validateAPIResponse,
  RateLimiter,
};
