-- ============================================================================
-- FASE 9.3.1 - RLS para tabelas organizacionais (organization_levels, 
-- organization_positions, user_positions, level_role_settings)
-- ============================================================================

-- 1) ORGANIZATION LEVELS
ALTER TABLE organization_levels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage all org levels" ON organization_levels;
DROP POLICY IF EXISTS "Owner can manage own org levels" ON organization_levels;
DROP POLICY IF EXISTS "Same org can view org levels" ON organization_levels;

CREATE POLICY "Admin can manage all org levels"
  ON organization_levels
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can manage own org levels"
  ON organization_levels
  FOR ALL
  TO authenticated
  USING (organization_id = auth.uid())
  WITH CHECK (organization_id = auth.uid());

CREATE POLICY "Same org can view org levels"
  ON organization_levels
  FOR SELECT
  TO authenticated
  USING (
    is_same_organization(organization_id)
  );

-- 2) ORGANIZATION POSITIONS
ALTER TABLE organization_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage all org positions" ON organization_positions;
DROP POLICY IF EXISTS "Owner can manage own org positions" ON organization_positions;
DROP POLICY IF EXISTS "Same org can view org positions" ON organization_positions;

CREATE POLICY "Admin can manage all org positions"
  ON organization_positions
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can manage own org positions"
  ON organization_positions
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM organization_levels ol
      WHERE ol.id = organization_positions.level_id
        AND ol.organization_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM organization_levels ol
      WHERE ol.id = organization_positions.level_id
        AND ol.organization_id = auth.uid()
    )
  );

CREATE POLICY "Same org can view org positions"
  ON organization_positions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM organization_levels ol
      WHERE ol.id = organization_positions.level_id
        AND is_same_organization(ol.organization_id)
    )
  );

-- 3) USER POSITIONS
ALTER TABLE user_positions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage all user positions" ON user_positions;
DROP POLICY IF EXISTS "Owner can manage own user positions" ON user_positions;
DROP POLICY IF EXISTS "Same org can view user positions" ON user_positions;
DROP POLICY IF EXISTS "Owner can manage user positions in own org" ON user_positions;
DROP POLICY IF EXISTS "Authenticated users can view user positions" ON user_positions;

CREATE POLICY "Admin can manage all user positions"
  ON user_positions
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can manage own user positions"
  ON user_positions
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Same org can view user positions"
  ON user_positions
  FOR SELECT
  TO authenticated
  USING (
    is_same_organization(user_id)
  );

-- 4) LEVEL ROLE SETTINGS
ALTER TABLE level_role_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin can manage all level role settings" ON level_role_settings;
DROP POLICY IF EXISTS "Owner can manage own level role settings" ON level_role_settings;
DROP POLICY IF EXISTS "Same org can view level role settings" ON level_role_settings;

CREATE POLICY "Admin can manage all level role settings"
  ON level_role_settings
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can manage own level role settings"
  ON level_role_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM organization_levels ol
      WHERE ol.id = level_role_settings.level_id
        AND ol.organization_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM organization_levels ol
      WHERE ol.id = level_role_settings.level_id
        AND ol.organization_id = auth.uid()
    )
  );

CREATE POLICY "Same org can view level role settings"
  ON level_role_settings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM organization_levels ol
      WHERE ol.id = level_role_settings.level_id
        AND is_same_organization(ol.organization_id)
    )
  );