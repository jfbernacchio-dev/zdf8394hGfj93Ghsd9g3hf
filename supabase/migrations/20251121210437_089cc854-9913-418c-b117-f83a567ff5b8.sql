-- HOTFIX 4: Desligar RLS nas tabelas organizacionais (org structure only)
-- Motivo: evitar recursão e destravar /org-management e /team-management
-- IMPORTANTE: NÃO mexer em nenhuma tabela clínica/financeira.

-- 1) organization_levels
ALTER TABLE organization_levels
  DISABLE ROW LEVEL SECURITY;

-- 2) organization_positions
ALTER TABLE organization_positions
  DISABLE ROW LEVEL SECURITY;

-- 3) user_positions
ALTER TABLE user_positions
  DISABLE ROW LEVEL SECURITY;

-- 4) level_role_settings
ALTER TABLE level_role_settings
  DISABLE ROW LEVEL SECURITY;