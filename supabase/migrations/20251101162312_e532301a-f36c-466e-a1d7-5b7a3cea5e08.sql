-- Update patient validation function to allow conditional CPF requirements
CREATE OR REPLACE FUNCTION public.validate_patient_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- For adults (not minor), CPF is required
  IF NEW.is_minor = false THEN
    IF NEW.cpf IS NULL OR NEW.cpf = '' THEN
      RAISE EXCEPTION 'CPF do paciente é obrigatório para adultos';
    END IF;
    -- Validate CPF check digits
    IF NOT validate_cpf(NEW.cpf) THEN
      RAISE EXCEPTION 'CPF inválido: dígitos verificadores incorretos';
    END IF;
  END IF;
  
  -- For minors, validation depends on who receives the invoice
  IF NEW.is_minor = true THEN
    -- If invoice goes to guardian, guardian CPF is required
    IF NEW.nfse_issue_to = 'guardian' THEN
      IF NEW.guardian_cpf IS NULL OR NEW.guardian_cpf = '' THEN
        RAISE EXCEPTION 'CPF do responsável é obrigatório quando a NF é emitida em seu nome';
      END IF;
      -- Validate guardian CPF
      IF NOT validate_cpf(NEW.guardian_cpf) THEN
        RAISE EXCEPTION 'CPF do responsável inválido: dígitos verificadores incorretos';
      END IF;
      -- Patient CPF is optional but if provided must be valid
      IF NEW.cpf IS NOT NULL AND NEW.cpf != '' THEN
        IF NOT validate_cpf(NEW.cpf) THEN
          RAISE EXCEPTION 'CPF do paciente inválido: dígitos verificadores incorretos';
        END IF;
      END IF;
    END IF;
    
    -- If invoice goes to patient, patient CPF is required
    IF NEW.nfse_issue_to = 'patient' THEN
      IF NEW.cpf IS NULL OR NEW.cpf = '' THEN
        RAISE EXCEPTION 'CPF do paciente é obrigatório quando a NF é emitida em seu nome';
      END IF;
      -- Validate patient CPF
      IF NOT validate_cpf(NEW.cpf) THEN
        RAISE EXCEPTION 'CPF do paciente inválido: dígitos verificadores incorretos';
      END IF;
      -- Guardian CPF is optional but if provided must be valid
      IF NEW.guardian_cpf IS NOT NULL AND NEW.guardian_cpf != '' THEN
        IF NOT validate_cpf(NEW.guardian_cpf) THEN
          RAISE EXCEPTION 'CPF do responsável inválido: dígitos verificadores incorretos';
        END IF;
      END IF;
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