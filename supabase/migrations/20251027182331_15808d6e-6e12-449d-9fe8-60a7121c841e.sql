-- Add column to track which sessions are included in each NFSe
ALTER TABLE nfse_issued ADD COLUMN session_ids uuid[] DEFAULT ARRAY[]::uuid[];