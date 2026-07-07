/**
 * Swagger/OpenAPI 3.0 Specification for Phase 14 API
 * Auto-generated documentation for extraction, versioning, and learning endpoints
 * 
 * Usage:
 *   import swaggerDef from '@/config/swagger-def'
 *   // Serve with swagger-ui-express or SwaggerUI React
 */

export const swaggerDef = {
  openapi: '3.0.0',
  info: {
    title: 'Audit-Safe Document Extraction API',
    version: '0.14.0',
    description: 'Rules-driven document extraction with AI-powered learning feedback',
    contact: {
      name: 'Audit-Safe Team',
      url: 'https://audit-safe.com',
    },
    license: {
      name: 'Proprietary',
      url: 'https://audit-safe.com/license',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: 'Development server',
    },
    {
      url: 'https://api.audit-extractor.app',
      description: 'Production server',
    },
  ],
  paths: {
    '/api/extract/pdf': {
      post: {
        summary: 'Extract fields from PDF document',
        tags: ['Extraction - Phase 14a'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'PDF file to extract',
                  },
                  docType: {
                    type: 'string',
                    enum: ['invoice', 'receipt', 'purchase_order', 'contract'],
                    description: 'Document type for rule selection',
                  },
                },
                required: ['file', 'docType'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Extraction successful',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ExtractionResponse',
                },
              },
            },
          },
          400: {
            description: 'Invalid request',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/extract/html': {
      post: {
        summary: 'Extract fields from HTML document',
        tags: ['Extraction - Phase 14a'],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: {
                  file: {
                    type: 'string',
                    format: 'binary',
                    description: 'HTML file to extract',
                  },
                  docType: {
                    type: 'string',
                    description: 'Document type for rule selection',
                  },
                },
                required: ['file', 'docType'],
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Extraction successful',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ExtractionResponse' },
              },
            },
          },
        },
      },
    },
    '/api/extract/rules': {
      get: {
        summary: 'Get all extraction rules',
        tags: ['Extraction - Phase 14a'],
        responses: {
          200: {
            description: 'Rules retrieved',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/Rule' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/extract/rules/{docType}': {
      get: {
        summary: 'Get rules for specific document type',
        tags: ['Extraction - Phase 14a'],
        parameters: [
          {
            name: 'docType',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Rules for document type',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RuleSet' },
              },
            },
          },
        },
      },
      put: {
        summary: 'Update extraction rules for document type',
        tags: ['Rule Management - Phase 14b'],
        parameters: [
          {
            name: 'docType',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/UpdateRulesRequest' },
            },
          },
        },
        responses: {
          200: { description: 'Rules updated' },
          400: {
            description: 'Invalid rules',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ErrorResponse' },
              },
            },
          },
        },
      },
    },
    '/api/extract/rules/{docType}/test-batch': {
      post: {
        summary: 'Run batch tests on new rules',
        tags: ['Rule Management - Phase 14b'],
        parameters: [
          {
            name: 'docType',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  testSamples: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/TestSample' },
                  },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Batch test results',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/TestResult' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/extract/extraction/{resultId}/feedback': {
      post: {
        summary: 'Submit user feedback on extraction results',
        tags: ['Learning - Phase 14c'],
        parameters: [
          {
            name: 'resultId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  docType: { type: 'string' },
                  fieldFeedback: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/FieldFeedback' },
                  },
                  userEmail: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Feedback recorded',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        feedbackRecorded: { type: 'integer' },
                        resultId: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/extract/extraction/{resultId}/suggestions': {
      get: {
        summary: 'Get AI-powered improvement suggestions',
        tags: ['Learning - Phase 14c'],
        parameters: [
          {
            name: 'resultId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
          {
            name: 'docType',
            in: 'query',
            required: true,
            schema: { type: 'string' },
          },
        ],
        responses: {
          200: {
            description: 'Suggestions generated',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        suggestions: {
                          type: 'array',
                          items: { $ref: '#/components/schemas/Suggestion' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    '/api/extract/rules/{docType}/improve': {
      post: {
        summary: 'Apply improvement suggestions to rules',
        tags: ['Learning - Phase 14c'],
        parameters: [
          {
            name: 'docType',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  suggestions: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Suggestion' },
                  },
                  applyAll: { type: 'boolean' },
                },
              },
            },
          },
        },
        responses: {
          200: {
            description: 'Suggestions applied',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    data: {
                      type: 'object',
                      properties: {
                        suggestionsApplied: { type: 'integer' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      ExtractionResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              resultId: { type: 'string' },
              docType: { type: 'string' },
              extractedFields: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    field: { type: 'string' },
                    value: { type: 'string' },
                    confidence: { type: 'number', minimum: 0, maximum: 1 },
                  },
                },
              },
            },
          },
          timestamp: { type: 'string', format: 'date-time' },
          duration: { type: 'number', description: 'Processing time in ms' },
        },
      },
      Rule: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          pattern: { type: 'string', description: 'Regex pattern' },
          confidence: { type: 'number' },
        },
      },
      RuleSet: {
        type: 'object',
        properties: {
          docType: { type: 'string' },
          rules: { type: 'array', items: { $ref: '#/components/schemas/Rule' } },
          version: { type: 'string' },
        },
      },
      FieldFeedback: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          correctedValue: { type: 'string' },
          issue: {
            type: 'string',
            enum: ['WRONG_VALUE', 'MISSING', 'FALSE_POSITIVE', 'LOW_CONFIDENCE'],
          },
          severity: {
            type: 'string',
            enum: ['critical', 'high', 'medium', 'low'],
          },
          notes: { type: 'string' },
        },
      },
      Suggestion: {
        type: 'object',
        properties: {
          field: { type: 'string' },
          currentPattern: { type: 'string' },
          suggestedPattern: { type: 'string' },
          reason: { type: 'string' },
          confidence: { type: 'number', minimum: 0, maximum: 1 },
          estimatedImprovement: { type: 'number' },
        },
      },
      TestSample: {
        type: 'object',
        properties: {
          sampleId: { type: 'string' },
          content: { type: 'string' },
          expectedValue: { type: 'string' },
        },
      },
      TestResult: {
        type: 'object',
        properties: {
          sampleId: { type: 'string' },
          status: {
            type: 'string',
            enum: ['SAME', 'IMPROVED', 'REGRESSED', 'FIXED', 'BROKEN'],
          },
          improvement: { type: 'number' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', enum: [false] },
          error: { type: 'string' },
          timestamp: { type: 'string', format: 'date-time' },
        },
      },
      UpdateRulesRequest: {
        type: 'object',
        properties: {
          rules: { type: 'array', items: { $ref: '#/components/schemas/Rule' } },
          changeReason: { type: 'string' },
          owner: { type: 'string' },
        },
      },
    },
  },
  tags: [
    {
      name: 'Extraction - Phase 14a',
      description: 'Core PDF/HTML extraction endpoints',
    },
    {
      name: 'Rule Management - Phase 14b',
      description: 'Rule versioning, batch testing, and deployment',
    },
    {
      name: 'Learning - Phase 14c',
      description: 'Feedback collection and AI-powered improvements',
    },
  ],
};

export default swaggerDef;
