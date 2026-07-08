/**
 * Help Routes - Phase 14
 *
 * REST API für Help Center und Dokumentations-Verwaltung mit Serviceintegration
 * Lädt echte Datenquellen aus Markdown-Dateien
 *
 * @version 0.14.0
 * @phase 14
 */

import { Router, Response, NextFunction } from 'express';
import { ApiRequest, ApiResponseError, createSuccessResponse } from '../server';
import { getHelpContentLoader } from '../../services/HelpContentLoader';
import * as fs from 'fs';
import * as path from 'path';

const router = Router();
const loader = getHelpContentLoader();

/**
 * GET /api/help/search - Search help content with full-text search
 */
router.get('/search', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const { query, category, limit } = req.query;
    console.log(`[Help] Searching help content: query="${query}" category="${category}"`);

    if (!query || typeof query !== 'string' || query.trim() === '') {
      return next(new ApiResponseError(
        'VALIDATION_ERROR',
        400,
        'query parameter is required and must be non-empty'
      ));
    }

    const queryStr = query.toString().toLowerCase();
    const categoryStr = category ? category.toString() : undefined;
    const limitNum = Math.min(parseInt(limit as string) || 20, 100);

    // Load glossary, docs, and release notes
    const [glossary, documentation, releaseNotes] = await Promise.all([
      loader.loadGlossary(),
      loader.loadDocumentation(),
      loader.loadReleaseNotes()
    ]);
    
    let results: any[] = [];

    // Search glossary
    glossary.forEach((entry: any) => {
      if ((entry.term.toLowerCase().includes(queryStr) || entry.definition.toLowerCase().includes(queryStr)) &&
          (!categoryStr || entry.category === categoryStr)) {
        results.push({ type: 'glossary', ...entry, relevance: calculateRelevance(entry, queryStr) });
      }
    });
    
    // Search documentation
    documentation.forEach((doc: any) => {
      if ((doc.title.toLowerCase().includes(queryStr) || doc.content.toLowerCase().includes(queryStr)) &&
          (!categoryStr || doc.category === categoryStr)) {
        results.push({ type: 'documentation', ...doc, relevance: calculateRelevance(doc, queryStr) });
      }
    });
    
    // Search release notes
    releaseNotes.forEach((note: any) => {
      if ((note.title.toLowerCase().includes(queryStr) || note.content.toLowerCase().includes(queryStr)) &&
          (!categoryStr || note.category === categoryStr)) {
        results.push({ type: 'release-note', ...note, relevance: calculateRelevance(note, queryStr) });
      }
    });

    results.sort((a, b) => b.relevance - a.relevance);
    results = results.slice(0, limitNum);

    console.log(`[Help] Found ${results.length} results for "${query}"`);
    res.json(createSuccessResponse({
      results,
      totalResults: results.length,
      query: queryStr,
      category: categoryStr,
      limit: limitNum,
    }));
  } catch (error) {
    console.error(`[Help] Search error:`, error);
    const err = error as any;
    if (err.statusCode) return next(err);
    return next(new ApiResponseError(
      'SEARCH_FAILED',
      500,
      'Failed to search help content',
      { error: err.message }
    ));
  }
});

/**
 * GET /api/help/categories - Get all categories
 */
router.get('/categories', async (_req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const categories = [
      { name: 'guide', itemCount: 0, description: 'User Guides' },
      { name: 'glossary', itemCount: 0, description: 'Glossary Terms' },
      { name: 'api', itemCount: 0, description: 'API Documentation' },
      { name: 'troubleshooting', itemCount: 0, description: 'Troubleshooting' },
      { name: 'overview', itemCount: 0, description: 'Overview' },
    ];

    res.json(createSuccessResponse({ categories }));
  } catch (error) {
    return next(new ApiResponseError(
      'CATEGORIES_FAILED',
      500,
      'Failed to get categories',
      { error: (error as any).message }
    ));
  }
});

/**
 * GET /api/help/glossary - Get glossary entries with optional filtering
 */
router.get('/glossary', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const { term, category, limit } = req.query;
    console.log(`[Help] Getting glossary entries: term="${term}" category="${category}"`);

    const entries = await loader.loadGlossary();
    const limitNum = Math.min(parseInt(limit as string) || 50, 200);

    let filtered = entries;

    if (term) {
      const termLower = term.toString().toLowerCase();
      filtered = filtered.filter((e: any) =>
        e.term.toLowerCase().includes(termLower) ||
        e.definition.toLowerCase().includes(termLower)
      );
    }

    if (category) {
      filtered = filtered.filter((e: any) => e.category === category);
    }

    filtered = filtered.slice(0, limitNum);

    console.log(`[Help] Retrieved ${filtered.length} glossary entries`);
    res.json(createSuccessResponse({
      entries: filtered,
      total: filtered.length,
      limit: limitNum,
    }));
  } catch (error) {
    console.error(`[Help] Glossary error:`, error);
    const err = error as any;
    if (err.statusCode) return next(err);
    return next(new ApiResponseError(
      'GLOSSARY_FAILED',
      500,
      'Failed to get glossary',
      { error: err.message }
    ));
  }
});

/**
 * GET /api/help/item/:itemId - Get help item details
 */
router.get('/item/:itemId', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    console.log(`[Help] Getting help item: ${itemId}`);

    if (!itemId) {
      return next(new ApiResponseError(
        'VALIDATION_ERROR',
        400,
        'itemId is required'
      ));
    }

    // Search for item in glossary, docs, and release notes
    const [glossary, documentation, releaseNotes] = await Promise.all([
      loader.loadGlossary(),
      loader.loadDocumentation(),
      loader.loadReleaseNotes()
    ]);
    
    let item: any = glossary.find((e: any) => e.id === itemId);
    if (!item) item = documentation.find((d: any) => d.id === itemId);
    if (!item) item = releaseNotes.find((r: any) => r.id === itemId);

    if (!item) {
      return next(new ApiResponseError(
        'ITEM_NOT_FOUND',
        404,
        `Help item ${itemId} not found`
      ));
    }

    console.log(`[Help] Retrieved glossary item: ${itemId}`);
    res.json(createSuccessResponse(item));
  } catch (error) {
    console.error(`[Help] Item retrieval error:`, error);
    const err = error as any;
    if (err.statusCode) return next(err);
    return next(new ApiResponseError(
      'ITEM_FAILED',
      500,
      'Failed to get help item',
      { error: err.message }
    ));
  }
});

/**
 * GET /api/help/stats - Get help statistics
 */
router.get('/stats', async (_req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    console.log(`[Help] Getting help statistics`);

    const [glossary, documentation, releaseNotes] = await Promise.all([
      loader.loadGlossary(),
      loader.loadDocumentation(),
      loader.loadReleaseNotes()
    ]);
    
    const allCategories = new Set([
      ...glossary.map((g: any) => g.category),
      ...documentation.map((d: any) => d.category),
      ...releaseNotes.map((r: any) => r.category)
    ]);

    const stats = {
      totalItems: glossary.length + documentation.length + releaseNotes.length,
      glossaryEntries: glossary.length,
      documentationItems: documentation.length,
      releaseNotes: releaseNotes.length,
      categories: allCategories.size,
      categoryNames: Array.from(allCategories),
      lastIndexed: new Date().toISOString(),
    };

    console.log(`[Help] Statistics: ${stats.totalItems} total items`);
    res.json(createSuccessResponse(stats));
  } catch (error) {
    console.error(`[Help] Statistics error:`, error);
    const err = error as any;
    if (err.statusCode) return next(err);
    return next(new ApiResponseError(
      'STATS_FAILED',
      500,
      'Failed to get help statistics',
      { error: err.message }
    ));
  }
});

/**
 * GET /api/help/release-notes - Get release notes
 */
router.get('/release-notes', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const { version, limit } = req.query;
    console.log(`[Help] Getting release notes: version="${version}"`);

    let notes = await loader.loadReleaseNotes();
    const limitNum = Math.min(parseInt(limit as string) || 50, 200);

    if (version) {
      const versionStr = version.toString();
      notes = notes.filter((n: any) => n.version === versionStr);
    }

    notes = notes.slice(0, limitNum);

    console.log(`[Help] Retrieved ${notes.length} release notes`);
    res.json(createSuccessResponse({
      notes: notes,
      total: notes.length,
      limit: limitNum,
    }));
  } catch (error) {
    console.error(`[Help] Release notes error:`, error);
    const err = error as any;
    if (err.statusCode) return next(err);
    return next(new ApiResponseError(
      'RELEASE_NOTES_FAILED',
      500,
      'Failed to get release notes',
      { error: err.message }
    ));
  }
});

/**
 * GET /api/help/documentation - Get documentation items
 */
router.get('/documentation', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const { category, limit, search } = req.query;
    console.log(`[Help] Getting documentation: category="${category}"`);

    let docs = await loader.loadDocumentation();
    const limitNum = Math.min(parseInt(limit as string) || 50, 200);

    if (category) {
      const categoryStr = category.toString();
      docs = docs.filter((d: any) => d.category === categoryStr);
    }

    if (search) {
      const searchStr = search.toString().toLowerCase();
      docs = docs.filter((d: any) =>
        d.title.toLowerCase().includes(searchStr) ||
        d.content.toLowerCase().includes(searchStr) ||
        (d.summary && d.summary.toLowerCase().includes(searchStr))
      );
    }

    docs = docs.slice(0, limitNum);

    console.log(`[Help] Retrieved ${docs.length} documentation items`);
    res.json(createSuccessResponse({
      items: docs,
      total: docs.length,
      limit: limitNum,
    }));
  } catch (error) {
    console.error(`[Help] Documentation error:`, error);
    const err = error as any;
    if (err.statusCode) return next(err);
    return next(new ApiResponseError(
      'DOCUMENTATION_FAILED',
      500,
      'Failed to get documentation',
      { error: err.message }
    ));
  }
});

/**
 * GET /api/help/manual - Get user manual with chapters and sections
 */
router.get('/manual', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const { chapter } = req.query;

    // Load manual from file
    let manualPath = path.join(__dirname, '../../../src/data/manual.json');
    if (!fs.existsSync(manualPath)) {
      manualPath = path.join(__dirname, '../../../../src/data/manual.json');
    }
    
    let manual: any;
    if (fs.existsSync(manualPath)) {
      const content = fs.readFileSync(manualPath, 'utf-8');
      manual = JSON.parse(content);
    } else {
      // Fallback
      manual = {
        version: '0.14.0',
        title: 'Audit-Safe Document Extractor - Benutzerhandbuch',
        lastUpdated: new Date().toISOString(),
        chapters: []
      };
    }

    if (chapter && typeof chapter === 'string') {
      const selectedChapter = manual.chapters.find((c: any) => c.id === chapter);
      if (!selectedChapter) {
        return next(new ApiResponseError(
          'CHAPTER_NOT_FOUND',
          404,
          `Manual chapter ${chapter} not found`
        ));
      }
      return res.json(createSuccessResponse({
        version: manual.version,
        title: manual.title,
        chapter: selectedChapter,
        totalChapters: manual.chapters.length,
      }));
    }

    // Return all chapters - ensure sections have heading and content
    const transformedChapters = manual.chapters.map((c: any) => ({
      id: c.id,
      title: c.title,
      sections: (c.sections || []).map((s: any) => {
        // Handle both object and string formats
        if (typeof s === 'string') {
          return { heading: s, content: '' };
        }
        return {
          heading: s.heading || s.title || '',
          content: s.content || s.description || ''
        };
      })
    }));

    res.json(createSuccessResponse({
      version: manual.version,
      title: manual.title,
      lastUpdated: manual.lastUpdated,
      chapters: transformedChapters,
      totalChapters: transformedChapters.length,
    }));
  } catch (error) {
    console.error(`[Help] Manual retrieval error:`, error);
    const err = error as any;
    if (err.statusCode) return next(err);
    return next(new ApiResponseError(
      'MANUAL_FAILED',
      500,
      'Failed to get manual',
      { error: err.message }
    ));
  }
});


function calculateRelevance(item: any, query: string): number {
  let score = 0;
  const text = ((item.term || item.title) + ' ' + (item.definition || item.content || '')).toLowerCase();
  const queryTerms = query.split(' ');
  
  queryTerms.forEach(term => {
    if (text.includes(term)) score += 10;
    if ((item.term || item.title)?.toLowerCase().includes(term)) score += 20;
  });
  
  return score;
}

export default router;
