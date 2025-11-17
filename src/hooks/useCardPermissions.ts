import { useAuth } from '@/contexts/AuthContext';
import { useSubordinatePermissions } from './useSubordinatePermissions';
import type { PermissionDomain, AccessLevel } from '@/types/permissions';
import { ALL_AVAILABLE_CARDS } from '@/types/cardTypes';

/**
 * ============================================================================
 * HOOK: useCardPermissions
 * ============================================================================
 * 
 * Hook especializado para verificar permissões de cards e seções.
 * 
 * FUNCIONALIDADES:
 * - Verifica se usuário pode ver um card específico
 * - Verifica nível de acesso a domínios
 * - Gerencia visibilidade de funcionalidades
 * 
 * USO TÍPICO:
 * ```tsx
 * const { canViewCard, hasAccess } = useCardPermissions();
 * 
 * if (!canViewCard('patient-stat-revenue-month')) return null;
 * ```
 * 
 * ============================================================================
 */

export function useCardPermissions() {
  const { isAdmin, isFullTherapist, isAccountant, isSubordinate } = useAuth();
  const { permissions, loading } = useSubordinatePermissions();

  /**
   * Verifica se usuário tem acesso a um domínio específico
   */
  const hasAccess = (domain: PermissionDomain, minimumLevel: AccessLevel = 'read'): boolean => {
    // Admin e FullTherapist sempre têm acesso total
    if (isAdmin || isFullTherapist) return true;

    // Accountant tem acesso a domínios específicos
    if (isAccountant) {
      const accountantDomains: PermissionDomain[] = ['financial'];
      return accountantDomains.includes(domain);
    }

    // Se não é subordinado (é Full), tem acesso a tudo
    if (!isSubordinate) return true;

    // Subordinado: verificar permissões específicas
    if (!permissions) return false;

    switch (domain) {
      case 'clinical':
        return permissions.canManageOwnPatients || permissions.canFullSeeClinic;

      case 'financial':
        if (minimumLevel === 'none') return false;
        return permissions.canViewOwnFinancial;

      case 'administrative':
        return true;

      case 'media':
        return false; // Subordinados não veem mídia

      case 'general':
        return true;

      default:
        return false;
    }
  };

  /**
   * Verifica se usuário pode ver um card específico por ID
   * Usa mapeamento interno de cards -> domínios
   */
  const canViewCard = (cardId: string): boolean => {
    // Admin, FullTherapist e Accountant veem tudo
    if (isAdmin || isFullTherapist || isAccountant) return true;

    // FASE 1: Usar permissionConfig dos cards
    const card = ALL_AVAILABLE_CARDS.find(c => c.id === cardId);
    if (!card) return true; // Se não encontrado, libera

    const domain = card.permissionConfig.domain;

    return hasAccess(domain);
  };

  /**
   * Verifica se deve filtrar dados para mostrar apenas dados próprios
   */
  const shouldFilterToOwnData = (): boolean => {
    if (isAdmin || isAccountant) return false;
    if (!isSubordinate) return false;
    if (!permissions) return true;

    // Filtra se gerencia apenas próprios pacientes
    return permissions.canManageOwnPatients;
  };

  /**
   * Verifica se pode acessar dados financeiros gerais (fechamento completo)
   */
  const canViewFullFinancial = (): boolean => {
    if (isAdmin || isAccountant) return true;
    if (!isSubordinate) return true;
    if (!permissions) return false;

    return permissions.canViewFullFinancial;
  };

  return {
    hasAccess,
    canViewCard,
    shouldFilterToOwnData,
    canViewFullFinancial,
    loading,
    permissions,
  };
}
