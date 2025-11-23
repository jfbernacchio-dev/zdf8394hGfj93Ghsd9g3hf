-- ============================================================================
-- FASE W2: Adicionar campo whatsapp_enabled em organizations
-- ============================================================================
-- 
-- Apenas organizações com whatsapp_enabled = true poderão usar WhatsApp.
-- Por padrão, todas começam com false.
-- Apenas a Espaço Mindware Psicologia Ltda. terá whatsapp_enabled = true.

-- Adicionar coluna whatsapp_enabled
ALTER TABLE public.organizations
ADD COLUMN whatsapp_enabled BOOLEAN NOT NULL DEFAULT false;

-- Habilitar WhatsApp apenas para a Espaço Mindware Psicologia Ltda.
UPDATE public.organizations
SET whatsapp_enabled = true
WHERE id = 'e5083a3e-d802-43c5-b281-2d504182a06d'
  OR cnpj = '41709325000125'
  OR legal_name = 'Espaço Mindware Psicologia Ltda.';

-- Adicionar comentário para documentação
COMMENT ON COLUMN public.organizations.whatsapp_enabled IS 'FASE W2: Controla se a organização pode usar integração de WhatsApp. Apenas organizações habilitadas podem enviar mensagens via WhatsApp.';