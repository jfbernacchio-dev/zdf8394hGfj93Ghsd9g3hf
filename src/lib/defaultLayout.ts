// Default layout configuration for PatientDetailNew page
export const DEFAULT_LAYOUT = {
  sectionHeights: {
    'stats-section': 200,
    'functional-section-1': 300,
    'functional-section-2': 300,
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
  // Card sizes will use component defaults if not specified here
  cardSizes: {} as Record<string, { width: number; height: number; x: number; y: number }>,
};

// Function to reset layout to default
export const resetToDefaultLayout = () => {
  // Clear all card sizes
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('card-size-') || key.startsWith('section-height-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Set default visible cards
  localStorage.setItem('visible-cards', JSON.stringify(DEFAULT_LAYOUT.visibleCards));
  
  // Set default section heights
  Object.entries(DEFAULT_LAYOUT.sectionHeights).forEach(([id, height]) => {
    localStorage.setItem(`section-height-${id}`, height.toString());
  });
};
