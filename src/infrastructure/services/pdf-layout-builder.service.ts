/**
 * PDF Layout Builder
 * Provides standard layouts for different report types
 * Version: 0.37.1
 */

export interface LayoutOptions {
  title: string;
  author: string;
  subject: string;
  keywords: string[];
  pageSize?: string; // 'A4' (default), 'Letter', 'A3'
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  fontSize?: {
    title: number;
    heading: number;
    subheading: number;
    body: number;
    footer: number;
  };
}

export interface PDFLayoutTemplate {
  name: string;
  margins: { top: number; bottom: number; left: number; right: number };
  pageWidth: number;
  pageHeight: number;
  contentWidth: number;
  fontSize: {
    title: number;
    heading: number;
    subheading: number;
    body: number;
    footer: number;
  };
  colors: {
    primary: string;
    secondary: string;
    text: string;
    lightGray: string;
    border: string;
  };
}

export class PDFLayoutBuilder {
  private static readonly LAYOUTS: Record<string, PDFLayoutTemplate> = {
    A4_DEFAULT: {
      name: 'A4 Default',
      margins: { top: 40, bottom: 40, left: 40, right: 40 },
      pageWidth: 595, // A4 width in points
      pageHeight: 842, // A4 height in points
      contentWidth: 515, // pageWidth - margins
      fontSize: {
        title: 24,
        heading: 14,
        subheading: 12,
        body: 10,
        footer: 8,
      },
      colors: {
        primary: '#1f77b4',
        secondary: '#ff7f0e',
        text: '#333333',
        lightGray: '#f5f5f5',
        border: '#cccccc',
      },
    },

    MANAGEMENT_REPORT: {
      name: 'Management Report',
      margins: { top: 50, bottom: 40, left: 40, right: 40 },
      pageWidth: 595,
      pageHeight: 842,
      contentWidth: 515,
      fontSize: {
        title: 26,
        heading: 14,
        subheading: 11,
        body: 10,
        footer: 9,
      },
      colors: {
        primary: '#0052cc',
        secondary: '#ff5630',
        text: '#161b22',
        lightGray: '#f6f8fa',
        border: '#d0d7de',
      },
    },

    TECHNICAL_AUDIT: {
      name: 'Technical Audit Report',
      margins: { top: 45, bottom: 40, left: 40, right: 40 },
      pageWidth: 595,
      pageHeight: 842,
      contentWidth: 515,
      fontSize: {
        title: 22,
        heading: 13,
        subheading: 11,
        body: 9,
        footer: 8,
      },
      colors: {
        primary: '#2d3748',
        secondary: '#ed8936',
        text: '#1a202c',
        lightGray: '#edf2f7',
        border: '#cbd5e0',
      },
    },
  };

  /**
   * Get layout template by name
   */
  static getLayout(layoutName: string = 'A4_DEFAULT'): PDFLayoutTemplate {
    return (
      this.LAYOUTS[layoutName] || {
        ...this.LAYOUTS['A4_DEFAULT'],
        name: layoutName || 'Custom Layout',
      }
    );
  }

  /**
   * Create custom layout based on options
   */
  static createCustomLayout(
    name: string,
    options: Partial<PDFLayoutTemplate> = {}
  ): PDFLayoutTemplate {
    const defaultLayout = this.LAYOUTS['A4_DEFAULT'];

    return {
      name: options.name || name,
      margins: options.margins || defaultLayout.margins,
      pageWidth: options.pageWidth || defaultLayout.pageWidth,
      pageHeight: options.pageHeight || defaultLayout.pageHeight,
      contentWidth: options.contentWidth || defaultLayout.contentWidth,
      fontSize: { ...defaultLayout.fontSize, ...options.fontSize },
      colors: { ...defaultLayout.colors, ...options.colors },
    };
  }

  /**
   * Get layout for report type
   */
  static getReportLayout(reportType: 'management' | 'technical' | 'default'): PDFLayoutTemplate {
    const layoutMap: Record<string, string> = {
      management: 'MANAGEMENT_REPORT',
      technical: 'TECHNICAL_AUDIT',
      default: 'A4_DEFAULT',
    };

    return this.getLayout(layoutMap[reportType] || 'A4_DEFAULT');
  }

  /**
   * Calculate text position based on layout
   */
  static calculatePosition(
    layout: PDFLayoutTemplate,
    row: number,
    lineHeight: number = 20
  ): { x: number; y: number } {
    return {
      x: layout.margins.left,
      y: layout.margins.top + row * lineHeight,
    };
  }

  /**
   * Get available layouts
   */
  static getAvailableLayouts(): string[] {
    return Object.keys(this.LAYOUTS);
  }

  /**
   * Validate layout
   */
  static validateLayout(layout: PDFLayoutTemplate): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!layout.name) errors.push('Layout must have a name');
    if (layout.contentWidth <= 0) errors.push('Content width must be positive');
    if (layout.pageWidth <= layout.margins.left + layout.margins.right) {
      errors.push('Page width must be larger than left + right margins');
    }
    if (layout.fontSize.body <= 0) errors.push('Body font size must be positive');

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
