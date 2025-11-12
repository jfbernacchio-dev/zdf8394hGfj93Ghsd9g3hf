-- Create user_layout_templates table
CREATE TABLE user_layout_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  template_name text NOT NULL,
  is_default boolean DEFAULT false,
  layout_snapshot jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_template_name UNIQUE(user_id, template_name)
);

-- Enable RLS
ALTER TABLE user_layout_templates ENABLE ROW LEVEL SECURITY;

-- Users can view their own templates
CREATE POLICY "Users can view their own templates"
ON user_layout_templates
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own templates
CREATE POLICY "Users can insert their own templates"
ON user_layout_templates
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own templates
CREATE POLICY "Users can update their own templates"
ON user_layout_templates
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own templates
CREATE POLICY "Users can delete their own templates"
ON user_layout_templates
FOR DELETE
USING (auth.uid() = user_id);

-- Admins can view templates of their subordinates
CREATE POLICY "Admins can view templates of subordinates"
ON user_layout_templates
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = user_layout_templates.user_id
    AND profiles.created_by = auth.uid()
  )
);

-- Trigger to update updated_at
CREATE TRIGGER update_layout_templates_updated_at
BEFORE UPDATE ON user_layout_templates
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_user_layout_templates_user_id ON user_layout_templates(user_id);
CREATE INDEX idx_user_layout_templates_default ON user_layout_templates(user_id, is_default) WHERE is_default = true;