-- Create table for patient clinical complaints
CREATE TABLE public.patient_complaints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  complaint_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  next_review_date DATE NOT NULL,
  dismissed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.patient_complaints ENABLE ROW LEVEL SECURITY;

-- Users can view complaints of their patients
CREATE POLICY "Users can view complaints of their patients"
ON public.patient_complaints
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = patient_complaints.patient_id
    AND patients.user_id = auth.uid()
  )
);

-- Users can insert complaints for their patients
CREATE POLICY "Users can insert complaints for their patients"
ON public.patient_complaints
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = patient_complaints.patient_id
    AND patients.user_id = auth.uid()
  )
);

-- Users can update complaints of their patients
CREATE POLICY "Users can update complaints of their patients"
ON public.patient_complaints
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = patient_complaints.patient_id
    AND patients.user_id = auth.uid()
  )
);

-- Users can delete complaints of their patients
CREATE POLICY "Users can delete complaints of their patients"
ON public.patient_complaints
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = patient_complaints.patient_id
    AND patients.user_id = auth.uid()
  )
);

-- Admins can view complaints of their therapists' patients
CREATE POLICY "Admins can view complaints of subordinates patients"
ON public.patient_complaints
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM patients
    JOIN profiles ON profiles.id = patients.user_id
    WHERE patients.id = patient_complaints.patient_id
    AND profiles.created_by = auth.uid()
  )
);

-- Create index for faster queries
CREATE INDEX idx_patient_complaints_patient_id ON public.patient_complaints(patient_id);
CREATE INDEX idx_patient_complaints_next_review ON public.patient_complaints(next_review_date) WHERE dismissed_at IS NULL;

-- Trigger to update updated_at
CREATE TRIGGER update_patient_complaints_updated_at
BEFORE UPDATE ON public.patient_complaints
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();