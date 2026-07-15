/**
 * API Documentation Routes
 * 
 * Provides OpenAPI/Swagger documentation for the Audit-Safe Extractor API
 * 
 * @version 0.35.0
 * @phase 27 - Fix: Frontend /api/docs endpoint
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ApiRequest, createSuccessResponse } from './server';

const router = Router();

/**
 * GET /api/docs
 * Returns comprehensive API documentation with endpoint descriptions
 */
router.get('/', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    console.log('[Docs] Getting API documentation');

    const apiDocumentation = {
      title: 'Audit-Safe Document Extractor API',
      version: '0.34.0',
      description: 'REST API for document extraction, schema management, and audit support',
      baseUrl: 'http://localhost:3000/api',
      endpoints: [
        {
          path: '/help',
          method: 'GET',
          description: 'Get help center overview with glossary, documentation, and release notes',
          responses: { 200: 'Help overview with sections and item counts' }
        },
        {
          path: '/help/glossary',
          method: 'GET',
          description: 'Get glossary entries with filtering',
          query: { term: 'string (optional)', category: 'string (optional)' }
        },
        {
          path: '/help/documentation',
          method: 'GET',
          description: 'Get documentation items with filtering',
          query: { category: 'string (optional)' }
        },
        {
          path: '/help/manual',
          method: 'GET',
          description: 'Get manual/user guide content'
        },
        {
          path: '/schema/upload',
          method: 'POST',
          description: 'Upload and create a new schema with examples',
          body: { schema: 'object', examples: 'array', schemaName: 'string' }
        },
        {
          path: '/schema/:schemaId',
          method: 'GET',
          description: 'Get schema metadata'
        },
        {
          path: '/schemas',
          method: 'GET',
          description: 'List all schemas with pagination',
          query: { page: 'number', limit: 'number' }
        },
        {
          path: '/schema/:schemaId/rules',
          method: 'GET',
          description: 'Get extraction rules for a schema'
        },
        {
          path: '/schema/:schemaId/generate-rules',
          method: 'POST',
          description: 'Generate extraction rules from schema'
        },
        {
          path: '/health',
          method: 'GET',
          description: 'Get system health status'
        },
        {
          path: '/config',
          method: 'GET',
          description: 'Get application configuration'
        },
        {
          path: '/logs',
          method: 'GET',
          description: 'Get application logs with filtering',
          query: { level: 'string', search: 'string', limit: 'number' }
        },
        {
          path: '/backup/list',
          method: 'GET',
          description: 'List available backups'
        },
        {
          path: '/backup/create',
          method: 'POST',
          description: 'Create a new backup'
        }
      ],
      sections: {
        Help: {
          description: 'Help center, glossary, and documentation',
          baseRoute: '/api/help'
        },
        Schema: {
          description: 'Schema creation, management, and extraction rules',
          baseRoute: '/api/schema'
        },
        Health: {
          description: 'System health checks',
          baseRoute: '/api/health'
        },
        Config: {
          description: 'Configuration management',
          baseRoute: '/api/config'
        },
        Logs: {
          description: 'Application logs and monitoring',
          baseRoute: '/api/logs'
        },
        Backup: {
          description: 'Backup and recovery',
          baseRoute: '/api/backup'
        }
      }
    };

    res.json(createSuccessResponse(apiDocumentation));
  } catch (error) {
    console.error('[Docs] Error:', error);
    next(error);
  }
});

export default router;
