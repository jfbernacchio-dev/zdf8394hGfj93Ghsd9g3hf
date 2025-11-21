-- HOTFIX: remover policy recursiva em organization_levels
ALTER TABLE organization_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Same org can view org levels" ON organization_levels;