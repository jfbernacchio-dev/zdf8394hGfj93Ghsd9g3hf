-- Tabela para gestão de incidentes de segurança
CREATE TABLE public.security_incidents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Informações do incidente
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  incident_type TEXT NOT NULL CHECK (incident_type IN (
    'data_breach',           -- Vazamento de dados
    'unauthorized_access',   -- Acesso não autorizado
    'system_failure',        -- Falha de sistema
    'malware',              -- Malware/vírus
    'phishing',             -- Phishing
    'ddos',                 -- Ataque DDoS
    'physical_security',    -- Segurança física
    'policy_violation',     -- Violação de política
    'other'                 -- Outro
  )),
  
  -- Classificação
  severity TEXT NOT NULL CHECK (severity IN (
    'critical',  -- Crítico - requer notificação ANPD
    'high',      -- Alto
    'medium',    -- Médio
    'low'        -- Baixo
  )),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'reported' CHECK (status IN (
    'reported',      -- Reportado
    'investigating', -- Em investigação
    'contained',     -- Contido
    'resolved',      -- Resolvido
    'closed'        -- Fechado
  )),
  
  -- Dados afetados
  affected_data_types TEXT[],  -- tipos de dados afetados
  affected_users_count INTEGER DEFAULT 0,
  data_sensitivity TEXT CHECK (data_sensitivity IN ('public', 'internal', 'confidential', 'restricted')),
  
  -- Resposta ao incidente
  containment_actions TEXT,
  resolution_actions TEXT,
  preventive_measures TEXT,
  
  -- ANPD
  requires_anpd_notification BOOLEAN DEFAULT false,
  anpd_notified_at TIMESTAMP WITH TIME ZONE,
  anpd_notification_details TEXT,
  
  -- Datas importantes
  detected_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  contained_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  
  -- Evidências e notas
  evidence_links TEXT[],
  internal_notes TEXT
);

-- Enable RLS
ALTER TABLE public.security_incidents ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Apenas admins podem acessar
CREATE POLICY "Admins can view all incidents"
ON public.security_incidents
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert incidents"
ON public.security_incidents
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update incidents"
ON public.security_incidents
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete incidents"
ON public.security_incidents
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger para atualizar updated_at
CREATE TRIGGER update_security_incidents_updated_at
BEFORE UPDATE ON public.security_incidents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Índices para performance
CREATE INDEX idx_security_incidents_severity ON public.security_incidents(severity);
CREATE INDEX idx_security_incidents_status ON public.security_incidents(status);
CREATE INDEX idx_security_incidents_detected_at ON public.security_incidents(detected_at DESC);