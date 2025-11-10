-- Create layout_backups table for automatic backups
CREATE TABLE IF NOT EXISTS public.layout_backups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  layout_type TEXT NOT NULL CHECK (layout_type IN ('dashboard', 'patient-detail', 'evolution')),
  layout_config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  version INTEGER NOT NULL DEFAULT 1
);

-- Create layout_profiles table for manual profiles
CREATE TABLE IF NOT EXISTS public.layout_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  layout_type TEXT NOT NULL CHECK (layout_type IN ('dashboard', 'patient-detail', 'evolution')),
  profile_name TEXT NOT NULL,
  layout_config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.layout_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.layout_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for layout_backups
CREATE POLICY "Users can view their own backups"
  ON public.layout_backups FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own backups"
  ON public.layout_backups FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backups"
  ON public.layout_backups FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for layout_profiles
CREATE POLICY "Users can view their own profiles"
  ON public.layout_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profiles"
  ON public.layout_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles"
  ON public.layout_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profiles"
  ON public.layout_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX idx_layout_backups_user_type ON public.layout_backups(user_id, layout_type);
CREATE INDEX idx_layout_backups_created ON public.layout_backups(created_at DESC);
CREATE INDEX idx_layout_profiles_user_type ON public.layout_profiles(user_id, layout_type);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.layout_backups;
ALTER PUBLICATION supabase_realtime ADD TABLE public.layout_profiles;