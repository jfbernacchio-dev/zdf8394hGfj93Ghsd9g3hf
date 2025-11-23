-- ============================================================================
-- FASE W3 - Adicionar permissões organizacionais de WhatsApp
-- ============================================================================
-- 
-- Adiciona 3 novas colunas em level_role_settings para controlar:
-- 1. can_view_subordinate_whatsapp: Ver conversas de subordinados
-- 2. can_manage_subordinate_whatsapp: Responder por subordinados
-- 3. secretary_can_access_whatsapp: Acesso total para secretária/assistant
-- 
-- ============================================================================

-- Adicionar novas colunas de permissões de WhatsApp
ALTER TABLE public.level_role_settings
ADD COLUMN can_view_subordinate_whatsapp BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN can_manage_subordinate_whatsapp BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN secretary_can_access_whatsapp BOOLEAN NOT NULL DEFAULT false;

-- Comentários para documentar as colunas
COMMENT ON COLUMN public.level_role_settings.can_view_subordinate_whatsapp IS 
'Se usuários deste nível podem visualizar conversas do WhatsApp de seus subordinados diretos';

COMMENT ON COLUMN public.level_role_settings.can_manage_subordinate_whatsapp IS 
'Se usuários deste nível podem enviar mensagens/responder em nome de seus subordinados';

COMMENT ON COLUMN public.level_role_settings.secretary_can_access_whatsapp IS 
'Se assistentes/secretárias deste nível podem acessar TODAS as conversas da organização';