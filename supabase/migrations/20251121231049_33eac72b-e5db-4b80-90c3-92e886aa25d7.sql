-- FASE 11.2: RLS Multi-Org (NFSe & Financeiro)
-- =====================================================
-- Ativar RLS e remover policies antigas em todas as tabelas financeiras/NFSe

-- 1. nfse_issued
ALTER TABLE public.nfse_issued ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfse_issued FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nfse_issued_admin_all" ON public.nfse_issued;
DROP POLICY IF EXISTS "nfse_issued_org_select" ON public.nfse_issued;
DROP POLICY IF EXISTS "nfse_issued_org_insert" ON public.nfse_issued;
DROP POLICY IF EXISTS "nfse_issued_org_update" ON public.nfse_issued;
DROP POLICY IF EXISTS "nfse_issued_org_delete" ON public.nfse_issued;
DROP POLICY IF EXISTS "Admin can manage all nfse_issued" ON public.nfse_issued;
DROP POLICY IF EXISTS "Same org can view nfse_issued" ON public.nfse_issued;
DROP POLICY IF EXISTS "Owner can manage own nfse_issued" ON public.nfse_issued;

-- 2. nfse_payments
ALTER TABLE public.nfse_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfse_payments FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nfse_payments_admin_all" ON public.nfse_payments;
DROP POLICY IF EXISTS "nfse_payments_org_select" ON public.nfse_payments;
DROP POLICY IF EXISTS "nfse_payments_org_insert" ON public.nfse_payments;
DROP POLICY IF EXISTS "nfse_payments_org_update" ON public.nfse_payments;
DROP POLICY IF EXISTS "nfse_payments_org_delete" ON public.nfse_payments;
DROP POLICY IF EXISTS "Admin can manage all payments" ON public.nfse_payments;
DROP POLICY IF EXISTS "Owner can manage own payments" ON public.nfse_payments;
DROP POLICY IF EXISTS "Same org users can view payments" ON public.nfse_payments;
DROP POLICY IF EXISTS "Accountants can view same org payments" ON public.nfse_payments;

-- 3. payment_allocations
ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_allocations FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payment_allocations_admin_all" ON public.payment_allocations;
DROP POLICY IF EXISTS "payment_allocations_org_select" ON public.payment_allocations;
DROP POLICY IF EXISTS "payment_allocations_org_insert" ON public.payment_allocations;
DROP POLICY IF EXISTS "payment_allocations_org_update" ON public.payment_allocations;
DROP POLICY IF EXISTS "payment_allocations_org_delete" ON public.payment_allocations;

-- 4. nfse_config
ALTER TABLE public.nfse_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfse_config FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nfse_config_admin_all" ON public.nfse_config;
DROP POLICY IF EXISTS "nfse_config_org_select" ON public.nfse_config;
DROP POLICY IF EXISTS "nfse_config_owner_insert" ON public.nfse_config;
DROP POLICY IF EXISTS "nfse_config_owner_update" ON public.nfse_config;
DROP POLICY IF EXISTS "nfse_config_owner_delete" ON public.nfse_config;
DROP POLICY IF EXISTS "Admin can manage all nfse_config" ON public.nfse_config;
DROP POLICY IF EXISTS "Owner can manage own nfse_config" ON public.nfse_config;
DROP POLICY IF EXISTS "Accountants can manage same org config" ON public.nfse_config;

-- 5. nfse_certificates
ALTER TABLE public.nfse_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfse_certificates FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "nfse_certificates_admin_all" ON public.nfse_certificates;
DROP POLICY IF EXISTS "nfse_certificates_org_select" ON public.nfse_certificates;
DROP POLICY IF EXISTS "nfse_certificates_owner_insert" ON public.nfse_certificates;
DROP POLICY IF EXISTS "nfse_certificates_owner_update" ON public.nfse_certificates;
DROP POLICY IF EXISTS "nfse_certificates_owner_delete" ON public.nfse_certificates;
DROP POLICY IF EXISTS "Admin can manage all certificates" ON public.nfse_certificates;
DROP POLICY IF EXISTS "Owner can manage own certificates" ON public.nfse_certificates;
DROP POLICY IF EXISTS "Accountants can manage same org certificates" ON public.nfse_certificates;

-- 6. invoice_logs
ALTER TABLE public.invoice_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_logs FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "invoice_logs_admin_all" ON public.invoice_logs;
DROP POLICY IF EXISTS "invoice_logs_org_select" ON public.invoice_logs;
DROP POLICY IF EXISTS "invoice_logs_org_insert" ON public.invoice_logs;
DROP POLICY IF EXISTS "Admin can manage all invoice logs" ON public.invoice_logs;
DROP POLICY IF EXISTS "Owner can manage own invoice logs" ON public.invoice_logs;
DROP POLICY IF EXISTS "Same org can view invoice logs" ON public.invoice_logs;

-- 7. accountant_requests
ALTER TABLE public.accountant_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accountant_requests FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "accountant_requests_admin_all" ON public.accountant_requests;
DROP POLICY IF EXISTS "accountant_requests_therapist_select" ON public.accountant_requests;
DROP POLICY IF EXISTS "accountant_requests_therapist_insert" ON public.accountant_requests;
DROP POLICY IF EXISTS "accountant_requests_therapist_update" ON public.accountant_requests;
DROP POLICY IF EXISTS "accountant_requests_accountant_select" ON public.accountant_requests;
DROP POLICY IF EXISTS "accountant_requests_accountant_update" ON public.accountant_requests;
DROP POLICY IF EXISTS "Admin can manage all accountant requests" ON public.accountant_requests;
DROP POLICY IF EXISTS "Therapist can create own requests" ON public.accountant_requests;
DROP POLICY IF EXISTS "Therapist can view own requests" ON public.accountant_requests;
DROP POLICY IF EXISTS "Accountant can view requests to them" ON public.accountant_requests;
DROP POLICY IF EXISTS "Accountant can update requests to them" ON public.accountant_requests;
DROP POLICY IF EXISTS "Same org can view accountant requests" ON public.accountant_requests;

-- 8. accountant_therapist_assignments
ALTER TABLE public.accountant_therapist_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accountant_therapist_assignments FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "assignments_admin_all" ON public.accountant_therapist_assignments;
DROP POLICY IF EXISTS "assignments_therapist_select" ON public.accountant_therapist_assignments;
DROP POLICY IF EXISTS "assignments_accountant_select" ON public.accountant_therapist_assignments;
DROP POLICY IF EXISTS "assignments_therapist_insert" ON public.accountant_therapist_assignments;
DROP POLICY IF EXISTS "assignments_therapist_update" ON public.accountant_therapist_assignments;
DROP POLICY IF EXISTS "assignments_therapist_delete" ON public.accountant_therapist_assignments;
DROP POLICY IF EXISTS "assignments_accountant_update" ON public.accountant_therapist_assignments;
DROP POLICY IF EXISTS "assignments_accountant_delete" ON public.accountant_therapist_assignments;
DROP POLICY IF EXISTS "Admin can manage all accountant assignments" ON public.accountant_therapist_assignments;
DROP POLICY IF EXISTS "Same org can view accountant assignments" ON public.accountant_therapist_assignments;
DROP POLICY IF EXISTS "Therapist can manage own accountant assignment" ON public.accountant_therapist_assignments;
DROP POLICY IF EXISTS "Therapist can view own accountant" ON public.accountant_therapist_assignments;
DROP POLICY IF EXISTS "Accountant can view own assignments" ON public.accountant_therapist_assignments;

-- =====================================================
-- CRIAR POLICIES NOVAS - PADRÃO MULTI-ORG
-- =====================================================

-- 1. nfse_issued
CREATE POLICY "nfse_issued_admin_all"
ON public.nfse_issued
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "nfse_issued_org_select"
ON public.nfse_issued
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL
  AND organization_id = public.current_user_organization()
);

CREATE POLICY "nfse_issued_org_insert"
ON public.nfse_issued
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = public.current_user_organization()
);

CREATE POLICY "nfse_issued_org_update"
ON public.nfse_issued
FOR UPDATE
TO authenticated
USING (
  organization_id = public.current_user_organization()
)
WITH CHECK (
  organization_id = public.current_user_organization()
);

CREATE POLICY "nfse_issued_org_delete"
ON public.nfse_issued
FOR DELETE
TO authenticated
USING (
  organization_id = public.current_user_organization()
);

-- 2. nfse_payments
CREATE POLICY "nfse_payments_admin_all"
ON public.nfse_payments
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "nfse_payments_org_select"
ON public.nfse_payments
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL
  AND organization_id = public.current_user_organization()
);

CREATE POLICY "nfse_payments_org_insert"
ON public.nfse_payments
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = public.current_user_organization()
);

CREATE POLICY "nfse_payments_org_update"
ON public.nfse_payments
FOR UPDATE
TO authenticated
USING (
  organization_id = public.current_user_organization()
)
WITH CHECK (
  organization_id = public.current_user_organization()
);

CREATE POLICY "nfse_payments_org_delete"
ON public.nfse_payments
FOR DELETE
TO authenticated
USING (
  organization_id = public.current_user_organization()
);

-- 3. payment_allocations
CREATE POLICY "payment_allocations_admin_all"
ON public.payment_allocations
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "payment_allocations_org_select"
ON public.payment_allocations
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL
  AND organization_id = public.current_user_organization()
);

CREATE POLICY "payment_allocations_org_insert"
ON public.payment_allocations
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = public.current_user_organization()
);

CREATE POLICY "payment_allocations_org_update"
ON public.payment_allocations
FOR UPDATE
TO authenticated
USING (
  organization_id = public.current_user_organization()
)
WITH CHECK (
  organization_id = public.current_user_organization()
);

CREATE POLICY "payment_allocations_org_delete"
ON public.payment_allocations
FOR DELETE
TO authenticated
USING (
  organization_id = public.current_user_organization()
);

-- 4. nfse_config
CREATE POLICY "nfse_config_admin_all"
ON public.nfse_config
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "nfse_config_org_select"
ON public.nfse_config
FOR SELECT
TO authenticated
USING (
  organization_id = public.current_user_organization()
);

CREATE POLICY "nfse_config_owner_insert"
ON public.nfse_config
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND organization_id = public.current_user_organization()
);

CREATE POLICY "nfse_config_owner_update"
ON public.nfse_config
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

CREATE POLICY "nfse_config_owner_delete"
ON public.nfse_config
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  AND organization_id = public.current_user_organization()
);

-- 5. nfse_certificates
CREATE POLICY "nfse_certificates_admin_all"
ON public.nfse_certificates
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "nfse_certificates_org_select"
ON public.nfse_certificates
FOR SELECT
TO authenticated
USING (
  organization_id = public.current_user_organization()
);

CREATE POLICY "nfse_certificates_owner_insert"
ON public.nfse_certificates
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND organization_id = public.current_user_organization()
);

CREATE POLICY "nfse_certificates_owner_update"
ON public.nfse_certificates
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

CREATE POLICY "nfse_certificates_owner_delete"
ON public.nfse_certificates
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  AND organization_id = public.current_user_organization()
);

-- 6. invoice_logs
CREATE POLICY "invoice_logs_admin_all"
ON public.invoice_logs
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "invoice_logs_org_select"
ON public.invoice_logs
FOR SELECT
TO authenticated
USING (
  organization_id = public.current_user_organization()
);

CREATE POLICY "invoice_logs_org_insert"
ON public.invoice_logs
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = public.current_user_organization()
);

-- 7. accountant_requests (não usa organization_id, usa therapist_id/accountant_id)
CREATE POLICY "accountant_requests_admin_all"
ON public.accountant_requests
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "accountant_requests_therapist_select"
ON public.accountant_requests
FOR SELECT
TO authenticated
USING (therapist_id = auth.uid());

CREATE POLICY "accountant_requests_therapist_insert"
ON public.accountant_requests
FOR INSERT
TO authenticated
WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "accountant_requests_therapist_update"
ON public.accountant_requests
FOR UPDATE
TO authenticated
USING (therapist_id = auth.uid())
WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "accountant_requests_accountant_select"
ON public.accountant_requests
FOR SELECT
TO authenticated
USING (accountant_id = auth.uid());

CREATE POLICY "accountant_requests_accountant_update"
ON public.accountant_requests
FOR UPDATE
TO authenticated
USING (accountant_id = auth.uid())
WITH CHECK (accountant_id = auth.uid());

-- 8. accountant_therapist_assignments (não usa organization_id)
CREATE POLICY "assignments_admin_all"
ON public.accountant_therapist_assignments
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "assignments_therapist_select"
ON public.accountant_therapist_assignments
FOR SELECT
TO authenticated
USING (therapist_id = auth.uid());

CREATE POLICY "assignments_accountant_select"
ON public.accountant_therapist_assignments
FOR SELECT
TO authenticated
USING (accountant_id = auth.uid());

CREATE POLICY "assignments_therapist_insert"
ON public.accountant_therapist_assignments
FOR INSERT
TO authenticated
WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "assignments_therapist_update"
ON public.accountant_therapist_assignments
FOR UPDATE
TO authenticated
USING (therapist_id = auth.uid())
WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "assignments_therapist_delete"
ON public.accountant_therapist_assignments
FOR DELETE
TO authenticated
USING (therapist_id = auth.uid());

CREATE POLICY "assignments_accountant_update"
ON public.accountant_therapist_assignments
FOR UPDATE
TO authenticated
USING (accountant_id = auth.uid())
WITH CHECK (accountant_id = auth.uid());

CREATE POLICY "assignments_accountant_delete"
ON public.accountant_therapist_assignments
FOR DELETE
TO authenticated
USING (accountant_id = auth.uid());