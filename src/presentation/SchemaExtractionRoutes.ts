/**
 * Phase 15: Schema-Driven Rule Generation
 * 
 * Endpoints:
 * 1. POST /api/schema/upload - Upload schema + examples
 * 2. POST /api/schema/:schemaId/generate-rules - Generate extraction rules
 * 3. GET /api/schema/:schemaId - Get schema metadata
 * 4. GET /api/schema/:schemaId/rules - Get generated rules
 * 5. DELETE /api/schema/:schemaId - Delete schema + rules
 */

import { Router, Request, Response } from 'express';
import { container } from 'tsyringe';
import { RuleGenerator } from '../application/rule-generation/RuleGenerator';
import { SchemaAnalyzer } from '../domain/schema/SchemaAnalyzer';
import { ExampleAnalyzer } from '../domain/schema/ExampleAnalyzer';
import { v4 as uuidv4 } from 'uuid';

// In-memory storage for Phase 15 (will migrate to PostgreSQL in Phase 16)
const schemaStore = new Map<
  string,
  {
    schemaId: string;
    schema: any;
    uploadedAt: Date;
    examples: any[];
    generatedRules?: any;
    stats?: any;
  }
>();

export const createSchemaExtractionRoutes = (): Router => {
  const router = Router();

  let ruleGenerator: RuleGenerator;
  let schemaAnalyzer: SchemaAnalyzer;
  let exampleAnalyzer: ExampleAnalyzer;

  try {
    ruleGenerator = container.resolve(RuleGenerator);
    schemaAnalyzer = container.resolve(SchemaAnalyzer);
    exampleAnalyzer = container.resolve(ExampleAnalyzer);
  } catch (err) {
    console.error('[SchemaExtractionRoutes] Error resolving services:', err);
    throw err;
  }

  /**
   * POST /api/schema/upload
   * Upload JSON schema + example files
   */
  router.post('/upload', async (req: Request, res: Response): Promise<any> => {
    try {
      const { schema, examples, schemaName } = req.body;

      if (!schema) {
        return res.status(400).json({ error: 'Schema is required' });
      }

      // Validate schema is valid JSON
      if (typeof schema !== 'object') {
        return res.status(400).json({ error: 'Schema must be a valid JSON object' });
      }

      const schemaId = uuidv4();
      const exampleArray = examples || [];

      // Store schema
      schemaStore.set(schemaId, {
        schemaId,
        schema,
        uploadedAt: new Date(),
        examples: exampleArray,
      });

      res.status(201).json({
        schemaId,
        schemaName: schemaName || 'Unnamed Schema',
        fieldsCount: Object.keys(schema.properties || {}).length,
        examplesCount: exampleArray.length,
        uploadedAt: new Date(),
        message: 'Schema uploaded successfully',
      });
      return;
    } catch (err) {
      console.error('[SchemaExtractionRoutes] Upload error:', err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  /**
   * POST /api/schema/:schemaId/generate-rules
   * Generate extraction rules from schema + examples
   */
  router.post('/:schemaId/generate-rules', async (req: Request, res: Response): Promise<any> => {
    try {
      const schemaId = Array.isArray(req.params.schemaId) ? req.params.schemaId[0] : req.params.schemaId;
      const { aggressiveness = 0.5, customKeywords = {} } = req.body;

      const schemaData = schemaStore.get(schemaId);
      if (!schemaData) {
        return res.status(404).json({ error: 'Schema not found' });
      }

      // Analyze schema
      const schemaAnalysisResult = schemaAnalyzer.analyzeSchema(schemaData.schema);
      const schemaFields = schemaAnalysisResult.fields;

      // Analyze examples
      let characteristics: any[] = [];
      if (schemaData.examples.length > 0) {
        const exampleAnalysisResult = exampleAnalyzer.analyzeExamples(
          schemaData.examples,
          schemaFields
        );
        characteristics = exampleAnalysisResult.fieldCharacteristics;
      }

      // Generate rules
      const result = ruleGenerator.generateRules({
        schemaId,
        schemaFields,
        exampleCharacteristics: characteristics,
        aggressiveness,
        customKeywords,
      });

      // Store generated rules
      schemaStore.set(schemaId, {
        ...schemaData,
        generatedRules: result.rules,
        stats: result.stats,
      });

      res.status(200).json({
        ruleSetId: result.ruleSetId,
        rulesGenerated: result.stats?.rulesGenerated || 0,
        averageConfidence: (result.stats?.averageConfidence || 0).toFixed(2),
        stats: result.stats,
        warnings: result.warnings,
        generatedAt: new Date(),
        rules: result.rules.slice(0, 10), // Return first 10 for preview
        totalRules: result.rules.length,
      });
      return;
    } catch (err) {
      console.error('[SchemaExtractionRoutes] Rule generation error:', err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  /**
   * GET /api/schema/:schemaId
   * Get schema metadata
   */
  router.get('/:schemaId', async (req: Request, res: Response): Promise<any> => {
    try {
      const schemaId = Array.isArray(req.params.schemaId) ? req.params.schemaId[0] : req.params.schemaId;

      const schemaData = schemaStore.get(schemaId);
      if (!schemaData) {
        return res.status(404).json({ error: 'Schema not found' });
      }

      res.status(200).json({
        schemaId,
        fieldsCount: Object.keys(schemaData.schema.properties || {}).length,
        examplesCount: schemaData.examples.length,
        uploadedAt: schemaData.uploadedAt,
        hasGeneratedRules: !!schemaData.generatedRules,
        stats: schemaData.stats || null,
        schema: schemaData.schema,
      });
      return;
    } catch (err) {
      console.error('[SchemaExtractionRoutes] Get schema error:', err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  /**
   * GET /api/schema/:schemaId/rules
   * Get all generated rules
   */
  router.get('/:schemaId/rules', async (req: Request, res: Response): Promise<any> => {
    try {
      const schemaId = Array.isArray(req.params.schemaId) ? req.params.schemaId[0] : req.params.schemaId;

      const schemaData = schemaStore.get(schemaId);
      if (!schemaData) {
        return res.status(404).json({ error: 'Schema not found' });
      }

      if (!schemaData.generatedRules) {
        return res.status(400).json({ error: 'No rules generated yet. Run generation first.' });
      }

      res.status(200).json({
        rules: schemaData.generatedRules,
        ruleCount: schemaData.generatedRules.length,
        stats: schemaData.stats,
        generatedAt: new Date(),
      });
      return;
    } catch (err) {
      console.error('[SchemaExtractionRoutes] Get rules error:', err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  /**
   * DELETE /api/schema/:schemaId
   * Delete schema + rules
   */
  router.delete('/:schemaId', async (req: Request, res: Response): Promise<any> => {
    try {
      const schemaId = Array.isArray(req.params.schemaId) ? req.params.schemaId[0] : req.params.schemaId;

      if (!schemaStore.has(schemaId)) {
        return res.status(404).json({ error: 'Schema not found' });
      }

      schemaStore.delete(schemaId);

      res.status(200).json({
        message: 'Schema deleted successfully',
        schemaId,
      });
      return;
    } catch (err) {
      console.error('[SchemaExtractionRoutes] Delete error:', err);
      res.status(500).json({ error: (err as Error).message });
    }
  });

  return router;
};
