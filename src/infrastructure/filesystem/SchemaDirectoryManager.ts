import { injectable } from 'tsyringe';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';

const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const rm = promisify(fs.rm);
const copyFile = promisify(fs.copyFile);

/**
 * SchemaPaths: Structure of directories for a schema
 */
export interface SchemaPaths {
  schemaRoot: string;     // {baseDir}/schemas/{schemaId}
  schemaFile: string;     // {schemaRoot}/schema.json
  metadataFile: string;   // {schemaRoot}/metadata.json
  rulesDir: string;       // {schemaRoot}/rules
  rulesFile: string;      // {schemaRoot}/rules/rules.json
  rulesStatsFile: string; // {schemaRoot}/rules/statistics.json
  examplesDir: string;    // {schemaRoot}/examples
  sourcesDir: string;     // {schemaRoot}/source-docs
  resultsDir: string;     // {schemaRoot}/results
  archiveDir: string;     // {schemaRoot}/.archive
}

/**
 * SchemaDirectoryManager: Manages filesystem operations for schemas
 * Each schema gets its own directory structure with proper organization
 */
@injectable()
export class SchemaDirectoryManager {
  private baseDirectory: string;
  private isInitialized: boolean = false;

  constructor() {
    // Base directory for all schemas
    this.baseDirectory = path.join(process.cwd(), 'schemas');
  }

  /**
   * Initialize the base schemas directory
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      await mkdir(this.baseDirectory, { recursive: true });
      this.isInitialized = true;
      console.log(`✅ Schema directory initialized: ${this.baseDirectory}`);
    } catch (error) {
      throw new Error(`Failed to initialize schema directory: ${error}`);
    }
  }

  /**
   * Get all paths for a specific schema
   */
  getSchemaPaths(schemaId: string): SchemaPaths {
    const schemaRoot = path.join(this.baseDirectory, schemaId);

    return {
      schemaRoot,
      schemaFile: path.join(schemaRoot, 'schema.json'),
      metadataFile: path.join(schemaRoot, 'metadata.json'),
      rulesDir: path.join(schemaRoot, 'rules'),
      rulesFile: path.join(schemaRoot, 'rules', 'rules.json'),
      rulesStatsFile: path.join(schemaRoot, 'rules', 'statistics.json'),
      examplesDir: path.join(schemaRoot, 'examples'),
      sourcesDir: path.join(schemaRoot, 'source-docs'),
      resultsDir: path.join(schemaRoot, 'results'),
      archiveDir: path.join(schemaRoot, '.archive'),
    };
  }

  /**
   * Create complete directory structure for a new schema
   */
  async createSchemaDirectory(schemaId: string): Promise<SchemaPaths> {
    const paths = this.getSchemaPaths(schemaId);

    try {
      // Create root directory
      await mkdir(paths.schemaRoot, { recursive: true });

      // Create subdirectories
      await mkdir(paths.rulesDir, { recursive: true });
      await mkdir(paths.examplesDir, { recursive: true });
      await mkdir(paths.sourcesDir, { recursive: true });
      await mkdir(paths.resultsDir, { recursive: true });
      await mkdir(paths.archiveDir, { recursive: true });

      console.log(`✅ Schema directory created: ${paths.schemaRoot}`);
      return paths;
    } catch (error) {
      throw new Error(`Failed to create schema directory structure: ${error}`);
    }
  }

  /**
   * Save schema definition to schema.json
   */
  async saveSchema(
    schemaId: string,
    schema: Record<string, unknown>
  ): Promise<void> {
    const paths = this.getSchemaPaths(schemaId);

    try {
      // Ensure directory exists
      await mkdir(paths.schemaRoot, { recursive: true });

      // Write schema.json
      await writeFile(
        paths.schemaFile,
        JSON.stringify(schema, null, 2),
        'utf-8'
      );

      console.log(`✅ Schema saved: ${paths.schemaFile}`);
    } catch (error) {
      throw new Error(`Failed to save schema: ${error}`);
    }
  }

  /**
   * Load schema definition from filesystem
   */
  async loadSchema(schemaId: string): Promise<Record<string, unknown>> {
    const paths = this.getSchemaPaths(schemaId);

    try {
      const content = await readFile(paths.schemaFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load schema: ${error}`);
    }
  }

  /**
   * Save metadata for a schema
   */
  async saveMetadata(
    schemaId: string,
    metadata: Record<string, unknown>
  ): Promise<void> {
    const paths = this.getSchemaPaths(schemaId);

    try {
      await mkdir(paths.schemaRoot, { recursive: true });

      await writeFile(
        paths.metadataFile,
        JSON.stringify(metadata, null, 2),
        'utf-8'
      );

      console.log(`✅ Metadata saved: ${paths.metadataFile}`);
    } catch (error) {
      throw new Error(`Failed to save metadata: ${error}`);
    }
  }

  /**
   * Load metadata for a schema
   */
  async loadMetadata(schemaId: string): Promise<Record<string, unknown>> {
    const paths = this.getSchemaPaths(schemaId);

    try {
      const content = await readFile(paths.metadataFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // Return empty object if metadata doesn't exist
      return {};
    }
  }

  /**
   * Save extraction rules to filesystem
   */
  async saveRules(
    schemaId: string,
    rules: unknown[],
    statistics?: Record<string, unknown>
  ): Promise<void> {
    const paths = this.getSchemaPaths(schemaId);

    try {
      await mkdir(paths.rulesDir, { recursive: true });

      // Save rules.json
      await writeFile(
        paths.rulesFile,
        JSON.stringify(rules, null, 2),
        'utf-8'
      );

      // Save statistics if provided
      if (statistics) {
        await writeFile(
          paths.rulesStatsFile,
          JSON.stringify(statistics, null, 2),
          'utf-8'
        );
      }

      console.log(`✅ Rules saved: ${paths.rulesFile}`);
    } catch (error) {
      throw new Error(`Failed to save rules: ${error}`);
    }
  }

  /**
   * Load extraction rules from filesystem
   */
  async loadRules(schemaId: string): Promise<unknown[]> {
    const paths = this.getSchemaPaths(schemaId);

    try {
      const content = await readFile(paths.rulesFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Failed to load rules: ${error}`);
    }
  }

  /**
   * Load rule statistics
   */
  async loadRulesStatistics(
    schemaId: string
  ): Promise<Record<string, unknown>> {
    const paths = this.getSchemaPaths(schemaId);

    try {
      const content = await readFile(paths.rulesStatsFile, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      // Return empty object if statistics don't exist
      return {};
    }
  }

  /**
   * Copy example files to schema directory
   */
  async saveExamples(
    schemaId: string,
    exampleFiles: Array<{ name: string; content: string }>
  ): Promise<void> {
    const paths = this.getSchemaPaths(schemaId);

    try {
      await mkdir(paths.examplesDir, { recursive: true });

      for (const file of exampleFiles) {
        const filePath = path.join(paths.examplesDir, file.name);
        await writeFile(filePath, file.content, 'utf-8');
      }

      console.log(
        `✅ ${exampleFiles.length} example files saved to ${paths.examplesDir}`
      );
    } catch (error) {
      throw new Error(`Failed to save example files: ${error}`);
    }
  }

  /**
   * Load all example files for a schema
   */
  async loadExamples(schemaId: string): Promise<Record<string, unknown>[]> {
    const paths = this.getSchemaPaths(schemaId);

    try {
      const files = fs.readdirSync(paths.examplesDir);
      const examples: Record<string, unknown>[] = [];

      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(paths.examplesDir, file);
          const content = await readFile(filePath, 'utf-8');
          examples.push(JSON.parse(content));
        }
      }

      return examples;
    } catch (error) {
      throw new Error(`Failed to load examples: ${error}`);
    }
  }

  /**
   * Save extraction result for a document
   */
  async saveExtractionResult(
    schemaId: string,
    documentId: string,
    result: Record<string, unknown>
  ): Promise<void> {
    const paths = this.getSchemaPaths(schemaId);
    const resultFileName = `extraction_${documentId}_${Date.now()}.json`;
    const resultPath = path.join(paths.resultsDir, resultFileName);

    try {
      await mkdir(paths.resultsDir, { recursive: true });

      await writeFile(resultPath, JSON.stringify(result, null, 2), 'utf-8');

      console.log(`✅ Extraction result saved: ${resultPath}`);
    } catch (error) {
      throw new Error(`Failed to save extraction result: ${error}`);
    }
  }

  /**
   * Archive current version of schema (for versioning)
   */
  async archiveVersion(schemaId: string, version: number): Promise<void> {
    const paths = this.getSchemaPaths(schemaId);
    const archivePath = path.join(paths.archiveDir, `v${version}`);

    try {
      await mkdir(archivePath, { recursive: true });

      // Archive schema.json if exists
      if (fs.existsSync(paths.schemaFile)) {
        const archiveSchemaPath = path.join(archivePath, 'schema.json');
        await copyFile(paths.schemaFile, archiveSchemaPath);
      }

      // Archive rules.json if exists
      if (fs.existsSync(paths.rulesFile)) {
        const archiveRulesPath = path.join(archivePath, 'rules.json');
        await copyFile(paths.rulesFile, archiveRulesPath);
      }

      console.log(`✅ Version ${version} archived at ${archivePath}`);
    } catch (error) {
      throw new Error(`Failed to archive version: ${error}`);
    }
  }

  /**
   * Delete entire schema directory (PERMANENT)
   */
  async deleteSchemaDirectory(schemaId: string): Promise<void> {
    const paths = this.getSchemaPaths(schemaId);

    try {
      if (fs.existsSync(paths.schemaRoot)) {
        await rm(paths.schemaRoot, { recursive: true, force: true });
        console.log(`✅ Schema directory deleted: ${paths.schemaRoot}`);
      }
    } catch (error) {
      throw new Error(`Failed to delete schema directory: ${error}`);
    }
  }

  /**
   * Get directory statistics for a schema
   */
  async getDirectoryStats(schemaId: string): Promise<{
    schemaFile: boolean;
    rulesCount: number;
    examplesCount: number;
    resultsCount: number;
    archiveVersions: number;
  }> {
    const paths = this.getSchemaPaths(schemaId);

    try {
      let rulesCount = 0;
      let examplesCount = 0;
      let resultsCount = 0;
      let archiveVersions = 0;

      if (fs.existsSync(paths.rulesDir)) {
        rulesCount = fs
          .readdirSync(paths.rulesDir)
          .filter((f) => f.endsWith('.json')).length;
      }

      if (fs.existsSync(paths.examplesDir)) {
        examplesCount = fs
          .readdirSync(paths.examplesDir)
          .filter((f) => f.endsWith('.json')).length;
      }

      if (fs.existsSync(paths.resultsDir)) {
        resultsCount = fs
          .readdirSync(paths.resultsDir)
          .filter((f) => f.endsWith('.json')).length;
      }

      if (fs.existsSync(paths.archiveDir)) {
        archiveVersions = fs.readdirSync(paths.archiveDir).length;
      }

      return {
        schemaFile: fs.existsSync(paths.schemaFile),
        rulesCount,
        examplesCount,
        resultsCount,
        archiveVersions,
      };
    } catch (error) {
      throw new Error(`Failed to get directory statistics: ${error}`);
    }
  }

  /**
   * Verify directory structure integrity
   */
  async verifyDirectoryStructure(schemaId: string): Promise<{
    valid: boolean;
    errors: string[];
    warnings: string[];
  }> {
    const paths = this.getSchemaPaths(schemaId);
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Check schema root exists
      if (!fs.existsSync(paths.schemaRoot)) {
        errors.push(`Schema root directory does not exist: ${paths.schemaRoot}`);
        return { valid: false, errors, warnings };
      }

      // Check required files
      if (!fs.existsSync(paths.schemaFile)) {
        warnings.push('schema.json file missing');
      }

      // Check required directories
      const requiredDirs = [
        { path: paths.rulesDir, name: 'rules' },
        { path: paths.examplesDir, name: 'examples' },
        { path: paths.sourcesDir, name: 'source-docs' },
        { path: paths.resultsDir, name: 'results' },
      ];

      for (const dir of requiredDirs) {
        if (!fs.existsSync(dir.path)) {
          warnings.push(`${dir.name} directory missing`);
        }
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
      };
    } catch (error) {
      return {
        valid: false,
        errors: [`Verification failed: ${error}`],
        warnings: [],
      };
    }
  }

  /**
   * Get base directory path
   */
  getBaseDirectory(): string {
    return this.baseDirectory;
  }

  /**
   * Check if schema directory exists
   */
  schemaDirectoryExists(schemaId: string): boolean {
    const paths = this.getSchemaPaths(schemaId);
    return fs.existsSync(paths.schemaRoot);
  }
}
