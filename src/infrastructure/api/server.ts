/**
 * REST API Server Setup - Phase 11 (Updated for Phase 14 File Uploads)
 * 
 * Express-basierter API-Server mit Error Handling und CORS
 * 
 * @version 0.18.0
 * @phase 18
 * @status Updated - File Upload Support via Multer (in routes)
 */

import express, { Request, Express } from 'express';

/**
 * Globale API Error Handler
 */
export class ApiResponseError extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiResponseError';
  }
}

/**
 * API Response Wrapper
 */
export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  timestamp: string;
  path: string;
}

/**
 * Express Request/Response Types
 */
export interface ApiRequest extends Request {
  startTime?: number;
}

/**
 * API Server Factory
 */
export function createApiServer(): Express {
  const app = express();

  // Middleware: Request Logging
  app.use((req: ApiRequest, _res, next) => {
    req.startTime = Date.now();
    next();
  });

  // Middleware: JSON Parsing
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // NOTE: Multer is applied directly in routes/extract-phase14.ts
  // Do NOT apply globally as it blocks GET requests!

  // Middleware: CORS
  app.use((req, res, next) => {
    const origin = (req.headers.origin as string) || '';
    // Allow multiple dev ports and configured origins
    const allowedOrigins = [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      process.env.CORS_ORIGIN,
    ].filter(Boolean);
    
    if (allowedOrigins.includes(origin) || /^http:\/\/localhost:\d+$/.test(origin)) {
      res.header('Access-Control-Allow-Origin', origin);
    }
    
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.header('Access-Control-Max-Age', '86400');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    return next();
  });

  // Middleware: Request Validation
  app.use((req: ApiRequest, res, next) => {
    // Skip validation for file upload endpoints (they use multipart/form-data)
    if (req.path === '/api/extract/pdf' || req.path === '/api/extract/html') {
      return next();
    }

    if (req.method !== 'GET' && req.method !== 'DELETE') {
      if (!req.is('application/json') && Object.keys(req.body).length > 0) {
        return res.status(400).json(createErrorResponse(
          'INVALID_CONTENT_TYPE',
          'Content-Type must be application/json',
          req.path
        ));
      }
    }
    return next();
  });

  // Response Wrapper - Standardize all API responses
  app.use((req: ApiRequest, res, next) => {
    // Disable caching for all API responses - APIs should never return 304
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    
    const originalJson = res.json.bind(res);
    res.json = function(data: unknown) {
      const statusCode = res.statusCode;
      const duration = req.startTime ? Date.now() - req.startTime : 0;

      // Check if already wrapped by createSuccessResponse or createErrorResponse
      const isWrapped = data && typeof data === 'object' && (
        ('data' in data && 'timestamp' in data && 'path' in data) ||
        ('error' in data && 'timestamp' in data && 'path' in data)
      );

      if (isWrapped) {
        // Already wrapped, just return as-is with duration added
        return originalJson.call(this, { ...data as any, duration });
      }

      if (statusCode >= 400) {
        // Error response
        return originalJson.call(this, {
          error: data,
          timestamp: new Date().toISOString(),
          path: req.path,
          duration,
        });
      }

      // Success response
      return originalJson.call(this, {
        data,
        timestamp: new Date().toISOString(),
        path: req.path,
        duration,
      });
    };
    next();
  });

  // Health Check
  app.get('/health', (req: ApiRequest, res) => {
    res.json(createSuccessResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }, req));
  });

  // NOTE: All routes are mounted directly in index.ts AFTER this function returns
  // Error handler and 404 handler are also added there in index.ts

  return app;
}

/**
 * Helpers
 */
export function createSuccessResponse<T>(data: T, req?: Request): ApiResponse<T> {
  return {
    data,
    timestamp: new Date().toISOString(),
    path: req?.path || '/api',
  };
}

export function createErrorResponse(
  code: string,
  message: string,
  path: string,
  details?: Record<string, unknown>
): ApiResponse<null> {
  return {
    error: {
      code,
      message,
      details,
    },
    timestamp: new Date().toISOString(),
    path,
  };
}
