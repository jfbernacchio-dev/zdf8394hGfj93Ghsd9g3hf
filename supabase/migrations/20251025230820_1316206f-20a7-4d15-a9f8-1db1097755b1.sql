-- Allow admins to create schedule blocks for their subordinate therapists
CREATE POLICY "Admins can create blocks for their therapists"
ON public.schedule_blocks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = schedule_blocks.user_id
      AND profiles.created_by = auth.uid()
  )
);

-- Allow admins to view schedule blocks of their subordinate therapists
CREATE POLICY "Admins can view blocks of their therapists"
ON public.schedule_blocks
FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = schedule_blocks.user_id
      AND profiles.created_by = auth.uid()
  )
);

-- Allow admins to delete schedule blocks of their subordinate therapists
CREATE POLICY "Admins can delete blocks of their therapists"
ON public.schedule_blocks
FOR DELETE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE profiles.id = schedule_blocks.user_id
      AND profiles.created_by = auth.uid()
  )
);