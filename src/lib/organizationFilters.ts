import { supabase } from '@/integrations/supabase/client';

/**
 * ============================================================================
 * HELPERS: Organization Filters (FASE 10.10 - Final)
 * ============================================================================
 * 
 * Funções consolidadas para filtrar dados por organização ativa.
 * Todas as queries multi-empresa devem usar estas funções.
 * 
 * ============================================================================
 */

/**
 * Retorna todos os user_ids de perfis da organização especificada.
 * Esta é a função PRINCIPAL para filtro organizacional.
 */
export async function getUserIdsInOrganization(organizationId: string): Promise<string[]> {
  if (!organizationId) {
    return [];
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('organization_id', organizationId);

  if (error) {
    console.error('[ORG] Erro ao buscar user_ids da organização:', error);
    return [];
  }

  return (data || []).map(p => p.id);
}

/**
 * Verifica se um user_id pertence à organização especificada
 */
export async function isUserInOrganization(userId: string, organizationId: string): Promise<boolean> {
  if (!userId || !organizationId) return false;

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  return !!data;
}

/**
 * Filtra uma lista de IDs de usuário para incluir apenas os da organização ativa
 */
export async function filterUserIdsByOrganization(
  userIds: string[], 
  organizationId: string
): Promise<string[]> {
  if (!organizationId || userIds.length === 0) return [];

  const { data } = await supabase
    .from('profiles')
    .select('id')
    .in('id', userIds)
    .eq('organization_id', organizationId);

  return (data || []).map(p => p.id);
}
