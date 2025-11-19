import type { ExtendedAutonomyPermissions } from '@/hooks/useSubordinatePermissions';

// Default layout configuration for DashboardTest page
export const DEFAULT_DASHBOARD_LAYOUT = {
  sectionHeights: {
    'dashboard-financial': 350,
    'dashboard-administrative': 350,
    'dashboard-clinical': 300,
    'dashboard-media': 300,
    'dashboard-general': 350,
    'dashboard-charts': 400,
    'dashboard-team': 350,
  },
  visibleCards: [
    // Financeira
    'dashboard-expected-revenue',
    'dashboard-actual-revenue',
    'dashboard-unpaid-value',
    // Administrativa
    'dashboard-total-patients',
    'dashboard-expected-sessions',
    'dashboard-attended-sessions',
    'dashboard-missed-sessions',
    // Geral
    'dashboard-quick-actions',
    // Gráficos
    'dashboard-chart-revenue-trend',
    'dashboard-chart-attendance-weekly',
    'dashboard-chart-monthly-comparison',
    // Equipe
    'dashboard-expected-revenue-team',
    'dashboard-actual-revenue-team',
    'dashboard-total-patients-team',
    'dashboard-active-therapists-team',
  ],
  cardSizes: {
    // Financeira
    'dashboard-expected-revenue': { width: 280, height: 160, x: 0, y: 0 },
    'dashboard-actual-revenue': { width: 280, height: 160, x: 300, y: 0 },
    'dashboard-unpaid-value': { width: 280, height: 160, x: 600, y: 0 },
    // Administrativa
    'dashboard-total-patients': { width: 280, height: 160, x: 0, y: 0 },
    'dashboard-expected-sessions': { width: 280, height: 160, x: 300, y: 0 },
    'dashboard-attended-sessions': { width: 280, height: 160, x: 600, y: 0 },
    'dashboard-missed-sessions': { width: 280, height: 160, x: 900, y: 0 },
    // Geral
    'dashboard-quick-actions': { width: 400, height: 300, x: 0, y: 0 },
    // Gráficos
    'dashboard-chart-revenue-trend': { width: 500, height: 350, x: 0, y: 0 },
    'dashboard-chart-attendance-weekly': { width: 500, height: 350, x: 520, y: 0 },
    'dashboard-chart-monthly-comparison': { width: 500, height: 350, x: 1040, y: 0 },
    // Equipe
    'dashboard-expected-revenue-team': { width: 280, height: 160, x: 0, y: 0 },
    'dashboard-actual-revenue-team': { width: 280, height: 160, x: 300, y: 0 },
    'dashboard-total-patients-team': { width: 280, height: 160, x: 600, y: 0 },
    'dashboard-active-therapists-team': { width: 280, height: 160, x: 900, y: 0 },
  } as Record<string, { width: number; height: number; x: number; y: number }>,
};

/**
 * ============================================================================
 * FILTER LAYOUT BY PERMISSIONS
 * ============================================================================
 * 
 * Remove cards não autorizados do layout baseado nas permissões do usuário.
 * 
 * LÓGICA:
 * 1. Filtra visibleCards removendo IDs não autorizados
 * 2. Remove cardSizes órfãos (cards que não existem mais em visibleCards)
 * 3. Mantém sectionHeights inalterado
 * 
 * RETORNA: Layout filtrado pronto para uso
 * 
 * ============================================================================
 */
export function getFilteredDashboardLayout(
  permissions: ExtendedAutonomyPermissions | null,
  isAdmin: boolean,
  canViewCard: (cardId: string) => boolean
): typeof DEFAULT_DASHBOARD_LAYOUT {
  // Admin vê tudo
  if (isAdmin || !permissions) {
    return DEFAULT_DASHBOARD_LAYOUT;
  }

  // Filtrar cards visíveis
  const filteredVisibleCards = DEFAULT_DASHBOARD_LAYOUT.visibleCards.filter(cardId => 
    canViewCard(cardId)
  );

  // Filtrar tamanhos de cards (remover órfãos)
  const filteredCardSizes: Record<string, { width: number; height: number; x: number; y: number }> = {};
  filteredVisibleCards.forEach(cardId => {
    if (DEFAULT_DASHBOARD_LAYOUT.cardSizes[cardId]) {
      filteredCardSizes[cardId] = DEFAULT_DASHBOARD_LAYOUT.cardSizes[cardId];
    }
  });

  return {
    ...DEFAULT_DASHBOARD_LAYOUT,
    visibleCards: filteredVisibleCards,
    cardSizes: filteredCardSizes,
  };
}

// Function to reset layout to default
export const resetToDefaultDashboardLayout = () => {
  // Clear only dashboard-specific customizations
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('card-size-dashboard-') || 
        key.startsWith('section-height-dashboard-') || 
        key === 'dashboard-visible-cards') {
      localStorage.removeItem(key);
    }
  });
  
  // Set default visible cards
  localStorage.setItem('dashboard-visible-cards', JSON.stringify(DEFAULT_DASHBOARD_LAYOUT.visibleCards));
  
  // Set default section heights
  Object.entries(DEFAULT_DASHBOARD_LAYOUT.sectionHeights).forEach(([id, height]) => {
    localStorage.setItem(`section-height-${id}`, height.toString());
  });
  
  // Set default card sizes
  Object.entries(DEFAULT_DASHBOARD_LAYOUT.cardSizes).forEach(([id, size]) => {
    localStorage.setItem(`card-size-${id}`, JSON.stringify(size));
  });
};
