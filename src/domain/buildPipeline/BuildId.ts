/**
 * BuildId - Value Object für eindeutige Build-Identifizierung
 * 
 * Sichert eindeutige, unveränderliche Build-IDs
 */

import { v4 as uuidv4 } from 'uuid';

export class BuildId {
  private readonly value: string;

  private constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('BuildId value cannot be empty');
    }
    this.value = value;
  }

  /**
   * Generiert neue Build-ID
   */
  static generate(): BuildId {
    const uuid = uuidv4();
    return new BuildId(`build_${uuid}`);
  }

  /**
   * Erstellt BuildId aus existierendem Wert
   */
  static from(value: string): BuildId {
    if (!value.startsWith('build_')) {
      throw new Error('BuildId must start with "build_" prefix');
    }
    return new BuildId(value);
  }

  /**
   * Gibt Wert zurück
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Vergleicht mit anderen BuildIds
   */
  equals(other: BuildId): boolean {
    return this.value === other.value;
  }

  /**
   * String-Repräsentation
   */
  toString(): string {
    return this.value;
  }

  /**
   * Serialisierung
   */
  toJSON(): string {
    return this.value;
  }
}
