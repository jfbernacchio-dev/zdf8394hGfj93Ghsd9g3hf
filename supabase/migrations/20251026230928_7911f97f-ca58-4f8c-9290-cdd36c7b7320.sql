-- Fix foreign key constraint for admin_access_log to allow patient deletion
-- Drop the existing constraint
ALTER TABLE admin_access_log 
DROP CONSTRAINT IF EXISTS admin_access_log_accessed_patient_id_fkey;

-- Recreate with ON DELETE SET NULL to preserve audit logs
ALTER TABLE admin_access_log
ADD CONSTRAINT admin_access_log_accessed_patient_id_fkey 
FOREIGN KEY (accessed_patient_id) 
REFERENCES patients(id) 
ON DELETE SET NULL;