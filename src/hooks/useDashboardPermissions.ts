/**
 * ============================================================================
 * FASE 12.1 - Dashboard Permissions Hook
 * ============================================================================
 * 
 * Hook unificado para determinar visibilidade de cards na dashboard baseado em:
 * - Permissões de nível organizacional (level_permission_sets)
 * - Configurações de role (level_role_settings)
 * - Peer sharing
 * - Permissões específicas de domínio (clinical, financial, etc.)
 * 
 * SUBSTITUI lógica hardcoded de permissões por sistema centralizado
 * ============================================================================
 */

import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectivePermissions } from './useEffectivePermissions';
import type { CardConfig } from '@/types/cardTypes';
import type { PermissionDomain } from '@/types/permissions';

/**
 * Contexto de permissões do usuário para dashboard
 */
export interface DashboardPermissionContext {
  userId: string;
  organizationId: string;
  
  // Flags derivados das permissões efetivas
  canAccessClinical: boolean;
  canAccessFinancial: boolean;
  canAccessAdministrative: boolean;
  canAccessMarketing: boolean;
  canAccessWhatsapp: boolean;
  canAccessTeam: boolean;
  
  // Role e ownership
  isAdmin: boolean;
  isOrganizationOwner: boolean;
  
  // Flags específicos
  canViewTeamFinancialSummary: boolean;
  peerAgendaSharing: boolean;
  peerClinicalSharing: 'none' | 'view' | 'full';
}

/**
 * Hook principal para permissões de dashboard
 * Retorna o contexto e uma função helper para checar cards
 */
export function useDashboardPermissions() {
  const { user, organizationId, isAdmin } = useAuth();
  const {
    permissions,
    loading,
    canAccessClinical,
    financialAccess,
    canAccessMarketing,
    canAccessWhatsapp,
    canViewTeamFinancialSummary,
    isOrganizationOwner,
    peerAgendaSharing,
    peerClinicalSharing,
  } = useEffectivePermissions();

  // Montar contexto de permissões
  const permissionContext: DashboardPermissionContext | null = useMemo(() => {
    if (!user || !organizationId) return null;

    // FASE 12.3: REMOVER GOD MODE - Todos passam pela mesma lógica de permissões
    console.log('[DASH_PERM] ✂️ God mode desativado. Resolvendo por nível e role.', {
      userId: user.id,
      isAdmin,
      isOrganizationOwner,
      levelId: permissions?.levelId,
      roleType: permissions?.roleType,
    });

    const ctx = {
      userId: user.id,
      organizationId,
      
      // Usar permissões efetivas de level_role_settings (sem bypass)
      canAccessClinical,
      canAccessFinancial: financialAccess !== 'none',
      canAccessAdministrative: true, // Todos podem ver dados administrativos
      canAccessMarketing,
      canAccessWhatsapp,
      canAccessTeam: canViewTeamFinancialSummary,
      
      // Role
      isAdmin: isAdmin || false,
      isOrganizationOwner,
      
      // Específicos
      canViewTeamFinancialSummary,
      peerAgendaSharing,
      peerClinicalSharing,
    };

  // Log de debug detalhado
  console.log('[DASH_PERM] 🔎 Visibilidade calculada por level_role_settings', {
    userId: ctx.userId,
    organizationId: ctx.organizationId,
    levelId: permissions?.levelId,
    roleType: permissions?.roleType,
    isAdmin: ctx.isAdmin,
    isOrganizationOwner: ctx.isOrganizationOwner,
    visibility: {
      financial: { canViewSection: ctx.canAccessFinancial },
      administrative: { canViewSection: ctx.canAccessAdministrative },
      clinical: { canViewSection: ctx.canAccessClinical },
      general: { canViewSection: true },
      charts: { canViewSection: true },
      team: { canViewSection: ctx.canAccessTeam },
      marketing: { canViewSection: ctx.canAccessMarketing },
      media: { canViewSection: ctx.canAccessMarketing },
    },
  });

  // Log adicional de visibilidade por domínio (FASE 12.3.7)
  console.log('[DASH_PERM] 🌐 Visibilidade final por domínio', {
    userId: ctx.userId,
    globalRole: permissions?.roleType,
    isAdmin: ctx.isAdmin,
    isOrganizationOwner: ctx.isOrganizationOwner,
    visibilityByDomain: {
      financial: { canView: ctx.canAccessFinancial, scope: financialAccess },
      clinical: { canView: ctx.canAccessClinical, scope: 'full' },
      administrative: { canView: ctx.canAccessAdministrative, scope: 'full' },
      team: { canView: ctx.canAccessTeam, scope: 'full' },
      media: { canView: ctx.canAccessMarketing, scope: 'full' },
      whatsapp: { canView: ctx.canAccessWhatsapp },
      marketing: { canView: ctx.canAccessMarketing, scope: 'full' },
      general: { canView: true, scope: 'full' },
      charts: { canView: true, scope: 'full' },
    },
  });

    return ctx;
  }, [
    user,
    organizationId,
    permissions,
    canAccessClinical,
    financialAccess,
    canAccessMarketing,
    canAccessWhatsapp,
    canViewTeamFinancialSummary,
    isOrganizationOwner,
    isAdmin,
    peerAgendaSharing,
    peerClinicalSharing,
  ]);

  return {
    permissionContext,
    loading,
    canViewCard: (card: CardConfig) => 
      canViewDashboardCard(card, permissionContext),
  };
}

/**
 * ============================================================================
 * FUNÇÃO CENTRAL: Determinar se usuário pode ver um card
 * ============================================================================
 */
export function canViewDashboardCard(
  card: CardConfig,
  ctx: DashboardPermissionContext | null
): boolean {
  // Sem contexto = sem permissão
  if (!ctx) return false;
  
  const config = card.permissionConfig;
  if (!config) return true; // Cards sem config são sempre visíveis

  // FASE 12.3.8: Verificar domínio com bypass para admin/owner
  // 1. CHECAR DOMÍNIO
  const canAccess = canAccessDomain(config.domain, ctx);
  
  if (!canAccess) {
    console.log('[DASH_PERM] ❌ Card bloqueado por domínio', {
      cardId: card.id,
      domain: config.domain,
      userId: ctx.userId,
      isAdmin: ctx.isAdmin,
      isOrganizationOwner: ctx.isOrganizationOwner,
      canAccessTeam: ctx.canAccessTeam,
    });
    return false;
  }
  
  // Log de sucesso para cards de team (debug FASE 12.3.8)
  if (config.domain === 'team') {
    console.log('[DASH_PERM] ✅ Card de equipe permitido', {
      cardId: card.id,
      domain: config.domain,
      userId: ctx.userId,
      isAdmin: ctx.isAdmin,
      isOrganizationOwner: ctx.isOrganizationOwner,
    });
  }

  // 2. CHECAR BLOQUEIOS EXPLÍCITOS
  if (config.blockedFor) {
    // Checar se algum bloqueio se aplica
    const hasBlockingRole = config.blockedFor.some(blockedRole => {
      if (blockedRole === 'subordinate') {
        return !ctx.isOrganizationOwner;
      }
      return false;
    });
    
    if (hasBlockingRole) return false;
  }

  // 3. CHECAR REQUISITOS ESPECIAIS
  
  // Financial access
  if (config.requiresFinancialAccess && !ctx.canAccessFinancial) {
    return false;
  }

  // Full clinical access
  if (config.requiresFullClinicalAccess && !ctx.canAccessClinical) {
    return false;
  }

  // Tudo OK
  return true;
}

/**
 * Checar se usuário tem acesso a um domínio específico
 * FASE 12.3.8: Admin/Owner SEMPRE podem ver todos os domínios (bypass total)
 */
function canAccessDomain(
  domain: PermissionDomain,
  ctx: DashboardPermissionContext
): boolean {
  // 🔓 FASE 12.3.8: Admin/Owner sempre podem ver todos os domínios
  if (ctx.isAdmin || ctx.isOrganizationOwner) {
    return true;
  }
  
  // 🔒 Demais usuários seguem as permissões do level_role_settings
  switch (domain) {
    case 'general':
      return true; // Sempre acessível
      
    case 'financial':
      return ctx.canAccessFinancial;
      
    case 'clinical':
      return ctx.canAccessClinical;
      
    case 'administrative':
      return ctx.canAccessAdministrative;
      
    case 'marketing':
    case 'media':
      return ctx.canAccessMarketing;
      
    case 'team':
      return ctx.canAccessTeam;
      
    case 'charts':
      // Seção de gráficos: requer ao menos um acesso
      return (
        ctx.canAccessFinancial ||
        ctx.canAccessClinical ||
        ctx.canAccessAdministrative ||
        ctx.canAccessMarketing
      );
      
    default:
      return false;
  }
}

/**
 * Helper: Filtrar lista de cards baseado em permissões
 */
export function filterCardsByPermissions(
  cards: CardConfig[],
  ctx: DashboardPermissionContext | null
): CardConfig[] {
  if (!ctx) return [];
  return cards.filter(card => canViewDashboardCard(card, ctx));
}
