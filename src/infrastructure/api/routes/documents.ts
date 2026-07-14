/**
 * Document Routes - REST API Endpoints (Phase 11)
 * 
 * GET    /api/documents           - List documents
 * POST   /api/documents/upload    - Upload document
 * GET    /api/documents/:id       - Get document info
 * DELETE /api/documents/:id       - Delete document
 * 
 * @version 0.11.0
 * @phase 11
 * @status COMPLETE - Mock implementation ready for domain integration
 */

import { Router, Response } from 'express';
import path from 'path';
import fs from 'fs/promises';
import { ApiRequest, ApiResponseError, createSuccessResponse } from './server';
import { DocumentMetadata, DocumentListResponse } from '../../../domain/api/types';

const router = Router();

// Mock document storage (in production, use a database)
const mockDocuments = new Map<string, DocumentMetadata>([
  [
    'doc-001',
    {
      id: 'doc-001',
      filename: 'invoice-2024-01.pdf',
      format: 'pdf',
      size: 245600,
      uploadedAt: new Date('2024-01-15').toISOString(),
      status: 'completed',
      confidence: 0.94,
      pages: 1,
    },
  ],
  [
    'doc-002',
    {
      id: 'doc-002',
      filename: 'contract-sample.docx',
      format: 'docx',
      size: 156300,
      uploadedAt: new Date('2024-01-20').toISOString(),
      status: 'completed',
      confidence: 0.87,
      pages: 3,
    },
  ],
]);

/**
 * GET /api/documents
 * List all documents
 */
router.get('/', (req: ApiRequest, res: Response) => {
  const documents = Array.from(mockDocuments.values()).sort(
    (a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
  );

  const response: DocumentListResponse = {
    data: documents,
    total: documents.length,
    timestamp: new Date().toISOString(),
  };

  res.json(createSuccessResponse(response.data));
});

/**
 * GET /api/documents/:id
 * Get document metadata
 */
router.get('/:id', (req: ApiRequest, res: Response) => {
  const { id } = req.params as { id: string };
  const doc = mockDocuments.get(id);

  if (!doc) {
    throw new ApiResponseError(
      'NOT_FOUND',
      404,
      `Document ${id} not found`,
      { id }
    );
  }

  res.json(createSuccessResponse(doc));
});

/**
 * POST /api/documents/upload
 * Upload a new document
 */
router.post('/upload', async (req: ApiRequest, res: Response) => {
  const { filename, format, content } = req.body as Record<string, unknown>;

  if (!filename || !format) {
    throw new ApiResponseError(
      'INVALID_REQUEST',
      400,
      'filename and format are required'
    );
  }

  if (!['pdf', 'docx', 'html'].includes(format as string)) {
    throw new ApiResponseError(
      'INVALID_FORMAT',
      400,
      'format must be pdf, docx, or html',
      { allowedFormats: ['pdf', 'docx', 'html'] }
    );
  }

  // Simulate file processing delay
  await new Promise(resolve => setTimeout(resolve, 300));

  const docId = `doc-${Date.now()}`;
  const doc: DocumentMetadata = {
    id: docId,
    filename: filename as string,
    format: format as 'pdf' | 'docx' | 'html',
    size: typeof content === 'string' ? content.length : 0,
    uploadedAt: new Date().toISOString(),
    status: 'processing',
  };

  mockDocuments.set(docId, doc);

  // Simulate async processing
  setTimeout(() => {
    const updatedDoc = mockDocuments.get(docId);
    if (updatedDoc) {
      updatedDoc.status = 'completed';
      updatedDoc.confidence = 0.92;
      updatedDoc.pages = 1;
    }
  }, 2000);

  res.status(201).json(createSuccessResponse(doc));
});

/**
 * DELETE /api/documents/:id
 * Delete a document
 */
router.delete('/:id', async (req: ApiRequest, res: Response) => {
  const { id } = req.params as { id: string };
  const doc = mockDocuments.get(id);

  if (!doc) {
    throw new ApiResponseError(
      'NOT_FOUND',
      404,
      `Document ${id} not found`,
      { id }
    );
  }

  mockDocuments.delete(id);

  res.json(createSuccessResponse(
    { id, message: 'Document deleted successfully' }
  ));
});

export default router;
