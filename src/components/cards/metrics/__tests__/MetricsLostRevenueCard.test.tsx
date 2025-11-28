/**
 * 🧪 TESTES UNITÁRIOS: MetricsLostRevenueCard
 * 
 * @phase C3-R.3 - Testes Unitários
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { MetricsLostRevenueCard } from '../financial/MetricsLostRevenueCard';
import type { MetricsCardBaseProps } from '@/types/metricsCardTypes';

describe('MetricsLostRevenueCard', () => {
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

  it('renderiza valor de receita perdida correto', () => {
    const { container } = render(<MetricsLostRevenueCard {...mockProps} />);
    expect(container.textContent).toMatch(/R\$/);
  });

  it('mostra skeleton quando isLoading=true', () => {
    const { container } = render(<MetricsLostRevenueCard {...mockProps} isLoading={true} />);
    expect(container.querySelector('.animate-pulse')).toBeTruthy();
  });
});
