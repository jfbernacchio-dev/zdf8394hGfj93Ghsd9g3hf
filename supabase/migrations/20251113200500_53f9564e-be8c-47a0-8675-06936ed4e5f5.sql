-- Criar tabela para configurações de autonomia de subordinados
CREATE TABLE IF NOT EXISTS public.subordinate_autonomy_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subordinate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Controles de autonomia
  manages_own_patients BOOLEAN NOT NULL DEFAULT false,
  has_financial_access BOOLEAN NOT NULL DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(subordinate_id)
);

-- Habilitar RLS
ALTER TABLE public.subordinate_autonomy_settings ENABLE ROW LEVEL SECURITY;

-- Managers podem gerenciar settings dos seus subordinados
CREATE POLICY "Managers can manage subordinate settings"
ON public.subordinate_autonomy_settings
FOR ALL
USING (manager_id = auth.uid());

-- Subordinados podem ver suas próprias configurações
CREATE POLICY "Subordinates can view own settings"
ON public.subordinate_autonomy_settings
FOR SELECT
USING (subordinate_id = auth.uid());

-- Trigger para validar que has_financial_access requer manages_own_patients
CREATE OR REPLACE FUNCTION public.validate_autonomy_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- has_financial_access requer manages_own_patients = true
  IF NEW.has_financial_access = true AND NEW.manages_own_patients = false THEN
    RAISE EXCEPTION 'has_financial_access requer manages_own_patients = true';
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_autonomy_settings_trigger
BEFORE INSERT OR UPDATE ON public.subordinate_autonomy_settings
FOR EACH ROW
EXECUTE FUNCTION public.validate_autonomy_settings();

-- Trigger para atualizar updated_at
CREATE TRIGGER update_autonomy_settings_updated_at
BEFORE UPDATE ON public.subordinate_autonomy_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Comentários para documentação
COMMENT ON TABLE public.subordinate_autonomy_settings IS 'Configurações de autonomia para terapeutas subordinados';
COMMENT ON COLUMN public.subordinate_autonomy_settings.manages_own_patients IS 'Se true, o Full só vê lista de pacientes (sem dados clínicos). Se false, Full tem acesso total.';
COMMENT ON COLUMN public.subordinate_autonomy_settings.has_financial_access IS 'Se true, subordinado tem aba Financial e emite NFSe próprias. Requer manages_own_patients = true.';