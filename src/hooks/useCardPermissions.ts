import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSubordinatePermissions } from './useSubordinatePermissions';
import type { PermissionDomain, AccessLevel, UserRole } from '@/types/permissions';
import type { SectionConfig } from '@/types/sectionTypes';
import type { CardConfig } from '@/types/cardTypes';
import { ALL_AVAILABLE_CARDS } from '@/types/cardTypes';

/**
 * ============================================================================
 * HOOK: useCardPermissions - FASE 2
 * ============================================================================
 * 
 * Hook central para todas as verificações de permissões de cards e seções.
 * 
 * FUNCIONALIDADES:
 * - Verifica se usuário pode ver um card específico (FASE 1)
 * - Verifica nível de acesso a domínios (FASE 1)
 * - Valida acesso a seções inteiras (FASE 2) 🆕
 * - Filtra cards disponíveis por seção (FASE 2) 🆕
 * - Decide renderização de seções (FASE 2) 🆕
 * 
 * USO TÍPICO:
 * ```tsx
 * const { canViewCard, canViewSection, getAvailableCardsForSection } = useCardPermissions();
 * 
 * // Card individual
 * if (!canViewCard('patient-stat-revenue-month')) return null;
 * 
 * // Seção inteira
 * if (!shouldShowSection(sectionConfig)) return null;
 * 
 * // Cards de uma seção
 * const visibleCards = getAvailableCardsForSection(sectionConfig);
 * ```
 * 
 * ============================================================================
 */

export function useCardPermissions() {
  const authContext = useAuth();
  const { isAdmin, isFullTherapist, isAccountant, isSubordinate, user, rolesLoaded } = authContext;
  const { permissions, loading: permissionsLoading } = useSubordinatePermissions();

  console.log('🔐 [useCardPermissions] HOOK EXECUTOU:', {
    user: user?.id,
    rolesLoaded,
    isAdmin,
    isFullTherapist,
    isAccountant,
    isSubordinate,
    permissionsLoading,
    hasAllFalse: !isAdmin && !isFullTherapist && !isAccountant && !isSubordinate
  });

  // ✅ CORREÇÃO CRÍTICA: Aguardar roles carregarem antes de calcular permissões
  // Se roles não carregaram, DEVE aguardar (evita permissões vazias)
  const loading = !rolesLoaded || (isSubordinate && permissionsLoading);

  console.log('🔐 [useCardPermissions] Calculado loading:', loading);

  // Derivar role atual baseado nos flags booleanos
  const currentRole: UserRole | null = 
    isAdmin ? 'admin' :
    isFullTherapist ? 'fulltherapist' :
    isAccountant ? 'accountant' :
    isSubordinate ? 'subordinate' :
    null;

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

      case 'team':
        return false; // Subordinados NUNCA veem dados da equipe

      case 'general':
        return true;

      case 'charts':
        // Acesso a gráficos: verifica os domínios secundários
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

  // ============================================================================
  // FASE 2 - FUNÇÕES DE SEÇÃO
  // ============================================================================

  /**
   * FASE 2: Verifica se usuário pode ver uma seção inteira
   * Baseado em primaryDomain, blockedFor e requiresOwnDataOnly
   */
  const canViewSection = (sectionConfig: SectionConfig): boolean => {
    // Admin e FullTherapist sempre veem tudo
    if (isAdmin || isFullTherapist) return true;

    const { permissionConfig } = sectionConfig;

    // Verificar se role está explicitamente bloqueada
    if (currentRole && permissionConfig.blockedFor?.includes(currentRole)) {
      return false;
    }

    // Verificar acesso ao domínio principal
    const hasDomainAccess = hasAccess(permissionConfig.primaryDomain);
    if (!hasDomainAccess) return false;

    // Se requer dados próprios apenas, validar autonomia de subordinado
    if (permissionConfig.requiresOwnDataOnly && isSubordinate) {
      if (!permissions) return false;
      return permissions.canManageOwnPatients;
    }

    return true;
  };

  /**
   * FASE 2: Retorna cards que o usuário pode ver dentro de uma seção
   * Filtra por: availableCardIds, permissões individuais, compatibilidade de domínio
   */
  const getAvailableCardsForSection = (sectionConfig: SectionConfig): CardConfig[] => {
    console.log('🔍 [getAvailableCardsForSection] INICIADO para:', sectionConfig.id);
    console.log('📋 [getAvailableCardsForSection] availableCardIds:', sectionConfig.availableCardIds);
    console.log('📦 [getAvailableCardsForSection] Total cards no sistema:', ALL_AVAILABLE_CARDS.length);
    
    // Buscar cards pelos IDs disponíveis na seção
    const sectionCards = ALL_AVAILABLE_CARDS.filter(card =>
      sectionConfig.availableCardIds.includes(card.id)
    );
    console.log('✅ [getAvailableCardsForSection] FILTRO 1 (IDs) - Cards encontrados:', sectionCards.length);
    console.log('   Cards:', sectionCards.map(c => c.id));

    // Filtrar por permissão individual de cada card
    const visibleCards = sectionCards.filter(card => {
      const canView = canViewCard(card.id);
      console.log(`   🔐 canViewCard("${card.id}") =`, canView);
      return canView;
    });
    console.log('✅ [getAvailableCardsForSection] FILTRO 2 (Permissões) - Cards visíveis:', visibleCards.length);
    console.log('   Cards:', visibleCards.map(c => c.id));

    // Filtrar por compatibilidade de domínio (primary + secondary)
    // CORREÇÃO FASE 1: Gráficos (isChart: true) devem aparecer APENAS na seção 'dashboard-charts'
    const allowedDomains = [
      sectionConfig.permissionConfig.primaryDomain,
      ...(sectionConfig.permissionConfig.secondaryDomains || []),
    ];
    console.log('🏷️ [getAvailableCardsForSection] Domínios permitidos:', allowedDomains);

    const finalCards = visibleCards.filter(card => {
      const hasConfig = !!card.permissionConfig;
      
      // Se é um card gráfico, APENAS permitir na seção 'dashboard-charts'
      if (card.isChart) {
        const isChartsSection = sectionConfig.id === 'dashboard-charts';
        console.log(`   📊 Chart check: "${card.id}" - isChartsSection=${isChartsSection}`);
        return isChartsSection;
      }
      
      const domainMatch = card.permissionConfig && allowedDomains.includes(card.permissionConfig.domain);
      console.log(`   🏷️ Card "${card.id}": hasConfig=${hasConfig}, domain="${card.permissionConfig?.domain}", match=${domainMatch}`);
      return hasConfig && domainMatch;
    });
    
    console.log('✅ [getAvailableCardsForSection] FILTRO 3 (Domínio) - Cards finais:', finalCards.length);
    console.log('   Cards:', finalCards.map(c => c.id));
    console.log('🏁 [getAvailableCardsForSection] RETORNANDO:', finalCards.length, 'cards');
    
    return finalCards;
  };

  /**
   * FASE 2: Decide se a seção deve ser renderizada
   * Seção só aparece se: (1) usuário tem permissão E (2) existem cards visíveis
   * 
   * FASE 3 (EDIT MODE): No modo de edição, mostra seção mesmo vazia
   * para permitir adicionar o primeiro card
   */
  const shouldShowSection = (sectionConfig: SectionConfig, isEditMode?: boolean): boolean => {
    if (!canViewSection(sectionConfig)) return false;
    
    // No modo de edição, mostrar seção mesmo sem cards
    if (isEditMode) return true;
    
    const availableCards = getAvailableCardsForSection(sectionConfig);
    return availableCards.length > 0;
  };

  // ============================================================================
  // FASE 2 - FUNÇÕES AUXILIARES (HELPERS)
  // ============================================================================

  /**
   * FASE 2: Retorna todos os cards de um domínio específico
   */
  const getCardsByDomain = (domain: PermissionDomain): CardConfig[] => {
    return ALL_AVAILABLE_CARDS.filter(
      card => card.permissionConfig && card.permissionConfig.domain === domain
    );
  };

  /**
   * FASE 2: Retorna apenas os cards visíveis de uma lista de IDs
   */
  const getVisibleCards = (cardIds: string[]): CardConfig[] => {
    return cardIds
      .map(id => ALL_AVAILABLE_CARDS.find(c => c.id === id))
      .filter((card): card is CardConfig => !!card && canViewCard(card.id));
  };

  // ============================================================================
  // FASE 2 - MEMOIZAÇÃO PARA PERFORMANCE
  // ============================================================================

  /**
   * Cache memoizado de cards disponíveis por seção
   * Evita recalcular para cada renderização
   */
  const memoizedGetAvailableCards = useMemo(() => {
    return (sectionConfig: SectionConfig) => getAvailableCardsForSection(sectionConfig);
  }, [isAdmin, isFullTherapist, isAccountant, isSubordinate, permissions, currentRole]);

  return {
    // Estado
    loading,
    permissions,
    
    // FASE 1: Card-level functions
    hasAccess,
    canViewCard,
    shouldFilterToOwnData,
    canViewFullFinancial,
    
    // FASE 2: Section-level functions
    canViewSection,
    getAvailableCardsForSection: memoizedGetAvailableCards,
    shouldShowSection,
    
    // FASE 2: Helper functions
    getCardsByDomain,
    getVisibleCards,
  };
}
