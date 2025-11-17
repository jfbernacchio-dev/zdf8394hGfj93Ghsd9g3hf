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
      'stat-revenue-month',
      'stat-revenue-year',
      'stat-pending-payments',
      'stat-nfse-issued',
      'stat-session-value-avg',
      'stat-financial-overview',
      'chart-revenue-trend',
      'chart-revenue-by-patient',
      'chart-payment-methods',
      'chart-nfse-status',
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
      'stat-sessions-month',
      'stat-sessions-year',
      'stat-active-patients',
      'stat-inactive-patients',
      'stat-schedule-conflicts',
      'stat-attendance-rate',
      'chart-sessions-per-day',
      'chart-sessions-by-status',
      'chart-patient-frequency',
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
      'stat-active-complaints',
      'stat-pending-evolutions',
      'stat-patients-with-diagnoses',
      'stat-medications-prescribed',
      'chart-complaints-by-category',
      'chart-complaints-severity',
      'chart-diagnoses-distribution',
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
      'stat-website-visits',
      'stat-contact-forms',
      'stat-conversion-rate',
      'chart-traffic-sources',
      'chart-page-views',
      'chart-contact-form-submissions',
    ],
    defaultHeight: 350,
    collapsible: true,
    startCollapsed: true,
  },
};

/**
 * Layout padrão para dashboard
 */
export const DEFAULT_DASHBOARD_SECTIONS = {
  'dashboard-financial': [
    'stat-revenue-month',
    'stat-pending-payments',
    'stat-nfse-issued',
    'chart-revenue-trend',
  ],
  'dashboard-administrative': [
    'stat-sessions-month',
    'stat-active-patients',
    'chart-sessions-per-day',
  ],
  'dashboard-clinical': [
    'stat-active-complaints',
    'chart-complaints-by-category',
  ],
  'dashboard-media': [
    'stat-website-visits',
  ],
};
