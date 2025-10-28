-- Add working hours configuration to profiles table
ALTER TABLE public.profiles
ADD COLUMN work_days integer[] DEFAULT ARRAY[1,2,3,4,5], -- Segunda a Sexta por padrão
ADD COLUMN work_start_time text DEFAULT '08:00',
ADD COLUMN work_end_time text DEFAULT '18:00',
ADD COLUMN slot_duration integer DEFAULT 60; -- Duração em minutos de cada slot

COMMENT ON COLUMN public.profiles.work_days IS 'Dias da semana que o terapeuta trabalha (0=Domingo, 6=Sábado)';
COMMENT ON COLUMN public.profiles.work_start_time IS 'Horário de início do expediente';
COMMENT ON COLUMN public.profiles.work_end_time IS 'Horário de fim do expediente';
COMMENT ON COLUMN public.profiles.slot_duration IS 'Duração de cada sessão em minutos';