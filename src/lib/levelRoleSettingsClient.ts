import { supabase } from '@/integrations/supabase/client';

/**
 * Tipo base alinhado com a tabela level_role_settings
 * Representa as configurações de permissões para um nível + role_type específico
 */
export type LevelRoleSettingsRow = {
  id: string;
  level_id: string;
  role_type: 'psychologist' | 'assistant' | 'accountant' | 'admin';
  can_access_clinical: boolean;
  financial_access: 'none' | 'summary' | 'full';
  can_access_marketing: boolean;
  can_access_whatsapp: boolean;
  uses_org_company_for_nfse: boolean;
  clinical_visible_to_superiors: boolean;
  peer_agenda_sharing: boolean;
  peer_clinical_sharing: 'none' | 'view' | 'full';
  can_edit_schedules: boolean;
  can_view_team_financial_summary: boolean;
  // FASE W3: Permissões de WhatsApp hierárquicas
  can_view_subordinate_whatsapp: boolean;
  can_manage_subordinate_whatsapp: boolean;
  secretary_can_access_whatsapp: boolean;
};

/**
 * Retorna configurações padrão para um nível + role_type
 * 
 * Defaults conservadores:
 * - Apenas acesso clínico habilitado por padrão (core do sistema)
 * - Acesso financeiro: nenhum (requer concessão explícita)
 * - Marketing/WhatsApp: desabilitados (opcional)
 * - Compartilhamento: desabilitado (privacidade por padrão)
 * - Permissões administrativas: desabilitadas (requerem concessão)
 * 
 * @param levelId - ID do nível na hierarquia
 * @param roleType - Tipo de role (psychologist, assistant, accountant, admin)
 */
export function getDefaultLevelRoleSettings(
  levelId: string,
  roleType: LevelRoleSettingsRow['role_type'] = 'psychologist'
): Omit<LevelRoleSettingsRow, 'id'> {
  return {
    level_id: levelId,
    role_type: roleType,
    can_access_clinical: true, // Acesso clínico é padrão
    financial_access: 'none', // Requer concessão explícita
    can_access_marketing: false,
    can_access_whatsapp: false,
    uses_org_company_for_nfse: false,
    clinical_visible_to_superiors: false,
    peer_agenda_sharing: false,
    peer_clinical_sharing: 'none',
    can_edit_schedules: false,
    can_view_team_financial_summary: false,
    // FASE W3: Permissões de WhatsApp hierárquicas
    can_view_subordinate_whatsapp: false,
    can_manage_subordinate_whatsapp: false,
    secretary_can_access_whatsapp: false,
  };
}

/**
 * Garante que existe um registro de level_role_settings no banco
 * 
 * Se o registro já existe, retorna ele.
 * Se não existe, cria com valores padrão e retorna o criado.
 * 
 * @param levelId - ID do nível na hierarquia
 * @param roleType - Tipo de role (psychologist, assistant, accountant, admin)
 * @returns Promise com o registro carregado ou criado
 * @throws Error se houver problema na query ou inserção
 */
export async function ensureLevelRoleSettings(
  levelId: string,
  roleType: LevelRoleSettingsRow['role_type'] = 'psychologist'
): Promise<LevelRoleSettingsRow> {
  // 1) Tentar carregar existente
  const { data, error } = await supabase
    .from('level_role_settings')
    .select('*')
    .eq('level_id', levelId)
    .eq('role_type', roleType)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    // Se for erro diferente de "no rows", logar e relançar
    console.error('[levelRoleSettings] Error loading settings', { 
      levelId, 
      roleType, 
      error 
    });
    throw error;
  }

  if (data) {
    return data as LevelRoleSettingsRow;
  }

  // 2) Se não existir, criar com defaults
  const defaults = getDefaultLevelRoleSettings(levelId, roleType);

  const { data: inserted, error: insertError } = await supabase
    .from('level_role_settings')
    .insert(defaults)
    .select('*')
    .single();

  if (insertError) {
    console.error('[levelRoleSettings] Error inserting default settings', { 
      levelId, 
      roleType, 
      insertError 
    });
    throw insertError;
  }

  return inserted as LevelRoleSettingsRow;
}

/**
 * Carrega configurações de level_role_settings sem criar se não existir
 * 
 * Útil quando você quer apenas verificar se existe configuração,
 * sem criar automaticamente.
 * 
 * @param levelId - ID do nível na hierarquia
 * @param roleType - Tipo de role (psychologist, assistant, accountant, admin)
 * @returns Promise com o registro ou null se não existir
 * @throws Error se houver problema na query
 */
export async function loadLevelRoleSettings(
  levelId: string,
  roleType: LevelRoleSettingsRow['role_type'] = 'psychologist'
): Promise<LevelRoleSettingsRow | null> {
  const { data, error } = await supabase
    .from('level_role_settings')
    .select('*')
    .eq('level_id', levelId)
    .eq('role_type', roleType)
    .maybeSingle();

  if (error && error.code !== 'PGRST116') {
    console.error('[levelRoleSettings] Error loading settings (no ensure)', { 
      levelId, 
      roleType, 
      error 
    });
    throw error;
  }

  return (data as LevelRoleSettingsRow) ?? null;
}
