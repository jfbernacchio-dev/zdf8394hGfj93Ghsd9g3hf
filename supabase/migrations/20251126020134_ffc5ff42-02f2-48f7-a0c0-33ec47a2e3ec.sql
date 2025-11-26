-- Create table for patient overview layout persistence
CREATE TABLE IF NOT EXISTS public.patient_overview_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  patient_id UUID NULL, -- Nullable para suportar layout padrão global
  organization_id UUID NULL,
  layout_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice único para layouts específicos de paciente
CREATE UNIQUE INDEX patient_overview_layouts_patient_unique
  ON public.patient_overview_layouts(user_id, patient_id, organization_id)
  WHERE patient_id IS NOT NULL;

-- Índice único para layout padrão global (sem paciente específico)
CREATE UNIQUE INDEX patient_overview_layouts_default_unique
  ON public.patient_overview_layouts(user_id, organization_id)
  WHERE patient_id IS NULL;

-- Enable RLS
ALTER TABLE public.patient_overview_layouts ENABLE ROW LEVEL SECURITY;

-- Trigger para auto-set organization_id
CREATE OR REPLACE FUNCTION public.auto_set_organization_from_user_for_layouts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.organization_id IS NULL AND NEW.user_id IS NOT NULL THEN
      NEW.organization_id := resolve_organization_for_user(NEW.user_id);
    END IF;
  END IF;
  
  IF TG_OP = 'UPDATE' THEN
    IF OLD.organization_id IS NOT NULL AND NEW.organization_id != OLD.organization_id THEN
      RAISE EXCEPTION 'Cannot change organization_id from % to % in patient_overview_layouts', 
        OLD.organization_id, NEW.organization_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_organization_layouts
  BEFORE INSERT OR UPDATE ON public.patient_overview_layouts
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_set_organization_from_user_for_layouts();

-- Trigger para updated_at
CREATE TRIGGER update_patient_overview_layouts_updated_at
  BEFORE UPDATE ON public.patient_overview_layouts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies

-- Admin pode tudo
CREATE POLICY "patient_overview_layouts_admin_all"
  ON public.patient_overview_layouts
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Owner (dono da organização) pode ver e gerenciar layouts da sua org
CREATE POLICY "patient_overview_layouts_owner_select"
  ON public.patient_overview_layouts
  FOR SELECT
  USING (
    organization_id = current_user_organization()
    AND EXISTS (
      SELECT 1 FROM organization_owners
      WHERE organization_id = patient_overview_layouts.organization_id
        AND user_id = auth.uid()
        AND is_primary = true
    )
  );

CREATE POLICY "patient_overview_layouts_owner_all"
  ON public.patient_overview_layouts
  FOR ALL
  USING (
    organization_id = current_user_organization()
    AND EXISTS (
      SELECT 1 FROM organization_owners
      WHERE organization_id = patient_overview_layouts.organization_id
        AND user_id = auth.uid()
        AND is_primary = true
    )
  )
  WITH CHECK (
    organization_id = current_user_organization()
    AND EXISTS (
      SELECT 1 FROM organization_owners
      WHERE organization_id = patient_overview_layouts.organization_id
        AND user_id = auth.uid()
        AND is_primary = true
    )
  );

-- Usuário pode gerenciar seus próprios layouts
CREATE POLICY "patient_overview_layouts_user_own"
  ON public.patient_overview_layouts
  FOR ALL
  USING (
    user_id = auth.uid()
    AND organization_id = current_user_organization()
  )
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id = current_user_organization()
  );