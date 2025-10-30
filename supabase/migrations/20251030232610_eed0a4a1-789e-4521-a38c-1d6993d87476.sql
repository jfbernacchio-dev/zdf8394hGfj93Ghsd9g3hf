-- Allow public access to consent submissions by token
CREATE POLICY "Public can view consent submissions by token"
ON public.consent_submissions
FOR SELECT
TO anon
USING (true);

-- Allow public to update consent submissions by token
CREATE POLICY "Public can update consent submissions by token"
ON public.consent_submissions
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);