-- Add new fields to profiles table for enhanced profile management
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS send_nfse_to_therapist BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS clinical_approach TEXT;

-- Add comment for documentation
COMMENT ON COLUMN profiles.phone IS 'Therapist phone number for NFSe notifications';
COMMENT ON COLUMN profiles.send_nfse_to_therapist IS 'When true, sends NFSe copy to therapist via email and phone';
COMMENT ON COLUMN profiles.clinical_approach IS 'Clinical approach: TCC, Psicologia Analítica, Psicanálise, Fenomenologia, Behaviorismo';