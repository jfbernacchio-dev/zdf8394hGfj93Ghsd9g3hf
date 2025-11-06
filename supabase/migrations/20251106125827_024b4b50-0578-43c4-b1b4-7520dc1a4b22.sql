-- Add additional guardian fields for minor patients
ALTER TABLE patients
ADD COLUMN IF NOT EXISTS guardian_name_2 text,
ADD COLUMN IF NOT EXISTS guardian_cpf_2 text,
ADD COLUMN IF NOT EXISTS guardian_phone_1 text,
ADD COLUMN IF NOT EXISTS guardian_phone_2 text;