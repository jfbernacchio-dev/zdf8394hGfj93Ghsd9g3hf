
-- ============================================================================
-- FASE 11.5: Auditoria Final e Hardening de RLS Multi-Organização
-- Parte 1A: Adicionar organization_id (corrigido)
-- ============================================================================

-- 1. Adicionar organization_id em session_history
ALTER TABLE public.session_history 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- 2. Adicionar organization_id em whatsapp_conversations (precisa antes de messages!)
ALTER TABLE public.whatsapp_conversations 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- 3. Adicionar organization_id em whatsapp_messages
ALTER TABLE public.whatsapp_messages 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- 4. Adicionar organization_id em subordinate_autonomy_settings
ALTER TABLE public.subordinate_autonomy_settings 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- 5. Adicionar organization_id em complaint_specifiers
ALTER TABLE public.complaint_specifiers 
ADD COLUMN IF NOT EXISTS organization_id UUID;

-- ============================================================================
-- Criar triggers para popular organization_id automaticamente
-- ============================================================================

-- Trigger para session_history (via patient_id)
CREATE OR REPLACE TRIGGER trg_session_history_set_org
  BEFORE INSERT ON public.session_history
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_from_patient();

-- Trigger para whatsapp_conversations (via user_id)
CREATE OR REPLACE TRIGGER trg_whatsapp_conversations_set_org
  BEFORE INSERT OR UPDATE ON public.whatsapp_conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_from_user();

-- Trigger para whatsapp_messages (via conversation_id → user_id)
CREATE OR REPLACE FUNCTION public.auto_set_organization_from_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_conversation_org_id UUID;
BEGIN
  -- INSERT: Se organization_id está NULL, resolver via conversation
  IF TG_OP = 'INSERT' THEN
    IF NEW.organization_id IS NULL AND NEW.conversation_id IS NOT NULL THEN
      SELECT organization_id INTO v_conversation_org_id
      FROM public.whatsapp_conversations
      WHERE id = NEW.conversation_id;
      
      IF v_conversation_org_id IS NOT NULL THEN
        NEW.organization_id := v_conversation_org_id;
      END IF;
    END IF;
  END IF;
  
  -- UPDATE: Impedir mudança de organization_id
  IF TG_OP = 'UPDATE' THEN
    IF OLD.organization_id IS NOT NULL AND NEW.organization_id != OLD.organization_id THEN
      RAISE EXCEPTION 'Cannot change organization_id from % to % in whatsapp_messages', 
        OLD.organization_id, NEW.organization_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_whatsapp_messages_set_org
  BEFORE INSERT OR UPDATE ON public.whatsapp_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_from_conversation();

-- Trigger para subordinate_autonomy_settings (via subordinate_id)
CREATE OR REPLACE FUNCTION public.auto_set_organization_from_subordinate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- INSERT: Se organization_id está NULL, resolver via subordinate_id
  IF TG_OP = 'INSERT' THEN
    IF NEW.organization_id IS NULL AND NEW.subordinate_id IS NOT NULL THEN
      NEW.organization_id := resolve_organization_for_user(NEW.subordinate_id);
    END IF;
  END IF;
  
  -- UPDATE: Impedir mudança de organization_id
  IF TG_OP = 'UPDATE' THEN
    IF OLD.organization_id IS NOT NULL AND NEW.organization_id != OLD.organization_id THEN
      RAISE EXCEPTION 'Cannot change organization_id from % to % in subordinate_autonomy_settings', 
        OLD.organization_id, NEW.organization_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_subordinate_autonomy_set_org
  BEFORE INSERT OR UPDATE ON public.subordinate_autonomy_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_from_subordinate();

-- Trigger para complaint_specifiers (via complaint_id)
CREATE TRIGGER trg_complaint_specifiers_set_org
  BEFORE INSERT OR UPDATE ON public.complaint_specifiers
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_from_complaint();

-- ============================================================================
-- Backfill: Popular organization_id existente
-- ============================================================================

-- session_history
UPDATE public.session_history sh
SET organization_id = p.organization_id
FROM public.patients p
WHERE sh.patient_id = p.id
  AND sh.organization_id IS NULL
  AND p.organization_id IS NOT NULL;

-- whatsapp_conversations
UPDATE public.whatsapp_conversations wc
SET organization_id = p.organization_id
FROM public.profiles p
WHERE wc.user_id = p.id
  AND wc.organization_id IS NULL
  AND p.organization_id IS NOT NULL;

-- whatsapp_messages
UPDATE public.whatsapp_messages wm
SET organization_id = wc.organization_id
FROM public.whatsapp_conversations wc
WHERE wm.conversation_id = wc.id
  AND wm.organization_id IS NULL
  AND wc.organization_id IS NOT NULL;

-- subordinate_autonomy_settings
UPDATE public.subordinate_autonomy_settings sas
SET organization_id = p.organization_id
FROM public.profiles p
WHERE sas.subordinate_id = p.id
  AND sas.organization_id IS NULL
  AND p.organization_id IS NOT NULL;

-- complaint_specifiers
UPDATE public.complaint_specifiers cs
SET organization_id = cc.organization_id
FROM public.clinical_complaints cc
WHERE cs.complaint_id = cc.id
  AND cs.organization_id IS NULL
  AND cc.organization_id IS NOT NULL;
