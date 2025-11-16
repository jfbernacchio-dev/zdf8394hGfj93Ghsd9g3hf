-- Adicionar coluna guardian_email na tabela patients
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS guardian_email TEXT;

COMMENT ON COLUMN patients.guardian_email IS 'Email do responsável legal (para menores ou contato alternativo)';