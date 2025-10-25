-- Create storage bucket for patient files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patient-files',
  'patient-files',
  false,
  52428800, -- 50MB
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'audio/mpeg',
    'audio/wav',
    'audio/mp3',
    'audio/m4a',
    'audio/x-m4a'
  ]
);

-- Create patient_files table
CREATE TABLE public.patient_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  category TEXT NOT NULL,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID NOT NULL,
  CONSTRAINT fk_patient FOREIGN KEY (patient_id) REFERENCES public.patients(id) ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.patient_files ENABLE ROW LEVEL SECURITY;

-- RLS Policies for patient_files table
CREATE POLICY "Users can view files of their patients"
  ON public.patient_files
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = patient_files.patient_id
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert files for their patients"
  ON public.patient_files
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = patient_files.patient_id
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files of their patients"
  ON public.patient_files
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id = patient_files.patient_id
      AND patients.user_id = auth.uid()
    )
  );

-- Admins can view files of subordinates' patients
CREATE POLICY "Admins can view files of subordinates patients"
  ON public.patient_files
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients
      JOIN profiles ON profiles.id = patients.user_id
      WHERE patients.id = patient_files.patient_id
      AND profiles.created_by = auth.uid()
    )
  );

-- Storage RLS Policies
CREATE POLICY "Users can upload files for their patients"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'patient-files'
    AND EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id::text = (storage.foldername(name))[1]
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view files of their patients"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'patient-files'
    AND EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id::text = (storage.foldername(name))[1]
      AND patients.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete files of their patients"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'patient-files'
    AND EXISTS (
      SELECT 1 FROM patients
      WHERE patients.id::text = (storage.foldername(name))[1]
      AND patients.user_id = auth.uid()
    )
  );

-- Admins can view files from subordinates' patients
CREATE POLICY "Admins can view subordinate patient files"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'patient-files'
    AND EXISTS (
      SELECT 1 FROM patients
      JOIN profiles ON profiles.id = patients.user_id
      WHERE patients.id::text = (storage.foldername(name))[1]
      AND profiles.created_by = auth.uid()
    )
  );