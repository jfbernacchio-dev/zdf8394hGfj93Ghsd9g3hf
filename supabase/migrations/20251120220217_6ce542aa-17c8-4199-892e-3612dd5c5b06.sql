-- ============================================================================
-- FASE 6: PEER SHARING - Compartilhamento entre pares na hierarquia
-- ============================================================================

-- Tabela para configuração de compartilhamento no nível
-- "Todos do nível X compartilham domínios Y com todos do nível X"
CREATE TABLE IF NOT EXISTS public.level_sharing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level_id UUID NOT NULL REFERENCES public.organization_levels(id) ON DELETE CASCADE,
  shared_domains TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(level_id)
);

-- Tabela para compartilhamento individual entre pares
-- "Usuário A compartilha domínios específicos com usuário B"
CREATE TABLE IF NOT EXISTS public.peer_sharing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sharer_user_id UUID NOT NULL, -- Quem está compartilhando
  receiver_user_id UUID NOT NULL, -- Quem recebe o compartilhamento
  shared_domains TEXT[] NOT NULL DEFAULT '{}', -- Domínios compartilhados
  is_bidirectional BOOLEAN NOT NULL DEFAULT false, -- Se true, B também compartilha os mesmos domínios com A
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(sharer_user_id, receiver_user_id)
);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_level_sharing_config_updated_at
  BEFORE UPDATE ON public.level_sharing_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_peer_sharing_updated_at
  BEFORE UPDATE ON public.peer_sharing
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE public.level_sharing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_sharing ENABLE ROW LEVEL SECURITY;

-- Level Sharing Config: Organization owners podem gerenciar
CREATE POLICY "Organization owners can manage level sharing"
  ON public.level_sharing_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM organization_levels
      WHERE organization_levels.id = level_sharing_config.level_id
        AND organization_levels.organization_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_levels
      WHERE organization_levels.id = level_sharing_config.level_id
        AND organization_levels.organization_id = auth.uid()
    )
  );

-- Admins podem ver todas as configurações
CREATE POLICY "Admins can view all level sharing configs"
  ON public.level_sharing_config
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Usuários podem ver configurações de seu próprio nível
CREATE POLICY "Users can view their level sharing config"
  ON public.level_sharing_config
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_positions up
      JOIN organization_positions op ON op.id = up.position_id
      WHERE up.user_id = auth.uid()
        AND op.level_id = level_sharing_config.level_id
    )
  );

-- Peer Sharing: Usuários podem criar compartilhamentos se estão no mesmo nível
CREATE POLICY "Users can create peer sharing in their level"
  ON public.peer_sharing
  FOR INSERT
  WITH CHECK (
    auth.uid() = sharer_user_id
    AND EXISTS (
      SELECT 1
      FROM user_positions up1
      JOIN organization_positions op1 ON op1.id = up1.position_id
      JOIN user_positions up2 ON up2.user_id = receiver_user_id
      JOIN organization_positions op2 ON op2.id = up2.position_id
      WHERE up1.user_id = auth.uid()
        AND op1.level_id = op2.level_id
    )
  );

-- Usuários podem atualizar compartilhamentos que criaram
CREATE POLICY "Users can update their own peer sharing"
  ON public.peer_sharing
  FOR UPDATE
  USING (auth.uid() = sharer_user_id);

-- Usuários podem deletar compartilhamentos que criaram
CREATE POLICY "Users can delete their own peer sharing"
  ON public.peer_sharing
  FOR DELETE
  USING (auth.uid() = sharer_user_id);

-- Usuários podem ver compartilhamentos onde são sharer ou receiver
CREATE POLICY "Users can view peer sharing involving them"
  ON public.peer_sharing
  FOR SELECT
  USING (
    auth.uid() = sharer_user_id 
    OR auth.uid() = receiver_user_id
  );

-- Admins podem ver todos os compartilhamentos
CREATE POLICY "Admins can view all peer sharing"
  ON public.peer_sharing
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Organization owners podem ver compartilhamentos em sua organização
CREATE POLICY "Organization owners can view peer sharing in their org"
  ON public.peer_sharing
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM user_positions up
      JOIN organization_positions op ON op.id = up.position_id
      JOIN organization_levels ol ON ol.id = op.level_id
      WHERE up.user_id = sharer_user_id
        AND ol.organization_id = auth.uid()
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Função para obter domínios compartilhados entre dois usuários
CREATE OR REPLACE FUNCTION get_peer_shared_domains(
  _requesting_user_id UUID,
  _target_user_id UUID
)
RETURNS TEXT[]
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_level_domains TEXT[] := '{}';
  v_peer_domains TEXT[] := '{}';
  v_final_domains TEXT[];
BEGIN
  -- 1. Verificar se estão no mesmo nível e há configuração de compartilhamento de nível
  SELECT COALESCE(lsc.shared_domains, '{}')
  INTO v_level_domains
  FROM user_positions up1
  JOIN organization_positions op1 ON op1.id = up1.position_id
  JOIN user_positions up2 ON up2.user_id = _target_user_id
  JOIN organization_positions op2 ON op2.id = up2.position_id
  LEFT JOIN level_sharing_config lsc ON lsc.level_id = op1.level_id
  WHERE up1.user_id = _requesting_user_id
    AND op1.level_id = op2.level_id;

  -- 2. Verificar compartilhamento individual de peer
  -- Target compartilha com Requesting
  SELECT COALESCE(ps.shared_domains, '{}')
  INTO v_peer_domains
  FROM peer_sharing ps
  WHERE ps.sharer_user_id = _target_user_id
    AND ps.receiver_user_id = _requesting_user_id;

  -- Se não encontrou, verificar se é bidirecional (Requesting compartilha com Target)
  IF v_peer_domains = '{}' THEN
    SELECT COALESCE(ps.shared_domains, '{}')
    INTO v_peer_domains
    FROM peer_sharing ps
    WHERE ps.sharer_user_id = _requesting_user_id
      AND ps.receiver_user_id = _target_user_id
      AND ps.is_bidirectional = true;
  END IF;

  -- 3. Combinar domínios (união de level + peer)
  v_final_domains := ARRAY(
    SELECT DISTINCT unnest(v_level_domains || v_peer_domains)
  );

  RETURN v_final_domains;
END;
$$;

-- Função para verificar se um usuário pode ver dados de peer em um domínio específico
CREATE OR REPLACE FUNCTION can_view_peer_data(
  _requesting_user_id UUID,
  _target_user_id UUID,
  _domain TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_shared_domains TEXT[];
BEGIN
  -- Obter domínios compartilhados
  v_shared_domains := get_peer_shared_domains(_requesting_user_id, _target_user_id);
  
  -- Verificar se o domínio está na lista
  RETURN _domain = ANY(v_shared_domains);
END;
$$;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_level_sharing_config_level_id 
  ON public.level_sharing_config(level_id);

CREATE INDEX IF NOT EXISTS idx_peer_sharing_sharer 
  ON public.peer_sharing(sharer_user_id);

CREATE INDEX IF NOT EXISTS idx_peer_sharing_receiver 
  ON public.peer_sharing(receiver_user_id);

CREATE INDEX IF NOT EXISTS idx_peer_sharing_both 
  ON public.peer_sharing(sharer_user_id, receiver_user_id);

-- Comentários para documentação
COMMENT ON TABLE public.level_sharing_config IS 
  'Configuração de compartilhamento no nível organizacional - todos do nível compartilham os mesmos domínios';

COMMENT ON TABLE public.peer_sharing IS 
  'Compartilhamento individual entre pares específicos na organização';

COMMENT ON FUNCTION get_peer_shared_domains IS 
  'Retorna array de domínios que target_user compartilha com requesting_user (considerando nível + peer)';

COMMENT ON FUNCTION can_view_peer_data IS 
  'Verifica se requesting_user pode ver dados de target_user no domínio específico';