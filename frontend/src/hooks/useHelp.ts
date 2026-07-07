/**
 * useHelp Hook - Help System
 *
 * Fulltext-Suche über Dokumentation, Glossar und Release Notes
 *
 * @version 0.13.0
 * @phase 13
 */

import { useState, useCallback } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface GlossaryEntry {
  term: string;
  definition: string;
  explanation: string;
  category: string;
  seeAlso?: string[];
  examples?: string[];
  links?: string[];
}

export interface DocItem {
  id: string;
  title: string;
  category: string;
  content: string;
  source: string;
}

export interface ManualChapter {
  id: string;
  title: string;
  sections: Array<{
    heading: string;
    content: string;
  }>;
}

export interface Manual {
  version: string;
  title: string;
  lastUpdated: string;
  chapters: ManualChapter[];
}

interface UseHelpResult {
  glossary: GlossaryEntry[];
  documentation: DocItem[];
  releaseNotes: DocItem[];
  manual: Manual | null;
  loading: boolean;
  error: string | null;
  fetchHelp: () => Promise<void>;
  fetchManual: () => Promise<void>;
  searchGlossary: (query: string) => GlossaryEntry[];
  searchDocumentation: (query: string) => DocItem[];
  searchReleaseNotes: (query: string) => DocItem[];
  searchAll: (query: string) => { glossary: GlossaryEntry[]; docs: DocItem[]; notes: DocItem[] };
}

export function useHelp(): UseHelpResult {
  const [glossary, setGlossary] = useState<GlossaryEntry[]>([]);
  const [documentation, setDocumentation] = useState<DocItem[]>([]);
  const [releaseNotes, setReleaseNotes] = useState<DocItem[]>([]);
  const [manual, setManual] = useState<Manual | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHelp = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/help/search?query=*`);
      if (!response.ok) throw new Error(`Failed to fetch help: ${response.statusText}`);
      const data = await response.json();

      setGlossary(data.data.glossary || []);
      setDocumentation(data.data.documentation || []);
      setReleaseNotes(data.data.releaseNotes || []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch help content';
      setError(message);
      console.error('[useHelp] Fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchManual = useCallback(async () => {
    setError(null);
    try {
      const response = await fetch(`${API_URL}/help/manual`);
      if (!response.ok) throw new Error(`Failed to fetch manual: ${response.statusText}`);
      const data = await response.json();
      console.log('[useHelp] Manual loaded:', data.data?.chapters?.length || 0, 'chapters');
      setManual(data.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch manual';
      setError(message);
      console.error('[useHelp] Manual fetch failed:', err);
    }
  }, []);

  const searchGlossary = useCallback(
    (query: string): GlossaryEntry[] => {
      if (!query) return glossary;

      const q = query.toLowerCase();
      return glossary.filter(
        (entry) =>
          entry.term.toLowerCase().includes(q) ||
          entry.definition.toLowerCase().includes(q) ||
          entry.explanation.toLowerCase().includes(q) ||
          entry.category.toLowerCase().includes(q)
      );
    },
    [glossary]
  );

  const searchDocumentation = useCallback(
    (query: string): DocItem[] => {
      if (!query) return documentation;

      const q = query.toLowerCase();
      return documentation.filter(
        (doc) =>
          doc.title.toLowerCase().includes(q) ||
          doc.content.toLowerCase().includes(q) ||
          doc.category.toLowerCase().includes(q)
      );
    },
    [documentation]
  );

  const searchReleaseNotes = useCallback(
    (query: string): DocItem[] => {
      if (!query) return releaseNotes;

      const q = query.toLowerCase();
      return releaseNotes.filter(
        (note) =>
          note.title.toLowerCase().includes(q) ||
          note.content.toLowerCase().includes(q) ||
          note.category.toLowerCase().includes(q)
      );
    },
    [releaseNotes]
  );

  const searchAll = useCallback(
    (query: string) => ({
      glossary: searchGlossary(query),
      docs: searchDocumentation(query),
      notes: searchReleaseNotes(query),
    }),
    [searchGlossary, searchDocumentation, searchReleaseNotes]
  );

  return {
    glossary,
    documentation,
    releaseNotes,
    manual,
    loading,
    error,
    fetchHelp,
    fetchManual,
    searchGlossary,
    searchDocumentation,
    searchReleaseNotes,
    searchAll,
  };
}
