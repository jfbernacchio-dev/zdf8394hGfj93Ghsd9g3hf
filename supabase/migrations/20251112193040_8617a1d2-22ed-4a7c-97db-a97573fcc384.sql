-- Tornar o campo CRP nullable, pois contadores não precisam de CRP (apenas terapeutas)
ALTER TABLE public.profiles 
ALTER COLUMN crp DROP NOT NULL;