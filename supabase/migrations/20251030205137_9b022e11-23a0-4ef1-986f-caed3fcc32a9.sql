-- Add new notification categories
ALTER TABLE public.system_notifications 
DROP CONSTRAINT IF EXISTS system_notifications_category_check;

ALTER TABLE public.system_notifications 
ADD CONSTRAINT system_notifications_category_check 
CHECK (category IN ('security', 'compliance', 'backup', 'audit', 'permission', 'incident', 'system', 'scheduling', 'messages', 'team'));

-- Function to notify admin when patient session is rescheduled
CREATE OR REPLACE FUNCTION notify_session_rescheduled()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
  patient_name TEXT;
BEGIN
  -- Get patient name
  SELECT name INTO patient_name
  FROM patients
  WHERE id = NEW.patient_id;

  -- Get admin (therapist who owns the patient)
  SELECT user_id INTO admin_user_id
  FROM patients
  WHERE id = NEW.patient_id;

  -- Insert notification for admin
  INSERT INTO system_notifications (
    user_id,
    title,
    message,
    category,
    severity,
    action_url
  ) VALUES (
    admin_user_id,
    'Reagendamento de Sessão',
    format('A sessão de %s foi reagendada de %s %s para %s %s', 
      patient_name, OLD.old_day, OLD.old_time, NEW.new_day, NEW.new_time),
    'scheduling',
    'info',
    '/patients/' || NEW.patient_id
  );

  RETURN NEW;
END;
$$;

-- Trigger for session rescheduling notifications
DROP TRIGGER IF EXISTS trigger_notify_session_rescheduled ON session_history;
CREATE TRIGGER trigger_notify_session_rescheduled
  AFTER INSERT ON session_history
  FOR EACH ROW
  EXECUTE FUNCTION notify_session_rescheduled();

-- Function to notify admin when subordinate therapist takes actions
CREATE OR REPLACE FUNCTION notify_therapist_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
  therapist_name TEXT;
  patient_name TEXT;
  activity_message TEXT;
BEGIN
  -- Get the admin (creator of the therapist)
  SELECT p.created_by, p.full_name INTO admin_user_id, therapist_name
  FROM profiles p
  JOIN patients pat ON pat.user_id = p.id
  WHERE pat.id = NEW.patient_id;

  -- Only notify if therapist has an admin
  IF admin_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get patient name
  SELECT name INTO patient_name
  FROM patients
  WHERE id = NEW.patient_id;

  -- Build message based on operation
  IF TG_OP = 'INSERT' THEN
    activity_message := format('%s agendou uma nova sessão com %s para %s às %s', 
      therapist_name, patient_name, NEW.date, NEW.time);
  ELSIF TG_OP = 'UPDATE' AND OLD.date != NEW.date OR OLD.time != NEW.time THEN
    activity_message := format('%s reagendou a sessão de %s de %s %s para %s %s', 
      therapist_name, patient_name, OLD.date, OLD.time, NEW.date, NEW.time);
  ELSE
    RETURN NEW;
  END IF;

  -- Insert notification for admin
  INSERT INTO system_notifications (
    user_id,
    title,
    message,
    category,
    severity,
    action_url,
    metadata
  ) VALUES (
    admin_user_id,
    'Atividade da Equipe',
    activity_message,
    'team',
    'info',
    '/patients/' || NEW.patient_id,
    jsonb_build_object(
      'therapist_id', (SELECT user_id FROM patients WHERE id = NEW.patient_id),
      'patient_id', NEW.patient_id,
      'session_id', NEW.id
    )
  );

  RETURN NEW;
END;
$$;

-- Trigger for therapist activity notifications
DROP TRIGGER IF EXISTS trigger_notify_therapist_activity_insert ON sessions;
CREATE TRIGGER trigger_notify_therapist_activity_insert
  AFTER INSERT ON sessions
  FOR EACH ROW
  EXECUTE FUNCTION notify_therapist_activity();

DROP TRIGGER IF EXISTS trigger_notify_therapist_activity_update ON sessions;
CREATE TRIGGER trigger_notify_therapist_activity_update
  AFTER UPDATE ON sessions
  FOR EACH ROW
  WHEN (OLD.date IS DISTINCT FROM NEW.date OR OLD.time IS DISTINCT FROM NEW.time)
  EXECUTE FUNCTION notify_therapist_activity();

-- Function to create notification when schedule block is created by admin for therapist
CREATE OR REPLACE FUNCTION notify_schedule_block()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_id UUID;
  therapist_name TEXT;
  block_message TEXT;
BEGIN
  -- Check if this block was created by an admin (not by the therapist themselves)
  SELECT p.created_by, p.full_name INTO admin_user_id, therapist_name
  FROM profiles p
  WHERE p.id = NEW.user_id;

  -- Only notify therapist if admin created the block
  IF admin_user_id IS NOT NULL AND admin_user_id != NEW.user_id THEN
    block_message := format('Um bloqueio de agenda foi criado para %s às %s', 
      NEW.day_of_week, NEW.start_time);
    
    IF NEW.reason IS NOT NULL THEN
      block_message := block_message || ': ' || NEW.reason;
    END IF;

    -- Notify the therapist
    INSERT INTO system_notifications (
      user_id,
      title,
      message,
      category,
      severity,
      action_url
    ) VALUES (
      NEW.user_id,
      'Bloqueio de Agenda',
      block_message,
      'scheduling',
      'warning',
      '/schedule'
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger for schedule block notifications
DROP TRIGGER IF EXISTS trigger_notify_schedule_block ON schedule_blocks;
CREATE TRIGGER trigger_notify_schedule_block
  AFTER INSERT ON schedule_blocks
  FOR EACH ROW
  EXECUTE FUNCTION notify_schedule_block();