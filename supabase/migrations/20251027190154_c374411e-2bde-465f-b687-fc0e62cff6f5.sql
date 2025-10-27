-- Remove the old frequency check constraint
ALTER TABLE patients DROP CONSTRAINT IF EXISTS patients_frequency_check;

-- Add new frequency check constraint that includes twice_weekly
ALTER TABLE patients ADD CONSTRAINT patients_frequency_check 
CHECK (frequency IN ('weekly', 'biweekly', 'twice_weekly'));