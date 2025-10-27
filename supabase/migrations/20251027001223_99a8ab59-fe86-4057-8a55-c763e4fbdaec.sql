-- Fix email constraint to allow null values
ALTER TABLE patients 
DROP CONSTRAINT IF EXISTS patient_email_format;

-- Add new constraint that allows null or valid email
ALTER TABLE patients 
ADD CONSTRAINT patient_email_format 
CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');