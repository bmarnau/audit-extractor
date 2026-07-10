/**
 * Phase 17: Schema API Hooks
 * 
 * Custom React hooks for API communication with backend
 * Provides: List, Get, Create, Update, Delete operations for schemas
 * 
 * @version 0.17.0
 * @phase 17
 */

import { useState, useCallback, useEffect } from 'react';

// API Base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Schema Interface - Updated for Phase 17/18 (matches PostgreSQL schema)
 */
export interface Schema {
  id: string;
  name: string;
  description: string;
  documentType?: string;
  schema?: Record<string, any>;
  version: string;
  isActive: boolean;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
  fieldsCount?: number;
}

export interface ExtractionRule {
  id: string;
  type: string;
  pattern: string;
  confidence: number;
  fieldName: string;
  description: string;
}

export interface VersionInfo {
  version: number;
  createdAt: string;
  updatedAt: string;
  description: string;
  metadata: Record<string, any>;
}

/**
 * Hook: useSchemas - List all schemas
 */
export const useSchemas = (page = 1, limit = 20) => {
  const [schemas, setSchemas] = useState<Schema[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchemas = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/schema/schemas?page=${page}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      // API Response format: {data: [schemas], timestamp, path, duration}
      // So data.data is the schemas array
      setSchemas(data.data || []);
      // Total is part of the schemas if returned, otherwise 0
      setTotal(data.total || data.data?.length || 0);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch schemas';
      setError(errorMsg);
      console.error('useSchemas error:', err);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchSchemas();
  }, [fetchSchemas]);

  return { schemas, total, loading, error, refetch: fetchSchemas };
};

/**
 * Hook: useSchema - Get single schema by ID
 */
export const useSchema = (schemaId: string | null) => {
  const [schema, setSchema] = useState<Schema | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSchema = useCallback(async () => {
    if (!schemaId) {
      setSchema(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/schema/${schemaId}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setSchema(data);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch schema';
      setError(errorMsg);
      console.error('useSchema error:', err);
    } finally {
      setLoading(false);
    }
  }, [schemaId]);

  useEffect(() => {
    fetchSchema();
  }, [fetchSchema]);

  return { schema, loading, error, refetch: fetchSchema };
};

/**
 * Hook: useRules - Get rules for a schema
 */
export const useRules = (schemaId: string | null) => {
  const [rules, setRules] = useState<ExtractionRule[]>([]);
  const [stats, setStats] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    if (!schemaId) {
      setRules([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/schema/${schemaId}/rules`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setRules(data.rules || []);
      setStats(data.statistics || {});
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch rules';
      setError(errorMsg);
      console.error('useRules error:', err);
    } finally {
      setLoading(false);
    }
  }, [schemaId]);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  return { rules, stats, loading, error, refetch: fetchRules };
};

/**
 * Hook: useVersionHistory - Get version history for a schema
 */
export const useVersionHistory = (schemaId: string | null) => {
  const [versions, setVersions] = useState<VersionInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVersionHistory = useCallback(async () => {
    if (!schemaId) {
      setVersions([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/schema/${schemaId}/version-history`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setVersions(data.versions || []);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch version history';
      setError(errorMsg);
      console.error('useVersionHistory error:', err);
    } finally {
      setLoading(false);
    }
  }, [schemaId]);

  useEffect(() => {
    fetchVersionHistory();
  }, [fetchVersionHistory]);

  return { versions, loading, error, refetch: fetchVersionHistory };
};

/**
 * Hook: useCreateSchema - Create new schema
 */
export const useCreateSchema = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSchema = useCallback(async (schemaData: Partial<Schema>) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/schema/upload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(schemaData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to create schema';
      setError(errorMsg);
      console.error('useCreateSchema error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createSchema, loading, error };
};

/**
 * Hook: useUpdateSchema - Update existing schema
 */
export const useUpdateSchema = (schemaId: string | null) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateSchema = useCallback(
    async (updates: Partial<Schema>) => {
      if (!schemaId) {
        throw new Error('Schema ID is required');
      }

      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_BASE_URL}/schema/${schemaId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update schema';
        setError(errorMsg);
        console.error('useUpdateSchema error:', err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [schemaId]
  );

  return { updateSchema, loading, error };
};

/**
 * Hook: useDeleteSchema - Delete a schema
 */
export const useDeleteSchema = (schemaId: string | null) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteSchema = useCallback(async () => {
    if (!schemaId) {
      throw new Error('Schema ID is required');
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE_URL}/schema/${schemaId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return { success: true };
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete schema';
      setError(errorMsg);
      console.error('useDeleteSchema error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [schemaId]);

  return { deleteSchema, loading, error };
};

/**
 * Hook: useGenerateRules - Generate rules for a schema
 */
export const useGenerateRules = (schemaId: string | null) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRules = useCallback(async () => {
    if (!schemaId) {
      throw new Error('Schema ID is required');
    }

    try {
      setLoading(true);
      setError(null);
      const response = await fetch(
        `${API_BASE_URL}/schema/${schemaId}/generate-rules`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate rules';
      setError(errorMsg);
      console.error('useGenerateRules error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [schemaId]);

  return { generateRules, loading, error };
};
