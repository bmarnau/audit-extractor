/**
 * ExtractionFieldName - Strongly typed field name
 * Verhindert fehlerhafte String-Eingaben
 */
export class ExtractionFieldName {
  constructor(readonly value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('Field name cannot be empty');
    }
    if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
      throw new Error('Field name must be valid identifier');
    }
  }

  toString(): string {
    return this.value;
  }

  equals(other: ExtractionFieldName): boolean {
    return this.value === other.value;
  }
}
