import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from "typeorm";

/**
 * SchemaEntity - Persistente Speicherung von JSON Schemas
 * Jedes Schema wird mit Metadaten und Versionierung gespeichert
 */
@Entity("schemas")
@Index(["createdBy", "name"], { unique: true })
@Index(["createdAt"])
export class SchemaEntity {
  /**
   * Eindeutige Schema ID (UUID)
   */
  @PrimaryColumn("uuid", { name: "id" })
  id!: string;

  /**
   * Schema Name (z.B. "Invoice", "Contract", "Product")
   */
  @Column("varchar", { name: "name", length: 255 })
  name!: string;

  /**
   * Beschreibung des Schemas (für UI Anzeige)
   */
  @Column("text", { name: "description", nullable: true })
  description?: string;

  /**
   * Document Type
   */
  @Column("varchar", { name: "document_type", length: 100, nullable: true })
  documentType?: string;

  /**
   * Das vollständige JSON Schema
   */
  @Column("jsonb", { name: "schema_definition" })
  schema!: Record<string, unknown>;

  /**
   * Version String (z.B. "1.0.0")
   */
  @Column("varchar", { name: "version", length: 50, default: "1.0.0" })
  version!: string;

  /**
   * Ist dieses Schema aktiv?
   */
  @Column("boolean", { name: "is_active", default: true })
  isActive?: boolean;

  /**
   * User ID, der das Schema erstellt hat
   */
  @Column("uuid", { name: "created_by", nullable: true })
  createdBy?: string;

  /**
   * User ID, der das Schema zuletzt aktualisiert hat
   */
  @Column("uuid", { name: "updated_by", nullable: true })
  updatedBy?: string;

  /**
   * Zeitstempel der Erstellung
   */
  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date;

  /**
   * Zeitstempel der letzten Aktualisierung
   */
  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date;
}
