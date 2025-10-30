-- Add token field to consent_submissions table
ALTER TABLE consent_submissions 
ADD COLUMN IF NOT EXISTS token UUID UNIQUE;

-- Create index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_consent_submissions_token ON consent_submissions(token);