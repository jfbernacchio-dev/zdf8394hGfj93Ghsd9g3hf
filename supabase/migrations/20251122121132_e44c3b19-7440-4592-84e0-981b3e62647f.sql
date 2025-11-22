-- FASE 12.3.4: Fix profiles RLS for admin and org-based access
-- ============================================================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "profiles_admin_all" ON public.profiles;
DROP POLICY IF EXISTS "profiles_org_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_own_update" ON public.profiles;

-- Policy 1: Admin tem acesso total a todos os profiles
CREATE POLICY "profiles_admin_all"
ON public.profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy 2: Usuários podem ver profiles da mesma organização
CREATE POLICY "profiles_org_select"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL
  AND organization_id = current_user_organization()
);

-- Policy 3: Usuários podem ver e atualizar seu próprio perfil
CREATE POLICY "profiles_own_access"
ON public.profiles
FOR ALL
TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- Garantir que RLS está habilitado
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;