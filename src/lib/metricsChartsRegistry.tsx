/**
 * ============================================================================
 * METRICS CHARTS REGISTRY - FASE 3
 * ============================================================================
 * 
 * Registry centralizado de todos os gráficos disponíveis na página /metrics
 * Permite gerenciar quais gráficos aparecem na visão detalhada, por domínio
 * 
 * FASE 3: Com categorias intermediárias para melhor organização
 * ============================================================================
 */

import { ComponentType } from 'react';

// Import chart components
import { FinancialTrendsChart } from '@/components/charts/metrics/financial/FinancialTrendsChart';
import { FinancialPerformanceChart } from '@/components/charts/metrics/financial/FinancialPerformanceChart';
import { FinancialDistributionsChart } from '@/components/charts/metrics/financial/FinancialDistributionsChart';
import { FinancialRevenueDistributionChart } from '@/components/charts/metrics/financial/FinancialRevenueDistributionChart';
import { FinancialSessionStatusChart } from '@/components/charts/metrics/financial/FinancialSessionStatusChart';
import { FinancialMonthlyPerformanceChart } from '@/components/charts/metrics/financial/FinancialMonthlyPerformanceChart';
import { FinancialWeeklyComparisonChart } from '@/components/charts/metrics/financial/FinancialWeeklyComparisonChart';
import { FinancialRevenueTrendChart } from '@/components/charts/metrics/financial/FinancialRevenueTrendChart';
import { FinancialForecastVsActualChart } from '@/components/charts/metrics/financial/FinancialForecastVsActualChart';
import { FinancialConversionRateChart } from '@/components/charts/metrics/financial/FinancialConversionRateChart';
import { FinancialTicketComparisonChart } from '@/components/charts/metrics/financial/FinancialTicketComparisonChart';
import { FinancialInactiveByMonthChart } from '@/components/charts/metrics/financial/FinancialInactiveByMonthChart';
import { FinancialMissedByPatientChart } from '@/components/charts/metrics/financial/FinancialMissedByPatientChart';
import { FinancialLostRevenueChart } from '@/components/charts/metrics/financial/FinancialLostRevenueChart';
import { FinancialRetentionRateChart } from '@/components/charts/metrics/financial/FinancialRetentionRateChart';
import { FinancialNewVsInactiveChart } from '@/components/charts/metrics/financial/FinancialNewVsInactiveChart';
import { FinancialTopPatientsChart } from '@/components/charts/metrics/financial/FinancialTopPatientsChart';
import { AdminRetentionChart } from '@/components/charts/metrics/administrative/AdminRetentionChart';
import { AdminPerformanceChart } from '@/components/charts/metrics/administrative/AdminPerformanceChart';
import { AdminDistributionsChart } from '@/components/charts/metrics/administrative/AdminDistributionsChart';
import { AdminFrequencyDistributionChart } from '@/components/charts/metrics/administrative/AdminFrequencyDistributionChart';
import { AdminAttendanceRateChart } from '@/components/charts/metrics/administrative/AdminAttendanceRateChart';
import { AdminWeeklyOccupationChart } from '@/components/charts/metrics/administrative/AdminWeeklyOccupationChart';
import { AdminChurnRetentionChart } from '@/components/charts/metrics/administrative/AdminChurnRetentionChart';
import { MarketingWebsiteOverviewChart } from '@/components/charts/metrics/marketing/MarketingWebsiteOverviewChart';
import { TeamIndividualPerformanceChart } from '@/components/charts/metrics/team/TeamIndividualPerformanceChart';
import { TeamRevenueComparisonChart } from '@/components/charts/metrics/team/TeamRevenueComparisonChart';
import { TeamPatientDistributionChart } from '@/components/charts/metrics/team/TeamPatientDistributionChart';
import { TeamWorkloadChart } from '@/components/charts/metrics/team/TeamWorkloadChart';
import { TeamMonthlyEvolutionChart } from '@/components/charts/metrics/team/TeamMonthlyEvolutionChart';
import { TeamOccupationByMemberChart } from '@/components/charts/metrics/team/TeamOccupationByMemberChart';
import { TeamAttendanceByTherapistChart } from '@/components/charts/metrics/team/TeamAttendanceByTherapistChart';

// ============================================================
// TIPOS
// ============================================================

export type MetricsChartDomain = 'financial' | 'administrative' | 'marketing' | 'team';

/**
 * Categorias de gráficos (FASE 3)
 */
export type MetricsChartCategory =
  | 'distribution'   // Distribuições: histogramas, percentuais, distribuição de valores
  | 'performance'    // Desempenho: produtividade, métricas de performance
  | 'trend'          // Tendências: séries temporais, evolução ao longo do tempo
  | 'retention'      // Retenção: churn, retorno de pacientes
  | 'website';       // Website: tráfego, conversão, CTR

/**
 * Definição de um gráfico de métricas (FASE 3: category agora obrigatória)
 */
export interface MetricsChartDefinition {
  id: string;
  domain: MetricsChartDomain;
  subTab: string; // qual sub-aba este chart pertence (ex: 'distribuicoes', 'desempenho', 'tendencias', etc)
  category: MetricsChartCategory; // FASE 3: categoria para organização no dialog
  title: string;
  description: string;
  component: ComponentType<any>;
  defaultEnabled: boolean; // Se deve aparecer por padrão
}

// ============================================================
// REGISTRY DE GRÁFICOS
// ============================================================

export const METRICS_CHART_REGISTRY: Record<string, MetricsChartDefinition> = {
  // ============================================================
  // FINANCIAL DOMAIN
  // ============================================================
  
  // Distribuições
  'financial-distributions-chart': {
    id: 'financial-distributions-chart',
    domain: 'financial',
    subTab: 'distribuicoes',
    category: 'distribution',
    title: 'Distribuição de Sessões',
    description: 'Visão geral da distribuição de sessões por status',
    component: FinancialDistributionsChart,
    defaultEnabled: true,
  },
  'financial-revenue-distribution-chart': {
    id: 'financial-revenue-distribution-chart',
    domain: 'financial',
    subTab: 'distribuicoes',
    category: 'distribution',
    title: 'Distribuição de Receita',
    description: 'Como a receita está distribuída entre diferentes categorias',
    component: FinancialRevenueDistributionChart,
    defaultEnabled: true,
  },
  'financial-session-status-chart': {
    id: 'financial-session-status-chart',
    domain: 'financial',
    subTab: 'distribuicoes',
    category: 'distribution',
    title: 'Status de Sessões',
    description: 'Quantidade de sessões por status (realizadas, faltadas, etc)',
    component: FinancialSessionStatusChart,
    defaultEnabled: true,
  },
  'financial-ticket-comparison-chart': {
    id: 'financial-ticket-comparison-chart',
    domain: 'financial',
    subTab: 'distribuicoes',
    category: 'distribution',
    title: 'Comparação de Ticket Médio',
    description: 'Compara o valor do ticket médio ao longo do período',
    component: FinancialTicketComparisonChart,
    defaultEnabled: true,
  },

  // Desempenho
  'financial-performance-chart': {
    id: 'financial-performance-chart',
    domain: 'financial',
    subTab: 'desempenho',
    category: 'performance',
    title: 'Desempenho Financeiro',
    description: 'Métricas principais de desempenho financeiro',
    component: FinancialPerformanceChart,
    defaultEnabled: true,
  },
  'financial-monthly-performance-chart': {
    id: 'financial-monthly-performance-chart',
    domain: 'financial',
    subTab: 'desempenho',
    category: 'performance',
    title: 'Desempenho Mensal',
    description: 'Performance financeira agregada por mês',
    component: FinancialMonthlyPerformanceChart,
    defaultEnabled: true,
  },
  'financial-weekly-comparison-chart': {
    id: 'financial-weekly-comparison-chart',
    domain: 'financial',
    subTab: 'desempenho',
    category: 'performance',
    title: 'Comparação Semanal',
    description: 'Compara o desempenho entre semanas',
    component: FinancialWeeklyComparisonChart,
    defaultEnabled: true,
  },
  'financial-inactive-by-month-chart': {
    id: 'financial-inactive-by-month-chart',
    domain: 'financial',
    subTab: 'desempenho',
    category: 'performance',
    title: 'Inativos por Mês',
    description: 'Quantidade de pacientes inativos ao longo dos meses',
    component: FinancialInactiveByMonthChart,
    defaultEnabled: true,
  },
  'financial-missed-by-patient-chart': {
    id: 'financial-missed-by-patient-chart',
    domain: 'financial',
    subTab: 'desempenho',
    category: 'performance',
    title: 'Faltas por Paciente',
    description: 'Ranking de pacientes com mais faltas',
    component: FinancialMissedByPatientChart,
    defaultEnabled: true,
  },
  'financial-lost-revenue-chart': {
    id: 'financial-lost-revenue-chart',
    domain: 'financial',
    subTab: 'desempenho',
    category: 'performance',
    title: 'Receita Perdida',
    description: 'Valor de receita perdida por faltas e cancelamentos',
    component: FinancialLostRevenueChart,
    defaultEnabled: true,
  },

  // Tendências
  'financial-trends-chart': {
    id: 'financial-trends-chart',
    domain: 'financial',
    subTab: 'tendencias',
    category: 'trend',
    title: 'Tendências Financeiras',
    description: 'Evolução das principais métricas financeiras ao longo do tempo',
    component: FinancialTrendsChart,
    defaultEnabled: true,
  },
  'financial-revenue-trend-chart': {
    id: 'financial-revenue-trend-chart',
    domain: 'financial',
    subTab: 'tendencias',
    category: 'trend',
    title: 'Tendência de Receita',
    description: 'Evolução da receita no período selecionado',
    component: FinancialRevenueTrendChart,
    defaultEnabled: true,
  },
  'financial-forecast-vs-actual-chart': {
    id: 'financial-forecast-vs-actual-chart',
    domain: 'financial',
    subTab: 'tendencias',
    category: 'trend',
    title: 'Previsto vs Realizado',
    description: 'Comparação entre receita prevista e receita realizada',
    component: FinancialForecastVsActualChart,
    defaultEnabled: true,
  },
  'financial-conversion-rate-chart': {
    id: 'financial-conversion-rate-chart',
    domain: 'financial',
    subTab: 'tendencias',
    category: 'trend',
    title: 'Taxa de Conversão',
    description: 'Evolução da taxa de conversão de pacientes',
    component: FinancialConversionRateChart,
    defaultEnabled: true,
  },
  'financial-top-patients-chart': {
    id: 'financial-top-patients-chart',
    domain: 'financial',
    subTab: 'tendencias',
    category: 'trend',
    title: 'Top Pacientes',
    description: 'Pacientes que mais contribuem para a receita',
    component: FinancialTopPatientsChart,
    defaultEnabled: true,
  },

  // Retenção
  'financial-retention-rate-chart': {
    id: 'financial-retention-rate-chart',
    domain: 'financial',
    subTab: 'retencao',
    category: 'retention',
    title: 'Taxa de Retenção',
    description: 'Porcentagem de pacientes retidos ao longo do tempo',
    component: FinancialRetentionRateChart,
    defaultEnabled: true,
  },
  'financial-new-vs-inactive-chart': {
    id: 'financial-new-vs-inactive-chart',
    domain: 'financial',
    subTab: 'retencao',
    category: 'retention',
    title: 'Novos vs Inativos',
    description: 'Comparação entre pacientes novos e inativos',
    component: FinancialNewVsInactiveChart,
    defaultEnabled: true,
  },

  // ============================================================
  // ADMINISTRATIVE DOMAIN
  // ============================================================
  
  // Distribuições
  'admin-distributions-chart': {
    id: 'admin-distributions-chart',
    domain: 'administrative',
    subTab: 'distribuicoes',
    category: 'distribution',
    title: 'Distribuição de Sessões',
    description: 'Visão geral da distribuição de sessões administrativas',
    component: AdminDistributionsChart,
    defaultEnabled: true,
  },
  'admin-frequency-distribution-chart': {
    id: 'admin-frequency-distribution-chart',
    domain: 'administrative',
    subTab: 'distribuicoes',
    category: 'distribution',
    title: 'Distribuição de Frequência',
    description: 'Como os pacientes estão distribuídos por frequência de sessões',
    component: AdminFrequencyDistributionChart,
    defaultEnabled: true,
  },

  // Desempenho
  'admin-performance-chart': {
    id: 'admin-performance-chart',
    domain: 'administrative',
    subTab: 'desempenho',
    category: 'performance',
    title: 'Desempenho Administrativo',
    description: 'Métricas principais de desempenho administrativo',
    component: AdminPerformanceChart,
    defaultEnabled: true,
  },
  'admin-attendance-rate-chart': {
    id: 'admin-attendance-rate-chart',
    domain: 'administrative',
    subTab: 'desempenho',
    category: 'performance',
    title: 'Taxa de Comparecimento',
    description: 'Porcentagem de sessões com comparecimento',
    component: AdminAttendanceRateChart,
    defaultEnabled: true,
  },
  'admin-weekly-occupation-chart': {
    id: 'admin-weekly-occupation-chart',
    domain: 'administrative',
    subTab: 'desempenho',
    category: 'performance',
    title: 'Ocupação Semanal',
    description: 'Taxa de ocupação da agenda ao longo da semana',
    component: AdminWeeklyOccupationChart,
    defaultEnabled: true,
  },

  // Retenção
  'admin-retention-chart': {
    id: 'admin-retention-chart',
    domain: 'administrative',
    subTab: 'retencao',
    category: 'retention',
    title: 'Retenção de Pacientes',
    description: 'Análise de retenção e churn de pacientes',
    component: AdminRetentionChart,
    defaultEnabled: true,
  },
  'admin-churn-retention-chart': {
    id: 'admin-churn-retention-chart',
    domain: 'administrative',
    subTab: 'retencao',
    category: 'retention',
    title: 'Churn vs Retenção',
    description: 'Comparação detalhada entre churn e retenção',
    component: AdminChurnRetentionChart,
    defaultEnabled: true,
  },

  // ============================================================
  // MARKETING DOMAIN
  // ============================================================
  
  // Website
  'marketing-website-overview-chart': {
    id: 'marketing-website-overview-chart',
    domain: 'marketing',
    subTab: 'website',
    category: 'website',
    title: 'Visão Geral do Website',
    description: 'Métricas principais do website e conversão',
    component: MarketingWebsiteOverviewChart,
    defaultEnabled: true,
  },

  // ============================================================
  // TEAM DOMAIN
  // ============================================================
  
  // Desempenho
  'team-individual-performance-chart': {
    id: 'team-individual-performance-chart',
    domain: 'team',
    subTab: 'desempenho',
    category: 'performance',
    title: 'Desempenho Individual',
    description: 'Métricas de desempenho de cada membro da equipe',
    component: TeamIndividualPerformanceChart,
    defaultEnabled: true,
  },
  'team-revenue-comparison-chart': {
    id: 'team-revenue-comparison-chart',
    domain: 'team',
    subTab: 'desempenho',
    category: 'performance',
    title: 'Comparação de Receita',
    description: 'Compara a receita gerada por cada membro',
    component: TeamRevenueComparisonChart,
    defaultEnabled: true,
  },

  // Distribuições
  'team-patient-distribution-chart': {
    id: 'team-patient-distribution-chart',
    domain: 'team',
    subTab: 'distribuicoes',
    category: 'distribution',
    title: 'Distribuição de Pacientes',
    description: 'Como os pacientes estão distribuídos entre os membros',
    component: TeamPatientDistributionChart,
    defaultEnabled: true,
  },
  'team-workload-chart': {
    id: 'team-workload-chart',
    domain: 'team',
    subTab: 'distribuicoes',
    category: 'distribution',
    title: 'Carga de Trabalho',
    description: 'Distribuição da carga de trabalho entre os membros',
    component: TeamWorkloadChart,
    defaultEnabled: true,
  },

  // Retenção
  'team-monthly-evolution-chart': {
    id: 'team-monthly-evolution-chart',
    domain: 'team',
    subTab: 'retencao',
    category: 'retention',
    title: 'Evolução Mensal',
    description: 'Evolução das métricas da equipe ao longo dos meses',
    component: TeamMonthlyEvolutionChart,
    defaultEnabled: true,
  },
  'team-occupation-by-member-chart': {
    id: 'team-occupation-by-member-chart',
    domain: 'team',
    subTab: 'retencao',
    category: 'retention',
    title: 'Ocupação por Membro',
    description: 'Taxa de ocupação individual de cada membro',
    component: TeamOccupationByMemberChart,
    defaultEnabled: true,
  },
  'team-attendance-by-therapist-chart': {
    id: 'team-attendance-by-therapist-chart',
    domain: 'team',
    subTab: 'retencao',
    category: 'retention',
    title: 'Comparecimento por Terapeuta',
    description: 'Taxa de comparecimento de cada terapeuta',
    component: TeamAttendanceByTherapistChart,
    defaultEnabled: true,
  },
};

// ============================================================
// HELPER FUNCTIONS
// ============================================================

/**
 * Retorna definição de um gráfico pelo ID
 */
export function getMetricsChartById(chartId: string): MetricsChartDefinition | undefined {
  return METRICS_CHART_REGISTRY[chartId];
}

/**
 * Retorna todos os gráficos de um domínio específico
 */
export function getMetricsChartsByDomain(domain: MetricsChartDomain): MetricsChartDefinition[] {
  return Object.values(METRICS_CHART_REGISTRY).filter((chart) => chart.domain === domain);
}

/**
 * Retorna gráficos de um domínio e sub-tab específicos
 */
export function getMetricsChartsByDomainAndSubTab(
  domain: MetricsChartDomain,
  subTab: string
): MetricsChartDefinition[] {
  return Object.values(METRICS_CHART_REGISTRY).filter(
    (chart) => chart.domain === domain && chart.subTab === subTab
  );
}

/**
 * Retorna todos os IDs de gráficos
 */
export function getAllChartIds(): string[] {
  return Object.keys(METRICS_CHART_REGISTRY);
}

/**
 * Retorna IDs de gráficos habilitados por padrão para um domínio
 */
export function getDefaultEnabledChartIds(domain: MetricsChartDomain): string[] {
  return Object.values(METRICS_CHART_REGISTRY)
    .filter((chart) => chart.domain === domain && chart.defaultEnabled)
    .map((chart) => chart.id);
}

/**
 * Valida se um ID de gráfico existe
 */
export function isValidChartId(chartId: string): boolean {
  return chartId in METRICS_CHART_REGISTRY;
}

// ============================================================
// FASE 3: CATEGORIAS
// ============================================================

/**
 * Labels em português para as categorias de gráficos
 */
export const CATEGORY_LABELS: Record<MetricsChartCategory, string> = {
  distribution: 'Distribuições',
  performance: 'Desempenho',
  trend: 'Tendências',
  retention: 'Retenção',
  website: 'Website',
};

/**
 * Retorna as categorias disponíveis para um domínio
 * (FASE 3)
 */
export function getMetricsChartCategoriesForDomain(domain: MetricsChartDomain): MetricsChartCategory[] {
  switch (domain) {
    case 'financial':
      return ['distribution', 'performance', 'trend', 'retention'];
    case 'administrative':
      return ['distribution', 'performance', 'retention'];
    case 'marketing':
      return ['website'];
    case 'team':
      return ['performance', 'distribution', 'retention'];
    default:
      return [];
  }
}

/**
 * Retorna gráficos filtrados por domínio e categoria
 * (FASE 3)
 */
export function getMetricsChartsByDomainAndCategory(
  domain: MetricsChartDomain,
  category: MetricsChartCategory
): MetricsChartDefinition[] {
  return Object.values(METRICS_CHART_REGISTRY).filter(
    (chart) => chart.domain === domain && chart.category === category
  );
}
