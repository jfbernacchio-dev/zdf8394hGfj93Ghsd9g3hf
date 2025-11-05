-- Fix Function Search Path Mutable warning
-- Update set_audit_log_retention function to have immutable search_path

CREATE OR REPLACE FUNCTION public.set_audit_log_retention()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.retention_until := NEW.created_at + interval '12 months';
  RETURN NEW;
END;
$$;