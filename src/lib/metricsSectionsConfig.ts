// ============================================================
// METRICS SECTIONS & TABS CONFIGURATION
// ============================================================
// Configuração centralizada de seções, domínios e sub-abas da página /metrics
// Criado na FASE C3.5 da TRACK C3

import { PermissionDomain } from '@/types/permissions';

export type MetricsDomain = Extract<PermissionDomain, 'financial' | 'administrative' | 'marketing' | 'team'>;

export interface MetricsSectionConfig {
  id: string;
  domain: MetricsDomain;
  title: string;
  description?: string;
}

export interface MetricsSubTabConfig {
  id: string;
  domain: MetricsDomain;
  label: string;
  // category lógico usado pelos cards depois (C3.6/C3.7):
  chartCategory?: 'distribuicoes' | 'desempenho' | 'tendencias' | 'retencao' | 'website';
}

// ============================================================
// SEÇÕES PRINCIPAIS (nível superior, por domain)
// ============================================================

export const METRICS_SECTIONS: MetricsSectionConfig[] = [
  {
    id: 'metrics-financial',
    domain: 'financial',
    title: 'Financeiro',
    description: 'Receita, faltas, ticket médio e indicadores financeiros.',
  },
  {
    id: 'metrics-administrative',
    domain: 'administrative',
    title: 'Administrativo',
    description: 'Volume de pacientes, status e fluxo administrativo.',
  },
  {
    id: 'metrics-team',
    domain: 'team',
    title: 'Equipe',
    description: 'Distribuição de carga e métricas por terapeuta.',
  },
  {
    id: 'metrics-marketing',
    domain: 'marketing',
    title: 'Marketing',
    description: 'Indicadores de website e funil de aquisição.',
  },
];

// ============================================================
// SUB-ABAS DE GRÁFICOS (por domain)
// ============================================================

export const METRICS_SUBTABS: MetricsSubTabConfig[] = [
  // FINANCIAL
  { 
    id: 'distribuicoes', 
    domain: 'financial', 
    label: 'Distribuições', 
    chartCategory: 'distribuicoes' 
  },
  { 
    id: 'desempenho', 
    domain: 'financial', 
    label: 'Desempenho', 
    chartCategory: 'desempenho' 
  },
  { 
    id: 'tendencias', 
    domain: 'financial', 
    label: 'Tendências', 
    chartCategory: 'tendencias' 
  },

  // ADMINISTRATIVE
  { 
    id: 'distribuicoes', 
    domain: 'administrative', 
    label: 'Distribuições', 
    chartCategory: 'distribuicoes' 
  },
  { 
    id: 'desempenho', 
    domain: 'administrative', 
    label: 'Desempenho', 
    chartCategory: 'desempenho' 
  },
  { 
    id: 'retencao', 
    domain: 'administrative', 
    label: 'Retenção', 
    chartCategory: 'retencao' 
  },

  // MARKETING
  { 
    id: 'website', 
    domain: 'marketing', 
    label: 'Website', 
    chartCategory: 'website' 
  },

  // TEAM
  { 
    id: 'desempenho', 
    domain: 'team', 
    label: 'Desempenho', 
    chartCategory: 'desempenho' 
  },
  { 
    id: 'distribuicoes', 
    domain: 'team', 
    label: 'Distribuições', 
    chartCategory: 'distribuicoes' 
  },
  { 
    id: 'retencao', 
    domain: 'team', 
    label: 'Retenção', 
    chartCategory: 'retencao' 
  },
];

// ============================================================
// HELPERS
// ============================================================

/**
 * Retorna todas as seções para um dado domínio
 */
export function getSectionsForDomain(domain: MetricsDomain): MetricsSectionConfig[] {
  return METRICS_SECTIONS.filter((s) => s.domain === domain);
}

/**
 * Retorna todas as sub-abas para um dado domínio
 */
export function getSubTabsForDomain(domain: MetricsDomain): MetricsSubTabConfig[] {
  return METRICS_SUBTABS.filter((s) => s.domain === domain);
}

/**
 * Retorna o ID da primeira sub-aba de um domínio (default)
 */
export function getDefaultSubTabForDomain(domain: MetricsDomain): string | undefined {
  const subTabs = getSubTabsForDomain(domain);
  return subTabs[0]?.id;
}

/**
 * Verifica se uma seção existe no registry
 */
export function isSectionValid(sectionId: string): boolean {
  return METRICS_SECTIONS.some((s) => s.id === sectionId);
}

/**
 * Verifica se uma sub-aba existe para um domínio específico
 */
export function isSubTabValidForDomain(subTabId: string, domain: MetricsDomain): boolean {
  return METRICS_SUBTABS.some((s) => s.id === subTabId && s.domain === domain);
}
