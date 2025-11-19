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
    name: 'Financeira',
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
  minCardWidth: 280,
  maxCardWidth: 800,
  defaultCardWidth: 300,
},

  'dashboard-administrative': {
    id: 'dashboard-administrative',
    name: 'Administrativa',
    description: 'Sessões, pacientes e agendamentos',
    permissionConfig: {
      primaryDomain: 'administrative',
      secondaryDomains: [],
      blockedFor: [],
      requiresOwnDataOnly: true,
    },
    availableCardIds: [
      'dashboard-total-patients',
      'dashboard-attended-sessions',
      'dashboard-expected-sessions',
      'dashboard-pending-sessions',
      'dashboard-missed-sessions',
      'dashboard-attendance-rate',
      'dashboard-chart-session-types',
      'dashboard-chart-therapist-distribution',
      'dashboard-chart-attendance-weekly',
    ],
    defaultHeight: 350,
    collapsible: true,
    startCollapsed: false,
    minCardWidth: 280,
    maxCardWidth: 800,
    defaultCardWidth: 300,
  },

  'dashboard-clinical': {
    id: 'dashboard-clinical',
    name: 'Clínica',
    description: 'Queixas, evoluções e diagnósticos',
    permissionConfig: {
      primaryDomain: 'clinical',
      secondaryDomains: [],
      blockedFor: [],
      requiresOwnDataOnly: true,
    },
    availableCardIds: [
      'dashboard-active-complaints',
      'dashboard-no-diagnosis',
    ],
    defaultHeight: 300,
    collapsible: true,
    startCollapsed: false,
    minCardWidth: 280,
    maxCardWidth: 800,
    defaultCardWidth: 300,
  },

  'dashboard-media': {
    id: 'dashboard-media',
    name: 'Marketing',
    description: 'Métricas de site e campanhas',
    permissionConfig: {
      primaryDomain: 'media',
      secondaryDomains: [],
      blockedFor: ['subordinate'],
      requiresOwnDataOnly: false,
    },
    availableCardIds: [
      'dashboard-whatsapp-unread',
    ],
    defaultHeight: 350,
    collapsible: true,
    startCollapsed: true,
    minCardWidth: 280,
    maxCardWidth: 800,
    defaultCardWidth: 300,
  },

  'dashboard-general': {
    id: 'dashboard-general',
    name: 'Geral',
    description: 'Cards gerais e informações do sistema',
    permissionConfig: {
      primaryDomain: 'general',
      secondaryDomains: [],
      blockedFor: [],
      requiresOwnDataOnly: false,
    },
    availableCardIds: [
      'dashboard-quick-actions',
      'dashboard-recent-sessions',
    ],
    defaultHeight: 300,
    collapsible: true,
    startCollapsed: false,
    minCardWidth: 280,
    maxCardWidth: 800,
    defaultCardWidth: 300,
  },

  'dashboard-charts': {
    id: 'dashboard-charts',
    name: 'Gráficos',
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
  // Layout config for ResizableCardSimple - charts são maiores
  minCardWidth: 400,
  maxCardWidth: 1000,
  defaultCardWidth: 450,
},

  'dashboard-team': {
    id: 'dashboard-team',
    name: 'Equipe',
    description: 'Dados dos subordinados',
    permissionConfig: {
      primaryDomain: 'team',
      secondaryDomains: ['financial', 'administrative', 'clinical'],
      blockedFor: ['subordinate'],
      requiresOwnDataOnly: false,
    },
    availableCardIds: [
      'dashboard-expected-revenue-team',
      'dashboard-actual-revenue-team',
      'dashboard-unpaid-value-team',
      'dashboard-payment-rate-team',
      'dashboard-total-patients-team',
      'dashboard-attended-sessions-team',
      'dashboard-active-therapists-team',
    ],
    defaultHeight: 400,
    collapsible: true,
    startCollapsed: false,
    minCardWidth: 280,
    maxCardWidth: 800,
    defaultCardWidth: 300,
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
    'dashboard-active-complaints',
    'dashboard-no-diagnosis',
  ],
  'dashboard-team': [
    'dashboard-expected-revenue-team',
    'dashboard-actual-revenue-team',
    'dashboard-unpaid-value-team',
    'dashboard-payment-rate-team',
    'dashboard-total-patients-team',
    'dashboard-attended-sessions-team',
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
