-- Add RLS policy to allow users to delete their own NFSe entries
CREATE POLICY "Users can delete their own issued nfse" 
ON public.nfse_issued 
FOR DELETE 
USING (auth.uid() = user_id);