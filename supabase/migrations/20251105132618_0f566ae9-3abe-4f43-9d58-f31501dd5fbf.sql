-- Add DELETE policies for WhatsApp tables

-- Allow users to delete their own conversations
CREATE POLICY "Users can delete their own conversations"
ON whatsapp_conversations
FOR DELETE
USING (auth.uid() = user_id);

-- Allow admins to delete conversations of their therapists
CREATE POLICY "Admins can delete conversations of their therapists"
ON whatsapp_conversations
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = whatsapp_conversations.user_id
    AND profiles.created_by = auth.uid()
  )
);

-- Allow users to delete messages in their conversations
CREATE POLICY "Users can delete messages in their conversations"
ON whatsapp_messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM whatsapp_conversations
    WHERE whatsapp_conversations.id = whatsapp_messages.conversation_id
    AND whatsapp_conversations.user_id = auth.uid()
  )
);

-- Allow admins to delete messages of their therapists conversations
CREATE POLICY "Admins can delete messages of their therapists conversations"
ON whatsapp_messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM whatsapp_conversations wc
    JOIN profiles p ON p.id = wc.user_id
    WHERE wc.id = whatsapp_messages.conversation_id
    AND p.created_by = auth.uid()
  )
);