import type { ExtendedAutonomyPermissions } from '@/hooks/useSubordinatePermissions';
import { DASHBOARD_SECTIONS } from './defaultSectionsDashboard';

/**
 * LAYOUT STRUCTURE FOR DASHBOARD EXAMPLE
 * 
 * Diferença fundamental do Dashboard original:
 * - Dashboard original: free-form absolute positioning (x, y, width, height)
 * - Dashboard Example: section-based sequential ordering (width, order)
 * 
 * ESTRUTURA:
 * {
 *   sectionId: {
 *     cardLayouts: [
 *       { cardId: string, width: number, order: number }
 *     ]
 *   }
 * }
 */

export interface CardLayout {
  cardId: string;
  width: number;
  order: number; // posição sequencial dentro da seção (0, 1, 2, ...)
}

export interface SectionLayout {
  cardLayouts: CardLayout[];
}

export type DashboardExampleLayout = Record<string, SectionLayout>;

/**
 * DEFAULT LAYOUT FOR DASHBOARD EXAMPLE
 * 
 * Define a largura inicial e ordem padrão dos cards em cada seção.
 * 
 * REGRAS:
 * - Cards métricos: 280-320px (largura padrão de cards de métrica)
 * - Cards gráficos: 400-500px (largura padrão de gráficos)
 * - Ordem: sequencial a partir de 0
 * 
 * NOTA: Apenas cards ATIVOS (visibleCardIds) são incluídos aqui.
 * Cards disponíveis mas não adicionados NÃO aparecem no layout.
 */
export const DEFAULT_DASHBOARD_EXAMPLE_LAYOUT: DashboardExampleLayout = {
  'dashboard-financial': {
    cardLayouts: [
      { cardId: 'dashboard-expected-revenue', width: 300, order: 0 },
      { cardId: 'dashboard-actual-revenue', width: 300, order: 1 },
      { cardId: 'dashboard-unpaid-value', width: 300, order: 2 },
    ],
  },
  'dashboard-administrative': {
    cardLayouts: [
      { cardId: 'dashboard-total-patients', width: 300, order: 0 },
      { cardId: 'dashboard-expected-sessions', width: 300, order: 1 },
      { cardId: 'dashboard-attended-sessions', width: 300, order: 2 },
      { cardId: 'dashboard-missed-sessions', width: 300, order: 3 },
      { cardId: 'dashboard-pending-sessions', width: 300, order: 4 },
    ],
  },
  'dashboard-clinical': {
    cardLayouts: [
      { cardId: 'dashboard-active-complaints', width: 300, order: 0 },
      { cardId: 'dashboard-no-diagnosis', width: 300, order: 1 },
    ],
  },
  'dashboard-media': {
    cardLayouts: [
      { cardId: 'dashboard-whatsapp-unread', width: 300, order: 0 },
    ],
  },
  'dashboard-general': {
    cardLayouts: [
      { cardId: 'dashboard-quick-actions', width: 400, order: 0 },
      { cardId: 'dashboard-recent-sessions', width: 500, order: 1 },
    ],
  },
  'dashboard-charts': {
    cardLayouts: [
      { cardId: 'dashboard-chart-revenue-trend', width: 450, order: 0 },
      { cardId: 'dashboard-chart-payment-status', width: 450, order: 1 },
      { cardId: 'dashboard-chart-monthly-comparison', width: 450, order: 2 },
      { cardId: 'dashboard-chart-revenue-by-therapist', width: 450, order: 3 },
      { cardId: 'dashboard-chart-session-types', width: 450, order: 4 },
      { cardId: 'dashboard-chart-therapist-distribution', width: 450, order: 5 },
      { cardId: 'dashboard-chart-attendance-weekly', width: 450, order: 6 },
    ],
  },
};

/**
 * GET CARD WIDTH FROM LAYOUT
 * 
 * Retorna a largura configurada de um card em uma seção específica.
 * Se não houver configuração, retorna largura padrão baseada no tipo.
 */
export function getCardWidth(sectionId: string, cardId: string): number {
  const sectionLayout = DEFAULT_DASHBOARD_EXAMPLE_LAYOUT[sectionId];
  if (!sectionLayout) return 300; // fallback padrão

  const cardLayout = sectionLayout.cardLayouts.find(cl => cl.cardId === cardId);
  if (!cardLayout) return 300; // fallback padrão

  return cardLayout.width;
}

/**
 * GET CARD ORDER FROM LAYOUT
 * 
 * Retorna a ordem configurada de um card em uma seção específica.
 * Se não houver configuração, retorna -1 (não está no layout).
 */
export function getCardOrder(sectionId: string, cardId: string): number {
  const sectionLayout = DEFAULT_DASHBOARD_EXAMPLE_LAYOUT[sectionId];
  if (!sectionLayout) return -1;

  const cardLayout = sectionLayout.cardLayouts.find(cl => cl.cardId === cardId);
  if (!cardLayout) return -1;

  return cardLayout.order;
}

/**
 * FILTER LAYOUT BY PERMISSIONS
 * 
 * Remove cards não autorizados do layout baseado nas permissões do usuário.
 * 
 * LÓGICA:
 * 1. Para cada seção, filtra cardLayouts removendo cards não autorizados
 * 2. Reordena os índices (order) para manter sequência contínua (0, 1, 2, ...)
 * 
 * RETORNA: Layout filtrado pronto para uso
 */
export function getFilteredDashboardExampleLayout(
  permissions: ExtendedAutonomyPermissions | null,
  isAdmin: boolean,
  canViewCard: (cardId: string) => boolean
): DashboardExampleLayout {
  // Admin vê tudo
  if (isAdmin || !permissions) {
    return DEFAULT_DASHBOARD_EXAMPLE_LAYOUT;
  }

  const filtered: DashboardExampleLayout = {};

  Object.entries(DEFAULT_DASHBOARD_EXAMPLE_LAYOUT).forEach(([sectionId, sectionLayout]) => {
    // Filtrar cards autorizados
    const authorizedCards = sectionLayout.cardLayouts.filter(cardLayout => 
      canViewCard(cardLayout.cardId)
    );

    // Reordenar índices
    const reorderedCards = authorizedCards
      .sort((a, b) => a.order - b.order)
      .map((cardLayout, index) => ({
        ...cardLayout,
        order: index,
      }));

    filtered[sectionId] = {
      cardLayouts: reorderedCards,
    };
  });

  return filtered;
}

/**
 * RESET TO DEFAULT LAYOUT
 * 
 * Limpa todas as personalizações do usuário e restaura layout padrão.
 * 
 * LIMPA:
 * - Larguras customizadas de cards (card-width-*)
 * - Ordem customizada de cards (card-order-*)
 * - Flags de colapso de seções
 */
export const resetToDefaultDashboardExampleLayout = () => {
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (
      key.startsWith('card-width-dashboard-') || 
      key.startsWith('card-order-dashboard-') ||
      key.startsWith('section-collapsed-dashboard-')
    ) {
      localStorage.removeItem(key);
    }
  });
  
  console.log('Dashboard Example layout reset to default');
};

/**
 * GET VISIBLE CARD IDS FOR SECTION
 * 
 * Retorna lista de IDs de cards visíveis em uma seção específica,
 * ordenados pela propriedade 'order'.
 * 
 * USO: Para renderização e integração com AddCardDialog
 */
export function getVisibleCardIdsForSection(sectionId: string): string[] {
  const sectionLayout = DEFAULT_DASHBOARD_EXAMPLE_LAYOUT[sectionId];
  if (!sectionLayout) return [];

  return sectionLayout.cardLayouts
    .sort((a, b) => a.order - b.order)
    .map(cl => cl.cardId);
}

/**
 * ADD CARD TO SECTION LAYOUT
 * 
 * Adiciona um novo card ao final da seção (maior order + 1).
 * Retorna novo layout atualizado.
 * 
 * NOTA: Esta função é helper para futuras implementações de adicionar cards.
 */
export function addCardToSectionLayout(
  layout: DashboardExampleLayout,
  sectionId: string,
  cardId: string,
  width: number = 300
): DashboardExampleLayout {
  const sectionLayout = layout[sectionId] || { cardLayouts: [] };
  const maxOrder = Math.max(-1, ...sectionLayout.cardLayouts.map(cl => cl.order));
  
  const newCardLayout: CardLayout = {
    cardId,
    width,
    order: maxOrder + 1,
  };

  return {
    ...layout,
    [sectionId]: {
      cardLayouts: [...sectionLayout.cardLayouts, newCardLayout],
    },
  };
}

/**
 * REMOVE CARD FROM SECTION LAYOUT
 * 
 * Remove um card da seção e reordena os índices.
 * Retorna novo layout atualizado.
 */
export function removeCardFromSectionLayout(
  layout: DashboardExampleLayout,
  sectionId: string,
  cardId: string
): DashboardExampleLayout {
  const sectionLayout = layout[sectionId];
  if (!sectionLayout) return layout;

  const filteredCards = sectionLayout.cardLayouts
    .filter(cl => cl.cardId !== cardId)
    .sort((a, b) => a.order - b.order)
    .map((cl, index) => ({ ...cl, order: index }));

  return {
    ...layout,
    [sectionId]: {
      cardLayouts: filteredCards,
    },
  };
}
