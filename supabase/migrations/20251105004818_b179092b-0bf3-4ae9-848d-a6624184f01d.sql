-- Tabela para armazenar conversas do WhatsApp
CREATE TABLE public.whatsapp_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  phone_number TEXT NOT NULL,
  contact_name TEXT,
  last_message_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_from TEXT NOT NULL, -- 'patient' or 'therapist'
  window_expires_at TIMESTAMP WITH TIME ZONE, -- 24h window expiration
  status TEXT NOT NULL DEFAULT 'active', -- 'active', 'expired', 'archived'
  unread_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela para armazenar mensagens individuais
CREATE TABLE public.whatsapp_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  whatsapp_message_id TEXT, -- ID da mensagem do WhatsApp
  message_type TEXT NOT NULL, -- 'text', 'document', 'template', 'image', etc.
  direction TEXT NOT NULL, -- 'inbound' or 'outbound'
  content TEXT NOT NULL,
  media_url TEXT,
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'delivered', 'read', 'failed'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB
);

-- Índices para performance
CREATE INDEX idx_whatsapp_conversations_user_id ON public.whatsapp_conversations(user_id);
CREATE INDEX idx_whatsapp_conversations_patient_id ON public.whatsapp_conversations(patient_id);
CREATE INDEX idx_whatsapp_conversations_status ON public.whatsapp_conversations(status);
CREATE INDEX idx_whatsapp_messages_conversation_id ON public.whatsapp_messages(conversation_id);
CREATE INDEX idx_whatsapp_messages_created_at ON public.whatsapp_messages(created_at);

-- Enable RLS
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies para conversations
CREATE POLICY "Users can view their own conversations"
ON public.whatsapp_conversations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own conversations"
ON public.whatsapp_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations"
ON public.whatsapp_conversations FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view conversations of their therapists"
ON public.whatsapp_conversations FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = whatsapp_conversations.user_id
    AND profiles.created_by = auth.uid()
  )
);

-- RLS Policies para messages
CREATE POLICY "Users can view messages of their conversations"
ON public.whatsapp_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM whatsapp_conversations
    WHERE whatsapp_conversations.id = whatsapp_messages.conversation_id
    AND whatsapp_conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert messages in their conversations"
ON public.whatsapp_messages FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM whatsapp_conversations
    WHERE whatsapp_conversations.id = whatsapp_messages.conversation_id
    AND whatsapp_conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update messages in their conversations"
ON public.whatsapp_messages FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM whatsapp_conversations
    WHERE whatsapp_conversations.id = whatsapp_messages.conversation_id
    AND whatsapp_conversations.user_id = auth.uid()
  )
);

CREATE POLICY "Admins can view messages of their therapists conversations"
ON public.whatsapp_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM whatsapp_conversations wc
    JOIN profiles p ON p.id = wc.user_id
    WHERE wc.id = whatsapp_messages.conversation_id
    AND p.created_by = auth.uid()
  )
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_whatsapp_conversations_updated_at
BEFORE UPDATE ON public.whatsapp_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_messages;