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

const router = Router();
const loader = getHelpContentLoader();

/**
 * GET /api/help - Get help overview (index)
 */
router.get('/', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    console.log(`[Help] Getting help overview`);
    
    // Return aggregated help data
    const [glossary, documentation, releaseNotes, categories] = await Promise.all([
      loader.loadGlossary().catch(() => []),
      loader.loadDocumentation().catch(() => []),
      loader.loadReleaseNotes().catch(() => []),
      Promise.resolve([
        { name: 'guide', description: 'User Guides' },
        { name: 'glossary', description: 'Glossary Terms' },
        { name: 'api', description: 'API Documentation' },
        { name: 'troubleshooting', description: 'Troubleshooting' },
        { name: 'overview', description: 'Overview' },
      ])
    ]);

    const overview = {
      status: 'available',
      sections: {
        glossary: {
          name: 'Glossary',
          items: glossary.length,
          description: 'Glossary of terms and concepts',
          endpoint: '/api/help/glossary'
        },
        documentation: {
          name: 'Documentation',
          items: documentation.length,
          description: 'User documentation and guides',
          endpoint: '/api/help/documentation'
        },
        releaseNotes: {
          name: 'Release Notes',
          items: releaseNotes.length,
          description: 'Release notes and changelog',
          endpoint: '/api/help/release-notes'
        }
      },
      categories: categories,
      totalItems: glossary.length + documentation.length + releaseNotes.length,
      availableEndpoints: [
        { method: 'GET', path: '/api/help', description: 'Help overview' },
        { method: 'GET', path: '/api/help/search', description: 'Search help content' },
        { method: 'GET', path: '/api/help/categories', description: 'Get help categories' },
        { method: 'GET', path: '/api/help/glossary', description: 'Get glossary entries' },
        { method: 'GET', path: '/api/help/documentation', description: 'Get documentation' },
        { method: 'GET', path: '/api/help/release-notes', description: 'Get release notes' },
        { method: 'GET', path: '/api/help/stats', description: 'Get help statistics' }
      ]
    };

    res.json(createSuccessResponse(overview));
  } catch (error) {
    console.error(`[Help] Overview error:`, error);
    const err = error as any;
    if (err.statusCode) return next(err);
    return next(new ApiResponseError(
      'HELP_OVERVIEW_FAILED',
      500,
      'Failed to get help overview',
      { error: err.message }
    ));
  }
});

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

    // Load manual from HelpContentLoader instead of JSON file
    const docs = await loader.loadDocumentation();
    
    // Current version constant - update this when releasing new version
    const CURRENT_VERSION = '0.35.0';
    const CURRENT_MANUAL_FILE = `MANUAL-${CURRENT_VERSION}.md`;
    
    console.log(`[Help] Manual endpoint called - looking for version ${CURRENT_VERSION}`);
    
    // Prioritize MANUAL-0.35.0.md specifically
    let manual = docs.find((d: any) => {
      const filename = d.source?.split('/').pop() || '';
      return filename === CURRENT_MANUAL_FILE;
    });
    
    // Debug: Log what we found
    if (manual) {
      console.log(`[Help] ✅ Found current manual: ${manual.source}`);
    } else {
      console.warn(`[Help] ⚠️ Current manual ${CURRENT_MANUAL_FILE} not found. Checking available manuals...`);
      const availableManuals = docs
        .filter((d: any) => d.source?.includes('MANUAL-'))
        .map((d: any) => d.source);
      console.warn(`[Help] Available manuals: ${availableManuals.join(', ')}`);
    }
    
    // Fallback: Sort by version number to find latest if current not found
    if (!manual) {
      const manualDocs = docs.filter((d: any) => {
        const filename = d.source?.split('/').pop() || '';
        return filename.startsWith('MANUAL-') && filename.endsWith('.md');
      });
      
      if (manualDocs.length > 0) {
        // Sort by version number (extract from filename) - highest first
        manualDocs.sort((a: any, b: any) => {
          const aVer = a.source?.match(/MANUAL-(\d+\.\d+\.\d+)/)?.[1] || '0.0.0';
          const bVer = b.source?.match(/MANUAL-(\d+\.\d+\.\d+)/)?.[1] || '0.0.0';
          return bVer.localeCompare(aVer, undefined, { numeric: true });
        });
        manual = manualDocs[0];
        console.warn(`[Help] ⚠️ Using fallback manual: ${manual.source}`);
      }
    }
    
    if (!manual) {
      console.error(`[Help] ❌ No manual documents found at all`);
      return res.json(createSuccessResponse({
        version: CURRENT_VERSION,
        title: `📖 Operationshandbuch - Version ${CURRENT_VERSION}`,
        chapters: [],
        totalChapters: 0,
        note: 'No manual document found. Please ensure MANUAL-*.md exists.'
      }));
    }

    // Always set version to current version
    const title = `📖 Operationshandbuch - Version ${CURRENT_VERSION}`;

    // Parse markdown chapters: split by ## headers
    const chapters: any[] = [];
    const content = manual.content || '';
    const chapterRegex = /^##\s+(.+?)$/gm;
    let match;
    const chapterStarts: Array<{title: string; startIdx: number}> = [];
    
    while ((match = chapterRegex.exec(content)) !== null) {
      chapterStarts.push({
        title: match[1].trim(),
        startIdx: match.index
      });
    }

    // Build chapter objects with subsections
    for (let i = 0; i < chapterStarts.length; i++) {
      const chapterStart = chapterStarts[i];
      const chapterEnd = i < chapterStarts.length - 1 ? chapterStarts[i + 1].startIdx : content.length;
      const chapterContent = content.substring(chapterStart.startIdx, chapterEnd).trim();
      
      // Split by ### for subsections
      const sections = chapterContent
        .split(/^###\s+/m)
        .slice(1)
        .map((section: string) => {
          const [heading, ...body] = section.split('\n');
          return {
            heading: heading.trim(),
            content: body.join('\n').trim()
          };
        });

      chapters.push({
        id: `ch-${i + 1}`,
        title: chapterStart.title,
        sections: sections.length > 0 ? sections : [{
          heading: chapterStart.title,
          content: chapterContent
        }]
      });
    }

    // If no chapters found, create one from full content
    if (chapters.length === 0) {
      chapters.push({
        id: 'main',
        title: title,
        sections: [{
          heading: 'Inhalt',
          content: content
        }]
      });
    }

    if (chapter && typeof chapter === 'string') {
      const selectedChapter = chapters.find((c: any) => c.id === chapter);
      if (!selectedChapter) {
        return next(new ApiResponseError(
          'CHAPTER_NOT_FOUND',
          404,
          `Manual chapter ${chapter} not found`
        ));
      }
      return res.json(createSuccessResponse({
        version: '0.35.0',
        title: title,
        chapter: selectedChapter,
        totalChapters: chapters.length,
      }));
    }

    res.json(createSuccessResponse({
      version: '0.35.0',
      title: title,
      lastUpdated: new Date().toISOString(),
      chapters: chapters,
      totalChapters: chapters.length,
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


/**
 * GET /api/help/version - Get current manual version
 * Useful for testing and version validation
 */
router.get('/version', async (req: ApiRequest, res: Response, next: NextFunction) => {
  try {
    const CURRENT_VERSION = '0.35.0';
    const CURRENT_MANUAL_FILE = `MANUAL-${CURRENT_VERSION}.md`;
    
    const docs = await loader.loadDocumentation();
    
    // Check if current version exists
    const manualExists = docs.some((d: any) => {
      const filename = d.source?.split('/').pop() || '';
      return filename === CURRENT_MANUAL_FILE;
    });
    
    // Find actual version being served
    const serving = docs.find((d: any) => {
      const filename = d.source?.split('/').pop() || '';
      return filename.startsWith('MANUAL-') && filename.endsWith('.md');
    });
    
    const servingVersion = serving?.source?.match(/MANUAL-(\d+\.\d+\.\d+)/)?.[1] || 'unknown';
    
    res.json(createSuccessResponse({
      current: CURRENT_VERSION,
      expected_file: CURRENT_MANUAL_FILE,
      exists: manualExists,
      serving_version: servingVersion,
      serving_file: serving?.source?.split('/').pop(),
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error(`[Help] Version check error:`, error);
    const err = error as any;
    if (err.statusCode) return next(err);
    return next(new ApiResponseError(
      'VERSION_CHECK_FAILED',
      500,
      'Failed to check manual version',
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
