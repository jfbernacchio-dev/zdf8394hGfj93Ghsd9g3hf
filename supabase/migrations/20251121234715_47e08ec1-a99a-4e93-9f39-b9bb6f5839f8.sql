-- ============================================================================
-- FASE 11.3.1: Fix organization_id para Larissa
-- ============================================================================
-- 
-- Problema: Larissa está em organization_owners mas profiles.organization_id está NULL
-- Solução: Atualizar profiles.organization_id baseado em organization_owners
--

DO $$
DECLARE
  v_mindware_org_id uuid;
  v_larissa_id uuid;
BEGIN
  -- Buscar ID da organização Mindware
  SELECT id INTO v_mindware_org_id
  FROM organizations
  WHERE legal_name = 'Espaço Mindware Psicologia Ltda.'
  LIMIT 1;

  -- Buscar ID da Larissa
  SELECT id INTO v_larissa_id
  FROM auth.users
  WHERE email = 'larissaschwarcz@hotmail.com'
  LIMIT 1;

  -- Atualizar organization_id da Larissa se estiver NULL ou diferente
  IF v_mindware_org_id IS NOT NULL AND v_larissa_id IS NOT NULL THEN
    UPDATE profiles
    SET organization_id = v_mindware_org_id,
        updated_at = now()
    WHERE id = v_larissa_id
      AND (organization_id IS NULL OR organization_id <> v_mindware_org_id);
    
    RAISE NOTICE 'Updated Larissa organization_id to %', v_mindware_org_id;
  END IF;

  -- Garantir que organization_owners existe (redundante mas seguro)
  IF v_mindware_org_id IS NOT NULL AND v_larissa_id IS NOT NULL THEN
    INSERT INTO organization_owners (organization_id, user_id, is_primary)
    VALUES (v_mindware_org_id, v_larissa_id, false)
    ON CONFLICT (organization_id, user_id) DO NOTHING;
  END IF;
END $$;