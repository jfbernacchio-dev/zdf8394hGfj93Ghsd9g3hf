-- ============================================================================
-- FASE 2B: MIGRAÇÃO DE DADOS (therapist_assignments → organization_positions)
-- ============================================================================
-- OBJETIVO: Popular estrutura organizacional com dados existentes
-- DATA: 2025
-- 
-- ESTRATÉGIA:
-- 1. Identificar Full Therapists (não são subordinados de ninguém)
-- 2. Criar organização + níveis para cada Full
-- 3. Criar posições: Full (nível 1), Subordinados (nível 2)
-- 4. Vincular usuários às posições
-- 5. Migrar permissões (subordinate_autonomy_settings → level_permission_sets)
-- 
-- IMPORTANTE: Sistema antigo CONTINUA funcionando normalmente!
-- ============================================================================

-- ============================================================================
-- REMOVER VIEW PROBLEMÁTICA DA FASE 2A
-- ============================================================================
DROP VIEW IF EXISTS public.v_users_with_hierarchy;

-- ============================================================================
-- ETAPA 1: Identificar Full Therapists e criar suas organizações
-- ============================================================================

DO $$
DECLARE
  v_full_therapist RECORD;
  v_org_level_1_id uuid;
  v_org_level_2_id uuid;
  v_position_full_id uuid;
BEGIN
  RAISE NOTICE 'FASE 2B: Iniciando migração de dados...';
  
  -- Para cada Full Therapist (usuário que NÃO é subordinado)
  FOR v_full_therapist IN 
    SELECT DISTINCT p.id, p.full_name
    FROM profiles p
    WHERE NOT EXISTS (
      SELECT 1 
      FROM therapist_assignments ta 
      WHERE ta.subordinate_id = p.id
    )
    -- Excluir contadores (eles terão tratamento especial depois)
    AND NOT EXISTS (
      SELECT 1 
      FROM user_roles ur 
      WHERE ur.user_id = p.id 
        AND ur.role = 'accountant'
    )
  LOOP
    RAISE NOTICE '  → Processando Full Therapist: % (%)', v_full_therapist.full_name, v_full_therapist.id;
    
    -- Criar Nível 1 (Full Therapist)
    INSERT INTO organization_levels (
      organization_id,
      level_number,
      level_name,
      description
    ) VALUES (
      v_full_therapist.id,
      1,
      'Terapeuta Full',
      'Nível superior - Proprietário da organização'
    ) RETURNING id INTO v_org_level_1_id;
    
    -- Criar Nível 2 (Subordinados)
    INSERT INTO organization_levels (
      organization_id,
      level_number,
      level_name,
      description
    ) VALUES (
      v_full_therapist.id,
      2,
      'Terapeuta Subordinado',
      'Terapeutas vinculados ao Full'
    ) RETURNING id INTO v_org_level_2_id;
    
    -- Criar posição do Full (raiz da árvore, sem parent)
    INSERT INTO organization_positions (
      level_id,
      parent_position_id,
      position_name
    ) VALUES (
      v_org_level_1_id,
      NULL,  -- raiz
      v_full_therapist.full_name || ' (Proprietário)'
    ) RETURNING id INTO v_position_full_id;
    
    -- Vincular Full à sua posição
    INSERT INTO user_positions (
      user_id,
      position_id
    ) VALUES (
      v_full_therapist.id,
      v_position_full_id
    );
    
    RAISE NOTICE '    ✓ Organização criada (2 níveis)';
    RAISE NOTICE '    ✓ Posição Full criada';
    RAISE NOTICE '    ✓ User vinculado à posição';
  END LOOP;
  
  RAISE NOTICE '✓ ETAPA 1 COMPLETA: Organizações criadas para Fulls';
END $$;

-- ============================================================================
-- ETAPA 2: Migrar subordinados para suas posições
-- ============================================================================

DO $$
DECLARE
  v_assignment RECORD;
  v_manager_position_id uuid;
  v_subordinate_position_id uuid;
  v_level_2_id uuid;
  v_subordinate_name text;
BEGIN
  RAISE NOTICE 'ETAPA 2: Migrando subordinados...';
  
  -- Para cada relacionamento manager → subordinate
  FOR v_assignment IN 
    SELECT 
      ta.manager_id,
      ta.subordinate_id,
      p_manager.full_name as manager_name,
      p_sub.full_name as subordinate_name
    FROM therapist_assignments ta
    INNER JOIN profiles p_manager ON p_manager.id = ta.manager_id
    INNER JOIN profiles p_sub ON p_sub.id = ta.subordinate_id
  LOOP
    RAISE NOTICE '  → Vinculando: % (sub) → % (manager)', 
      v_assignment.subordinate_name, v_assignment.manager_name;
    
    -- Buscar posição do manager (será o parent)
    SELECT up.position_id INTO v_manager_position_id
    FROM user_positions up
    WHERE up.user_id = v_assignment.manager_id
    LIMIT 1;
    
    IF v_manager_position_id IS NULL THEN
      RAISE WARNING '    ⚠ Manager % não tem posição! Pulando...', v_assignment.manager_id;
      CONTINUE;
    END IF;
    
    -- Buscar nível 2 da organização do manager
    SELECT ol.id INTO v_level_2_id
    FROM organization_levels ol
    WHERE ol.organization_id = v_assignment.manager_id
      AND ol.level_number = 2
    LIMIT 1;
    
    IF v_level_2_id IS NULL THEN
      RAISE WARNING '    ⚠ Nível 2 não encontrado para manager %! Pulando...', v_assignment.manager_id;
      CONTINUE;
    END IF;
    
    -- Criar posição do subordinado (filho do manager)
    INSERT INTO organization_positions (
      level_id,
      parent_position_id,
      position_name
    ) VALUES (
      v_level_2_id,
      v_manager_position_id,  -- pai = posição do manager
      v_assignment.subordinate_name || ' (Subordinado)'
    ) RETURNING id INTO v_subordinate_position_id;
    
    -- Vincular subordinado à posição
    INSERT INTO user_positions (
      user_id,
      position_id
    ) VALUES (
      v_assignment.subordinate_id,
      v_subordinate_position_id
    );
    
    RAISE NOTICE '    ✓ Posição subordinado criada e vinculada';
  END LOOP;
  
  RAISE NOTICE '✓ ETAPA 2 COMPLETA: Subordinados migrados';
END $$;

-- ============================================================================
-- ETAPA 3: Migrar permissões (subordinate_autonomy_settings → level_permission_sets)
-- ============================================================================

DO $$
DECLARE
  v_org RECORD;
  v_level_2_id uuid;
  v_domain text;
  v_autonomy_settings RECORD;
BEGIN
  RAISE NOTICE 'ETAPA 3: Migrando permissões por nível...';
  
  -- Para cada organização (Full Therapist)
  FOR v_org IN 
    SELECT DISTINCT organization_id
    FROM organization_levels
  LOOP
    RAISE NOTICE '  → Configurando permissões para org: %', v_org.organization_id;
    
    -- Buscar nível 2 (subordinados)
    SELECT id INTO v_level_2_id
    FROM organization_levels
    WHERE organization_id = v_org.organization_id
      AND level_number = 2
    LIMIT 1;
    
    IF v_level_2_id IS NULL THEN
      RAISE WARNING '    ⚠ Nível 2 não encontrado! Pulando...';
      CONTINUE;
    END IF;
    
    -- Buscar configurações de autonomia padrão dos subordinados desta org
    -- (pegamos o primeiro subordinado como referência para o nível)
    SELECT 
      sas.manages_own_patients,
      sas.has_financial_access,
      sas.nfse_emission_mode
    INTO v_autonomy_settings
    FROM subordinate_autonomy_settings sas
    WHERE sas.manager_id = v_org.organization_id
    LIMIT 1;
    
    -- Se não tem subordinados, criar config padrão restritiva
    IF NOT FOUND THEN
      v_autonomy_settings.manages_own_patients := false;
      v_autonomy_settings.has_financial_access := false;
      v_autonomy_settings.nfse_emission_mode := 'manager_company';
    END IF;
    
    -- Criar permissões para cada domínio no nível 2
    FOREACH v_domain IN ARRAY ARRAY['financial', 'administrative', 'clinical', 'media', 'general', 'charts', 'team']
    LOOP
      INSERT INTO level_permission_sets (
        level_id,
        domain,
        access_level,
        manages_own_patients,
        has_financial_access,
        nfse_emission_mode
      ) VALUES (
        v_level_2_id,
        v_domain,
        CASE 
          -- Financial: depende de has_financial_access
          WHEN v_domain = 'financial' THEN
            CASE WHEN v_autonomy_settings.has_financial_access THEN 'full'::text ELSE 'none'::text END
          -- Clinical: depende de manages_own_patients
          WHEN v_domain = 'clinical' THEN
            CASE WHEN v_autonomy_settings.manages_own_patients THEN 'full'::text ELSE 'read'::text END
          -- Administrative: geralmente read
          WHEN v_domain = 'administrative' THEN 'read'::text
          -- Team: none (subordinados não veem equipe)
          WHEN v_domain = 'team' THEN 'none'::text
          -- Demais: read padrão
          ELSE 'read'::text
        END,
        v_autonomy_settings.manages_own_patients,
        v_autonomy_settings.has_financial_access,
        v_autonomy_settings.nfse_emission_mode
      )
      ON CONFLICT (level_id, domain) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE '    ✓ Permissões configuradas para nível 2';
    
    -- Criar permissões para nível 1 (Full = acesso total)
    SELECT id INTO v_level_2_id
    FROM organization_levels
    WHERE organization_id = v_org.organization_id
      AND level_number = 1
    LIMIT 1;
    
    FOREACH v_domain IN ARRAY ARRAY['financial', 'administrative', 'clinical', 'media', 'general', 'charts', 'team']
    LOOP
      INSERT INTO level_permission_sets (
        level_id,
        domain,
        access_level,
        manages_own_patients,
        has_financial_access,
        nfse_emission_mode
      ) VALUES (
        v_level_2_id,
        v_domain,
        'full'::text,  -- Full tem acesso total
        false,  -- Full não gerencia "apenas próprios" (vê tudo)
        true,   -- Full tem acesso financeiro
        'own_company'  -- Full emite em própria empresa
      )
      ON CONFLICT (level_id, domain) DO NOTHING;
    END LOOP;
    
    RAISE NOTICE '    ✓ Permissões configuradas para nível 1 (Full)';
  END LOOP;
  
  RAISE NOTICE '✓ ETAPA 3 COMPLETA: Permissões migradas';
END $$;

-- ============================================================================
-- VALIDAÇÃO: Verificar integridade da migração
-- ============================================================================

DO $$
DECLARE
  v_count_fulls integer;
  v_count_subs integer;
  v_count_positions integer;
  v_count_user_positions integer;
  v_count_permissions integer;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'VALIDAÇÃO DA MIGRAÇÃO:';
  RAISE NOTICE '========================================';
  
  -- Contar Full Therapists
  SELECT COUNT(DISTINCT organization_id) INTO v_count_fulls
  FROM organization_levels;
  RAISE NOTICE '  Organizações criadas: %', v_count_fulls;
  
  -- Contar subordinados migrados
  SELECT COUNT(*) INTO v_count_subs
  FROM therapist_assignments;
  RAISE NOTICE '  Relacionamentos no sistema antigo: %', v_count_subs;
  
  -- Contar posições criadas
  SELECT COUNT(*) INTO v_count_positions
  FROM organization_positions;
  RAISE NOTICE '  Posições criadas: %', v_count_positions;
  
  -- Contar user_positions
  SELECT COUNT(*) INTO v_count_user_positions
  FROM user_positions;
  RAISE NOTICE '  Usuários vinculados: %', v_count_user_positions;
  
  -- Contar permissões
  SELECT COUNT(*) INTO v_count_permissions
  FROM level_permission_sets;
  RAISE NOTICE '  Permissões criadas: %', v_count_permissions;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ FASE 2B COMPLETA!';
  RAISE NOTICE '========================================';
END $$;

-- ============================================================================
-- FIM DA FASE 2B
-- ============================================================================

COMMENT ON SCHEMA public IS 'FASE 2 COMPLETA: Hierarquia funcional criada. Sistema antigo continua ativo.';