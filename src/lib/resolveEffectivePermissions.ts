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
  
  // FASE W3: Permissões de WhatsApp hierárquicas
  canViewSubordinateWhatsapp: boolean;
  canManageSubordinateWhatsapp: boolean;
  secretaryCanAccessWhatsapp: boolean;
  
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
    
    console.log('[PERM] 🧩 level_role_settings carregado', {
      levelId: hierarchyInfo.levelId,
      globalRole: roleGlobal,
      roleSettings,
      error,
    });
    
    if (error) {
      console.error('[PERM] ❌ Erro ao buscar level_role_settings:', error);
      // Em caso de erro, retornar acesso restrito por segurança
      return getRestrictedDefaultPermissions(hierarchyInfo, roleGlobal);
    }
    
    // ========================================================================
    // 5. SE NÃO TEM CONFIGURAÇÃO → BOOTSTRAP AUTOMÁTICO
    // ========================================================================
    if (!roleSettings) {
      console.warn('[PERM] ⚠️ Nenhum level_role_settings para este nível/role. Aplicando bootstrap automático.', {
        levelId: hierarchyInfo.levelId,
        globalRole: roleGlobal,
        isOwner: hierarchyInfo.isOwner,
      });
      
      // Bootstrap permissivo para admin/owner
      if (roleGlobal === 'admin' || hierarchyInfo.isOwner) {
        const bootstrapPermissions = getDefaultFullPermissions(hierarchyInfo, roleGlobal);
        console.log('[PERM] 🚀 Bootstrap permissivo aplicado (admin/owner):', bootstrapPermissions);
        console.log('[PERM] 🌐 Visibilidade TOTAL concedida: financial=full, clinical=full, marketing=full, team=full, whatsapp=full');
        return bootstrapPermissions;
      }
      
      // Bootstrap moderado para roles administrativos
      if (roleGlobal === 'assistant') {
        const bootstrapPermissions: EffectivePermissions = {
          canAccessClinical: false,
          financialAccess: 'summary',
          canAccessMarketing: true,
          canAccessWhatsapp: true,
          usesOrgNFSe: true,
          clinicalVisibleToSuperiors: true,
          peerAgendaSharing: true,
          peerClinicalSharing: 'none',
          canEditSchedules: true,
          canViewTeamFinancialSummary: false,
          // FASE W3: Assistentes têm acesso amplo ao WhatsApp
          canViewSubordinateWhatsapp: false,
          canManageSubordinateWhatsapp: false,
          secretaryCanAccessWhatsapp: true, // Secretária vê tudo
          levelId: hierarchyInfo.levelId,
          levelNumber: hierarchyInfo.levelNumber,
          roleType: roleGlobal,
          isOrganizationOwner: hierarchyInfo.isOwner,
        };
        console.log('[PERM] 🚀 Bootstrap moderado aplicado (assistant):', bootstrapPermissions);
        return bootstrapPermissions;
      }
      
      // Bootstrap restrito para contador
      if (roleGlobal === 'accountant') {
        const bootstrapPermissions: EffectivePermissions = {
          canAccessClinical: false,
          financialAccess: 'full',
          canAccessMarketing: false,
          canAccessWhatsapp: false,
          usesOrgNFSe: true,
          clinicalVisibleToSuperiors: false,
          peerAgendaSharing: false,
          peerClinicalSharing: 'none',
          canEditSchedules: false,
          canViewTeamFinancialSummary: true,
          // FASE W3: Contador não tem permissões de WhatsApp
          canViewSubordinateWhatsapp: false,
          canManageSubordinateWhatsapp: false,
          secretaryCanAccessWhatsapp: false,
          levelId: hierarchyInfo.levelId,
          levelNumber: hierarchyInfo.levelNumber,
          roleType: roleGlobal,
          isOrganizationOwner: hierarchyInfo.isOwner,
        };
        console.log('[PERM] 🚀 Bootstrap restrito aplicado (accountant):', bootstrapPermissions);
        return bootstrapPermissions;
      }
      
      // Bootstrap clínico para psicólogo/terapeuta
      if (roleGlobal === 'psychologist') {
        const bootstrapPermissions: EffectivePermissions = {
          canAccessClinical: true,
          financialAccess: 'summary',
          canAccessMarketing: false,
          canAccessWhatsapp: false,
          usesOrgNFSe: false,
          clinicalVisibleToSuperiors: true,
          peerAgendaSharing: true,
          peerClinicalSharing: 'view',
          canEditSchedules: true,
          canViewTeamFinancialSummary: false,
          // FASE W3: Psicólogo não tem permissões de WhatsApp por padrão
          canViewSubordinateWhatsapp: false,
          canManageSubordinateWhatsapp: false,
          secretaryCanAccessWhatsapp: false,
          levelId: hierarchyInfo.levelId,
          levelNumber: hierarchyInfo.levelNumber,
          roleType: roleGlobal,
          isOrganizationOwner: hierarchyInfo.isOwner,
        };
        console.log('[PERM] 🚀 Bootstrap clínico aplicado (psychologist):', bootstrapPermissions);
        return bootstrapPermissions;
      }
      
      // Fallback final - restrito
      console.warn('[PERM] ⚠️ Role não reconhecido para bootstrap, usando default restrito');
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
      
      // FASE W3: Permissões de WhatsApp hierárquicas
      canViewSubordinateWhatsapp: roleSettings.can_view_subordinate_whatsapp,
      canManageSubordinateWhatsapp: roleSettings.can_manage_subordinate_whatsapp,
      secretaryCanAccessWhatsapp: roleSettings.secretary_can_access_whatsapp,
      
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
    // FASE W3: Admin/Owner tem todas permissões de WhatsApp
    canViewSubordinateWhatsapp: true,
    canManageSubordinateWhatsapp: true,
    secretaryCanAccessWhatsapp: true,
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
    // FASE W3: Permissões restritas não têm acesso ao WhatsApp
    canViewSubordinateWhatsapp: false,
    canManageSubordinateWhatsapp: false,
    secretaryCanAccessWhatsapp: false,
    levelId: hierarchyInfo.levelId,
    levelNumber: hierarchyInfo.levelNumber,
    roleType: roleGlobal,
    isOrganizationOwner: hierarchyInfo.isOwner,
  };
}

/**
 * ============================================================================
 * HELPER FUNCTIONS - Substituem funções legadas de checkSubordinateAutonomy
 * ============================================================================
 */

/**
 * Verifica se um usuário tem acesso financeiro (substitui canAccessFinancial)
 * @param userId - ID do usuário
 * @returns true se tem acesso financeiro (financialAccess !== 'none')
 */
export async function hasFinancialAccess(userId: string): Promise<boolean> {
  const perms = await resolveEffectivePermissions(userId);
  return perms.financialAccess !== 'none';
}

/**
 * Obtém lista de subordinados diretos cujas sessões devem entrar no fechamento
 * financeiro do gerente (substitui getSubordinatesForFinancialClosing)
 * 
 * LÓGICA: Retorna subordinados que:
 * 1. Estão registrados como subordinados do gerente (via subordinate_autonomy_settings)
 * 2. Têm financialAccess diferente de 'full' no NOVO sistema de permissões
 * 
 * NOTA: Ainda usa subordinate_autonomy_settings para HIERARQUIA, mas
 * verifica permissões via resolveEffectivePermissions (novo sistema)
 * 
 * @param managerId - ID do gerente/superior
 * @returns Array de IDs dos subordinados
 */
export async function getSubordinatesForFinancialClosing(
  managerId: string
): Promise<string[]> {
  try {
    // 1. Buscar subordinados diretos via tabela antiga (apenas para hierarquia)
    const { data: subordinates } = await supabase
      .from('subordinate_autonomy_settings')
      .select('subordinate_id')
      .eq('manager_id', managerId);

    if (!subordinates || subordinates.length === 0) {
      return [];
    }

    // 2. Para cada subordinado, verificar permissões via NOVO sistema
    const includedSubordinates: string[] = [];
    
    for (const sub of subordinates) {
      const perms = await resolveEffectivePermissions(sub.subordinate_id);
      
      // Se NÃO tem acesso financeiro completo, entra no fechamento do gerente
      if (perms.financialAccess !== 'full') {
        includedSubordinates.push(sub.subordinate_id);
      }
    }

    return includedSubordinates;
  } catch (error) {
    console.error('[getSubordinatesForFinancialClosing] Error:', error);
    return [];
  }
}

/**
 * ============================================================================
 * ADMINISTRAÇÃO LEGADA - Apenas para telas de gerenciamento
 * ============================================================================
 */

/**
 * Lê configurações de autonomia antigas para fins de ADMINISTRAÇÃO
 * (NÃO usar para decisões de permissões em runtime - usar resolveEffectivePermissions)
 * 
 * @param subordinateId - ID do subordinado
 * @returns Configurações básicas da tabela subordinate_autonomy_settings
 */
export async function getSubordinateAutonomyForAdmin(
  subordinateId: string
): Promise<{
  managesOwnPatients: boolean;
  hasFinancialAccess: boolean;
  nfseEmissionMode: 'own_company' | 'manager_company';
  canFullSeeClinic: boolean;
  includeInFullFinancial: boolean;
}> {
  const { data } = await supabase
    .from('subordinate_autonomy_settings')
    .select('*')
    .eq('subordinate_id', subordinateId)
    .maybeSingle();

  return {
    managesOwnPatients: data?.manages_own_patients || false,
    hasFinancialAccess: data?.has_financial_access || false,
    nfseEmissionMode: (data?.nfse_emission_mode as 'own_company' | 'manager_company') || 'own_company',
    canFullSeeClinic: !data?.manages_own_patients,
    includeInFullFinancial: !data?.has_financial_access
  };
}
