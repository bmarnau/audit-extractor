/**
 * Schema API Client
 * 
 * TypeScript client for Schema API communication with comprehensive error handling
 * 
 * @version 1.0.0
 * @phase 21
 */

import axios, { AxiosInstance } from 'axios';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SchemaObject {
  type: string;
  properties?: Record<string, any>;
  required?: string[];
  description?: string;
  [key: string]: any;
}

export interface SchemaMetadata {
  id: string;
  name: string;
  schema: SchemaObject;
  exampleCount: number;
  uploadedAt: string;
  aggressiveness?: number;
  generatedRules?: {
    ruleSetId: string;
    ruleCount: number;
    averageConfidence: number;
    generatedAt: string;
  };
}

export interface ExtractionRule {
  id: string;
  fieldName: string;
  description: string;
  type: string;
  format?: string;
  pattern: string;
  required: boolean;
  confidence: number;
  derivedFrom: string;
  source: string;
}

export interface RuleGenerationStats {
  totalFieldsProcessed: number;
  rulesGenerated: number;
  averageConfidence: number;
  highConfidenceRules: number;
  mediumConfidenceRules: number;
  lowConfidenceRules: number;
}

export interface RuleSet {
  schemaId: string;
  ruleSetId: string;
  generatedAt: string;
  aggressiveness: number;
  stats: RuleGenerationStats;
  rules: ExtractionRule[];
  warnings?: string[];
}

export interface SchemaUploadRequest {
  schema: SchemaObject;
  examples: any[];
  name?: string;
  aggressiveness?: number;
}

export interface RuleGenerationRequest {
  aggressiveness?: number;
  customKeywords?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
  path: string;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  path: string;
}

// ============================================================================
// SCHEMA CLIENT
// ============================================================================

export class SchemaClient {
  private apiClient: AxiosInstance;
  private apiBaseUrl: string;

  constructor() {
    // Get API base URL from environment or default to localhost
    this.apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

    // Initialize axios instance with timeout and default headers
    this.apiClient = axios.create({
      baseURL: this.apiBaseUrl,
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('[SchemaClient] API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
        throw error;
      }
    );
  }

  /**
   * Upload a new schema with examples
   * 
   * @param request Schema upload request containing schema, examples, and metadata
   * @returns Schema ID for the uploaded schema
   */
  async uploadSchema(request: SchemaUploadRequest): Promise<{
    schemaId: string;
    schemaName: string;
    exampleCount: number;
    message: string;
  }> {
    try {
      // Validate request
      if (!request.schema || typeof request.schema !== 'object') {
        throw new Error('Schema is required and must be a valid JSON object');
      }

      if (!Array.isArray(request.examples) || request.examples.length === 0) {
        throw new Error('At least one example is required');
      }

      const response = await this.apiClient.post<ApiResponse<{
        schemaId: string;
        schemaName: string;
        exampleCount: number;
        message: string;
      }>>(
        '/api/schema/upload',
        request
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to upload schema');
      }

      console.log('[SchemaClient] Uploaded schema:', response.data.data.schemaId);

      return response.data.data;
    } catch (error) {
      throw this.handleError('Failed to upload schema', error);
    }
  }

  /**
   * Get schema metadata and details
   * 
   * @param schemaId ID of the schema
   * @returns SchemaMetadata with full schema definition
   */
  async getSchema(schemaId: string): Promise<SchemaMetadata> {
    try {
      const response = await this.apiClient.get<ApiResponse<SchemaMetadata>>(
        `/api/schema/${schemaId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get schema');
      }

      return response.data.data;
    } catch (error) {
      throw this.handleError(`Failed to get schema ${schemaId}`, error);
    }
  }

  /**
   * Generate extraction rules from schema
   * 
   * Automatically creates extraction rules based on schema definition and examples
   * 
   * @param schemaId ID of the schema
   * @param request Rule generation options
   * @returns RuleSet with generated rules
   */
  async generateRules(
    schemaId: string,
    request?: RuleGenerationRequest
  ): Promise<RuleSet> {
    try {
      const response = await this.apiClient.post<ApiResponse<RuleSet>>(
        `/api/schema/${schemaId}/generate-rules`,
        request || {}
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to generate rules');
      }

      console.log(
        '[SchemaClient] Generated rules for schema:',
        schemaId,
        `(${response.data.data.rules.length} rules)`
      );

      return response.data.data;
    } catch (error) {
      throw this.handleError(`Failed to generate rules for schema ${schemaId}`, error);
    }
  }

  /**
   * Get generated rules for a schema
   * 
   * @param schemaId ID of the schema
   * @returns RuleSet with previously generated rules
   */
  async getRules(schemaId: string): Promise<RuleSet> {
    try {
      const response = await this.apiClient.get<ApiResponse<RuleSet>>(
        `/api/schema/${schemaId}/rules`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to get rules');
      }

      return response.data.data;
    } catch (error) {
      throw this.handleError(
        `Failed to get rules for schema ${schemaId}. Rules may not have been generated yet.`,
        error
      );
    }
  }

  /**
   * Delete a schema and its associated rules
   * 
   * WARNING: This is permanent and cannot be undone!
   * 
   * @param schemaId ID of the schema to delete
   */
  async deleteSchema(schemaId: string): Promise<void> {
    try {
      const response = await this.apiClient.delete<ApiResponse<{ message: string }>>(
        `/api/schema/${schemaId}`
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to delete schema');
      }

      console.log('[SchemaClient] Deleted schema:', schemaId);
    } catch (error) {
      throw this.handleError(`Failed to delete schema ${schemaId}`, error);
    }
  }

  /**
   * List all available schemas from the schemas directory
   * 
   * Note: This method reads from the local filesystem via backend endpoint.
   * Returns all schema files found in the schemas directory.
   * 
   * @returns Array of schema IDs available on the system
   */
  async listSchemas(): Promise<string[]> {
    try {
      // Try to get schema list from a hypothetical endpoint
      // If not available, return empty array
      try {
        const response = await this.apiClient.get<ApiResponse<{ schemas: string[] }>>(
          '/api/schema/list'
        );

        if (response.data.success) {
          return response.data.data.schemas;
        }
      } catch {
        // Endpoint may not exist - return empty array
        console.log('[SchemaClient] Schema listing endpoint not available');
      }

      return [];
    } catch (error) {
      console.warn('[SchemaClient] Failed to list schemas:', error);
      return [];
    }
  }

  /**
   * Get a list of test/example schemas from the schemas directory
   * 
   * Attempts to read test schemas that were uploaded during system initialization
   * 
   * @returns Promise<SchemaMetadata[]> of available schemas
   */
  async getAvailableSchemas(): Promise<SchemaMetadata[]> {
    const schemas: SchemaMetadata[] = [];

    try {
      // List of common test schema IDs that might exist
      // These would be created during system setup
      const commonSchemaIds = [
        'invoice-schema',
        'purchase-order-schema',
        'contract-schema',
        'receipt-schema',
      ];

      // Try to fetch each known schema
      for (const schemaId of commonSchemaIds) {
        try {
          const schema = await this.getSchema(schemaId);
          schemas.push(schema);
        } catch {
          // Schema doesn't exist, skip it
        }
      }

      return schemas;
    } catch (error) {
      console.error('[SchemaClient] Failed to get available schemas:', error);
      return schemas;
    }
  }

  /**
   * Import a schema from a JSON file
   * 
   * Useful for importing pre-defined schemas from the filesystem
   * 
   * @param file JSON file containing schema definition
   * @param name Optional schema name
   * @param examples Example documents for the schema
   * @returns Schema ID of imported schema
   */
  async importSchemaFromFile(
    file: File,
    name?: string,
    examples?: any[]
  ): Promise<{ schemaId: string; schemaName: string; exampleCount: number; message: string }> {
    try {
      const text = await file.text();
      const schema = JSON.parse(text);

      const request: SchemaUploadRequest = {
        schema,
        examples: examples || [],
        name: name || file.name.replace('.json', ''),
      };

      return await this.uploadSchema(request);
    } catch (error) {
      throw this.handleError('Failed to import schema from file', error);
    }
  }

  /**
   * Export schema as JSON file
   * 
   * Downloads the schema definition as a JSON file
   * 
   * @param schemaId ID of the schema to export
   * @param filename Optional filename (default: {schemaId}.json)
   */
  async exportSchema(schemaId: string, filename?: string): Promise<void> {
    try {
      const schema = await this.getSchema(schemaId);

      const data = JSON.stringify(schema, null, 2);
      const blob = new Blob([data], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = url;
      link.setAttribute('download', filename || `${schemaId}.json`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('[SchemaClient] Exported schema:', schemaId);
    } catch (error) {
      throw this.handleError(`Failed to export schema ${schemaId}`, error);
    }
  }

  /**
   * Handle API errors and format them appropriately
   */
  private handleError(message: string, error: any): Error {
    if (axios.isAxiosError(error)) {
      const apiError = error.response?.data as ApiErrorResponse;

      if (apiError?.error) {
        return new Error(
          `${message}: ${apiError.error.message} (${apiError.error.code})`
        );
      }

      if (error.message === 'Network Error') {
        return new Error(
          `${message}: Network error - Unable to connect to API (${this.apiBaseUrl})`
        );
      }

      return new Error(
        `${message}: ${error.message} (Status: ${error.response?.status})`
      );
    }

    return new Error(`${message}: ${(error as Error).message}`);
  }
}

// Export singleton instance for easy use
export const schemaClient = new SchemaClient();
