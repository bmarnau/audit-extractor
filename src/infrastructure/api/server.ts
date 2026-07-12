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

      // Check if data is an array (route returned direct data, not wrapped)
      if (Array.isArray(data)) {
        // Wrap array responses
        return originalJson.call(this, {
          data,
          timestamp: new Date().toISOString(),
          path: req.path,
          duration,
        });
      }

      // Check if already wrapped (has timestamp already)
      if (data && typeof data === 'object' && 'timestamp' in data) {
        // Already wrapped, just add duration
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

      // Success response - check if it looks like a custom response format with data property
      const isCustomFormat = data && typeof data === 'object' && 'data' in data;
      if (isCustomFormat) {
        // Route returned {data: ..., pagination, etc} - wrap it but preserve structure
        return originalJson.call(this, {
          data,
          timestamp: new Date().toISOString(),
          path: req.path,
          duration,
        });
      }

      // Generic success response
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
  app.get('/api/health', (req: ApiRequest, res) => {
    res.json(createSuccessResponse({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    }, req));
  });

  // Database Health Check (for Dashboard Status Display)
  app.get('/api/health/database', async (_req: ApiRequest, res) => {
    try {
      // Import AppDataSource to check connection status
      const { AppDataSource } = await import('../database/data-source');
      
      if (AppDataSource.isInitialized) {
        // Try a simple query to verify connection
        try {
          const queryResult = await AppDataSource.query('SELECT NOW()');
          res.json({
            database: 'connected',
            status: 'healthy',
            message: 'PostgreSQL database connection is active',
            timestamp: new Date().toISOString(),
            queryTest: queryResult ? 'passed' : 'warning',
          });
        } catch (queryErr: any) {
          res.status(503).json({
            database: 'disconnected',
            status: 'error',
            message: `Database query failed: ${queryErr?.message || 'Unknown error'}`,
            timestamp: new Date().toISOString(),
          });
        }
      } else {
        res.status(503).json({
          database: 'not_initialized',
          status: 'error',
          message: 'Database is not initialized. Docker containers may not be running.',
          timestamp: new Date().toISOString(),
          hint: 'Start with: docker-compose up -d && npm run dev',
        });
      }
    } catch (err: any) {
      res.status(503).json({
        database: 'error',
        status: 'error',
        message: `Database health check failed: ${err?.message || 'Unknown error'}`,
        timestamp: new Date().toISOString(),
        hint: 'Ensure PostgreSQL is running and DOCKER_COMPOSE env is set',
      });
    }
  });

  // Build Info Endpoint (for Dashboard Build Display)
  app.get('/api/health/info', (_req: ApiRequest, res) => {
    try {
      const buildInfo = {
        version: process.env.npm_package_version || '0.26.0',
        buildTime: process.env.BUILD_TIME || new Date().toISOString(),
        buildNumber: process.env.BUILD_NUMBER || 'unknown',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
      res.json(buildInfo);
    } catch (err: any) {
      res.status(500).json({
        error: 'Failed to retrieve build info',
        message: err?.message || 'Unknown error',
      });
    }
  });

  // Restart Endpoint (for Development - restarts backend process)
  app.post('/api/health/restart', async (_req: ApiRequest, res) => {
    try {
      // Send success response first
      res.json({
        status: 'restart_initiated',
        message: 'Backend restart initiated - reconnect in 3 seconds',
        timestamp: new Date().toISOString(),
      });

      // Then exit the process (in Docker, this will trigger restart policy)
      // In local dev, this allows npm watch or pm2 to restart
      setTimeout(() => {
        console.log('[Server] Restarting backend process...');
        process.exit(0);
      }, 500);
    } catch (err: any) {
      res.status(500).json({
        error: 'Failed to initiate restart',
        message: err?.message || 'Unknown error',
      });
    }
  });

  // Build Metadata Endpoint (for Dashboard - Build Tracking)
  app.get('/api/health/build', async (_req: ApiRequest, res) => {
    try {
      const { BuildMetadataService } = await import(
        '../services/build-metadata.service'
      );
      const service = new BuildMetadataService();
      const metadata = await service.generateBuildMetadata();

      res.json({
        version: metadata.version,
        buildNumber: metadata.buildNumber,
        buildTime: metadata.buildTime,
        environment: metadata.environment,
        gitInfo: {
          branch: metadata.gitInfo.branch,
          shortHash: metadata.gitInfo.shortHash,
          isDirty: metadata.gitInfo.isDirty,
          lastCommitTime: metadata.gitInfo.lastCommitTime,
        },
        frontendVersion: metadata.frontendVersion,
        backendVersion: metadata.backendVersion,
        versionMatch: metadata.versionMatch,
        syncStatus: metadata.syncStatus,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'Failed to retrieve build metadata',
        message: err?.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Git Sync Status Endpoint (for Dashboard - GitHub Sync Info)
  app.get('/api/health/sync', async (_req: ApiRequest, res) => {
    try {
      const { GitSyncService } = await import('../services/git-sync.service');
      const service = new GitSyncService();
      const syncStatus = await service.checkSyncStatus();

      res.json({
        timestamp: syncStatus.timestamp,
        isSynced: syncStatus.isSynced,
        syncMessage: syncStatus.syncMessage,
        remote: {
          branch: syncStatus.remote.branch,
          status: syncStatus.remote.status,
          commitsAhead: syncStatus.remote.commitsAhead,
          commitsBehind: syncStatus.remote.commitsBehind,
          lastPush: syncStatus.remote.lastPush,
        },
        buildNumberAtLastSync: syncStatus.buildNumberAtLastSync,
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'Failed to check sync status',
        message: err?.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  });

  // Version Verification Endpoint (for Pre-Deployment Checks)
  app.post('/api/health/verify', async (_req: ApiRequest, res) => {
    try {
      const { BuildMetadataService } = await import(
        '../services/build-metadata.service'
      );
      const service = new BuildMetadataService();
      const report = await service.verifyVersions();

      const statusCode = report.isValid ? 200 : 422;
      res.status(statusCode).json({
        isValid: report.isValid,
        timestamp: report.timestamp,
        versions: report.versions,
        versionMatch: report.versionMatch,
        mismatches: report.mismatches,
        gitStatus: report.gitStatus,
        warnings: report.warnings,
        recommendations: report.recommendations,
      });
    } catch (err: any) {
      res.status(500).json({
        error: 'Failed to verify versions',
        message: err?.message || 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
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
