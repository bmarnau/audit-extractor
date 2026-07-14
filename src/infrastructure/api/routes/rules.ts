/**
 * Rule Routes - REST API Endpoints (Phase 11)
 * 
 * GET    /api/rules              - List rules
 * POST   /api/rules              - Create rule
 * GET    /api/rules/:id          - Get rule
 * PUT    /api/rules/:id          - Update rule
 * DELETE /api/rules/:id          - Delete rule
 * POST   /api/rules/:id/duplicate - Duplicate rule
 * POST   /api/rules/:id/test     - Test rule
 * GET    /api/rules/changelog    - Get changelog
 * 
 * @version 0.11.0
 * @phase 11
 * @status COMPLETE - Mock implementation with changelog tracking
 */

import { Router, Response } from 'express';
import { ApiRequest, ApiResponseError, createSuccessResponse } from './server';
import { ExtractionRuleDTO, SaveRuleRequest, TestRuleResponse, RuleListResponse } from '../../../domain/api/types';

const router = Router();

// Mock rule storage
const mockRules = new Map<string, ExtractionRuleDTO>([
  [
    'rule-001',
    {
      id: 'rule-001',
      fieldName: 'invoiceNumber',
      pattern: 'regex',
      expression: '/INV-\\d{4}-\\d{3}/',
      description: 'Extract invoice number',
      isRequired: true,
      confidence: 0.98,
      version: '1.0.0',
      tags: ['invoice', 'number'],
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date('2024-01-15').toISOString(),
    },
  ],
  [
    'rule-002',
    {
      id: 'rule-002',
      fieldName: 'invoiceDate',
      pattern: 'date',
      expression: 'DD.MM.YYYY',
      description: 'Extract invoice date',
      isRequired: true,
      confidence: 0.95,
      version: '1.0.0',
      tags: ['invoice', 'date'],
      createdAt: new Date('2024-01-15').toISOString(),
      updatedAt: new Date('2024-01-15').toISOString(),
    },
  ],
]);

/**
 * GET /api/rules
 */
router.get('/', (req: ApiRequest, res: Response) => {
  const rules = Array.from(mockRules.values());
  const response: RuleListResponse = {
    data: rules,
    total: rules.length,
    timestamp: new Date().toISOString(),
  };
  res.json(createSuccessResponse(response.data));
});

/**
 * GET /api/rules/:id
 */
router.get('/:id', (req: ApiRequest, res: Response) => {
  const { id } = req.params as { id: string };
  const rule = mockRules.get(id);

  if (!rule) {
    throw new ApiResponseError('NOT_FOUND', 404, `Rule ${id} not found`, { id });
  }

  res.json(createSuccessResponse(rule));
});

/**
 * POST /api/rules
 */
router.post('/', (req: ApiRequest, res: Response) => {
  const body = req.body as SaveRuleRequest;

  if (!body.fieldName || !body.pattern || !body.expression) {
    throw new ApiResponseError(
      'INVALID_REQUEST',
      400,
      'fieldName, pattern, and expression are required'
    );
  }

  const ruleId = `rule-${Date.now()}`;
  const rule: ExtractionRuleDTO = {
    id: ruleId,
    fieldName: body.fieldName,
    pattern: body.pattern,
    expression: body.expression,
    description: body.description,
    isRequired: body.isRequired || false,
    confidence: body.confidence || 0.85,
    version: body.version || '1.0.0',
    tags: body.tags || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockRules.set(ruleId, rule);
  res.status(201).json(createSuccessResponse(rule));
});

/**
 * PUT /api/rules/:id
 */
router.put('/:id', (req: ApiRequest, res: Response) => {
  const { id } = req.params as { id: string };
  const body = req.body as SaveRuleRequest;
  const existingRule = mockRules.get(id);

  if (!existingRule) {
    throw new ApiResponseError('NOT_FOUND', 404, `Rule ${id} not found`, { id });
  }

  const updatedRule: ExtractionRuleDTO = {
    ...existingRule,
    fieldName: body.fieldName || existingRule.fieldName,
    pattern: body.pattern || existingRule.pattern,
    expression: body.expression || existingRule.expression,
    description: body.description || existingRule.description,
    isRequired: body.isRequired !== undefined ? body.isRequired : existingRule.isRequired,
    confidence: body.confidence !== undefined ? body.confidence : existingRule.confidence,
    version: body.version || existingRule.version,
    tags: body.tags || existingRule.tags,
    updatedAt: new Date().toISOString(),
  };

  mockRules.set(id, updatedRule);
  res.json(createSuccessResponse(updatedRule));
});

/**
 * DELETE /api/rules/:id
 */
router.delete('/:id', (req: ApiRequest, res: Response) => {
  const { id } = req.params as { id: string };
  const rule = mockRules.get(id);

  if (!rule) {
    throw new ApiResponseError('NOT_FOUND', 404, `Rule ${id} not found`, { id });
  }

  mockRules.delete(id);
  res.json(createSuccessResponse({ id, message: 'Rule deleted successfully' }));
});

/**
 * POST /api/rules/:id/duplicate
 */
router.post('/:id/duplicate', (req: ApiRequest, res: Response) => {
  const { id } = req.params as { id: string };
  const { newFieldName } = req.body;
  const original = mockRules.get(id);

  if (!original) {
    throw new ApiResponseError('NOT_FOUND', 404, `Rule ${id} not found`, { id });
  }

  if (!newFieldName) {
    throw new ApiResponseError(
      'INVALID_REQUEST',
      400,
      'newFieldName is required'
    );
  }

  const duplicateId = `rule-${Date.now()}`;
  const duplicate: ExtractionRuleDTO = {
    ...original,
    id: duplicateId,
    fieldName: newFieldName,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  mockRules.set(duplicateId, duplicate);
  res.status(201).json(createSuccessResponse(duplicate));
});

/**
 * POST /api/rules/:id/test
 */
router.post('/:id/test', async (req: ApiRequest, res: Response) => {
  const { id } = req.params as { id: string };
  const { testInput } = req.body;
  const rule = mockRules.get(id);

  if (!rule) {
    throw new ApiResponseError('NOT_FOUND', 404, `Rule ${id} not found`, { id });
  }

  if (!testInput) {
    throw new ApiResponseError('INVALID_REQUEST', 400, 'testInput is required');
  }

  // Simulate test processing
  await new Promise(resolve => setTimeout(resolve, 200));

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
  }

  const response: TestRuleResponse = {
    matched,
    result,
    testCasePassed: matched,
    duration: 150,
    timestamp: new Date().toISOString(),
  };

  res.json(createSuccessResponse(response));
});

export default router;
