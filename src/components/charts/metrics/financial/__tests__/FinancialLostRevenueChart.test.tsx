/**
 * Testes para FinancialLostRevenueChart
 * 
 * FASE 4 - Parte 1 (Gráficos Prioritários)
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { FinancialLostRevenueChart } from '../FinancialLostRevenueChart';
import { mockRecharts } from '@/test-utils/mockRecharts';
import { getLostRevenueByMonth } from '@/lib/systemMetricsUtils';

// Mock Recharts
mockRecharts();

// Mock systemMetricsUtils para controlar getLostRevenueByMonth
vi.mock('@/lib/systemMetricsUtils', async () => {
  const actual = await vi.importActual('@/lib/systemMetricsUtils');
  return {
    ...actual,
    getLostRevenueByMonth: vi.fn(() => [
      { month: 'Jan/25', perdido: 1000 },
      { month: 'Fev/25', perdido: 1500 },
    ]),
  };
});

describe('FinancialLostRevenueChart', () => {
  const mockPeriodFilter = {
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-02-28'),
  } as any;

  const mockSessions = [
    { id: '1', patient_id: 'p1', date: '2025-01-15', status: 'missed', value: 200 },
    { id: '2', patient_id: 'p2', date: '2025-02-10', status: 'missed', value: 300 },
  ] as any;

  it('renderiza sem crash com sessions válidas', () => {
    const { getByText } = render(
      <FinancialLostRevenueChart
        sessions={mockSessions}
        isLoading={false}
        periodFilter={mockPeriodFilter}
        timeScale="monthly"
      />
    );

    expect(getByText('Valor Perdido por Faltas')).toBeInTheDocument();
  });

  it('exibe skeleton quando isLoading=true', () => {
    render(
      <FinancialLostRevenueChart
        sessions={[]}
        isLoading={true}
        periodFilter={mockPeriodFilter}
        timeScale="monthly"
      />
    );

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('exibe mensagem de "sem dados" quando sessions está vazio', () => {
    // Mock retorna array vazio
    vi.mocked(getLostRevenueByMonth).mockReturnValueOnce([]);

    const { getByText } = render(
      <FinancialLostRevenueChart
        sessions={[]}
        isLoading={false}
        periodFilter={mockPeriodFilter}
        timeScale="monthly"
      />
    );

    expect(getByText(/Sem dados de receita perdida neste período/i)).toBeInTheDocument();
  });
});
