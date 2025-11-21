-- FASE 10.3: Adicionar organization_id na tabela profiles
-- Objetivo: Permitir resolução automática da organização de qualquer usuário

-- 1) Adicionar coluna organization_id em profiles
ALTER TABLE profiles
  ADD COLUMN organization_id uuid NULL;

-- 2) Criar índice para melhor performance
CREATE INDEX idx_profiles_organization_id ON profiles(organization_id);

-- 3) Comentário explicativo
COMMENT ON COLUMN profiles.organization_id IS 'FASE 10.3: Organização resolvida automaticamente. Pode ser preenchida via ownership direto ou herança hierárquica.';