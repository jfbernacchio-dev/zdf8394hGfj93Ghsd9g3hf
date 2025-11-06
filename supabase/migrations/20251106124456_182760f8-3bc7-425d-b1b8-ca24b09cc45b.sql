-- Add DELETE policy for consent_submissions
-- Users can delete consent submissions for their patients (to cancel pending tokens)
CREATE POLICY "Users can delete consent submissions for their patients"
ON consent_submissions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM patients
    WHERE patients.id = consent_submissions.patient_id
    AND patients.user_id = auth.uid()
  )
);