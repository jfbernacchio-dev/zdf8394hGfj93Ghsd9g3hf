-- ============================================
-- FASE 0: ADICIONAR UNIQUE CONSTRAINT
-- ============================================

-- Adicionar constraint única para evitar duplicatas
ALTER TABLE public.therapist_assignments
ADD CONSTRAINT therapist_assignments_unique_pair 
UNIQUE (manager_id, subordinate_id);

-- ============================================
-- FASE 1.1: TRIGGER DE SINCRONIZAÇÃO AUTOMÁTICA
-- ============================================

-- Função que sincroniza created_by → therapist_assignments
CREATE OR REPLACE FUNCTION public.sync_created_by_to_assignments()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Se created_by foi definido, criar relacionamento em therapist_assignments
  IF NEW.created_by IS NOT NULL THEN
    INSERT INTO public.therapist_assignments (manager_id, subordinate_id)
    VALUES (NEW.created_by, NEW.id)
    ON CONFLICT (manager_id, subordinate_id) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Trigger que dispara após INSERT/UPDATE em profiles
DROP TRIGGER IF EXISTS sync_therapist_hierarchy ON public.profiles;
CREATE TRIGGER sync_therapist_hierarchy
  AFTER INSERT OR UPDATE OF created_by ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_created_by_to_assignments();

-- ============================================
-- FASE 1.2: MIGRAR DADOS EXISTENTES
-- ============================================

-- Copiar todos os relacionamentos existentes de created_by para therapist_assignments
INSERT INTO public.therapist_assignments (manager_id, subordinate_id)
SELECT created_by, id 
FROM public.profiles 
WHERE created_by IS NOT NULL
ON CONFLICT (manager_id, subordinate_id) DO NOTHING;

-- ============================================
-- FASE 2.1: FUNÇÃO HELPER PARA HIERARQUIA
-- ============================================

-- Função reutilizável que verifica se um usuário é subordinado de outro
CREATE OR REPLACE FUNCTION public.is_manager_of(_manager_id uuid, _subordinate_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.therapist_assignments
    WHERE manager_id = _manager_id
      AND subordinate_id = _subordinate_id
  )
$$;

-- Função que retorna todos os subordinados de um manager (diretos)
CREATE OR REPLACE FUNCTION public.get_subordinate_therapists(_manager_id uuid)
RETURNS TABLE(subordinate_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT subordinate_id
  FROM public.therapist_assignments
  WHERE manager_id = _manager_id
$$;