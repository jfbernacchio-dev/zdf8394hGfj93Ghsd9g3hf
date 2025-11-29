/**
 * Testes para FinancialTrendsChart
 * 
 * FASE 4 - Parte 1 (Gráficos Prioritários)
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { FinancialTrendsChart } from '../FinancialTrendsChart';
import { mockRecharts } from '@/test-utils/mockRecharts';

// Mock Recharts antes de qualquer importação
mockRecharts();

describe('FinancialTrendsChart', () => {
  const mockPeriodFilter = {
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31'),
  } as any;

  const mockTrends = [
    { label: 'Semana 1', revenue: 5000, sessions: 25 },
    { label: 'Semana 2', revenue: 6000, sessions: 30 },
    { label: 'Semana 3', revenue: 5500, sessions: 28 },
  ] as any;

  it('renderiza sem crash com dados válidos', () => {
    const { getByText } = render(
      <FinancialTrendsChart
        trends={mockTrends}
        isLoading={false}
        periodFilter={mockPeriodFilter}
        timeScale="weekly"
      />
    );

    expect(getByText('Tendências Financeiras')).toBeInTheDocument();
  });

  it('exibe skeleton quando isLoading=true', () => {
    render(
      <FinancialTrendsChart
        trends={[]}
        isLoading={true}
        periodFilter={mockPeriodFilter}
        timeScale="weekly"
      />
    );

    // Skeleton usa classes específicas
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('exibe mensagem de "sem dados" quando trends está vazio', () => {
    const { getByText } = render(
      <FinancialTrendsChart
        trends={[]}
        isLoading={false}
        periodFilter={mockPeriodFilter}
        timeScale="weekly"
      />
    );

    expect(getByText(/Sem dados suficientes para exibir tendências/i)).toBeInTheDocument();
  });
});
