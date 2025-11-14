-- Adicionar política RLS para permitir que contadores vejam configurações de autonomia
-- dos subordinados dos terapeutas que eles gerenciam

CREATE POLICY "Accountants can view subordinate settings of assigned therapists"
ON subordinate_autonomy_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM accountant_therapist_assignments ata
    WHERE ata.accountant_id = auth.uid()
    AND ata.therapist_id = subordinate_autonomy_settings.manager_id
  )
);