/**
 * DocumentId - Value Object for unique document identification
 *
 * Encapsulates document ID logic and validation.
 * Ensures IDs follow format: DOC-{UUID}
 *
 * @version 0.23.0
 * @phase 23 - Extraction Pipeline & UnifiedDocument
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * DocumentId - Value Object
 *
 * Immutable document identifier.
 * Format: DOC-{UUID}
 */
export class DocumentId {
  private readonly value: string;

  private constructor(value: string) {
    this.validateFormat(value);
    this.value = value;
  }

  /**
   * Create new DocumentId with random UUID
   */
  static create(): DocumentId {
    const uuid = uuidv4();
    return new DocumentId(`DOC-${uuid}`);
  }

  /**
   * Create DocumentId from existing value
   *
   * @throws {Error} If format is invalid
   */
  static fromString(value: string): DocumentId {
    return new DocumentId(value);
  }

  /**
   * Get string representation
   */
  toString(): string {
    return this.value;
  }

  /**
   * Get UUID part (without DOC- prefix)
   */
  getUuid(): string {
    return this.value.replace('DOC-', '');
  }

  /**
   * Check equality
   */
  equals(other: DocumentId): boolean {
    return this.value === other.value;
  }

  /**
   * Validate DocumentId format
   *
   * @throws {Error} If format invalid
   */
  private validateFormat(value: string): void {
    if (!value || typeof value !== 'string') {
      throw new Error('DocumentId must be a non-empty string');
    }

    // Format: DOC-{UUID}
    const pattern = /^DOC-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!pattern.test(value)) {
      throw new Error(
        `Invalid DocumentId format: '${value}'. Expected: DOC-{UUID} (RFC4122 v4)`
      );
    }
  }
}
