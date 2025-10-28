-- Update the handle_new_user function to include work hours fields
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
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
    slot_duration
  )
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'cpf',
    new.raw_user_meta_data->>'crp',
    (new.raw_user_meta_data->>'birth_date')::date,
    (new.raw_user_meta_data->>'created_by')::uuid,
    COALESCE(
      (SELECT array_agg(elem::integer) 
       FROM jsonb_array_elements_text(new.raw_user_meta_data->'work_days') elem),
      ARRAY[1,2,3,4,5]
    ),
    COALESCE(new.raw_user_meta_data->>'work_start_time', '08:00'),
    COALESCE(new.raw_user_meta_data->>'work_end_time', '18:00'),
    COALESCE((new.raw_user_meta_data->>'slot_duration')::integer, 60)
  );
  RETURN new;
END;
$$;