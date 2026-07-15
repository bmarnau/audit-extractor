/**
 * Schema Routes - Phase 14
 * 
 * REST API für Schema Management und automatische Regelgenerierung
 * 
 * Endpoints:
 * - POST   /api/schema/upload              - Schema + Beispiele hochladen
 * - POST   /api/schema/:schemaId/generate-rules - Regeln generieren
 * - GET    /api/schema/:schemaId           - Schema Info abrufen
 * - GET    /api/schema/:schemaId/rules     - Generierte Regeln abrufen
 * - PUT    /api/schema/:schemaId           - Schema aktualisieren
 * - DELETE /api/schema/:schemaId           - Schema löschen
 * 
 * @version 0.14.0
 * @phase 14
 */

import { Router, Response, NextFunction } from 'express';
import { ApiRequest, ApiResponseError, createSuccessResponse } from '../server';
import * as fs from 'fs/promises';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import Ajv from 'ajv';

// ESM-compatible __dirname shim
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();
const ajv = new Ajv();

// Paths
const PROJECT_ROOT = path.join(__dirname, '../../../..');
const SCHEMAS_DIR = path.join(PROJECT_ROOT, 'schemas');
const GENERATED_RULES_DIR = path.join(PROJECT_ROOT, 'extraction-rules', 'generated');

/**
 * Generate rules from schema and examples
 */
function generateRulesFromSchemaAndExamples(
  schema: any,
  examples: any[],
  aggressiveness: number = 0.6,
  customKeywords?: Record<string, string[]>
): { rules: any[]; stats: any; warnings: any[] } {
  const rules: any[] = [];
  const warnings: any[] = [];

  const properties = schema.properties || {};
  const required = schema.required || [];

  for (const [fieldName, fieldSchema] of Object.entries(properties)) {
    const field = fieldSchema as any;
    let confidence = 0.5; // Default confidence
    const searchPatterns: string[] = [];

    // 1. Custom keywords
    if (customKeywords && customKeywords[fieldName]) {
      searchPatterns.push(...customKeywords[fieldName]);
      confidence = Math.max(confidence, 0.9);
    }

    // 2. Field name pattern
    searchPatterns.push(`(?i)${fieldName}`);

    // 3. Extract examples of this field
    const exampleValues: any[] = [];
    examples.forEach((example: any) => {
      if (example[fieldName] !== undefined) {
        exampleValues.push(example[fieldName]);
      }
    });

    // 4. Create regex patterns from example values
    if (exampleValues.length > 0) {
      const uniqueValues = Array.from(new Set(exampleValues))
        .map(String)
        .filter(v => v.length > 0)
        .slice(0, 3);

      if (uniqueValues.length > 0) {
        searchPatterns.push(`\\b(${uniqueValues.map(v => v.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})\\b`);
        confidence = Math.max(confidence, 0.7);
      }
    }

    // 5. Use schema type hints
    if (field.type === 'string' && field.pattern) {
      searchPatterns.push(field.pattern);
      confidence = Math.max(confidence, 0.8);
    } else if (field.type === 'number') {
      searchPatterns.push('\\d+(\\.\\d{2})?');
      confidence = Math.max(confidence, 0.65);
    } else if (field.format === 'date') {
      searchPatterns.push('\\d{2,4}[-/]\\d{2}[-/]\\d{2,4}');
      confidence = Math.max(confidence, 0.7);
    } else if (field.enum) {
      searchPatterns.push(`(${field.enum.join('|')})`);
      confidence = Math.max(confidence, 0.85);
    }

    // 6. Adjust confidence based on aggressiveness
    confidence = Math.min(confidence, aggressiveness + 0.4);

    // Create rule
    const rule = {
      id: uuidv4().slice(0, 8),
      fieldName,
      description: field.description || `Extrahiere ${fieldName}`,
      type: field.type || 'string',
      format: field.format,
      pattern: searchPatterns.length > 0 ? searchPatterns[0] : `(?i)${fieldName}`,
      required: required.includes(fieldName),
      confidence: parseFloat(confidence.toFixed(2)),
      derivedFrom: exampleValues.length > 0 ? 'hybrid' : 'schema',
      source: `Auto-generated from schema + ${exampleValues.length} examples`,
    };

    rules.push(rule);
  }

  // Calculate statistics
  const stats = {
    totalFieldsProcessed: Object.keys(properties).length,
    rulesGenerated: rules.length,
    averageConfidence: rules.length > 0
      ? parseFloat((rules.reduce((sum, r) => sum + r.confidence, 0) / rules.length).toFixed(2))
      : 0,
    highConfidenceRules: rules.filter(r => r.confidence >= 0.8).length,
    mediumConfidenceRules: rules.filter(r => r.confidence >= 0.6 && r.confidence < 0.8).length,
    lowConfidenceRules: rules.filter(r => r.confidence < 0.6).length,
  };

  return { rules, stats, warnings };
}

/**
 * POST /api/schema/upload - Upload Schema + Beispieldaten
 */
router.post('/upload', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const { schema, examples, name, aggressiveness = 0.6 } = req.body;

    // Validation
    if (!schema || typeof schema !== 'object') {
      return next(new ApiResponseError(
        'VALIDATION_ERROR',
        400,
        'Schema is required and must be a JSON object'
      ));
    }

    if (!Array.isArray(examples) || examples.length === 0) {
      return next(new ApiResponseError(
        'VALIDATION_ERROR',
        400,
        'At least one example is required'
      ));
    }

    const schemaId = uuidv4();
    const schemaName = name || `schema-${schemaId.slice(0, 8)}`;

    // Validate schema using AJV
    const validate = ajv.compile(schema);
    const isValidSchema = validate({});

    if (!isValidSchema && validate.errors && validate.errors.length > 0) {
      console.warn('[Schema] Schema validation warnings:', validate.errors);
    }

    // Save schema to file
    const schemaPath = path.join(SCHEMAS_DIR, `${schemaId}.json`);
    const schemaMetadata = {
      id: schemaId,
      name: schemaName,
      schema,
      exampleCount: examples.length,
      uploadedAt: new Date().toISOString(),
      aggressiveness,
    };

    await fs.writeFile(schemaPath, JSON.stringify(schemaMetadata, null, 2));

    // Save examples
    const examplesPath = path.join(SCHEMAS_DIR, `${schemaId}-examples.json`);
    await fs.writeFile(examplesPath, JSON.stringify({ examples }, null, 2));

    console.log(`[Schema] Uploaded schema: ${schemaId} (${examples.length} examples)`);

    res.json(createSuccessResponse({
      schemaId,
      schemaName,
      exampleCount: examples.length,
      message: 'Schema uploaded successfully. Ready for rule generation.'
    }));
  } catch (error) {
    console.error('[Schema] Upload error:', error);
    const err = error as any;
    if (err.statusCode) return next(err);
    return next(new ApiResponseError(
      'UPLOAD_FAILED',
      500,
      'Failed to upload schema',
      { error: err.message }
    ));
  }
});

/**
 * POST /api/schema/:schemaId/generate-rules - Regeln automatisch generieren
 */
router.post('/:schemaId/generate-rules', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const { schemaId } = req.params;
    const { aggressiveness = 0.6, customKeywords = {} } = req.body;

    // Load schema
    const schemaPath = path.join(SCHEMAS_DIR, `${schemaId}.json`);
    const schemaData = JSON.parse(await fs.readFile(schemaPath, 'utf-8'));

    // Load examples
    const examplesPath = path.join(SCHEMAS_DIR, `${schemaId}-examples.json`);
    const examplesData = JSON.parse(await fs.readFile(examplesPath, 'utf-8'));

    console.log(`[Schema] Generating rules for schema: ${schemaId}`);
    console.log(`[Schema] - Aggressiveness: ${aggressiveness}`);
    console.log(`[Schema] - Examples: ${examplesData.examples.length}`);

    // Generate rules
    const { rules, stats, warnings } = generateRulesFromSchemaAndExamples(
      schemaData.schema,
      examplesData.examples,
      aggressiveness,
      customKeywords
    );

    const ruleSetId = uuidv4();

    // Save generated rules
    const rulesFileName = `${schemaId}-rules.json`;
    const rulesPath = path.join(GENERATED_RULES_DIR, rulesFileName);
    
    const rulesOutput = {
      schemaId,
      ruleSetId,
      generatedAt: new Date().toISOString(),
      aggressiveness,
      stats,
      rules,
      warnings,
    };

    await fs.mkdir(GENERATED_RULES_DIR, { recursive: true });
    await fs.writeFile(rulesPath, JSON.stringify(rulesOutput, null, 2));

    console.log(`[Schema] Generated ${rules.length} rules (avg confidence: ${stats.averageConfidence.toFixed(2)})`);

    res.json(createSuccessResponse({
      ruleSetId,
      rules,
      stats,
      warnings,
      message: `Successfully generated ${rules.length} extraction rules`
    }));
  } catch (error) {
    console.error('[Schema] Rule generation error:', error);
    const err = error as any;
    
    if (err.code === 'ENOENT') {
      return next(new ApiResponseError(
        'SCHEMA_NOT_FOUND',
        404,
        'Schema not found',
        { schemaId: req.params.schemaId }
      ));
    }

    if (err.statusCode) return next(err);
    return next(new ApiResponseError(
      'GENERATION_FAILED',
      500,
      'Failed to generate rules',
      { error: err.message }
    ));
  }
});

/**
 * GET /api/schema/:schemaId - Get schema info
 */
router.get('/:schemaId', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const { schemaId } = req.params;
    const schemaPath = path.join(SCHEMAS_DIR, `${schemaId}.json`);

    const schemaData = JSON.parse(await fs.readFile(schemaPath, 'utf-8'));
    const examplesPath = path.join(SCHEMAS_DIR, `${schemaId}-examples.json`);
    const examplesData = JSON.parse(await fs.readFile(examplesPath, 'utf-8'));

    // Check if rules were already generated
    const rulesPath = path.join(GENERATED_RULES_DIR, `${schemaId}-rules.json`);
    let generatedRules = null;
    try {
      generatedRules = JSON.parse(await fs.readFile(rulesPath, 'utf-8'));
    } catch {
      // Rules not yet generated
    }

    res.json(createSuccessResponse({
      schemaId,
      name: schemaData.name,
      schema: schemaData.schema,
      exampleCount: examplesData.examples.length,
      uploadedAt: schemaData.uploadedAt,
      generatedRules: generatedRules ? {
        ruleSetId: generatedRules.ruleSetId,
        ruleCount: generatedRules.rules.length,
        averageConfidence: generatedRules.stats.averageConfidence,
        generatedAt: generatedRules.generatedAt,
      } : null,
    }));
  } catch (error) {
    console.error('[Schema] Get schema error:', error);
    const err = error as any;
    
    if (err.code === 'ENOENT') {
      return next(new ApiResponseError(
        'SCHEMA_NOT_FOUND',
        404,
        'Schema not found',
        { schemaId: req.params.schemaId }
      ));
    }

    return next(new ApiResponseError(
      'GET_FAILED',
      500,
      'Failed to get schema',
      { error: err.message }
    ));
  }
});

/**
 * GET /api/schema/:schemaId/rules - Get generated rules
 */
router.get('/:schemaId/rules', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const { schemaId } = req.params;
    const rulesPath = path.join(GENERATED_RULES_DIR, `${schemaId}-rules.json`);

    const rulesData = JSON.parse(await fs.readFile(rulesPath, 'utf-8'));

    res.json(createSuccessResponse({
      ruleSetId: rulesData.generatedRuleSetId,
      rules: rulesData.rules,
      stats: rulesData.stats,
      warnings: rulesData.warnings,
      generatedAt: rulesData.generatedAt,
    }));
  } catch (error) {
    console.error('[Schema] Get rules error:', error);
    const err = error as any;
    
    if (err.code === 'ENOENT') {
      return next(new ApiResponseError(
        'RULES_NOT_FOUND',
        404,
        'No generated rules found for this schema. Please generate rules first.',
        { schemaId: req.params.schemaId }
      ));
    }

    return next(new ApiResponseError(
      'GET_RULES_FAILED',
      500,
      'Failed to get rules',
      { error: err.message }
    ));
  }
});

/**
 * DELETE /api/schema/:schemaId - Delete schema
 */
router.delete('/:schemaId', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const { schemaId } = req.params;

    // Delete schema file
    const schemaPath = path.join(SCHEMAS_DIR, `${schemaId}.json`);
    await fs.unlink(schemaPath);

    // Delete examples file
    const examplesPath = path.join(SCHEMAS_DIR, `${schemaId}-examples.json`);
    await fs.unlink(examplesPath);

    // Delete generated rules if they exist
    const rulesPath = path.join(GENERATED_RULES_DIR, `${schemaId}-rules.json`);
    try {
      await fs.unlink(rulesPath);
    } catch {
      // Rules might not exist yet
    }

    console.log(`[Schema] Deleted schema: ${schemaId}`);

    res.json(createSuccessResponse({
      message: 'Schema deleted successfully'
    }));
  } catch (error) {
    console.error('[Schema] Delete error:', error);
    const err = error as any;
    
    if (err.code === 'ENOENT') {
      return next(new ApiResponseError(
        'SCHEMA_NOT_FOUND',
        404,
        'Schema not found',
        { schemaId: req.params.schemaId }
      ));
    }

    return next(new ApiResponseError(
      'DELETE_FAILED',
      500,
      'Failed to delete schema',
      { error: err.message }
    ));
  }
});

export default router;
