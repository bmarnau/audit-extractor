-- Migrate schemas table to match SchemaEntity structure
ALTER TABLE schemas ADD COLUMN IF NOT EXISTS userId VARCHAR(255) DEFAULT 'default-user';
ALTER TABLE schemas ADD COLUMN IF NOT EXISTS version_number INTEGER DEFAULT 1;
ALTER TABLE schemas ADD COLUMN IF NOT EXISTS examples_count INTEGER DEFAULT 0;
ALTER TABLE schemas ADD COLUMN IF NOT EXISTS generated_rules_count INTEGER DEFAULT 0;
ALTER TABLE schemas ADD COLUMN IF NOT EXISTS average_confidence NUMERIC(3,2);
ALTER TABLE schemas ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';
ALTER TABLE schemas ADD COLUMN IF NOT EXISTS directory_path VARCHAR(500);
ALTER TABLE schemas ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE schemas ADD COLUMN IF NOT EXISTS is_archived BOOLEAN DEFAULT false;
ALTER TABLE schemas ADD COLUMN IF NOT EXISTS previous_version_id UUID;

-- Check result
SELECT 'Migration complete' AS status;
