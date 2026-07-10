import { DataSource } from "typeorm";
import path from "path";
import { SchemaEntity } from "../../domain/schema/SchemaEntity";
import { AuditLogEntity } from "./entities/AuditLogEntity";
import { JobEntity } from "./entities/JobEntity";

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
  entities: [SchemaEntity, AuditLogEntity, JobEntity],
  migrations: [path.join(__dirname, "../migrations/*.ts")],
  subscribers: [],
  dropSchema: false,
  ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: false } : false,
});

/**
 * Initialize Database Connection with Retry Logic
 * Wird einmal beim App-Start aufgerufen
 * Exponential Backoff: 1s → 2s → 4s → 8s → 16s
 */
export async function initializeDatabase(): Promise<void> {
  const maxRetries = 5;
  const initialDelayMs = 1000;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (!AppDataSource.isInitialized) {
        console.log(`[Database] Attempt ${attempt}/${maxRetries} to initialize...`);
        await AppDataSource.initialize();
        console.log("✅ Database Connection Established");

        // Auto-run migrations
        if (process.env.NODE_ENV !== "development") {
          await AppDataSource.runMigrations();
          console.log("✅ Migrations Applied");
        }
      }
      return; // Success - exit early
    } catch (error) {
      const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
      const isLastAttempt = attempt === maxRetries;

      if (isLastAttempt) {
        console.error("❌ Database Connection Failed after all retries:", error);
        throw error;
      } else {
        console.warn(
          `⚠️  Database Connection Failed (Attempt ${attempt}/${maxRetries}). ` +
          `Retrying in ${delayMs}ms...`
        );
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
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
