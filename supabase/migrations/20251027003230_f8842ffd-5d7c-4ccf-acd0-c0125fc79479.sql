-- Desabilita temporariamente o trigger de validação
ALTER TABLE patients DISABLE TRIGGER validate_patient_before_insert;

-- Remove todas as constraints problemáticas que não permitem NULL
ALTER TABLE patients 
DROP CONSTRAINT IF EXISTS patients_email_format;

ALTER TABLE patients 
DROP CONSTRAINT IF EXISTS patients_email_length;

ALTER TABLE patients 
DROP CONSTRAINT IF EXISTS patients_phone_length;

-- Remove constraint de CPF antiga
ALTER TABLE patients 
DROP CONSTRAINT IF EXISTS patients_cpf_format;

-- Atualiza CPFs existentes para o formato correto (xxx.xxx.xxx-xx)
UPDATE patients
SET cpf = CONCAT(
  SUBSTRING(REGEXP_REPLACE(cpf, '[^0-9]', '', 'g'), 1, 3), '.',
  SUBSTRING(REGEXP_REPLACE(cpf, '[^0-9]', '', 'g'), 4, 3), '.',
  SUBSTRING(REGEXP_REPLACE(cpf, '[^0-9]', '', 'g'), 7, 3), '-',
  SUBSTRING(REGEXP_REPLACE(cpf, '[^0-9]', '', 'g'), 10, 2)
)
WHERE cpf !~ '^\d{3}\.\d{3}\.\d{3}-\d{2}$';

-- Adiciona nova constraint de CPF que aceita formato xxx.xxx.xxx-xx
ALTER TABLE patients 
ADD CONSTRAINT patients_cpf_format 
CHECK (cpf ~ '^\d{3}\.\d{3}\.\d{3}-\d{2}$');

-- Reabilita o trigger de validação
ALTER TABLE patients ENABLE TRIGGER validate_patient_before_insert;