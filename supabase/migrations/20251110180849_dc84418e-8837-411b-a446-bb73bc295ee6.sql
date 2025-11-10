-- Drop the existing layout_profiles table and recreate with new structure
DROP TABLE IF EXISTS layout_profiles;

-- Create new layout_profiles table that stores ALL layouts in one profile
CREATE TABLE layout_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  profile_name text NOT NULL,
  layout_configs jsonb NOT NULL, -- Stores all layout types: { dashboard: {...}, patient-detail: {...}, evolution: {...} }
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE layout_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own profiles"
  ON layout_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profiles"
  ON layout_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profiles"
  ON layout_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profiles"
  ON layout_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE layout_profiles;