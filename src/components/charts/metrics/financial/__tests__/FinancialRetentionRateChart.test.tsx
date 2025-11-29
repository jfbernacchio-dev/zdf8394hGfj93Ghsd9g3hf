/**
 * Testes para FinancialRetentionRateChart
 * 
 * FASE 4 - Parte 1 (Gráficos Prioritários)
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { FinancialRetentionRateChart } from '../FinancialRetentionRateChart';
import { mockRecharts } from '@/test-utils/mockRecharts';
import { getRetentionRate } from '@/lib/systemMetricsUtils';

// Mock Recharts
mockRecharts();

// Mock systemMetricsUtils para controlar getRetentionRate
vi.mock('@/lib/systemMetricsUtils', async () => {
  const actual = await vi.importActual('@/lib/systemMetricsUtils');
  return {
    ...actual,
    getRetentionRate: vi.fn(() => [
      { periodo: '3 meses', taxa: 85 },
      { periodo: '6 meses', taxa: 72 },
      { periodo: '12 meses', taxa: 65 },
    ]),
  };
});

describe('FinancialRetentionRateChart', () => {
  const mockPeriodFilter = {
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31'),
  } as any;

  const mockPatients = [
    { id: 'p1', user_id: 'u1', name: 'Paciente 1', status: 'active', frequency: 'weekly', session_value: 200, created_at: '2024-06-01' },
    { id: 'p2', user_id: 'u1', name: 'Paciente 2', status: 'active', frequency: 'weekly', session_value: 200, created_at: '2024-01-01' },
  ] as any;

  it('renderiza sem crash com patients válidos', () => {
    const { getByText } = render(
      <FinancialRetentionRateChart
        patients={mockPatients}
        isLoading={false}
        periodFilter={mockPeriodFilter}
        timeScale="monthly"
      />
    );

    expect(getByText('Taxa de Retenção de Pacientes')).toBeInTheDocument();
  });

  it('exibe skeleton quando isLoading=true', () => {
    render(
      <FinancialRetentionRateChart
        patients={[]}
        isLoading={true}
        periodFilter={mockPeriodFilter}
        timeScale="monthly"
      />
    );

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('exibe mensagem de "sem dados" quando patients está vazio', () => {
    // Mock retorna array vazio
    vi.mocked(getRetentionRate).mockReturnValueOnce([]);

    const { getByText } = render(
      <FinancialRetentionRateChart
        patients={[]}
        isLoading={false}
        periodFilter={mockPeriodFilter}
        timeScale="monthly"
      />
    );

    expect(getByText(/Sem dados suficientes para calcular retenção/i)).toBeInTheDocument();
  });
});
