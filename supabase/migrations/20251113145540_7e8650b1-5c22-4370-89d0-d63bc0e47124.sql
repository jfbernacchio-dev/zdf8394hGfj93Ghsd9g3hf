-- Allow accountants to view subordinates of their assigned therapists
CREATE POLICY "Accountants can view subordinates of their therapists"
ON therapist_assignments FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM accountant_therapist_assignments ata
    WHERE ata.accountant_id = auth.uid()
    AND ata.therapist_id = therapist_assignments.manager_id
  )
);