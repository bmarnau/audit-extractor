/**
 * JobId - Value Object (Immutable)
 *
 * Strongly-typed Job Identifier mit Validierung
 * Folgt Value Object Pattern: Equality basiert auf Wert, nicht Referenz
 *
 * @version 0.22.0
 * @phase 22 - Job-Based Architecture
 */

import { v4 as uuidv4 } from 'uuid';

/**
 * JobId Value Object
 * - Immutable
 * - Eindeutig in der Anwendung
 * - Kann nicht null sein
 * - Format: JOB-{uuid} oder JOB-{number}
 */
export class JobId {
  private readonly value: string;

  /**
   * Private Constructor - Nutze factory methods
   */
  private constructor(value: string) {
    this.value = value;
  }

  /**
   * Erstelle neue JobId mit UUID
   */
  static create(): JobId {
    const uuid = uuidv4().split('-')[0].toUpperCase();
    return new JobId(`JOB-${uuid}`);
  }

  /**
   * Erstelle neue JobId mit Index
   * @example JobId.createWithIndex(1) → "JOB-0001"
   */
  static createWithIndex(index: number): JobId {
    const padded = String(index).padStart(4, '0');
    return new JobId(`JOB-${padded}`);
  }

  /**
   * Rekonstruiere JobId aus existierendem String
   * @throws Error wenn Format ungültig
   */
  static fromString(value: string): JobId {
    if (!JobId.isValid(value)) {
      throw new Error(`Invalid JobId format: ${value}. Expected format: JOB-xxxx`);
    }
    return new JobId(value);
  }

  /**
   * Validiere JobId Format
   */
  static isValid(value: string): boolean {
    return /^JOB-[A-Z0-9]{4,}$/.test(value);
  }

  /**
   * Gebe Wert als String zurück
   */
  toString(): string {
    return this.value;
  }

  /**
   * Gebe Wert für JSON Serialisierung zurück
   */
  toJSON(): string {
    return this.value;
  }

  /**
   * Gebe Verzeichnisnamen zurück (z.B. "JOB-ABC1")
   */
  toDirectoryName(): string {
    return this.value;
  }

  /**
   * Vergleiche mit anderer JobId
   * Value Objects werden nach Wert verglichen
   */
  equals(other: JobId): boolean {
    if (!(other instanceof JobId)) {
      return false;
    }
    return this.value === other.value;
  }

  /**
   * Hash für Set/Map Verwendung
   */
  get hash(): string {
    return this.value;
  }
}
