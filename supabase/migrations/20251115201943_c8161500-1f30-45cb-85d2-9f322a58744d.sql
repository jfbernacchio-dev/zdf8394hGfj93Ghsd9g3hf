-- Add manually_marked_nfse column to sessions table
ALTER TABLE sessions 
ADD COLUMN manually_marked_nfse BOOLEAN DEFAULT FALSE;

-- Add comment explaining the column
COMMENT ON COLUMN sessions.manually_marked_nfse IS 'Tracks if NFSe status was manually marked by user (without actual nfse_issued_id)';