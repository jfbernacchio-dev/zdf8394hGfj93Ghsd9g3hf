-- ============================================================================
-- FASE 2: SUBORDINAÇÃO VERTICAL - FUNÇÕES RECURSIVAS (CORREÇÃO)
-- ============================================================================
-- OBJETIVO: Criar funções para navegar na hierarquia organizacional
-- DATA: 2025
-- 
-- FUNÇÕES CRIADAS:
-- 1. get_all_subordinates(user_id) - Retorna todos subordinados transitivos
-- 2. get_all_superiors(user_id) - Retorna todos superiores na cadeia
-- 3. get_direct_superior(user_id) - Retorna superior imediato
-- 4. is_in_hierarchy_below(user_id, superior_user_id) - Verifica se está abaixo
-- 5. get_user_level_number(user_id) - Retorna nível hierárquico do usuário
-- ============================================================================

-- ============================================================================
-- 1. FUNÇÃO: get_all_subordinates
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_all_subordinates(_user_id uuid)
RETURNS TABLE(subordinate_user_id uuid, depth integer) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE subordinates AS (
    SELECT 
      up.position_id,
      0 as depth
    FROM user_positions up
    WHERE up.user_id = _user_id
    
    UNION ALL
    
    SELECT 
      op.id as position_id,
      s.depth + 1 as depth
    FROM organization_positions op
    INNER JOIN subordinates s ON op.parent_position_id = s.position_id
    WHERE s.depth < 10
  )
  SELECT DISTINCT 
    up.user_id,
    s.depth
  FROM subordinates s
  INNER JOIN user_positions up ON up.position_id = s.position_id
  WHERE up.user_id != _user_id
  ORDER BY s.depth, up.user_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_all_subordinates(uuid) IS 
'Retorna todos subordinados transitivos de um usuário (recursivo até 10 níveis)';

-- ============================================================================
-- 2. FUNÇÃO: get_all_superiors
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_all_superiors(_user_id uuid)
RETURNS TABLE(superior_user_id uuid, depth integer) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE superiors AS (
    SELECT 
      up.position_id,
      op.parent_position_id,
      0 as depth
    FROM user_positions up
    INNER JOIN organization_positions op ON op.id = up.position_id
    WHERE up.user_id = _user_id
    
    UNION ALL
    
    SELECT 
      op.id as position_id,
      op.parent_position_id,
      s.depth + 1 as depth
    FROM organization_positions op
    INNER JOIN superiors s ON op.id = s.parent_position_id
    WHERE s.parent_position_id IS NOT NULL
      AND s.depth < 10
  )
  SELECT DISTINCT 
    up.user_id,
    s.depth
  FROM superiors s
  INNER JOIN user_positions up ON up.position_id = s.position_id
  WHERE up.user_id != _user_id
    AND s.parent_position_id IS NOT NULL
  ORDER BY s.depth, up.user_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_all_superiors(uuid) IS 
'Retorna todos superiores na cadeia hierárquica (recursivo até 10 níveis)';

-- ============================================================================
-- 3. FUNÇÃO: get_direct_superior
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_direct_superior(_user_id uuid)
RETURNS uuid AS $$
DECLARE
  v_superior_user_id uuid;
BEGIN
  SELECT up_parent.user_id INTO v_superior_user_id
  FROM user_positions up_self
  INNER JOIN organization_positions op_self ON op_self.id = up_self.position_id
  INNER JOIN organization_positions op_parent ON op_parent.id = op_self.parent_position_id
  INNER JOIN user_positions up_parent ON up_parent.position_id = op_parent.id
  WHERE up_self.user_id = _user_id
  LIMIT 1;
  
  RETURN v_superior_user_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_direct_superior(uuid) IS 
'Retorna o superior imediato de um usuário (1 nível acima apenas)';

-- ============================================================================
-- 4. FUNÇÃO: is_in_hierarchy_below
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_in_hierarchy_below(
  _user_id uuid,
  _superior_user_id uuid
)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM get_all_superiors(_user_id) 
    WHERE superior_user_id = _superior_user_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.is_in_hierarchy_below(uuid, uuid) IS 
'Verifica se um usuário está abaixo de outro na hierarquia organizacional';

-- ============================================================================
-- 5. FUNÇÃO: get_user_level_number
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_level_number(_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_level_number integer;
BEGIN
  SELECT ol.level_number INTO v_level_number
  FROM user_positions up
  INNER JOIN organization_positions op ON op.id = up.position_id
  INNER JOIN organization_levels ol ON ol.id = op.level_id
  WHERE up.user_id = _user_id
  LIMIT 1;
  
  RETURN v_level_number;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_user_level_number(uuid) IS 
'Retorna o número do nível hierárquico de um usuário (1=topo, 2, 3...)';

-- ============================================================================
-- 6. FUNÇÃO: get_organization_id_for_user
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_organization_id_for_user(_user_id uuid)
RETURNS uuid AS $$
DECLARE
  v_organization_id uuid;
BEGIN
  SELECT ol.organization_id INTO v_organization_id
  FROM user_positions up
  INNER JOIN organization_positions op ON op.id = up.position_id
  INNER JOIN organization_levels ol ON ol.id = op.level_id
  WHERE up.user_id = _user_id
  LIMIT 1;
  
  RETURN v_organization_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_organization_id_for_user(uuid) IS 
'Retorna o ID da organização (dono) a qual um usuário pertence';

-- ============================================================================
-- 7. FUNÇÃO: is_organization_owner
-- ============================================================================
CREATE OR REPLACE FUNCTION public.is_organization_owner(_user_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM organization_levels ol
    WHERE ol.organization_id = _user_id
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.is_organization_owner(uuid) IS 
'Verifica se um usuário é dono de uma organização (possui organization_id = user_id)';

-- ============================================================================
-- 8. FUNÇÃO: get_subordinates_at_depth
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_subordinates_at_depth(
  _user_id uuid,
  _target_depth integer DEFAULT 1
)
RETURNS TABLE(subordinate_user_id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT s.subordinate_user_id
  FROM get_all_subordinates(_user_id) s
  WHERE s.depth = _target_depth;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_subordinates_at_depth(uuid, integer) IS 
'Retorna subordinados em uma profundidade específica (1=diretos, 2=netos, etc)';

-- ============================================================================
-- 9. FUNÇÃO: get_organization_hierarchy_info
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_organization_hierarchy_info(_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  position_id uuid,
  position_name text,
  level_id uuid,
  level_number integer,
  level_name text,
  organization_id uuid,
  parent_position_id uuid,
  direct_superior_user_id uuid,
  is_owner boolean,
  depth_from_top integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.user_id,
    up.position_id,
    op.position_name,
    op.level_id,
    ol.level_number,
    ol.level_name,
    ol.organization_id,
    op.parent_position_id,
    get_direct_superior(up.user_id) as direct_superior_user_id,
    is_organization_owner(up.user_id) as is_owner,
    (
      SELECT COUNT(*)::integer
      FROM get_all_superiors(up.user_id)
    ) as depth_from_top
  FROM user_positions up
  INNER JOIN organization_positions op ON op.id = up.position_id
  INNER JOIN organization_levels ol ON ol.id = op.level_id
  WHERE up.user_id = _user_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_organization_hierarchy_info(uuid) IS 
'Retorna informações completas sobre a posição hierárquica de um usuário';

-- ============================================================================
-- ÍNDICES ADICIONAIS PARA PERFORMANCE DE RECURSÃO
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_positions_lookup 
ON public.user_positions(user_id, position_id);

CREATE INDEX IF NOT EXISTS idx_positions_parent_level 
ON public.organization_positions(parent_position_id, level_id) 
WHERE parent_position_id IS NOT NULL;

-- ============================================================================
-- VIEWS AUXILIARES (para facilitar queries futuras)
-- ============================================================================

CREATE OR REPLACE VIEW public.v_users_with_hierarchy AS
SELECT 
  p.id as user_id,
  p.full_name,
  up.position_id,
  op.position_name,
  op.level_id,
  ol.level_number,
  ol.level_name,
  ol.organization_id,
  op.parent_position_id,
  (SELECT user_id FROM user_positions WHERE position_id = op.parent_position_id LIMIT 1) as direct_superior_user_id,
  is_organization_owner(p.id) as is_owner
FROM profiles p
LEFT JOIN user_positions up ON up.user_id = p.id
LEFT JOIN organization_positions op ON op.id = up.position_id
LEFT JOIN organization_levels ol ON ol.id = op.level_id;

COMMENT ON VIEW public.v_users_with_hierarchy IS 
'View consolidada: usuários com suas informações hierárquicas';

COMMENT ON SCHEMA public IS 'FASE 2A COMPLETA: Funções recursivas criadas. Próximo: migração de dados.';