/**
 * File Validation & Security Module
 * 
 * Provides comprehensive file validation including:
 * - Magic byte verification (prevents file type spoofing)
 * - Filename sanitization (prevents path traversal)
 * - File size validation
 * - MIME type validation
 * 
 * @version 1.0.0
 * @phase 44
 */

/**
 * Magic bytes (file signatures) for common file types
 * Format: [byte sequence, file type, description]
 */
const FILE_SIGNATURES: Record<string, { bytes: number[], description: string; extensions: string[] }> = {
  pdf: {
    bytes: [0x25, 0x50, 0x44, 0x46], // %PDF
    description: 'PDF Document',
    extensions: ['pdf'],
  },
  // HTML can start with various bytes, but common patterns:
  html: {
    bytes: [0x3c, 0x21, 0x44, 0x4f], // <!DO (<!DOCTYPE)
    description: 'HTML Document (DOCTYPE)',
    extensions: ['html', 'htm'],
  },
  html_tag: {
    bytes: [0x3c, 0x68, 0x74, 0x6d], // <htm
    description: 'HTML Document (tag)',
    extensions: ['html', 'htm'],
  },
  html_xml: {
    bytes: [0x3c, 0x3f, 0x78, 0x6d], // <?xm
    description: 'XML/HTML Document',
    extensions: ['html', 'htm', 'xml'],
  },
  // MS Office Open XML (DOCX, XLSX, PPTX) - ZIP format
  docx: {
    bytes: [0x50, 0x4b, 0x03, 0x04], // PK.. (ZIP header)
    description: 'Microsoft Office Document (DOCX/XLSX/PPTX)',
    extensions: ['docx', 'xlsx', 'pptx'],
  },
  // UTF-8 BOM with possible HTML/XML
  utf8_bom_html: {
    bytes: [0xef, 0xbb, 0xbf, 0x3c], // EF BB BF <
    description: 'UTF-8 with BOM (HTML/XML)',
    extensions: ['html', 'htm', 'xml'],
  },
};

/**
 * Extract file signature (first N bytes) from file buffer
 */
export function extractFileSignature(buffer: Buffer, length: number = 4): number[] {
  return Array.from(buffer.slice(0, length));
}

/**
 * Verify file magic bytes match expected file type
 * Returns: { isValid: boolean, reason?: string }
 */
export function verifyMagicBytes(
  buffer: Buffer,
  expectedExtension: string
): { isValid: boolean; detectedType?: string; reason?: string } {
  if (buffer.length < 4) {
    return { isValid: false, reason: 'File too small to verify magic bytes' };
  }

  const signature = extractFileSignature(buffer, 4);
  const signatureHex = signature.map((b) => `0x${b.toString(16).toUpperCase().padStart(2, '0')}`).join(', ');

  // Check each known signature
  for (const [type, { bytes, description }] of Object.entries(FILE_SIGNATURES)) {
    if (signature.slice(0, bytes.length).every((byte, idx) => byte === bytes[idx])) {
      // Found a match
      const matchesExpected = FILE_SIGNATURES[type].extensions.includes(expectedExtension.toLowerCase());

      return {
        isValid: matchesExpected,
        detectedType: description,
        reason: matchesExpected
          ? undefined
          : `File signature matches ${description}, but extension is .${expectedExtension}`,
      };
    }
  }

  // Special case for HTML: it may not have a standard magic byte signature
  if (['html', 'htm'].includes(expectedExtension.toLowerCase())) {
    // Check if it looks like HTML (starts with < or has BOM)
    if (buffer[0] === 0x3c || (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf)) {
      return { isValid: true, detectedType: 'HTML Document (text-based)' };
    }
    return {
      isValid: false,
      reason: `File does not appear to be HTML (signature: ${signatureHex})`,
    };
  }

  // Unknown signature
  return {
    isValid: false,
    reason: `Unknown file signature: ${signatureHex}. Expected .${expectedExtension}`,
  };
}

/**
 * Sanitize filename to prevent path traversal and injection attacks
 * - Removes directory traversal characters (.., /)
 * - Removes null bytes
 * - Removes suspicious characters
 * - Limits filename length
 * - Preserves file extension
 */
export function sanitizeFilename(filename: string, maxLength: number = 255): string {
  if (!filename || typeof filename !== 'string') {
    return 'file';
  }

  // Remove any path separators and traversal attempts
  let sanitized = filename
    .replace(/\.\./g, '') // Remove ..
    .replace(/[\/\\]/g, '') // Remove / and \
    .replace(/\0/g, '') // Remove null bytes
    .replace(/[<>:"|?*]/g, ''); // Remove invalid Windows chars

  // Remove leading dots (hidden files)
  sanitized = sanitized.replace(/^\.+/, '');

  // Limit length while preserving extension
  if (sanitized.length > maxLength) {
    const lastDot = sanitized.lastIndexOf('.');
    const extension = lastDot > 0 ? sanitized.substring(lastDot) : '';
    const baseName = sanitized.substring(0, maxLength - extension.length);
    sanitized = baseName + extension;
  }

  // Ensure we have a filename
  if (!sanitized || sanitized.length === 0) {
    return 'file';
  }

  return sanitized;
}

/**
 * Validate file upload with comprehensive checks
 */
export interface FileValidationOptions {
  maxFileSize?: number; // bytes
  allowedExtensions?: string[];
  checkMagicBytes?: boolean;
}

export interface FileValidationResult {
  isValid: boolean;
  sanitizedFilename: string;
  errors: string[];
  warnings: string[];
}

export function validateUploadedFile(
  buffer: Buffer,
  originalFilename: string,
  options: FileValidationOptions = {}
): FileValidationResult {
  const {
    maxFileSize = 50 * 1024 * 1024, // 50MB default
    allowedExtensions = ['pdf', 'html', 'htm', 'docx'],
    checkMagicBytes = true,
  } = options;

  const errors: string[] = [];
  const warnings: string[] = [];

  // Extract extension
  const dotIndex = originalFilename.lastIndexOf('.');
  const extension = dotIndex > 0 ? originalFilename.substring(dotIndex + 1).toLowerCase() : '';

  // Sanitize filename
  const sanitizedFilename = sanitizeFilename(originalFilename);

  // Validation checks
  if (buffer.length === 0) {
    errors.push('File is empty');
  }

  if (buffer.length > maxFileSize) {
    errors.push(`File size (${buffer.length} bytes) exceeds maximum (${maxFileSize} bytes)`);
  }

  if (!extension || extension.length === 0) {
    errors.push('File has no extension');
  } else if (!allowedExtensions.includes(extension)) {
    errors.push(
      `File extension .${extension} not allowed. Allowed: ${allowedExtensions.map((e) => `.${e}`).join(', ')}`
    );
  }

  // Magic byte verification
  if (checkMagicBytes && extension && allowedExtensions.includes(extension)) {
    const magicResult = verifyMagicBytes(buffer, extension);
    if (!magicResult.isValid) {
      errors.push(`Magic byte verification failed: ${magicResult.reason}`);
    }
  }

  // Filename sanitization check
  if (sanitizedFilename !== originalFilename) {
    warnings.push(`Filename sanitized: "${originalFilename}" → "${sanitizedFilename}"`);
  }

  return {
    isValid: errors.length === 0,
    sanitizedFilename,
    errors,
    warnings,
  };
}
