/**
 * ============================================================================
 * EVOLUTION SECTIONS - FASE 4
 * ============================================================================
 * 
 * Configurações de seções para a página de Evolução Clínica
 * Define permissões e cards disponíveis para cada seção
 */

import type { SectionConfig } from '@/types/sectionTypes';

export const EVOLUTION_SECTIONS: Record<string, SectionConfig> = {
  'evolution-overview': {
    id: 'evolution-overview',
    name: 'Visão Geral',
    description: 'Status atual das queixas e medicações do paciente',
    permissionConfig: {
      primaryDomain: 'clinical',
      secondaryDomains: [],
      blockedFor: [],
      requiresOwnDataOnly: true,
    },
    availableCardIds: [
      'clinical-complaints-summary',
      'clinical-medications-current',
      'clinical-diagnoses-active',
    ],
    defaultHeight: 300,
    collapsible: false,
    startCollapsed: false,
  },

  'evolution-charts': {
    id: 'evolution-charts',
    name: 'Gráficos de Evolução',
    description: 'Timeline das avaliações psicológicas do paciente',
    permissionConfig: {
      primaryDomain: 'clinical',
      secondaryDomains: [],
      blockedFor: [],
      requiresOwnDataOnly: true,
    },
    availableCardIds: [
      'evolution-chart-consciousness',
      'evolution-chart-orientation',
      'evolution-chart-memory',
      'evolution-chart-mood',
      'evolution-chart-thought',
      'evolution-chart-language',
      'evolution-chart-sensoperception',
      'evolution-chart-intelligence',
      'evolution-chart-will',
      'evolution-chart-psychomotor',
      'evolution-chart-attention',
      'evolution-chart-personality',
    ],
    defaultHeight: 500,
    collapsible: true,
    startCollapsed: false,
  },
};

/**
 * Layout padrão para evolução clínica
 */
export const DEFAULT_EVOLUTION_SECTIONS = {
  'evolution-overview': ['clinical-complaints-summary'],
  'evolution-charts': [
    'evolution-chart-consciousness',
    'evolution-chart-mood',
    'evolution-chart-thought',
  ],
};
