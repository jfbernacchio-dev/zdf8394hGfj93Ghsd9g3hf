-- Add fields for alternate contact info for NFSe sending
ALTER TABLE public.patients
ADD COLUMN IF NOT EXISTS use_alternate_nfse_contact boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS nfse_alternate_email text,
ADD COLUMN IF NOT EXISTS nfse_alternate_phone text;