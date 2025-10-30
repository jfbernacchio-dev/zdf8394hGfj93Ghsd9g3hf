-- Enable pg_cron extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the compliance reminders to run daily at 9 AM
SELECT cron.schedule(
  'daily-compliance-reminders',
  '0 9 * * *', -- Every day at 9 AM
  $$
  SELECT
    net.http_post(
        url:='${SUPABASE_URL}/functions/v1/send-compliance-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer ${SUPABASE_ANON_KEY}"}'::jsonb
    ) as request_id;
  $$
);

-- Add 'compliance', 'backup', 'permission', and 'incident' to valid notification categories
ALTER TABLE system_notifications 
DROP CONSTRAINT IF EXISTS system_notifications_category_check;

ALTER TABLE system_notifications 
ADD CONSTRAINT system_notifications_category_check 
CHECK (category IN (
  'security', 'compliance', 'backup', 'audit', 'permission', 
  'incident', 'system', 'scheduling', 'messages', 'team'
));