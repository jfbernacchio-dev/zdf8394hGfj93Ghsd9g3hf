/**
 * Testes para AdminRetentionChart
 * 
 * FASE 4 - Parte 1 (Gráficos Prioritários)
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { AdminRetentionChart } from '../AdminRetentionChart';
import { mockRecharts } from '@/test-utils/mockRecharts';

// Mock Recharts
mockRecharts();

describe('AdminRetentionChart', () => {
  const mockPeriodFilter = {
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31'),
  } as any;

  const mockRetention = {
    retentionRate3m: 85.5,
    retentionRate6m: 72.3,
    retentionRate12m: 65.8,
    churnRate: 12.5,
    newPatients: 10,
    inactivePatients: 5,
  } as any;

  it('renderiza sem crash com retention válido', () => {
    const { getByText } = render(
      <AdminRetentionChart
        retention={mockRetention}
        isLoading={false}
        periodFilter={mockPeriodFilter}
        timeScale="monthly"
      />
    );

    expect(getByText('Taxas de Retenção')).toBeInTheDocument();
  });

  it('exibe skeleton quando isLoading=true', () => {
    render(
      <AdminRetentionChart
        retention={null}
        isLoading={true}
        periodFilter={mockPeriodFilter}
        timeScale="monthly"
      />
    );

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('exibe mensagem de "sem dados" quando retention é null', () => {
    const { getByText } = render(
      <AdminRetentionChart
        retention={null}
        isLoading={false}
        periodFilter={mockPeriodFilter}
        timeScale="monthly"
      />
    );

    expect(getByText(/Sem dados suficientes para retenção neste período/i)).toBeInTheDocument();
  });
});
