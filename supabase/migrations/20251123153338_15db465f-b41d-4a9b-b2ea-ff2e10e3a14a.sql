
-- =====================================================
-- FASE N2.1: Corrigir RLS de accountants em nfse_config
-- =====================================================

-- Remover policies antigas de accountant que não filtram por organization_id
DROP POLICY IF EXISTS "Accountants can view nfse config" ON public.nfse_config;
DROP POLICY IF EXISTS "Accountants can insert nfse config" ON public.nfse_config;
DROP POLICY IF EXISTS "Accountants can update nfse config" ON public.nfse_config;

-- Criar novas policies de accountant com filtro de organization_id
CREATE POLICY "Accountants can view nfse config in their org"
  ON public.nfse_config
  FOR SELECT
  USING (
    has_role(auth.uid(), 'accountant'::app_role)
    AND organization_id = current_user_organization()
  );

CREATE POLICY "Accountants can insert nfse config in their org"
  ON public.nfse_config
  FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'accountant'::app_role)
    AND organization_id = current_user_organization()
  );

CREATE POLICY "Accountants can update nfse config in their org"
  ON public.nfse_config
  FOR UPDATE
  USING (
    has_role(auth.uid(), 'accountant'::app_role)
    AND organization_id = current_user_organization()
  )
  WITH CHECK (
    has_role(auth.uid(), 'accountant'::app_role)
    AND organization_id = current_user_organization()
  );

-- =====================================================
-- FASE N2.2: Endurecer RLS em nfse_issued
-- =====================================================

-- Remover policies legadas que não filtram por organization_id
DROP POLICY IF EXISTS "Users can view their own issued nfse" ON public.nfse_issued;
DROP POLICY IF EXISTS "Users can insert their own issued nfse" ON public.nfse_issued;
DROP POLICY IF EXISTS "Users can update their own issued nfse" ON public.nfse_issued;
DROP POLICY IF EXISTS "Users can delete their own issued nfse" ON public.nfse_issued;

-- Criar novas policies com filtro explícito de organization_id
CREATE POLICY "Users can view their own issued nfse in org"
  ON public.nfse_issued
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND (organization_id IS NULL OR organization_id = current_user_organization())
  );

CREATE POLICY "Users can insert their own issued nfse in org"
  ON public.nfse_issued
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (organization_id IS NULL OR organization_id = current_user_organization())
  );

CREATE POLICY "Users can update their own issued nfse in org"
  ON public.nfse_issued
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND (organization_id IS NULL OR organization_id = current_user_organization())
  )
  WITH CHECK (
    user_id = auth.uid()
    AND (organization_id IS NULL OR organization_id = current_user_organization())
  );

CREATE POLICY "Users can delete their own issued nfse in org"
  ON public.nfse_issued
  FOR DELETE
  USING (
    user_id = auth.uid()
    AND (organization_id IS NULL OR organization_id = current_user_organization())
  );

-- =====================================================
-- FASE N2.2: Endurecer RLS em nfse_payments
-- =====================================================

-- Adicionar filtro explícito de organization_id nas policies existentes
-- Primeiro, remover policies legadas sem organization_id
DROP POLICY IF EXISTS "Users can view their own payments" ON public.nfse_payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.nfse_payments;
DROP POLICY IF EXISTS "Users can update their own payments" ON public.nfse_payments;
DROP POLICY IF EXISTS "Users can delete their own payments" ON public.nfse_payments;

-- Criar novas policies com filtro de organization_id
CREATE POLICY "Users can view their own payments in org"
  ON public.nfse_payments
  FOR SELECT
  USING (
    user_id = auth.uid()
    AND (organization_id IS NULL OR organization_id = current_user_organization())
  );

CREATE POLICY "Users can insert their own payments in org"
  ON public.nfse_payments
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (organization_id IS NULL OR organization_id = current_user_organization())
  );

CREATE POLICY "Users can update their own payments in org"
  ON public.nfse_payments
  FOR UPDATE
  USING (
    user_id = auth.uid()
    AND (organization_id IS NULL OR organization_id = current_user_organization())
  )
  WITH CHECK (
    user_id = auth.uid()
    AND (organization_id IS NULL OR organization_id = current_user_organization())
  );

CREATE POLICY "Users can delete their own payments in org"
  ON public.nfse_payments
  FOR DELETE
  USING (
    user_id = auth.uid()
    AND (organization_id IS NULL OR organization_id = current_user_organization())
  );

-- =====================================================
-- FASE N2.2: Endurecer RLS em payment_allocations
-- =====================================================

-- Remover policies legadas
DROP POLICY IF EXISTS "Users can view their own allocations" ON public.payment_allocations;
DROP POLICY IF EXISTS "Users can insert their own allocations" ON public.payment_allocations;
DROP POLICY IF EXISTS "Users can delete their own allocations" ON public.payment_allocations;

-- Criar novas policies com filtro de organization_id
CREATE POLICY "Users can view their own allocations in org"
  ON public.payment_allocations
  FOR SELECT
  USING (
    (organization_id IS NULL OR organization_id = current_user_organization())
    AND (
      payment_id IN (
        SELECT id FROM public.nfse_payments WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert their own allocations in org"
  ON public.payment_allocations
  FOR INSERT
  WITH CHECK (
    (organization_id IS NULL OR organization_id = current_user_organization())
    AND (
      payment_id IN (
        SELECT id FROM public.nfse_payments WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete their own allocations in org"
  ON public.payment_allocations
  FOR DELETE
  USING (
    (organization_id IS NULL OR organization_id = current_user_organization())
    AND (
      payment_id IN (
        SELECT id FROM public.nfse_payments WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- Comentários finais da migration N2
-- =====================================================

-- N2.1: Accountants agora só veem/editam configs NFSe da própria organização
-- N2.2: Todas as tabelas de NFSe agora têm filtro explícito de organization_id
-- N2.3: Bloqueio de duplicidade será implementado em edge function (não requer SQL)
-- 
-- Garantias:
-- - Admin continua vendo tudo (policies admin_all não foram alteradas)
-- - Organization owners não foram afetados
-- - Dados legados com organization_id NULL continuam visíveis (OR organization_id IS NULL)
-- - Triggers de auto_set_organization continuam funcionando normalmente
