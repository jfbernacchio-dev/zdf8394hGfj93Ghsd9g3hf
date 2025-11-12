-- Criar tabela de pedidos de subordinação pendentes
CREATE TABLE IF NOT EXISTS public.accountant_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  therapist_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  accountant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(therapist_id, accountant_id, status)
);

-- Habilitar RLS
ALTER TABLE public.accountant_requests ENABLE ROW LEVEL SECURITY;

-- Terapeutas podem ver seus próprios pedidos
CREATE POLICY "Therapists can view their own requests"
ON public.accountant_requests
FOR SELECT
USING (auth.uid() = therapist_id);

-- Terapeutas podem criar seus próprios pedidos
CREATE POLICY "Therapists can create their own requests"
ON public.accountant_requests
FOR INSERT
WITH CHECK (auth.uid() = therapist_id AND status = 'pending');

-- Contadores podem ver pedidos para eles
CREATE POLICY "Accountants can view requests to them"
ON public.accountant_requests
FOR SELECT
USING (auth.uid() = accountant_id);

-- Contadores podem atualizar pedidos para eles (aprovar/rejeitar)
CREATE POLICY "Accountants can update requests to them"
ON public.accountant_requests
FOR UPDATE
USING (auth.uid() = accountant_id);

-- Admins podem ver todos os pedidos
CREATE POLICY "Admins can view all requests"
ON public.accountant_requests
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Criar índices para performance
CREATE INDEX idx_accountant_requests_therapist ON public.accountant_requests(therapist_id);
CREATE INDEX idx_accountant_requests_accountant ON public.accountant_requests(accountant_id);
CREATE INDEX idx_accountant_requests_status ON public.accountant_requests(status);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_accountant_requests_updated_at
  BEFORE UPDATE ON public.accountant_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();