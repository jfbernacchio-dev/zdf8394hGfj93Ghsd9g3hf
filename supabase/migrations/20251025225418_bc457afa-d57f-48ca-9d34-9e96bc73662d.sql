-- Add date range fields to schedule_blocks table
ALTER TABLE public.schedule_blocks
ADD COLUMN start_date DATE,
ADD COLUMN end_date DATE;

-- Add comment explaining the date fields
COMMENT ON COLUMN public.schedule_blocks.start_date IS 'Start date for the block (inclusive). If null, applies to all dates.';
COMMENT ON COLUMN public.schedule_blocks.end_date IS 'End date for the block (inclusive). If null, block continues indefinitely from start_date.';