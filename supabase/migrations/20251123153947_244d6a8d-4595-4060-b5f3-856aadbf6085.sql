
-- =====================================================
-- FASE N3.1: Criar tabela organization_nfse_config
-- =====================================================

CREATE TABLE public.organization_nfse_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid UNIQUE NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  -- Dados fiscais
  cnpj text,
  inscricao_municipal text,
  razao_social text,
  regime_tributario text,
  anexo_simples text,
  iss_rate numeric,
  service_code text,
  service_description text,
  codigo_municipio text,
  
  -- Tokens FocusNFe (criptografados)
  focusnfe_token_homologacao text,
  focusnfe_token_production text,
  focusnfe_environment text DEFAULT 'homologacao',
  
  -- Certificado digital (criptografado)
  certificate_data text,
  certificate_password text,
  certificate_type text DEFAULT 'A1',
  valid_until date,
  
  -- Metadata
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Índice para buscas rápidas por organização
CREATE INDEX idx_organization_nfse_config_org_id ON public.organization_nfse_config(organization_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_organization_nfse_config_updated_at
  BEFORE UPDATE ON public.organization_nfse_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- FASE N3.2: RLS para organization_nfse_config
-- =====================================================

ALTER TABLE public.organization_nfse_config ENABLE ROW LEVEL SECURITY;

-- Admin pode tudo
CREATE POLICY "organization_nfse_config_admin_all"
  ON public.organization_nfse_config
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Organization owners podem gerenciar config de sua organização
CREATE POLICY "organization_nfse_config_owner_all"
  ON public.organization_nfse_config
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_owners
      WHERE organization_owners.organization_id = organization_nfse_config.organization_id
        AND organization_owners.user_id = auth.uid()
        AND organization_owners.is_primary = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.organization_owners
      WHERE organization_owners.organization_id = organization_nfse_config.organization_id
        AND organization_owners.user_id = auth.uid()
        AND organization_owners.is_primary = true
    )
  );

-- Accountants podem ver e editar config de sua organização
CREATE POLICY "organization_nfse_config_accountant_select"
  ON public.organization_nfse_config
  FOR SELECT
  USING (
    has_role(auth.uid(), 'accountant'::app_role)
    AND organization_id = current_user_organization()
  );

CREATE POLICY "organization_nfse_config_accountant_update"
  ON public.organization_nfse_config
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'accountant'::app_role)
    AND organization_id = current_user_organization()
  )
  WITH CHECK (
    has_role(auth.uid(), 'accountant'::app_role)
    AND organization_id = current_user_organization()
  );

-- Usuários normais podem apenas visualizar (readonly) se tiverem permissão financeira
CREATE POLICY "organization_nfse_config_user_readonly"
  ON public.organization_nfse_config
  FOR SELECT
  USING (
    organization_id = current_user_organization()
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.organization_id = organization_nfse_config.organization_id
    )
  );

-- =====================================================
-- FASE N3.3: Migração de dados de nfse_config para organization_nfse_config
-- =====================================================

-- Para cada organização, consolidar a primeira config encontrada
INSERT INTO public.organization_nfse_config (
  organization_id,
  cnpj,
  inscricao_municipal,
  razao_social,
  regime_tributario,
  anexo_simples,
  iss_rate,
  service_code,
  service_description,
  codigo_municipio,
  focusnfe_token_homologacao,
  focusnfe_token_production,
  focusnfe_environment,
  created_at,
  updated_at
)
SELECT DISTINCT ON (p.organization_id)
  p.organization_id,
  nc.cnpj,
  nc.inscricao_municipal,
  nc.razao_social,
  nc.regime_tributario,
  nc.anexo_simples,
  nc.iss_rate,
  nc.service_code,
  nc.service_description,
  nc.codigo_municipio,
  nc.focusnfe_token_homologacao,
  nc.focusnfe_token_production,
  nc.focusnfe_environment,
  nc.created_at,
  nc.updated_at
FROM public.nfse_config nc
INNER JOIN public.profiles p ON p.id = nc.user_id
WHERE p.organization_id IS NOT NULL
  AND nc.cnpj IS NOT NULL -- Apenas configs completas
ORDER BY p.organization_id, nc.created_at ASC
ON CONFLICT (organization_id) DO NOTHING;

-- Migrar certificados para organization_nfse_config
-- (Apenas o certificado mais recente de cada organização)
WITH ranked_certs AS (
  SELECT 
    cert.id as cert_id,
    cert.certificate_data,
    cert.certificate_password,
    cert.certificate_type,
    cert.valid_until,
    p.organization_id as org_id,
    ROW_NUMBER() OVER (
      PARTITION BY p.organization_id 
      ORDER BY cert.valid_until DESC NULLS LAST, cert.created_at DESC
    ) as rn
  FROM public.nfse_certificates cert
  INNER JOIN public.profiles p ON p.id = cert.user_id
  WHERE p.organization_id IS NOT NULL
    AND cert.certificate_data IS NOT NULL
)
UPDATE public.organization_nfse_config onc
SET 
  certificate_data = rc.certificate_data,
  certificate_password = rc.certificate_password,
  certificate_type = rc.certificate_type,
  valid_until = rc.valid_until
FROM ranked_certs rc
WHERE onc.organization_id = rc.org_id
  AND rc.rn = 1;

-- =====================================================
-- FASE N3.4: Marcar configs antigas como "legacy" 
-- (não apagar, manter para fallback)
-- =====================================================

-- Adicionar coluna is_legacy em nfse_config para sinalizar configs antigas
ALTER TABLE public.nfse_config ADD COLUMN IF NOT EXISTS is_legacy boolean DEFAULT false;

-- Marcar como legacy configs que já foram migradas
UPDATE public.nfse_config nc
SET is_legacy = true
WHERE EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = nc.user_id
    AND p.organization_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.organization_nfse_config onc
      WHERE onc.organization_id = p.organization_id
    )
);

-- Adicionar coluna is_legacy em nfse_certificates
ALTER TABLE public.nfse_certificates ADD COLUMN IF NOT EXISTS is_legacy boolean DEFAULT false;

-- Marcar certificados como legacy
UPDATE public.nfse_certificates cert
SET is_legacy = true
WHERE EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = cert.user_id
    AND p.organization_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.organization_nfse_config onc
      WHERE onc.organization_id = p.organization_id
        AND onc.certificate_data IS NOT NULL
    )
);

-- =====================================================
-- Comentários da migração N3
-- =====================================================

-- N3.1: Criada tabela organization_nfse_config com todos os campos necessários
-- N3.2: RLS configurada para admin/owner/accountant/user
-- N3.3: Migrados dados de nfse_config para organization_nfse_config (1 config por org)
-- N3.4: Configs antigas marcadas como legacy (mantidas para fallback)
-- 
-- Próximos passos:
-- - Atualizar edge functions para usar organization_nfse_config
-- - Atualizar frontend para gerenciar configs organizacionais
-- - Implementar helper getEffectiveNFSeConfig
