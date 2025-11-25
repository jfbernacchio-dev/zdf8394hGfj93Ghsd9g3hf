import type { GridCardLayout } from '@/types/cardTypes';

/**
 * LAYOUT STRUCTURE FOR PATIENT OVERVIEW (Visão Geral)
 * 
 * FASE C1.1: Estrutura preparatória
 * 
 * Define o layout padrão da aba "Visão Geral" do PatientDetail
 * usando React Grid Layout (12 colunas).
 * 
 * ESTRUTURA:
 * {
 *   sectionId: {
 *     cardLayouts: [
 *       { i: cardId, x: col, y: row, w: cols, h: rows, minW, minH }
 *     ]
 *   }
 * }
 * 
 * NOTA FASE C1.1:
 * - Apenas estrutura base criada
 * - Cards serão adicionados em fases posteriores (C1.2, C1.3, C1.6)
 */

// ============================================================================
// TIPOS
// ============================================================================

export interface GridSectionLayout {
  cardLayouts: GridCardLayout[];
}

export type PatientOverviewGridLayout = Record<string, GridSectionLayout>;

// ============================================================================
// GRID LAYOUT PADRÃO (React Grid Layout) - FASE C1.1
// ============================================================================

/**
 * DEFAULT GRID LAYOUT FOR PATIENT OVERVIEW
 * 
 * Layout baseado em grid de 12 colunas para React Grid Layout.
 * 
 * FASE C1.4: Cards MVP posicionados
 * - 12 cards placeholders distribuídos em layout responsivo
 * - 3 cards financeiros no topo (linha 1)
 * - 2 cards clínicos médios (linha 2)
 * - 2 cards clínicos (linha 3)
 * - 2 cards de sessões (linha 4)
 * - 3 cards de contato/dados no rodapé (linha 5)
 */
export const DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT: PatientOverviewGridLayout = {
  'patient-overview-main': {
    cardLayouts: [
      // === FINANCEIRO (linha 1) ===
      { i: 'patient-revenue-month',      x: 0,  y: 0,  w: 4, h: 3, minW: 3, minH: 2 },
      { i: 'patient-pending-sessions',   x: 4,  y: 0,  w: 4, h: 3, minW: 3, minH: 2 },
      { i: 'patient-nfse-count',         x: 8,  y: 0,  w: 4, h: 3, minW: 3, minH: 2 },

      // === CLÍNICO (linhas 2-3) ===
      { i: 'patient-complaints-summary', x: 0,  y: 3,  w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'patient-medications-list',   x: 6,  y: 3,  w: 6, h: 4, minW: 4, minH: 3 },
      
      { i: 'patient-diagnoses-list',     x: 0,  y: 7,  w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'patient-sessions-timeline',  x: 6,  y: 7,  w: 6, h: 4, minW: 4, minH: 3 },

      // === SESSÕES (linha 4) ===
      { i: 'patient-session-frequency',  x: 0,  y: 11, w: 4, h: 3, minW: 3, minH: 2 },
      { i: 'patient-attendance-rate',    x: 4,  y: 11, w: 4, h: 3, minW: 3, minH: 2 },

      // === CONTATO/DADOS (linha 5) ===
      { i: 'patient-contact-info',       x: 0,  y: 14, w: 4, h: 3, minW: 3, minH: 2 },
      { i: 'patient-consent-status',     x: 4,  y: 14, w: 4, h: 3, minW: 3, minH: 2 },
      { i: 'patient-personal-data',      x: 8,  y: 14, w: 4, h: 3, minW: 3, minH: 2 },
    ],
  },
};
