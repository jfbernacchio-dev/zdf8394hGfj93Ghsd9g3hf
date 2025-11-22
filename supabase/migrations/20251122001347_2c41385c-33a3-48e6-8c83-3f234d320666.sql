
-- ============================================================================
-- FASE 11.4.1: LIMPEZA DE POLICIES ANTIGAS COM is_same_organization()
-- ============================================================================
--
-- Remove TODAS as policies antigas que ainda usam is_same_organization()
-- para evitar conflitos e warnings de segurança
-- ============================================================================

-- appointments
DROP POLICY IF EXISTS "Same org can view appointments" ON public.appointments;

-- complaint_specifiers
DROP POLICY IF EXISTS "Same org users can view complaint specifiers" ON public.complaint_specifiers;

-- nfse_config
DROP POLICY IF EXISTS "Accountants can view same org nfse configs" ON public.nfse_config;
DROP POLICY IF EXISTS "Same org users can view nfse config" ON public.nfse_config;

-- nfse_issued
DROP POLICY IF EXISTS "Accountants can view same org nfse" ON public.nfse_issued;
DROP POLICY IF EXISTS "Same org users can view nfse" ON public.nfse_issued;

-- notification_preferences
DROP POLICY IF EXISTS "Same org can view notification preferences" ON public.notification_preferences;

-- patient_complaints
DROP POLICY IF EXISTS "Same org users can view patient complaints" ON public.patient_complaints;

-- payment_allocations
DROP POLICY IF EXISTS "Same org can view payment allocations" ON public.payment_allocations;

-- peer_sharing
DROP POLICY IF EXISTS "Same org can view peer sharing" ON public.peer_sharing;

-- profiles
DROP POLICY IF EXISTS "Same org can view profiles" ON public.profiles;

-- schedule_blocks
DROP POLICY IF EXISTS "Same org can view schedule blocks" ON public.schedule_blocks;

-- session_history (se existir)
DROP POLICY IF EXISTS "Same org can view session history" ON public.session_history;

-- subordinate_autonomy_settings (se existir)
DROP POLICY IF EXISTS "Same org can view subordinate autonomy" ON public.subordinate_autonomy_settings;

-- therapist_assignments
DROP POLICY IF EXISTS "Same org can view therapist assignments" ON public.therapist_assignments;

-- therapist_notifications
DROP POLICY IF EXISTS "Same org can view therapist notifications" ON public.therapist_notifications;

-- user_layout_templates
DROP POLICY IF EXISTS "Same org can view layout templates" ON public.user_layout_templates;

-- whatsapp_conversations (se existir)
DROP POLICY IF EXISTS "Same org can view whatsapp conversations" ON public.whatsapp_conversations;

-- whatsapp_messages (se existir)
DROP POLICY IF EXISTS "Same org can view whatsapp messages" ON public.whatsapp_messages;
