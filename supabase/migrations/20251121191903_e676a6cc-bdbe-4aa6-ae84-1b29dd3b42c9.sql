-- FASE 9.2: Endurecer RLS de dados não-clínicos (financeiro, agenda, templates, configs)
-- Objetivo: Impedir que usuários vejam dados administrativos/financeiros/organizacionais de outra organização

-- ============================================================================
-- CATEGORIA: FINANCEIRO - NFSe
-- ============================================================================

-- TABELA: nfse_issued
DROP POLICY IF EXISTS "Users can view their own nfse" ON nfse_issued;
DROP POLICY IF EXISTS "Users can insert their own nfse" ON nfse_issued;
DROP POLICY IF EXISTS "Users can update their own nfse" ON nfse_issued;
DROP POLICY IF EXISTS "Users can delete their own nfse" ON nfse_issued;
DROP POLICY IF EXISTS "Accountants can view all nfse" ON nfse_issued;
DROP POLICY IF EXISTS "Admins can view nfse of their therapists" ON nfse_issued;

CREATE POLICY "Admin can manage all nfse"
  ON nfse_issued FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can manage own nfse"
  ON nfse_issued FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Accountants can view same org nfse"
  ON nfse_issued FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'accountant') AND is_same_organization(user_id));

CREATE POLICY "Same org users can view nfse"
  ON nfse_issued FOR SELECT TO authenticated
  USING (is_same_organization(user_id));

-- TABELA: nfse_payments
DROP POLICY IF EXISTS "Users can view their own payments" ON nfse_payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON nfse_payments;
DROP POLICY IF EXISTS "Users can update their own payments" ON nfse_payments;
DROP POLICY IF EXISTS "Users can delete their own payments" ON nfse_payments;
DROP POLICY IF EXISTS "Accountants can view all payments" ON nfse_payments;
DROP POLICY IF EXISTS "Admins can view payments of their therapists" ON nfse_payments;

CREATE POLICY "Admin can manage all payments"
  ON nfse_payments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can manage own payments"
  ON nfse_payments FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Accountants can view same org payments"
  ON nfse_payments FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'accountant') AND is_same_organization(user_id));

CREATE POLICY "Same org users can view payments"
  ON nfse_payments FOR SELECT TO authenticated
  USING (is_same_organization(user_id));

-- TABELA: payment_allocations
CREATE POLICY "Admin can manage all payment allocations"
  ON payment_allocations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can view own payment allocations"
  ON payment_allocations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM nfse_payments np
      WHERE np.id = payment_allocations.payment_id
        AND np.user_id = auth.uid()
    )
  );

CREATE POLICY "Same org can view payment allocations"
  ON payment_allocations FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM nfse_payments np
      WHERE np.id = payment_allocations.payment_id
        AND is_same_organization(np.user_id)
    )
  );

-- TABELA: nfse_config
DROP POLICY IF EXISTS "Users can view their own nfse config" ON nfse_config;
DROP POLICY IF EXISTS "Users can insert their own nfse config" ON nfse_config;
DROP POLICY IF EXISTS "Users can update their own nfse config" ON nfse_config;
DROP POLICY IF EXISTS "Users can delete their own nfse config" ON nfse_config;
DROP POLICY IF EXISTS "Accountants can view all nfse configs" ON nfse_config;

CREATE POLICY "Admin can manage all nfse configs"
  ON nfse_config FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can manage own nfse config"
  ON nfse_config FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Accountants can view same org nfse configs"
  ON nfse_config FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'accountant') AND is_same_organization(user_id));

-- TABELA: nfse_certificates
DROP POLICY IF EXISTS "Users can view their own certificates" ON nfse_certificates;
DROP POLICY IF EXISTS "Users can insert their own certificates" ON nfse_certificates;
DROP POLICY IF EXISTS "Users can update their own certificates" ON nfse_certificates;
DROP POLICY IF EXISTS "Users can delete their own certificates" ON nfse_certificates;
DROP POLICY IF EXISTS "Accountants can view all certificates" ON nfse_certificates;
DROP POLICY IF EXISTS "Accountants can insert certificates" ON nfse_certificates;
DROP POLICY IF EXISTS "Accountants can update certificates" ON nfse_certificates;
DROP POLICY IF EXISTS "Accountants can delete certificates" ON nfse_certificates;

CREATE POLICY "Admin can manage all certificates"
  ON nfse_certificates FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can manage own certificates"
  ON nfse_certificates FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Accountants can manage same org certificates"
  ON nfse_certificates FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'accountant') AND is_same_organization(user_id))
  WITH CHECK (has_role(auth.uid(), 'accountant') AND is_same_organization(user_id));

-- TABELA: invoice_logs
DROP POLICY IF EXISTS "Users can view their own invoice logs" ON invoice_logs;
DROP POLICY IF EXISTS "Users can insert their own invoice logs" ON invoice_logs;
DROP POLICY IF EXISTS "Users can delete their own invoice logs" ON invoice_logs;
DROP POLICY IF EXISTS "Admins can view logs of their therapists" ON invoice_logs;

CREATE POLICY "Admin can manage all invoice logs"
  ON invoice_logs FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can manage own invoice logs"
  ON invoice_logs FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Same org can view invoice logs"
  ON invoice_logs FOR SELECT TO authenticated
  USING (is_same_organization(user_id));

-- ============================================================================
-- CATEGORIA: FINANCEIRO - Contador
-- ============================================================================

-- TABELA: accountant_requests
DROP POLICY IF EXISTS "Therapists can view their own requests" ON accountant_requests;
DROP POLICY IF EXISTS "Therapists can create their own requests" ON accountant_requests;
DROP POLICY IF EXISTS "Accountants can view requests to them" ON accountant_requests;
DROP POLICY IF EXISTS "Accountants can update requests to them" ON accountant_requests;
DROP POLICY IF EXISTS "Admins can view all requests" ON accountant_requests;

CREATE POLICY "Admin can manage all accountant requests"
  ON accountant_requests FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Therapist can view own requests"
  ON accountant_requests FOR SELECT TO authenticated
  USING (therapist_id = auth.uid());

CREATE POLICY "Therapist can create own requests"
  ON accountant_requests FOR INSERT TO authenticated
  WITH CHECK (therapist_id = auth.uid() AND status = 'pending');

CREATE POLICY "Accountant can view requests to them"
  ON accountant_requests FOR SELECT TO authenticated
  USING (accountant_id = auth.uid());

CREATE POLICY "Accountant can update requests to them"
  ON accountant_requests FOR UPDATE TO authenticated
  USING (accountant_id = auth.uid());

CREATE POLICY "Same org can view accountant requests"
  ON accountant_requests FOR SELECT TO authenticated
  USING (is_same_organization(therapist_id) AND is_same_organization(accountant_id));

-- TABELA: accountant_therapist_assignments
DROP POLICY IF EXISTS "Therapists can view their accountant" ON accountant_therapist_assignments;
DROP POLICY IF EXISTS "Accountants can view their own assignments" ON accountant_therapist_assignments;
DROP POLICY IF EXISTS "Therapist Full can assign accountant to themselves" ON accountant_therapist_assignments;
DROP POLICY IF EXISTS "Therapist Full can remove their accountant" ON accountant_therapist_assignments;
DROP POLICY IF EXISTS "Admins can view all assignments" ON accountant_therapist_assignments;
DROP POLICY IF EXISTS "Admins can manage all assignments" ON accountant_therapist_assignments;

CREATE POLICY "Admin can manage all accountant assignments"
  ON accountant_therapist_assignments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Therapist can view own accountant"
  ON accountant_therapist_assignments FOR SELECT TO authenticated
  USING (therapist_id = auth.uid());

CREATE POLICY "Accountant can view own assignments"
  ON accountant_therapist_assignments FOR SELECT TO authenticated
  USING (accountant_id = auth.uid());

CREATE POLICY "Therapist can manage own accountant assignment"
  ON accountant_therapist_assignments FOR ALL TO authenticated
  USING (therapist_id = auth.uid() AND NOT is_subordinate(auth.uid()))
  WITH CHECK (therapist_id = auth.uid() AND NOT is_subordinate(auth.uid()));

CREATE POLICY "Same org can view accountant assignments"
  ON accountant_therapist_assignments FOR SELECT TO authenticated
  USING (is_same_organization(therapist_id) AND is_same_organization(accountant_id));

-- ============================================================================
-- CATEGORIA: AGENDA
-- ============================================================================

-- TABELA: schedule_blocks
CREATE POLICY "Admin can manage all schedule blocks"
  ON schedule_blocks FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can manage own schedule blocks"
  ON schedule_blocks FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Same org can view schedule blocks"
  ON schedule_blocks FOR SELECT TO authenticated
  USING (is_same_organization(user_id));

-- TABELA: appointments
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can insert their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can update their own appointments" ON appointments;
DROP POLICY IF EXISTS "Users can delete their own appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can view appointments of their therapists" ON appointments;

CREATE POLICY "Admin can manage all appointments"
  ON appointments FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can manage own appointments"
  ON appointments FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Same org can view appointments"
  ON appointments FOR SELECT TO authenticated
  USING (is_same_organization(user_id));

-- ============================================================================
-- CATEGORIA: TEMPLATES E LAYOUTS
-- ============================================================================

-- TABELA: user_layout_templates
DROP POLICY IF EXISTS "Users can view their own templates" ON user_layout_templates;
DROP POLICY IF EXISTS "Users can insert their own templates" ON user_layout_templates;
DROP POLICY IF EXISTS "Users can update their own templates" ON user_layout_templates;
DROP POLICY IF EXISTS "Users can delete their own templates" ON user_layout_templates;
DROP POLICY IF EXISTS "Admins can view templates of subordinates" ON user_layout_templates;

CREATE POLICY "Admin can manage all layout templates"
  ON user_layout_templates FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can manage own layout templates"
  ON user_layout_templates FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Same org can view layout templates"
  ON user_layout_templates FOR SELECT TO authenticated
  USING (is_same_organization(user_id));

-- TABELA: user_layout_preferences
DROP POLICY IF EXISTS "Users can view their own layout preferences" ON user_layout_preferences;
DROP POLICY IF EXISTS "Users can insert their own layout preferences" ON user_layout_preferences;
DROP POLICY IF EXISTS "Users can update their own layout preferences" ON user_layout_preferences;
DROP POLICY IF EXISTS "Users can delete their own layout preferences" ON user_layout_preferences;

CREATE POLICY "Admin can manage all layout preferences"
  ON user_layout_preferences FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can manage own layout preferences"
  ON user_layout_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- TABELA: layout_profiles
DROP POLICY IF EXISTS "Users can view their own profiles" ON layout_profiles;
DROP POLICY IF EXISTS "Users can insert their own profiles" ON layout_profiles;
DROP POLICY IF EXISTS "Users can update their own profiles" ON layout_profiles;
DROP POLICY IF EXISTS "Users can delete their own profiles" ON layout_profiles;

CREATE POLICY "Admin can manage all layout profiles"
  ON layout_profiles FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can manage own layout profiles"
  ON layout_profiles FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- TABELA: active_profile_state
DROP POLICY IF EXISTS "Users can view their own active profile state" ON active_profile_state;
DROP POLICY IF EXISTS "Users can insert their own active profile state" ON active_profile_state;
DROP POLICY IF EXISTS "Users can update their own active profile state" ON active_profile_state;
DROP POLICY IF EXISTS "Users can delete their own active profile state" ON active_profile_state;

CREATE POLICY "Admin can manage all active profile states"
  ON active_profile_state FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can manage own active profile state"
  ON active_profile_state FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- TABELA: layout_backups
CREATE POLICY "Admin can manage all layout backups"
  ON layout_backups FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can manage own layout backups"
  ON layout_backups FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ============================================================================
-- CATEGORIA: NOTIFICAÇÕES
-- ============================================================================

-- TABELA: system_notifications
CREATE POLICY "Admin can manage all system notifications"
  ON system_notifications FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can view and update own notifications"
  ON system_notifications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Owner can update own notifications"
  ON system_notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "System can insert notifications"
  ON system_notifications FOR INSERT TO authenticated
  WITH CHECK (true);

-- TABELA: therapist_notifications
DROP POLICY IF EXISTS "Users can update their own notifications" ON therapist_notifications;
DROP POLICY IF EXISTS "Admins can view notifications for their therapists" ON therapist_notifications;
DROP POLICY IF EXISTS "Admins can insert notifications" ON therapist_notifications;

CREATE POLICY "Admin can manage all therapist notifications"
  ON therapist_notifications FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Therapist can view own notifications"
  ON therapist_notifications FOR SELECT TO authenticated
  USING (therapist_id = auth.uid());

CREATE POLICY "Therapist can update own notifications"
  ON therapist_notifications FOR UPDATE TO authenticated
  USING (therapist_id = auth.uid());

CREATE POLICY "Admin can insert notifications for own therapists"
  ON therapist_notifications FOR INSERT TO authenticated
  WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Same org can view therapist notifications"
  ON therapist_notifications FOR SELECT TO authenticated
  USING (is_same_organization(therapist_id) AND is_same_organization(admin_id));

-- TABELA: notification_preferences
DROP POLICY IF EXISTS "Admins can view their notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Admins can insert their notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Admins can update their notification preferences" ON notification_preferences;

CREATE POLICY "Admin can manage all notification preferences"
  ON notification_preferences FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can manage own notification preferences"
  ON notification_preferences FOR ALL TO authenticated
  USING (admin_id = auth.uid())
  WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Same org can view notification preferences"
  ON notification_preferences FOR SELECT TO authenticated
  USING (is_same_organization(admin_id) AND is_same_organization(therapist_id));

-- ============================================================================
-- CATEGORIA: WHATSAPP
-- ============================================================================

-- TABELA: whatsapp_conversations
CREATE POLICY "Admin can manage all whatsapp conversations"
  ON whatsapp_conversations FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can manage own whatsapp conversations"
  ON whatsapp_conversations FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Same org can view whatsapp conversations"
  ON whatsapp_conversations FOR SELECT TO authenticated
  USING (is_same_organization(user_id));

-- TABELA: whatsapp_messages
CREATE POLICY "Admin can manage all whatsapp messages"
  ON whatsapp_messages FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can view own whatsapp messages"
  ON whatsapp_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM whatsapp_conversations wc
      WHERE wc.id = whatsapp_messages.conversation_id
        AND wc.user_id = auth.uid()
    )
  );

CREATE POLICY "Owner can insert own whatsapp messages"
  ON whatsapp_messages FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM whatsapp_conversations wc
      WHERE wc.id = whatsapp_messages.conversation_id
        AND wc.user_id = auth.uid()
    )
  );

CREATE POLICY "Same org can view whatsapp messages"
  ON whatsapp_messages FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM whatsapp_conversations wc
      WHERE wc.id = whatsapp_messages.conversation_id
        AND is_same_organization(wc.user_id)
    )
  );

-- ============================================================================
-- CATEGORIA: AUDITORIA E LOGS
-- ============================================================================

-- TABELA: admin_access_log
CREATE POLICY "Admin can view all access logs"
  ON admin_access_log FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can view own access logs"
  ON admin_access_log FOR SELECT TO authenticated
  USING (admin_id = auth.uid());

CREATE POLICY "System can insert access logs"
  ON admin_access_log FOR INSERT TO authenticated
  WITH CHECK (admin_id = auth.uid());

-- TABELA: session_history
CREATE POLICY "Admin can manage all session history"
  ON session_history FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Owner can view own session history"
  ON session_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = session_history.patient_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Same org can view session history"
  ON session_history FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = session_history.patient_id
        AND is_same_organization(p.user_id)
    )
  );