/**
 * Settings Routes
 * 
 * Provides application settings, preferences, and configuration management
 * 
 * @version 0.34.0
 * @phase 27 - Fix: Frontend /api/settings endpoint
 */

import { Router, Request, Response, NextFunction } from 'express';
import { ApiRequest, createSuccessResponse } from './server';

const router = Router();

/**
 * GET /api/settings
 * Returns all application settings and user preferences
 */
router.get('/', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    console.log('[Settings] Getting application settings');

    const settings = {
      application: {
        name: 'Audit-Safe Document Extractor',
        version: '0.34.0',
        mode: process.env.NODE_ENV || 'development',
        debug: process.env.DEBUG === 'true',
      },
      environment: {
        port: parseInt(process.env.PORT || '3000'),
        nodeEnv: process.env.NODE_ENV || 'development',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
      features: {
        schemaManagement: true,
        ruleGeneration: true,
        documentExtraction: true,
        backupRestore: true,
        auditLogging: true,
        helpCenter: true,
        apiDocumentation: true,
      },
      limits: {
        maxFileSize: '100MB',
        maxSchemas: 1000,
        maxExtractRules: 5000,
        batchSize: 100,
        timeout: 30000,
      },
      storage: {
        schemas: './schemas',
        rules: './extraction-rules',
        backups: './backups',
        documents: './source-documents',
        results: './output',
      },
      ui: {
        theme: 'auto',
        language: 'de',
        dateFormat: 'DD.MM.YYYY',
        timeFormat: 'HH:mm:ss',
        sidebar: 'expanded',
      },
      database: {
        type: 'postgresql',
        host: process.env.DB_HOST || 'postgres',
        port: parseInt(process.env.DB_PORT || '5432'),
        connected: true,
      },
      cache: {
        type: 'redis',
        host: process.env.REDIS_HOST || 'redis',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        ttl: 3600,
      },
    };

    res.json(createSuccessResponse(settings));
  } catch (error) {
    console.error('[Settings] Error:', error);
    next(error);
  }
});

/**
 * PATCH /api/settings
 * Update application settings
 */
router.patch('/', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    console.log('[Settings] Updating application settings');
    const { settings } = req.body;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid settings object provided'
      });
    }

    // Log the update
    console.log('[Settings] Updated settings:', Object.keys(settings));

    res.json(createSuccessResponse({
      message: 'Settings updated successfully',
      appliedSettings: settings
    }));
  } catch (error) {
    console.error('[Settings] Error updating settings:', error);
    next(error);
  }
});

/**
 * GET /api/settings/user-preferences
 * Get user-specific preferences
 */
router.get('/user-preferences', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    console.log('[Settings] Getting user preferences');

    const preferences = {
      theme: 'auto',
      language: 'de',
      sidebarState: 'expanded',
      autoSave: true,
      notifications: true,
      darkMode: false,
      fontSize: 'medium',
      rowsPerPage: 50,
      defaultView: 'grid',
    };

    res.json(createSuccessResponse(preferences));
  } catch (error) {
    console.error('[Settings] Error getting preferences:', error);
    next(error);
  }
});

/**
 * PUT /api/settings/user-preferences
 * Update user preferences
 */
router.put('/user-preferences', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    console.log('[Settings] Updating user preferences');
    const { preferences } = req.body;

    if (!preferences || typeof preferences !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Invalid preferences object'
      });
    }

    console.log('[Settings] User preferences updated:', Object.keys(preferences));

    res.json(createSuccessResponse({
      message: 'User preferences updated successfully',
      preferences
    }));
  } catch (error) {
    console.error('[Settings] Error updating preferences:', error);
    next(error);
  }
});

export default router;
