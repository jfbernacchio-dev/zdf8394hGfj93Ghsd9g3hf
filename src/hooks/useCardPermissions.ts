import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectivePermissions } from './useEffectivePermissions';
import { supabase } from '@/integrations/supabase/client';
import type { PermissionDomain, AccessLevel, UserRole } from '@/types/permissions';
import { getUserIdsInOrganization } from '@/lib/organizationFilters';
import type { SectionConfig } from '@/types/sectionTypes';
import type { CardConfig } from '@/types/cardTypes';
import { ALL_AVAILABLE_CARDS } from '@/types/cardTypes';

/**
 * ============================================================================
 * HOOK: useCardPermissions (FASE 4 — INTEGRAÇÃO COM NOVO SISTEMA)
 * ============================================================================
 * 
 * Hook central para todas as verificações de permissões de cards e seções.
 * 
 * INTEGRAÇÃO HÍBRIDA:
 * - useAuth: papéis do usuário (admin, accountant, subordinate)
 * - useSubordinatePermissions: configurações (novo + antigo integrados)
 * - useLevelPermissions: acesso direto ao novo sistema de níveis
 * 
 * LÓGICA: useSubordinatePermissions já prioriza novo sistema internamente
 * ============================================================================
 */

export function useCardPermissions() {
  const authContext = useAuth();
  const { isAdmin, isAccountant, user, rolesLoaded, roleGlobal, organizationId } = authContext;
  
  const { 
    permissions, 
    loading: permissionsLoading,
    canAccessClinical,
    financialAccess,
    canAccessMarketing,
    canAccessWhatsapp
  } = useEffectivePermissions();
  
  const loading = !rolesLoaded || permissionsLoading;

  // Derivar flags localmente a partir do novo sistema
  const isPsychologist = roleGlobal === 'psychologist';
  const isAssistant = roleGlobal === 'assistant';
  
  // isFullTherapist = psychologist no nível 1 (ou sem nível = assume topo)
  const isFullTherapist = 
    isPsychologist && 
    (!permissions?.levelNumber || permissions.levelNumber === 1);
  
  // isSubordinate = assistants, accountants, ou psychologist em níveis > 1
  const isSubordinate =
    (isAssistant || isAccountant) ||
    (isPsychologist && permissions?.levelNumber && permissions.levelNumber > 1);

  // Derivar role atual baseado no roleGlobal e posição hierárquica
  const currentRole: UserRole | null =
    isAdmin ? 'admin' :
    isFullTherapist ? 'fulltherapist' :
    isAccountant ? 'accountant' :
    isSubordinate ? 'subordinate' :
    null;

  /**
   * FASE 3: Verifica se usuário tem acesso a um domínio específico
   * Usa permissões efetivas do novo sistema
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

    // ====================================================================
    // NOVO SISTEMA: Usar permissões efetivas
    // ====================================================================
    if (!permissions) return false;

    switch (domain) {
      case 'clinical':
        return permissions.canAccessClinical;

      case 'financial':
        if (minimumLevel === 'none') return false;
        const access = permissions.financialAccess;
        return hasAccessLevel(access as AccessLevel, minimumLevel);

      case 'marketing':
        return permissions.canAccessMarketing;

      case 'media':
        return permissions.canAccessWhatsapp;

      case 'administrative':
        return true;

      case 'team':
        return false; // Subordinados NUNCA veem dados da equipe

      case 'general':
        return true;

      case 'charts':
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

    // Baseado em clinicalVisibleToSuperiors - se é visível para superiores, usuário gerencia apenas próprios
    return !permissions.canAccessClinical;
  };

  /**
   * Verifica se pode acessar dados financeiros gerais (fechamento completo)
   */
  const canViewFullFinancial = (): boolean => {
    if (isAdmin || isAccountant) return true;
    if (!isSubordinate) return true;
    if (!permissions) return false;

    return permissions.financialAccess === 'full';
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
      return shouldFilterToOwnData();
    }

    return true;
  };

  /**
   * FASE 2: Retorna cards que o usuário pode ver dentro de uma seção
   * Filtra por: availableCardIds, permissões individuais, compatibilidade de domínio
   */
  const getAvailableCardsForSection = (sectionConfig: SectionConfig): CardConfig[] => {
    const sectionCards = ALL_AVAILABLE_CARDS.filter(card =>
      sectionConfig.availableCardIds.includes(card.id)
    );

    const visibleCards = sectionCards.filter(card => canViewCard(card.id));

    const allowedDomains = [
      sectionConfig.permissionConfig.primaryDomain,
      ...(sectionConfig.permissionConfig.secondaryDomains || []),
    ];

    const finalCards = visibleCards.filter(card => {
      if (card.isChart) {
        return sectionConfig.id === 'dashboard-charts';
      }
      
      return card.permissionConfig && allowedDomains.includes(card.permissionConfig.domain);
    });
    
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

  /**
   * FASE 6: Verifica se posso acessar dados de um peer específico em um domínio
   */
  const canViewPeerDomain = async (
    peerUserId: string,
    domain: PermissionDomain
  ): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase.rpc('can_view_peer_data', {
        _requesting_user_id: user.id,
        _target_user_id: peerUserId,
        _domain: domain,
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking peer domain access:', error);
      return false;
    }
  };

  /**
   * FASE 6: Obtém domínios compartilhados com um peer
   */
  const getPeerSharedDomains = async (
    peerUserId: string
  ): Promise<PermissionDomain[]> => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase.rpc('get_peer_shared_domains', {
        _requesting_user_id: user.id,
        _target_user_id: peerUserId,
      });

      if (error) throw error;
      return (data || []) as PermissionDomain[];
    } catch (error) {
      console.error('Error getting peer shared domains:', error);
      return [];
    }
  };

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
    
    // FASE 4: Expor informações do sistema (removido usingNewSystem e levelInfo)
    
    // FASE 6: Peer sharing functions
    canViewPeerDomain,
    getPeerSharedDomains,
  };
}

/**
 * Helper: Verifica se accessLevel atende minimumLevel
 */
function hasAccessLevel(current: AccessLevel, minimum: AccessLevel): boolean {
  const levels: AccessLevel[] = ['none', 'read', 'write', 'full'];
  const currentIndex = levels.indexOf(current);
  const minimumIndex = levels.indexOf(minimum);
  return currentIndex >= minimumIndex;
}
