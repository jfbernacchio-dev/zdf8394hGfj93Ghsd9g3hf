-- Add server-side validation constraints for patient data
-- This prevents injection attacks and ensures data integrity

-- Add length constraints to patient fields
ALTER TABLE public.patients
  ADD CONSTRAINT patients_name_length CHECK (char_length(name) <= 100 AND char_length(name) > 0),
  ADD CONSTRAINT patients_phone_length CHECK (char_length(phone) <= 20 AND char_length(phone) > 0),
  ADD CONSTRAINT patients_email_length CHECK (char_length(email) <= 255 AND char_length(email) > 0),
  ADD CONSTRAINT patients_cpf_format CHECK (cpf ~ '^\d{11}$'),
  ADD CONSTRAINT patients_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  ADD CONSTRAINT patients_session_value_positive CHECK (session_value > 0 AND session_value <= 100000);

-- Add length constraints to profiles
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_name_length CHECK (char_length(full_name) <= 100 AND char_length(full_name) > 0),
  ADD CONSTRAINT profiles_cpf_format CHECK (cpf ~ '^\d{11}$'),
  ADD CONSTRAINT profiles_crp_length CHECK (char_length(crp) <= 20);

-- Add validation for NFSe config fields
ALTER TABLE public.nfse_config
  ADD CONSTRAINT nfse_config_cnpj_format CHECK (cnpj ~ '^\d{14}$' OR cnpj IS NULL),
  ADD CONSTRAINT nfse_config_iss_rate_valid CHECK (iss_rate >= 0 AND iss_rate <= 100),
  ADD CONSTRAINT nfse_config_razao_social_length CHECK (char_length(razao_social) <= 200 OR razao_social IS NULL);

-- Add validation for session notes
ALTER TABLE public.sessions
  ADD CONSTRAINT sessions_notes_length CHECK (char_length(notes) <= 5000 OR notes IS NULL),
  ADD CONSTRAINT sessions_value_positive CHECK (value > 0 AND value <= 100000);

-- Create function to validate CPF check digits
CREATE OR REPLACE FUNCTION public.validate_cpf(cpf_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cpf text;
  sum1 integer := 0;
  sum2 integer := 0;
  digit1 integer;
  digit2 integer;
  i integer;
BEGIN
  -- Remove non-numeric characters
  cpf := regexp_replace(cpf_input, '\D', '', 'g');
  
  -- Check length
  IF length(cpf) != 11 THEN
    RETURN false;
  END IF;
  
  -- Check for known invalid CPFs (all same digits)
  IF cpf IN ('00000000000', '11111111111', '22222222222', '33333333333',
             '44444444444', '55555555555', '66666666666', '77777777777',
             '88888888888', '99999999999') THEN
    RETURN false;
  END IF;
  
  -- Calculate first check digit
  FOR i IN 1..9 LOOP
    sum1 := sum1 + (substring(cpf, i, 1)::integer * (11 - i));
  END LOOP;
  
  digit1 := 11 - (sum1 % 11);
  IF digit1 >= 10 THEN
    digit1 := 0;
  END IF;
  
  -- Calculate second check digit
  FOR i IN 1..10 LOOP
    sum2 := sum2 + (substring(cpf, i, 1)::integer * (12 - i));
  END LOOP;
  
  digit2 := 11 - (sum2 % 11);
  IF digit2 >= 10 THEN
    digit2 := 0;
  END IF;
  
  -- Verify both check digits
  RETURN substring(cpf, 10, 1)::integer = digit1 AND substring(cpf, 11, 1)::integer = digit2;
END;
$$;

-- Create trigger function for patient validation
CREATE OR REPLACE FUNCTION public.validate_patient_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate CPF check digits
  IF NOT validate_cpf(NEW.cpf) THEN
    RAISE EXCEPTION 'CPF inválido: dígitos verificadores incorretos';
  END IF;
  
  -- Sanitize text fields (remove control characters)
  NEW.name := regexp_replace(NEW.name, '[[:cntrl:]]', '', 'g');
  NEW.email := lower(trim(NEW.email));
  NEW.phone := regexp_replace(NEW.phone, '[[:cntrl:]]', '', 'g');
  
  RETURN NEW;
END;
$$;

-- Create trigger for patient validation
DROP TRIGGER IF EXISTS validate_patient_before_insert ON public.patients;
CREATE TRIGGER validate_patient_before_insert
  BEFORE INSERT OR UPDATE ON public.patients
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_patient_data();

-- Create trigger function for profile validation
CREATE OR REPLACE FUNCTION public.validate_profile_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate CPF check digits
  IF NOT validate_cpf(NEW.cpf) THEN
    RAISE EXCEPTION 'CPF inválido: dígitos verificadores incorretos';
  END IF;
  
  -- Sanitize text fields
  NEW.full_name := regexp_replace(NEW.full_name, '[[:cntrl:]]', '', 'g');
  NEW.crp := regexp_replace(NEW.crp, '[[:cntrl:]]', '', 'g');
  
  RETURN NEW;
END;
$$;

-- Create trigger for profile validation
DROP TRIGGER IF EXISTS validate_profile_before_insert ON public.profiles;
CREATE TRIGGER validate_profile_before_insert
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_profile_data();

-- Add audit logging table for admin access to patient data
CREATE TABLE IF NOT EXISTS public.admin_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL REFERENCES auth.users(id),
  accessed_user_id uuid REFERENCES auth.users(id),
  accessed_patient_id uuid REFERENCES public.patients(id),
  access_type text NOT NULL, -- 'patient_view', 'session_view', 'file_view', 'nfse_view'
  access_reason text,
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on audit log
ALTER TABLE public.admin_access_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON public.admin_access_log
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

-- Anyone authenticated can insert (for logging purposes)
CREATE POLICY "Authenticated users can insert audit logs"
  ON public.admin_access_log
  FOR INSERT
  WITH CHECK (auth.uid() = admin_id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_admin_access_log_admin_id ON public.admin_access_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_access_log_created_at ON public.admin_access_log(created_at DESC);