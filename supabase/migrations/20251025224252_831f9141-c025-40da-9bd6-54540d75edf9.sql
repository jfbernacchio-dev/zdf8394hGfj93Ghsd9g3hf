-- Create table for therapist journal/notifications
CREATE TABLE public.therapist_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  therapist_id UUID NOT NULL,
  admin_id UUID NOT NULL,
  type TEXT NOT NULL, -- 'system', 'message', 'patient_change', 'session_change', 'schedule_block_change', 'reschedule'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for notification preferences
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL,
  therapist_id UUID NOT NULL,
  patient_changes BOOLEAN NOT NULL DEFAULT true,
  session_changes BOOLEAN NOT NULL DEFAULT true,
  schedule_blocks BOOLEAN NOT NULL DEFAULT true,
  reschedules BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(admin_id, therapist_id)
);

-- Enable RLS
ALTER TABLE public.therapist_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Policies for therapist_notifications
CREATE POLICY "Admins can view notifications for their therapists"
ON public.therapist_notifications
FOR SELECT
USING (
  admin_id = auth.uid() OR 
  therapist_id = auth.uid()
);

CREATE POLICY "Admins can insert notifications"
ON public.therapist_notifications
FOR INSERT
WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
ON public.therapist_notifications
FOR UPDATE
USING (therapist_id = auth.uid() OR admin_id = auth.uid());

-- Policies for notification_preferences
CREATE POLICY "Admins can view their notification preferences"
ON public.notification_preferences
FOR SELECT
USING (admin_id = auth.uid());

CREATE POLICY "Admins can insert their notification preferences"
ON public.notification_preferences
FOR INSERT
WITH CHECK (admin_id = auth.uid());

CREATE POLICY "Admins can update their notification preferences"
ON public.notification_preferences
FOR UPDATE
USING (admin_id = auth.uid());

-- Add trigger for updated_at
CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();