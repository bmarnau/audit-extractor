import { DataSource } from "typeorm";
import path from "path";
import { SchemaEntity } from "../../domain/schema/SchemaEntity";

/**
 * PostgreSQL DataSource Configuration für TypeORM
 * Verbindung: localhost:5432 (Docker)
 * Database: extractor_db
 * User: extractor_user
 * Password: extractor_pass
 */
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "5432"),
  username: process.env.DB_USER || "extractor_user",
  password: process.env.DB_PASSWORD || "extractor_pass",
  database: process.env.DB_NAME || "extractor_db",
  synchronize: process.env.NODE_ENV !== "production", // Auto-create tables in dev
  logging: process.env.DB_LOGGING === "true",
  logger: "advanced-console",
  entities: [SchemaEntity],
  migrations: [path.join(__dirname, "../migrations/*.ts")],
  subscribers: [],
  dropSchema: false,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

/**
 * Initialize Database Connection
 * Wird einmal beim App-Start aufgerufen
 */
export async function initializeDatabase(): Promise<void> {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
      console.log("✅ Database Connection Established");

      // Auto-run migrations
      if (process.env.NODE_ENV !== "development") {
        await AppDataSource.runMigrations();
        console.log("✅ Migrations Applied");
      }
    }
  } catch (error) {
    console.error("❌ Database Connection Failed:", error);
    throw error;
  }
}

/**
 * Close Database Connection
 */
export async function closeDatabase(): Promise<void> {
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
    console.log("✅ Database Connection Closed");
  }
}
