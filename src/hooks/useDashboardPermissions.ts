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
    if (!user || !organizationId || !permissions) return null;

    return {
      userId: user.id,
      organizationId,
      
      // Derivar flags de acesso
      canAccessClinical,
      canAccessFinancial: financialAccess !== 'none',
      canAccessAdministrative: true, // Todos podem ver dados administrativos (sessões, agenda)
      canAccessMarketing,
      canAccessWhatsapp,
      canAccessTeam: canViewTeamFinancialSummary || isOrganizationOwner,
      
      // Role
      isAdmin: isAdmin || false,
      isOrganizationOwner,
      
      // Específicos
      canViewTeamFinancialSummary,
      peerAgendaSharing,
      peerClinicalSharing,
    };
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

  // 1. CHECAR DOMÍNIO
  if (!canAccessDomain(config.domain, ctx)) {
    return false;
  }

  // 2. CHECAR BLOQUEIOS EXPLÍCITOS
  if (config.blockedFor) {
    // Admin nunca é bloqueado
    if (ctx.isAdmin) return true;
    
    // Checar se algum bloqueio se aplica
    // Nota: as roles em blockedFor são as antigas ('admin', 'subordinate', etc.)
    // Por enquanto, vamos mapear usando flags simples
    const hasBlockingRole = config.blockedFor.some(blockedRole => {
      if (blockedRole === 'subordinate') {
        // Se é "bloqueado para subordinado", libera para owners
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
 */
function canAccessDomain(
  domain: PermissionDomain,
  ctx: DashboardPermissionContext
): boolean {
  // Admin tem acesso a tudo
  if (ctx.isAdmin) return true;

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
