import { Repository } from "typeorm";
import { AppDataSource } from "../../infrastructure/database/data-source";
import { SchemaEntity } from "./SchemaEntity";
import { v4 as uuid } from "uuid";

/**
 * SchemaRepository - Data Access Layer für Schema-Verwaltung
 * Implementiert CRUD-Operationen und Abfragen
 */
export class SchemaRepository {
  private repository: Repository<SchemaEntity>;

  constructor() {
    this.repository = AppDataSource.getRepository(SchemaEntity);
  }

  /**
   * Neues Schema erstellen und speichern
   */
  async create(data: Partial<SchemaEntity>): Promise<SchemaEntity> {
    const schema = this.repository.create({
      id: uuid(),
      userId: data.userId || "default-user",
      name: data.name || "",
      description: data.description,
      schema: data.schema || {},
      directoryPath: data.directoryPath || "",
      status: "active",
      version: 1,
      examplesCount: data.examplesCount || 0,
      generatedRulesCount: data.generatedRulesCount || 0,
      ...data,
    });

    return await this.repository.save(schema);
  }

  /**
   * Schema nach ID abrufen
   */
  async findById(id: string): Promise<SchemaEntity | null> {
    return await this.repository.findOne({
      where: { id, isArchived: false },
    });
  }

  /**
   * Schema nach Name abrufen (für User)
   */
  async findByName(userId: string, name: string): Promise<SchemaEntity | null> {
    return await this.repository.findOne({
      where: { userId, name, isArchived: false },
    });
  }

  /**
   * Alle aktiven Schemas für einen User abrufen
   */
  async findAllByUser(userId: string = "default-user"): Promise<SchemaEntity[]> {
    return await this.repository.find({
      where: { userId, isArchived: false },
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Version-Historie eines Schemas abrufen (letzte 2 Versionen)
   */
  async findVersionHistory(schemaName: string, userId: string = "default-user"): Promise<SchemaEntity[]> {
    return await this.repository.find({
      where: { userId, name: schemaName },
      order: { version: "DESC" },
      take: 2,
    });
  }

  /**
   * Schema aktualisieren (erstellt neue Version)
   */
  async update(id: string, data: Partial<SchemaEntity>): Promise<SchemaEntity> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error(`Schema mit ID ${id} nicht gefunden`);
    }

    // Alte Version archivieren, wenn es eine neue Version ist
    if (data.version && data.version > existing.version) {
      existing.isArchived = true;
      await this.repository.save(existing);

      // Alte Versionen löschen (über 2 Versionen hinaus)
      const allVersions = await this.repository.find({
        where: { name: existing.name, userId: existing.userId },
        order: { version: "DESC" },
      });

      if (allVersions.length > 2) {
        const toDelete = allVersions.slice(2);
        await this.repository.remove(toDelete);
      }
    }

    // Neue Version speichern
    const updated = this.repository.merge(existing, data);
    return await this.repository.save(updated);
  }

  /**
   * Schema löschen
   */
  async delete(id: string): Promise<boolean> {
    const result = await this.repository.delete({ id });
    return result.affected ? result.affected > 0 : false;
  }

  /**
   * Vollständige Löschung inklusive aller Versionen (Admin)
   */
  async deleteAllVersions(name: string, userId: string = "default-user"): Promise<number> {
    const result = await this.repository.delete({ name, userId });
    return result.affected || 0;
  }

  /**
   * Schema-Statistiken abrufen
   */
  async getStatistics(userId: string = "default-user"): Promise<{
    totalSchemas: number;
    activeSchemas: number;
    archivedSchemas: number;
    totalVersions: number;
  }> {
    const total = await this.repository.count({ where: { userId } });
    const active = await this.repository.count({
      where: { userId, isArchived: false },
    });
    const archived = await this.repository.count({
      where: { userId, isArchived: true },
    });
    const versions = await this.repository.count({ where: { userId } });

    return {
      totalSchemas: total,
      activeSchemas: active,
      archivedSchemas: archived,
      totalVersions: versions,
    };
  }

  /**
   * Suche nach Schemas (Name/Beschreibung)
   */
  async search(
    query: string,
    userId: string = "default-user"
  ): Promise<SchemaEntity[]> {
    return await this.repository
      .createQueryBuilder("schema")
      .where("schema.userId = :userId", { userId })
      .andWhere("schema.isArchived = false")
      .andWhere("(schema.name ILIKE :query OR schema.description ILIKE :query)", {
        query: `%${query}%`,
      })
      .orderBy("schema.createdAt", "DESC")
      .getMany();
  }
}
