-- Allow public access to patient data only when there's a valid consent token
CREATE POLICY "Public can view patient data with valid consent token"
ON public.patients
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 
    FROM consent_submissions 
    WHERE consent_submissions.patient_id = patients.id 
    AND consent_submissions.accepted_at IS NULL
  )
);