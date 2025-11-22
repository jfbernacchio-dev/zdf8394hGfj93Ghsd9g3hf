-- ============================================================================
-- FASE 12.3.2: Fix RLS em organization_positions para evitar erro 500
-- ============================================================================
-- 
-- Problema identificado:
-- A policy org_positions_org_select pode retornar erro quando:
-- 1. get_level_organization_id(level_id) retorna NULL para algum level_id
-- 2. current_user_organization() retorna NULL
-- 3. A comparação NULL = NULL resulta em NULL (não TRUE), causando falha na policy
--
-- Solução:
-- Relaxar a policy org_positions_org_select para ser mais permissiva e robusta
-- Garantir que admin sempre pode ver positions independente de organização
-- ============================================================================

-- Remover policy existente
DROP POLICY IF EXISTS "org_positions_org_select" ON public.organization_positions;

-- Recriar policy de SELECT mais robusta
-- Permite SELECT para:
-- 1. Admin (full access)
-- 2. Membros da mesma organização (via get_level_organization_id)
-- 3. Se level_id for NULL, permite (para casos edge)
CREATE POLICY "org_positions_org_select"
ON public.organization_positions
FOR SELECT
TO authenticated
USING (
  -- Admin sempre pode ver
  has_role(auth.uid(), 'admin'::app_role)
  OR
  -- Membros da mesma organização
  (
    level_id IS NOT NULL
    AND get_level_organization_id(level_id) = current_user_organization()
  )
  OR
  -- Owner da organização pode ver
  (
    level_id IS NOT NULL
    AND EXISTS (
      SELECT 1 
      FROM organization_owners oo
      WHERE oo.organization_id = get_level_organization_id(level_id)
        AND oo.user_id = auth.uid()
    )
  )
);

COMMENT ON POLICY "org_positions_org_select" ON public.organization_positions IS 
'FASE 12.3.2: Policy de SELECT robusta que permite admin full access + org members + owners';

-- ============================================================================
-- Garantir que a função get_level_organization_id é robusta
-- ============================================================================

-- Recriar função para garantir que retorna NULL gracefully se level não existir
CREATE OR REPLACE FUNCTION public.get_level_organization_id(_level_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM organization_levels
  WHERE id = _level_id
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_level_organization_id IS 
'FASE 12.3.2: Helper robusta - retorna organization_id de um level_id ou NULL se não existir';