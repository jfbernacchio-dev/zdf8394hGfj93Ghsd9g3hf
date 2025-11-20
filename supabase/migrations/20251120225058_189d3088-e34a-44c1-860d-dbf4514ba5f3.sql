-- ============================================
-- FASE 7: Correção de Recursão nas RLS
-- Remover policies com dependências circulares
-- e substituir por policies simples para usuários autenticados
-- ============================================

-- 1) Tabela user_positions
-- Remover policy recursiva
DROP POLICY IF EXISTS "Users can view positions in their organization v4" ON user_positions;

-- Remover função helper que causa recursão
DROP FUNCTION IF EXISTS get_user_organization_id(UUID);

-- Criar policy simples para usuários autenticados
CREATE POLICY "Authenticated users can view user positions"
ON user_positions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 2) Tabela organization_positions
-- Remover policy com dependência circular
DROP POLICY IF EXISTS "Users can view positions in their organization" ON organization_positions;

-- Criar policy simples para usuários autenticados
CREATE POLICY "Authenticated users can view organization positions"
ON organization_positions
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 3) Tabela organization_levels
-- Remover policy com dependência circular
DROP POLICY IF EXISTS "Users can view levels of their organization" ON organization_levels;

-- Criar policy simples para usuários autenticados
CREATE POLICY "Authenticated users can view organization levels"
ON organization_levels
FOR SELECT
USING (auth.uid() IS NOT NULL);

-- 4) Tabela level_permission_sets
-- Remover policy complexa e criar policy simples
DROP POLICY IF EXISTS "Users can view permissions in their organization" ON level_permission_sets;

CREATE POLICY "Authenticated users can view permissions"
ON level_permission_sets
FOR SELECT
USING (auth.uid() IS NOT NULL);