// Default layout configuration for PatientEvolutionMetrics component
export const DEFAULT_EVOLUTION_LAYOUT = {
  sectionHeights: {
    'evolution-charts-section': 800,
  },
  visibleCards: [
    'chart-consciousness',
    'chart-orientation',
    'chart-memory',
    'chart-mood',
    'chart-thought',
    'chart-language',
    'chart-sensoperception',
    'chart-intelligence',
    'chart-will',
    'chart-psychomotor',
    'chart-attention',
    'chart-personality',
  ],
  cardSizes: {
    'chart-consciousness': { width: 590, height: 320, x: 12, y: 11 },
    'chart-orientation': { width: 590, height: 320, x: 619, y: -309 },
    'chart-memory': { width: 590, height: 320, x: 12, y: -294 },
    'chart-mood': { width: 590, height: 320, x: 619, y: -614 },
    'chart-thought': { width: 590, height: 320, x: 12, y: -599 },
    'chart-language': { width: 590, height: 320, x: 619, y: -919 },
    'chart-sensoperception': { width: 590, height: 320, x: 12, y: -904 },
    'chart-intelligence': { width: 590, height: 320, x: 619, y: -1224 },
    'chart-will': { width: 590, height: 320, x: 12, y: -1209 },
    'chart-psychomotor': { width: 590, height: 320, x: 619, y: -1529 },
    'chart-attention': { width: 590, height: 320, x: 12, y: -1514 },
    'chart-personality': { width: 590, height: 320, x: 619, y: -1834 },
  } as Record<string, { width: number; height: number; x: number; y: number }>,
};

// Function to reset layout to default
export const resetToDefaultEvolutionLayout = () => {
  // Clear all existing customizations
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('card-size-chart-') || 
        key.startsWith('section-height-evolution-charts-section') || 
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
};
