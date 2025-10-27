-- Adicionar novas colunas à tabela patients
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS no_nfse BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS monthly_price BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS session_day_2 TEXT,
ADD COLUMN IF NOT EXISTS session_time_2 TEXT;

-- Tornar CPF nullable
ALTER TABLE public.patients
ALTER COLUMN cpf DROP NOT NULL;

-- Atualizar a função de validação para não exigir CPF
CREATE OR REPLACE FUNCTION public.validate_patient_data()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Validate CPF check digits only if CPF is provided
  IF NEW.cpf IS NOT NULL AND NEW.cpf != '' THEN
    IF NOT validate_cpf(NEW.cpf) THEN
      RAISE EXCEPTION 'CPF inválido: dígitos verificadores incorretos';
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
  
  RETURN NEW;
END;
$function$;