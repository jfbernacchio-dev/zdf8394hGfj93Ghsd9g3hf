
-- CORREÇÃO: Remover política recursiva e criar uma melhor

-- 1. Remover a política problemática
DROP POLICY IF EXISTS "Users can view positions in their organization" ON user_positions;

-- 2. Criar política correta SEM recursão
-- Esta permite que usuários vejam outras posições na mesma organização
-- usando apenas organization_levels e organization_positions (sem self-join)
CREATE POLICY "Users can view positions in their organization v2"
ON user_positions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM organization_positions op1
    JOIN organization_levels ol1 ON ol1.id = op1.level_id
    JOIN organization_positions op2 ON op2.id = user_positions.position_id
    JOIN organization_levels ol2 ON ol2.id = op2.level_id
    WHERE op1.id IN (
      SELECT position_id 
      FROM user_positions 
      WHERE user_id = auth.uid()
    )
    AND ol1.organization_id = ol2.organization_id
  )
);
