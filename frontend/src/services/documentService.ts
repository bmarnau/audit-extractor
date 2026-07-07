/**
 * Mock Document Service
 * 
 * Simuliert Dokument-Verwaltung mit in-Memory Daten.
 * Später durch echte REST API ersetzbar.
 */

export interface DocumentMetadata {
  id: string;
  name: string;
  type: 'pdf' | 'docx' | 'html';
  size: number;
  uploadedAt: Date;
  lastModified: Date;
  extractionStatus: 'pending' | 'processing' | 'completed' | 'failed';
  confidenceScore?: number;
  pageCount?: number;
}

class DocumentService {
  private documents: Map<string, DocumentMetadata> = new Map();
  private listeners: Set<() => void> = new Set();

  constructor() {
    // Initialisiere mit Mock-Daten
    this.initializeMockData();
  }

  /**
   * Initialisiert Mock-Dokumente für Entwicklung.
   */
  private initializeMockData(): void {
    const mockDocs: DocumentMetadata[] = [
      {
        id: 'doc-001',
        name: 'invoice-2024-01.pdf',
        type: 'pdf',
        size: 245600,
        uploadedAt: new Date('2024-01-15'),
        lastModified: new Date('2024-01-15'),
        extractionStatus: 'completed',
        confidenceScore: 0.94,
        pageCount: 2,
      },
      {
        id: 'doc-002',
        name: 'contract-sample.docx',
        type: 'docx',
        size: 156300,
        uploadedAt: new Date('2024-01-20'),
        lastModified: new Date('2024-01-20'),
        extractionStatus: 'completed',
        confidenceScore: 0.87,
      },
      {
        id: 'doc-003',
        name: 'report.html',
        type: 'html',
        size: 89500,
        uploadedAt: new Date('2024-01-22'),
        lastModified: new Date('2024-01-22'),
        extractionStatus: 'processing',
      },
      {
        id: 'doc-004',
        name: 'invoice-2024-02.pdf',
        type: 'pdf',
        size: 267800,
        uploadedAt: new Date('2024-01-25'),
        lastModified: new Date('2024-01-25'),
        extractionStatus: 'failed',
      },
    ];

    mockDocs.forEach((doc) => {
      this.documents.set(doc.id, doc);
    });
  }

  /**
   * Listet alle Dokumente auf.
   */
  async listDocuments(): Promise<DocumentMetadata[]> {
    // Simuliere Netzwerk-Latenz
    await this.delay(300);
    return Array.from(this.documents.values()).sort(
      (a, b) => b.uploadedAt.getTime() - a.uploadedAt.getTime()
    );
  }

  /**
   * Holt Metadaten eines Dokuments.
   */
  async getDocumentMetadata(id: string): Promise<DocumentMetadata | null> {
    await this.delay(100);
    return this.documents.get(id) || null;
  }

  /**
   * Simuliert Datei-Upload.
   */
  async uploadDocument(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<DocumentMetadata> {
    // Simuliere Upload-Fortschritt
    for (let i = 0; i <= 100; i += 20) {
      await this.delay(100);
      onProgress?.(i);
    }

    const type = this.detectFileType(file.name);
    const doc: DocumentMetadata = {
      id: `doc-${Date.now()}`,
      name: file.name,
      type: type as 'pdf' | 'docx' | 'html',
      size: file.size,
      uploadedAt: new Date(),
      lastModified: new Date(),
      extractionStatus: 'pending',
    };

    this.documents.set(doc.id, doc);
    this.notifyListeners();

    return doc;
  }

  /**
   * Simuliert Datei-Löschen.
   */
  async deleteDocument(id: string): Promise<void> {
    await this.delay(200);
    const deleted = this.documents.delete(id);
    if (deleted) {
      this.notifyListeners();
    }
  }

  /**
   * Simuliert Datei-Download/Anzeige.
   */
  async getDocumentContent(id: string): Promise<Blob> {
    await this.delay(500);
    const doc = this.documents.get(id);
    if (!doc) {
      throw new Error(`Document ${id} not found`);
    }

    // Simuliere verschiedene Inhalte basierend auf Dateityp
    const content = `[Mock ${doc.type.toUpperCase()} Content]\n\nDocument: ${doc.name}\nSize: ${doc.size} bytes\nUploaded: ${doc.uploadedAt.toISOString()}`;
    return new Blob([content], { type: 'text/plain' });
  }

  /**
   * Detektiert Dateityp aus Dateinamen.
   */
  private detectFileType(filename: string): string {
    if (filename.endsWith('.pdf')) return 'pdf';
    if (filename.endsWith('.docx')) return 'docx';
    if (filename.endsWith('.html')) return 'html';
    return 'pdf'; // Default
  }

  /**
   * Registriert Listener für Datenänderungen.
   */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Benachrichtigt alle Listener.
   */
  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  /**
   * Hilfsfunktion für Verzögerung.
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton-Instanz
export const documentService = new DocumentService();
