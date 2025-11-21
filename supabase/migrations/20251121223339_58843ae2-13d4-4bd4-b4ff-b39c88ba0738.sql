-- ============================================================================
-- FASE 10.8: Backend Organization Propagation Layer
-- Objetivo: Garantir organization_id correto automaticamente em todos inserts
-- ============================================================================

-- 1. Adicionar coluna organization_id em todas as tabelas que ainda não têm
-- ============================================================================

-- patients
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- sessions
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- nfse_issued
ALTER TABLE public.nfse_issued 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- nfse_payments
ALTER TABLE public.nfse_payments 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- payment_allocations
ALTER TABLE public.payment_allocations 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- nfse_config
ALTER TABLE public.nfse_config 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- nfse_certificates
ALTER TABLE public.nfse_certificates 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- invoice_logs
ALTER TABLE public.invoice_logs 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- patient_files
ALTER TABLE public.patient_files 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- clinical_complaints
ALTER TABLE public.clinical_complaints 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- complaint_symptoms
ALTER TABLE public.complaint_symptoms 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- complaint_medications
ALTER TABLE public.complaint_medications 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- session_evaluations
ALTER TABLE public.session_evaluations 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- therapist_notifications
ALTER TABLE public.therapist_notifications 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- system_notifications
ALTER TABLE public.system_notifications 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- schedule_blocks
ALTER TABLE public.schedule_blocks 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- consent_submissions
ALTER TABLE public.consent_submissions 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- 2. Criar função de resolução de organização
-- ============================================================================

CREATE OR REPLACE FUNCTION public.resolve_organization_for_user(_user_id UUID)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id UUID;
BEGIN
  -- Tentativa 1: profiles.organization_id
  SELECT organization_id INTO v_org_id
  FROM public.profiles
  WHERE id = _user_id
  LIMIT 1;
  
  IF v_org_id IS NOT NULL THEN
    RAISE NOTICE '[10.8] Org resolved from profiles: %', v_org_id;
    RETURN v_org_id;
  END IF;
  
  -- Tentativa 2: organization_owners (usuário é dono)
  SELECT organization_id INTO v_org_id
  FROM public.organization_owners
  WHERE user_id = _user_id AND is_primary = true
  LIMIT 1;
  
  IF v_org_id IS NOT NULL THEN
    RAISE NOTICE '[10.8] Org resolved from organization_owners: %', v_org_id;
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
    RAISE NOTICE '[10.8] Org resolved from user_positions: %', v_org_id;
    RETURN v_org_id;
  END IF;
  
  -- Fallback: NULL
  RAISE NOTICE '[10.8] Org NOT resolved for user: %', _user_id;
  RETURN NULL;
END;
$$;

-- 3. Criar trigger function para propagação automática (user_id direto)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auto_set_organization_from_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- INSERT: Se organization_id está NULL, resolver automaticamente
  IF TG_OP = 'INSERT' THEN
    IF NEW.organization_id IS NULL AND NEW.user_id IS NOT NULL THEN
      NEW.organization_id := resolve_organization_for_user(NEW.user_id);
      RAISE NOTICE '[10.8] Org propagated on INSERT to %.%: %', TG_TABLE_SCHEMA, TG_TABLE_NAME, NEW.organization_id;
    END IF;
  END IF;
  
  -- UPDATE: Impedir mudança de organization_id
  IF TG_OP = 'UPDATE' THEN
    IF OLD.organization_id IS NOT NULL AND NEW.organization_id != OLD.organization_id THEN
      RAISE EXCEPTION '[10.8] Cannot change organization_id from % to % in %.%', 
        OLD.organization_id, NEW.organization_id, TG_TABLE_SCHEMA, TG_TABLE_NAME;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 4. Criar trigger function para propagação via patient_id
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auto_set_organization_from_patient()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
        RAISE NOTICE '[10.8] Org propagated via patient on INSERT to %.%: %', TG_TABLE_SCHEMA, TG_TABLE_NAME, NEW.organization_id;
      END IF;
    END IF;
  END IF;
  
  -- UPDATE: Impedir mudança de organization_id
  IF TG_OP = 'UPDATE' THEN
    IF OLD.organization_id IS NOT NULL AND NEW.organization_id != OLD.organization_id THEN
      RAISE EXCEPTION '[10.8] Cannot change organization_id from % to % in %.%', 
        OLD.organization_id, NEW.organization_id, TG_TABLE_SCHEMA, TG_TABLE_NAME;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 5. Criar trigger function para propagação via complaint_id
-- ============================================================================

CREATE OR REPLACE FUNCTION public.auto_set_organization_from_complaint()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
        RAISE NOTICE '[10.8] Org propagated via complaint on INSERT to %.%: %', TG_TABLE_SCHEMA, TG_TABLE_NAME, NEW.organization_id;
      END IF;
    END IF;
  END IF;
  
  -- UPDATE: Impedir mudança de organization_id
  IF TG_OP = 'UPDATE' THEN
    IF OLD.organization_id IS NOT NULL AND NEW.organization_id != OLD.organization_id THEN
      RAISE EXCEPTION '[10.8] Cannot change organization_id from % to % in %.%', 
        OLD.organization_id, NEW.organization_id, TG_TABLE_SCHEMA, TG_TABLE_NAME;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Aplicar triggers em todas as tabelas
-- ============================================================================

-- Tabelas com user_id direto
DROP TRIGGER IF EXISTS trg_auto_org_patients ON public.patients;
CREATE TRIGGER trg_auto_org_patients
  BEFORE INSERT OR UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_from_user();

DROP TRIGGER IF EXISTS trg_auto_org_nfse_config ON public.nfse_config;
CREATE TRIGGER trg_auto_org_nfse_config
  BEFORE INSERT OR UPDATE ON public.nfse_config
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_from_user();

DROP TRIGGER IF EXISTS trg_auto_org_nfse_certificates ON public.nfse_certificates;
CREATE TRIGGER trg_auto_org_nfse_certificates
  BEFORE INSERT OR UPDATE ON public.nfse_certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_from_user();

DROP TRIGGER IF EXISTS trg_auto_org_invoice_logs ON public.invoice_logs;
CREATE TRIGGER trg_auto_org_invoice_logs
  BEFORE INSERT OR UPDATE ON public.invoice_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_from_user();

DROP TRIGGER IF EXISTS trg_auto_org_nfse_payments ON public.nfse_payments;
CREATE TRIGGER trg_auto_org_nfse_payments
  BEFORE INSERT OR UPDATE ON public.nfse_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_from_user();

DROP TRIGGER IF EXISTS trg_auto_org_nfse_issued ON public.nfse_issued;
CREATE TRIGGER trg_auto_org_nfse_issued
  BEFORE INSERT OR UPDATE ON public.nfse_issued
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_from_user();

DROP TRIGGER IF EXISTS trg_auto_org_schedule_blocks ON public.schedule_blocks;
CREATE TRIGGER trg_auto_org_schedule_blocks
  BEFORE INSERT OR UPDATE ON public.schedule_blocks
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_from_user();

DROP TRIGGER IF EXISTS trg_auto_org_appointments ON public.appointments;
CREATE TRIGGER trg_auto_org_appointments
  BEFORE INSERT OR UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_from_user();

DROP TRIGGER IF EXISTS trg_auto_org_system_notifications ON public.system_notifications;
CREATE TRIGGER trg_auto_org_system_notifications
  BEFORE INSERT OR UPDATE ON public.system_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_from_user();

DROP TRIGGER IF EXISTS trg_auto_org_therapist_notifications ON public.therapist_notifications;
CREATE TRIGGER trg_auto_org_therapist_notifications
  BEFORE INSERT OR UPDATE ON public.therapist_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_from_user();

-- Tabelas ligadas a pacientes
DROP TRIGGER IF EXISTS trg_auto_org_sessions ON public.sessions;
CREATE TRIGGER trg_auto_org_sessions
  BEFORE INSERT OR UPDATE ON public.sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_from_patient();

DROP TRIGGER IF EXISTS trg_auto_org_patient_files ON public.patient_files;
CREATE TRIGGER trg_auto_org_patient_files
  BEFORE INSERT OR UPDATE ON public.patient_files
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_from_patient();

DROP TRIGGER IF EXISTS trg_auto_org_clinical_complaints ON public.clinical_complaints;
CREATE TRIGGER trg_auto_org_clinical_complaints
  BEFORE INSERT OR UPDATE ON public.clinical_complaints
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_from_patient();

DROP TRIGGER IF EXISTS trg_auto_org_session_evaluations ON public.session_evaluations;
CREATE TRIGGER trg_auto_org_session_evaluations
  BEFORE INSERT OR UPDATE ON public.session_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_from_patient();

DROP TRIGGER IF EXISTS trg_auto_org_consent_submissions ON public.consent_submissions;
CREATE TRIGGER trg_auto_org_consent_submissions
  BEFORE INSERT OR UPDATE ON public.consent_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_from_patient();

-- Tabelas ligadas a complaints
DROP TRIGGER IF EXISTS trg_auto_org_complaint_symptoms ON public.complaint_symptoms;
CREATE TRIGGER trg_auto_org_complaint_symptoms
  BEFORE INSERT OR UPDATE ON public.complaint_symptoms
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_from_complaint();

DROP TRIGGER IF EXISTS trg_auto_org_complaint_medications ON public.complaint_medications;
CREATE TRIGGER trg_auto_org_complaint_medications
  BEFORE INSERT OR UPDATE ON public.complaint_medications
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_from_complaint();

-- payment_allocations (precisa de lógica especial via nfse_id)
CREATE OR REPLACE FUNCTION public.auto_set_organization_from_nfse()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
        RAISE NOTICE '[10.8] Org propagated via nfse on INSERT to %.%: %', TG_TABLE_SCHEMA, TG_TABLE_NAME, NEW.organization_id;
      END IF;
    END IF;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    IF OLD.organization_id IS NOT NULL AND NEW.organization_id != OLD.organization_id THEN
      RAISE EXCEPTION '[10.8] Cannot change organization_id from % to % in %.%', 
        OLD.organization_id, NEW.organization_id, TG_TABLE_SCHEMA, TG_TABLE_NAME;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_org_payment_allocations ON public.payment_allocations;
CREATE TRIGGER trg_auto_org_payment_allocations
  BEFORE INSERT OR UPDATE ON public.payment_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_from_nfse();

-- 7. Criar índices para performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_patients_organization_id ON public.patients(organization_id);
CREATE INDEX IF NOT EXISTS idx_sessions_organization_id ON public.sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_nfse_issued_organization_id ON public.nfse_issued(organization_id);
CREATE INDEX IF NOT EXISTS idx_nfse_payments_organization_id ON public.nfse_payments(organization_id);
CREATE INDEX IF NOT EXISTS idx_patient_files_organization_id ON public.patient_files(organization_id);
CREATE INDEX IF NOT EXISTS idx_clinical_complaints_organization_id ON public.clinical_complaints(organization_id);
CREATE INDEX IF NOT EXISTS idx_system_notifications_organization_id ON public.system_notifications(organization_id);

-- ============================================================================
-- FIM FASE 10.8: Backend Organization Propagation Layer
-- ============================================================================