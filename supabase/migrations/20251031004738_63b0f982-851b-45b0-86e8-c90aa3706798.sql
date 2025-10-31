-- Add column to control minor text in NFSe
ALTER TABLE public.patients
ADD COLUMN include_minor_text boolean DEFAULT false;