-- Add time field to sessions table to allow individual session times
ALTER TABLE sessions ADD COLUMN IF NOT EXISTS time text;