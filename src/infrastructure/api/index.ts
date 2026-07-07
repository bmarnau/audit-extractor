/**
 * API Server Main Entry Point
 * 
 * Startet den Express API Server mit allen Routes und Service Initialization
 * 
 * @version 0.13.0
 * @phase 13
 * @startup Initializes ConfigManager and BackupService, then starts server
 */

import 'reflect-metadata';
import { createApiServer, ApiResponseError } from './server';
import { logProjectInfo, PROJECT_VERSION } from '../../version';
import { initializeServiceContainer, resolveService } from '../di/ServiceContainer';
import { ConfigManager } from '../config/ConfigManager';
import { BackupService } from '../services/BackupService';
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

const port = parseInt(process.env.PORT || '3000', 10);
const nodeEnv = process.env.NODE_ENV || 'development';

async function startServer() {
  try {
    // Log project info on startup
    logProjectInfo();

    // Initialize Service Container (DI-First pattern)
    console.log('[Server] Initializing Service Container...');
    initializeServiceContainer();

    // Initialize ConfigManager
    console.log('[Server] Initializing ConfigManager...');
    const configManager = resolveService(ConfigManager);
    await configManager.initialize();

    // Initialize BackupService
    console.log('[Server] Initializing BackupService...');
    const backupService = resolveService(BackupService);
    await backupService.initialize();

    // Register Phase 15 Revision System services
    // const revisionComparisonService = resolveService(RunComparisonService);
    // const revisionHistoryService = resolveService(RunHistoryService);
    // console.log('[Server] Phase 15 Revision services registered');
    
    // Create API server
    console.log('[Server] Creating API server...');
    const app = createApiServer();
    console.log('[Server] API Server created - now mounting routes');

    // Mount Phase 12-13 routes (Centers)
    console.log('[Server] Mounting routes...');
    
    app.use('/api/config', configRoutes);
    console.log('[Server] Config routes mounted');
    app.use('/api/audit', auditRoutes);
    console.log('[Server] Audit routes mounted');
    app.use('/api/help', helpRoutes);
    console.log('[Server] Help routes mounted');
    app.use('/api/logs', logRoutes);
    console.log('[Server] Log routes mounted');
    app.use('/api/backup', backupRoutes);
    console.log('[Server] Backup routes mounted');
    app.use('/api/extract', extractPhase14Routes);
    console.log('[Server] Phase 14 Extraction routes mounted');

    try {
      const revRoutes = createRevisionRoutes();
      app.use('/api/revision', revRoutes);
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
    app.listen(port, () => {
      console.log(`[Server] Successfully listening on port ${port}
╔═══════════════════════════════════════════════════════╗
║   Audit-Safe Document Extractor API v${PROJECT_VERSION}     ║
║   Phase 13: Frontend Workbench + Service Container   ║
╠═══════════════════════════════════════════════════════╣
║ Environment: ${nodeEnv.padEnd(38)}║
║ Port: ${String(port).padEnd(46)}║
║ Health Check: http://localhost:${port}/health             ║
╠═══════════════════════════════════════════════════════╣
║ Phase 1-11 Routes (Documents, Rules, Extraction):  ║
║ • POST   /api/documents/upload                       ║
║ • GET    /api/documents                              ║
║ • DELETE /api/documents/:id                          ║
║ • GET    /api/rules                                  ║
║ • POST   /api/rules                                  ║
║ • PUT    /api/rules/:id                              ║
║ • DELETE /api/rules/:id                              ║
║ • POST   /api/rules/:id/test                         ║
║ • POST   /api/extract                                ║
╠═══════════════════════════════════════════════════════╣
║ Phase 12-13 Centers - Configuration, Backup, Audit: ║
║ Configuration Center:                              ║
║ • GET/PUT  /api/config                               ║
║ • PATCH    /api/config/:section                      ║
║ • GET      /api/config/changes                       ║
║ • POST     /api/config/:version/revert               ║
║ Backup Center:                                       ║
║ • POST     /api/backup/create                        ║
║ • GET      /api/backup/list                          ║
║ • GET      /api/backup/:id                           ║
║ • POST     /api/backup/:id/restore                   ║
║ • DELETE   /api/backup/:id                           ║
║ • GET      /api/backup/stats                         ║
║ • GET      /api/backup/:id/download                  ║
║ Audit Center:                                        ║
║ • GET      /api/audit/:documentId                    ║
║ • POST     /api/audit/export                         ║
║ Help Center:                                         ║
║ • GET      /api/help/search                          ║
║ • GET      /api/help/glossary                        ║
║ Log Browser:                                         ║
║ • GET      /api/logs                                 ║
║ • POST     /api/logs/export                          ║
╠═══════════════════════════════════════════════════════╣
║ Services Initialized:                                ║
║ ✓ ConfigManager (versioning + changelog)             ║
║ ✓ BackupService (compression + checksums)            ║
║ ✓ All 12 Core Services (DI Container)                ║
╚═══════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start API server:', error);
    process.exit(1);
  }
}

// Only start if run directly
if (require.main === module) {
  startServer();
}

export { startServer };
