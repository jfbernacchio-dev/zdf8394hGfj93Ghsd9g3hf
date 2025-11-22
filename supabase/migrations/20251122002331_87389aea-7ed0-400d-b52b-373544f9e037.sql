
-- ============================================================================
-- FASE 11.5: Auditoria Final e Hardening de RLS Multi-Organização
-- Parte 2: Refatorar policies com JOINs e aplicar padrão organization_id
-- ============================================================================

-- ============================================================================
-- 1. COMPLAINT_SPECIFIERS - Remover policies com JOIN e usar organization_id
-- ============================================================================

DROP POLICY IF EXISTS "Admin can manage all complaint specifiers" ON public.complaint_specifiers;
DROP POLICY IF EXISTS "Owner can manage complaint specifiers" ON public.complaint_specifiers;
DROP POLICY IF EXISTS "Users can manage specifiers of their complaints" ON public.complaint_specifiers;

-- Novas policies seguindo o padrão multi-org
CREATE POLICY "complaint_specifiers_admin_all"
  ON public.complaint_specifiers
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "complaint_specifiers_org_select"
  ON public.complaint_specifiers
  FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND organization_id = current_user_organization()
  );

CREATE POLICY "complaint_specifiers_org_insert"
  ON public.complaint_specifiers
  FOR INSERT
  WITH CHECK (organization_id = current_user_organization());

CREATE POLICY "complaint_specifiers_org_update"
  ON public.complaint_specifiers
  FOR UPDATE
  USING (organization_id = current_user_organization())
  WITH CHECK (organization_id = current_user_organization());

CREATE POLICY "complaint_specifiers_org_delete"
  ON public.complaint_specifiers
  FOR DELETE
  USING (organization_id = current_user_organization());

-- ============================================================================
-- 2. WHATSAPP_CONVERSATIONS - Adicionar policies com organization_id
-- ============================================================================

DROP POLICY IF EXISTS "Admin can manage all whatsapp conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Admins can delete conversations of their therapists" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Admins can view conversations of their therapists" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Owner can manage own whatsapp conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Users can delete their own conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Users can insert their own conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Users can update their own conversations" ON public.whatsapp_conversations;
DROP POLICY IF EXISTS "Users can view their own conversations" ON public.whatsapp_conversations;

-- Novas policies usando organization_id
CREATE POLICY "whatsapp_conversations_admin_all"
  ON public.whatsapp_conversations
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "whatsapp_conversations_org_select"
  ON public.whatsapp_conversations
  FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND organization_id = current_user_organization()
  );

CREATE POLICY "whatsapp_conversations_owner_modify"
  ON public.whatsapp_conversations
  FOR ALL
  USING (
    user_id = auth.uid()
    AND organization_id = current_user_organization()
  )
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id = current_user_organization()
  );

-- ============================================================================
-- 3. WHATSAPP_MESSAGES - Substituir JOINs por organization_id
-- ============================================================================

DROP POLICY IF EXISTS "Admin can manage all whatsapp messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Admins can delete messages of their therapists conversations" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Admins can view messages of their therapists conversations" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Owner can insert own whatsapp messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Owner can view own whatsapp messages" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Users can delete messages in their conversations" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Users can insert messages in their conversations" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Users can update messages in their conversations" ON public.whatsapp_messages;
DROP POLICY IF EXISTS "Users can view messages of their conversations" ON public.whatsapp_messages;

-- Novas policies usando organization_id
CREATE POLICY "whatsapp_messages_admin_all"
  ON public.whatsapp_messages
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "whatsapp_messages_org_select"
  ON public.whatsapp_messages
  FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND organization_id = current_user_organization()
  );

CREATE POLICY "whatsapp_messages_org_modify"
  ON public.whatsapp_messages
  FOR ALL
  USING (organization_id = current_user_organization())
  WITH CHECK (organization_id = current_user_organization());

-- ============================================================================
-- 4. SESSION_HISTORY - Criar policies com organization_id
-- ============================================================================

DROP POLICY IF EXISTS "Admin can manage session history" ON public.session_history;
DROP POLICY IF EXISTS "Owner can manage session history" ON public.session_history;
DROP POLICY IF EXISTS "Users can view session history of their patients" ON public.session_history;
DROP POLICY IF EXISTS "Admin can view all session history" ON public.session_history;

-- Novas policies seguindo o padrão multi-org
CREATE POLICY "session_history_admin_all"
  ON public.session_history
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "session_history_org_select"
  ON public.session_history
  FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND organization_id = current_user_organization()
  );

CREATE POLICY "session_history_org_modify"
  ON public.session_history
  FOR ALL
  USING (organization_id = current_user_organization())
  WITH CHECK (organization_id = current_user_organization());

-- ============================================================================
-- 5. SUBORDINATE_AUTONOMY_SETTINGS - Criar policies com organization_id
-- ============================================================================

DROP POLICY IF EXISTS "Admin can manage all subordinate settings" ON public.subordinate_autonomy_settings;
DROP POLICY IF EXISTS "Manager can manage subordinate settings" ON public.subordinate_autonomy_settings;
DROP POLICY IF EXISTS "Subordinate can view own settings" ON public.subordinate_autonomy_settings;
DROP POLICY IF EXISTS "Admin can view all subordinate settings" ON public.subordinate_autonomy_settings;
DROP POLICY IF EXISTS "Manager can view subordinate settings" ON public.subordinate_autonomy_settings;

-- Novas policies seguindo o padrão multi-org
CREATE POLICY "subordinate_autonomy_admin_all"
  ON public.subordinate_autonomy_settings
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "subordinate_autonomy_org_select"
  ON public.subordinate_autonomy_settings
  FOR SELECT
  USING (
    organization_id IS NOT NULL
    AND organization_id = current_user_organization()
  );

CREATE POLICY "subordinate_autonomy_manager_modify"
  ON public.subordinate_autonomy_settings
  FOR ALL
  USING (
    manager_id = auth.uid()
    AND organization_id = current_user_organization()
  )
  WITH CHECK (
    manager_id = auth.uid()
    AND organization_id = current_user_organization()
  );

CREATE POLICY "subordinate_autonomy_own_view"
  ON public.subordinate_autonomy_settings
  FOR SELECT
  USING (subordinate_id = auth.uid());

-- ============================================================================
-- 6. REMOVER FUNÇÃO is_same_organization()
-- ============================================================================

DROP FUNCTION IF EXISTS public.is_same_organization(UUID);

-- ============================================================================
-- COMENTÁRIOS FINAIS
-- ============================================================================

COMMENT ON TABLE public.session_history IS 
'FASE 11.5: Now with organization_id for multi-tenant isolation';

COMMENT ON TABLE public.whatsapp_conversations IS 
'FASE 11.5: Now with organization_id for multi-tenant isolation';

COMMENT ON TABLE public.whatsapp_messages IS 
'FASE 11.5: Now with organization_id for multi-tenant isolation';

COMMENT ON TABLE public.subordinate_autonomy_settings IS 
'FASE 11.5: Now with organization_id for multi-tenant isolation';

COMMENT ON TABLE public.complaint_specifiers IS 
'FASE 11.5: Now with organization_id for multi-tenant isolation';
