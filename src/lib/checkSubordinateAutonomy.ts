import { supabase } from "@/integrations/supabase/client";

export interface SubordinateAutonomySettings {
  id: string;
  subordinate_id: string;
  manager_id: string;
  manages_own_patients: boolean;
  has_financial_access: boolean;
  created_at: string;
  updated_at: string;
}

export interface AutonomyPermissions {
  managesOwnPatients: boolean;
  hasFinancialAccess: boolean;
  canFullSeeClinic: boolean;
  includeInFullFinancial: boolean;
}

/**
 * Obtém as configurações de autonomia de um subordinado
 */
export async function getSubordinateAutonomy(
  subordinateId: string
): Promise<AutonomyPermissions> {
  const { data } = await supabase
    .from('subordinate_autonomy_settings')
    .select('*')
    .eq('subordinate_id', subordinateId)
    .maybeSingle();

  return {
    managesOwnPatients: data?.manages_own_patients || false,
    hasFinancialAccess: data?.has_financial_access || false,
    canFullSeeClinic: !data?.manages_own_patients, // Se não gerencia próprios = Full vê clínico
    includeInFullFinancial: !data?.has_financial_access // Se não tem acesso financeiro = entra no Full
  };
}

/**
 * Verifica se um usuário tem acesso à rota /financial
 * Considera subordinados com has_financial_access = true
 */
export async function canAccessFinancial(
  userId: string,
  isSubordinate: boolean
): Promise<boolean> {
  // Se não é subordinado, pode acessar (é Full ou Admin)
  if (!isSubordinate) {
    return true;
  }

  // Se é subordinado, verificar se tem acesso financeiro
  const { data } = await supabase
    .from('subordinate_autonomy_settings')
    .select('has_financial_access')
    .eq('subordinate_id', userId)
    .maybeSingle();

  return data?.has_financial_access || false;
}

/**
 * Obtém lista de subordinados que devem entrar no fechamento financeiro do Full
 * (subordinados com has_financial_access = false)
 */
export async function getSubordinatesForFinancialClosing(
  managerId: string
): Promise<string[]> {
  const { data } = await supabase
    .from('subordinate_autonomy_settings')
    .select('subordinate_id')
    .eq('manager_id', managerId)
    .eq('has_financial_access', false);

  return data?.map(s => s.subordinate_id) || [];
}
