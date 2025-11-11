-- Ajustar validação de profile para permitir CPF vazio
CREATE OR REPLACE FUNCTION public.validate_profile_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Se CPF foi fornecido, validar os dígitos verificadores
  IF NEW.cpf IS NOT NULL AND NEW.cpf != '' THEN
    IF NOT validate_cpf(NEW.cpf) THEN
      RAISE EXCEPTION 'CPF inválido: dígitos verificadores incorretos';
    END IF;
  END IF;
  
  -- Sanitizar campos de texto
  NEW.full_name := regexp_replace(NEW.full_name, '[[:cntrl:]]', '', 'g');
  NEW.crp := regexp_replace(NEW.crp, '[[:cntrl:]]', '', 'g');
  
  RETURN NEW;
END;
$function$;