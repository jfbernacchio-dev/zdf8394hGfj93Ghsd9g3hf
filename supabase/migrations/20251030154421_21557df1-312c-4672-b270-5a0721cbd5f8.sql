-- Add retention_until column (calculated on insert/update via trigger instead of generated column)
ALTER TABLE admin_access_log ADD COLUMN IF NOT EXISTS retention_until timestamp with time zone;

-- Create trigger function to set retention_until
CREATE OR REPLACE FUNCTION set_audit_log_retention()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.retention_until := NEW.created_at + interval '12 months';
  RETURN NEW;
END;
$$;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_set_audit_log_retention ON admin_access_log;
CREATE TRIGGER trigger_set_audit_log_retention
  BEFORE INSERT ON admin_access_log
  FOR EACH ROW
  EXECUTE FUNCTION set_audit_log_retention();

-- Backfill existing rows
UPDATE admin_access_log 
SET retention_until = created_at + interval '12 months' 
WHERE retention_until IS NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_admin_access_log_retention ON admin_access_log(retention_until);

-- Add comment
COMMENT ON COLUMN admin_access_log.retention_until IS 'Logs retained for 12 months per ANPD best practices';
