-- ============================================================================
-- FASE 1: REFATORAÇÃO DO SISTEMA DE PERMISSÕES
-- Objetivo: Preparar infraestrutura para modelo baseado em:
--   - Roles globais simples (admin, psychologist, accountant, assistant)
--   - Permissões configuradas por nível organizacional
-- ============================================================================

-- ============================================================================
-- 1. AJUSTAR ENUM DE ROLES GLOBAIS
-- ============================================================================

-- Adicionar novos valores ao enum app_role
-- NOTA: Os valores 'therapist' e 'fulltherapist' serão DESCONTINUADOS nas próximas fases
--       mas mantidos por enquanto para não quebrar funcionalidades existentes

DO $$ 
BEGIN
  -- Adicionar 'psychologist' se não existir
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'psychologist' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE app_role ADD VALUE 'psychologist';
  END IF;
  
  -- Adicionar 'assistant' se não existir  
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'assistant' AND enumtypid = 'app_role'::regtype) THEN
    ALTER TYPE app_role ADD VALUE 'assistant';
  END IF;
END $$;

-- ============================================================================
-- 2. CRIAR TABELA DE PERMISSÕES POR NÍVEL: level_role_settings
-- ============================================================================

CREATE TABLE IF NOT EXISTS level_role_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID NOT NULL REFERENCES organization_levels(id) ON DELETE CASCADE,
  role_type app_role NOT NULL,

  -- Permissões gerais por domínio
  can_access_clinical BOOLEAN NOT NULL DEFAULT FALSE,
  financial_access TEXT NOT NULL DEFAULT 'none' CHECK (financial_access IN ('none', 'summary', 'full')),
  can_access_marketing BOOLEAN NOT NULL DEFAULT FALSE,
  can_access_whatsapp BOOLEAN NOT NULL DEFAULT FALSE,

  -- NFSe / empresa usada para faturamento
  uses_org_company_for_nfse BOOLEAN NOT NULL DEFAULT FALSE,

  -- Visibilidade clínica vertical (superiores)
  clinical_visible_to_superiors BOOLEAN NOT NULL DEFAULT FALSE,

  -- Compartilhamento horizontal entre pares do mesmo nível
  peer_agenda_sharing BOOLEAN NOT NULL DEFAULT FALSE,
  peer_clinical_sharing TEXT NOT NULL DEFAULT 'none' CHECK (peer_clinical_sharing IN ('none', 'view', 'full')),

  -- Permissões mais típicas de Secretária (assistant)
  can_edit_schedules BOOLEAN NOT NULL DEFAULT FALSE,
  can_view_team_financial_summary BOOLEAN NOT NULL DEFAULT FALSE,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Garantir apenas uma configuração por nível + tipo de role
  UNIQUE (level_id, role_type)
);

-- Comentário explicativo na tabela
COMMENT ON TABLE level_role_settings IS 'Define permissões padrão para cada combinação de nível organizacional + tipo de role. Substitui o sistema antigo de subordinate_autonomy_settings.';

-- ============================================================================
-- 3. CRIAR TRIGGER PARA ATUALIZAR updated_at
-- ============================================================================

CREATE TRIGGER update_level_role_settings_updated_at
  BEFORE UPDATE ON level_role_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. HABILITAR RLS NA TABELA
-- ============================================================================

ALTER TABLE level_role_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 5. CRIAR POLICIES DE RLS
-- ============================================================================

-- Policy 1: Admins podem ver todas as configurações de permissão por nível
CREATE POLICY "Admins can view all level role settings"
  ON level_role_settings
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- Policy 2: Donos de organização podem gerenciar configurações dos seus níveis
CREATE POLICY "Organization owners can manage level role settings"
  ON level_role_settings
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM organization_levels
      WHERE organization_levels.id = level_role_settings.level_id
        AND organization_levels.organization_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM organization_levels
      WHERE organization_levels.id = level_role_settings.level_id
        AND organization_levels.organization_id = auth.uid()
    )
  );

-- Policy 3: Usuários autenticados podem visualizar configurações de permissão
CREATE POLICY "Authenticated users can view level role settings"
  ON level_role_settings
  FOR SELECT
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- ============================================================================
-- FIM DA MIGRATION - FASE 1
-- ============================================================================