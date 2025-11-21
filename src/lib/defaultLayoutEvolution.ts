import type { EffectivePermissions } from '@/lib/resolveEffectivePermissions';

// Default layout configuration for PatientEvolutionMetrics component
export const DEFAULT_EVOLUTION_LAYOUT = {
  sectionHeights: {
    'evolution-charts-section': 800,
  },
  visibleCards: [
    'evolution-chart-consciousness',
    'evolution-chart-orientation',
    'evolution-chart-memory',
    'evolution-chart-mood',
    'evolution-chart-thought',
    'evolution-chart-language',
    'evolution-chart-sensoperception',
    'evolution-chart-intelligence',
    'evolution-chart-will',
    'evolution-chart-psychomotor',
    'evolution-chart-attention',
    'evolution-chart-personality',
  ],
  cardSizes: {
    'evolution-chart-consciousness': { width: 590, height: 320, x: 12, y: 11 },
    'evolution-chart-orientation': { width: 590, height: 320, x: 619, y: -309 },
    'evolution-chart-memory': { width: 590, height: 320, x: 12, y: -294 },
    'evolution-chart-mood': { width: 590, height: 320, x: 619, y: -614 },
    'evolution-chart-thought': { width: 590, height: 320, x: 12, y: -599 },
    'evolution-chart-language': { width: 590, height: 320, x: 619, y: -919 },
    'evolution-chart-sensoperception': { width: 590, height: 320, x: 12, y: -904 },
    'evolution-chart-intelligence': { width: 590, height: 320, x: 619, y: -1224 },
    'evolution-chart-will': { width: 590, height: 320, x: 12, y: -1209 },
    'evolution-chart-psychomotor': { width: 590, height: 320, x: 619, y: -1529 },
    'evolution-chart-attention': { width: 590, height: 320, x: 12, y: -1514 },
    'evolution-chart-personality': { width: 590, height: 320, x: 619, y: -1834 },
  } as Record<string, { width: number; height: number; x: number; y: number }>,
};

// Export as DEFAULT_LAYOUT for compatibility
export const DEFAULT_LAYOUT = DEFAULT_EVOLUTION_LAYOUT;

/**
 * ============================================================================
 * FILTER LAYOUT BY PERMISSIONS
 * ============================================================================
 * 
 * Remove cards não autorizados do layout baseado nas permissões do usuário.
 * Todos os cards de evolução são clínicos, então verificamos apenas acesso clínico.
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
export function getFilteredEvolutionLayout(
  permissions: EffectivePermissions | null,
  isAdmin: boolean,
  canViewCard: (cardId: string) => boolean
): typeof DEFAULT_EVOLUTION_LAYOUT {
  // Admin vê tudo
  if (isAdmin || !permissions) {
    return DEFAULT_EVOLUTION_LAYOUT;
  }

  // Filtrar cards visíveis
  const filteredVisibleCards = DEFAULT_EVOLUTION_LAYOUT.visibleCards.filter(cardId => 
    canViewCard(cardId)
  );

  // Filtrar tamanhos de cards (remover órfãos)
  const filteredCardSizes: Record<string, { width: number; height: number; x: number; y: number }> = {};
  filteredVisibleCards.forEach(cardId => {
    if (DEFAULT_EVOLUTION_LAYOUT.cardSizes[cardId]) {
      filteredCardSizes[cardId] = DEFAULT_EVOLUTION_LAYOUT.cardSizes[cardId];
    }
  });

  return {
    ...DEFAULT_EVOLUTION_LAYOUT,
    visibleCards: filteredVisibleCards,
    cardSizes: filteredCardSizes,
  };
}

// Function to reset layout to default
export function resetToDefaultEvolutionLayout() {
  // Clear only evolution-specific customizations
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('card-size-evolution-') || 
        key.startsWith('section-height-evolution-') || 
        key === 'evolution-visible-cards') {
      localStorage.removeItem(key);
    }
  });
  
  // Set default visible cards
  localStorage.setItem('evolution-visible-cards', JSON.stringify(DEFAULT_EVOLUTION_LAYOUT.visibleCards));
  
  // Set default section heights
  Object.entries(DEFAULT_EVOLUTION_LAYOUT.sectionHeights).forEach(([id, height]) => {
    localStorage.setItem(`section-height-${id}`, height.toString());
  });
  
  // Set default card sizes
  Object.entries(DEFAULT_EVOLUTION_LAYOUT.cardSizes).forEach(([id, size]) => {
    localStorage.setItem(`card-size-${id}`, JSON.stringify(size));
  });
}

// Export alias for compatibility
export const resetToDefaultLayout = resetToDefaultEvolutionLayout;
