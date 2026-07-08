import { injectable } from "tsyringe";
import { SchemaRepository } from "../../domain/schema/SchemaRepository";
import { SchemaEntity } from "../../domain/schema/SchemaEntity";
import { v4 as uuid } from "uuid";

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
    description?: string,
    directoryPath?: string
  ): Promise<SchemaEntity> {
    // Überprüfen ob Schema mit diesem Namen bereits existiert
    const existing = await this.schemaRepository.findByName(
      "default-user",
      name
    );
    if (existing) {
      throw new Error(
        `Schema mit Name "${name}" existiert bereits. Verwenden Sie update() zur Aktualisierung.`
      );
    }

    const schemaDir = directoryPath || `/schemas/${uuid()}`;

    const newSchema = await this.schemaRepository.create({
      name,
      schema,
      description,
      directoryPath: schemaDir,
      userId: "default-user",
      examplesCount: 0,
      generatedRulesCount: 0,
      status: "active",
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
    return await this.schemaRepository.findAllByUser("default-user");
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
    return await this.schemaRepository.findVersionHistory(name, "default-user");
  }

  /**
   * Schema-Metadaten aktualisieren
   */
  async updateMetadata(
    id: string,
    metadata: Record<string, unknown>
  ): Promise<SchemaEntity> {
    return await this.updateSchema(id, { metadata });
  }

  /**
   * Examples Count aktualisieren
   */
  async updateExamplesCount(id: string, count: number): Promise<SchemaEntity> {
    return await this.updateSchema(id, { examplesCount: count });
  }

  /**
   * Rules Count und Confidence aktualisieren
   */
  async updateRulesStats(
    id: string,
    rulesCount: number,
    averageConfidence: number
  ): Promise<SchemaEntity> {
    return await this.updateSchema(id, {
      generatedRulesCount: rulesCount,
      averageConfidence,
    });
  }

  /**
   * Schema-Statistiken
   */
  async getStatistics() {
    return await this.schemaRepository.getStatistics("default-user");
  }

  /**
   * Schema suchen
   */
  async searchSchemas(query: string): Promise<SchemaEntity[]> {
    return await this.schemaRepository.search(query, "default-user");
  }
}
