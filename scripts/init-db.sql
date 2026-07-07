-- Document Extractor - Database Initialization Script
-- This script is run automatically when the PostgreSQL container starts

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- ============================================================================
-- DOCUMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  original_file_name VARCHAR(255) NOT NULL,
  mime_type VARCHAR(50),
  file_size BIGINT,
  metadata JSONB DEFAULT '{}'::jsonb,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_id UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_user_id ON documents(user_id, created_at DESC);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX idx_documents_mime_type ON documents(mime_type);

-- ============================================================================
-- EXTRACTION_RUNS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS extraction_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  extracted_fields JSONB DEFAULT '{}'::jsonb,
  coverage DECIMAL(5, 2) CHECK (coverage >= 0 AND coverage <= 100),
  validation_errors JSONB DEFAULT '[]'::jsonb,
  warnings JSONB DEFAULT '[]'::jsonb,
  rule_set_version VARCHAR(50),
  rule_set_id UUID,
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED')),
  processing_model VARCHAR(100),
  completed_at TIMESTAMP,
  execution_time_ms INTEGER,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_extraction_runs_document_id ON extraction_runs(document_id);
CREATE INDEX idx_extraction_runs_created_at ON extraction_runs(created_at DESC);
CREATE INDEX idx_extraction_runs_status ON extraction_runs(status);
CREATE INDEX idx_extraction_runs_completed_at ON extraction_runs(completed_at DESC);

-- ============================================================================
-- REVISION_HISTORY TABLE (Enhanced from Phase 15e)
-- ============================================================================
CREATE TABLE IF NOT EXISTS revision_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID NOT NULL REFERENCES extraction_runs(id) ON DELETE CASCADE,
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  changes JSONB NOT NULL,
  diff_summary TEXT,
  changed_by UUID,
  changed_by_name VARCHAR(255),
  change_reason TEXT,
  change_type VARCHAR(50) DEFAULT 'MANUAL' CHECK (change_type IN ('MANUAL', 'AUTOMATIC', 'MERGE', 'ROLLBACK')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_revision_history_document_id ON revision_history(document_id, created_at DESC);
CREATE INDEX idx_revision_history_run_id ON revision_history(run_id);
CREATE INDEX idx_revision_history_created_at ON revision_history(created_at DESC);

-- ============================================================================
-- AUDIT_LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  user_name VARCHAR(255),
  action VARCHAR(50) NOT NULL CHECK (action IN ('CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT', 'RESTORE', 'LOGIN', 'LOGOUT')),
  resource_type VARCHAR(50) NOT NULL CHECK (resource_type IN ('DOCUMENT', 'EXTRACTION', 'RULE', 'SCHEMA', 'REVISION', 'BACKUP', 'USER', 'CONFIG')),
  resource_id UUID,
  resource_name VARCHAR(255),
  old_values JSONB,
  new_values JSONB,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  status VARCHAR(20) DEFAULT 'SUCCESS' CHECK (status IN ('SUCCESS', 'FAILURE', 'PARTIAL')),
  error_message TEXT,
  execution_time_ms INTEGER,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id, timestamp DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id, timestamp DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, timestamp DESC);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);

-- ============================================================================
-- EXTRACTION_RULES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS extraction_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  document_type VARCHAR(100),
  rule_set_id UUID,
  rule_definition JSONB NOT NULL,
  version VARCHAR(50) DEFAULT '1.0.0',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_extraction_rules_document_type ON extraction_rules(document_type);
CREATE INDEX idx_extraction_rules_is_active ON extraction_rules(is_active);
CREATE INDEX idx_extraction_rules_created_at ON extraction_rules(created_at DESC);

-- ============================================================================
-- SCHEMAS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS schemas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  document_type VARCHAR(100),
  schema_definition JSONB NOT NULL,
  version VARCHAR(50) DEFAULT '1.0.0',
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_schemas_document_type ON schemas(document_type);
CREATE INDEX idx_schemas_is_active ON schemas(is_active);

-- ============================================================================
-- BACKUPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS backups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  backup_name VARCHAR(255) NOT NULL,
  backup_type VARCHAR(20) CHECK (backup_type IN ('FULL', 'INCREMENTAL')),
  backup_size BIGINT,
  file_path VARCHAR(500),
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED')),
  error_message TEXT,
  created_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  retention_days INTEGER DEFAULT 30
);

CREATE INDEX idx_backups_created_at ON backups(created_at DESC);
CREATE INDEX idx_backups_status ON backups(status);

-- ============================================================================
-- PROCESSING_JOBS TABLE (for async operations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS processing_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  job_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED')),
  document_id UUID REFERENCES documents(id),
  extraction_run_id UUID REFERENCES extraction_runs(id),
  progress_percentage DECIMAL(5, 2) DEFAULT 0,
  total_items INTEGER,
  processed_items INTEGER DEFAULT 0,
  error_message TEXT,
  result JSONB,
  created_by UUID,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  started_at TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE INDEX idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX idx_processing_jobs_created_at ON processing_jobs(created_at DESC);

-- ============================================================================
-- TRIGGER FUNCTIONS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER documents_update_timestamp BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER extraction_runs_update_timestamp BEFORE UPDATE ON extraction_runs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER extraction_rules_update_timestamp BEFORE UPDATE ON extraction_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER schemas_update_timestamp BEFORE UPDATE ON schemas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA (for testing)
-- ============================================================================

-- Insert sample document type if needed
INSERT INTO schemas (id, name, description, document_type, schema_definition, is_active)
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'Invoice Schema v1.0',
  'Standard invoice extraction schema',
  'invoice',
  '{
    "fields": [
      {"name": "invoice_number", "type": "string", "required": true},
      {"name": "invoice_date", "type": "date", "required": true},
      {"name": "total_amount", "type": "number", "required": true},
      {"name": "customer_name", "type": "string", "required": false}
    ]
  }'::jsonb,
  TRUE
) ON CONFLICT DO NOTHING;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT CONNECT ON DATABASE extractor_db TO extractor;
GRANT USAGE ON SCHEMA public TO extractor;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO extractor;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO extractor;

-- ============================================================================
-- INITIALIZATION COMPLETE
-- ============================================================================
-- Database is now ready for the Document Extractor application
