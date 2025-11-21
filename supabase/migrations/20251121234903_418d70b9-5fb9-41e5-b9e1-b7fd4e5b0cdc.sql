-- ============================================================================
-- FASE 11.3.2: RLS para organization_owners e organizations
-- ============================================================================
-- 
-- Adicionar RLS básico para tabelas de organização multi-empresa
--

-- 1. Ativar RLS em organization_owners
ALTER TABLE public.organization_owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_owners FORCE ROW LEVEL SECURITY;

-- Admin vê tudo
CREATE POLICY "organization_owners_admin_all"
ON public.organization_owners
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Usuários podem ver suas próprias relações
CREATE POLICY "organization_owners_own_select"
ON public.organization_owners
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Usuários podem criar relações para si mesmos (criar nova org)
CREATE POLICY "organization_owners_own_insert"
ON public.organization_owners
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- 2. Ativar RLS em organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations FORCE ROW LEVEL SECURITY;

-- Admin vê tudo
CREATE POLICY "organizations_admin_all"
ON public.organizations
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Owners podem ver suas organizações
CREATE POLICY "organizations_owner_select"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_owners.organization_id = organizations.id
      AND organization_owners.user_id = auth.uid()
  )
);

-- Usuários podem criar organizações (via SetupOrganization)
CREATE POLICY "organizations_create"
ON public.organizations
FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Owners podem atualizar suas organizações
CREATE POLICY "organizations_owner_update"
ON public.organizations
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_owners.organization_id = organizations.id
      AND organization_owners.user_id = auth.uid()
      AND organization_owners.is_primary = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_owners
    WHERE organization_owners.organization_id = organizations.id
      AND organization_owners.user_id = auth.uid()
      AND organization_owners.is_primary = true
  )
);