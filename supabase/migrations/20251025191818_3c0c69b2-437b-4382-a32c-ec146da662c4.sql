-- Enable pg_cron and pg_net extensions for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the auto-mark-sessions function to run daily at midnight (00:00 UTC)
SELECT cron.schedule(
  'auto-mark-daily-sessions',
  '0 0 * * *', -- At 00:00 every day
  $$
  SELECT
    net.http_post(
        url:='https://klxyilxprlzhxnwjzcvv.supabase.co/functions/v1/auto-mark-sessions',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtseHlpbHhwcmx6aHhud2p6Y3Z2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEzOTEwNzIsImV4cCI6MjA3Njk2NzA3Mn0.7-GyVE44Artgs12Ow2B_W1QHlvs1MsdSQQ25Ggar5Fc"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);