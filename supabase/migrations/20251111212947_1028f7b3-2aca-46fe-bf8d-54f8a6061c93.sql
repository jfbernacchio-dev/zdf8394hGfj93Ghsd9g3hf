-- Add patient snapshot columns to nfse_issued for accountant visibility
ALTER TABLE nfse_issued 
ADD COLUMN patient_name TEXT,
ADD COLUMN patient_cpf TEXT;

-- Backfill existing records with patient data
UPDATE nfse_issued ni
SET 
  patient_name = p.name,
  patient_cpf = p.cpf
FROM patients p 
WHERE ni.patient_id = p.id 
AND ni.patient_name IS NULL;