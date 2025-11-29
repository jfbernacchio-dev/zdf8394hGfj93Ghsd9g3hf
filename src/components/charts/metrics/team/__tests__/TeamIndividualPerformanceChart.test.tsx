/**
 * Testes para TeamIndividualPerformanceChart
 * 
 * FASE 4 - Parte 1 (Gráficos Prioritários)
 */

import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { TeamIndividualPerformanceChart } from '../TeamIndividualPerformanceChart';
import { mockRecharts } from '@/test-utils/mockRecharts';

// Mock Recharts
mockRecharts();

describe('TeamIndividualPerformanceChart', () => {
  const mockPeriodFilter = {
    startDate: new Date('2025-01-01'),
    endDate: new Date('2025-01-31'),
  } as any;

  const mockProfiles = {
    'user1': { full_name: 'Ana Silva', slot_duration: 50, break_time: 10, work_start_time: '08:00', work_end_time: '18:00', work_days: [1, 2, 3, 4, 5] },
    'user2': { full_name: 'Carlos Souza', slot_duration: 50, break_time: 10, work_start_time: '08:00', work_end_time: '18:00', work_days: [1, 2, 3, 4, 5] },
  } as any;

  const mockPatients = [
    { id: 'p1', user_id: 'user1', name: 'Paciente 1', status: 'active', frequency: 'weekly', session_value: 200, created_at: '2024-06-01' },
    { id: 'p2', user_id: 'user2', name: 'Paciente 2', status: 'active', frequency: 'weekly', session_value: 300, created_at: '2024-01-01' },
  ] as any;

  const mockSessions = [
    { id: 's1', patient_id: 'p1', date: '2025-01-10', status: 'attended', value: 200 },
    { id: 's2', patient_id: 'p1', date: '2025-01-17', status: 'attended', value: 200 },
    { id: 's3', patient_id: 'p2', date: '2025-01-12', status: 'attended', value: 300 },
  ] as any;

  it('renderiza sem crash com dados válidos', () => {
    const { getByText } = render(
      <TeamIndividualPerformanceChart
        sessions={mockSessions}
        patients={mockPatients}
        profiles={mockProfiles}
        isLoading={false}
        periodFilter={mockPeriodFilter}
        timeScale="monthly"
      />
    );

    expect(getByText('Performance Individual')).toBeInTheDocument();
  });

  it('exibe skeleton quando isLoading=true', () => {
    render(
      <TeamIndividualPerformanceChart
        sessions={[]}
        patients={[]}
        profiles={{}}
        isLoading={true}
        periodFilter={mockPeriodFilter}
        timeScale="monthly"
      />
    );

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('exibe mensagem de "sem dados" quando não há sessões', () => {
    const { getByText } = render(
      <TeamIndividualPerformanceChart
        sessions={[]}
        patients={mockPatients}
        profiles={mockProfiles}
        isLoading={false}
        periodFilter={mockPeriodFilter}
        timeScale="monthly"
      />
    );

    expect(getByText(/Sem dados de equipe para o período selecionado/i)).toBeInTheDocument();
  });
});
