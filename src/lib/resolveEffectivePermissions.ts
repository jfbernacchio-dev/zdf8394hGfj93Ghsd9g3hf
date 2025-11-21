/**
 * ============================================================================
 * FUNÇÃO CENTRAL DE RESOLUÇÃO DE PERMISSÕES - FASE 2
 * ============================================================================
 * 
 * Esta é a ÚNICA fonte da verdade para permissões no sistema.
 * 
 * LÓGICA:
 * 1. Busca o nível organizacional do usuário
 * 2. Busca o role global do usuário
 * 3. Busca as configurações em level_role_settings
 * 4. Retorna objeto padronizado de permissões efetivas
 * 
 * SUBSTITUI COMPLETAMENTE:
 * - subordinate_autonomy_settings
 * - therapist_assignments
 * - Lógica antiga de fulltherapist/subordinate
 * ============================================================================
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Tipo de role global do usuário
 */
export type GlobalRole = 'admin' | 'psychologist' | 'assistant' | 'accountant';

/**
 * Estrutura de permissões efetivas (resultado final)
 */
export interface EffectivePermissions {
  // Permissões gerais por domínio
  canAccessClinical: boolean;
  financialAccess: 'none' | 'summary' | 'full';
  canAccessMarketing: boolean;
  canAccessWhatsapp: boolean;
  
  // NFSe / empresa usada para faturamento
  usesOrgNFSe: boolean;
  
  // Visibilidade clínica vertical (superiores)
  clinicalVisibleToSuperiors: boolean;
  
  // Compartilhamento horizontal entre pares do mesmo nível
  peerAgendaSharing: boolean;
  peerClinicalSharing: 'none' | 'view' | 'full';
  
  // Permissões específicas de assistente/secretária
  canEditSchedules: boolean;
  canViewTeamFinancialSummary: boolean;
  
  // Metadados de contexto
  levelId: string | null;
  levelNumber: number | null;
  roleType: GlobalRole | null;
  isOrganizationOwner: boolean;
}

/**
 * Informações sobre a posição do usuário na hierarquia
 */
export interface UserHierarchyInfo {
  userId: string;
  positionId: string | null;
  levelId: string | null;
  levelNumber: number | null;
  organizationId: string | null;
  isOwner: boolean;
}

/**
 * ============================================================================
 * FUNÇÃO PRINCIPAL: resolveEffectivePermissions
 * ============================================================================
 * 
 * Resolve as permissões efetivas de um usuário baseado em:
 * - Seu nível organizacional
 * - Seu role global
 * - Configurações em level_role_settings
 * 
 * @param userId - ID do usuário
 * @returns Permissões efetivas + informações de contexto
 */
export async function resolveEffectivePermissions(
  userId: string
): Promise<EffectivePermissions> {
  console.log('[PERM] 🎯 Resolvendo permissões para usuário:', userId);
  
  try {
    // ========================================================================
    // 1. BUSCAR HIERARQUIA DO USUÁRIO
    // ========================================================================
    const hierarchyInfo = await getUserHierarchyInfo(userId);
    
    console.log('[PERM] 📊 Hierarquia:', {
      levelId: hierarchyInfo.levelId,
      levelNumber: hierarchyInfo.levelNumber,
      isOwner: hierarchyInfo.isOwner
    });
    
    // ========================================================================
    // 2. BUSCAR ROLE GLOBAL DO USUÁRIO
    // ========================================================================
    const roleGlobal = await getUserGlobalRole(userId);
    
    console.log('[PERM] 🎭 Role Global:', roleGlobal);
    
    // ========================================================================
    // 3. SE NÃO TEM NÍVEL OU ROLE → DEFAULT (Full Access)
    // ========================================================================
    if (!hierarchyInfo.levelId || !roleGlobal) {
      console.warn('[PERM] ⚠️ Usuário sem nível ou role, retornando full access');
      return getDefaultFullPermissions(hierarchyInfo, roleGlobal);
    }
    
    // ========================================================================
    // 4. BUSCAR CONFIGURAÇÕES EM level_role_settings
    // ========================================================================
    const { data: roleSettings, error } = await supabase
      .from('level_role_settings')
      .select('*')
      .eq('level_id', hierarchyInfo.levelId)
      .eq('role_type', roleGlobal)
      .maybeSingle();
    
    if (error) {
      console.error('[PERM] ❌ Erro ao buscar level_role_settings:', error);
      // Em caso de erro, retornar acesso restrito por segurança
      return getRestrictedDefaultPermissions(hierarchyInfo, roleGlobal);
    }
    
    // ========================================================================
    // 5. SE NÃO TEM CONFIGURAÇÃO → DEFAULT RESTRITO
    // ========================================================================
    if (!roleSettings) {
      console.warn('[PERM] ⚠️ Sem configuração para level + role, usando default restrito');
      return getRestrictedDefaultPermissions(hierarchyInfo, roleGlobal);
    }
    
    console.log('[PERM] ✅ Configuração encontrada:', roleSettings);
    
    // ========================================================================
    // 6. MONTAR PERMISSÕES EFETIVAS
    // ========================================================================
    const effectivePermissions: EffectivePermissions = {
      canAccessClinical: roleSettings.can_access_clinical,
      financialAccess: roleSettings.financial_access as 'none' | 'summary' | 'full',
      canAccessMarketing: roleSettings.can_access_marketing,
      canAccessWhatsapp: roleSettings.can_access_whatsapp,
      
      usesOrgNFSe: roleSettings.uses_org_company_for_nfse,
      
      clinicalVisibleToSuperiors: roleSettings.clinical_visible_to_superiors,
      
      peerAgendaSharing: roleSettings.peer_agenda_sharing,
      peerClinicalSharing: roleSettings.peer_clinical_sharing as 'none' | 'view' | 'full',
      
      canEditSchedules: roleSettings.can_edit_schedules,
      canViewTeamFinancialSummary: roleSettings.can_view_team_financial_summary,
      
      levelId: hierarchyInfo.levelId,
      levelNumber: hierarchyInfo.levelNumber,
      roleType: roleGlobal,
      isOrganizationOwner: hierarchyInfo.isOwner,
    };
    
    console.log('[PERM] 🎉 Permissões finais:', effectivePermissions);
    
    return effectivePermissions;
    
  } catch (error) {
    console.error('[PERM] ❌ Erro fatal ao resolver permissões:', error);
    // Em caso de erro fatal, retornar acesso mínimo
    return getRestrictedDefaultPermissions(
      { userId, positionId: null, levelId: null, levelNumber: null, organizationId: null, isOwner: false },
      null
    );
  }
}

/**
 * ============================================================================
 * FUNÇÃO AUXILIAR: getUserHierarchyInfo
 * ============================================================================
 */
async function getUserHierarchyInfo(userId: string): Promise<UserHierarchyInfo> {
  const { data, error } = await supabase
    .rpc('get_organization_hierarchy_info', { _user_id: userId });
  
  if (error || !data || data.length === 0) {
    return {
      userId,
      positionId: null,
      levelId: null,
      levelNumber: null,
      organizationId: null,
      isOwner: false,
    };
  }
  
  const hierarchy = data[0];
  return {
    userId: hierarchy.user_id,
    positionId: hierarchy.position_id,
    levelId: hierarchy.level_id,
    levelNumber: hierarchy.level_number,
    organizationId: hierarchy.organization_id,
    isOwner: hierarchy.is_owner,
  };
}

/**
 * ============================================================================
 * FUNÇÃO AUXILIAR: getUserGlobalRole
 * ============================================================================
 */
async function getUserGlobalRole(userId: string): Promise<GlobalRole | null> {
  // Buscar role em user_roles
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  
  if (error || !data) {
    return null;
  }
  
  const role = data.role;
  
  // Mapear roles antigos para novos (transição)
  if (role === 'therapist' || role === 'fulltherapist') {
    return 'psychologist';
  }
  
  // Validar se é um dos roles válidos
  if (['admin', 'psychologist', 'assistant', 'accountant'].includes(role)) {
    return role as GlobalRole;
  }
  
  return null;
}

/**
 * ============================================================================
 * DEFAULT: Full Access (para admins ou donos sem configuração)
 * ============================================================================
 */
function getDefaultFullPermissions(
  hierarchyInfo: UserHierarchyInfo,
  roleGlobal: GlobalRole | null
): EffectivePermissions {
  return {
    canAccessClinical: true,
    financialAccess: 'full',
    canAccessMarketing: true,
    canAccessWhatsapp: true,
    usesOrgNFSe: false,
    clinicalVisibleToSuperiors: false,
    peerAgendaSharing: true,
    peerClinicalSharing: 'full',
    canEditSchedules: true,
    canViewTeamFinancialSummary: true,
    levelId: hierarchyInfo.levelId,
    levelNumber: hierarchyInfo.levelNumber,
    roleType: roleGlobal,
    isOrganizationOwner: hierarchyInfo.isOwner,
  };
}

/**
 * ============================================================================
 * DEFAULT: Restricted Access (fallback seguro)
 * ============================================================================
 */
function getRestrictedDefaultPermissions(
  hierarchyInfo: UserHierarchyInfo,
  roleGlobal: GlobalRole | null
): EffectivePermissions {
  return {
    canAccessClinical: false,
    financialAccess: 'none',
    canAccessMarketing: false,
    canAccessWhatsapp: false,
    usesOrgNFSe: true,
    clinicalVisibleToSuperiors: true,
    peerAgendaSharing: false,
    peerClinicalSharing: 'none',
    canEditSchedules: false,
    canViewTeamFinancialSummary: false,
    levelId: hierarchyInfo.levelId,
    levelNumber: hierarchyInfo.levelNumber,
    roleType: roleGlobal,
    isOrganizationOwner: hierarchyInfo.isOwner,
  };
}
