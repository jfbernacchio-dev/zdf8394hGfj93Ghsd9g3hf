-- Permitir que Terapeutas Full (não subordinados) vejam quais usuários são accountants
CREATE POLICY "Non-subordinate users can view accountant roles"
ON public.user_roles
FOR SELECT
USING (
  role = 'accountant' 
  AND auth.uid() IS NOT NULL 
  AND NOT is_subordinate(auth.uid())
);