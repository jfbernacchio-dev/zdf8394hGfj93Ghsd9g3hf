-- ============================================================================
-- RLS POLICIES para tabela PROFILES
-- ============================================================================
-- Estas políticas permitem:
-- 1. Usuários lerem seu próprio perfil
-- 2. Admins lerem todos os perfis
-- 3. Managers lerem perfis de subordinados
-- 4. Usuários atualizarem seu próprio perfil
-- 5. Admins criarem/atualizarem qualquer perfil
-- ============================================================================

-- Policy 1: Usuários podem ler seu próprio perfil
CREATE POLICY "users_read_own_profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Admins podem ler todos os perfis
CREATE POLICY "admins_read_all_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Policy 3: Managers podem ler perfis de subordinados
CREATE POLICY "managers_read_subordinates_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT subordinate_id 
    FROM public.therapist_assignments 
    WHERE manager_id = auth.uid()
  )
);

-- Policy 4: Usuários podem atualizar seu próprio perfil
CREATE POLICY "users_update_own_profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Policy 5: Admins podem atualizar qualquer perfil
CREATE POLICY "admins_update_all_profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy 6: Admins podem criar perfis (via handle_new_user trigger)
CREATE POLICY "admins_insert_profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Policy 7: Permitir inserção via trigger (SECURITY DEFINER)
CREATE POLICY "allow_service_role_insert"
ON public.profiles
FOR INSERT
TO service_role
WITH CHECK (true);