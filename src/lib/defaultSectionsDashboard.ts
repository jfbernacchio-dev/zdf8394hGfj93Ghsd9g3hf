/**
 * ============================================================================
 * DASHBOARD SECTIONS - FASE 4
 * ============================================================================
 * 
 * Configurações de seções para a página de Dashboard
 * Define permissões e cards disponíveis para cada seção
 */

import type { SectionConfig } from '@/types/sectionTypes';

export const DASHBOARD_SECTIONS: Record<string, SectionConfig> = {
  'dashboard-financial': {
    id: 'dashboard-financial',
    name: 'Visão Geral Financeira',
    description: 'Receitas, pagamentos pendentes e NFSe',
    permissionConfig: {
      primaryDomain: 'financial',
      secondaryDomains: [],
      blockedFor: [],
      requiresOwnDataOnly: true,
    },
    availableCardIds: [
      'dashboard-expected-revenue',
      'dashboard-actual-revenue',
      'dashboard-unpaid-value',
      'dashboard-payment-rate',
      'dashboard-chart-revenue-trend',
      'dashboard-chart-payment-status',
      'dashboard-chart-revenue-by-therapist',
    ],
    defaultHeight: 400,
    collapsible: true,
    startCollapsed: false,
  },

  'dashboard-administrative': {
    id: 'dashboard-administrative',
    name: 'Visão Administrativa',
    description: 'Sessões, pacientes e agendamentos',
    permissionConfig: {
      primaryDomain: 'administrative',
      secondaryDomains: [],
      blockedFor: [],
      requiresOwnDataOnly: true,
    },
    availableCardIds: [
      'dashboard-attended-sessions',
      'dashboard-expected-sessions',
      'dashboard-pending-sessions',
      'dashboard-missed-sessions',
      'dashboard-total-patients',
      'dashboard-attendance-rate',
      'dashboard-chart-session-types',
      'dashboard-chart-therapist-distribution',
      'dashboard-chart-attendance-weekly',
    ],
    defaultHeight: 350,
    collapsible: true,
    startCollapsed: false,
  },

  'dashboard-clinical': {
    id: 'dashboard-clinical',
    name: 'Visão Clínica',
    description: 'Queixas, evoluções e diagnósticos',
    permissionConfig: {
      primaryDomain: 'clinical',
      secondaryDomains: [],
      blockedFor: [],
      requiresOwnDataOnly: true,
    },
    availableCardIds: [
      // Nota: Cards clínicos específicos para dashboard ainda não implementados
      // Mantendo vazio por enquanto até serem criados
    ],
    defaultHeight: 300,
    collapsible: true,
    startCollapsed: false,
  },

  'dashboard-media': {
    id: 'dashboard-media',
    name: 'Analytics & Marketing',
    description: 'Métricas de site e campanhas',
    permissionConfig: {
      primaryDomain: 'media',
      secondaryDomains: [],
      blockedFor: ['subordinate'],
      requiresOwnDataOnly: false,
    },
    availableCardIds: [
      // Nota: Cards de mídia/marketing ainda não implementados
      // Mantendo vazio por enquanto até serem criados
    ],
    defaultHeight: 350,
    collapsible: true,
    startCollapsed: true,
  },

  'dashboard-general': {
    id: 'dashboard-general',
    name: 'Visão Geral',
    description: 'Cards gerais e informações do sistema',
    permissionConfig: {
      primaryDomain: 'general',
      secondaryDomains: [],
      blockedFor: [],
      requiresOwnDataOnly: false,
    },
    availableCardIds: [
      // Nota: Cards gerais ainda não implementados
      // Esta seção está pronta para receber cards com domain 'general'
    ],
    defaultHeight: 300,
    collapsible: true,
    startCollapsed: false,
  },

  'dashboard-charts': {
    id: 'dashboard-charts',
    name: 'Visão Gráfica',
    description: 'Gráficos consolidados de todas as áreas',
    permissionConfig: {
      primaryDomain: 'charts',
      secondaryDomains: ['financial', 'administrative', 'clinical', 'media'],
      blockedFor: [],
      requiresOwnDataOnly: true,
    },
    availableCardIds: [
      // Gráficos financeiros
      'dashboard-chart-revenue-trend',
      'dashboard-chart-payment-status',
      'dashboard-chart-revenue-by-therapist',
      'dashboard-chart-attendance-weekly',
      'dashboard-chart-patient-growth',
      // Gráficos administrativos
      'dashboard-chart-session-types',
      'dashboard-chart-therapist-distribution',
      'dashboard-chart-hourly-distribution',
      'dashboard-chart-cancellation-reasons',
      // Gráficos clínicos
      'dashboard-chart-monthly-comparison',
    ],
    defaultHeight: 400,
    collapsible: true,
    startCollapsed: false,
  },
};

/**
 * Layout padrão para dashboard
 */
export const DEFAULT_DASHBOARD_SECTIONS = {
  'dashboard-financial': [
    'dashboard-expected-revenue',
    'dashboard-actual-revenue',
    'dashboard-unpaid-value',
    'dashboard-chart-revenue-trend',
  ],
  'dashboard-administrative': [
    'dashboard-attended-sessions',
    'dashboard-total-patients',
    'dashboard-attendance-rate',
    'dashboard-chart-session-types',
  ],
  'dashboard-clinical': [
    // Vazio até cards clínicos serem implementados
  ],
  'dashboard-media': [
    // Vazio até cards de mídia serem implementados
  ],
  'dashboard-general': [
    // Vazio até cards gerais serem implementados
  ],
  'dashboard-charts': [
    'dashboard-chart-revenue-trend',
    'dashboard-chart-session-types',
    'dashboard-chart-payment-status',
    'dashboard-chart-therapist-distribution',
  ],
};
