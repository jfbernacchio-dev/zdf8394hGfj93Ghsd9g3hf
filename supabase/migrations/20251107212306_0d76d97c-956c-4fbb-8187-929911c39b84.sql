-- Add new status 'nfse_issued' for sessions
-- This will be used when NFSe is issued but payment not yet confirmed

-- Create nfse_payments table to track all payments received
CREATE TABLE IF NOT EXISTS public.nfse_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_date DATE NOT NULL,
  amount NUMERIC NOT NULL CHECK (amount > 0),
  payment_method TEXT NOT NULL,
  proof_file_path TEXT,
  has_proof BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create payment_allocations table for N:N relationship between payments and NFSes
CREATE TABLE IF NOT EXISTS public.payment_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID NOT NULL REFERENCES public.nfse_payments(id) ON DELETE CASCADE,
  nfse_id UUID NOT NULL REFERENCES public.nfse_issued(id) ON DELETE CASCADE,
  allocated_amount NUMERIC NOT NULL CHECK (allocated_amount > 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.nfse_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_allocations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for nfse_payments
CREATE POLICY "Users can view their own payments"
  ON public.nfse_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
  ON public.nfse_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments"
  ON public.nfse_payments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payments"
  ON public.nfse_payments FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view payments of their therapists"
  ON public.nfse_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = nfse_payments.user_id
      AND profiles.created_by = auth.uid()
    )
  );

-- RLS Policies for payment_allocations
CREATE POLICY "Users can view their own allocations"
  ON public.payment_allocations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM nfse_payments
      WHERE nfse_payments.id = payment_allocations.payment_id
      AND nfse_payments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own allocations"
  ON public.payment_allocations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM nfse_payments
      WHERE nfse_payments.id = payment_allocations.payment_id
      AND nfse_payments.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own allocations"
  ON public.payment_allocations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM nfse_payments
      WHERE nfse_payments.id = payment_allocations.payment_id
      AND nfse_payments.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view allocations of their therapists"
  ON public.payment_allocations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM nfse_payments
      JOIN profiles ON profiles.id = nfse_payments.user_id
      WHERE nfse_payments.id = payment_allocations.payment_id
      AND profiles.created_by = auth.uid()
    )
  );

-- Add indexes for performance
CREATE INDEX idx_nfse_payments_user_id ON public.nfse_payments(user_id);
CREATE INDEX idx_nfse_payments_payment_date ON public.nfse_payments(payment_date);
CREATE INDEX idx_payment_allocations_payment_id ON public.payment_allocations(payment_id);
CREATE INDEX idx_payment_allocations_nfse_id ON public.payment_allocations(nfse_id);

-- Add trigger for updated_at
CREATE TRIGGER update_nfse_payments_updated_at
  BEFORE UPDATE ON public.nfse_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check if NFSe is fully paid and update session status
CREATE OR REPLACE FUNCTION public.check_nfse_payment_status()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  nfse_record RECORD;
  total_allocated NUMERIC;
BEGIN
  -- Get the NFSe record
  SELECT * INTO nfse_record
  FROM nfse_issued
  WHERE id = NEW.nfse_id;

  -- Calculate total allocated for this NFSe
  SELECT COALESCE(SUM(allocated_amount), 0) INTO total_allocated
  FROM payment_allocations
  WHERE nfse_id = NEW.nfse_id;

  -- If fully paid, update sessions to 'paid'
  IF total_allocated >= nfse_record.net_value THEN
    UPDATE sessions
    SET status = 'paid', paid = true
    WHERE id = ANY(nfse_record.session_ids)
    AND status = 'nfse_issued';
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger to check payment status after allocation
CREATE TRIGGER check_payment_status_after_allocation
  AFTER INSERT ON public.payment_allocations
  FOR EACH ROW
  EXECUTE FUNCTION public.check_nfse_payment_status();