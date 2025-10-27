-- Add DELETE policy for invoice_logs
CREATE POLICY "Users can delete their own invoice logs"
ON invoice_logs
FOR DELETE
USING (auth.uid() = user_id);