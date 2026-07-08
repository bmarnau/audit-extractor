import { injectable, inject } from 'tsyringe';
import { SchemaRepository } from '@domain/schema/SchemaRepository';
import { SchemaEntity } from '@domain/schema/SchemaEntity';
import { SchemaDirectoryManager, SchemaPaths } from '@infrastructure/filesystem/SchemaDirectoryManager';

/**
 * SchemaManagementService: Orchestrates both database and filesystem operations
 * Ensures data consistency between PostgreSQL and local filesystem
 */
@injectable()
export class SchemaManagementService {
  constructor(
    @inject(SchemaRepository)
    private schemaRepository: SchemaRepository,
    @inject(SchemaDirectoryManager)
    private directoryManager: SchemaDirectoryManager
  ) {}

  /**
   * Create schema with both database and filesystem persistence
   */
  async createSchema(input: {
    userId: string;
    name: string;
    description?: string;
    schema: Record<string, unknown>;
    examples?: Record<string, unknown>[];
  }): Promise<{
    schemaEntity: SchemaEntity;
    paths: SchemaPaths;
  }> {
    try {
      // 1. Create in database
      const schemaEntity = await this.schemaRepository.create({
        userId: input.userId,
        name: input.name,
        description: input.description || '',
        schema: input.schema,
        examplesCount: input.examples?.length || 0,
        generatedRulesCount: 0,
        averageConfidence: 0,
        status: 'active',
        directoryPath: '', // Will be set after filesystem creation
        metadata: { createdAt: new Date().toISOString() },
      });

      // 2. Create filesystem structure
      const paths = await this.directoryManager.createSchemaDirectory(
        schemaEntity.id
      );

      // 3. Save schema definition to filesystem
      await this.directoryManager.saveSchema(schemaEntity.id, input.schema);

      // 4. Save examples if provided
      if (input.examples && input.examples.length > 0) {
        const exampleFiles = input.examples.map((ex, idx) => ({
          name: `example-${idx + 1}.json`,
          content: JSON.stringify(ex, null, 2),
        }));
        await this.directoryManager.saveExamples(schemaEntity.id, exampleFiles);
      }

      // 5. Save metadata
      await this.directoryManager.saveMetadata(schemaEntity.id, {
        createdAt: new Date().toISOString(),
        examplesCount: input.examples?.length || 0,
        version: 1,
      });

      // 6. Update database with filesystem path
      const updated = await this.schemaRepository.update(schemaEntity.id, {
        directoryPath: paths.schemaRoot,
      });

      console.log(
        `✅ Schema created: DB + Filesystem (${schemaEntity.id})`
      );

      return {
        schemaEntity: updated,
        paths,
      };
    } catch (error) {
      throw new Error(
        `Failed to create schema: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Update schema with versioning
   * Archives old version before creating new one
   */
  async updateSchema(
    schemaId: string,
    input: {
      schema?: Record<string, unknown>;
      description?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<SchemaEntity> {
    try {
      // 1. Get current version
      const current = await this.schemaRepository.findById(schemaId);
      if (!current) throw new Error(`Schema ${schemaId} not found`);

      // 2. Archive current version in filesystem
      await this.directoryManager.archiveVersion(schemaId, current.version);

      // 3. Update database (triggers versioning logic)
      const updated = await this.schemaRepository.update(schemaId, {
        version: current.version + 1,
        schema: input.schema || current.schema,
        description: input.description || current.description,
        metadata: input.metadata || current.metadata,
        updatedAt: new Date(),
      });

      // 4. Update schema file if new schema provided
      if (input.schema) {
        await this.directoryManager.saveSchema(schemaId, input.schema);
      }

      // 5. Update metadata file
      if (input.metadata) {
        await this.directoryManager.saveMetadata(schemaId, input.metadata);
      }

      console.log(
        `✅ Schema updated: v${current.version} → v${updated.version}`
      );

      return updated;
    } catch (error) {
      throw new Error(
        `Failed to update schema: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Get schema with full context (DB + filesystem data)
   */
  async getSchema(schemaId: string): Promise<{
    entity: SchemaEntity;
    schema: Record<string, unknown>;
    paths: SchemaPaths;
    stats: {
      schemaFile: boolean;
      rulesCount: number;
      examplesCount: number;
      resultsCount: number;
      archiveVersions: number;
    };
  }> {
    try {
      // 1. Get from database
      const entity = await this.schemaRepository.findById(schemaId);
      if (!entity) throw new Error(`Schema ${schemaId} not found`);

      // 2. Get paths
      const paths = this.directoryManager.getSchemaPaths(schemaId);

      // 3. Load schema definition
      const schema = await this.directoryManager.loadSchema(schemaId);

      // 4. Get filesystem statistics
      const stats = await this.directoryManager.getDirectoryStats(schemaId);

      return { entity, schema, paths, stats };
    } catch (error) {
      throw new Error(
        `Failed to get schema: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Save extraction rules for a schema
   */
  async saveRules(
    schemaId: string,
    rules: unknown[],
    statistics?: Record<string, unknown>
  ): Promise<void> {
    try {
      // 1. Save to filesystem
      await this.directoryManager.saveRules(schemaId, rules, statistics);

      // 2. Update database with counts
      const entity = await this.schemaRepository.findById(schemaId);
      if (entity) {
        await this.schemaRepository.update(schemaId, {
          generatedRulesCount: rules.length,
          averageConfidence: this.calculateAverageConfidence(rules),
        });
      }

      console.log(`✅ Rules saved for schema ${schemaId}`);
    } catch (error) {
      throw new Error(
        `Failed to save rules: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Save extraction result
   */
  async saveExtractionResult(
    schemaId: string,
    documentId: string,
    result: Record<string, unknown>
  ): Promise<void> {
    try {
      await this.directoryManager.saveExtractionResult(
        schemaId,
        documentId,
        result
      );
    } catch (error) {
      throw new Error(
        `Failed to save extraction result: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Delete schema completely (DB + Filesystem)
   */
  async deleteSchema(schemaId: string): Promise<void> {
    try {
      // 1. Delete from filesystem
      await this.directoryManager.deleteSchemaDirectory(schemaId);

      // 2. Delete from database
      await this.schemaRepository.deleteAllVersions(schemaId);

      console.log(`✅ Schema deleted: ${schemaId} (DB + Filesystem)`);
    } catch (error) {
      throw new Error(
        `Failed to delete schema: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Verify schema integrity (DB + Filesystem)
   */
  async verifySchemaIntegrity(schemaId: string): Promise<{
    databaseValid: boolean;
    filesystemValid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 1. Check database
      const entity = await this.schemaRepository.findById(schemaId);
      const databaseValid = !!entity;

      if (!databaseValid) {
        errors.push(`Schema not found in database: ${schemaId}`);
      }

      // 2. Check filesystem
      const fsVerification =
        await this.directoryManager.verifyDirectoryStructure(schemaId);

      errors.push(...fsVerification.errors);
      warnings.push(...fsVerification.warnings);

      return {
        databaseValid,
        filesystemValid: fsVerification.valid,
        errors,
        warnings,
      };
    } catch (error) {
      errors.push(
        `Verification failed: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        databaseValid: false,
        filesystemValid: false,
        errors,
        warnings,
      };
    }
  }

  /**
   * Calculate average confidence from rules array
   */
  private calculateAverageConfidence(rules: unknown[]): number {
    if (!Array.isArray(rules) || rules.length === 0) return 0;

    const confidences = rules
      .map((rule: any) => rule.confidence || 0)
      .filter((c: number) => typeof c === 'number');

    if (confidences.length === 0) return 0;

    return (
      confidences.reduce((sum: number, c: number) => sum + c, 0) /
      confidences.length
    );
  }
}
