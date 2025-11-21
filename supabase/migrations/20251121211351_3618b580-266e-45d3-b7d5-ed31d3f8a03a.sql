-- FASE 10.1: Base de organização / CNPJ / dono da empresa (backend only)
-- Objetivo: Criar estrutura de organizações desacoplada de user_id
-- Importante: NÃO quebrar NFSe, pacientes, agenda, WhatsApp etc.

-- 1) Criar tabela organizations
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cnpj text NOT NULL,
  legal_name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid, -- nullable para permitir criação sem user_id específico
  notes text,
  CONSTRAINT organizations_cnpj_key UNIQUE (cnpj)
);

-- Índice para busca rápida por CNPJ
CREATE INDEX IF NOT EXISTS idx_organizations_cnpj ON organizations(cnpj);
CREATE INDEX IF NOT EXISTS idx_organizations_created_by ON organizations(created_by);

-- 2) Criar tabela organization_owners
CREATE TABLE IF NOT EXISTS organization_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT organization_owners_unique_user_org UNIQUE (organization_id, user_id)
);

-- Índices para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_organization_owners_org ON organization_owners(organization_id);
CREATE INDEX IF NOT EXISTS idx_organization_owners_user ON organization_owners(user_id);
CREATE INDEX IF NOT EXISTS idx_organization_owners_primary ON organization_owners(organization_id, is_primary) WHERE is_primary = true;

-- Trigger para updated_at em organizations
CREATE OR REPLACE FUNCTION update_organizations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_organizations_updated_at();

-- 3) Popular dados iniciais para Espaço Mindware Psicologia Ltda.
-- Inserir organização Mindware de forma idempotente
DO $$
DECLARE
  v_admin_user_id uuid;
  v_mindware_org_id uuid;
  v_mindware_cnpj text := '00000000000000'; -- placeholder padrão
BEGIN
  -- Buscar qualquer usuário admin do sistema (pelo user_roles)
  SELECT user_id INTO v_admin_user_id
  FROM user_roles
  WHERE role = 'admin'
  LIMIT 1;

  -- Se encontrou um admin, tentar buscar CNPJ do nfse_config dele
  IF v_admin_user_id IS NOT NULL THEN
    SELECT cnpj INTO v_mindware_cnpj
    FROM nfse_config
    WHERE user_id = v_admin_user_id
      AND cnpj IS NOT NULL 
      AND cnpj != ''
    LIMIT 1;
  END IF;

  -- Se não encontrou CNPJ válido, manter o placeholder
  IF v_mindware_cnpj IS NULL OR v_mindware_cnpj = '' THEN
    v_mindware_cnpj := '00000000000000';
  END IF;

  -- Inserir organização Mindware se não existir
  INSERT INTO organizations (cnpj, legal_name, created_by, notes)
  VALUES (
    v_mindware_cnpj,
    'Espaço Mindware Psicologia Ltda.',
    v_admin_user_id, -- pode ser NULL se não encontrou admin
    'Organização principal - criada automaticamente na FASE 10.1'
  )
  ON CONFLICT (cnpj) DO NOTHING
  RETURNING id INTO v_mindware_org_id;

  -- Se já existia, buscar o ID
  IF v_mindware_org_id IS NULL THEN
    SELECT id INTO v_mindware_org_id
    FROM organizations
    WHERE cnpj = v_mindware_cnpj;
  END IF;

  -- Adicionar todos os admins como donos da organização
  INSERT INTO organization_owners (organization_id, user_id, is_primary)
  SELECT 
    v_mindware_org_id,
    ur.user_id,
    ROW_NUMBER() OVER (ORDER BY ur.created_at) = 1 as is_primary -- primeiro admin é o principal
  FROM user_roles ur
  WHERE ur.role = 'admin'
  ON CONFLICT (organization_id, user_id) DO NOTHING;

  RAISE NOTICE 'FASE 10.1 concluída: Organização Mindware criada (ID: %), admins adicionados como donos', v_mindware_org_id;
  RAISE NOTICE 'IMPORTANTE: organization_levels NÃO foram atualizados automaticamente. Isso será feito manualmente em próxima fase.';
END $$;

-- RLS: Deixar desabilitado por enquanto (como especificado)
-- Será habilitado em fases futuras

-- Comentário final da migration
COMMENT ON TABLE organizations IS 'FASE 10.1: Tabela de organizações/empresas desacoplada de user_id';
COMMENT ON TABLE organization_owners IS 'FASE 10.1: Donos/proprietários de cada organização';
COMMENT ON COLUMN organization_owners.is_primary IS 'Marca o dono principal/master da organização';
COMMENT ON COLUMN organizations.created_by IS 'User que criou a organização (pode ser NULL)';