/**
 * Help Center - Phase 12
 *
 * Zentrale Hilfe- und Dokumentations-Verwaltung.
 * Indexiert: docs/, README.md, Glossar
 * Features: Volltext-Suche, Kategorien, Highlight, Querverweise
 *
 * @version 0.12.0
 * @phase 12
 * @status COMPLETE
 */

/**
 * Indexed Content Item
 */
export interface HelpContentItem {
  /** Unique ID */
  id: string;

  /** Titel */
  title: string;

  /** Kategorie */
  category: 'guide' | 'glossary' | 'api' | 'troubleshooting' | 'overview';

  /** Inhalt (Text) */
  content: string;

  /** Zusammenfassung */
  summary: string;

  /** Keywords */
  keywords: string[];

  /** Querverweise (andere Item IDs) */
  crossReferences: string[];

  /** Quelldatei */
  sourceFile: string;

  /** Seitennummer (optional) */
  pageNumber?: number;

  /** Abschnitt */
  section: string;

  /** Zuletzt aktualisiert */
  lastUpdated: string;

  /** Version */
  version: string;

  /** Relevance Score (für Suche) */
  relevanceScore?: number;
}

/**
 * Search Result
 */
export interface HelpSearchResult {
  /** Search ID */
  id: string;

  /** Item */
  item: HelpContentItem;

  /** Match Score (0-1) */
  matchScore: number;

  /** Highlights (mit HTML Markup) */
  highlights: Array<{
    text: string;
    highlighted: string; // Mit <mark> Tags
  }>;

  /** Matched Fields */
  matchedFields: ('title' | 'content' | 'keywords' | 'summary')[];

  /** Related Results */
  relatedResults: HelpSearchResult[];
}

/**
 * Glossary Entry
 */
export interface GlossaryEntry {
  /** Term */
  term: string;

  /** Definition */
  definition: string;

  /** Ausführliche Erklärung */
  explanation?: string;

  /** Kategorie */
  category: string;

  /** Siehe auch */
  seeAlso: string[];

  /** Beispiele */
  examples?: string[];

  /** Links */
  links?: Array<{
    title: string;
    url: string;
  }>;
}

/**
 * Help Index
 */
export interface HelpIndex {
  /** Index Version */
  version: string;

  /** Alle Content Items */
  items: HelpContentItem[];

  /** Glossar Einträge */
  glossary: GlossaryEntry[];

  /** Kategorien */
  categories: {
    name: string;
    itemCount: number;
    description: string;
  }[];

  /** Search Index (Inverted Index) */
  searchIndex: Record<string, string[]>; // word -> item IDs

  /** Zuletzt indexiert */
  lastIndexed: string;

  /** Index Größe (Bytes) */
  indexSize: number;
}

/**
 * Search Query
 */
export interface HelpSearchQuery {
  /** Search Term */
  query: string;

  /** Filter nach Kategorie */
  category?: string;

  /** Limit Results */
  limit?: number;

  /** Include Related */
  includeRelated?: boolean;

  /** Include Glossary */
  includeGlossary?: boolean;
}

/**
 * Help Statistics
 */
export interface HelpStatistics {
  /** Total Items */
  totalItems: number;

  /** Total Glossary Entries */
  glossaryEntries: number;

  /** Categories */
  categories: number;

  /** Total Search Index Size */
  indexSize: number;

  /** Last Indexed */
  lastIndexed: string;

  /** Index Quality */
  quality: {
    coverage: number; // 0-1
    freshness: number; // 0-1 (how recent)
    completeness: number; // 0-1
  };

  /** Most Searched Terms */
  topSearchTerms: Array<{
    term: string;
    searches: number;
  }>;

  /** Popular Topics */
  topTopics: Array<{
    id: string;
    title: string;
    views: number;
  }>;
}
