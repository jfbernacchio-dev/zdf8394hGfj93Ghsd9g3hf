/**
 * ============================================================================
 * DASHBOARD LAYOUT PERSISTENCE - FASE 3C
 * ============================================================================
 * 
 * Funções auxiliares para persistência de layout do Dashboard Example.
 * 
 * ARQUITETURA:
 * - Supabase (user_layout_preferences): fonte de verdade principal
 * - localStorage: cache local para customizações temporárias
 * - Merge: localStorage sobrescreve Supabase em caso de conflito
 * 
 * DIFERENÇAS DOS SISTEMAS EXISTENTES:
 * - layoutStorage.ts: gerencia templates salvos (user_layout_templates)
 * - Este arquivo: gerencia preferências ativas (user_layout_preferences)
 * 
 * ============================================================================
 */

import type { DashboardExampleLayout } from './defaultLayoutDashboardExample';

/**
 * SAVE LAYOUT TO LOCALSTORAGE
 * 
 * Salva layout completo no localStorage para cache local.
 * Usado como fallback quando Supabase não está disponível.
 */
export const saveLayoutToLocalStorage = (layout: DashboardExampleLayout): void => {
  try {
    Object.entries(layout).forEach(([sectionId, section]) => {
      section.cardLayouts.forEach(cardLayout => {
        // Salvar width
        const widthKey = `card-width-${sectionId}-${cardLayout.cardId}`;
        localStorage.setItem(widthKey, cardLayout.width.toString());

        // Salvar order
        const orderKey = `card-order-${sectionId}-${cardLayout.cardId}`;
        localStorage.setItem(orderKey, cardLayout.order.toString());
      });
    });

    console.log('[dashboardLayoutPersistence] Layout salvo no localStorage');
  } catch (error) {
    console.error('[dashboardLayoutPersistence] Erro ao salvar no localStorage:', error);
  }
};

/**
 * LOAD CARD WIDTH FROM LOCALSTORAGE
 * 
 * Carrega largura customizada de um card específico.
 * Retorna null se não houver customização.
 */
export const loadCardWidthFromLocalStorage = (
  sectionId: string,
  cardId: string
): number | null => {
  const widthKey = `card-width-${sectionId}-${cardId}`;
  const saved = localStorage.getItem(widthKey);
  
  if (!saved) return null;
  
  const width = parseInt(saved, 10);
  return !isNaN(width) ? width : null;
};

/**
 * LOAD CARD ORDER FROM LOCALSTORAGE
 * 
 * Carrega ordem customizada de um card específico.
 * Retorna null se não houver customização.
 */
export const loadCardOrderFromLocalStorage = (
  sectionId: string,
  cardId: string
): number | null => {
  const orderKey = `card-order-${sectionId}-${cardId}`;
  const saved = localStorage.getItem(orderKey);
  
  if (!saved) return null;
  
  const order = parseInt(saved, 10);
  return !isNaN(order) ? order : null;
};

/**
 * CLEAR SECTION LAYOUT FROM LOCALSTORAGE
 * 
 * Limpa todas as customizações de uma seção específica.
 */
export const clearSectionLayoutFromLocalStorage = (sectionId: string): void => {
  const keys = Object.keys(localStorage);
  const keysToRemove = keys.filter(
    key => key.startsWith(`card-width-${sectionId}-`) ||
           key.startsWith(`card-order-${sectionId}-`)
  );

  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log(`[dashboardLayoutPersistence] Limpou ${keysToRemove.length} itens da seção ${sectionId}`);
};

/**
 * CLEAR ALL DASHBOARD LAYOUT FROM LOCALSTORAGE
 * 
 * Limpa TODAS as customizações do dashboard example.
 * Usado no reset para layout padrão.
 */
export const clearAllDashboardLayoutFromLocalStorage = (): void => {
  const keys = Object.keys(localStorage);
  const keysToRemove = keys.filter(
    key => key.startsWith('card-width-dashboard-') ||
           key.startsWith('card-order-dashboard-') ||
           key.startsWith('section-collapsed-dashboard-')
  );

  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log(`[dashboardLayoutPersistence] Limpou ${keysToRemove.length} itens do dashboard`);
};

/**
 * HAS LOCAL CUSTOMIZATIONS
 * 
 * Verifica se existem customizações locais não salvas no Supabase.
 * Útil para avisar usuário antes de sair da página.
 */
export const hasLocalCustomizations = (): boolean => {
  const keys = Object.keys(localStorage);
  return keys.some(
    key => key.startsWith('card-width-dashboard-') ||
           key.startsWith('card-order-dashboard-')
  );
};

/**
 * GET LAYOUT SUMMARY
 * 
 * Retorna resumo do layout atual para debug/logging.
 */
export const getLayoutSummary = (layout: DashboardExampleLayout): string => {
  const sections = Object.keys(layout).length;
  let totalCards = 0;
  
  Object.values(layout).forEach(section => {
    totalCards += section.cardLayouts.length;
  });

  return `${sections} seções, ${totalCards} cards`;
};

/**
 * VALIDATE LAYOUT STRUCTURE
 * 
 * Valida se o layout possui estrutura válida.
 * Retorna true se válido, false caso contrário.
 */
export const validateLayoutStructure = (layout: any): layout is DashboardExampleLayout => {
  if (!layout || typeof layout !== 'object') return false;

  // Verificar se todas as seções têm cardLayouts
  for (const sectionId in layout) {
    const section = layout[sectionId];
    
    if (!section || !Array.isArray(section.cardLayouts)) {
      console.error(`[dashboardLayoutPersistence] Seção ${sectionId} inválida`);
      return false;
    }

    // Verificar estrutura de cada cardLayout
    for (const cardLayout of section.cardLayouts) {
      if (
        !cardLayout.cardId ||
        typeof cardLayout.width !== 'number' ||
        typeof cardLayout.order !== 'number'
      ) {
        console.error(`[dashboardLayoutPersistence] CardLayout inválido em ${sectionId}:`, cardLayout);
        return false;
      }
    }
  }

  return true;
};
