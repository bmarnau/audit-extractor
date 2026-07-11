/**
 * DocumentStructure - Value Object for document structure analysis
 *
 * @version 0.23.0
 * @phase 23 - Extraction Pipeline
 */

/**
 * Hierarchical section node
 */
export interface StructureNode {
  nodeId: string; // node_0001 format
  title: string;
  level: number; // 1-6 for headings
  type: 'chapter' | 'section' | 'subsection' | 'table' | 'list' | 'appendix' | 'toc';
  pageStart: number;
  pageEnd: number;
  contentLength: number;
  children: StructureNode[];
  metadata: {
    isNumerated: boolean;
    numerationPrefix?: string;
    wordCount: number;
    tableCount: number;
    imageCount: number;
    confidence: number;
  };
}

/**
 * Document structure analysis result
 */
export interface DocumentStructure {
  structureId: string; // struct_0001 format
  documentId: string;
  rootNodes: StructureNode[];
  flatNodes: StructureNode[];
  statistics: {
    totalNodes: number;
    maxDepth: number;
    chapterCount: number;
    sectionCount: number;
    tableCount: number;
    appendixCount: number;
    estimatedOutlineCompleteness: number; // 0-1 confidence
  };
  detectedPatterns: {
    hasTableOfContents: boolean;
    hasAppendices: boolean;
    hasNumeration: boolean;
    numerationScheme?: string;
  };
  analysisMetadata: {
    analyzedAt: string;
    analysisDurationMs: number;
    algorithm: string;
  };
}

/**
 * Factory for DocumentStructure
 */
export class DocumentStructureFactory {
  private static structureCounter = 0;
  private static nodeCounter = 0;

  /**
   * Create new structure node
   */
  static createNode(
    title: string,
    level: number,
    type: 'chapter' | 'section' | 'subsection' | 'table' | 'list' | 'appendix' | 'toc',
    pageStart: number,
    pageEnd: number,
    contentLength: number,
    metadata?: {
      wordCount?: number;
      tableCount?: number;
      imageCount?: number;
      isNumerated?: boolean;
      numerationPrefix?: string;
      confidence?: number;
    }
  ): StructureNode {
    if (level < 1 || level > 6) {
      throw new Error('level must be between 1 and 6');
    }

    if (pageStart < 1 || pageEnd < pageStart) {
      throw new Error('Invalid page range');
    }

    if (contentLength < 0) {
      throw new Error('contentLength cannot be negative');
    }

    this.nodeCounter++;
    const nodeId = `node_${String(this.nodeCounter).padStart(4, '0')}`;

    return {
      nodeId,
      title: title || `Node ${level}`,
      level,
      type,
      pageStart,
      pageEnd,
      contentLength,
      children: [],
      metadata: {
        isNumerated: metadata?.isNumerated ?? false,
        numerationPrefix: metadata?.numerationPrefix,
        wordCount: metadata?.wordCount ?? 0,
        tableCount: metadata?.tableCount ?? 0,
        imageCount: metadata?.imageCount ?? 0,
        confidence: metadata?.confidence ?? 0.75,
      },
    };
  }

  /**
   * Create document structure
   */
  static create(
    documentId: string,
    rootNodes: StructureNode[]
  ): DocumentStructure {
    if (!rootNodes || rootNodes.length === 0) {
      throw new Error('rootNodes cannot be empty');
    }

    this.structureCounter++;
    const structureId = `struct_${String(this.structureCounter).padStart(4, '0')}`;

    // Flatten nodes for easier traversal
    const flatNodes = this.flattenNodes(rootNodes);

    // Calculate statistics
    const maxDepth = this.calculateDepth(rootNodes);
    const chapterCount = flatNodes.filter((n) => n.type === 'chapter').length;
    const sectionCount = flatNodes.filter((n) => n.type === 'section').length;
    const tableCount = flatNodes.filter((n) => n.type === 'table').length;
    const appendixCount = flatNodes.filter((n) => n.type === 'appendix').length;

    // Detect patterns
    const hasTableOfContents = flatNodes.some((n) => n.type === 'toc');
    const hasAppendices = appendixCount > 0;
    const numeratedNodes = flatNodes.filter((n) => n.metadata.isNumerated);
    const hasNumeration = numeratedNodes.length > 0;

    // Estimate completeness (higher if structure is well-formed)
    const completeness = Math.min(1, flatNodes.length / 50); // Normalized to 50 nodes

    return {
      structureId,
      documentId,
      rootNodes,
      flatNodes,
      statistics: {
        totalNodes: flatNodes.length,
        maxDepth,
        chapterCount,
        sectionCount,
        tableCount,
        appendixCount,
        estimatedOutlineCompleteness: completeness,
      },
      detectedPatterns: {
        hasTableOfContents,
        hasAppendices,
        hasNumeration,
        numerationScheme: hasNumeration ? this.detectNumerationScheme(numeratedNodes) : undefined,
      },
      analysisMetadata: {
        analyzedAt: new Date().toISOString(),
        analysisDurationMs: 0,
        algorithm: 'HeadingHierarchyAnalysis v1.0',
      },
    };
  }

  /**
   * Flatten hierarchical structure
   */
  private static flattenNodes(nodes: StructureNode[]): StructureNode[] {
    const flat: StructureNode[] = [];

    const traverse = (nodeList: StructureNode[]): void => {
      for (const node of nodeList) {
        flat.push(node);
        if (node.children.length > 0) {
          traverse(node.children);
        }
      }
    };

    traverse(nodes);
    return flat;
  }

  /**
   * Calculate maximum depth of tree
   */
  private static calculateDepth(nodes: StructureNode[]): number {
    let maxDepth = 1;

    const traverse = (nodeList: StructureNode[], depth: number): void => {
      maxDepth = Math.max(maxDepth, depth);
      for (const node of nodeList) {
        if (node.children.length > 0) {
          traverse(node.children, depth + 1);
        }
      }
    };

    if (nodes.length > 0) {
      traverse(nodes, 1);
    }

    return maxDepth;
  }

  /**
   * Detect numeration scheme (e.g., "1.2.3")
   */
  private static detectNumerationScheme(numeratedNodes: StructureNode[]): string {
    if (numeratedNodes.length === 0) return 'Unknown';

    const prefixes = numeratedNodes
      .map((n) => n.metadata.numerationPrefix)
      .filter((p) => p)
      .slice(0, 3);

    const patterns = prefixes.map((p) => {
      const parts = p!.split('.');
      return parts.length;
    });

    const maxParts = Math.max(...patterns);
    return Array(maxParts).fill('n').join('.');
  }

  /**
   * Reset counters for testing
   */
  static reset(): void {
    this.structureCounter = 0;
    this.nodeCounter = 0;
  }
}
