-- ============================================================================
-- FASE 12.3.7: Reset TOTAL de RLS em organization_positions
-- Eliminar recursão infinita (42P17) e simplificar acesso
-- ============================================================================

-- 1) Dropar TODAS as policies existentes nessa tabela, sem exceção
DO $$
DECLARE
  pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'organization_positions'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.organization_positions', pol.policyname);
  END LOOP;
END;
$$;

-- 2) Recriar APENAS duas policies simples, sem nenhuma função
--    que possa tocar organization_positions indiretamente.

-- SELECT: qualquer usuário autenticado pode ler cargos (tabela estrutural)
CREATE POLICY "org_positions_select_all_auth"
ON public.organization_positions
FOR SELECT
TO authenticated
USING (true);

-- INSERT/UPDATE/DELETE: só admin pode mexer na estrutura de cargos
CREATE POLICY "org_positions_admin_all"
ON public.organization_positions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3) Garantir que RLS está habilitado
ALTER TABLE public.organization_positions ENABLE ROW LEVEL SECURITY;

COMMENT ON POLICY "org_positions_select_all_auth" ON public.organization_positions IS
'FASE 12.3.7: Qualquer usuário autenticado pode ler cargos. Tabela estrutural, sem dados sensíveis.';

COMMENT ON POLICY "org_positions_admin_all" ON public.organization_positions IS
'FASE 12.3.7: Apenas admin pode criar/editar/remover cargos no organograma.';