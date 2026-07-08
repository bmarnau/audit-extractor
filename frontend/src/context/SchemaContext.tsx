import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * Schema Context Type Definitions
 */
export interface SchemaItem {
  id: string;
  userId: string;
  name: string;
  description?: string;
  version: number;
  schema: Record<string, any>;
  examplesCount: number;
  generatedRulesCount: number;
  averageConfidence: number;
  status: 'active' | 'archived' | 'draft';
  directoryPath?: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  isArchived?: boolean;
  previousVersionId?: string;
}

export interface ExtractionRule {
  id: string;
  type: string;
  pattern: string;
  confidence: number;
  fieldName: string;
  description?: string;
}

export interface VersionInfo {
  version: number;
  createdAt: string;
  updatedAt: string;
  description?: string;
  metadata?: Record<string, any>;
}

/**
 * Schema Context State
 */
interface SchemaContextType {
  // Schema List State
  schemas: SchemaItem[];
  totalSchemas: number;
  currentPage: number;
  
  // Current Schema State
  currentSchema: SchemaItem | null;
  currentRules: ExtractionRule[];
  versionHistory: VersionInfo[];
  
  // Loading & Error State
  loading: boolean;
  error: string | null;
  
  // Actions
  setSchemas: (schemas: SchemaItem[]) => void;
  setCurrentSchema: (schema: SchemaItem | null) => void;
  setCurrentRules: (rules: ExtractionRule[]) => void;
  setVersionHistory: (versions: VersionInfo[]) => void;
  setTotalSchemas: (total: number) => void;
  setCurrentPage: (page: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Batch Actions
  updateSchema: (schema: SchemaItem) => void;
  removeSchema: (schemaId: string) => void;
  addSchema: (schema: SchemaItem) => void;
}

/**
 * Create Context
 */
const SchemaContext = createContext<SchemaContextType | undefined>(undefined);

/**
 * Provider Component
 */
export const SchemaProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Schema List State
  const [schemas, setSchemas] = useState<SchemaItem[]>([]);
  const [totalSchemas, setTotalSchemas] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Current Schema State
  const [currentSchema, setCurrentSchema] = useState<SchemaItem | null>(null);
  const [currentRules, setCurrentRules] = useState<ExtractionRule[]>([]);
  const [versionHistory, setVersionHistory] = useState<VersionInfo[]>([]);
  
  // Loading & Error State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Clear error message
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Update schema in list
   */
  const updateSchema = useCallback((schema: SchemaItem) => {
    setSchemas(prev =>
      prev.map(s => (s.id === schema.id ? schema : s))
    );
    if (currentSchema?.id === schema.id) {
      setCurrentSchema(schema);
    }
  }, [currentSchema]);

  /**
   * Remove schema from list
   */
  const removeSchema = useCallback((schemaId: string) => {
    setSchemas(prev => prev.filter(s => s.id !== schemaId));
    if (currentSchema?.id === schemaId) {
      setCurrentSchema(null);
    }
  }, [currentSchema]);

  /**
   * Add schema to list
   */
  const addSchema = useCallback((schema: SchemaItem) => {
    setSchemas(prev => [schema, ...prev]);
  }, []);

  const value: SchemaContextType = {
    // State
    schemas,
    totalSchemas,
    currentPage,
    currentSchema,
    currentRules,
    versionHistory,
    loading,
    error,
    
    // Setters
    setSchemas,
    setCurrentSchema,
    setCurrentRules,
    setVersionHistory,
    setTotalSchemas,
    setCurrentPage,
    setLoading,
    setError,
    clearError,
    
    // Batch Actions
    updateSchema,
    removeSchema,
    addSchema,
  };

  return (
    <SchemaContext.Provider value={value}>
      {children}
    </SchemaContext.Provider>
  );
};

/**
 * Custom Hook to use Schema Context
 */
export const useSchemaContext = (): SchemaContextType => {
  const context = useContext(SchemaContext);
  if (!context) {
    throw new Error('useSchemaContext must be used within SchemaProvider');
  }
  return context;
};

export default SchemaContext;
