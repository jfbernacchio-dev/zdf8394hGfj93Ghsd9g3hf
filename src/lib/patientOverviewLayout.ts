/**
 * ============================================================================
 * PATIENT OVERVIEW LAYOUT SYSTEM - FASE C1.3
 * ============================================================================
 * 
 * Sistema de gerenciamento de layout dos cards da aba "Visão Geral"
 * do PatientDetail.tsx
 * 
 * Este arquivo define:
 * - Estrutura de layout (PatientOverviewCardLayout)
 * - Layout padrão (DEFAULT_PATIENT_OVERVIEW_LAYOUT)
 * - Funções auxiliares puras para manipulação de layout
 * 
 * ⚠️ IMPORTANTE:
 * - Este arquivo NÃO contém JSX ou React
 * - Este arquivo NÃO acessa localStorage ou faz IO
 * - Apenas tipos, dados e funções puras
 */

import { PATIENT_OVERVIEW_CARDS, getDefaultPatientOverviewCardIds } from '@/config/patientOverviewCards';

/**
 * Estrutura de layout de um card na grade
 * Compatível com React Grid Layout
 */
export interface PatientOverviewCardLayout {
  /** ID do card (deve existir em PATIENT_OVERVIEW_CARDS) */
  id: string;
  
  /** Posição X na grade (0-indexed) */
  x: number;
  
  /** Posição Y na grade (0-indexed) */
  y: number;
  
  /** Largura em unidades de grade */
  w: number;
  
  /** Altura em unidades de grade */
  h: number;
  
  /** Se true, o card não pode ser movido */
  static?: boolean;
  
  /** Largura mínima em unidades de grade */
  minW?: number;
  
  /** Altura mínima em unidades de grade */
  minH?: number;
  
  /** Largura máxima em unidades de grade */
  maxW?: number;
  
  /** Altura máxima em unidades de grade */
  maxH?: number;
}

/**
 * ============================================================================
 * DEFAULT LAYOUT - POSICIONAMENTO INICIAL DOS CARDS
 * ============================================================================
 * 
 * Grade: 12 colunas
 * Unidade de altura: ~80px por unidade
 * 
 * ORGANIZAÇÃO:
 * 1. Cards estatísticos (stats) → Área superior compacta
 * 2. Cards funcionais → Área inferior com mais espaço
 */
export const DEFAULT_PATIENT_OVERVIEW_LAYOUT: PatientOverviewCardLayout[] = [
  // ========== STATISTICAL CARDS (TOP SECTION) ==========
  // Linha 1: Cards principais do mês
  { id: 'patient-stat-total', x: 0, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
  { id: 'patient-stat-attended', x: 2, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
  { id: 'patient-stat-scheduled', x: 4, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
  { id: 'patient-stat-unpaid', x: 6, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
  { id: 'patient-stat-nfse', x: 8, y: 0, w: 2, h: 2, minW: 2, minH: 2 },
  
  // Linha 2: Cards secundários / menos usados (inicialmente ocultos por padrão)
  { id: 'patient-stat-total-all', x: 0, y: 2, w: 2, h: 2, minW: 2, minH: 2 },
  { id: 'patient-stat-revenue-month', x: 2, y: 2, w: 2, h: 2, minW: 2, minH: 2 },
  { id: 'patient-stat-paid-month', x: 4, y: 2, w: 2, h: 2, minW: 2, minH: 2 },
  { id: 'patient-stat-missed-month', x: 6, y: 2, w: 2, h: 2, minW: 2, minH: 2 },
  { id: 'patient-stat-attendance-rate', x: 8, y: 2, w: 2, h: 2, minW: 2, minH: 2 },
  { id: 'patient-stat-unscheduled-month', x: 10, y: 2, w: 2, h: 2, minW: 2, minH: 2 },
  
  // ========== FUNCTIONAL CARDS (MAIN CONTENT SECTION) ==========
  // Começam em y: 4 (após os stats)
  
  // Linha 1: Próximo agendamento + Contato
  { id: 'patient-next-appointment', x: 0, y: 4, w: 4, h: 3, minW: 3, minH: 3 },
  { id: 'patient-contact-info', x: 4, y: 4, w: 4, h: 3, minW: 3, minH: 3 },
  
  // Linha 2: Queixa clínica (grande) + Info clínica
  { id: 'patient-clinical-complaint', x: 0, y: 7, w: 5, h: 4, minW: 4, minH: 4 },
  { id: 'patient-clinical-info', x: 5, y: 7, w: 7, h: 3, minW: 5, minH: 3 },
  
  // Linha 3: Histórico + Ações rápidas
  { id: 'patient-history', x: 5, y: 10, w: 4, h: 3, minW: 3, minH: 3 },
  { id: 'quick-actions', x: 9, y: 10, w: 3, h: 3, minW: 3, minH: 3 },
  
  // Cards opcionais (inicialmente não visíveis por padrão)
  { id: 'recent-notes', x: 0, y: 11, w: 4, h: 4, minW: 3, minH: 3 },
  { id: 'payment-summary', x: 4, y: 13, w: 4, h: 3, minW: 3, minH: 3 },
  { id: 'session-frequency', x: 8, y: 13, w: 4, h: 3, minW: 3, minH: 3 },
];

/**
 * ============================================================================
 * PURE HELPER FUNCTIONS
 * ============================================================================
 */

/**
 * Retorna o layout padrão
 * 
 * @returns Layout padrão completo
 */
export function getDefaultPatientOverviewLayout(): PatientOverviewCardLayout[] {
  return [...DEFAULT_PATIENT_OVERVIEW_LAYOUT];
}

/**
 * Valida se um layout é válido
 * 
 * @param layout - Layout a validar
 * @returns true se o layout é válido
 */
export function isValidLayout(layout: unknown): layout is PatientOverviewCardLayout[] {
  if (!Array.isArray(layout)) return false;
  
  return layout.every(item => {
    return (
      typeof item === 'object' &&
      item !== null &&
      typeof item.id === 'string' &&
      typeof item.x === 'number' &&
      typeof item.y === 'number' &&
      typeof item.w === 'number' &&
      typeof item.h === 'number' &&
      item.x >= 0 &&
      item.y >= 0 &&
      item.w > 0 &&
      item.h > 0
    );
  });
}

/**
 * Normaliza um layout, garantindo que:
 * - Todos os cards têm IDs válidos (existem no catálogo)
 * - Todos os valores numéricos são válidos
 * - Remove cards duplicados
 * 
 * @param layout - Layout a normalizar
 * @returns Layout normalizado
 */
export function normalizePatientOverviewLayout(
  layout: PatientOverviewCardLayout[]
): PatientOverviewCardLayout[] {
  const seen = new Set<string>();
  
  return layout
    .filter(item => {
      // Verificar se o card existe no catálogo
      if (!PATIENT_OVERVIEW_CARDS[item.id]) return false;
      
      // Verificar duplicatas
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      
      return true;
    })
    .map(item => ({
      ...item,
      x: Math.max(0, Math.floor(item.x)),
      y: Math.max(0, Math.floor(item.y)),
      w: Math.max(1, Math.floor(item.w)),
      h: Math.max(1, Math.floor(item.h)),
    }));
}

/**
 * Mescla um layout existente com o layout base
 * 
 * Se o usuário tem um layout salvo mas novos cards foram adicionados,
 * esta função adiciona os novos cards ao layout existente.
 * 
 * @param baseLayout - Layout base (DEFAULT_PATIENT_OVERVIEW_LAYOUT)
 * @param existingLayout - Layout salvo pelo usuário
 * @returns Layout mesclado
 */
export function mergeLayouts(
  baseLayout: PatientOverviewCardLayout[],
  existingLayout: PatientOverviewCardLayout[]
): PatientOverviewCardLayout[] {
  const existingIds = new Set(existingLayout.map(item => item.id));
  
  // Cards do layout existente (priorizados)
  const merged = [...existingLayout];
  
  // Adicionar novos cards que não existem no layout salvo
  const newCards = baseLayout.filter(item => !existingIds.has(item.id));
  
  // Calcular Y máximo do layout existente para posicionar novos cards abaixo
  const maxY = existingLayout.length > 0
    ? Math.max(...existingLayout.map(item => item.y + item.h))
    : 0;
  
  // Adicionar novos cards com posição ajustada
  newCards.forEach((card, index) => {
    merged.push({
      ...card,
      y: maxY + Math.floor(index / 6) * 3, // 6 cards por linha, 3 unidades de altura
      x: (index % 6) * 2, // 2 unidades de largura por card
    });
  });
  
  return normalizePatientOverviewLayout(merged);
}

/**
 * Filtra o layout para incluir apenas os cards visíveis
 * 
 * @param layout - Layout completo
 * @param visibleCardIds - IDs dos cards visíveis
 * @returns Layout filtrado
 */
export function filterLayoutByVisibility(
  layout: PatientOverviewCardLayout[],
  visibleCardIds: string[]
): PatientOverviewCardLayout[] {
  const visibleSet = new Set(visibleCardIds);
  return layout.filter(item => visibleSet.has(item.id));
}

/**
 * Adiciona um card ao layout na primeira posição disponível
 * 
 * @param layout - Layout atual
 * @param cardId - ID do card a adicionar
 * @returns Novo layout com o card adicionado
 */
export function addCardToLayout(
  layout: PatientOverviewCardLayout[],
  cardId: string
): PatientOverviewCardLayout[] {
  // Verificar se o card já existe
  if (layout.some(item => item.id === cardId)) {
    return layout;
  }
  
  // Buscar definição do card no catálogo
  const cardDef = PATIENT_OVERVIEW_CARDS[cardId];
  if (!cardDef) return layout;
  
  // Buscar o card no layout padrão para pegar dimensões
  const defaultCard = DEFAULT_PATIENT_OVERVIEW_LAYOUT.find(item => item.id === cardId);
  
  // Calcular posição (no final do layout)
  const maxY = layout.length > 0
    ? Math.max(...layout.map(item => item.y + item.h))
    : 0;
  
  const newCard: PatientOverviewCardLayout = {
    id: cardId,
    x: 0,
    y: maxY,
    w: defaultCard?.w || 4,
    h: defaultCard?.h || 3,
    minW: defaultCard?.minW,
    minH: defaultCard?.minH,
    maxW: defaultCard?.maxW,
    maxH: defaultCard?.maxH,
  };
  
  return [...layout, newCard];
}

/**
 * Remove um card do layout
 * 
 * @param layout - Layout atual
 * @param cardId - ID do card a remover
 * @returns Novo layout sem o card
 */
export function removeCardFromLayout(
  layout: PatientOverviewCardLayout[],
  cardId: string
): PatientOverviewCardLayout[] {
  return layout.filter(item => item.id !== cardId);
}

/**
 * Retorna IDs dos cards que estão no layout
 * 
 * @param layout - Layout
 * @returns Array de IDs
 */
export function getLayoutCardIds(layout: PatientOverviewCardLayout[]): string[] {
  return layout.map(item => item.id);
}

/**
 * Retorna contagem de cards no layout
 * 
 * @param layout - Layout
 * @returns Número de cards
 */
export function getLayoutCardCount(layout: PatientOverviewCardLayout[]): number {
  return layout.length;
}

/**
 * ============================================================================
 * FASE C1.5: FUNÇÕES DE VALIDAÇÃO E CONVERGÊNCIA
 * ============================================================================
 */

/**
 * Verifica convergência entre o catálogo de cards e o layout padrão
 * 
 * Retorna informações sobre:
 * - Cards no catálogo mas ausentes do layout
 * - Cards no layout mas ausentes do catálogo (órfãos)
 * - Total de cards em cada
 * 
 * @returns Objeto com análise de convergência
 */
export function validateLayoutCatalogConvergence(): {
  isConverged: boolean;
  missingInLayout: string[];
  orphanedInLayout: string[];
  catalogCount: number;
  layoutCount: number;
} {
  const catalogIds = new Set(Object.keys(PATIENT_OVERVIEW_CARDS));
  const layoutIds = new Set(DEFAULT_PATIENT_OVERVIEW_LAYOUT.map(item => item.id));
  
  const missingInLayout: string[] = [];
  const orphanedInLayout: string[] = [];
  
  // Cards no catálogo mas não no layout
  catalogIds.forEach(id => {
    if (!layoutIds.has(id)) {
      missingInLayout.push(id);
    }
  });
  
  // Cards no layout mas não no catálogo
  layoutIds.forEach(id => {
    if (!catalogIds.has(id)) {
      orphanedInLayout.push(id);
    }
  });
  
  const isConverged = missingInLayout.length === 0 && orphanedInLayout.length === 0;
  
  return {
    isConverged,
    missingInLayout,
    orphanedInLayout,
    catalogCount: catalogIds.size,
    layoutCount: layoutIds.size,
  };
}

/**
 * Loga o status de convergência no console (útil para debugging)
 */
export function logLayoutConvergenceStatus(): void {
  const status = validateLayoutCatalogConvergence();
  
  console.log('📊 [PatientOverviewLayout] Status de Convergência:');
  console.log(`   ✓ Convergido: ${status.isConverged ? 'SIM' : 'NÃO'}`);
  console.log(`   📦 Cards no catálogo: ${status.catalogCount}`);
  console.log(`   🎯 Cards no layout: ${status.layoutCount}`);
  
  if (status.missingInLayout.length > 0) {
    console.warn(`   ⚠️ Cards ausentes no layout (${status.missingInLayout.length}):`, status.missingInLayout);
  }
  
  if (status.orphanedInLayout.length > 0) {
    console.warn(`   ⚠️ Cards órfãos no layout (${status.orphanedInLayout.length}):`, status.orphanedInLayout);
  }
  
  if (status.isConverged) {
    console.log('   ✅ Catálogo e layout estão perfeitamente sincronizados');
  }
}
