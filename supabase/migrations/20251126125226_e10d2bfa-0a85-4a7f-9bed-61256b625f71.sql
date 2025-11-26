-- ========================================
-- FASE C1.10.3-H1 COMPLEMENTAR: Ajustes Finais
-- Adicionar UNIQUE constraint, índices, triggers e policy org
-- ========================================

-- 1) Adicionar UNIQUE constraint (crítico para evitar duplicatas)
ALTER TABLE patient_overview_layouts 
ADD CONSTRAINT patient_overview_layouts_user_patient_unique 
UNIQUE (user_id, patient_id);

-- 2) Criar índices de performance (se ainda não existem)
CREATE INDEX IF NOT EXISTS idx_patient_overview_layouts_user 
ON patient_overview_layouts(user_id);

CREATE INDEX IF NOT EXISTS idx_patient_overview_layouts_patient 
ON patient_overview_layouts(patient_id);

CREATE INDEX IF NOT EXISTS idx_patient_overview_layouts_org 
ON patient_overview_layouts(organization_id);

-- 3) Criar triggers (se ainda não existem)
-- Verificar e criar trigger para updated_at
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_patient_overview_layouts_updated_at'
  ) THEN
    CREATE TRIGGER update_patient_overview_layouts_updated_at
      BEFORE UPDATE ON patient_overview_layouts
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Verificar e criar trigger para organization_id
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'auto_set_organization_patient_overview_layouts'
  ) THEN
    CREATE TRIGGER auto_set_organization_patient_overview_layouts
      BEFORE INSERT OR UPDATE ON patient_overview_layouts
      FOR EACH ROW
      EXECUTE FUNCTION auto_set_organization_from_user_for_layouts();
  END IF;
END $$;

-- 4) Criar policy de organização (se ainda não existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'patient_overview_layouts' 
    AND policyname = 'patient_overview_layouts_org_select'
  ) THEN
    CREATE POLICY "patient_overview_layouts_org_select"
      ON patient_overview_layouts
      FOR SELECT
      TO authenticated
      USING (
        organization_id IS NOT NULL 
        AND organization_id = current_user_organization()
      );
  END IF;
END $$;