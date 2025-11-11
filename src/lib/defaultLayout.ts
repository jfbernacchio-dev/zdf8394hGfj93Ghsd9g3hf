// Default layout configuration for PatientDetailNew page
export const DEFAULT_LAYOUT = {
  sectionHeights: {
    'patient-stats-section': 155,
    'patient-functional-section': 552,
  },
  visibleCards: [
    'patient-stat-total',
    'patient-stat-attended',
    'patient-stat-scheduled',
    'patient-stat-unpaid',
    'patient-stat-nfse',
    'patient-next-appointment',
    'patient-contact-info',
    'patient-clinical-complaint',
    'patient-clinical-info',
    'patient-history',
  ],
  cardSizes: {
    'patient-history': { width: 430, height: 160, x: 458, y: -7 },
    'patient-contact-info': { width: 647, height: 220, x: -211, y: 0 },
    'patient-stat-total': { width: 200, height: 120, x: 1, y: 0 },
    'patient-clinical-info': { width: 894, height: 304, x: -1, y: -151 },
    'patient-clinical-complaint': { width: 431, height: 364, x: 0, y: 0 },
    'patient-next-appointment': { width: 227, height: 220, x: 0, y: 0 },
  } as Record<string, { width: number; height: number; x: number; y: number }>,
};

// Function to reset layout to default
export const resetToDefaultLayout = () => {
  // Clear only patient-specific customizations
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('card-size-patient-') || 
        key.startsWith('section-height-patient-') || 
        key === 'visible-cards') {
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
