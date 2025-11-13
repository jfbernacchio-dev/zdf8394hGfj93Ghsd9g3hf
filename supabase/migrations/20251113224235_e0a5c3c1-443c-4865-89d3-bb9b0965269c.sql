-- Migration: force_types_regeneration_for_subordinate_autonomy
-- Força regeneração de types.ts para incluir subordinate_autonomy_settings

-- Esta migração não altera o schema, apenas força o sistema a detectar
-- a tabela subordinate_autonomy_settings que foi criada anteriormente

-- Verifica se a tabela existe e está configurada corretamente
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'subordinate_autonomy_settings'
  ) THEN
    RAISE NOTICE 'Tabela subordinate_autonomy_settings encontrada - forçando regeneração de types.ts';
  ELSE
    RAISE EXCEPTION 'Tabela subordinate_autonomy_settings não encontrada - verifique migrações anteriores';
  END IF;
END $$;