/**
 * HelpContentLoader - Service to load help content from markdown files
 * 
 * Loads:
 * - Glossary entries from /docs/glossary.md
 * - Release notes from /RELEASE_NOTES_*.md
 * - Documentation from /docs/*.md and other markdown files
 * 
 * @version 0.18.0
 * @phase 18
 */

import * as fs from 'fs';
import * as path from 'path';

export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
  explanation?: string;
  category: string;
  seeAlso?: string[];
  examples?: string[];
}

export interface DocItem {
  id: string;
  title: string;
  category: string;
  content: string;
  summary?: string;
  source: string;
  version?: string;
}

export interface ReleaseNote {
  id: string;
  version: string;
  date: string;
  title: string;
  content: string;
  category: string;
  features?: string[];
  fixes?: string[];
  summary?: string;
}

export class HelpContentLoader {
  private projectRoot: string;
  private glossaryCache: GlossaryEntry[] | null = null;
  private releaseNotesCache: ReleaseNote[] | null = null;
  private docsCache: DocItem[] | null = null;
  private isInitialized: boolean = false;

  constructor() {
    // Determine project root
    this.projectRoot = this.findProjectRoot();
  }

  /**
   * Initialize: Preload all markdown files at startup to avoid lazy-loading delays
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    console.log('[HelpContentLoader] 🚀 Initializing - preloading markdown files...');
    const startTime = Date.now();
    
    try {
      // Preload all three data sources in parallel
      await Promise.all([
        this.loadGlossary(),
        this.loadReleaseNotes(),
        this.loadDocumentation()
      ]);
      
      this.isInitialized = true;
      const elapsed = Date.now() - startTime;
      console.log(`[HelpContentLoader] ✅ Preloading complete (${elapsed}ms)`);
    } catch (err) {
      console.error('[HelpContentLoader] ❌ Preloading failed:', err);
    }
  }

  private findProjectRoot(): string {
    let current = __dirname;
    console.log(`[HelpContentLoader] Starting from __dirname: ${current}`);
    
    // Try up to 10 levels up
    for (let i = 0; i < 10; i++) {
      const packagePath = path.join(current, 'package.json');
      if (fs.existsSync(packagePath)) {
        console.log(`[HelpContentLoader] Found package.json at: ${current}`);
        return current;
      }
      const parent = path.dirname(current);
      if (parent === current) break; // reached root
      current = parent;
    }
    
    // Fallback to process.cwd()
    const cwd = process.cwd();
    console.log(`[HelpContentLoader] Using process.cwd(): ${cwd}`);
    return cwd;
  }

  /**
   * Load glossary entries from /docs/glossary.md
   */
  async loadGlossary(): Promise<GlossaryEntry[]> {
    const logFile = path.join(this.projectRoot, 'help-loader-debug.log');
    const logMsg = (msg: string) => {
      fs.appendFileSync(logFile, `[${new Date().toISOString()}] ${msg}\n`);
      console.log(msg);
    };

    logMsg(`[HelpContentLoader] loadGlossary() called`);

    if (this.glossaryCache) {
      logMsg(`[HelpContentLoader] Returning cached glossary with ${this.glossaryCache.length} entries`);
      return this.glossaryCache;
    }

    try {
      const glossaryPath = path.join(this.projectRoot, 'docs', 'glossary.md');
      logMsg(`[HelpContentLoader] Loading glossary from: ${glossaryPath}`);
      
      if (!fs.existsSync(glossaryPath)) {
        logMsg(`[HelpContentLoader] ⚠️ Glossary file NOT found at: ${glossaryPath}`);
        logMsg(`[HelpContentLoader] Checking project root: ${this.projectRoot}`);
        
        // List what's in projectRoot
        if (fs.existsSync(this.projectRoot)) {
          const files = fs.readdirSync(this.projectRoot);
          logMsg(`[HelpContentLoader] Files in project root: ${files.slice(0, 10).join(', ')}`);
        }
        
        logMsg(`[HelpContentLoader] Falling back to default glossary`);
        return this.getDefaultGlossary();
      }

      const content = fs.readFileSync(glossaryPath, 'utf-8');
      logMsg(`[HelpContentLoader] Read glossary file, content length: ${content.length}`);
      
      const entries = this.parseGlossary(content);
      
      this.glossaryCache = entries;
      logMsg(`[HelpContentLoader] ✅ Loaded ${entries.length} glossary entries from file`);
      
      return entries;
    } catch (error) {
      logMsg(`[HelpContentLoader] ❌ Error loading glossary: ${error}`);
      return this.getDefaultGlossary();
    }
  }

  /**
   * Parse glossary markdown content
   */
  private parseGlossary(content: string): GlossaryEntry[] {
    const entries: GlossaryEntry[] = [];
    const sections = content.split(/^## /m).slice(1); // Skip header

    sections.forEach((section, index) => {
      try {
        const lines = section.split('\n');
        const term = lines[0].trim();
        
        let definition = '';
        let explanation = '';
        let category = 'general';
        const seeAlso: string[] = [];
        const examples: string[] = [];

        // Parse section content
        let currentSection = '';
        for (const line of lines) {
          if (line.includes('**Definition**')) {
            currentSection = 'definition';
          } else if (line.includes('**Beispiel**') || line.includes('**Example**')) {
            currentSection = 'example';
          } else if (line.includes('**Bedeutung')) {
            currentSection = 'meaning';
          } else if (line.includes('**Kategorie**') || line.includes('**Category**')) {
            currentSection = 'category';
          } else if (currentSection === 'definition' && line.startsWith('**Definition**') === false) {
            definition += line.trim() + ' ';
          } else if (currentSection === 'meaning' && line.startsWith('**Bedeutung') === false) {
            explanation += line.trim() + ' ';
          } else if (currentSection === 'category' && !line.startsWith('**')) {
            category = line.trim().replace(/`/g, '').toLowerCase().split(' ')[0] || 'general';
          }
        }

        if (term && (definition || explanation)) {
          entries.push({
            id: `glossary-${index + 1}`,
            term: term.trim(),
            definition: definition.trim().replace(/\*\*/g, '').substring(0, 200),
            explanation: explanation.trim().replace(/\*\*/g, '').substring(0, 500),
            category: category,
            seeAlso: seeAlso,
            examples: examples,
          });
        }
      } catch (e) {
        console.debug('[HelpContentLoader] Skipped glossary entry:', e);
      }
    });

    return entries;
  }

  /**
   * Load release notes from /RELEASE_NOTES_*.md
   */
  async loadReleaseNotes(): Promise<ReleaseNote[]> {
    if (this.releaseNotesCache) {
      console.log(`[HelpContentLoader] Returning cached release notes with ${this.releaseNotesCache.length} items`);
      return this.releaseNotesCache;
    }

    try {
      console.log(`[HelpContentLoader] Loading release notes from: ${this.projectRoot}`);
      
      const releaseFiles = fs.readdirSync(this.projectRoot)
        .filter(f => f.match(/^RELEASE_NOTES_.*\.md$/))
        .sort()
        .reverse(); // Latest first

      console.log(`[HelpContentLoader] Found ${releaseFiles.length} release note files:`, releaseFiles);
      
      const notes: ReleaseNote[] = [];

      for (const file of releaseFiles) {
        const filePath = path.join(this.projectRoot, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        const parsed = this.parseReleaseNote(content, file);
        if (parsed) notes.push(parsed);
      }

      this.releaseNotesCache = notes;
      console.log(`[HelpContentLoader] ✅ Loaded ${notes.length} release notes`);
      
      return notes;
    } catch (error) {
      console.error('[HelpContentLoader] ❌ Error loading release notes:', error);
      return [];
    }
  }

  /**
   * Parse single release note
   */
  private parseReleaseNote(content: string, filename: string): ReleaseNote | null {
    try {
      const lines = content.split('\n');
      
      // Extract version from filename (e.g., RELEASE_NOTES_0.14.0.md -> 0.14.0)
      const versionMatch = filename.match(/RELEASE_NOTES_([\d.]+)/);
      const version = versionMatch ? versionMatch[1] : 'unknown';
      
      // Extract title
      const titleLine = lines.find(l => l.startsWith('#'));
      const title = titleLine ? titleLine.replace(/^#+\s+/, '').trim() : `Release ${version}`;
      
      // Extract date
      let date = new Date().toISOString().split('T')[0];
      const dateMatch = content.match(/Release Date[:\s]*([0-9]{4}-[0-9]{2}-[0-9]{2}|[0-9]{4}-[0-9]{2}-[0-9]{2})/);
      if (dateMatch) date = dateMatch[1];
      
      // Extract summary
      const summaryMatch = content.match(/Overview.*?\n\n(.*?)\n\n/s) || 
                          content.match(/## (?!.*##)(.+)/s);
      const summary = summaryMatch ? summaryMatch[1].substring(0, 300) : '';

      return {
        id: `release-${version}`,
        version,
        date,
        title,
        content: content.substring(0, 5000), // First 5000 chars
        category: 'release',
        summary: summary.replace(/\*\*|##|`/g, ''),
      };
    } catch (e) {
      console.debug('[HelpContentLoader] Failed to parse release note:', e);
      return null;
    }
  }

  /**
   * Load documentation from /docs/*.md and other markdown files
   */
  async loadDocumentation(): Promise<DocItem[]> {
    if (this.docsCache) {
      console.log(`[HelpContentLoader] Returning cached documentation with ${this.docsCache.length} items`);
      return this.docsCache;
    }

    try {
      console.log(`[HelpContentLoader] Loading documentation from: ${this.projectRoot}`);
      
      const docs: DocItem[] = [];
      
      // Load from /docs directory
      const docsDir = path.join(this.projectRoot, 'docs');
      console.log(`[HelpContentLoader] Checking docs directory: ${docsDir}`);
      
      if (fs.existsSync(docsDir)) {
        const files = fs.readdirSync(docsDir)
          .filter(f => f.endsWith('.md') && !f.startsWith('.'));
        
        console.log(`[HelpContentLoader] Found ${files.length} markdown files in /docs`);
        
        for (const file of files) {
          const filePath = path.join(docsDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const doc = this.parseDoc(content, file, `docs/${file}`);
          if (doc) docs.push(doc);
        }
      } else {
        console.warn(`[HelpContentLoader] ⚠️ Docs directory not found: ${docsDir}`);
      }

      // Load from root directory special docs
      const specialDocs = [
        'MANUAL-0.35.0.md',  // ✅ Current version manual / Betriebshandbuch (Phase 37a)
        'OPERATIONS_MANUAL_V35.md',  // ✅ Operations manual v0.35.0
        'RELEASE_NOTES_0.35.0.md',  // ✅ Release notes v0.35.0
        'MANUAL-0.25.0.md',  // Fallback to previous version
        'README.md',
        'QUICKSTART.md',
        'CONTRIBUTING.md',
        'PHASE1_USER_GUIDE.md',
        'USER-GUIDE.md',
      ];

      console.log(`[HelpContentLoader] Checking for special docs...`);
      
      for (const file of specialDocs) {
        const filePath = path.join(this.projectRoot, file);
        if (fs.existsSync(filePath)) {
          console.log(`[HelpContentLoader] Loading special doc: ${file}`);
          const content = fs.readFileSync(filePath, 'utf-8');
          const doc = this.parseDoc(content, file, file);
          if (doc) docs.push(doc);
        }
      }

      this.docsCache = docs;
      console.log(`[HelpContentLoader] ✅ Loaded ${docs.length} documentation items`);
      
      return docs;
    } catch (error) {
      console.error('[HelpContentLoader] ❌ Error loading documentation:', error);
      return [];
    }
  }

  /**
   * Parse single documentation file
   */
  private parseDoc(content: string, filename: string, source: string): DocItem | null {
    try {
      const lines = content.split('\n');
      
      // Extract title (first H1 or filename)
      const titleLine = lines.find(l => l.startsWith('# '));
      const title = titleLine ? titleLine.replace(/^#+\s+/, '').trim() : 
                   filename.replace(/\.md$/, '').replace(/[-_]/g, ' ');

      // Determine category
      let category = 'guide';
      if (filename.includes('architecture')) category = 'architecture';
      else if (filename.includes('API') || filename.includes('api')) category = 'api';
      else if (filename.includes('troubleshoot')) category = 'troubleshooting';
      else if (filename.includes('QUICK')) category = 'quickstart';
      else if (filename.includes('CONTRIB')) category = 'contributing';
      else if (filename.includes('README')) category = 'overview';

      // Extract summary (first paragraph or heading)
      let summary = '';
      for (const line of lines) {
        if (line && !line.startsWith('#') && !line.startsWith('[') && line.length > 10) {
          summary = line.substring(0, 150);
          break;
        }
      }

      return {
        id: `doc-${filename.replace(/[^a-zA-Z0-9]/g, '-')}`,
        title,
        category,
        content: content.substring(0, 10000), // First 10000 chars
        summary: summary || title,
        source,
      };
    } catch (e) {
      console.debug('[HelpContentLoader] Failed to parse documentation:', e);
      return null;
    }
  }

  /**
   * Get default fallback glossary entries
   */
  private getDefaultGlossary(): GlossaryEntry[] {
    return [
      {
        id: 'g1',
        term: 'Extraction',
        definition: 'Process of extracting structured data from documents',
        category: 'general',
      },
      {
        id: 'g2',
        term: 'Rule',
        definition: 'Definition of how to extract a field from a document',
        category: 'rules',
      },
      {
        id: 'g3',
        term: 'Validation',
        definition: 'Process of validating extracted data against rules',
        category: 'validation',
      },
      {
        id: 'g4',
        term: 'Schema',
        definition: 'JSON Schema definition for extracted data structure',
        category: 'general',
      },
      {
        id: 'g5',
        term: 'Confidence Score',
        definition: 'Measure of confidence in extracted values (0-100%)',
        category: 'metrics',
      },
      {
        id: 'g6',
        term: 'LLM',
        definition: 'Large Language Model used for intelligent extraction',
        category: 'general',
      },
      {
        id: 'g7',
        term: 'Hallucination',
        definition: 'When LLM generates incorrect information not in source',
        category: 'validation',
      },
      {
        id: 'g8',
        term: 'Chunk',
        definition: 'Segment of document content processed together',
        category: 'processing',
      },
      {
        id: 'g9',
        term: 'Backup',
        definition: 'Complete snapshot of configuration and rules',
        category: 'general',
      },
      {
        id: 'g10',
        term: 'Audit Trail',
        definition: 'Record of all extraction decisions and confidence scores',
        category: 'general',
      },
    ];
  }
}

// Singleton instance
let loaderInstance: HelpContentLoader | null = null;

export function getHelpContentLoader(): HelpContentLoader {
  if (!loaderInstance) {
    loaderInstance = new HelpContentLoader();
  }
  return loaderInstance;
}
