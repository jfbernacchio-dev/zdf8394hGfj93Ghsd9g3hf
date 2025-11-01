-- Add hide_from_schedule column to patients table
ALTER TABLE patients 
ADD COLUMN hide_from_schedule boolean DEFAULT false;