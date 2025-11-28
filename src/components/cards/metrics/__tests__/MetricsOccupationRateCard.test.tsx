/**
 * 🧪 TESTES UNITÁRIOS: MetricsOccupationRateCard
 * 
 * @phase C3-R.3 - Testes Unitários
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MetricsOccupationRateCard } from '../administrative/MetricsOccupationRateCard';
import type { MetricsCardBaseProps } from '@/types/metricsCardTypes';

describe('MetricsOccupationRateCard', () => {
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

  it('renderiza taxa de ocupação', () => {
    const { container } = render(<MetricsOccupationRateCard {...mockProps} />);
    expect(container.textContent).toMatch(/%/);
  });

  it('mostra skeleton quando isLoading=true', () => {
    const { container } = render(<MetricsOccupationRateCard {...mockProps} isLoading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });
});
