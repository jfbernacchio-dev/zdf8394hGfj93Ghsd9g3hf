-- FASE A1: Infraestrutura de abordagens clínicas

-- 1. Criar tabela clinical_approaches
CREATE TABLE public.clinical_approaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  description TEXT,
  professional_role_id UUID NOT NULL
    REFERENCES public.professional_roles(id) ON DELETE RESTRICT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT clinical_approaches_slug_check CHECK (slug ~ '^[a-z0-9_]+$')
);

CREATE INDEX idx_clinical_approaches_slug ON public.clinical_approaches(slug);
CREATE INDEX idx_clinical_approaches_professional_role_id ON public.clinical_approaches(professional_role_id);
CREATE INDEX idx_clinical_approaches_is_active ON public.clinical_approaches(is_active);

CREATE TRIGGER update_clinical_approaches_updated_at
  BEFORE UPDATE ON public.clinical_approaches
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.clinical_approaches ENABLE ROW LEVEL SECURITY;

-- Todos autenticados podem ler abordagens ativas
CREATE POLICY "clinical_approaches_authenticated_select"
  ON public.clinical_approaches
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Apenas admin pode gerenciar (INSERT/UPDATE/DELETE)
CREATE POLICY "clinical_approaches_admin_all"
  ON public.clinical_approaches
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2. Adicionar coluna clinical_approach_id em profiles
ALTER TABLE public.profiles
ADD COLUMN clinical_approach_id UUID NULL
REFERENCES public.clinical_approaches(id) ON DELETE SET NULL;

CREATE INDEX idx_profiles_clinical_approach_id ON public.profiles(clinical_approach_id);

COMMENT ON COLUMN public.profiles.clinical_approach_id IS
  'Abordagem clínica principal do profissional, referenciando clinical_approaches. A coluna clinical_approach (texto) permanece como legado por enquanto.';

-- 3. Seed inicial de abordagens para 'psychologist'
WITH psychologist_role AS (
  SELECT id
  FROM public.professional_roles
  WHERE slug = 'psychologist'
  LIMIT 1
)
INSERT INTO public.clinical_approaches (slug, label, description, professional_role_id, is_active, is_default)
SELECT
  slug,
  label,
  description,
  (SELECT id FROM psychologist_role),
  true,
  is_default
FROM (
  VALUES
    ('tcc', 'Terapia Cognitivo-Comportamental (TCC)', 'Abordagem estruturada e focada em objetivos, baseada na relação entre pensamentos, emoções e comportamentos.', true),
    ('psicologia_analitica', 'Psicologia Analítica', 'Abordagem junguiana com foco em símbolos, inconsciente coletivo e individuação.', false),
    ('psicanalise', 'Psicanálise', 'Abordagem baseada na teoria freudiana, com foco em inconsciente, transferência e associação livre.', false),
    ('fenomenologia', 'Fenomenologia', 'Abordagem fenomenológica-existencial focada na experiência vivida e no sentido.', false),
    ('behaviorismo', 'Behaviorismo', 'Abordagem focada em análise do comportamento e contingências.', false)
) AS seeds(slug, label, description, is_default)
WHERE (SELECT id FROM psychologist_role) IS NOT NULL
ON CONFLICT (slug) DO NOTHING;