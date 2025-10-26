-- Enhanced handle_new_user with validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  creator_id UUID;
  creator_is_admin BOOLEAN;
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

  -- If created_by exists, validate and assign therapist role
  IF creator_id IS NOT NULL THEN
    -- Validate that creator exists and has admin role
    SELECT EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = creator_id
        AND role = 'admin'::app_role
    ) INTO creator_is_admin;

    -- Only assign therapist role if creator is a valid admin
    IF creator_is_admin THEN
      INSERT INTO public.user_roles (user_id, role)
      VALUES (NEW.id, 'therapist'::app_role);
      
      -- Log the therapist creation for audit trail
      INSERT INTO public.admin_access_log (
        admin_id,
        access_type,
        accessed_user_id,
        access_reason
      ) VALUES (
        creator_id,
        'create_therapist',
        NEW.id,
        'Therapist account created'
      );
    ELSE
      -- Reject the signup if created_by is invalid
      RAISE EXCEPTION 'Invalid creator: user % is not an admin', creator_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;