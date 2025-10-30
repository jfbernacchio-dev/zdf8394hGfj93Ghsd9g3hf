-- Add new columns to patients table for consent management
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS is_minor BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS guardian_cpf TEXT,
ADD COLUMN IF NOT EXISTS guardian_name TEXT,
ADD COLUMN IF NOT EXISTS privacy_policy_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at TIMESTAMP WITH TIME ZONE;

-- Update the validation trigger to also validate guardian CPF when patient is minor
CREATE OR REPLACE FUNCTION public.validate_patient_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate patient CPF check digits only if CPF is provided
  IF NEW.cpf IS NOT NULL AND NEW.cpf != '' THEN
    IF NOT validate_cpf(NEW.cpf) THEN
      RAISE EXCEPTION 'CPF inválido: dígitos verificadores incorretos';
    END IF;
  END IF;
  
  -- Validate guardian CPF if patient is minor and guardian CPF is provided
  IF NEW.is_minor = true AND NEW.guardian_cpf IS NOT NULL AND NEW.guardian_cpf != '' THEN
    IF NOT validate_cpf(NEW.guardian_cpf) THEN
      RAISE EXCEPTION 'CPF do responsável inválido: dígitos verificadores incorretos';
    END IF;
  END IF;
  
  -- Sanitize text fields (remove control characters)
  NEW.name := regexp_replace(NEW.name, '[[:cntrl:]]', '', 'g');
  IF NEW.email IS NOT NULL THEN
    NEW.email := lower(trim(NEW.email));
  END IF;
  IF NEW.phone IS NOT NULL THEN
    NEW.phone := regexp_replace(NEW.phone, '[[:cntrl:]]', '', 'g');
  END IF;
  IF NEW.guardian_name IS NOT NULL THEN
    NEW.guardian_name := regexp_replace(NEW.guardian_name, '[[:cntrl:]]', '', 'g');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create table to store consent form submissions
CREATE TABLE IF NOT EXISTS public.consent_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  submission_type TEXT NOT NULL, -- 'adult' or 'minor'
  accepted_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT,
  guardian_document_path TEXT, -- only for minors
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.consent_submissions ENABLE ROW LEVEL SECURITY;

-- RLS policies for consent_submissions
CREATE POLICY "Users can view consent submissions for their patients"
ON public.consent_submissions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = consent_submissions.patient_id
    AND patients.user_id = auth.uid()
  )
);

CREATE POLICY "Users can insert consent submissions for their patients"
ON public.consent_submissions
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = consent_submissions.patient_id
    AND patients.user_id = auth.uid()
  )
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_consent_submissions_patient_id 
ON consent_submissions(patient_id);