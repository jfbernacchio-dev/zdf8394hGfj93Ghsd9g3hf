-- Add is_clinical column to patient_files table
ALTER TABLE patient_files 
ADD COLUMN IF NOT EXISTS is_clinical BOOLEAN DEFAULT false;

-- Update timezone display for the application
-- Set default timezone for timestamp displays
-- Note: Data is stored in UTC, but we'll handle display in America/Sao_Paulo in the application

-- Add comment to document the timezone expectation
COMMENT ON TABLE patient_files IS 'Files are stored with UTC timestamps. Application should display in America/Sao_Paulo timezone (UTC-3).';