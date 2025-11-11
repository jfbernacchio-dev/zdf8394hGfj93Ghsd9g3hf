-- Remove a política que permite contadores verem dados de pacientes
DROP POLICY IF EXISTS "Accountants can view patient basic data" ON patients;

-- Verificar e remover políticas similares em outras tabelas clínicas se existirem
-- (sessions, clinical_complaints, patient_files não têm políticas para contadores baseado no schema fornecido)