/**
 * Hook: useDocuments
 * 
 * Verwaltet Dokument-Zustand und Operationen.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  documentService,
  DocumentMetadata,
} from '../services/documentService';

interface UseDocumentsResult {
  documents: DocumentMetadata[];
  loading: boolean;
  error: string | null;
  uploadProgress: number;
  refreshDocuments: () => Promise<void>;
  uploadDocument: (file: File) => Promise<DocumentMetadata>;
  deleteDocument: (id: string) => Promise<void>;
  getDocumentContent: (id: string) => Promise<Blob>;
}

export const useDocuments = (): UseDocumentsResult => {
  const [documents, setDocuments] = useState<DocumentMetadata[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Lade Dokumente beim Mount und abonniere Änderungen
  useEffect(() => {
    const loadDocuments = async () => {
      try {
        setLoading(true);
        setError(null);
        const docs = await documentService.listDocuments();
        setDocuments(docs);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load documents');
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();

    // Abonniere Änderungen
    const unsubscribe = documentService.subscribe(() => {
      loadDocuments();
    });

    return () => unsubscribe();
  }, []);

  const refreshDocuments = useCallback(async () => {
    try {
      setError(null);
      const docs = await documentService.listDocuments();
      setDocuments(docs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh documents');
    }
  }, []);

  const uploadDocument = useCallback(async (file: File): Promise<DocumentMetadata> => {
    try {
      setError(null);
      setUploadProgress(0);
      const doc = await documentService.uploadDocument(file, (progress) => {
        setUploadProgress(progress);
      });
      setUploadProgress(0);
      return doc;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      throw err;
    }
  }, []);

  const deleteDocument = useCallback(async (id: string) => {
    try {
      setError(null);
      await documentService.deleteDocument(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      throw err;
    }
  }, []);

  const getDocumentContent = useCallback(async (id: string): Promise<Blob> => {
    try {
      setError(null);
      return await documentService.getDocumentContent(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get document content');
      throw err;
    }
  }, []);

  return {
    documents,
    loading,
    error,
    uploadProgress,
    refreshDocuments,
    uploadDocument,
    deleteDocument,
    getDocumentContent,
  };
};
