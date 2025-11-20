-- ============================================================================
-- FASE 1: MODELO DE DADOS ORGANIZACIONAIS
-- ============================================================================
-- OBJETIVO: Criar estrutura paralela sem afetar sistema atual
-- DATA: 2025
-- 
-- TABELAS CRIADAS:
-- 1. organization_levels - Define níveis hierárquicos (1, 2, 3...)
-- 2. organization_positions - Posições específicas na árvore
-- 3. user_positions - Liga usuários às posições
-- 4. level_permission_sets - Permissões por nível
-- ============================================================================

-- ============================================================================
-- 1. TABELA: organization_levels
-- ============================================================================
-- Representa os níveis hierárquicos de uma organização
-- Ex: Nível 1 = "Diretor Clínico", Nível 2 = "Supervisor", Nível 3 = "Terapeuta"

CREATE TABLE IF NOT EXISTS public.organization_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identificação da organização (baseado no user_id do dono)
  organization_id UUID NOT NULL,
  
  -- Número do nível (1 = topo, 2, 3, 4... = hierarquia descendente)
  level_number INTEGER NOT NULL CHECK (level_number >= 1 AND level_number <= 10),
  
  -- Nome customizável do nível
  level_name TEXT NOT NULL,
  
  -- Descrição opcional
  description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  UNIQUE(organization_id, level_number),
  UNIQUE(organization_id, level_name)
);

COMMENT ON TABLE public.organization_levels IS 'Níveis hierárquicos da organização (1=topo, 2=segundo nível, etc)';
COMMENT ON COLUMN public.organization_levels.organization_id IS 'ID do dono da organização (user_id do proprietário)';
COMMENT ON COLUMN public.organization_levels.level_number IS 'Número do nível (1-10, sendo 1 o topo)';

-- ============================================================================
-- 2. TABELA: organization_positions
-- ============================================================================
-- Representa posições específicas dentro de cada nível
-- Ex: "Supervisor da Clínica Norte" (posição específica no nível 2)

CREATE TABLE IF NOT EXISTS public.organization_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Nível ao qual esta posição pertence
  level_id UUID NOT NULL REFERENCES public.organization_levels(id) ON DELETE CASCADE,
  
  -- Posição pai (NULL = raiz da árvore)
  parent_position_id UUID REFERENCES public.organization_positions(id) ON DELETE SET NULL,
  
  -- Nome da posição (opcional, senão usa level_name)
  position_name TEXT,
  
  -- Descrição
  description TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraint: não pode ser pai de si mesmo
  CHECK (id != parent_position_id)
);

COMMENT ON TABLE public.organization_positions IS 'Posições específicas na hierarquia organizacional';
COMMENT ON COLUMN public.organization_positions.parent_position_id IS 'Posição superior na hierarquia (NULL = raiz)';

-- ============================================================================
-- 3. TABELA: user_positions
-- ============================================================================
-- Liga usuários às suas posições no organograma
-- 1 usuário = 1 posição (V1, sem múltiplas posições)

CREATE TABLE IF NOT EXISTS public.user_positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Usuário
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Posição ocupada
  position_id UUID NOT NULL REFERENCES public.organization_positions(id) ON DELETE CASCADE,
  
  -- Acesso temporário (NULL = permanente)
  access_expires_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Um usuário só pode ter UMA posição (V1)
  UNIQUE(user_id)
);

COMMENT ON TABLE public.user_positions IS 'Vincula usuários às suas posições no organograma (1:1)';
COMMENT ON COLUMN public.user_positions.access_expires_at IS 'Data de expiração para acessos temporários (NULL = permanente)';

-- ============================================================================
-- 4. TABELA: level_permission_sets
-- ============================================================================
-- Define permissões por nível (substituirá subordinate_autonomy_settings)

CREATE TABLE IF NOT EXISTS public.level_permission_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Nível ao qual estas permissões se aplicam
  level_id UUID NOT NULL REFERENCES public.organization_levels(id) ON DELETE CASCADE,
  
  -- Domínio de permissão
  domain TEXT NOT NULL CHECK (domain IN ('financial', 'administrative', 'clinical', 'media', 'general', 'charts', 'team')),
  
  -- Nível de acesso
  access_level TEXT NOT NULL CHECK (access_level IN ('none', 'read', 'write', 'full')),
  
  -- PERMISSÕES FINANCEIRAS (migrado de subordinate_autonomy_settings)
  -- Gerencia próprios pacientes?
  manages_own_patients BOOLEAN DEFAULT false,
  
  -- Tem acesso financeiro?
  has_financial_access BOOLEAN DEFAULT false,
  
  -- Modo de emissão NFSe
  nfse_emission_mode TEXT CHECK (nfse_emission_mode IN ('own_company', 'manager_company')) DEFAULT 'own_company',
  
  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Um nível só pode ter UM conjunto de permissões por domínio
  UNIQUE(level_id, domain)
);

COMMENT ON TABLE public.level_permission_sets IS 'Permissões por nível organizacional (substituirá subordinate_autonomy_settings)';
COMMENT ON COLUMN public.level_permission_sets.domain IS 'Domínio de permissão (financial, clinical, administrative, etc)';
COMMENT ON COLUMN public.level_permission_sets.manages_own_patients IS 'Se TRUE, gerencia apenas próprios pacientes (clínico isolado)';
COMMENT ON COLUMN public.level_permission_sets.has_financial_access IS 'Se TRUE, tem acesso ao próprio financeiro';

-- ============================================================================
-- ÍNDICES PARA PERFORMANCE
-- ============================================================================

-- Índices para queries recursivas (preparação para FASE 2)
CREATE INDEX idx_org_positions_parent ON public.organization_positions(parent_position_id) WHERE parent_position_id IS NOT NULL;
CREATE INDEX idx_org_positions_level ON public.organization_positions(level_id);

-- Índices para joins comuns
CREATE INDEX idx_user_positions_user ON public.user_positions(user_id);
CREATE INDEX idx_user_positions_position ON public.user_positions(position_id);
CREATE INDEX idx_level_permissions_level ON public.level_permission_sets(level_id);

-- Índice composto para hierarquia
CREATE INDEX idx_positions_hierarchy ON public.organization_positions(level_id, parent_position_id);

-- Índice para busca por organização
CREATE INDEX idx_org_levels_organization ON public.organization_levels(organization_id);

-- ============================================================================
-- TRIGGERS PARA UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_organization_levels_updated_at
  BEFORE UPDATE ON public.organization_levels
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_positions_updated_at
  BEFORE UPDATE ON public.organization_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_positions_updated_at
  BEFORE UPDATE ON public.user_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_level_permission_sets_updated_at
  BEFORE UPDATE ON public.level_permission_sets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- VALIDAÇÃO: PREVENIR CICLOS NA ÁRVORE (preparação para FASE 2)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.validate_no_cycles_in_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
  v_current_id UUID;
  v_depth INTEGER := 0;
BEGIN
  -- Se não tem parent, não há ciclo
  IF NEW.parent_position_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Verificar se o parent existe e está no mesmo organization
  IF NOT EXISTS (
    SELECT 1 
    FROM organization_positions op1
    JOIN organization_levels ol1 ON ol1.id = op1.level_id
    JOIN organization_levels ol2 ON ol2.id = NEW.level_id
    WHERE op1.id = NEW.parent_position_id
      AND ol1.organization_id = ol2.organization_id
  ) THEN
    RAISE EXCEPTION 'Parent position deve pertencer à mesma organização';
  END IF;
  
  -- Caminhar para cima para detectar ciclos
  v_current_id := NEW.parent_position_id;
  
  WHILE v_current_id IS NOT NULL AND v_depth < 10 LOOP
    -- Se encontramos o próprio ID, há um ciclo
    IF v_current_id = NEW.id THEN
      RAISE EXCEPTION 'Ciclo detectado na hierarquia';
    END IF;
    
    -- Subir um nível
    SELECT parent_position_id INTO v_current_id
    FROM organization_positions
    WHERE id = v_current_id;
    
    v_depth := v_depth + 1;
  END LOOP;
  
  -- Limite de profundidade
  IF v_depth >= 10 THEN
    RAISE EXCEPTION 'Hierarquia excede profundidade máxima de 10 níveis';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER prevent_cycles_in_positions
  BEFORE INSERT OR UPDATE ON public.organization_positions
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_no_cycles_in_hierarchy();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) - FASE 1: BÁSICO (owner only)
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.organization_levels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.level_permission_sets ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS: organization_levels
-- ============================================================================

-- Donos da organização podem gerenciar seus níveis
CREATE POLICY "Organization owners can manage their levels"
  ON public.organization_levels
  FOR ALL
  USING (organization_id = auth.uid())
  WITH CHECK (organization_id = auth.uid());

-- Admins podem ver todos os níveis
CREATE POLICY "Admins can view all organization levels"
  ON public.organization_levels
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Usuários podem ver níveis da sua organização
CREATE POLICY "Users can view levels of their organization"
  ON public.organization_levels
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_positions up
      JOIN organization_positions op ON op.id = up.position_id
      JOIN organization_levels ol ON ol.id = op.level_id
      WHERE up.user_id = auth.uid()
        AND ol.organization_id = organization_levels.organization_id
    )
  );

-- ============================================================================
-- RLS: organization_positions
-- ============================================================================

-- Donos podem gerenciar posições da sua organização
CREATE POLICY "Organization owners can manage positions"
  ON public.organization_positions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_levels
      WHERE id = organization_positions.level_id
        AND organization_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_levels
      WHERE id = level_id
        AND organization_id = auth.uid()
    )
  );

-- Admins podem ver todas as posições
CREATE POLICY "Admins can view all positions"
  ON public.organization_positions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Usuários podem ver posições da sua organização
CREATE POLICY "Users can view positions in their organization"
  ON public.organization_positions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_positions up
      JOIN organization_positions op ON op.id = up.position_id
      JOIN organization_levels ol ON ol.id = op.level_id
      JOIN organization_levels ol2 ON ol2.organization_id = ol.organization_id
      WHERE up.user_id = auth.uid()
        AND ol2.id = organization_positions.level_id
    )
  );

-- ============================================================================
-- RLS: user_positions
-- ============================================================================

-- Donos podem gerenciar posições de usuários na sua organização
CREATE POLICY "Organization owners can manage user positions"
  ON public.user_positions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_positions op
      JOIN organization_levels ol ON ol.id = op.level_id
      WHERE op.id = user_positions.position_id
        AND ol.organization_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_positions op
      JOIN organization_levels ol ON ol.id = op.level_id
      WHERE op.id = position_id
        AND ol.organization_id = auth.uid()
    )
  );

-- Admins podem ver todas as posições de usuários
CREATE POLICY "Admins can view all user positions"
  ON public.user_positions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Usuários podem ver sua própria posição
CREATE POLICY "Users can view their own position"
  ON public.user_positions
  FOR SELECT
  USING (user_id = auth.uid());

-- Usuários podem ver posições de outros na mesma organização
CREATE POLICY "Users can view positions in their organization"
  ON public.user_positions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_positions up1
      JOIN organization_positions op1 ON op1.id = up1.position_id
      JOIN organization_levels ol1 ON ol1.id = op1.level_id
      JOIN organization_positions op2 ON op2.level_id IN (
        SELECT id FROM organization_levels WHERE organization_id = ol1.organization_id
      )
      WHERE up1.user_id = auth.uid()
        AND op2.id = user_positions.position_id
    )
  );

-- ============================================================================
-- RLS: level_permission_sets
-- ============================================================================

-- Donos podem gerenciar permissões dos níveis da sua organização
CREATE POLICY "Organization owners can manage level permissions"
  ON public.level_permission_sets
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_levels
      WHERE id = level_permission_sets.level_id
        AND organization_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_levels
      WHERE id = level_id
        AND organization_id = auth.uid()
    )
  );

-- Admins podem ver todas as permissões
CREATE POLICY "Admins can view all level permissions"
  ON public.level_permission_sets
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Usuários podem ver permissões dos níveis da sua organização
CREATE POLICY "Users can view permissions in their organization"
  ON public.level_permission_sets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_positions up
      JOIN organization_positions op ON op.id = up.position_id
      JOIN organization_levels ol ON ol.id = op.level_id
      JOIN organization_levels ol2 ON ol2.organization_id = ol.organization_id
      WHERE up.user_id = auth.uid()
        AND ol2.id = level_permission_sets.level_id
    )
  );

-- ============================================================================
-- TRIGGER: VALIDAR ACESSOS TEMPORÁRIOS EXPIRADOS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.check_expired_temporary_access()
RETURNS void AS $$
BEGIN
  -- Remover acessos temporários expirados
  DELETE FROM user_positions
  WHERE access_expires_at IS NOT NULL
    AND access_expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.check_expired_temporary_access IS 'Remove acessos temporários expirados (será chamado por cron job)';

-- ============================================================================
-- FIM DA FASE 1
-- ============================================================================

COMMENT ON SCHEMA public IS 'FASE 1 COMPLETA: Estrutura organizacional criada. Sistema antigo continua funcionando normalmente.';