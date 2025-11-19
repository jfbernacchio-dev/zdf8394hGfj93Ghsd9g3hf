import type { ExtendedAutonomyPermissions } from '@/hooks/useSubordinatePermissions';
import { DASHBOARD_SECTIONS } from './defaultSectionsDashboard';
import type { GridCardLayout } from '@/types/cardTypes';

/**
 * LAYOUT STRUCTURE FOR DASHBOARD EXAMPLE
 * 
 * FASE 2: Migração para React Grid Layout
 * 
 * SISTEMA ANTIGO (DEPRECATED):
 * - section-based sequential ordering (width, order)
 * - Apenas horizontal, sem controle vertical
 * 
 * SISTEMA NOVO (React Grid Layout):
 * - Grid de 12 colunas
 * - Posicionamento livre 2D (x, y, w, h)
 * - Resize bidirecional
 * - Reflow automático
 * 
 * ESTRUTURA:
 * {
 *   sectionId: {
 *     cardLayouts: [
 *       { i: cardId, x: col, y: row, w: cols, h: rows, minW, minH }
 *     ]
 *   }
 * }
 */

// ============================================================================
// TIPOS LEGADOS (mantidos para compatibilidade durante migração)
// ============================================================================

export interface CardLayout {
  cardId: string;
  width: number;
  order: number;
}

export interface SectionLayout {
  cardLayouts: CardLayout[];
}

export type DashboardExampleLayout = Record<string, SectionLayout>;

// ============================================================================
// TIPOS NOVOS (React Grid Layout) - FASE 2
// ============================================================================

export interface GridSectionLayout {
  cardLayouts: GridCardLayout[];
}

export type DashboardGridLayout = Record<string, GridSectionLayout>;

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
// ============================================================================
// LAYOUT LEGADO (DEPRECATED) - Mantido para compatibilidade
// ============================================================================

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
      { cardId: 'dashboard-attendance-rate', width: 300, order: 5 },
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
  'dashboard-team': {
    cardLayouts: [
      { cardId: 'dashboard-expected-revenue-team', width: 300, order: 0 },
      { cardId: 'dashboard-actual-revenue-team', width: 300, order: 1 },
      { cardId: 'dashboard-unpaid-value-team', width: 300, order: 2 },
      { cardId: 'dashboard-payment-rate-team', width: 300, order: 3 },
      { cardId: 'dashboard-total-patients-team', width: 300, order: 4 },
      { cardId: 'dashboard-attended-sessions-team', width: 300, order: 5 },
    ],
  },
};

// ============================================================================
// GRID LAYOUT PADRÃO (React Grid Layout) - FASE 2
// ============================================================================

/**
 * DEFAULT GRID LAYOUT FOR DASHBOARD EXAMPLE
 * 
 * Layout baseado em grid de 12 colunas para React Grid Layout.
 * 
 * DIMENSIONAMENTO:
 * - Cards pequenos (métricas): 3 cols (25% da largura) × 2 rows (120px)
 * - Cards médios (ações): 4-6 cols (33-50%) × 2-3 rows (120-180px)
 * - Cards grandes (gráficos): 6-12 cols (50-100%) × 4-6 rows (240-360px)
 * 
 * REGRAS:
 * - minW: 2 cols (mínimo para legibilidade)
 * - minH: 1 row (mínimo vertical)
 * - maxW: 12 cols (largura total do grid)
 * - Cards de gráficos: altura maior (4-6 rows)
 * - Cards de métricas: altura padrão (2 rows)
 */
export const DEFAULT_DASHBOARD_GRID_LAYOUT: DashboardGridLayout = {
  // SEÇÃO FINANCIAL: 3 cards de métricas em linha
  'dashboard-financial': {
    cardLayouts: [
      { i: 'dashboard-expected-revenue', x: 0, y: 0, w: 3, h: 4, minW: 2, minH: 2, maxW: 12 },
      { i: 'dashboard-actual-revenue', x: 3, y: 0, w: 3, h: 4, minW: 2, minH: 2, maxW: 12 },
      { i: 'dashboard-unpaid-value', x: 6, y: 0, w: 3, h: 4, minW: 2, minH: 2, maxW: 12 },
    ],
  },
  
  // SEÇÃO ADMINISTRATIVE: 6 cards de métricas (2 linhas de 3)
  'dashboard-administrative': {
    cardLayouts: [
      { i: 'dashboard-total-patients', x: 0, y: 0, w: 3, h: 4, minW: 2, minH: 2, maxW: 12 },
      { i: 'dashboard-expected-sessions', x: 3, y: 0, w: 3, h: 4, minW: 2, minH: 2, maxW: 12 },
      { i: 'dashboard-attended-sessions', x: 6, y: 0, w: 3, h: 4, minW: 2, minH: 2, maxW: 12 },
      { i: 'dashboard-missed-sessions', x: 9, y: 0, w: 3, h: 4, minW: 2, minH: 2, maxW: 12 },
      { i: 'dashboard-pending-sessions', x: 0, y: 4, w: 3, h: 4, minW: 2, minH: 2, maxW: 12 },
      { i: 'dashboard-attendance-rate', x: 3, y: 4, w: 3, h: 4, minW: 2, minH: 2, maxW: 12 },
    ],
  },
  
  // SEÇÃO CLINICAL: 2 cards de métricas em linha
  'dashboard-clinical': {
    cardLayouts: [
      { i: 'dashboard-active-complaints', x: 0, y: 0, w: 3, h: 4, minW: 2, minH: 2, maxW: 12 },
      { i: 'dashboard-no-diagnosis', x: 3, y: 0, w: 3, h: 4, minW: 2, minH: 2, maxW: 12 },
    ],
  },
  
  // SEÇÃO MEDIA: 1 card de métrica
  'dashboard-media': {
    cardLayouts: [
      { i: 'dashboard-whatsapp-unread', x: 0, y: 0, w: 3, h: 4, minW: 2, minH: 2, maxW: 12 },
    ],
  },
  
  // SEÇÃO GENERAL: 2 cards (ações médio + lista maior)
  'dashboard-general': {
    cardLayouts: [
      { i: 'dashboard-quick-actions', x: 0, y: 0, w: 4, h: 6, minW: 3, minH: 4, maxW: 12 },
      { i: 'dashboard-recent-sessions', x: 4, y: 0, w: 8, h: 8, minW: 4, minH: 6, maxW: 12 },
    ],
  },
  
  // SEÇÃO CHARTS: 7 gráficos (2 por linha, altura maior)
  'dashboard-charts': {
    cardLayouts: [
      { i: 'dashboard-chart-revenue-trend', x: 0, y: 0, w: 6, h: 8, minW: 4, minH: 6, maxW: 12 },
      { i: 'dashboard-chart-payment-status', x: 6, y: 0, w: 6, h: 8, minW: 4, minH: 6, maxW: 12 },
      { i: 'dashboard-chart-monthly-comparison', x: 0, y: 8, w: 6, h: 8, minW: 4, minH: 6, maxW: 12 },
      { i: 'dashboard-chart-revenue-by-therapist', x: 6, y: 8, w: 6, h: 8, minW: 4, minH: 6, maxW: 12 },
      { i: 'dashboard-chart-session-types', x: 0, y: 16, w: 6, h: 8, minW: 4, minH: 6, maxW: 12 },
      { i: 'dashboard-chart-therapist-distribution', x: 6, y: 16, w: 6, h: 8, minW: 4, minH: 6, maxW: 12 },
      { i: 'dashboard-chart-attendance-weekly', x: 0, y: 24, w: 12, h: 10, minW: 6, minH: 8, maxW: 12 },
    ],
  },
  
  // SEÇÃO TEAM: 6 cards de métricas (2 linhas de 3)
  'dashboard-team': {
    cardLayouts: [
      { i: 'dashboard-expected-revenue-team', x: 0, y: 0, w: 3, h: 4, minW: 2, minH: 2, maxW: 12 },
      { i: 'dashboard-actual-revenue-team', x: 3, y: 0, w: 3, h: 4, minW: 2, minH: 2, maxW: 12 },
      { i: 'dashboard-unpaid-value-team', x: 6, y: 0, w: 3, h: 4, minW: 2, minH: 2, maxW: 12 },
      { i: 'dashboard-payment-rate-team', x: 9, y: 0, w: 3, h: 4, minW: 2, minH: 2, maxW: 12 },
      { i: 'dashboard-total-patients-team', x: 0, y: 4, w: 3, h: 4, minW: 2, minH: 2, maxW: 12 },
      { i: 'dashboard-attended-sessions-team', x: 3, y: 4, w: 3, h: 4, minW: 2, minH: 2, maxW: 12 },
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
