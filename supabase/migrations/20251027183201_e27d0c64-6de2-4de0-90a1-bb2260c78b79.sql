-- Add RLS policies for patient-files storage bucket to allow downloads

-- Policy for users to download files of their own patients
CREATE POLICY "Users can download files of their patients"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'patient-files' 
  AND (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id::text = (storage.foldername(name))[1]
      AND patients.user_id = auth.uid()
    )
  )
);

-- Policy for admins to download files of their subordinates' patients
CREATE POLICY "Admins can download files of subordinates patients"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'patient-files' 
  AND (
    EXISTS (
      SELECT 1 FROM patients
      JOIN profiles ON profiles.id = patients.user_id
      WHERE patients.id::text = (storage.foldername(name))[1]
      AND profiles.created_by = auth.uid()
    )
  )
);