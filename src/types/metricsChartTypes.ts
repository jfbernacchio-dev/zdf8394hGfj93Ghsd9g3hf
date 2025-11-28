/**
 * 📊 TIPOS PARA COMPONENTES DE GRÁFICOS DE MÉTRICAS
 * 
 * Define as interfaces e tipos para gráficos (charts) usados na página /metrics.
 * Complementa metricsCardTypes.ts (C3.6) com tipos específicos para visualizações.
 * 
 * @phase C3.7 - Gráficos Reais
 */

import type { FinancialTrendPoint, RetentionSummary, FinancialSummary } from '@/lib/systemMetricsUtils';
import type { MetricsPeriodFilter } from '@/types/metricsCardTypes';
import type { TimeScale } from '@/hooks/useChartTimeScale';

// ============================================================
// TIPOS BASE PARA GRÁFICOS
// ============================================================

/**
 * Props base para todos os componentes de gráficos de métricas
 */
export interface MetricsChartBaseProps {
  periodFilter: MetricsPeriodFilter;
  timeScale: TimeScale;
}

// ============================================================
// TIPOS ESPECÍFICOS POR TIPO DE GRÁFICO
// ============================================================

/**
 * Props para gráficos que usam dados de tendências financeiras
 * (Séries temporais de receita, sessões, etc.)
 */
export interface FinancialTrendsChartProps extends MetricsChartBaseProps {
  trends: FinancialTrendPoint[];
  isLoading: boolean;
}

/**
 * Props para gráficos de retenção de pacientes
 */
export interface RetentionChartProps extends MetricsChartBaseProps {
  retention: RetentionSummary | null;
  isLoading: boolean;
}

/**
 * Props para gráficos de distribuição/status de sessões
 */
export interface SessionDistributionChartProps extends MetricsChartBaseProps {
  summary: FinancialSummary | null;
  isLoading: boolean;
}

/**
 * Props para gráficos mockados (Marketing)
 */
export interface MockChartProps {
  isLoading: boolean;
}
