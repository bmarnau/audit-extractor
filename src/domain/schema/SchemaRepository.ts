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
      createdBy: data.createdBy || "00000000-0000-0000-0000-000000000000",
      name: data.name || "",
      description: data.description,
      schema: data.schema || {},
      version: data.version || "1.0.0",
      isActive: data.isActive !== undefined ? data.isActive : true,
      ...data,
    });

    return await this.repository.save(schema);
  }

  /**
   * Schema nach ID abrufen
   */
  async findById(id: string): Promise<SchemaEntity | null> {
    return await this.repository.findOne({
      where: { id },
    });
  }

  /**
   * Schema nach Name abrufen (für User)
   */
  async findByName(createdBy: string, name: string): Promise<SchemaEntity | null> {
    return await this.repository.findOne({
      where: { createdBy, name },
    });
  }

  /**
   * Alle aktiven Schemas für einen User abrufen
   */
  async findAllByUser(createdBy: string = "00000000-0000-0000-0000-000000000000"): Promise<SchemaEntity[]> {
    return await this.repository.find({
      where: { createdBy },
      order: { createdAt: "DESC" },
    });
  }

  /**
   * Version-Historie eines Schemas abrufen (letzte 2 Versionen)
   */
  async findVersionHistory(schemaName: string, createdBy: string = "00000000-0000-0000-0000-000000000000"): Promise<SchemaEntity[]> {
    return await this.repository.find({
      where: { createdBy, name: schemaName },
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

    // Berechne neue Version: "1.0.0" -> "1.0.1"
    let newVersion = "1.0.0";
    if (existing.version) {
      const parts = existing.version.split('.');
      const patch = parseInt(parts[2] || '0', 10) + 1;
      newVersion = `${parts[0]}.${parts[1]}.${patch}`;
    }

    // Merge mit neuen Daten und aktualisierte Version
    const updated = this.repository.merge(existing, {
      ...data,
      version: newVersion,
      updatedAt: new Date(),
    });
    
    const saved = await this.repository.save(updated);
    console.log(`✅ Schema version updated: ${existing.version} → ${saved.version}`);
    
    return saved;
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
  async deleteAllVersions(name: string, createdBy: string = "00000000-0000-0000-0000-000000000000"): Promise<number> {
    const result = await this.repository.delete({ name, createdBy });
    return result.affected || 0;
  }

  /**
   * Schema-Statistiken abrufen
   */
  async getStatistics(createdBy: string = "00000000-0000-0000-0000-000000000000"): Promise<{
    totalSchemas: number;
    activeSchemas: number;
  }> {
    const total = await this.repository.count({ where: { createdBy } });
    const active = await this.repository.count({
      where: { createdBy, isActive: true },
    });

    return {
      totalSchemas: total,
      activeSchemas: active,
    };
  }

  /**
   * Suche nach Schemas (Name/Beschreibung)
   */
  async search(
    query: string,
    createdBy: string = "00000000-0000-0000-0000-000000000000"
  ): Promise<SchemaEntity[]> {
    return await this.repository
      .createQueryBuilder("schema")
      .where("schema.createdBy = :createdBy", { createdBy })
      .andWhere("(schema.name ILIKE :query OR schema.description ILIKE :query)", {
        query: `%${query}%`,
      })
      .orderBy("schema.createdAt", "DESC")
      .getMany();
  }
}
