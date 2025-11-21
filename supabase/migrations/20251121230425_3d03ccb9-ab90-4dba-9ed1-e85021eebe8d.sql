-- ============================================================================
-- FASE 11.1: RLS Multi-Organização (Núcleo Clínico) - CORRIGIDO
-- ============================================================================
--
-- Objetivo: Criar/recriar Row Level Security para as 8 tabelas clínicas
-- usando organization_id como base de isolamento multi-empresa.
--
-- Tabelas cobertas:
--   1. patients
--   2. sessions
--   3. clinical_complaints
--   4. complaint_symptoms
--   5. complaint_medications
--   6. session_evaluations
--   7. patient_files
--   8. consent_submissions
--
-- ============================================================================

-- ============================================================================
-- 1. FUNÇÃO HELPER: current_user_organization()
-- ============================================================================

CREATE OR REPLACE FUNCTION public.current_user_organization()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.resolve_organization_for_user(auth.uid());
$$;

COMMENT ON FUNCTION public.current_user_organization() IS 
  'FASE 11.1: Retorna o organization_id do usuário autenticado. Usado em RLS policies.';

-- ============================================================================
-- 2. TABELA: patients
-- ============================================================================

-- Limpar policies antigas
DROP POLICY IF EXISTS "Admin can manage all patients" ON public.patients;
DROP POLICY IF EXISTS "Owner can delete own patients" ON public.patients;
DROP POLICY IF EXISTS "Owner can insert own patients" ON public.patients;
DROP POLICY IF EXISTS "Owner can update own patients" ON public.patients;
DROP POLICY IF EXISTS "Owner can view own patients" ON public.patients;
DROP POLICY IF EXISTS "Same org users can view patients" ON public.patients;
DROP POLICY IF EXISTS "patients_admin_all" ON public.patients;
DROP POLICY IF EXISTS "patients_org_select" ON public.patients;
DROP POLICY IF EXISTS "patients_owner_modify" ON public.patients;
DROP POLICY IF EXISTS "patients_owner_delete" ON public.patients;
DROP POLICY IF EXISTS "patients_org_insert" ON public.patients;

-- Ativar RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients FORCE ROW LEVEL SECURITY;

-- Criar policies novas
CREATE POLICY "patients_admin_all"
ON public.patients
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "patients_org_select"
ON public.patients
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL
  AND organization_id = public.current_user_organization()
);

CREATE POLICY "patients_org_insert"
ON public.patients
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = public.current_user_organization()
);

CREATE POLICY "patients_org_update"
ON public.patients
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid()
  AND organization_id = public.current_user_organization()
)
WITH CHECK (
  user_id = auth.uid()
  AND organization_id = public.current_user_organization()
);

CREATE POLICY "patients_org_delete"
ON public.patients
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  AND organization_id = public.current_user_organization()
);

-- ============================================================================
-- 3. TABELA: sessions
-- ============================================================================

-- Limpar policies antigas
DROP POLICY IF EXISTS "Accountants can view all sessions" ON public.sessions;
DROP POLICY IF EXISTS "Admin can manage all sessions" ON public.sessions;
DROP POLICY IF EXISTS "Owner can delete sessions of own patients" ON public.sessions;
DROP POLICY IF EXISTS "Owner can insert sessions for own patients" ON public.sessions;
DROP POLICY IF EXISTS "Owner can update sessions of own patients" ON public.sessions;
DROP POLICY IF EXISTS "Owner can view sessions of own patients" ON public.sessions;
DROP POLICY IF EXISTS "Same org users can view sessions" ON public.sessions;
DROP POLICY IF EXISTS "sessions_admin_all" ON public.sessions;
DROP POLICY IF EXISTS "sessions_org_select" ON public.sessions;
DROP POLICY IF EXISTS "sessions_org_modify" ON public.sessions;
DROP POLICY IF EXISTS "sessions_org_insert" ON public.sessions;
DROP POLICY IF EXISTS "sessions_org_update" ON public.sessions;
DROP POLICY IF EXISTS "sessions_org_delete" ON public.sessions;

-- Ativar RLS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions FORCE ROW LEVEL SECURITY;

-- Criar policies novas
CREATE POLICY "sessions_admin_all"
ON public.sessions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "sessions_org_select"
ON public.sessions
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL
  AND organization_id = public.current_user_organization()
);

CREATE POLICY "sessions_org_insert"
ON public.sessions
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = public.current_user_organization()
);

CREATE POLICY "sessions_org_update"
ON public.sessions
FOR UPDATE
TO authenticated
USING (
  organization_id = public.current_user_organization()
)
WITH CHECK (
  organization_id = public.current_user_organization()
);

CREATE POLICY "sessions_org_delete"
ON public.sessions
FOR DELETE
TO authenticated
USING (
  organization_id = public.current_user_organization()
);

-- ============================================================================
-- 4. TABELA: clinical_complaints
-- ============================================================================

-- Limpar policies antigas
DROP POLICY IF EXISTS "Admin can manage all clinical complaints" ON public.clinical_complaints;
DROP POLICY IF EXISTS "Owner can manage clinical complaints" ON public.clinical_complaints;
DROP POLICY IF EXISTS "Same org users can view clinical complaints" ON public.clinical_complaints;
DROP POLICY IF EXISTS "clinical_complaints_admin_all" ON public.clinical_complaints;
DROP POLICY IF EXISTS "clinical_complaints_org_select" ON public.clinical_complaints;
DROP POLICY IF EXISTS "clinical_complaints_org_modify" ON public.clinical_complaints;
DROP POLICY IF EXISTS "clinical_complaints_org_insert" ON public.clinical_complaints;
DROP POLICY IF EXISTS "clinical_complaints_org_update" ON public.clinical_complaints;
DROP POLICY IF EXISTS "clinical_complaints_org_delete" ON public.clinical_complaints;

-- Ativar RLS
ALTER TABLE public.clinical_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_complaints FORCE ROW LEVEL SECURITY;

-- Criar policies novas
CREATE POLICY "clinical_complaints_admin_all"
ON public.clinical_complaints
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "clinical_complaints_org_select"
ON public.clinical_complaints
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL
  AND organization_id = public.current_user_organization()
);

CREATE POLICY "clinical_complaints_org_insert"
ON public.clinical_complaints
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = public.current_user_organization()
);

CREATE POLICY "clinical_complaints_org_update"
ON public.clinical_complaints
FOR UPDATE
TO authenticated
USING (
  organization_id = public.current_user_organization()
)
WITH CHECK (
  organization_id = public.current_user_organization()
);

CREATE POLICY "clinical_complaints_org_delete"
ON public.clinical_complaints
FOR DELETE
TO authenticated
USING (
  organization_id = public.current_user_organization()
);

-- ============================================================================
-- 5. TABELA: complaint_symptoms
-- ============================================================================

-- Limpar policies antigas
DROP POLICY IF EXISTS "Admin can manage all complaint symptoms" ON public.complaint_symptoms;
DROP POLICY IF EXISTS "Owner can manage complaint symptoms" ON public.complaint_symptoms;
DROP POLICY IF EXISTS "Same org users can view complaint symptoms" ON public.complaint_symptoms;
DROP POLICY IF EXISTS "complaint_symptoms_admin_all" ON public.complaint_symptoms;
DROP POLICY IF EXISTS "complaint_symptoms_org_select" ON public.complaint_symptoms;
DROP POLICY IF EXISTS "complaint_symptoms_org_modify" ON public.complaint_symptoms;
DROP POLICY IF EXISTS "complaint_symptoms_org_insert" ON public.complaint_symptoms;
DROP POLICY IF EXISTS "complaint_symptoms_org_update" ON public.complaint_symptoms;
DROP POLICY IF EXISTS "complaint_symptoms_org_delete" ON public.complaint_symptoms;

-- Ativar RLS
ALTER TABLE public.complaint_symptoms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_symptoms FORCE ROW LEVEL SECURITY;

-- Criar policies novas
CREATE POLICY "complaint_symptoms_admin_all"
ON public.complaint_symptoms
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "complaint_symptoms_org_select"
ON public.complaint_symptoms
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL
  AND organization_id = public.current_user_organization()
);

CREATE POLICY "complaint_symptoms_org_insert"
ON public.complaint_symptoms
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = public.current_user_organization()
);

CREATE POLICY "complaint_symptoms_org_update"
ON public.complaint_symptoms
FOR UPDATE
TO authenticated
USING (
  organization_id = public.current_user_organization()
)
WITH CHECK (
  organization_id = public.current_user_organization()
);

CREATE POLICY "complaint_symptoms_org_delete"
ON public.complaint_symptoms
FOR DELETE
TO authenticated
USING (
  organization_id = public.current_user_organization()
);

-- ============================================================================
-- 6. TABELA: complaint_medications
-- ============================================================================

-- Limpar policies antigas
DROP POLICY IF EXISTS "Admin can manage all complaint medications" ON public.complaint_medications;
DROP POLICY IF EXISTS "Owner can manage complaint medications" ON public.complaint_medications;
DROP POLICY IF EXISTS "Same org users can view complaint medications" ON public.complaint_medications;
DROP POLICY IF EXISTS "complaint_medications_admin_all" ON public.complaint_medications;
DROP POLICY IF EXISTS "complaint_medications_org_select" ON public.complaint_medications;
DROP POLICY IF EXISTS "complaint_medications_org_modify" ON public.complaint_medications;
DROP POLICY IF EXISTS "complaint_medications_org_insert" ON public.complaint_medications;
DROP POLICY IF EXISTS "complaint_medications_org_update" ON public.complaint_medications;
DROP POLICY IF EXISTS "complaint_medications_org_delete" ON public.complaint_medications;

-- Ativar RLS
ALTER TABLE public.complaint_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_medications FORCE ROW LEVEL SECURITY;

-- Criar policies novas
CREATE POLICY "complaint_medications_admin_all"
ON public.complaint_medications
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "complaint_medications_org_select"
ON public.complaint_medications
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL
  AND organization_id = public.current_user_organization()
);

CREATE POLICY "complaint_medications_org_insert"
ON public.complaint_medications
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = public.current_user_organization()
);

CREATE POLICY "complaint_medications_org_update"
ON public.complaint_medications
FOR UPDATE
TO authenticated
USING (
  organization_id = public.current_user_organization()
)
WITH CHECK (
  organization_id = public.current_user_organization()
);

CREATE POLICY "complaint_medications_org_delete"
ON public.complaint_medications
FOR DELETE
TO authenticated
USING (
  organization_id = public.current_user_organization()
);

-- ============================================================================
-- 7. TABELA: session_evaluations
-- ============================================================================

-- Limpar policies antigas
DROP POLICY IF EXISTS "Admin can manage all session evaluations" ON public.session_evaluations;
DROP POLICY IF EXISTS "Owner can manage session evaluations" ON public.session_evaluations;
DROP POLICY IF EXISTS "Same org users can view session evaluations" ON public.session_evaluations;
DROP POLICY IF EXISTS "session_evaluations_admin_all" ON public.session_evaluations;
DROP POLICY IF EXISTS "session_evaluations_org_select" ON public.session_evaluations;
DROP POLICY IF EXISTS "session_evaluations_org_modify" ON public.session_evaluations;
DROP POLICY IF EXISTS "session_evaluations_org_insert" ON public.session_evaluations;
DROP POLICY IF EXISTS "session_evaluations_org_update" ON public.session_evaluations;
DROP POLICY IF EXISTS "session_evaluations_org_delete" ON public.session_evaluations;

-- Ativar RLS
ALTER TABLE public.session_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.session_evaluations FORCE ROW LEVEL SECURITY;

-- Criar policies novas
CREATE POLICY "session_evaluations_admin_all"
ON public.session_evaluations
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "session_evaluations_org_select"
ON public.session_evaluations
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL
  AND organization_id = public.current_user_organization()
);

CREATE POLICY "session_evaluations_org_insert"
ON public.session_evaluations
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = public.current_user_organization()
);

CREATE POLICY "session_evaluations_org_update"
ON public.session_evaluations
FOR UPDATE
TO authenticated
USING (
  organization_id = public.current_user_organization()
)
WITH CHECK (
  organization_id = public.current_user_organization()
);

CREATE POLICY "session_evaluations_org_delete"
ON public.session_evaluations
FOR DELETE
TO authenticated
USING (
  organization_id = public.current_user_organization()
);

-- ============================================================================
-- 8. TABELA: patient_files
-- ============================================================================

-- Limpar policies antigas
DROP POLICY IF EXISTS "Admin can manage all patient files" ON public.patient_files;
DROP POLICY IF EXISTS "Owner can manage patient files" ON public.patient_files;
DROP POLICY IF EXISTS "Same org users can view patient files" ON public.patient_files;
DROP POLICY IF EXISTS "patient_files_admin_all" ON public.patient_files;
DROP POLICY IF EXISTS "patient_files_org_select" ON public.patient_files;
DROP POLICY IF EXISTS "patient_files_org_modify" ON public.patient_files;
DROP POLICY IF EXISTS "patient_files_org_insert" ON public.patient_files;
DROP POLICY IF EXISTS "patient_files_org_update" ON public.patient_files;
DROP POLICY IF EXISTS "patient_files_org_delete" ON public.patient_files;

-- Ativar RLS
ALTER TABLE public.patient_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_files FORCE ROW LEVEL SECURITY;

-- Criar policies novas
CREATE POLICY "patient_files_admin_all"
ON public.patient_files
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "patient_files_org_select"
ON public.patient_files
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL
  AND organization_id = public.current_user_organization()
);

CREATE POLICY "patient_files_org_insert"
ON public.patient_files
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = public.current_user_organization()
);

CREATE POLICY "patient_files_org_update"
ON public.patient_files
FOR UPDATE
TO authenticated
USING (
  organization_id = public.current_user_organization()
)
WITH CHECK (
  organization_id = public.current_user_organization()
);

CREATE POLICY "patient_files_org_delete"
ON public.patient_files
FOR DELETE
TO authenticated
USING (
  organization_id = public.current_user_organization()
);

-- ============================================================================
-- 9. TABELA: consent_submissions
-- ============================================================================

-- Limpar policies antigas
DROP POLICY IF EXISTS "Admin can manage all consent submissions" ON public.consent_submissions;
DROP POLICY IF EXISTS "Owner can manage consent submissions" ON public.consent_submissions;
DROP POLICY IF EXISTS "Same org users can view consent submissions" ON public.consent_submissions;
DROP POLICY IF EXISTS "consent_submissions_admin_all" ON public.consent_submissions;
DROP POLICY IF EXISTS "consent_submissions_org_select" ON public.consent_submissions;
DROP POLICY IF EXISTS "consent_submissions_org_modify" ON public.consent_submissions;
DROP POLICY IF EXISTS "consent_submissions_org_insert" ON public.consent_submissions;
DROP POLICY IF EXISTS "consent_submissions_org_update" ON public.consent_submissions;
DROP POLICY IF EXISTS "consent_submissions_org_delete" ON public.consent_submissions;

-- Ativar RLS
ALTER TABLE public.consent_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_submissions FORCE ROW LEVEL SECURITY;

-- Criar policies novas
CREATE POLICY "consent_submissions_admin_all"
ON public.consent_submissions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "consent_submissions_org_select"
ON public.consent_submissions
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL
  AND organization_id = public.current_user_organization()
);

CREATE POLICY "consent_submissions_org_insert"
ON public.consent_submissions
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = public.current_user_organization()
);

CREATE POLICY "consent_submissions_org_update"
ON public.consent_submissions
FOR UPDATE
TO authenticated
USING (
  organization_id = public.current_user_organization()
)
WITH CHECK (
  organization_id = public.current_user_organization()
);

CREATE POLICY "consent_submissions_org_delete"
ON public.consent_submissions
FOR DELETE
TO authenticated
USING (
  organization_id = public.current_user_organization()
);

-- ============================================================================
-- FASE 11.1 COMPLETA
-- ============================================================================
-- 
-- ✅ Função current_user_organization() criada
-- ✅ RLS ativado e forçado em 8 tabelas clínicas
-- ✅ 37 policies criadas (padronizadas por organization_id)
-- ✅ Policies antigas removidas
-- 
-- Próxima fase: FASE 11.2 - RLS Multi-Org (NFSe e Financeiro)
-- ============================================================================