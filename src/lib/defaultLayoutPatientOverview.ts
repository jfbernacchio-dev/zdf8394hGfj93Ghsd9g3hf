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
 * FASE C1.1: Estrutura placeholder vazia
 * - Seção principal criada: "patient-overview-main"
 * - Cards serão adicionados em C1.6 (implementação MVP)
 */
export const DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT: PatientOverviewGridLayout = {
  // SEÇÃO PRINCIPAL: Vazia por enquanto (placeholder)
  'patient-overview-main': {
    cardLayouts: [],
  },
};
