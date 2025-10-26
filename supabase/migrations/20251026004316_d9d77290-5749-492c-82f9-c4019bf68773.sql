-- Tabela de configurações fiscais NFSe
CREATE TABLE public.nfse_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  inscricao_municipal TEXT,
  cnpj TEXT,
  razao_social TEXT,
  regime_tributario TEXT DEFAULT 'simples_nacional',
  anexo_simples TEXT,
  iss_rate NUMERIC(5,2) DEFAULT 13.45,
  service_code TEXT DEFAULT '05118',
  service_description TEXT DEFAULT 'Atendimento psicológico individual',
  focusnfe_token TEXT,
  focusnfe_environment TEXT DEFAULT 'homologacao',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela de certificados digitais
CREATE TABLE public.nfse_certificates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_data TEXT NOT NULL, -- Armazenado criptografado
  certificate_password TEXT NOT NULL, -- Armazenado criptografado
  certificate_type TEXT DEFAULT 'A1',
  valid_until DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Tabela de notas fiscais emitidas
CREATE TABLE public.nfse_issued (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  nfse_number TEXT,
  verification_code TEXT,
  issue_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  service_value NUMERIC(10,2) NOT NULL,
  iss_value NUMERIC(10,2) NOT NULL,
  net_value NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing', -- processing, issued, error, cancelled
  error_message TEXT,
  focusnfe_ref TEXT, -- Referência no FocusNFe
  xml_url TEXT,
  pdf_url TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.nfse_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfse_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.nfse_issued ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para nfse_config
CREATE POLICY "Users can view their own config"
  ON public.nfse_config FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own config"
  ON public.nfse_config FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own config"
  ON public.nfse_config FOR UPDATE
  USING (auth.uid() = user_id);

-- Políticas RLS para nfse_certificates
CREATE POLICY "Users can view their own certificates"
  ON public.nfse_certificates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own certificates"
  ON public.nfse_certificates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own certificates"
  ON public.nfse_certificates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own certificates"
  ON public.nfse_certificates FOR DELETE
  USING (auth.uid() = user_id);

-- Políticas RLS para nfse_issued
CREATE POLICY "Users can view their own issued nfse"
  ON public.nfse_issued FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own issued nfse"
  ON public.nfse_issued FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own issued nfse"
  ON public.nfse_issued FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view nfse of their therapists"
  ON public.nfse_issued FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = nfse_issued.user_id
      AND profiles.created_by = auth.uid()
    )
  );

-- Triggers para updated_at
CREATE TRIGGER update_nfse_config_updated_at
  BEFORE UPDATE ON public.nfse_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nfse_certificates_updated_at
  BEFORE UPDATE ON public.nfse_certificates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_nfse_issued_updated_at
  BEFORE UPDATE ON public.nfse_issued
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Adicionar campo lgpd_consent_date na tabela patients
ALTER TABLE public.patients 
ADD COLUMN lgpd_consent_date TIMESTAMP WITH TIME ZONE;

-- Adicionar índices para performance
CREATE INDEX idx_nfse_issued_user_id ON public.nfse_issued(user_id);
CREATE INDEX idx_nfse_issued_patient_id ON public.nfse_issued(patient_id);
CREATE INDEX idx_nfse_issued_status ON public.nfse_issued(status);
CREATE INDEX idx_nfse_issued_issue_date ON public.nfse_issued(issue_date DESC);