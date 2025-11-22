-- ============================================================================
-- FASE 12.3.6: Hard reset de RLS em organization_positions
-- Eliminar recursão e simplificar acesso
-- ============================================================================

-- 1) Remover a policy problemática (que está causando recursão)
DROP POLICY IF EXISTS "org_positions_org_select" ON public.organization_positions;

-- 2) Criar uma policy de SELECT simples, sem nenhuma função que
--    possa tocar organization_positions por baixo dos panos.
--    Qualquer usuário autenticado pode LER cargos.
CREATE POLICY "org_positions_select_all_auth"
ON public.organization_positions
FOR SELECT
TO authenticated
USING (true);

-- 3) Policy de modificações restrita para admin (criar/editar cargos)
DROP POLICY IF EXISTS "org_positions_admin_all" ON public.organization_positions;

CREATE POLICY "org_positions_admin_all"
ON public.organization_positions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 4) Garantir que RLS está habilitado, mas agora sem recursão
ALTER TABLE public.organization_positions ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY "org_positions_select_all_auth" ON public.organization_positions IS
'FASE 12.3.6: Qualquer usuário autenticado pode ler cargos. Tabela estrutural, sem dados sensíveis.';

COMMENT ON POLICY "org_positions_admin_all" ON public.organization_positions IS
'FASE 12.3.6: Apenas admin pode criar/editar/remover cargos no organograma.';