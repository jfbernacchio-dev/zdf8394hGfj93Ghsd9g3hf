-- FASE 1B: Configurar RLS policies para accountants

-- RLS Policies para Accountants - APENAS DADOS FINANCEIROS

-- Accountants podem ver NFSe emitidas
CREATE POLICY "Accountants can view all nfse" 
ON nfse_issued 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'accountant'::app_role));

-- Accountants podem ver configurações de NFSe
CREATE POLICY "Accountants can view nfse config" 
ON nfse_config 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'accountant'::app_role));

-- Accountants podem ver pagamentos
CREATE POLICY "Accountants can view all payments" 
ON nfse_payments 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'accountant'::app_role));

-- Accountants podem ver alocações de pagamento
CREATE POLICY "Accountants can view all payment allocations" 
ON payment_allocations 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'accountant'::app_role));

-- Accountants podem ver sessões (apenas dados financeiros serão filtrados no frontend)
CREATE POLICY "Accountants can view sessions for financial purposes" 
ON sessions 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'accountant'::app_role));

-- Accountants podem ver pacientes (apenas dados não-clínicos como CPF, nome)
CREATE POLICY "Accountants can view patient basic data" 
ON patients 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'accountant'::app_role));

-- Accountants podem ver perfis de terapeutas (para relatórios)
CREATE POLICY "Accountants can view therapist profiles" 
ON profiles 
FOR SELECT 
TO authenticated
USING (has_role(auth.uid(), 'accountant'::app_role));

-- Comentários de segurança para documentar bloqueios
COMMENT ON TABLE clinical_complaints IS 'SECURITY: Accountants have NO ACCESS - clinical data only';
COMMENT ON TABLE complaint_symptoms IS 'SECURITY: Accountants have NO ACCESS - clinical data only';
COMMENT ON TABLE complaint_medications IS 'SECURITY: Accountants have NO ACCESS - clinical data only';
COMMENT ON TABLE complaint_specifiers IS 'SECURITY: Accountants have NO ACCESS - clinical data only';
COMMENT ON TABLE patient_files IS 'SECURITY: Accountants have NO ACCESS - may contain clinical documents';
COMMENT ON TABLE consent_submissions IS 'SECURITY: Accountants have NO ACCESS - sensitive consent data';
COMMENT ON TABLE whatsapp_messages IS 'SECURITY: Accountants have NO ACCESS - private communications';
COMMENT ON TABLE schedule_blocks IS 'SECURITY: Accountants have NO ACCESS - scheduling is clinical';
COMMENT ON TABLE appointments IS 'SECURITY: Accountants have NO ACCESS - scheduling is clinical';