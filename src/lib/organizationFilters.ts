import { supabase } from '@/integrations/supabase/client';

/**
 * ============================================================================
 * HELPERS: Organization Filters
 * ============================================================================
 * 
 * Funções auxiliares para filtrar dados por organização ativa.
 * Como as tabelas clínicas não têm organization_id direto, filtramos via user_id.
 * 
 * ============================================================================
 */

/**
 * Retorna todos os user_ids de perfis da organização especificada
 */
export async function getUserIdsInOrganization(organizationId: string): Promise<string[]> {
  if (!organizationId) {
    console.warn('[ORG] organization_id é nulo/vazio');
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

  const userIds = (data || []).map(p => p.id);
  console.log(`[ORG] ${userIds.length} usuários encontrados na organização ${organizationId}`);
  
  return userIds;
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
