-- HOTFIX 3: Remover recursão em organization_levels e recriar policies seguras

ALTER TABLE organization_levels ENABLE ROW LEVEL SECURITY;

-- 1) Limpar TODAS as policies antigas e conflitantes de organization_levels
DROP POLICY IF EXISTS "Admin can manage all organization levels" ON organization_levels;
DROP POLICY IF EXISTS "Owner can manage own organization levels" ON organization_levels;
DROP POLICY IF EXISTS "Same org can view organization levels" ON organization_levels;

DROP POLICY IF EXISTS "Admin can manage all org levels" ON organization_levels;
DROP POLICY IF EXISTS "Owner can manage own org levels" ON organization_levels;
DROP POLICY IF EXISTS "Same org can view org levels" ON organization_levels;

-- 2) Recriar policies MÍNIMAS (sem nenhuma referência recursiva)

-- Admin vê e gerencia tudo em qualquer organização
CREATE POLICY "OrgLevels admin full access"
  ON organization_levels
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Dono da organização (organization_id = auth.uid()) também pode gerenciar seus níveis
CREATE POLICY "OrgLevels owner manage own"
  ON organization_levels
  FOR ALL
  TO authenticated
  USING (organization_id = auth.uid())
  WITH CHECK (organization_id = auth.uid());