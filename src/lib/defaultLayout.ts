// Default layout configuration for PatientDetailNew page
export const DEFAULT_LAYOUT = {
  sectionHeights: {
    'stats-section': 155,
    'functional-section': 552,
  },
  visibleCards: [
    'stat-total',
    'stat-attended',
    'stat-scheduled',
    'stat-unpaid',
    'stat-nfse',
    'next-appointment',
    'contact-info',
    'clinical-complaint',
    'clinical-info',
    'history',
  ],
  cardOrder: [
    'stat-total',
    'stat-attended',
    'stat-scheduled',
    'stat-unpaid',
    'stat-nfse',
    'next-appointment',
    'contact-info',
    'clinical-complaint',
    'clinical-info',
    'history',
  ],
  cardSizes: {
    'history': { width: 430, height: 160, x: 458, y: -7 },
    'contact-info': { width: 647, height: 220, x: -211, y: 0 },
    'stat-total': { width: 200, height: 120, x: 1, y: 0 },
    'clinical-info': { width: 894, height: 304, x: -1, y: -151 },
    'clinical-complaint': { width: 431, height: 364, x: 0, y: 0 },
    'next-appointment': { width: 227, height: 220, x: 0, y: 0 },
  } as Record<string, { width: number; height: number; x: number; y: number }>,
};

// Function to reset layout to default
export const resetToDefaultLayout = () => {
  // Clear all existing customizations
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('card-size-') || key.startsWith('section-height-') || key === 'visible-cards') {
      localStorage.removeItem(key);
    }
  });
  
  // Set default visible cards
  localStorage.setItem('visible-cards', JSON.stringify(DEFAULT_LAYOUT.visibleCards));
  
  // Set default section heights
  Object.entries(DEFAULT_LAYOUT.sectionHeights).forEach(([id, height]) => {
    localStorage.setItem(`section-height-${id}`, height.toString());
  });
  
  // Set default card sizes
  Object.entries(DEFAULT_LAYOUT.cardSizes).forEach(([id, size]) => {
    localStorage.setItem(`card-size-${id}`, JSON.stringify(size));
  });
};
