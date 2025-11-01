-- Add field to patients table to control if second session should be hidden from schedule
ALTER TABLE patients 
ADD COLUMN hide_second_session_from_schedule boolean DEFAULT false;

-- Add field to sessions table to control visibility in schedule
ALTER TABLE sessions 
ADD COLUMN show_in_schedule boolean DEFAULT true;

-- Add index for better query performance
CREATE INDEX idx_sessions_show_in_schedule ON sessions(show_in_schedule) WHERE show_in_schedule = false;

-- Add comment to explain the purpose
COMMENT ON COLUMN patients.hide_second_session_from_schedule IS 'When true, the second weekly session will be hidden from schedule but still counted for billing';
COMMENT ON COLUMN sessions.show_in_schedule IS 'Controls if session appears in schedule view. False means session exists only for billing/history';