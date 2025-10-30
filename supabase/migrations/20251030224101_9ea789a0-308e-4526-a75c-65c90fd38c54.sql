-- Add column to store who the NFSe should be issued to for minors
ALTER TABLE patients 
ADD COLUMN nfse_issue_to text CHECK (nfse_issue_to IN ('patient', 'guardian')) DEFAULT 'patient';