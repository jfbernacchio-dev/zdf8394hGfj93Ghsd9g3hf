// Default layout configuration for DashboardTest page
export const DEFAULT_DASHBOARD_LAYOUT = {
  sectionHeights: {
    'dashboard-metrics-section': 406,
    'dashboard-charts-section': 353,
  },
  visibleCards: [
    'dashboard-total-patients',
    'dashboard-expected-revenue',
    'dashboard-actual-revenue',
    'dashboard-attended-sessions',
    'dashboard-expected-sessions',
    'dashboard-missed-sessions',
    'dashboard-pending-sessions',
    'dashboard-unpaid-value',
    'dashboard-chart-monthly-comparison',
    'dashboard-chart-revenue-trend',
    'dashboard-chart-attendance-weekly',
  ],
  cardSizes: {
    'dashboard-total-patients': { width: 280, height: 160, x: 12, y: 11 },
    'dashboard-expected-revenue': { width: 280, height: 160, x: 309, y: -149 },
    'dashboard-actual-revenue': { width: 280, height: 160, x: 606, y: -309 },
    'dashboard-attended-sessions': { width: 280, height: 160, x: 903, y: -469 },
    'dashboard-expected-sessions': { width: 280, height: 160, x: 12, y: -452 },
    'dashboard-missed-sessions': { width: 280, height: 160, x: 309, y: -612 },
    'dashboard-pending-sessions': { width: 280, height: 160, x: 606, y: -772 },
    'dashboard-unpaid-value': { width: 280, height: 160, x: 903, y: -932 },
    'dashboard-chart-monthly-comparison': { width: 426, height: 329, x: 29, y: 10 },
    'dashboard-chart-revenue-trend': { width: 426, height: 329, x: 472, y: -319 },
    'dashboard-chart-attendance-weekly': { width: 426, height: 329, x: 915, y: -648 },
  } as Record<string, { width: number; height: number; x: number; y: number }>,
};

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
