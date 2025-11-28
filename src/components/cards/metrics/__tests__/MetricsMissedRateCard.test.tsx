/**
 * 🧪 TESTES UNITÁRIOS: MetricsMissedRateCard
 * 
 * @phase C3-R.3 - Testes Unitários
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MetricsMissedRateCard } from '../administrative/MetricsMissedRateCard';
import type { MetricsCardBaseProps } from '@/types/metricsCardTypes';

describe('MetricsMissedRateCard', () => {
  const mockProps: MetricsCardBaseProps = {
    periodFilter: {
      type: 'month',
      startDate: new Date('2025-01-01'),
      endDate: new Date('2025-01-31')
    },
    summary: {
      totalRevenue: 15000,
      forecastRevenue: 18000,
      totalSessions: 50,
      missedRate: 10,
      avgPerSession: 300,
      activePatients: 25,
      lostRevenue: 1500,
      avgRevenuePerActivePatient: 600,
    },
    isLoading: false
  };

  it('renderiza taxa de faltas correta', () => {
    const { container } = render(<MetricsMissedRateCard {...mockProps} />);
    expect(container.textContent).toMatch(/10/);
    expect(container.textContent).toMatch(/%/);
  });

  it('mostra skeleton quando isLoading=true', () => {
    const { container } = render(<MetricsMissedRateCard {...mockProps} isLoading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });
});
