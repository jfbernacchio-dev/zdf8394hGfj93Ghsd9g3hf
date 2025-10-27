-- Allow optional fields for patients
ALTER TABLE patients 
ALTER COLUMN birth_date DROP NOT NULL,
ALTER COLUMN start_date DROP NOT NULL,
ALTER COLUMN session_day DROP NOT NULL,
ALTER COLUMN session_time DROP NOT NULL,
ALTER COLUMN email DROP NOT NULL,
ALTER COLUMN phone DROP NOT NULL;