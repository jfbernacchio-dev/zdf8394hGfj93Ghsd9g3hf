/**
 * Testes para FinancialRevenueDistributionChart
 * 
 * FASE 4 - Parte 1 (Gráficos Prioritários)
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { FinancialRevenueDistributionChart } from '../FinancialRevenueDistributionChart';
import { mockRecharts } from '@/test-utils/mockRecharts';

// Mock Recharts
mockRecharts();

describe('FinancialRevenueDistributionChart', () => {
  const mockPeriodFilter = {
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31'),
  } as any;

  const mockSummary = {
    totalRevenue: 10000,
    forecastRevenue: 15000,
    lostRevenue: 2000,
    totalSessions: 50,
    missedRate: 15,
    avgPerSession: 200,
    activePatients: 25,
    avgRevenuePerActivePatient: 400,
  } as any;

  it('renderiza sem crash com summary válido', () => {
    const { getByText } = render(
      <FinancialRevenueDistributionChart
        summary={mockSummary}
        isLoading={false}
        periodFilter={mockPeriodFilter}
        timeScale="monthly"
      />
    );

    expect(getByText('Distribuição de Receita')).toBeInTheDocument();
  });

  it('exibe skeleton quando isLoading=true', () => {
    render(
      <FinancialRevenueDistributionChart
        summary={null}
        isLoading={true}
        periodFilter={mockPeriodFilter}
        timeScale="monthly"
      />
    );

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('exibe mensagem de "sem dados" quando summary é null', () => {
    const { getByText } = render(
      <FinancialRevenueDistributionChart
        summary={null}
        isLoading={false}
        periodFilter={mockPeriodFilter}
        timeScale="monthly"
      />
    );

    expect(getByText(/Sem dados de receita para o período selecionado/i)).toBeInTheDocument();
  });
});
