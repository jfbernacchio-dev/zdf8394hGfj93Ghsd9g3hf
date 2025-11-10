// Default layout configuration for DashboardTest page
export const DEFAULT_DASHBOARD_LAYOUT = {
  sectionHeights: {
    'metrics-section': 406,
    'charts-section': 353,
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
    'chart-monthly-comparison',
    'chart-revenue-trend',
    'chart-attendance-weekly',
  ],
  cardOrder: [
    'total-patients',
    'expected-revenue',
    'actual-revenue',
    'attended-sessions',
    'expected-sessions',
    'missed-sessions',
    'pending-sessions',
    'unpaid-value',
    'chart-monthly-comparison',
    'chart-revenue-trend',
    'chart-attendance-weekly',
  ],
  cardSizes: {
    'total-patients': { width: 280, height: 160, x: 12, y: 11 },
    'expected-revenue': { width: 280, height: 160, x: 309, y: -149 },
    'actual-revenue': { width: 280, height: 160, x: 606, y: -309 },
    'attended-sessions': { width: 280, height: 160, x: 903, y: -469 },
    'expected-sessions': { width: 280, height: 160, x: 12, y: -452 },
    'missed-sessions': { width: 280, height: 160, x: 309, y: -612 },
    'pending-sessions': { width: 280, height: 160, x: 606, y: -772 },
    'unpaid-value': { width: 280, height: 160, x: 903, y: -932 },
    'chart-monthly-comparison': { width: 426, height: 329, x: 29, y: 10 },
    'chart-revenue-trend': { width: 426, height: 329, x: 472, y: -319 },
    'chart-attendance-weekly': { width: 426, height: 329, x: 915, y: -648 },
    // Legacy cards kept for compatibility
    'history': { width: 430, height: 160, x: 458, y: -7 },
    'contact-info': { width: 647, height: 220, x: -211, y: 0 },
    'clinical-info': { width: 894, height: 304, x: -1, y: -151 },
    'next-appointment': { width: 227, height: 220, x: 0, y: 0 },
    'clinical-complaint': { width: 431, height: 364, x: 0, y: 0 },
    'stat-total': { width: 200, height: 120, x: 1, y: 0 },
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
