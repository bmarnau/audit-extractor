import { v4 as uuid } from 'uuid';

/**
 * Value Object für Test ID
 * Garantiert eindeutige, unveränderliche IDs
 */
export class TestId {
  private readonly value: string;

  private constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('TestId value cannot be empty');
    }
    this.value = value;
  }

  /**
   * Erstellt eine neue eindeutige TestId
   */
  static generate(): TestId {
    return new TestId(`test_${uuid()}`);
  }

  /**
   * Erstellt eine TestId aus einem bestehenden String
   */
  static from(value: string): TestId {
    return new TestId(value);
  }

  /**
   * Gibt den String-Wert zurück
   */
  getValue(): string {
    return this.value;
  }

  /**
   * Vergleicht zwei TestIds
   */
  equals(other: TestId): boolean {
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
