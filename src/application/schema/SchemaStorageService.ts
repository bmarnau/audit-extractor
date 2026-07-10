import { injectable } from "tsyringe";
import { SchemaRepository } from "../../domain/schema/SchemaRepository";
import { SchemaEntity } from "../../domain/schema/SchemaEntity";

/**
 * SchemaStorageService - Business Logic für Schema-Verwaltung
 * Koordiniert DB-Operationen und Filesystem
 */
@injectable()
export class SchemaStorageService {
  constructor(private schemaRepository: SchemaRepository) {}

  /**
   * Neues Schema erstellen
   */
  async createSchema(
    name: string,
    schema: Record<string, unknown>,
    description?: string
  ): Promise<SchemaEntity> {
    // Überprüfen ob Schema mit diesem Namen bereits existiert
    const existing = await this.schemaRepository.findByName(
      "00000000-0000-0000-0000-000000000000",
      name
    );
    if (existing) {
      throw new Error(
        `Schema mit Name "${name}" existiert bereits. Verwenden Sie update() zur Aktualisierung.`
      );
    }

    const newSchema = await this.schemaRepository.create({
      name,
      schema,
      description,
      createdBy: "00000000-0000-0000-0000-000000000000",
    });

    return newSchema;
  }

  /**
   * Schema aktualisieren (neue Version erstellen)
   */
  async updateSchema(
    id: string,
    updates: Partial<SchemaEntity>
  ): Promise<SchemaEntity> {
    const existing = await this.schemaRepository.findById(id);
    if (!existing) {
      throw new Error(`Schema mit ID ${id} nicht gefunden`);
    }

    // Neue Version mit erhöhter Versionsnummer
    const updated = await this.schemaRepository.update(id, {
      ...updates,
      version: existing.version + 1,
      updatedAt: new Date(),
    });

    return updated;
  }

  /**
   * Schema nach ID abrufen
   */
  async getSchema(id: string): Promise<SchemaEntity> {
    const schema = await this.schemaRepository.findById(id);
    if (!schema) {
      throw new Error(`Schema mit ID ${id} nicht gefunden`);
    }
    return schema;
  }

  /**
   * Alle Schemas auflisten
   */
  async listSchemas(): Promise<SchemaEntity[]> {
    return await this.schemaRepository.findAllByUser("00000000-0000-0000-0000-000000000000");
  }

  /**
   * Schema löschen
   */
  async deleteSchema(id: string): Promise<void> {
    const deleted = await this.schemaRepository.delete(id);
    if (!deleted) {
      throw new Error(`Schema mit ID ${id} konnte nicht gelöscht werden`);
    }
  }

  /**
   * Alle Versionen eines Schemas abrufen
   */
  async getVersionHistory(name: string): Promise<SchemaEntity[]> {
    return await this.schemaRepository.findVersionHistory(name, "00000000-0000-0000-0000-000000000000");
  }

  /**
   * Schema-Metadaten aktualisieren - DEPRECATED (metadata no longer tracked per schema)
   */
  async updateMetadata(
    id: string,
    _metadata: Record<string, unknown>
  ): Promise<SchemaEntity> {
    // Metadata is no longer stored per schema
    const entity = await this.schemaRepository.findById(id);
    if (!entity) throw new Error(`Schema ${id} not found`);
    return entity;
  }

  /**
   * Examples Count aktualisieren - DEPRECATED (examples count no longer tracked)
   */
  async updateExamplesCount(id: string, _count: number): Promise<SchemaEntity> {
    // Examples count is no longer tracked per schema
    const entity = await this.schemaRepository.findById(id);
    if (!entity) throw new Error(`Schema ${id} not found`);
    return entity;
  }

  /**
   * Rules Count und Confidence aktualisieren - DEPRECATED (stats no longer tracked)
   */
  async updateRulesStats(
    id: string,
    _rulesCount: number,
    _averageConfidence: number
  ): Promise<SchemaEntity> {
    // Stats are no longer tracked per schema
    const entity = await this.schemaRepository.findById(id);
    if (!entity) throw new Error(`Schema ${id} not found`);
    return entity;
  }

  /**
   * Schema-Statistiken
   */
  async getStatistics() {
    return await this.schemaRepository.getStatistics("00000000-0000-0000-0000-000000000000");
  }

  /**
   * Schema suchen
   */
  async searchSchemas(query: string): Promise<SchemaEntity[]> {
    return await this.schemaRepository.search(query, "00000000-0000-0000-0000-000000000000");
  }
}
