-- Create system notifications table
CREATE TABLE public.system_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('security', 'compliance', 'backup', 'audit', 'permission', 'incident', 'system')),
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  read BOOLEAN NOT NULL DEFAULT false,
  action_url TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create log review tracking table
CREATE TABLE public.log_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewed_by UUID NOT NULL REFERENCES auth.users(id),
  review_period_start DATE NOT NULL,
  review_period_end DATE NOT NULL,
  logs_reviewed INTEGER NOT NULL DEFAULT 0,
  findings TEXT,
  actions_taken TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create permission review tracking table
CREATE TABLE public.permission_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewed_by UUID NOT NULL REFERENCES auth.users(id),
  review_date DATE NOT NULL,
  users_reviewed INTEGER NOT NULL DEFAULT 0,
  roles_modified INTEGER NOT NULL DEFAULT 0,
  findings TEXT,
  actions_taken TEXT,
  next_review_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create backup test tracking table
CREATE TABLE public.backup_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_date DATE NOT NULL,
  test_type TEXT NOT NULL DEFAULT 'automated',
  status TEXT NOT NULL CHECK (status IN ('success', 'failed', 'partial')),
  tested_by UUID REFERENCES auth.users(id),
  details TEXT,
  restoration_time_seconds INTEGER,
  data_integrity_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.log_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.permission_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backup_tests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_notifications
CREATE POLICY "Users can view their own notifications"
  ON public.system_notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.system_notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert notifications"
  ON public.system_notifications FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for log_reviews
CREATE POLICY "Admins can view log reviews"
  ON public.log_reviews FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert log reviews"
  ON public.log_reviews FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for permission_reviews
CREATE POLICY "Admins can view permission reviews"
  ON public.permission_reviews FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert permission reviews"
  ON public.permission_reviews FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- RLS Policies for backup_tests
CREATE POLICY "Admins can view backup tests"
  ON public.backup_tests FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert backup tests"
  ON public.backup_tests FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'));