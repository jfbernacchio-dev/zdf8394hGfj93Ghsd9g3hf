import { supabase } from '@/integrations/supabase/client';

/**
 * ============================================================================
 * QUERY FILTERING UTILITIES
 * ============================================================================
 * 
 * Funções auxiliares para filtrar queries do Supabase baseado em permissões.
 * 
 * USO:
 * - getViewablePatientsFilter(userId, shouldFilterToOwn)
 * - getFinancialClosingFilter(userId, canViewFullFinancial)
 * 
 * IMPORTANTE:
 * - Estas funções retornam filtros para aplicar nas queries
 * - NÃO executam queries diretamente
 * - Garantem que dados sejam filtrados no servidor (não client-side)
 * 
 * ============================================================================
 */

/**
 * Retorna lista de user_ids cujos pacientes o usuário pode visualizar
 * 
 * REGRAS:
 * - Se shouldFilterToOwn = true: apenas userId
 * - Se false: userId + subordinados que NÃO gerem próprios pacientes
 * 
 * RETORNA: Array de user_ids para usar em query .in('user_id', ids)
 */
export async function getViewablePatientsUserIds(
  userId: string,
  shouldFilterToOwn: boolean
): Promise<string[]> {
  // Subordinado que gerencia próprios = só seus pacientes
  if (shouldFilterToOwn) {
    return [userId];
  }

  // Admin/Full = próprios + subordinados que NÃO gerem próprios
  const { data: subordinatesData } = await supabase
    .from('therapist_assignments')
    .select('subordinate_id')
    .eq('manager_id', userId);

  if (!subordinatesData || subordinatesData.length === 0) {
    // Nenhum subordinado, apenas próprios
    return [userId];
  }

  const subordinateIds = subordinatesData.map(s => s.subordinate_id);

  // Verificar quais subordinados NÃO gerem próprios pacientes
  const { data: autonomyData } = await supabase
    .from('subordinate_autonomy_settings')
    .select('subordinate_id, manages_own_patients')
    .in('subordinate_id', subordinateIds);

  const viewableSubordinates = autonomyData
    ?.filter(a => !a.manages_own_patients)
    .map(a => a.subordinate_id) || [];

  // Retornar próprio userId + subordinados viewable
  return [userId, ...viewableSubordinates];
}

/**
 * Retorna lista de user_ids cujas sessões devem entrar no fechamento financeiro
 * 
 * REGRAS:
 * - Se canViewFullFinancial = false: apenas userId (próprias sessões)
 * - Se true: userId + subordinados com includeInFullFinancial = true
 * 
 * RETORNA: Array de user_ids para usar em query .in('user_id', ids)
 */
export async function getFinancialClosingUserIds(
  userId: string,
  canViewFullFinancial: boolean
): Promise<string[]> {
  // Subordinado com acesso financeiro limitado = só suas sessões
  if (!canViewFullFinancial) {
    return [userId];
  }

  // Admin/Full = próprias + subordinados que devem ser incluídos
  const { getSubordinatesForFinancialClosing } = await import('@/lib/resolveEffectivePermissions');
  const subordinateIds = await getSubordinatesForFinancialClosing(userId);

  if (subordinateIds.length === 0) {
    return [userId];
  }

  return [userId, ...subordinateIds];
}

/**
 * Aplica filtro de pacientes visíveis em uma query
 * 
 * EXEMPLO:
 * ```typescript
 * let query = supabase.from('patients').select('*');
 * query = await applyPatientsFilter(query, userId, shouldFilterToOwn);
 * const { data } = await query;
 * ```
 */
export async function applyPatientsFilter<T>(
  query: any,
  userId: string,
  shouldFilterToOwn: boolean
): Promise<any> {
  const viewableUserIds = await getViewablePatientsUserIds(userId, shouldFilterToOwn);
  
  if (viewableUserIds.length === 1) {
    return query.eq('user_id', viewableUserIds[0]);
  } else {
    return query.in('user_id', viewableUserIds);
  }
}

/**
 * Aplica filtro de sessões para fechamento financeiro
 * 
 * EXEMPLO:
 * ```typescript
 * let query = supabase.from('sessions').select('*, patients!inner(user_id)');
 * query = await applyFinancialFilter(query, userId, canViewFullFinancial);
 * const { data } = await query;
 * ```
 */
export async function applyFinancialFilter<T>(
  query: any,
  userId: string,
  canViewFullFinancial: boolean
): Promise<any> {
  const userIds = await getFinancialClosingUserIds(userId, canViewFullFinancial);
  
  if (userIds.length === 1) {
    return query.eq('patients.user_id', userIds[0]);
  } else {
    return query.or(`patients.user_id.in.(${userIds.join(',')})`);
  }
}
