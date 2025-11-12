-- Criar policy para Therapists Full visualizarem profiles de contadores
CREATE POLICY "Therapists Full can view accountants profiles"
ON profiles FOR SELECT
TO authenticated
USING (
  -- O profile sendo visualizado tem role accountant
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = profiles.id 
    AND role = 'accountant'
  )
  -- E quem está visualizando NÃO é subordinado
  AND NOT EXISTS (
    SELECT 1 FROM therapist_assignments
    WHERE subordinate_id = auth.uid()
  )
);