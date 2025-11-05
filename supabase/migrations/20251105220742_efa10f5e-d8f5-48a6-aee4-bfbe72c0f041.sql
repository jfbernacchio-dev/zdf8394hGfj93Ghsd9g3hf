-- Ensure patient-files bucket exists and is configured
DO $$
BEGIN
  -- Check if bucket exists, if not create it
  IF NOT EXISTS (
    SELECT 1 FROM storage.buckets WHERE id = 'patient-files'
  ) THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('patient-files', 'patient-files', false);
  END IF;
END $$;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their whatsapp media" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view therapists whatsapp media" ON storage.objects;
DROP POLICY IF EXISTS "Service role can upload whatsapp media" ON storage.objects;

-- Create RLS policies for whatsapp-media folder
-- Users can view whatsapp media of their own conversations
CREATE POLICY "Users can view their whatsapp media"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'patient-files' 
  AND name LIKE 'whatsapp-media/%'
  AND EXISTS (
    SELECT 1 FROM whatsapp_messages wm
    JOIN whatsapp_conversations wc ON wc.id = wm.conversation_id
    WHERE wc.user_id = auth.uid()
    AND storage.objects.name LIKE 'whatsapp-media/' || wm.id || '%'
  )
);

-- Admins can view whatsapp media of their therapists
CREATE POLICY "Admins can view therapists whatsapp media"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'patient-files'
  AND name LIKE 'whatsapp-media/%'
  AND EXISTS (
    SELECT 1 FROM whatsapp_messages wm
    JOIN whatsapp_conversations wc ON wc.id = wm.conversation_id
    JOIN profiles p ON p.id = wc.user_id
    WHERE p.created_by = auth.uid()
    AND storage.objects.name LIKE 'whatsapp-media/' || wm.id || '%'
  )
);

-- Service role can insert whatsapp media (used by edge function)
CREATE POLICY "Service role can upload whatsapp media"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'patient-files'
  AND name LIKE 'whatsapp-media/%'
);