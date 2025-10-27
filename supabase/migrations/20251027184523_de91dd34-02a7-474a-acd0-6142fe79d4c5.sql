-- Drop existing policies
DROP POLICY IF EXISTS "Users can download files of their patients" ON storage.objects;
DROP POLICY IF EXISTS "Admins can download files of subordinates patients" ON storage.objects;

-- Create correct policies for downloads using the download operation
CREATE POLICY "Users can download files of their patients"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'patient-files' 
  AND (
    EXISTS (
      SELECT 1 FROM patient_files
      JOIN patients ON patients.id = patient_files.patient_id
      WHERE patient_files.file_path = name
      AND patients.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Admins can download files of subordinates patients"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'patient-files' 
  AND (
    EXISTS (
      SELECT 1 FROM patient_files
      JOIN patients ON patients.id = patient_files.patient_id
      JOIN profiles ON profiles.id = patients.user_id
      WHERE patient_files.file_path = name
      AND profiles.created_by = auth.uid()
    )
  )
);