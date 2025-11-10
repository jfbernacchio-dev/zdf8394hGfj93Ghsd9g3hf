-- Create table for user layout preferences
CREATE TABLE IF NOT EXISTS public.user_layout_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  layout_type TEXT NOT NULL CHECK (layout_type IN ('dashboard', 'patient-detail', 'evolution')),
  layout_config JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id, layout_type)
);

-- Enable RLS
ALTER TABLE public.user_layout_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own layout preferences"
  ON public.user_layout_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own layout preferences"
  ON public.user_layout_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own layout preferences"
  ON public.user_layout_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own layout preferences"
  ON public.user_layout_preferences
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_user_layout_preferences_updated_at
  BEFORE UPDATE ON public.user_layout_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_user_layout_preferences_user_id ON public.user_layout_preferences(user_id);
CREATE INDEX idx_user_layout_preferences_type ON public.user_layout_preferences(user_id, layout_type);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_layout_preferences;