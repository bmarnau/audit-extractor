/**
 * API Server Main Entry Point
 * 
 * Startet den Express API Server mit allen Routes und Service Initialization
 * 
 * @version 0.14.0
 * @phase 14
 * @startup Initializes ConfigManager, BackupService, and HelpContentLoader, then starts server
 */

import 'reflect-metadata';
import { createApiServer, ApiResponseError } from './server';
import { logProjectInfo, PROJECT_VERSION } from '../../version';
import { initializeServiceContainer, resolveService } from '../di/ServiceContainer';
import { initializeDatabase } from '../database/data-source';
import { ConfigManager } from '../config/ConfigManager';
import { BackupService } from '../services/BackupService';
import { getHelpContentLoader } from '../services/HelpContentLoader';
import { SchemaDirectoryManager } from '../filesystem/SchemaDirectoryManager';
// Legacy Phase 11 routes - disabled due to type incompatibilities
// Use Phase 13 routes instead (config, audit, help, logs, backup)
// import documentRoutes from './routes/documents';
// import ruleRoutes from './routes/rules';
// import extractionRoutes from './routes/extraction';
import configRoutes from './routes/config';
import auditRoutes from './routes/audit';
import helpRoutes from './routes/help';
import logRoutes from './routes/logs';
import backupRoutes from './routes/backup';
import extractPhase14Routes from './routes/extract-phase14';
// Phase 15 Revision System
import { createRevisionRoutes } from '../../presentation/RevisionRoutes';
import { createSchemaExtractionRoutes } from '../../presentation/SchemaExtractionRoutes';

const port = parseInt(process.env.PORT || '3000', 10);
const nodeEnv = process.env.NODE_ENV || 'development';

async function startServer() {
  try {
    // Log project info on startup
    logProjectInfo();

    // Initialize Service Container (DI-First pattern)
    console.log('[Server] Initializing Service Container...');
    try {
      initializeServiceContainer();
      console.log('[Server] ✓ Service Container initialized');
    } catch (diErr: any) {
      console.error('[Server] ✗ Service Container initialization failed:', diErr);
      throw diErr;
    }

    // Initialize Database (TypeORM + PostgreSQL)
    console.log('[Server] Initializing Database Connection...');
    try {
      await initializeDatabase();
      console.log('[Server] ✓ Database Connection initialized');
    } catch (dbErr: any) {
      console.error('[Server] ✗ Database initialization failed:', dbErr);
      throw dbErr;
    }

    // Initialize ConfigManager
    console.log('[Server] Initializing ConfigManager...');
    try {
      const configManager = resolveService(ConfigManager);
      await configManager.initialize();
      console.log('[Server] ✓ ConfigManager initialized');
    } catch (cfgErr: any) {
      console.error('[Server] ✗ ConfigManager initialization failed:', cfgErr);
      throw cfgErr;
    }

    // Initialize BackupService
    console.log('[Server] Initializing BackupService...');
    try {
      const backupService = resolveService(BackupService);
      await backupService.initialize();
      console.log('[Server] ✓ BackupService initialized');
    } catch (bakErr: any) {
      console.error('[Server] ✗ BackupService initialization failed:', bakErr);
      throw bakErr;
    }

    // Initialize HelpContentLoader (preload markdown files)
    console.log('[Server] Initializing HelpContentLoader...');
    try {
      const helpLoader = getHelpContentLoader();
      await helpLoader.initialize();
      console.log('[Server] ✓ HelpContentLoader initialized');
    } catch (helpErr: any) {
      console.error('[Server] ✗ HelpContentLoader initialization failed:', helpErr);
      throw helpErr;
    }

    // Initialize SchemaDirectoryManager (Phase 16 Filesystem)
    console.log('[Server] Initializing SchemaDirectoryManager...');
    try {
      const schemaDirectoryManager = resolveService(SchemaDirectoryManager);
      await schemaDirectoryManager.initialize();
      console.log('[Server] ✓ SchemaDirectoryManager initialized');
    } catch (fmErr: any) {
      console.error('[Server] ✗ SchemaDirectoryManager initialization failed:', fmErr);
      throw fmErr;
    }

    // Register Phase 15 Revision System services
    // const revisionComparisonService = resolveService(RunComparisonService);
    // const revisionHistoryService = resolveService(RunHistoryService);
    // console.log('[Server] Phase 15 Revision services registered');
    
    // Create API server
    console.log('[Server] Creating API server...');
    const app = createApiServer();
    console.log('[Server] ✓ API Server created - now mounting routes');

    // Mount Phase 12-13 routes (Centers)
    console.log('[Server] Mounting routes...');
    
    try {
      app.use('/api/config', configRoutes);
      console.log('[Server] ✓ Config routes mounted');
    } catch (routeErr: any) {
      console.error('[Server] ✗ Config routes failed:', routeErr);
      throw routeErr;
    }

    try {
      app.use('/api/audit', auditRoutes);
      console.log('[Server] ✓ Audit routes mounted');
    } catch (routeErr: any) {
      console.error('[Server] ✗ Audit routes failed:', routeErr);
      throw routeErr;
    }

    try {
      app.use('/api/help', helpRoutes);
      console.log('[Server] ✓ Help routes mounted');
    } catch (routeErr: any) {
      console.error('[Server] ✗ Help routes failed:', routeErr);
      throw routeErr;
    }

    try {
      app.use('/api/logs', logRoutes);
      console.log('[Server] ✓ Log routes mounted');
    } catch (routeErr: any) {
      console.error('[Server] ✗ Log routes failed:', routeErr);
      throw routeErr;
    }

    try {
      app.use('/api/backup', backupRoutes);
      console.log('[Server] ✓ Backup routes mounted');
    } catch (routeErr: any) {
      console.error('[Server] ✗ Backup routes failed:', routeErr);
      throw routeErr;
    }

    try {
      app.use('/api/extract', extractPhase14Routes);
      console.log('[Server] ✓ Phase 14 Extraction routes mounted');
    } catch (routeErr: any) {
      console.error('[Server] ✗ Extraction routes failed:', routeErr);
      throw routeErr;
    }

    try {
      const schemaExtractionRoutes = createSchemaExtractionRoutes();
      app.use('/api/schema', schemaExtractionRoutes);
      console.log('[Server] ✓ Schema Extraction routes (Phase 15) mounted on /api/schema');
    } catch (routeErr) {
      console.error('[Server] Error mounting schema extraction routes:', routeErr);
      throw routeErr;
    }

    try {
      const revRoutes = createRevisionRoutes();
      app.use('/api/revision', revRoutes);
      console.log('[Server] ✓ Revision routes mounted');
    } catch (routeErr) {
      console.error('[Server] Error mounting revision routes:', routeErr);
      throw routeErr;
    }

    // Global Error Handler (MUST be before 404 handler)
    app.use((err: Error, req: any, res: any, _next: any) => {
      console.error('[API Error]', err);

      if (err instanceof ApiResponseError) {
        return res.status(err.statusCode).json({
          error: {
            code: err.code,
            message: err.message,
            details: err.details,
          },
          timestamp: new Date().toISOString(),
          path: req.path,
        });
      }

      // Default error
      return res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: process.env.NODE_ENV === 'production'
            ? 'An internal server error occurred'
            : err.message,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    });

    // 404 Handler (MUST be ABSOLUTE LAST middleware)
    app.use((req: any, res: any) => {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Route ${req.method} ${req.path} not found`,
        },
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    });

    // Start server (AFTER all middleware and routes)
    console.log(`[Server] Starting to listen on port ${port}...`);
    
    // Return a promise that never resolves to keep server running
    return new Promise<void>((_resolve, reject) => {
      const server = app.listen(port, () => {
        console.log(`[Server] Successfully listening on port ${port}\n`);
        console.log('='.repeat(60));
        console.log(`Audit-Safe Document Extractor API v${PROJECT_VERSION}`);
        console.log(`Phase 13: Frontend Workbench + Service Container`);
        console.log('='.repeat(60));
        console.log(`Environment: ${nodeEnv}`);
        console.log(`Port: ${port}`);
        console.log(`Health Check: http://localhost:${port}/health`);
        console.log('-'.repeat(60));
        console.log('ENDPOINTS:');
        console.log('  Config: GET/PUT /api/config');
        console.log('  Backup: GET /api/backup/list, POST /api/backup/create');
        console.log('  Audit: GET /api/audit/:documentId');
        console.log('  Help: GET /api/help/glossary, GET /api/help/manual');
        console.log('  Logs: GET /api/logs');
        console.log('  Extract: POST /api/extract');
        console.log('  Revision: GET /api/revision/runs, POST /api/revision/save-run');
        console.log('-'.repeat(60));
        console.log('Services: ConfigManager, BackupService, All DI Services');
        console.log('='.repeat(60) + '\n');
      });

      // Handle server errors
      server.on('error', (err: any) => {
        console.error('[Server] Server error:', err);
        reject(err);
      });

      // Never resolve to keep server running indefinitely
    });
  } catch (error) {
    console.error('Failed to start API server:', error);
    process.exit(1);
  }
}

// Only start if run directly
if (require.main === module) {
  startServer().catch(err => {
    console.error('[Fatal] Server crashed:', err);
    process.exit(1);
  });
}

export { startServer };
