-- Grant accountants full access to nfse_config for managing fiscal settings
CREATE POLICY "Accountants can insert nfse config"
ON public.nfse_config
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Accountants can update nfse config"
ON public.nfse_config
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'accountant'::app_role));

-- Grant accountants access to manage certificates
CREATE POLICY "Accountants can view all certificates"
ON public.nfse_certificates
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Accountants can insert certificates"
ON public.nfse_certificates
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Accountants can update certificates"
ON public.nfse_certificates
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'accountant'::app_role));

CREATE POLICY "Accountants can delete certificates"
ON public.nfse_certificates
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'accountant'::app_role));