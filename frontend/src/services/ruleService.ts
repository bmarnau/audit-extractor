/**
 * Mock Rule Service
 * 
 * Verwaltet Extraktionsregeln aus extraction-rules/
 */

export interface TestCase {
  input: string;
  expectedOutput: string;
  passed?: boolean;
}

export interface ExtractionRule {
  id: string;
  fieldName: string;
  pattern: 'regex' | 'keyword' | 'date' | 'custom';
  expression: string;
  description: string;
  isRequired: boolean;
  confidence: number;
  testCases: TestCase[];
  createdAt: Date;
  updatedAt: Date;
  version: string;
  tags?: string[];
}

export interface ChangeLogEntry {
  id: string;
  ruleId: string;
  action: 'created' | 'updated' | 'deleted' | 'duplicated' | 'tested';
  timestamp: Date;
  changes?: Record<string, unknown>;
  userId?: string;
  description: string;
}

class RuleService {
  private rules: Map<string, ExtractionRule> = new Map();
  private changelog: ChangeLogEntry[] = [];
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.initializeMockRules();
  }

  /**
   * Initialisiert Mock-Regeln.
   */
  private initializeMockRules(): void {
    const mockRules: ExtractionRule[] = [
      {
        id: 'rule-001',
        fieldName: 'invoiceNumber',
        pattern: 'regex',
        expression: '/INV-\\d{4}-\\d{3}/',
        description: 'Extract invoice number',
        isRequired: true,
        confidence: 0.98,
        testCases: [
          {
            input: 'Rechnung Nr. INV-2024-001',
            expectedOutput: 'INV-2024-001',
            passed: true,
          },
        ],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        version: '1.0.0',
        tags: ['invoice', 'number'],
      },
      {
        id: 'rule-002',
        fieldName: 'invoiceDate',
        pattern: 'date',
        expression: 'DD.MM.YYYY',
        description: 'Extract invoice date',
        isRequired: true,
        confidence: 0.95,
        testCases: [
          {
            input: 'Datum: 15.01.2024',
            expectedOutput: '15.01.2024',
            passed: true,
          },
        ],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        version: '1.0.0',
        tags: ['invoice', 'date'],
      },
      {
        id: 'rule-003',
        fieldName: 'customerName',
        pattern: 'keyword',
        expression: 'Kunde:',
        description: 'Extract customer name',
        isRequired: true,
        confidence: 0.92,
        testCases: [],
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
        version: '1.0.0',
        tags: ['customer'],
      },
    ];

    mockRules.forEach((rule) => {
      this.rules.set(rule.id, rule);
      this.logChange('created', rule.id, `Rule ${rule.fieldName} created`, rule as unknown as Record<string, unknown>);
    });
  }

  /**
   * Listet alle Regeln auf.
   */
  async listRules(): Promise<ExtractionRule[]> {
    await this.delay(200);
    return Array.from(this.rules.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  /**
   * Holt eine Regel.
   */
  async getRule(id: string): Promise<ExtractionRule | null> {
    await this.delay(100);
    return this.rules.get(id) || null;
  }

  /**
   * Speichert eine Regel.
   */
  async saveRule(rule: ExtractionRule): Promise<ExtractionRule> {
    await this.delay(300);

    const existingRule = this.rules.get(rule.id);
    const action = existingRule ? 'updated' : 'created';

    rule.updatedAt = new Date();
    this.rules.set(rule.id, rule);

    this.logChange(
      action as 'created' | 'updated',
      rule.id,
      `Rule ${rule.fieldName} ${action}`,
      rule as unknown as Record<string, unknown>
    );

    this.notifyListeners();
    return rule;
  }

  /**
   * Dupliziert eine Regel.
   */
  async duplicateRule(id: string, newName: string): Promise<ExtractionRule> {
    await this.delay(250);

    const original = this.rules.get(id);
    if (!original) {
      throw new Error(`Rule ${id} not found`);
    }

    const duplicate: ExtractionRule = {
      ...original,
      id: `rule-${Date.now()}`,
      fieldName: newName,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: '1.0.0',
    };

    this.rules.set(duplicate.id, duplicate);
    this.logChange(
      'duplicated',
      duplicate.id,
      `Rule duplicated from ${original.fieldName}`,
      duplicate as unknown as Record<string, unknown>
    );

    this.notifyListeners();
    return duplicate;
  }

  /**
   * Testet eine Regel.
   */
  async testRule(ruleId: string, testInput: string): Promise<{
    matched: boolean;
    result: string | null;
    testCasePassed: boolean;
  }> {
    await this.delay(400);

    const rule = this.rules.get(ruleId);
    if (!rule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    // Simuliere verschiedene Pattern-Typen
    let matched = false;
    let result: string | null = null;

    switch (rule.pattern) {
      case 'regex': {
        const regexMatch = testInput.match(new RegExp(rule.expression.slice(1, -1)));
        matched = !!regexMatch;
        result = regexMatch ? regexMatch[0] : null;
        break;
      }
      case 'keyword': {
        matched = testInput.includes(rule.expression);
        result = matched ? rule.expression : null;
        break;
      }
      case 'date': {
        matched = /\d{2}\.\d{2}\.\d{4}/.test(testInput);
        result = matched ? testInput.match(/\d{2}\.\d{2}\.\d{4}/)?.[0] || null : null;
        break;
      }
      case 'custom': {
        matched = testInput.length > 0;
        result = matched ? testInput : null;
        break;
      }
    }

    const testCasePassed = matched;

    this.logChange(
      'tested',
      ruleId,
      `Rule tested with input: "${testInput}"`,
      { input: testInput, matched, result }
    );

    return { matched, result, testCasePassed };
  }

  /**
   * Löscht eine Regel.
   */
  async deleteRule(id: string): Promise<void> {
    await this.delay(200);
    const rule = this.rules.get(id);
    if (rule) {
      this.rules.delete(id);
      this.logChange('deleted', id, `Rule ${rule.fieldName} deleted`, {});
      this.notifyListeners();
    }
  }

  /**
   * Holt Changelog.
   */
  async getChangelog(ruleId?: string): Promise<ChangeLogEntry[]> {
    await this.delay(100);
    if (ruleId) {
      return this.changelog.filter((entry) => entry.ruleId === ruleId);
    }
    return this.changelog.slice().reverse();
  }

  /**
   * Loggt eine Änderung.
   */
  private logChange(
    action: 'created' | 'updated' | 'deleted' | 'duplicated' | 'tested',
    ruleId: string,
    description: string,
    changes?: Record<string, unknown>
  ): void {
    this.changelog.push({
      id: `log-${Date.now()}`,
      ruleId,
      action,
      timestamp: new Date(),
      changes,
      userId: 'current-user',
      description,
    });
  }

  /**
   * Registriert Listener.
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Benachrichtigt Listener.
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * Verzögerung simulieren.
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export const ruleService = new RuleService();
