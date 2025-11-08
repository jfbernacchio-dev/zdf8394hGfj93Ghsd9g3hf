// Default layout configuration for patient detail page
export const DEFAULT_LAYOUT = {
  // Section heights
  sectionHeights: {
    'stats-section': 200,
    'functional-section-1': 300,
    'functional-section-2': 300,
  },
  
  // Card sizes and positions (only for cards that need custom positioning)
  cardSizes: {
    // Add custom card sizes here if needed in the future
  },
  
  // Visible cards by default
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
    'history'
  ]
};

export const resetToDefaultLayout = () => {
  // Clear all layout-related localStorage items
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('card-size-') || key.startsWith('section-height-')) {
      localStorage.removeItem(key);
    }
  });
  
  // Set visible cards to default
  localStorage.setItem('visible-cards', JSON.stringify(DEFAULT_LAYOUT.visibleCards));
  
  // Set section heights to default
  Object.entries(DEFAULT_LAYOUT.sectionHeights).forEach(([id, height]) => {
    localStorage.setItem(`section-height-${id}`, height.toString());
  });
  
  // Set card sizes to default (if any)
  Object.entries(DEFAULT_LAYOUT.cardSizes).forEach(([id, size]) => {
    localStorage.setItem(`card-size-${id}`, JSON.stringify(size));
  });
};
