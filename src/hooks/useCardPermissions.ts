import { useAuth } from '@/contexts/AuthContext';
import { useSubordinatePermissions } from './useSubordinatePermissions';
import type { PermissionDomain, AccessLevel } from '@/types/permissions';

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
      const accountantDomains: PermissionDomain[] = ['financial', 'nfse', 'reports', 'statistics'];
      return accountantDomains.includes(domain);
    }

    // Se não é subordinado (é Full), tem acesso a tudo
    if (!isSubordinate) return true;

    // Subordinado: verificar permissões específicas
    if (!permissions) return false;

    switch (domain) {
      case 'clinical':
        // Pode ver clínico se: gerencia próprios OU pode ver tudo
        return permissions.canManageOwnPatients || permissions.canFullSeeClinic;

      case 'financial':
        // Pode ver financeiro apenas se tem acesso financeiro
        if (minimumLevel === 'none') return false;
        return permissions.canViewOwnFinancial;

      case 'patients':
        // Sempre pode ver pacientes (próprios ou todos)
        return true;

      case 'statistics':
        // Pode ver estatísticas se gerencia próprios pacientes
        return permissions.canManageOwnPatients || permissions.canFullSeeClinic;

      case 'nfse':
        // Pode ver NFSe se tem acesso financeiro
        return permissions.hasFinancialAccess;

      case 'schedule':
      case 'administrative':
        // Sempre tem acesso a agenda e administrativo
        return true;

      case 'reports':
        // Pode gerar relatórios se tem acesso financeiro
        return permissions.canViewOwnFinancial;

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

    // Mapear card ID para domínio
    const cardDomainMap: Record<string, PermissionDomain> = {
      // Cards financeiros
      'patient-stat-revenue-month': 'financial',
      'patient-stat-revenue-total': 'financial',
      'patient-stat-unpaid': 'financial',
      'financial-closing': 'financial',
      'payment-methods': 'financial',
      'nfse-summary': 'nfse',
      
      // Cards clínicos
      'clinical-complaints': 'clinical',
      'clinical-evolution': 'clinical',
      'session-evaluation': 'clinical',
      
      // Cards de pacientes
      'patient-list': 'patients',
      'patient-stat-total': 'patients',
      'patient-stat-attended': 'patients',
      'patient-stat-scheduled': 'patients',
      
      // Cards estatísticos (sempre liberados para subordinados com pacientes)
      'revenue-chart': 'statistics',
      'sessions-chart': 'statistics',
      'attendance-rate': 'statistics',
      
      // Cards administrativos (sempre liberados)
      'schedule-view': 'schedule',
      'appointments': 'schedule',
      'notifications': 'administrative',
    };

    const domain = cardDomainMap[cardId];
    if (!domain) {
      // Se não mapeado, libera (é funcionalidade básica)
      return true;
    }

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
