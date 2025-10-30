-- Remove as políticas públicas inseguras
DROP POLICY IF EXISTS "Public can view consent submissions by token" ON public.consent_submissions;
DROP POLICY IF EXISTS "Public can update consent submissions by token" ON public.consent_submissions;
DROP POLICY IF EXISTS "Public can view patient data with valid consent token" ON public.patients;