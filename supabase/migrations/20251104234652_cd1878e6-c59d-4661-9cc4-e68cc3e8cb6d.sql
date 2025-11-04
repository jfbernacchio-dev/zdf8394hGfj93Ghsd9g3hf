-- Drop the old constraint
ALTER TABLE public.sessions 
DROP CONSTRAINT sessions_status_check;

-- Add the new constraint with 'unscheduled' included
ALTER TABLE public.sessions 
ADD CONSTRAINT sessions_status_check 
CHECK (status = ANY (ARRAY['scheduled'::text, 'attended'::text, 'missed'::text, 'rescheduled'::text, 'unscheduled'::text]));