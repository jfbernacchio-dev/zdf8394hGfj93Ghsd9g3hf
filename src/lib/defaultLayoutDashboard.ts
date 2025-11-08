// Default layout configuration for DashboardTest page
export const DEFAULT_DASHBOARD_LAYOUT = {
  sectionHeights: {
    'metrics-section': 400,
    'charts-section': 450,
  },
  visibleCards: [
    'total-patients',
    'expected-revenue',
    'actual-revenue',
    'attended-sessions',
    'expected-sessions',
    'missed-sessions',
    'pending-sessions',
    'unpaid-value',
  ],
  cardSizes: {
    'total-patients': { width: 280, height: 160, x: 0, y: 0 },
    'expected-revenue': { width: 280, height: 160, x: 0, y: 0 },
    'actual-revenue': { width: 280, height: 160, x: 0, y: 0 },
    'attended-sessions': { width: 280, height: 160, x: 0, y: 0 },
    'expected-sessions': { width: 280, height: 160, x: 0, y: 0 },
    'missed-sessions': { width: 280, height: 160, x: 0, y: 0 },
    'pending-sessions': { width: 280, height: 160, x: 0, y: 0 },
    'unpaid-value': { width: 280, height: 160, x: 0, y: 0 },
  } as Record<string, { width: number; height: number; x: number; y: number }>,
};

// Function to reset layout to default
export const resetToDefaultDashboardLayout = () => {
  // Clear all existing customizations
  const keys = Object.keys(localStorage);
  keys.forEach(key => {
    if (key.startsWith('card-size-') || 
        key.startsWith('section-height-') || 
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
