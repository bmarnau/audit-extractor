/**
 * JobEntity - Asynchrone Job Verarbeitung
 *
 * Speichert Informationen über laufende und abgeschlossene Jobs
 * für die asynchrone Verarbeitung von Extractionen
 *
 * @version 0.21.0
 * @phase 21
 */

import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

export type JobStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';

@Entity('jobs')
@Index(['status'])
@Index(['requestedAt'])
@Index(['userId'])
export class JobEntity {
  // ============================================================================
  // PRIMARY KEY
  // ============================================================================

  @PrimaryColumn('uuid')
  id!: string;

  // ============================================================================
  // STATUS & LIFECYCLE
  // ============================================================================

  @Column({
    type: 'varchar',
    length: 20,
    default: 'queued'
  })
  status!: JobStatus;

  @Column('timestamp with time zone')
  requestedAt!: Date;

  @Column('timestamp with time zone', { nullable: true })
  startedAt!: Date | null;

  @Column('timestamp with time zone', { nullable: true })
  completedAt!: Date | null;

  // ============================================================================
  // ERROR HANDLING
  // ============================================================================

  @Column('text', { nullable: true })
  errorMessage!: string | null;

  @Column('jsonb', { nullable: true })
  errorDetails!: any | null;

  // ============================================================================
  // INPUT & OUTPUT
  // ============================================================================

  /**
   * Eingabe-Parameter für die Job-Verarbeitung
   * Format: { documentContent, extractionConfig, ruleSet, ... }
   */
  @Column('jsonb')
  jobInput!: any;

  /**
   * Ergebnis der Job-Verarbeitung
   * Format: { extractedData, confidence, errors, statistics, ... }
   */
  @Column('jsonb', { nullable: true })
  resultData!: any | null;

  // ============================================================================
  // METADATA
  // ============================================================================

  @Column('uuid', { nullable: true })
  userId!: string | null;

  @Column('uuid', { nullable: true })
  documentId!: string | null;

  @Column('varchar', { length: 100, nullable: true })
  jobType!: string | null; // 'extraction', 'validation', 'comparison', ...

  @Column('text', { nullable: true })
  description!: string | null;

  // ============================================================================
  // PERFORMANCE TRACKING
  // ============================================================================

  @Column('integer', { default: 0 })
  duration!: number; // milliseconds

  @Column('integer', { default: 0 })
  retryCount!: number;

  @Column('integer', { default: 3 })
  maxRetries!: number;

  // ============================================================================
  // AUDIT & SYSTEM
  // ============================================================================

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column('varchar', { length: 500, nullable: true })
  ipAddress!: string | null;

  @Column('jsonb', { nullable: true })
  metadata!: any | null;
}
