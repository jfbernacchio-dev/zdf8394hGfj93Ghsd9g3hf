-- Update the handle_new_user function to set created_by and assign therapist role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  creator_id UUID;
BEGIN
  -- Get created_by from user metadata
  creator_id := (NEW.raw_user_meta_data->>'created_by')::UUID;

  -- Insert profile
  INSERT INTO public.profiles (id, full_name, cpf, crp, birth_date, created_by)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'cpf', ''),
    COALESCE(NEW.raw_user_meta_data->>'crp', ''),
    COALESCE((NEW.raw_user_meta_data->>'birth_date')::date, CURRENT_DATE),
    creator_id
  );

  -- If created_by exists, assign therapist role, otherwise assume admin
  IF creator_id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'therapist'::app_role);
  END IF;

  RETURN NEW;
END;
$$;