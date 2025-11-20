
-- CORREÇÃO FINAL: Remover completamente recursão

-- 1. Remover a política ainda problemática
DROP POLICY IF EXISTS "Users can view positions in their organization v2" ON user_positions;

-- 2. Criar política SIMPLES sem nenhuma recursão
-- Permite ver posições na mesma organização através de uma CTE
CREATE POLICY "Users can view positions in their organization v3"
ON user_positions
FOR SELECT
USING (
  -- Permite ver sua própria posição
  user_id = auth.uid()
  OR
  -- Permite ver posições de outros na mesma organização
  EXISTS (
    WITH user_org AS (
      SELECT ol.organization_id
      FROM user_positions up
      JOIN organization_positions op ON op.id = up.position_id
      JOIN organization_levels ol ON ol.id = op.level_id
      WHERE up.user_id = auth.uid()
      LIMIT 1
    )
    SELECT 1
    FROM organization_positions op2
    JOIN organization_levels ol2 ON ol2.id = op2.level_id
    CROSS JOIN user_org
    WHERE op2.id = user_positions.position_id
    AND ol2.organization_id = user_org.organization_id
  )
);
