import * as fs from 'fs';
import * as path from 'path';
import { ExtractionRule } from '@domain/ExtractionRule';
import { ExtractionFieldName } from '@domain/ExtractionFieldName';

/**
 * RuleSetRepository - Lädt und verwaltet Extraktions-Regeln
 */
export class RuleSetRepository {
  constructor(private readonly rulesDir: string = './extraction-rules') {
    this.ensureDirectory(this.rulesDir);
  }

  loadRuleSet(name: string): ExtractionRule[] {
    const filePath = path.join(this.rulesDir, `${name}.json`);

    if (!fs.existsSync(filePath)) {
      throw new Error(`RuleSet not found: ${name}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const rules = JSON.parse(content);

    return rules.map((rule: any) => ({
      ruleId: rule.ruleId,
      fieldName: new ExtractionFieldName(rule.fieldName),
      description: rule.description,
      fieldType: rule.fieldType,
      isRequired: rule.isRequired,
      constraints: rule.constraints,
      documentTypes: rule.documentTypes
    }));
  }

  saveRuleSet(name: string, rules: ExtractionRule[]): void {
    const filePath = path.join(this.rulesDir, `${name}.json`);

    const payload = rules.map((rule) => ({
      ruleId: rule.ruleId,
      fieldName: rule.fieldName.toString(),
      description: rule.description,
      fieldType: rule.fieldType,
      isRequired: rule.isRequired,
      constraints: rule.constraints,
      documentTypes: rule.documentTypes
    }));

    fs.writeFileSync(filePath, JSON.stringify(payload, null, 2), 'utf-8');
  }

  listRuleSets(): string[] {
    if (!fs.existsSync(this.rulesDir)) {
      return [];
    }
    return fs
      .readdirSync(this.rulesDir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => f.replace('.json', ''));
  }

  private ensureDirectory(dir: string): void {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }
}
