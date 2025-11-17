/**
 * ============================================================================
 * PATIENT DETAIL SECTIONS - FASE 4
 * ============================================================================
 * 
 * Configurações de seções para a página de Detalhe do Paciente
 * Define permissões e cards disponíveis para cada seção
 */

import type { SectionConfig } from '@/types/sectionTypes';

export const PATIENT_SECTIONS: Record<string, SectionConfig> = {
  'patient-financial': {
    id: 'patient-financial',
    name: 'Financeiro',
    description: 'Receitas, pagamentos e NFSe deste paciente',
    permissionConfig: {
      primaryDomain: 'financial',
      secondaryDomains: [],
      blockedFor: [],
      requiresOwnDataOnly: true,
    },
    availableCardIds: [
      'patient-stat-revenue-month',
      'patient-stat-revenue-year',
      'patient-stat-pending-sessions',
      'patient-stat-nfse-count',
      'patient-stat-session-value',
      'patient-stat-total-debt',
      'patient-chart-payment-history',
      'patient-chart-revenue-trend',
    ],
    defaultHeight: 400,
    collapsible: true,
    startCollapsed: false,
  },

  'patient-clinical': {
    id: 'patient-clinical',
    name: 'Dados Clínicos',
    description: 'Queixas, medicações e diagnósticos',
    permissionConfig: {
      primaryDomain: 'clinical',
      secondaryDomains: [],
      blockedFor: [],
      requiresOwnDataOnly: true,
    },
    availableCardIds: [
      'patient-complaints-summary',
      'patient-medications-list',
      'patient-diagnoses-active',
      'patient-clinical-notes',
      'patient-vulnerabilities',
    ],
    defaultHeight: 500,
    collapsible: true,
    startCollapsed: false,
  },

  'patient-sessions': {
    id: 'patient-sessions',
    name: 'Sessões',
    description: 'Histórico de sessões e agendamentos',
    permissionConfig: {
      primaryDomain: 'administrative',
      secondaryDomains: ['clinical'],
      blockedFor: [],
      requiresOwnDataOnly: true,
    },
    availableCardIds: [
      'patient-sessions-timeline',
      'patient-sessions-calendar',
      'patient-sessions-stats',
      'patient-attendance-rate',
      'patient-session-frequency',
    ],
    defaultHeight: 450,
    collapsible: true,
    startCollapsed: false,
  },

  'patient-contact': {
    id: 'patient-contact',
    name: 'Contato & Informações',
    description: 'Dados pessoais e de contato',
    permissionConfig: {
      primaryDomain: 'general',
      secondaryDomains: [],
      blockedFor: [],
      requiresOwnDataOnly: true,
    },
    availableCardIds: [
      'patient-contact-info',
      'patient-personal-data',
      'patient-guardian-info',
      'patient-consent-status',
    ],
    defaultHeight: 300,
    collapsible: true,
    startCollapsed: false,
  },
};

/**
 * Layout padrão para página de paciente
 */
export const DEFAULT_PATIENT_SECTIONS = {
  'patient-financial': [
    'patient-stat-revenue-month',
    'patient-stat-pending-sessions',
    'patient-stat-nfse-count',
  ],
  'patient-clinical': [
    'patient-complaints-summary',
    'patient-medications-list',
  ],
  'patient-sessions': [
    'patient-sessions-timeline',
  ],
  'patient-contact': [
    'patient-contact-info',
  ],
};
