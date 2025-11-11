-- Criar tabela de atribuições contador-terapeuta
CREATE TABLE public.accountant_therapist_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accountant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  therapist_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(therapist_id), -- Cada terapeuta pode ter APENAS 1 contador
  UNIQUE(accountant_id, therapist_id) -- Evita duplicatas
);

-- Enable RLS
ALTER TABLE public.accountant_therapist_assignments ENABLE ROW LEVEL SECURITY;

-- Accountants podem ver suas próprias atribuições
CREATE POLICY "Accountants can view their own assignments"
ON public.accountant_therapist_assignments
FOR SELECT
USING (accountant_id = auth.uid());

-- Accountants podem inserir suas próprias atribuições
CREATE POLICY "Accountants can insert their own assignments"
ON public.accountant_therapist_assignments
FOR INSERT
WITH CHECK (accountant_id = auth.uid());

-- Accountants podem deletar suas próprias atribuições
CREATE POLICY "Accountants can delete their own assignments"
ON public.accountant_therapist_assignments
FOR DELETE
USING (accountant_id = auth.uid());

-- Admins podem ver todas as atribuições
CREATE POLICY "Admins can view all assignments"
ON public.accountant_therapist_assignments
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins podem gerenciar todas as atribuições
CREATE POLICY "Admins can manage all assignments"
ON public.accountant_therapist_assignments
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Therapists podem ver quem é seu contador
CREATE POLICY "Therapists can view their accountant"
ON public.accountant_therapist_assignments
FOR SELECT
USING (therapist_id = auth.uid());

-- Trigger para updated_at
CREATE TRIGGER update_accountant_therapist_assignments_updated_at
BEFORE UPDATE ON public.accountant_therapist_assignments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();