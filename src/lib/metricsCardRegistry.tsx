/**
 * 📊 METRICS CARD REGISTRY - FASE C3-R.8
 * 
 * Sistema centralizado de registro de cards de métricas.
 * Permite mapear IDs para componentes, gerenciar layouts padrão
 * e validar permissões de visualização.
 * 
 * @phase C3-R.8
 */

import type { ComponentType } from 'react';

// Import card components - Financial
import { MetricsRevenueTotalCard } from '@/components/cards/metrics/financial/MetricsRevenueTotalCard';
import { MetricsAvgPerSessionCard } from '@/components/cards/metrics/financial/MetricsAvgPerSessionCard';
import { MetricsForecastRevenueCard } from '@/components/cards/metrics/financial/MetricsForecastRevenueCard';
import { MetricsAvgPerActivePatientCard } from '@/components/cards/metrics/financial/MetricsAvgPerActivePatientCard';
import { MetricsLostRevenueCard } from '@/components/cards/metrics/financial/MetricsLostRevenueCard';

// Import card components - Administrative
import { MetricsMissedRateCard } from '@/components/cards/metrics/administrative/MetricsMissedRateCard';
import { MetricsActivePatientsCard } from '@/components/cards/metrics/administrative/MetricsActivePatientsCard';
import { MetricsOccupationRateCard } from '@/components/cards/metrics/administrative/MetricsOccupationRateCard';

// Import card components - Marketing
import { MetricsWebsiteViewsCard } from '@/components/cards/metrics/marketing/MetricsWebsiteViewsCard';
import { MetricsWebsiteVisitorsCard } from '@/components/cards/metrics/marketing/MetricsWebsiteVisitorsCard';
import { MetricsWebsiteConversionCard } from '@/components/cards/metrics/marketing/MetricsWebsiteConversionCard';
import { MetricsWebsiteCTRCard } from '@/components/cards/metrics/marketing/MetricsWebsiteCTRCard';

// Import card components - Team (FASE 1.4)
import { MetricsTeamTotalRevenueCard } from '@/components/cards/metrics/team/MetricsTeamTotalRevenueCard';
import { MetricsTeamActivePatientsCard } from '@/components/cards/metrics/team/MetricsTeamActivePatientsCard';
import { MetricsTeamSessionsCard } from '@/components/cards/metrics/team/MetricsTeamSessionsCard';

// Import types
import type { MetricsCardBaseProps, MockMetricsCardProps } from '@/types/metricsCardTypes';

// ============================================================================
// TYPES
// ============================================================================

/**
 * Definição completa de um card de métricas no registry
 */
export interface MetricsCardDefinition {
  /** Unique identifier for the card */
  id: string;
  
  /** Display title shown in UI */
  title: string;
  
  /** Short description of what the card shows */
  description: string;
  
  /** Which domain/section this card belongs to */
  domain: 'financial' | 'administrative' | 'marketing' | 'team';
  
  /** React component to render */
  component: ComponentType<MetricsCardBaseProps | MockMetricsCardProps>;
  
  /** Default layout configuration for react-grid-layout */
  defaultLayout: {
    x: number;
    y: number;
    w: number;
    h: number;
    minW?: number;
    minH?: number;
    maxW?: number;
    maxH?: number;
  };
  
  /** Optional permission required to view this card */
  requiredPermission?: 'financial_access' | 'administrative_access' | 'marketing_access' | 'team_access';
}

// ============================================================================
// REGISTRY
// ============================================================================

/**
 * Registro global de todos os cards de métricas disponíveis no sistema.
 * Cada card é identificado por um ID único e contém todas as informações
 * necessárias para renderização, layout e controle de permissões.
 */
export const METRICS_CARD_REGISTRY: Record<string, MetricsCardDefinition> = {
  // ========================================
  // FINANCIAL DOMAIN (5 cards)
  // ========================================
  
  'metrics-revenue-total': {
    id: 'metrics-revenue-total',
    title: 'Receita Total',
    description: 'Receita total realizada no período selecionado',
    domain: 'financial',
    component: MetricsRevenueTotalCard,
    defaultLayout: { x: 0, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
    requiredPermission: 'financial_access',
  },
  
  'metrics-avg-per-session': {
    id: 'metrics-avg-per-session',
    title: 'Média por Sessão',
    description: 'Valor médio por sessão realizada',
    domain: 'financial',
    component: MetricsAvgPerSessionCard,
    defaultLayout: { x: 4, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
    requiredPermission: 'financial_access',
  },
  
  'metrics-forecast-revenue': {
    id: 'metrics-forecast-revenue',
    title: 'Receita Prevista',
    description: 'Receita prevista com base em pacientes ativos e frequência',
    domain: 'financial',
    component: MetricsForecastRevenueCard,
    defaultLayout: { x: 8, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
    requiredPermission: 'financial_access',
  },
  
  'metrics-avg-per-active-patient': {
    id: 'metrics-avg-per-active-patient',
    title: 'Média por Paciente Ativo',
    description: 'Receita média por paciente ativo no período',
    domain: 'financial',
    component: MetricsAvgPerActivePatientCard,
    defaultLayout: { x: 0, y: 2, w: 6, h: 2, minW: 4, minH: 2 },
    requiredPermission: 'financial_access',
  },
  
  'metrics-lost-revenue': {
    id: 'metrics-lost-revenue',
    title: 'Receita Perdida',
    description: 'Receita perdida devido a sessões faltadas ou canceladas',
    domain: 'financial',
    component: MetricsLostRevenueCard,
    defaultLayout: { x: 6, y: 2, w: 6, h: 2, minW: 4, minH: 2 },
    requiredPermission: 'financial_access',
  },
  
  // ========================================
  // ADMINISTRATIVE DOMAIN (3 cards)
  // ========================================
  
  'metrics-active-patients': {
    id: 'metrics-active-patients',
    title: 'Pacientes Ativos',
    description: 'Número total de pacientes com status ativo',
    domain: 'administrative',
    component: MetricsActivePatientsCard,
    defaultLayout: { x: 0, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
    requiredPermission: 'administrative_access',
  },
  
  'metrics-occupation-rate': {
    id: 'metrics-occupation-rate',
    title: 'Taxa de Ocupação',
    description: 'Percentual de ocupação da agenda em relação aos horários disponíveis',
    domain: 'administrative',
    component: MetricsOccupationRateCard,
    defaultLayout: { x: 4, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
    requiredPermission: 'administrative_access',
  },
  
  'metrics-missed-rate': {
    id: 'metrics-missed-rate',
    title: 'Taxa de Faltas',
    description: 'Percentual de sessões faltadas em relação ao total agendado',
    domain: 'administrative',
    component: MetricsMissedRateCard,
    defaultLayout: { x: 8, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
    requiredPermission: 'administrative_access',
  },
  
  // ========================================
  // MARKETING DOMAIN (4 cards)
  // ========================================
  
  'metrics-website-visitors': {
    id: 'metrics-website-visitors',
    title: 'Visitantes do Site',
    description: 'Número total de visitantes únicos do site no período',
    domain: 'marketing',
    component: MetricsWebsiteVisitorsCard,
    defaultLayout: { x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    requiredPermission: 'marketing_access',
  },
  
  'metrics-website-views': {
    id: 'metrics-website-views',
    title: 'Visualizações',
    description: 'Número total de visualizações de páginas',
    domain: 'marketing',
    component: MetricsWebsiteViewsCard,
    defaultLayout: { x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    requiredPermission: 'marketing_access',
  },
  
  'metrics-website-ctr': {
    id: 'metrics-website-ctr',
    title: 'CTR (Taxa de Cliques)',
    description: 'Percentual de cliques em relação às impressões',
    domain: 'marketing',
    component: MetricsWebsiteCTRCard,
    defaultLayout: { x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    requiredPermission: 'marketing_access',
  },
  
  'metrics-website-conversion': {
    id: 'metrics-website-conversion',
    title: 'Taxa de Conversão',
    description: 'Percentual de visitantes que realizaram ação desejada',
    domain: 'marketing',
    component: MetricsWebsiteConversionCard,
    defaultLayout: { x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2 },
    requiredPermission: 'marketing_access',
  },
  
  // ========================================
  // TEAM DOMAIN (3 cards) - FASE 1.4
  // ========================================
  
  'metrics-team-total-revenue': {
    id: 'metrics-team-total-revenue',
    title: 'Receita Total da Equipe',
    description: 'Receita total gerada pela equipe no período',
    domain: 'team',
    component: MetricsTeamTotalRevenueCard,
    defaultLayout: { x: 0, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
    requiredPermission: 'team_access',
  },
  
  'metrics-team-active-patients': {
    id: 'metrics-team-active-patients',
    title: 'Pacientes Ativos da Equipe',
    description: 'Total de pacientes ativos sob gestão da equipe',
    domain: 'team',
    component: MetricsTeamActivePatientsCard,
    defaultLayout: { x: 4, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
    requiredPermission: 'team_access',
  },
  
  'metrics-team-sessions': {
    id: 'metrics-team-sessions',
    title: 'Sessões Realizadas',
    description: 'Total de sessões realizadas pela equipe',
    domain: 'team',
    component: MetricsTeamSessionsCard,
    defaultLayout: { x: 8, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
    requiredPermission: 'team_access',
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Obtém a definição de um card pelo ID
 * @param cardId - ID único do card
 * @returns Definição do card ou undefined se não encontrado
 */
export function getMetricsCardById(cardId: string): MetricsCardDefinition | undefined {
  return METRICS_CARD_REGISTRY[cardId];
}

/**
 * Obtém todos os cards de um domínio específico
 * @param domain - Domínio das métricas (financial, administrative, marketing, team)
 * @returns Array de definições de cards do domínio
 */
export function getMetricsCardsByDomain(
  domain: 'financial' | 'administrative' | 'marketing' | 'team'
): MetricsCardDefinition[] {
  return Object.values(METRICS_CARD_REGISTRY).filter(card => card.domain === domain);
}

/**
 * Verifica se um usuário tem permissão para visualizar um card específico
 * @param cardId - ID único do card
 * @param userPermissions - Array de permissões do usuário
 * @returns true se o usuário pode visualizar o card, false caso contrário
 * 
 * @example
 * ```ts
 * const permissions = ['financial_access', 'administrative_access'];
 * const canView = canUserViewCard('metrics-revenue-total', permissions);
 * // canView = true (card requer financial_access)
 * ```
 */
export function canUserViewCard(
  cardId: string,
  userPermissions: Array<'financial_access' | 'administrative_access' | 'marketing_access' | 'team_access'>
): boolean {
  const card = getMetricsCardById(cardId);
  
  // Card não existe no registry
  if (!card) return false;
  
  // Card não requer permissão específica (público)
  if (!card.requiredPermission) return true;
  
  // Verifica se usuário possui a permissão necessária
  return userPermissions.includes(card.requiredPermission);
}

/**
 * Obtém IDs de todos os cards disponíveis
 * @returns Array de IDs de cards
 */
export function getAllCardIds(): string[] {
  return Object.keys(METRICS_CARD_REGISTRY);
}

/**
 * Obtém IDs de cards de um domínio específico
 * @param domain - Domínio das métricas
 * @returns Array de IDs de cards do domínio
 */
export function getCardIdsByDomain(
  domain: 'financial' | 'administrative' | 'marketing' | 'team'
): string[] {
  return getMetricsCardsByDomain(domain).map(card => card.id);
}

/**
 * Obtém layout padrão de um card
 * @param cardId - ID único do card
 * @returns Objeto de layout padrão ou undefined se card não existe
 */
export function getDefaultCardLayout(cardId: string) {
  const card = getMetricsCardById(cardId);
  return card?.defaultLayout;
}

/**
 * Valida se um ID de card existe no registry
 * @param cardId - ID a validar
 * @returns true se o card existe, false caso contrário
 */
export function isValidCardId(cardId: string): boolean {
  return cardId in METRICS_CARD_REGISTRY;
}
