-- Add break_time column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN break_time integer DEFAULT 15;

COMMENT ON COLUMN public.profiles.break_time IS 'Tempo de descanso entre sessões em minutos';

-- Update the handle_new_user function to include break_time
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    cpf, 
    crp, 
    birth_date, 
    created_by,
    work_days,
    work_start_time,
    work_end_time,
    slot_duration,
    break_time
  )
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'cpf',
    NEW.raw_user_meta_data->>'crp',
    (NEW.raw_user_meta_data->>'birth_date')::date,
    (NEW.raw_user_meta_data->>'created_by')::uuid,
    CASE 
      WHEN NEW.raw_user_meta_data->>'work_days' IS NOT NULL 
      THEN (SELECT array_agg(value::integer) FROM jsonb_array_elements_text((NEW.raw_user_meta_data->>'work_days')::jsonb) AS value)
      ELSE ARRAY[1, 2, 3, 4, 5]
    END,
    COALESCE(NEW.raw_user_meta_data->>'work_start_time', '08:00'),
    COALESCE(NEW.raw_user_meta_data->>'work_end_time', '18:00'),
    COALESCE((NEW.raw_user_meta_data->>'slot_duration')::integer, 60),
    COALESCE((NEW.raw_user_meta_data->>'break_time')::integer, 15)
  );
  RETURN NEW;
END;
$$;