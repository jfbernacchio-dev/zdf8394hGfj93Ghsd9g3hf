-- HOTFIX 2: remover policies recursivas que usam is_same_organization
-- nas tabelas organizacionais para evitar infinite recursion

DROP POLICY IF EXISTS "Same org can view org positions" ON organization_positions;

DROP POLICY IF EXISTS "Same org can view user positions" ON user_positions;

DROP POLICY IF EXISTS "Same org can view level role settings" ON level_role_settings;