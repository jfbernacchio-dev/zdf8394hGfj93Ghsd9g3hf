-- =====================================================
-- FASE 11.3: RLS Multi-Organização (Agenda + Notificações)
-- =====================================================
-- Aplicar RLS usando organization_id e current_user_organization()
-- SEM usar is_same_organization() ou referências a tabelas organizacionais

-- =====================================================
-- 1. AGENDA: schedule_blocks
-- =====================================================

ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_blocks FORCE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS "schedule_blocks_admin_all" ON public.schedule_blocks;
DROP POLICY IF EXISTS "schedule_blocks_org_select" ON public.schedule_blocks;
DROP POLICY IF EXISTS "schedule_blocks_owner_insert" ON public.schedule_blocks;
DROP POLICY IF EXISTS "schedule_blocks_owner_update" ON public.schedule_blocks;
DROP POLICY IF EXISTS "schedule_blocks_owner_delete" ON public.schedule_blocks;
DROP POLICY IF EXISTS "Admin can manage all schedule blocks" ON public.schedule_blocks;
DROP POLICY IF EXISTS "Users can view their own schedule blocks" ON public.schedule_blocks;
DROP POLICY IF EXISTS "Users can create their own schedule blocks" ON public.schedule_blocks;
DROP POLICY IF EXISTS "Users can update their own schedule blocks" ON public.schedule_blocks;
DROP POLICY IF EXISTS "Users can delete their own schedule blocks" ON public.schedule_blocks;

-- Novas policies
CREATE POLICY "schedule_blocks_admin_all"
ON public.schedule_blocks
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "schedule_blocks_org_select"
ON public.schedule_blocks
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL
  AND organization_id = public.current_user_organization()
);

CREATE POLICY "schedule_blocks_owner_insert"
ON public.schedule_blocks
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND organization_id = public.current_user_organization()
);

CREATE POLICY "schedule_blocks_owner_update"
ON public.schedule_blocks
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

CREATE POLICY "schedule_blocks_owner_delete"
ON public.schedule_blocks
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  AND organization_id = public.current_user_organization()
);

-- =====================================================
-- 2. AGENDA: appointments
-- =====================================================

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments FORCE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS "appointments_admin_all" ON public.appointments;
DROP POLICY IF EXISTS "appointments_org_select" ON public.appointments;
DROP POLICY IF EXISTS "appointments_owner_insert" ON public.appointments;
DROP POLICY IF EXISTS "appointments_owner_update" ON public.appointments;
DROP POLICY IF EXISTS "appointments_owner_delete" ON public.appointments;
DROP POLICY IF EXISTS "Users can view their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can create their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Users can delete their own appointments" ON public.appointments;

-- Novas policies
CREATE POLICY "appointments_admin_all"
ON public.appointments
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "appointments_org_select"
ON public.appointments
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL
  AND organization_id = public.current_user_organization()
);

CREATE POLICY "appointments_owner_insert"
ON public.appointments
FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND organization_id = public.current_user_organization()
);

CREATE POLICY "appointments_owner_update"
ON public.appointments
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

CREATE POLICY "appointments_owner_delete"
ON public.appointments
FOR DELETE
TO authenticated
USING (
  user_id = auth.uid()
  AND organization_id = public.current_user_organization()
);

-- =====================================================
-- 3. NOTIFICAÇÕES: system_notifications
-- =====================================================

ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_notifications FORCE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS "system_notifications_admin_all" ON public.system_notifications;
DROP POLICY IF EXISTS "system_notifications_org_select" ON public.system_notifications;
DROP POLICY IF EXISTS "system_notifications_org_insert" ON public.system_notifications;
DROP POLICY IF EXISTS "system_notifications_own_update" ON public.system_notifications;
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.system_notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.system_notifications;

-- Novas policies
CREATE POLICY "system_notifications_admin_all"
ON public.system_notifications
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "system_notifications_org_select"
ON public.system_notifications
FOR SELECT
TO authenticated
USING (
  (organization_id IS NOT NULL AND organization_id = public.current_user_organization())
  OR user_id = auth.uid()
);

CREATE POLICY "system_notifications_org_insert"
ON public.system_notifications
FOR INSERT
TO authenticated
WITH CHECK (
  organization_id = public.current_user_organization()
  OR user_id = auth.uid()
);

CREATE POLICY "system_notifications_own_update"
ON public.system_notifications
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- =====================================================
-- 4. NOTIFICAÇÕES: therapist_notifications
-- =====================================================

ALTER TABLE public.therapist_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapist_notifications FORCE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS "therapist_notifications_admin_all" ON public.therapist_notifications;
DROP POLICY IF EXISTS "therapist_notifications_own_select" ON public.therapist_notifications;
DROP POLICY IF EXISTS "therapist_notifications_own_insert" ON public.therapist_notifications;
DROP POLICY IF EXISTS "therapist_notifications_own_update" ON public.therapist_notifications;
DROP POLICY IF EXISTS "therapist_notifications_own_delete" ON public.therapist_notifications;
DROP POLICY IF EXISTS "Therapists can view their own notifications" ON public.therapist_notifications;
DROP POLICY IF EXISTS "Admins can manage therapist notifications" ON public.therapist_notifications;

-- Novas policies
CREATE POLICY "therapist_notifications_admin_all"
ON public.therapist_notifications
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "therapist_notifications_own_select"
ON public.therapist_notifications
FOR SELECT
TO authenticated
USING (therapist_id = auth.uid());

CREATE POLICY "therapist_notifications_own_insert"
ON public.therapist_notifications
FOR INSERT
TO authenticated
WITH CHECK (therapist_id = auth.uid() OR admin_id = auth.uid());

CREATE POLICY "therapist_notifications_own_update"
ON public.therapist_notifications
FOR UPDATE
TO authenticated
USING (therapist_id = auth.uid())
WITH CHECK (therapist_id = auth.uid());

CREATE POLICY "therapist_notifications_own_delete"
ON public.therapist_notifications
FOR DELETE
TO authenticated
USING (therapist_id = auth.uid());

-- =====================================================
-- 5. NOTIFICAÇÕES: notification_preferences
-- =====================================================

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences FORCE ROW LEVEL SECURITY;

-- Remover policies antigas
DROP POLICY IF EXISTS "notification_preferences_admin_all" ON public.notification_preferences;
DROP POLICY IF EXISTS "notification_preferences_own_access" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can manage their own notification preferences" ON public.notification_preferences;

-- Novas policies
CREATE POLICY "notification_preferences_admin_all"
ON public.notification_preferences
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "notification_preferences_own_access"
ON public.notification_preferences
FOR ALL
TO authenticated
USING (therapist_id = auth.uid())
WITH CHECK (therapist_id = auth.uid());