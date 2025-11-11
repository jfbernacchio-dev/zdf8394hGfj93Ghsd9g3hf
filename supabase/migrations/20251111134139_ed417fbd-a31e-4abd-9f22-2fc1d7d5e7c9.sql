-- FASE 1A: Adicionar role accountant ao enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'accountant';