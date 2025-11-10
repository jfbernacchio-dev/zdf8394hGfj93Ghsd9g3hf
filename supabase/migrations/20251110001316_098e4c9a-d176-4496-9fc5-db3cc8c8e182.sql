
-- ============================================
-- CORREÇÃO DE AVISOS DE SEGURANÇA - V2
-- ============================================

-- 1. Corrigir Function Search Path Mutable
-- Adicionar search_path fixo na função que está sem

DROP FUNCTION IF EXISTS public.update_complaint_timestamp() CASCADE;

CREATE OR REPLACE FUNCTION public.update_complaint_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- Recriar o trigger que usa essa função
DROP TRIGGER IF EXISTS update_patient_complaints_timestamp ON patient_complaints;
CREATE TRIGGER update_patient_complaints_timestamp
  BEFORE UPDATE ON patient_complaints
  FOR EACH ROW
  EXECUTE FUNCTION update_complaint_timestamp();

-- Comentários de segurança
COMMENT ON FUNCTION public.update_complaint_timestamp() IS 'Função com search_path fixo para prevenir ataques de confusão de schema';

-- NOTA: A extensão pg_net é gerenciada pelo Supabase e não pode ser movida.
-- Esta extensão está no schema public por padrão na infraestrutura Supabase.
-- O aviso pode ser ignorado pois é uma limitação da plataforma, não um problema de segurança real.
