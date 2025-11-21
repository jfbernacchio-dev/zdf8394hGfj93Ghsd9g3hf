-- ============================================================================
-- FASE 10.9: Remover RAISE NOTICE temporários da FASE 10.8
-- ============================================================================
-- Remove os logs temporários mantendo apenas a lógica dos triggers

-- ============================================================================
-- 1. Atualizar resolve_organization_for_user (remover RAISE NOTICE)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.resolve_organization_for_user(_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_org_id UUID;
BEGIN
  -- Tentativa 1: profiles.organization_id
  SELECT organization_id INTO v_org_id
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1;
  
  IF v_org_id IS NOT NULL THEN
    RETURN v_org_id;
  END IF;
  
  -- Tentativa 2: organization_owners (usuário é dono)
  SELECT organization_id INTO v_org_id
  FROM public.organization_owners
  WHERE user_id = _user_id AND is_primary = true
  LIMIT 1;
  
  IF v_org_id IS NOT NULL THEN
    RETURN v_org_id;
  END IF;
  
  -- Tentativa 3: user_positions → organization_positions → organization_levels
  SELECT ol.organization_id INTO v_org_id
  FROM public.user_positions up
  INNER JOIN public.organization_positions op ON op.id = up.position_id
  INNER JOIN public.organization_levels ol ON ol.id = op.level_id
  WHERE up.user_id = _user_id
  LIMIT 1;
  
  IF v_org_id IS NOT NULL THEN
    RETURN v_org_id;
  END IF;
  
  -- Fallback: NULL
  RETURN NULL;
END;
$function$;

-- ============================================================================
-- 2. Atualizar auto_set_organization_from_user (remover RAISE NOTICE)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.auto_set_organization_from_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- INSERT: Se organization_id está NULL, resolver automaticamente
  IF TG_OP = 'INSERT' THEN
    IF NEW.organization_id IS NULL AND NEW.user_id IS NOT NULL THEN
      NEW.organization_id := resolve_organization_for_user(NEW.user_id);
    END IF;
  END IF;
  
  -- UPDATE: Impedir mudança de organization_id
  IF TG_OP = 'UPDATE' THEN
    IF OLD.organization_id IS NOT NULL AND NEW.organization_id != OLD.organization_id THEN
      RAISE EXCEPTION 'Cannot change organization_id from % to % in %.%', 
        OLD.organization_id, NEW.organization_id, TG_TABLE_SCHEMA, TG_TABLE_NAME;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- ============================================================================
-- 3. Atualizar auto_set_organization_from_patient (remover RAISE NOTICE)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.auto_set_organization_from_patient()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_patient_user_id UUID;
BEGIN
  -- INSERT: Se organization_id está NULL, resolver via patient
  IF TG_OP = 'INSERT' THEN
    IF NEW.organization_id IS NULL AND NEW.patient_id IS NOT NULL THEN
      SELECT user_id INTO v_patient_user_id
      FROM public.patients
      WHERE id = NEW.patient_id;
      
      IF v_patient_user_id IS NOT NULL THEN
        NEW.organization_id := resolve_organization_for_user(v_patient_user_id);
      END IF;
    END IF;
  END IF;
  
  -- UPDATE: Impedir mudança de organization_id
  IF TG_OP = 'UPDATE' THEN
    IF OLD.organization_id IS NOT NULL AND NEW.organization_id != OLD.organization_id THEN
      RAISE EXCEPTION 'Cannot change organization_id from % to % in %.%', 
        OLD.organization_id, NEW.organization_id, TG_TABLE_SCHEMA, TG_TABLE_NAME;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- ============================================================================
-- 4. Atualizar auto_set_organization_from_complaint (remover RAISE NOTICE)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.auto_set_organization_from_complaint()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_patient_user_id UUID;
BEGIN
  -- INSERT: Se organization_id está NULL, resolver via complaint → patient
  IF TG_OP = 'INSERT' THEN
    IF NEW.organization_id IS NULL AND NEW.complaint_id IS NOT NULL THEN
      SELECT p.user_id INTO v_patient_user_id
      FROM public.clinical_complaints cc
      INNER JOIN public.patients p ON p.id = cc.patient_id
      WHERE cc.id = NEW.complaint_id;
      
      IF v_patient_user_id IS NOT NULL THEN
        NEW.organization_id := resolve_organization_for_user(v_patient_user_id);
      END IF;
    END IF;
  END IF;
  
  -- UPDATE: Impedir mudança de organization_id
  IF TG_OP = 'UPDATE' THEN
    IF OLD.organization_id IS NOT NULL AND NEW.organization_id != OLD.organization_id THEN
      RAISE EXCEPTION 'Cannot change organization_id from % to % in %.%', 
        OLD.organization_id, NEW.organization_id, TG_TABLE_SCHEMA, TG_TABLE_NAME;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- ============================================================================
-- 5. Atualizar auto_set_organization_from_nfse (remover RAISE NOTICE)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.auto_set_organization_from_nfse()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_nfse_user_id UUID;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.organization_id IS NULL AND NEW.nfse_id IS NOT NULL THEN
      SELECT user_id INTO v_nfse_user_id
      FROM public.nfse_issued
      WHERE id = NEW.nfse_id;
      
      IF v_nfse_user_id IS NOT NULL THEN
        NEW.organization_id := resolve_organization_for_user(v_nfse_user_id);
      END IF;
    END IF;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    IF OLD.organization_id IS NOT NULL AND NEW.organization_id != OLD.organization_id THEN
      RAISE EXCEPTION 'Cannot change organization_id from % to % in %.%', 
        OLD.organization_id, NEW.organization_id, TG_TABLE_SCHEMA, TG_TABLE_NAME;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- ============================================================================
-- COMENTÁRIO FINAL
-- ============================================================================
COMMENT ON FUNCTION public.resolve_organization_for_user IS 
  'FASE 10.9: Resolve organization_id para user sem logs de debug';

COMMENT ON FUNCTION public.auto_set_organization_from_user IS 
  'FASE 10.9: Auto-define organization_id via user_id sem logs';

COMMENT ON FUNCTION public.auto_set_organization_from_patient IS 
  'FASE 10.9: Auto-define organization_id via patient_id sem logs';

COMMENT ON FUNCTION public.auto_set_organization_from_complaint IS 
  'FASE 10.9: Auto-define organization_id via complaint_id sem logs';

COMMENT ON FUNCTION public.auto_set_organization_from_nfse IS 
  'FASE 10.9: Auto-define organization_id via nfse_id sem logs';