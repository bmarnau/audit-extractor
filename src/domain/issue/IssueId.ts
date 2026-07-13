import { v4 as uuid } from 'uuid';

/**
 * Value Object für Issue ID
 * Garantiert eindeutige, unveränderliche IDs
 */
export class IssueId {
  private readonly value: string;

  private constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('IssueId value cannot be empty');
    }
    this.value = value;
  }

  /**
   * Erstellt eine neue eindeutige IssueId
   */
  static generate(): IssueId {
    return new IssueId(uuid());
  }

  /**
   * Erstellt eine IssueId aus einem bestehenden String
   */
  static from(value: string): IssueId {
    return new IssueId(value);
  }

  /**
   * Gibt den String-Wert zurück
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Vergleicht zwei IssueIds
   */
  equals(other: IssueId): boolean {
    return this.value === other.value;
  }

  /**
   * String-Darstellung
   */
  toString(): string {
    return this.value;
  }

  /**
   * JSON-Serialisierung
   */
  toJSON(): string {
    return this.value;
  }
}
