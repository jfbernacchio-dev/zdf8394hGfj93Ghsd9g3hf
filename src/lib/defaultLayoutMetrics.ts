/**
 * ============================================================================
 * DEFAULT METRICS LAYOUT - FASE C3-R.1
 * ============================================================================
 * 
 * Layouts padrão para a página /metrics por domínio.
 * Sistema de grid de 12 colunas com React Grid Layout.
 * 
 * Cada seção representa um domínio (financial, administrative, marketing, team)
 * e contém um array de GridCardLayout com posições e dimensões dos cards.
 * 
 * IMPORTANTE: Usa DashboardGridLayout (mesmo formato do dashboard example)
 * para compatibilidade com useDashboardLayout hook.
 */

import type { GridCardLayout } from '@/types/cardTypes';
import type { DashboardGridLayout } from './defaultLayoutDashboardExample';

/**
 * Layout padrão completo para /metrics
 * Grid de 12 colunas, cada card ocupa 3 colunas por padrão (4 cards por linha)
 */
export const DEFAULT_METRICS_LAYOUT: DashboardGridLayout = {
  // ==========================================
  // FINANCIAL DOMAIN
  // ==========================================
  'metrics-financial': {
    cardLayouts: [
      // Linha 1 - Cards principais de receita
      { 
        i: 'metrics-revenue-total', 
        x: 0, 
        y: 0, 
        w: 3, 
        h: 2,
        minW: 2,
        minH: 2,
        maxW: 6,
        maxH: 4
      },
      { 
        i: 'metrics-forecast-revenue', 
        x: 3, 
        y: 0, 
        w: 3, 
        h: 2,
        minW: 2,
        minH: 2,
        maxW: 6,
        maxH: 4
      },
      { 
        i: 'metrics-lost-revenue', 
        x: 6, 
        y: 0, 
        w: 3, 
        h: 2,
        minW: 2,
        minH: 2,
        maxW: 6,
        maxH: 4
      },
      { 
        i: 'metrics-avg-per-session', 
        x: 9, 
        y: 0, 
        w: 3, 
        h: 2,
        minW: 2,
        minH: 2,
        maxW: 6,
        maxH: 4
      },
      
      // Linha 2 - Card adicional
      { 
        i: 'metrics-avg-per-active-patient', 
        x: 0, 
        y: 2, 
        w: 3, 
        h: 2,
        minW: 2,
        minH: 2,
        maxW: 6,
        maxH: 4
      },
    ]
  },
  
  // ==========================================
  // ADMINISTRATIVE DOMAIN
  // ==========================================
  'metrics-administrative': {
    cardLayouts: [
      // Linha 1 - Cards de pacientes e ocupação
      { 
        i: 'metrics-active-patients', 
        x: 0, 
        y: 0, 
        w: 4, 
        h: 2,
        minW: 3,
        minH: 2,
        maxW: 6,
        maxH: 4
      },
      { 
        i: 'metrics-occupation-rate', 
        x: 4, 
        y: 0, 
        w: 4, 
        h: 2,
        minW: 3,
        minH: 2,
        maxW: 6,
        maxH: 4
      },
      { 
        i: 'metrics-missed-rate', 
        x: 8, 
        y: 0, 
        w: 4, 
        h: 2,
        minW: 3,
        minH: 2,
        maxW: 6,
        maxH: 4
      },
    ]
  },
  
  // ==========================================
  // MARKETING DOMAIN
  // ==========================================
  'metrics-marketing': {
    cardLayouts: [
      // Linha 1 - Cards de website (4 cards, 3 colunas cada)
      { 
        i: 'metrics-website-visitors', 
        x: 0, 
        y: 0, 
        w: 3, 
        h: 2,
        minW: 2,
        minH: 2,
        maxW: 6,
        maxH: 4
      },
      { 
        i: 'metrics-website-views', 
        x: 3, 
        y: 0, 
        w: 3, 
        h: 2,
        minW: 2,
        minH: 2,
        maxW: 6,
        maxH: 4
      },
      { 
        i: 'metrics-website-ctr', 
        x: 6, 
        y: 0, 
        w: 3, 
        h: 2,
        minW: 2,
        minH: 2,
        maxW: 6,
        maxH: 4
      },
      { 
        i: 'metrics-website-conversion', 
        x: 9, 
        y: 0, 
        w: 3, 
        h: 2,
        minW: 2,
        minH: 2,
        maxW: 6,
        maxH: 4
      },
    ]
  },
  
  // ==========================================
  // TEAM DOMAIN - FASE 1.4
  // ==========================================
  'metrics-team': {
    cardLayouts: [
      { i: 'metrics-team-total-revenue', x: 0, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
      { i: 'metrics-team-active-patients', x: 4, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
      { i: 'metrics-team-sessions', x: 8, y: 0, w: 4, h: 2, minW: 3, minH: 2 },
    ]
  },
};

/**
 * Helper: Obter layout padrão para um domínio específico
 */
export function getDefaultLayoutForDomain(domain: string): GridCardLayout[] {
  const sectionId = `metrics-${domain}`;
  const section = DEFAULT_METRICS_LAYOUT[sectionId];
  return section?.cardLayouts || [];
}

/**
 * Helper: Obter todos os IDs de cards para um domínio
 */
export function getCardIdsForDomain(domain: string): string[] {
  const layout = getDefaultLayoutForDomain(domain);
  return layout.map(item => item.i);
}
