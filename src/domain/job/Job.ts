/**
 * Job - Domain Aggregate Root
 *
 * Zentrale Geschäftsentität für Job-Management
 * - Aggregate Root (verantwortlich für Konsistenz)
 * - Immutable wo sinnvoll (nur über Builder/Factory ändern)
 * - Business Rules durchsetzen
 * - Event-basiertes Design vorbereitet
 *
 * @version 0.22.0
 * @phase 22 - Job-Based Architecture
 */

import { JobId } from './JobId';
import {
  JobStatus,
  DocumentType,
  JobSource,
  JobSchema,
  JobExample,
  JobOptions,
  DEFAULT_JOB_OPTIONS,
} from './JobValueObjects';

/**
 * Job - Aggregate Root
 *
 * Repräsentiert einen Extraktions-Job mit:
 * - Eindeutige Identifikation (JobId)
 * - Quelldateien (sources)
 * - Schema und Beispiele
 * - Konfigurationsoptionen
 * - Lifecycle-Status
 */
export class Job {
  private readonly jobId: JobId;
  private readonly documentType: DocumentType;
  private status: JobStatus;
  private sources: ReadonlyArray<JobSource>;
  private readonly schema: JobSchema;
  private examples: ReadonlyArray<JobExample>;
  private readonly options: JobOptions;
  private readonly createdAt: Date;
  private updatedAt: Date;
  private completedAt?: Date;
  private failureReason?: string;
  private readonly metadata: Map<string, unknown>;

  /**
   * Private Constructor - Nutze factory method oder Builder
   */
  private constructor(props: {
    jobId: JobId;
    documentType: DocumentType;
    status: JobStatus;
    sources: JobSource[];
    schema: JobSchema;
    examples: JobExample[];
    options: JobOptions;
    createdAt: Date;
    updatedAt: Date;
    completedAt?: Date;
    failureReason?: string;
    metadata?: Map<string, unknown>;
  }) {
    this.jobId = props.jobId;
    this.documentType = props.documentType;
    this.status = props.status;
    this.sources = Object.freeze([...props.sources]); // Immutable copy
    this.schema = props.schema;
    this.examples = Object.freeze([...props.examples]); // Immutable copy
    this.options = props.options;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
    this.completedAt = props.completedAt;
    this.failureReason = props.failureReason;
    this.metadata = props.metadata || new Map();

    // Validiere Invarianten
    this.validate();
  }

  /**
   * Factory: Erstelle neuen Job
   */
  static create(props: {
    documentType: DocumentType;
    sources: JobSource[];
    schema: JobSchema;
    examples: JobExample[];
    options?: Partial<JobOptions>;
  }): Job {
    if (props.sources.length === 0) {
      throw new Error('Job must have at least one source');
    }

    const options = {
      ...DEFAULT_JOB_OPTIONS,
      ...props.options,
    };

    return new Job({
      jobId: JobId.create(),
      documentType: props.documentType,
      status: JobStatus.QUEUED,
      sources: props.sources,
      schema: props.schema,
      examples: props.examples,
      options,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Factory: Rekonstruiere Job aus persistenten Daten
   */
  static restore(props: {
    jobId: string;
    documentType: string;
    status: string;
    sources: JobSource[];
    schema: JobSchema;
    examples: JobExample[];
    options: JobOptions;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
    failureReason?: string;
    metadata?: Record<string, unknown>;
  }): Job {
    const metadata = new Map(
      props.metadata ? Object.entries(props.metadata) : []
    );

    return new Job({
      jobId: JobId.fromString(props.jobId),
      documentType: props.documentType as DocumentType,
      status: props.status as JobStatus,
      sources: props.sources,
      schema: props.schema,
      examples: props.examples,
      options: props.options,
      createdAt: new Date(props.createdAt),
      updatedAt: new Date(props.updatedAt),
      completedAt: props.completedAt ? new Date(props.completedAt) : undefined,
      failureReason: props.failureReason,
      metadata,
    });
  }

  /**
   * Validiere Invarianten
   * @throws Error wenn Invarianten verletzt sind
   */
  private validate(): void {
    // Invariant: Status muss gültig sein
    const validStatuses = Object.values(JobStatus);
    if (!validStatuses.includes(this.status)) {
      throw new Error(`Invalid job status: ${this.status}`);
    }

    // Invariant: Muss mindestens eine Quelle haben
    if (this.sources.length === 0) {
      throw new Error('Job must have at least one source');
    }

    // Invariant: Schema muss vorhanden sein
    if (!this.schema) {
      throw new Error('Job must have a schema');
    }

    // Invariant: Wenn COMPLETED oder FAILED, dann muss updatedAt >= completedAt sein
    if (
      (this.status === JobStatus.COMPLETED || this.status === JobStatus.FAILED) &&
      this.completedAt &&
      this.updatedAt < this.completedAt
    ) {
      throw new Error('updatedAt must be >= completedAt');
    }
  }

  /**
   * Markiere Job als erfolgreich abgeschlossen
   */
  markCompleted(): void {
    if (this.status === JobStatus.COMPLETED) {
      throw new Error('Job is already completed');
    }

    if (this.status === JobStatus.FAILED) {
      throw new Error('Cannot mark failed job as completed');
    }

    this.status = JobStatus.COMPLETED;
    this.completedAt = new Date();
    this.updatedAt = new Date();
    this.failureReason = undefined;
  }

  /**
   * Markiere Job als fehlgeschlagen
   */
  markFailed(reason: string): void {
    if (this.status === JobStatus.COMPLETED) {
      throw new Error('Cannot fail an already completed job');
    }

    if (this.status === JobStatus.FAILED) {
      throw new Error('Job is already marked as failed');
    }

    this.status = JobStatus.FAILED;
    this.failureReason = reason;
    this.updatedAt = new Date();
  }

  /**
   * Starte Job-Verarbeitung
   */
  startProcessing(): void {
    if (this.status !== JobStatus.QUEUED) {
      throw new Error(`Cannot start job with status: ${this.status}`);
    }

    this.status = JobStatus.RUNNING;
    this.updatedAt = new Date();
  }

  /**
   * Abbrechen
   */
  cancel(): void {
    if (this.status === JobStatus.COMPLETED || this.status === JobStatus.FAILED) {
      throw new Error(`Cannot cancel job with status: ${this.status}`);
    }

    this.status = JobStatus.CANCELLED;
    this.updatedAt = new Date();
  }

  /**
   * Setze Metadaten (beliebige Key-Value)
   */
  setMetadata(key: string, value: unknown): void {
    this.metadata.set(key, value);
    this.updatedAt = new Date();
  }

  // ==================== Getter ====================

  getJobId(): JobId {
    return this.jobId;
  }

  getDocumentType(): DocumentType {
    return this.documentType;
  }

  getStatus(): JobStatus {
    return this.status;
  }

  getSources(): ReadonlyArray<JobSource> {
    return this.sources;
  }

  getSchema(): JobSchema {
    return this.schema;
  }

  getExamples(): ReadonlyArray<JobExample> {
    return this.examples;
  }

  getOptions(): JobOptions {
    return this.options;
  }

  getCreatedAt(): Date {
    return new Date(this.createdAt);
  }

  getUpdatedAt(): Date {
    return new Date(this.updatedAt);
  }

  getCompletedAt(): Date | undefined {
    return this.completedAt ? new Date(this.completedAt) : undefined;
  }

  getFailureReason(): string | undefined {
    return this.failureReason;
  }

  getMetadata(key: string): unknown {
    return this.metadata.get(key);
  }

  getMetadataMap(): ReadonlyMap<string, unknown> {
    return new Map(this.metadata);
  }

  /**
   * Ist Job erfolgreich abgeschlossen?
   */
  isCompleted(): boolean {
    return this.status === JobStatus.COMPLETED;
  }

  /**
   * Ist Job fehlgeschlagen?
   */
  isFailed(): boolean {
    return this.status === JobStatus.FAILED;
  }

  /**
   * Kann Job noch verarbeitet werden?
   */
  isProcessable(): boolean {
    return (
      this.status === JobStatus.QUEUED ||
      this.status === JobStatus.RUNNING
    );
  }

  /**
   * Konvertiere zu DTO für API-Response
   */
  toDTO() {
    return {
      jobId: this.jobId.toString(),
      documentType: this.documentType,
      status: this.status,
      sources: (this.sources as JobSource[]).map(s => ({
        ...s,
        uploadedAt: s.uploadedAt instanceof Date ? s.uploadedAt.toISOString() : s.uploadedAt,
      })),
      schema: {
        ...this.schema,
        uploadedAt: this.schema.uploadedAt instanceof Date ? this.schema.uploadedAt.toISOString() : this.schema.uploadedAt,
      },
      examples: (Array.from(this.examples) as JobExample[]).map(e => ({
        ...e,
        uploadedAt: e.uploadedAt instanceof Date ? e.uploadedAt.toISOString() : e.uploadedAt,
      })),
      options: this.options,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString(),
      completedAt: this.completedAt?.toISOString(),
      failureReason: this.failureReason,
      metadata: Object.fromEntries(this.metadata),
    };
  }
}
