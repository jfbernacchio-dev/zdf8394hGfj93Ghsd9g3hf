-- Enable realtime for system_notifications table
ALTER TABLE public.system_notifications REPLICA IDENTITY FULL;

-- Add system_notifications to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.system_notifications;