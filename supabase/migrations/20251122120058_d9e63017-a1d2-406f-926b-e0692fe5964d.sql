-- ============================================================================
-- FASE 12.3.3: FIX para infinite recursion em organization_positions
-- ============================================================================
-- 
-- PROBLEMA IDENTIFICADO:
-- Error code: 42P17 - "infinite recursion detected in policy for relation organization_positions"
--
-- CAUSA RAIZ:
-- A policy org_positions_org_select usa current_user_organization()
-- → que chama resolve_organization_for_user()
-- → que faz JOIN com organization_positions (Tentativa 3)
-- → que dispara a policy novamente = LOOP INFINITO
--
-- SOLUÇÃO:
-- Redefinir resolve_organization_for_user() SEM usar organization_positions
-- Usar apenas profiles.organization_id e organization_owners
-- ============================================================================

-- Redefinir a função resolve_organization_for_user sem a Tentativa 3
CREATE OR REPLACE FUNCTION public.resolve_organization_for_user(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Tentativa 1: profiles.organization_id
  SELECT organization_id INTO v_org_id
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1;
  
  IF v_org_id IS NOT NULL THEN
    RETURN v_org_id;
  END IF;
  
  -- Tentativa 2: organization_owners (usuário é dono)
  SELECT organization_id INTO v_org_id
  FROM public.organization_owners
  WHERE user_id = _user_id AND is_primary = true
  LIMIT 1;
  
  IF v_org_id IS NOT NULL THEN
    RETURN v_org_id;
  END IF;
  
  -- REMOVIDO: Tentativa 3 com organization_positions (causa loop infinito)
  -- Se chegou aqui, não conseguimos resolver via profiles/owners
  -- Isso é OK para evitar recursão infinita
  
  -- Fallback: NULL
  RETURN NULL;
END;
$$;

-- Comentário explicativo
COMMENT ON FUNCTION public.resolve_organization_for_user IS 
'Resolve organization_id para um user_id. 
NÃO usa organization_positions para evitar recursão infinita nas RLS policies.
Usa apenas profiles.organization_id e organization_owners.';