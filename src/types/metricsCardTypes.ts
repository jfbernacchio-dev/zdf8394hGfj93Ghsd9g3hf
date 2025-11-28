/**
 * ============================================================================
 * METRICS CARD TYPES - FASE C3.6
 * ============================================================================
 * 
 * Tipos específicos para cards de métricas na página /metrics
 * Reutiliza FinancialSummary de systemMetricsUtils
 */

import type { FinancialSummary } from '@/lib/systemMetricsUtils';

export type MetricsPeriod = 'week' | 'month' | 'year' | 'custom';

export interface MetricsPeriodFilter {
  type: MetricsPeriod;
  startDate: Date;
  endDate: Date;
}

/**
 * Props base para todos os cards numéricos de métricas
 */
export interface MetricsCardBaseProps {
  periodFilter: MetricsPeriodFilter;
  summary: FinancialSummary | null;  // null se ainda carregando
  isLoading: boolean;
  className?: string;
}

/**
 * Props para cards mockados (marketing)
 */
export interface MockMetricsCardProps {
  isLoading: boolean;
  className?: string;
}
