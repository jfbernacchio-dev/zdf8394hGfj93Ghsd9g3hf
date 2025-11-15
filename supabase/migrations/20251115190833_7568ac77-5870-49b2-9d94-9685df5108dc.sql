-- Phase 2: Add nfse_issued_id column to sessions table

-- Add the new column
ALTER TABLE sessions 
ADD COLUMN nfse_issued_id UUID REFERENCES nfse_issued(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_sessions_nfse_issued_id ON sessions(nfse_issued_id);

-- Retroactive Script 1: Populate nfse_issued_id for existing sessions
UPDATE sessions s
SET nfse_issued_id = ni.id
FROM nfse_issued ni
WHERE s.id = ANY(ni.session_ids)
  AND s.nfse_issued_id IS NULL;

-- Retroactive Script 2: Mark sessions as paid for NFSes issued 30+ days ago with 'issued' status
UPDATE sessions s
SET paid = true, status = 'paid'
FROM nfse_issued ni
WHERE s.id = ANY(ni.session_ids)
  AND ni.status = 'issued'
  AND ni.created_at < NOW() - INTERVAL '30 days'
  AND s.paid = false;