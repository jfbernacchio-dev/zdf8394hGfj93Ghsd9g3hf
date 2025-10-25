-- Create table for schedule blocks
CREATE TABLE public.schedule_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  day_of_week INTEGER NOT NULL, -- 1=Monday, 2=Tuesday, etc
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.schedule_blocks ENABLE ROW LEVEL SECURITY;

-- Users can manage their own blocks
CREATE POLICY "Users can view their own blocks"
ON public.schedule_blocks
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own blocks"
ON public.schedule_blocks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own blocks"
ON public.schedule_blocks
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own blocks"
ON public.schedule_blocks
FOR DELETE
USING (auth.uid() = user_id);