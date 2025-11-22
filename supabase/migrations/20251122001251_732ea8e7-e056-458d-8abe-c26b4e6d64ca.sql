
-- ============================================================================
-- FASE 11.4: RLS Multi-Organização para Núcleo Organizacional
-- ============================================================================
-- 
-- Implementa Row Level Security completo para:
-- 1. organization_levels
-- 2. organization_positions  
-- 3. user_positions
-- 4. level_role_settings
-- 5. level_permission_sets (refactor)
-- 6. level_sharing_config (refactor)
--
-- Padrão: NÃO usar is_same_organization(), NÃO fazer JOINs nas policies
-- Usar apenas organization_id e current_user_organization()
-- ============================================================================

-- ============================================================================
-- 0. CRIAR FUNÇÃO HELPER PARA OBTER ORGANIZATION_ID DE UM LEVEL
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_level_organization_id(_level_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id
  FROM organization_levels
  WHERE id = _level_id
  LIMIT 1;
$$;

COMMENT ON FUNCTION public.get_level_organization_id IS 
'FASE 11.4: Helper function to get organization_id from a level_id. Used in RLS policies to avoid subqueries.';

-- ============================================================================
-- 1. TABELA: organization_levels
-- ============================================================================

ALTER TABLE public.organization_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_levels FORCE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS "Admin can manage all levels" ON public.organization_levels;
DROP POLICY IF EXISTS "Owner can manage own levels" ON public.organization_levels;
DROP POLICY IF EXISTS "Same org can view levels" ON public.organization_levels;
DROP POLICY IF EXISTS "org_levels_admin_all" ON public.organization_levels;
DROP POLICY IF EXISTS "org_levels_owner_all" ON public.organization_levels;
DROP POLICY IF EXISTS "org_levels_member_select" ON public.organization_levels;
DROP POLICY IF EXISTS "org_levels_org_select" ON public.organization_levels;
DROP POLICY IF EXISTS "org_levels_owner_modify" ON public.organization_levels;
DROP POLICY IF EXISTS "org_levels_owner_insert" ON public.organization_levels;
DROP POLICY IF EXISTS "org_levels_owner_update" ON public.organization_levels;
DROP POLICY IF EXISTS "org_levels_owner_delete" ON public.organization_levels;

-- Admin: full access
CREATE POLICY "org_levels_admin_all"
ON public.organization_levels
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Members: SELECT apenas da própria organização
CREATE POLICY "org_levels_org_select"
ON public.organization_levels
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL
  AND organization_id = current_user_organization()
);

-- Owners: INSERT na própria organização
CREATE POLICY "org_levels_owner_insert"
ON public.organization_levels
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = current_user_organization()
  AND EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_id = organization_levels.organization_id
      AND user_id = auth.uid()
      AND is_primary = true
  )
);

-- Owners: UPDATE na própria organização
CREATE POLICY "org_levels_owner_update"
ON public.organization_levels
FOR UPDATE
TO authenticated
USING (
  organization_id = current_user_organization()
  AND EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_id = organization_levels.organization_id
      AND user_id = auth.uid()
      AND is_primary = true
  )
)
WITH CHECK (
  organization_id = current_user_organization()
  AND EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_id = organization_levels.organization_id
      AND user_id = auth.uid()
      AND is_primary = true
  )
);

-- Owners: DELETE na própria organização
CREATE POLICY "org_levels_owner_delete"
ON public.organization_levels
FOR DELETE
TO authenticated
USING (
  organization_id = current_user_organization()
  AND EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_id = organization_levels.organization_id
      AND user_id = auth.uid()
      AND is_primary = true
  )
);

-- ============================================================================
-- 2. TABELA: organization_positions
-- ============================================================================

ALTER TABLE public.organization_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_positions FORCE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS "Admin can manage all positions" ON public.organization_positions;
DROP POLICY IF EXISTS "Owner can manage own positions" ON public.organization_positions;
DROP POLICY IF EXISTS "Same org can view positions" ON public.organization_positions;
DROP POLICY IF EXISTS "org_positions_admin_all" ON public.organization_positions;
DROP POLICY IF EXISTS "org_positions_owner_all" ON public.organization_positions;
DROP POLICY IF EXISTS "org_positions_member_select" ON public.organization_positions;
DROP POLICY IF EXISTS "org_positions_org_select" ON public.organization_positions;
DROP POLICY IF EXISTS "org_positions_owner_modify" ON public.organization_positions;
DROP POLICY IF EXISTS "org_positions_owner_insert" ON public.organization_positions;
DROP POLICY IF EXISTS "org_positions_owner_update" ON public.organization_positions;
DROP POLICY IF EXISTS "org_positions_owner_delete" ON public.organization_positions;

-- Admin: full access
CREATE POLICY "org_positions_admin_all"
ON public.organization_positions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Members: SELECT apenas da própria organização (via level_id)
CREATE POLICY "org_positions_org_select"
ON public.organization_positions
FOR SELECT
TO authenticated
USING (
  level_id IS NOT NULL
  AND get_level_organization_id(level_id) = current_user_organization()
);

-- Owners: INSERT na própria organização
CREATE POLICY "org_positions_owner_insert"
ON public.organization_positions
FOR INSERT
TO authenticated
WITH CHECK (
  get_level_organization_id(level_id) = current_user_organization()
  AND EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_id = current_user_organization()
      AND user_id = auth.uid()
      AND is_primary = true
  )
);

-- Owners: UPDATE na própria organização
CREATE POLICY "org_positions_owner_update"
ON public.organization_positions
FOR UPDATE
TO authenticated
USING (
  get_level_organization_id(level_id) = current_user_organization()
  AND EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_id = current_user_organization()
      AND user_id = auth.uid()
      AND is_primary = true
  )
)
WITH CHECK (
  get_level_organization_id(level_id) = current_user_organization()
  AND EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_id = current_user_organization()
      AND user_id = auth.uid()
      AND is_primary = true
  )
);

-- Owners: DELETE na própria organização
CREATE POLICY "org_positions_owner_delete"
ON public.organization_positions
FOR DELETE
TO authenticated
USING (
  get_level_organization_id(level_id) = current_user_organization()
  AND EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_id = current_user_organization()
      AND user_id = auth.uid()
      AND is_primary = true
  )
);

-- ============================================================================
-- 3. TABELA: user_positions
-- ============================================================================

ALTER TABLE public.user_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_positions FORCE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS "Admin can manage all user positions" ON public.user_positions;
DROP POLICY IF EXISTS "Owner can manage user positions in own org" ON public.user_positions;
DROP POLICY IF EXISTS "Same org can view user positions" ON public.user_positions;
DROP POLICY IF EXISTS "User can view own position" ON public.user_positions;
DROP POLICY IF EXISTS "user_positions_admin_all" ON public.user_positions;
DROP POLICY IF EXISTS "user_positions_owner_modify" ON public.user_positions;
DROP POLICY IF EXISTS "user_positions_org_select" ON public.user_positions;
DROP POLICY IF EXISTS "user_positions_own_select" ON public.user_positions;
DROP POLICY IF EXISTS "user_positions_own_access" ON public.user_positions;
DROP POLICY IF EXISTS "user_positions_owner_insert" ON public.user_positions;
DROP POLICY IF EXISTS "user_positions_owner_update" ON public.user_positions;
DROP POLICY IF EXISTS "user_positions_owner_delete" ON public.user_positions;

-- Admin: full access
CREATE POLICY "user_positions_admin_all"
ON public.user_positions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- User: pode ver e gerenciar suas próprias posições
CREATE POLICY "user_positions_own_access"
ON public.user_positions
FOR ALL
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Members: SELECT posições da própria organização
CREATE POLICY "user_positions_org_select"
ON public.user_positions
FOR SELECT
TO authenticated
USING (
  position_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM organization_positions op
    WHERE op.id = user_positions.position_id
      AND get_level_organization_id(op.level_id) = current_user_organization()
  )
);

-- Owners: INSERT posições na própria organização
CREATE POLICY "user_positions_owner_insert"
ON public.user_positions
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_positions op
    WHERE op.id = user_positions.position_id
      AND get_level_organization_id(op.level_id) = current_user_organization()
  )
  AND EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_id = current_user_organization()
      AND user_id = auth.uid()
      AND is_primary = true
  )
);

-- Owners: UPDATE posições na própria organização
CREATE POLICY "user_positions_owner_update"
ON public.user_positions
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_positions op
    WHERE op.id = user_positions.position_id
      AND get_level_organization_id(op.level_id) = current_user_organization()
  )
  AND EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_id = current_user_organization()
      AND user_id = auth.uid()
      AND is_primary = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_positions op
    WHERE op.id = user_positions.position_id
      AND get_level_organization_id(op.level_id) = current_user_organization()
  )
  AND EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_id = current_user_organization()
      AND user_id = auth.uid()
      AND is_primary = true
  )
);

-- Owners: DELETE posições na própria organização
CREATE POLICY "user_positions_owner_delete"
ON public.user_positions
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_positions op
    WHERE op.id = user_positions.position_id
      AND get_level_organization_id(op.level_id) = current_user_organization()
  )
  AND EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_id = current_user_organization()
      AND user_id = auth.uid()
      AND is_primary = true
  )
);

-- ============================================================================
-- 4. TABELA: level_role_settings
-- ============================================================================

ALTER TABLE public.level_role_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_role_settings FORCE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS "Admin can manage all level role settings" ON public.level_role_settings;
DROP POLICY IF EXISTS "Owner can manage own level role settings" ON public.level_role_settings;
DROP POLICY IF EXISTS "Same org can view level role settings" ON public.level_role_settings;
DROP POLICY IF EXISTS "level_role_settings_admin_all" ON public.level_role_settings;
DROP POLICY IF EXISTS "level_role_settings_owner_all" ON public.level_role_settings;
DROP POLICY IF EXISTS "level_role_settings_org_select" ON public.level_role_settings;
DROP POLICY IF EXISTS "level_role_settings_owner_modify" ON public.level_role_settings;
DROP POLICY IF EXISTS "level_role_settings_owner_insert" ON public.level_role_settings;
DROP POLICY IF EXISTS "level_role_settings_owner_update" ON public.level_role_settings;
DROP POLICY IF EXISTS "level_role_settings_owner_delete" ON public.level_role_settings;

-- Admin: full access
CREATE POLICY "level_role_settings_admin_all"
ON public.level_role_settings
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Members: SELECT da própria organização
CREATE POLICY "level_role_settings_org_select"
ON public.level_role_settings
FOR SELECT
TO authenticated
USING (
  level_id IS NOT NULL
  AND get_level_organization_id(level_id) = current_user_organization()
);

-- Owners: INSERT na própria organização
CREATE POLICY "level_role_settings_owner_insert"
ON public.level_role_settings
FOR INSERT
TO authenticated
WITH CHECK (
  get_level_organization_id(level_id) = current_user_organization()
  AND EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_id = current_user_organization()
      AND user_id = auth.uid()
      AND is_primary = true
  )
);

-- Owners: UPDATE na própria organização
CREATE POLICY "level_role_settings_owner_update"
ON public.level_role_settings
FOR UPDATE
TO authenticated
USING (
  get_level_organization_id(level_id) = current_user_organization()
  AND EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_id = current_user_organization()
      AND user_id = auth.uid()
      AND is_primary = true
  )
)
WITH CHECK (
  get_level_organization_id(level_id) = current_user_organization()
  AND EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_id = current_user_organization()
      AND user_id = auth.uid()
      AND is_primary = true
  )
);

-- Owners: DELETE na própria organização
CREATE POLICY "level_role_settings_owner_delete"
ON public.level_role_settings
FOR DELETE
TO authenticated
USING (
  get_level_organization_id(level_id) = current_user_organization()
  AND EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_id = current_user_organization()
      AND user_id = auth.uid()
      AND is_primary = true
  )
);

-- ============================================================================
-- 5. TABELA: level_permission_sets (REFACTOR)
-- ============================================================================

ALTER TABLE public.level_permission_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_permission_sets FORCE ROW LEVEL SECURITY;

-- Remover policies antigas (incluindo as que usam is_same_organization)
DROP POLICY IF EXISTS "Admin can manage all level permissions" ON public.level_permission_sets;
DROP POLICY IF EXISTS "Owner can manage own level permissions" ON public.level_permission_sets;
DROP POLICY IF EXISTS "Same org can view level permissions" ON public.level_permission_sets;
DROP POLICY IF EXISTS "level_permission_sets_admin_all" ON public.level_permission_sets;
DROP POLICY IF EXISTS "level_permission_sets_owner_all" ON public.level_permission_sets;
DROP POLICY IF EXISTS "level_permission_sets_org_select" ON public.level_permission_sets;
DROP POLICY IF EXISTS "level_permission_sets_owner_modify" ON public.level_permission_sets;
DROP POLICY IF EXISTS "level_permission_sets_owner_insert" ON public.level_permission_sets;
DROP POLICY IF EXISTS "level_permission_sets_owner_update" ON public.level_permission_sets;
DROP POLICY IF EXISTS "level_permission_sets_owner_delete" ON public.level_permission_sets;

-- Admin: full access
CREATE POLICY "level_permission_sets_admin_all"
ON public.level_permission_sets
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Members: SELECT da própria organização
CREATE POLICY "level_permission_sets_org_select"
ON public.level_permission_sets
FOR SELECT
TO authenticated
USING (
  level_id IS NOT NULL
  AND get_level_organization_id(level_id) = current_user_organization()
);

-- Owners: INSERT na própria organização
CREATE POLICY "level_permission_sets_owner_insert"
ON public.level_permission_sets
FOR INSERT
TO authenticated
WITH CHECK (
  get_level_organization_id(level_id) = current_user_organization()
  AND EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_id = current_user_organization()
      AND user_id = auth.uid()
      AND is_primary = true
  )
);

-- Owners: UPDATE na própria organização
CREATE POLICY "level_permission_sets_owner_update"
ON public.level_permission_sets
FOR UPDATE
TO authenticated
USING (
  get_level_organization_id(level_id) = current_user_organization()
  AND EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_id = current_user_organization()
      AND user_id = auth.uid()
      AND is_primary = true
  )
)
WITH CHECK (
  get_level_organization_id(level_id) = current_user_organization()
  AND EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_id = current_user_organization()
      AND user_id = auth.uid()
      AND is_primary = true
  )
);

-- Owners: DELETE na própria organização
CREATE POLICY "level_permission_sets_owner_delete"
ON public.level_permission_sets
FOR DELETE
TO authenticated
USING (
  get_level_organization_id(level_id) = current_user_organization()
  AND EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_id = current_user_organization()
      AND user_id = auth.uid()
      AND is_primary = true
  )
);

-- ============================================================================
-- 6. TABELA: level_sharing_config (REFACTOR)
-- ============================================================================

ALTER TABLE public.level_sharing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_sharing_config FORCE ROW LEVEL SECURITY;

-- Remover policies antigas (incluindo as que usam is_same_organization)
DROP POLICY IF EXISTS "Admin can manage all level sharing configs" ON public.level_sharing_config;
DROP POLICY IF EXISTS "Owner can manage own level sharing configs" ON public.level_sharing_config;
DROP POLICY IF EXISTS "Same org can view level sharing configs" ON public.level_sharing_config;
DROP POLICY IF EXISTS "level_sharing_config_admin_all" ON public.level_sharing_config;
DROP POLICY IF EXISTS "level_sharing_config_owner_all" ON public.level_sharing_config;
DROP POLICY IF EXISTS "level_sharing_config_org_select" ON public.level_sharing_config;
DROP POLICY IF EXISTS "level_sharing_config_owner_modify" ON public.level_sharing_config;
DROP POLICY IF EXISTS "level_sharing_config_owner_insert" ON public.level_sharing_config;
DROP POLICY IF EXISTS "level_sharing_config_owner_update" ON public.level_sharing_config;
DROP POLICY IF EXISTS "level_sharing_config_owner_delete" ON public.level_sharing_config;

-- Admin: full access
CREATE POLICY "level_sharing_config_admin_all"
ON public.level_sharing_config
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Members: SELECT da própria organização
CREATE POLICY "level_sharing_config_org_select"
ON public.level_sharing_config
FOR SELECT
TO authenticated
USING (
  level_id IS NOT NULL
  AND get_level_organization_id(level_id) = current_user_organization()
);

-- Owners: INSERT na própria organização
CREATE POLICY "level_sharing_config_owner_insert"
ON public.level_sharing_config
FOR INSERT
TO authenticated
WITH CHECK (
  get_level_organization_id(level_id) = current_user_organization()
  AND EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_id = current_user_organization()
      AND user_id = auth.uid()
      AND is_primary = true
  )
);

-- Owners: UPDATE na própria organização
CREATE POLICY "level_sharing_config_owner_update"
ON public.level_sharing_config
FOR UPDATE
TO authenticated
USING (
  get_level_organization_id(level_id) = current_user_organization()
  AND EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_id = current_user_organization()
      AND user_id = auth.uid()
      AND is_primary = true
  )
)
WITH CHECK (
  get_level_organization_id(level_id) = current_user_organization()
  AND EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_id = current_user_organization()
      AND user_id = auth.uid()
      AND is_primary = true
  )
);

-- Owners: DELETE na própria organização
CREATE POLICY "level_sharing_config_owner_delete"
ON public.level_sharing_config
FOR DELETE
TO authenticated
USING (
  get_level_organization_id(level_id) = current_user_organization()
  AND EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_id = current_user_organization()
      AND user_id = auth.uid()
      AND is_primary = true
  )
);
