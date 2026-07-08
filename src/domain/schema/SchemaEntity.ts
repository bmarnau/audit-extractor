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
@Index(["userId", "name"], { unique: true })
@Index(["createdAt"])
export class SchemaEntity {
  /**
   * Eindeutige Schema ID (UUID)
   */
  @PrimaryColumn("uuid")
  id!: string;

  /**
   * User ID (für zukünftige Multi-User Support)
   * Momentan: "default-user"
   */
  @Column("varchar", { length: 255, default: "default-user" })
  userId!: string;

  /**
   * Schema Name (z.B. "Invoice", "Contract", "Product")
   */
  @Column("varchar", { length: 255 })
  name!: string;

  /**
   * Beschreibung des Schemas (für UI Anzeige)
   */
  @Column("text", { nullable: true })
  description?: string;

  /**
   * Version Nummer (automatisch inkrementiert)
   * Nur letzte 2 Versionen werden gespeichert
   */
  @Column("integer", { default: 1 })
  version!: number;

  /**
   * Das vollständige JSON Schema Draft-07
   */
  @Column("jsonb")
  schema!: Record<string, unknown>;

  /**
   * Anzahl der Beispieldateien
   */
  @Column("integer", { default: 0 })
  examplesCount!: number;

  /**
   * Anzahl der generierten Regeln
   */
  @Column("integer", { default: 0 })
  generatedRulesCount!: number;

  /**
   * Durchschnittlicher Confidence Score der generierten Regeln
   */
  @Column("decimal", { precision: 3, scale: 2, nullable: true })
  averageConfidence?: number;

  /**
   * Status des Schemas
   * "active" | "archived" | "draft"
   */
  @Column("varchar", { length: 50, default: "active" })
  status!: string;

  /**
   * Filesystem Path zur Schema Verzeichnisstruktur
   * z.B. "/schemas/uuid-1234-5678"
   */
  @Column("varchar", { length: 500 })
  directoryPath!: string;

  /**
   * Metadaten (JSON)
   * Kann für zukünftige Erweiterungen genutzt werden
   */
  @Column("jsonb", { default: {} })
  metadata!: Record<string, unknown>;

  /**
   * Erstellt am
   */
  @CreateDateColumn()
  createdAt!: Date;

  /**
   * Zuletzt aktualisiert am
   */
  @UpdateDateColumn()
  updatedAt!: Date;

  /**
   * Wird zum Archivieren einer Version genutzt
   * Alte Versionen werden mit diesem Flag versehen
   */
  @Column("boolean", { default: false })
  isArchived!: boolean;

  /**
   * Parent Schema ID (falls dies eine neue Version ist)
   * Für Version-Tracking
   */
  @Column("uuid", { nullable: true })
  previousVersionId?: string;
}
