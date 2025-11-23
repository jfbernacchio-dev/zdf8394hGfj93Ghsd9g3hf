-- FASE 1.2: Adicionar campo professional_role_id na tabela profiles
-- Link opcional entre usuário e seu role profissional (psicólogo, psiquiatra, etc.)

ALTER TABLE public.profiles
ADD COLUMN professional_role_id UUID NULL
REFERENCES public.professional_roles(id) ON DELETE SET NULL;

-- Criar índice para otimizar buscas por professional_role_id
CREATE INDEX idx_profiles_professional_role_id ON public.profiles(professional_role_id);

-- Comentário explicativo
COMMENT ON COLUMN public.profiles.professional_role_id IS 'Role profissional do usuário (ex: psicólogo, psiquiatra, nutricionista). NULL = ainda não definido ou não aplicável.';