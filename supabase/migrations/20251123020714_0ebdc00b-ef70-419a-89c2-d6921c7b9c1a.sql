-- FASE 1.1: Criação da tabela professional_roles
-- Tabela de roles profissionais dinâmicos (sem impacto em user_roles existente)

CREATE TABLE public.professional_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  is_clinical BOOLEAN NOT NULL DEFAULT true,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT professional_roles_slug_check CHECK (slug ~ '^[a-z_]+$')
);

-- Índices para performance
CREATE INDEX idx_professional_roles_slug ON public.professional_roles(slug);
CREATE INDEX idx_professional_roles_is_active ON public.professional_roles(is_active);

-- Trigger para updated_at
CREATE TRIGGER update_professional_roles_updated_at
  BEFORE UPDATE ON public.professional_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- RLS Policies
ALTER TABLE public.professional_roles ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ler roles ativos
CREATE POLICY "professional_roles_authenticated_select"
  ON public.professional_roles
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Apenas admin pode gerenciar
CREATE POLICY "professional_roles_admin_all"
  ON public.professional_roles
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Seeder inicial: popular roles profissionais básicos
INSERT INTO public.professional_roles (slug, label, description, is_clinical, is_active)
VALUES 
  ('psychologist', 'Psicólogo(a)', 'Profissional de psicologia clínica', true, true),
  ('psychiatrist', 'Psiquiatra', 'Médico(a) especialista em psiquiatria', true, true),
  ('nutritionist', 'Nutricionista', 'Profissional de nutrição clínica', true, true),
  ('psychoanalyst', 'Psicanalista', 'Profissional de psicanálise', true, true),
  ('occupational_therapist', 'Terapeuta Ocupacional', 'Profissional de terapia ocupacional', true, true),
  ('speech_therapist', 'Fonoaudiólogo(a)', 'Profissional de fonoaudiologia', true, true),
  ('assistant', 'Assistente/Secretária', 'Profissional administrativo de apoio', false, true),
  ('accountant', 'Contador(a)', 'Profissional de contabilidade', false, true)
ON CONFLICT (slug) DO NOTHING;