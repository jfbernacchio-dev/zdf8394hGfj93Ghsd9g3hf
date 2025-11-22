-- ============================================================================
-- FASE 12.1.2 - Fix Team Data: Popular organization_id em profiles subordinados
-- ============================================================================

-- PROBLEMA IDENTIFICADO:
-- Profiles criados por outros usuários (subordinados) não têm organization_id populado
-- Isso faz com que getUserIdsInOrganization não os inclua, e os cards de equipe ficam vazios

-- SOLUÇÃO:
-- 1. Backfill: Popular organization_id dos subordinados com base no criador
-- 2. Trigger: Garantir que novos profiles herdem o organization_id do criador

-- ============================================================================
-- PASSO 1: BACKFILL - Popular organization_id dos subordinados
-- ============================================================================

UPDATE profiles
SET organization_id = creator.organization_id
FROM profiles AS creator
WHERE profiles.created_by = creator.id
  AND profiles.organization_id IS NULL
  AND creator.organization_id IS NOT NULL;

-- ============================================================================
-- PASSO 2: TRIGGER - Auto-popular organization_id em novos profiles
-- ============================================================================

-- Criar função que popula organization_id com base no criador
CREATE OR REPLACE FUNCTION public.set_profile_organization_from_creator()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se organization_id já está setado, não faz nada
  IF NEW.organization_id IS NOT NULL THEN
    RETURN NEW;
  END IF;

  -- Se tem created_by, herda o organization_id do criador
  IF NEW.created_by IS NOT NULL THEN
    SELECT organization_id INTO NEW.organization_id
    FROM profiles
    WHERE id = NEW.created_by;
  END IF;

  RETURN NEW;
END;
$$;

-- Criar trigger que executa antes do INSERT
DROP TRIGGER IF EXISTS trg_set_profile_organization_from_creator ON profiles;
CREATE TRIGGER trg_set_profile_organization_from_creator
  BEFORE INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION set_profile_organization_from_creator();

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON FUNCTION public.set_profile_organization_from_creator IS 
'FASE 12.1.2: Auto-popula organization_id em profiles com base no created_by, garantindo que subordinados herdem a organização do criador';

COMMENT ON TRIGGER trg_set_profile_organization_from_creator ON profiles IS
'FASE 12.1.2: Trigger que auto-popula organization_id de novos profiles baseado no criador';