-- ============================================================================
-- FASE 10.9: Backfill e Correção Automática de organization_id
-- ============================================================================
-- Corrige automaticamente registros com organization_id NULL ou incorreto

-- ============================================================================
-- 1. Backfill de PATIENTS
-- ============================================================================
UPDATE public.patients
SET organization_id = public.resolve_organization_for_user(user_id)
WHERE organization_id IS NULL
  AND user_id IS NOT NULL;

-- ============================================================================
-- 2. Backfill de SESSIONS via patient
-- ============================================================================
UPDATE public.sessions s
SET organization_id = public.resolve_organization_for_user(p.user_id)
FROM public.patients p
WHERE s.patient_id = p.id
  AND s.organization_id IS NULL
  AND p.user_id IS NOT NULL;

-- ============================================================================
-- 3. Backfill de NFSE_ISSUED
-- ============================================================================
UPDATE public.nfse_issued
SET organization_id = public.resolve_organization_for_user(user_id)
WHERE organization_id IS NULL
  AND user_id IS NOT NULL;

-- ============================================================================
-- 4. Backfill de NFSE_PAYMENTS
-- ============================================================================
UPDATE public.nfse_payments
SET organization_id = public.resolve_organization_for_user(user_id)
WHERE organization_id IS NULL
  AND user_id IS NOT NULL;

-- ============================================================================
-- 5. Backfill de PAYMENT_ALLOCATIONS via nfse
-- ============================================================================
UPDATE public.payment_allocations pa
SET organization_id = public.resolve_organization_for_user(n.user_id)
FROM public.nfse_issued n
WHERE pa.nfse_id = n.id
  AND pa.organization_id IS NULL
  AND n.user_id IS NOT NULL;

-- ============================================================================
-- 6. Backfill de PATIENT_FILES via patient
-- ============================================================================
UPDATE public.patient_files pf
SET organization_id = public.resolve_organization_for_user(p.user_id)
FROM public.patients p
WHERE pf.patient_id = p.id
  AND pf.organization_id IS NULL
  AND p.user_id IS NOT NULL;

-- ============================================================================
-- 7. Backfill de CLINICAL_COMPLAINTS via patient
-- ============================================================================
UPDATE public.clinical_complaints cc
SET organization_id = public.resolve_organization_for_user(p.user_id)
FROM public.patients p
WHERE cc.patient_id = p.id
  AND cc.organization_id IS NULL
  AND p.user_id IS NOT NULL;

-- ============================================================================
-- 8. Backfill de COMPLAINT_SYMPTOMS via complaint → patient
-- ============================================================================
UPDATE public.complaint_symptoms cs
SET organization_id = public.resolve_organization_for_user(p.user_id)
FROM public.clinical_complaints cc
INNER JOIN public.patients p ON p.id = cc.patient_id
WHERE cs.complaint_id = cc.id
  AND cs.organization_id IS NULL
  AND p.user_id IS NOT NULL;

-- ============================================================================
-- 9. Backfill de COMPLAINT_MEDICATIONS via complaint → patient
-- ============================================================================
UPDATE public.complaint_medications cm
SET organization_id = public.resolve_organization_for_user(p.user_id)
FROM public.clinical_complaints cc
INNER JOIN public.patients p ON p.id = cc.patient_id
WHERE cm.complaint_id = cc.id
  AND cm.organization_id IS NULL
  AND p.user_id IS NOT NULL;

-- ============================================================================
-- 10. Backfill de SESSION_EVALUATIONS via patient
-- ============================================================================
UPDATE public.session_evaluations se
SET organization_id = public.resolve_organization_for_user(p.user_id)
FROM public.patients p
WHERE se.patient_id = p.id
  AND se.organization_id IS NULL
  AND p.user_id IS NOT NULL;

-- ============================================================================
-- 11. Backfill de SCHEDULE_BLOCKS
-- ============================================================================
UPDATE public.schedule_blocks
SET organization_id = public.resolve_organization_for_user(user_id)
WHERE organization_id IS NULL
  AND user_id IS NOT NULL;

-- ============================================================================
-- 12. Backfill de APPOINTMENTS
-- ============================================================================
UPDATE public.appointments
SET organization_id = public.resolve_organization_for_user(user_id)
WHERE organization_id IS NULL
  AND user_id IS NOT NULL;

-- ============================================================================
-- 13. Backfill de SYSTEM_NOTIFICATIONS
-- ============================================================================
UPDATE public.system_notifications
SET organization_id = public.resolve_organization_for_user(user_id)
WHERE organization_id IS NULL
  AND user_id IS NOT NULL;

-- ============================================================================
-- 14. Backfill de THERAPIST_NOTIFICATIONS
-- ============================================================================
UPDATE public.therapist_notifications
SET organization_id = public.resolve_organization_for_user(therapist_id)
WHERE organization_id IS NULL
  AND therapist_id IS NOT NULL;

-- ============================================================================
-- 15. Backfill de NFSE_CONFIG
-- ============================================================================
UPDATE public.nfse_config
SET organization_id = public.resolve_organization_for_user(user_id)
WHERE organization_id IS NULL
  AND user_id IS NOT NULL;

-- ============================================================================
-- 16. Backfill de NFSE_CERTIFICATES
-- ============================================================================
UPDATE public.nfse_certificates
SET organization_id = public.resolve_organization_for_user(user_id)
WHERE organization_id IS NULL
  AND user_id IS NOT NULL;

-- ============================================================================
-- 17. Backfill de INVOICE_LOGS
-- ============================================================================
UPDATE public.invoice_logs
SET organization_id = public.resolve_organization_for_user(user_id)
WHERE organization_id IS NULL
  AND user_id IS NOT NULL;

-- ============================================================================
-- 18. Backfill de CONSENT_SUBMISSIONS via patient
-- ============================================================================
UPDATE public.consent_submissions cs
SET organization_id = public.resolve_organization_for_user(p.user_id)
FROM public.patients p
WHERE cs.patient_id = p.id
  AND cs.organization_id IS NULL
  AND p.user_id IS NOT NULL;