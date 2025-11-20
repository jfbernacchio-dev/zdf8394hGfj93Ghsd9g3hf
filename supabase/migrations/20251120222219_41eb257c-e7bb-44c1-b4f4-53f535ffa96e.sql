
-- SOLUÇÃO DEFINITIVA: Usar função helper para evitar recursão

-- 1. Remover política recursiva
DROP POLICY IF EXISTS "Users can view positions in their organization v3" ON user_positions;

-- 2. Criar função helper que retorna organization_id do usuário
CREATE OR REPLACE FUNCTION get_user_organization_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT ol.organization_id
  FROM user_positions up
  JOIN organization_positions op ON op.id = up.position_id
  JOIN organization_levels ol ON ol.id = op.level_id
  WHERE up.user_id = _user_id
  LIMIT 1;
$$;

-- 3. Criar política SEM recursão usando a função
CREATE POLICY "Users can view positions in their organization v4"
ON user_positions
FOR SELECT
USING (
  -- Permite ver sua própria posição
  user_id = auth.uid()
  OR
  -- Permite ver posições de outros na mesma organização
  EXISTS (
    SELECT 1
    FROM organization_positions op
    JOIN organization_levels ol ON ol.id = op.level_id
    WHERE op.id = user_positions.position_id
    AND ol.organization_id = get_user_organization_id(auth.uid())
  )
);
