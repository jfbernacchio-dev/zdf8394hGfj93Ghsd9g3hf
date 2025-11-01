-- Add new fields to patients table for NFSe control
ALTER TABLE patients
ADD COLUMN nfse_number_of_invoices integer DEFAULT 1 CHECK (nfse_number_of_invoices >= 1 AND nfse_number_of_invoices <= 4),
ADD COLUMN nfse_max_sessions_per_invoice integer DEFAULT 20 CHECK (nfse_max_sessions_per_invoice IN (5, 10, 15, 20));

-- Update existing patients to have default values
UPDATE patients
SET nfse_number_of_invoices = 1,
    nfse_max_sessions_per_invoice = 20
WHERE nfse_number_of_invoices IS NULL OR nfse_max_sessions_per_invoice IS NULL;