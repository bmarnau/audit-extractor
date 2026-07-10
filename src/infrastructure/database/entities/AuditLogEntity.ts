import { Entity, PrimaryColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * Audit Log Entity - TypeORM persistence for system logs
 * Phase 20: Log-Viewer Backend Implementation
 */
@Entity('audit_logs')
@Index(['timestamp'])
@Index(['level'])
@Index(['source'])
@Index(['documentId'])
export class AuditLogEntity {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('timestamp with time zone')
  @CreateDateColumn()
  timestamp!: Date;

  @Column('varchar', { length: 50 })
  level!: 'debug' | 'info' | 'warn' | 'error';

  @Column('varchar', { length: 50 })
  source!: 'parser' | 'llm' | 'validator' | 'api' | 'system' | 'schema' | 'extraction';

  @Column('text')
  message!: string;

  @Column('jsonb', { nullable: true })
  context?: Record<string, unknown>;

  @Column('text', { nullable: true })
  stackTrace?: string;

  @Column('uuid', { nullable: true })
  documentId?: string;

  @Column('varchar', { length: 255, nullable: true })
  field?: string;

  @Column('int', { nullable: true })
  duration?: number;

  @Column('varchar', { length: 36, nullable: true })
  requestId?: string;

  @Column('varchar', { length: 255, nullable: true })
  userId?: string;

  @Column('text', { nullable: true })
  searchText?: string;

  constructor(data?: Partial<AuditLogEntity>) {
    if (data) {
      Object.assign(this, data);
    }
  }
}
