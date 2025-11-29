/**
 * ============================================================================
 * TEST HELPERS: Mocks para Testes de Métricas
 * ============================================================================
 * 
 * Mocks padronizados para tipos de métricas, facilitando a criação de testes.
 * ============================================================================
 */

import type { MetricsPeriodFilter } from '@/types/metricsCardTypes';
import type { FinancialSummary, MetricsPatient, MetricsSession, MetricsProfile, RetentionSummary } from '@/lib/systemMetricsUtils';

/**
 * Mock padrão de MetricsPeriodFilter
 */
export const mockPeriodFilter: MetricsPeriodFilter = {
  type: 'month',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31'),
};

/**
 * Mock padrão de FinancialSummary
 */
export const mockFinancialSummary: FinancialSummary = {
  totalRevenue: 10000,
  totalSessions: 50,
  missedRate: 15.4,
  avgPerSession: 200,
  activePatients: 25,
  lostRevenue: 2000,
  avgRevenuePerActivePatient: 400,
  forecastRevenue: 15000,
};

/**
 * Mock padrão de RetentionSummary
 */
export const mockRetentionSummary: RetentionSummary = {
  retentionRate3m: 85.5,
  retentionRate6m: 72.3,
  retentionRate12m: 65.8,
  churnRate: 12.5,
  newPatients: 10,
  inactivePatients: 5,
};

/**
 * Mock padrão de MetricsPatient
 */
export const mockPatient: MetricsPatient = {
  id: 'patient-1',
  user_id: 'user-1',
  name: 'João Silva',
  status: 'active',
  frequency: 'weekly',
  session_value: 200,
  monthly_price: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-15T00:00:00Z',
};

/**
 * Mock padrão de MetricsSession
 */
export const mockSession: MetricsSession = {
  id: 'session-1',
  patient_id: 'patient-1',
  date: '2024-01-15',
  status: 'attended',
  value: 200,
};

/**
 * Mock padrão de MetricsProfile
 */
export const mockProfile: MetricsProfile = {
  full_name: 'Ana Silva',
  slot_duration: 50,
  break_time: 10,
  work_start_time: '08:00',
  work_end_time: '18:00',
  work_days: [1, 2, 3, 4, 5],
};
