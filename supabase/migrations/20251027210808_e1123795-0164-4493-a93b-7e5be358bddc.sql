-- Create invoice_logs table to store generated invoice texts
CREATE TABLE public.invoice_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  invoice_text TEXT NOT NULL,
  session_ids UUID[] NOT NULL,
  patient_count INTEGER NOT NULL,
  total_sessions INTEGER NOT NULL,
  total_value NUMERIC NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.invoice_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for invoice_logs
CREATE POLICY "Users can view their own invoice logs"
ON public.invoice_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoice logs"
ON public.invoice_logs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view invoice logs of their subordinates
CREATE POLICY "Admins can view logs of their therapists"
ON public.invoice_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = invoice_logs.user_id
    AND profiles.created_by = auth.uid()
  )
);

-- Create index for better performance
CREATE INDEX idx_invoice_logs_user_id ON public.invoice_logs(user_id);
CREATE INDEX idx_invoice_logs_created_at ON public.invoice_logs(created_at DESC);