/**
 * GRID LAYOUT UTILITIES - FASE 2
 * 
 * Funções utilitárias para trabalhar com React Grid Layout
 * - Conversão de layouts sequenciais para grid
 * - Cálculo de posições e dimensões
 * - Validação de layouts
 */

import type { GridCardLayout } from '@/types/cardTypes';

/**
 * Interface do layout sequencial antigo (para conversão)
 */
interface SequentialCardLayout {
  cardId: string;
  width: number;   // largura em pixels
  order: number;   // ordem sequencial
}

/**
 * CONVERTER LAYOUT SEQUENCIAL PARA GRID
 * 
 * Converte um layout baseado em ordem sequencial (flex/grid CSS)
 * para layout de grid de 12 colunas (React Grid Layout).
 * 
 * LÓGICA:
 * 1. Converte width (pixels) → colunas (1-12)
 * 2. Posiciona cards sequencialmente da esquerda para direita
 * 3. Quando não cabe mais na linha, pula para próxima
 * 4. Altura padrão: 2 rows (120px com rowHeight=60)
 * 
 * @param sequentialLayout - Array de cards com width e order
 * @returns Array de GridCardLayout com posições x,y,w,h
 */
export const convertSequentialToGrid = (
  sequentialLayout: SequentialCardLayout[]
): GridCardLayout[] => {
  const GRID_COLS = 12;
  const DEFAULT_HEIGHT = 2;  // rows
  const CONTAINER_WIDTH = 1200; // pixels
  
  let currentX = 0;
  let currentY = 0;
  
  // Ordenar por ordem sequencial
  const sortedCards = [...sequentialLayout].sort((a, b) => a.order - b.order);
  
  return sortedCards.map((card) => {
    // Converter width (pixels) para colunas (1-12)
    const widthRatio = card.width / CONTAINER_WIDTH;
    let gridWidth = Math.round(widthRatio * GRID_COLS);
    
    // Garantir limites: mínimo 2 colunas, máximo 12
    gridWidth = Math.max(2, Math.min(12, gridWidth));
    
    // Se não cabe na linha atual, pular para próxima
    if (currentX + gridWidth > GRID_COLS) {
      currentX = 0;
      currentY += DEFAULT_HEIGHT;
    }
    
    const gridCard: GridCardLayout = {
      i: card.cardId,
      x: currentX,
      y: currentY,
      w: gridWidth,
      h: DEFAULT_HEIGHT,
      minW: 2,  // mínimo 2 colunas (~200px)
      minH: 1,  // mínimo 1 row (60px)
      maxW: 12, // máximo largura total
    };
    
    // Avançar para próxima posição horizontal
    currentX += gridWidth;
    
    return gridCard;
  });
};

/**
 * CALCULAR LARGURA EM PIXELS
 * 
 * Converte largura em colunas para pixels.
 * Útil para preview e cálculos de dimensões.
 * 
 * @param cols - Número de colunas (1-12)
 * @param containerWidth - Largura total do container (padrão: 1200px)
 * @param margin - Margem entre cards (padrão: 16px)
 * @returns Largura em pixels
 */
export const calculatePixelWidth = (
  cols: number,
  containerWidth: number = 1200,
  margin: number = 16
): number => {
  const GRID_COLS = 12;
  const totalMargin = margin * (GRID_COLS - 1); // Margem total entre colunas
  const availableWidth = containerWidth - totalMargin;
  const colWidth = availableWidth / GRID_COLS;
  
  return (colWidth * cols) + (margin * (cols - 1));
};

/**
 * CALCULAR ALTURA EM PIXELS
 * 
 * Converte altura em rows para pixels.
 * 
 * @param rows - Número de rows
 * @param rowHeight - Altura de cada row (padrão: 60px)
 * @param margin - Margem vertical (padrão: 16px)
 * @returns Altura em pixels
 */
export const calculatePixelHeight = (
  rows: number,
  rowHeight: number = 60,
  margin: number = 16
): number => {
  return (rowHeight * rows) + (margin * (rows - 1));
};

/**
 * VALIDAR LAYOUT GRID
 * 
 * Valida se um layout grid está correto:
 * - IDs únicos
 * - Posições válidas (x, y >= 0)
 * - Dimensões válidas (w, h >= 1)
 * - Largura não excede 12 colunas
 * 
 * @param layout - Array de GridCardLayout
 * @returns { valid: boolean, errors: string[] }
 */
export const validateGridLayout = (
  layout: GridCardLayout[]
): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const ids = new Set<string>();
  
  layout.forEach((card, index) => {
    // Validar ID único
    if (ids.has(card.i)) {
      errors.push(`Card ${index}: ID duplicado "${card.i}"`);
    }
    ids.add(card.i);
    
    // Validar posição X
    if (card.x < 0 || card.x >= 12) {
      errors.push(`Card ${card.i}: x inválido (${card.x}), deve estar entre 0-11`);
    }
    
    // Validar posição Y
    if (card.y < 0) {
      errors.push(`Card ${card.i}: y inválido (${card.y}), deve ser >= 0`);
    }
    
    // Validar largura
    if (card.w < 1 || card.w > 12) {
      errors.push(`Card ${card.i}: largura inválida (${card.w}), deve estar entre 1-12`);
    }
    
    // Validar altura
    if (card.h < 1) {
      errors.push(`Card ${card.i}: altura inválida (${card.h}), deve ser >= 1`);
    }
    
    // Validar se não excede largura do grid
    if (card.x + card.w > 12) {
      errors.push(`Card ${card.i}: excede largura do grid (x:${card.x} + w:${card.w} > 12)`);
    }
    
    // Validar minW/maxW
    if (card.minW && card.minW > card.w) {
      errors.push(`Card ${card.i}: minW (${card.minW}) > w (${card.w})`);
    }
    if (card.maxW && card.maxW < card.w) {
      errors.push(`Card ${card.i}: maxW (${card.maxW}) < w (${card.w})`);
    }
    
    // Validar minH/maxH
    if (card.minH && card.minH > card.h) {
      errors.push(`Card ${card.i}: minH (${card.minH}) > h (${card.h})`);
    }
    if (card.maxH && card.maxH < card.h) {
      errors.push(`Card ${card.i}: maxH (${card.maxH}) < h (${card.h})`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * ENCONTRAR PRÓXIMA POSIÇÃO DISPONÍVEL
 * 
 * Encontra a próxima posição livre no grid para adicionar um novo card.
 * Usa compactação vertical (tenta preencher de cima para baixo).
 * 
 * @param layout - Layout atual
 * @param cardWidth - Largura do novo card em colunas
 * @param cardHeight - Altura do novo card em rows
 * @returns { x, y } da próxima posição livre
 */
export const findNextAvailablePosition = (
  layout: GridCardLayout[],
  cardWidth: number = 3,
  cardHeight: number = 2
): { x: number; y: number } => {
  const GRID_COLS = 12;
  
  // Se layout vazio, retornar origem
  if (layout.length === 0) {
    return { x: 0, y: 0 };
  }
  
  // Encontrar a linha mais baixa ocupada
  const maxY = Math.max(...layout.map(card => card.y + card.h));
  
  // Tentar posicionar na primeira linha disponível
  for (let y = 0; y <= maxY + 1; y++) {
    for (let x = 0; x <= GRID_COLS - cardWidth; x++) {
      // Verificar se posição está livre
      const collision = layout.some(card => {
        const cardRight = card.x + card.w;
        const cardBottom = card.y + card.h;
        const newRight = x + cardWidth;
        const newBottom = y + cardHeight;
        
        // Verificar sobreposição
        return !(
          x >= cardRight ||  // novo card à direita
          newRight <= card.x ||  // novo card à esquerda
          y >= cardBottom ||  // novo card abaixo
          newBottom <= card.y  // novo card acima
        );
      });
      
      if (!collision) {
        return { x, y };
      }
    }
  }
  
  // Fallback: adicionar no final
  return { x: 0, y: maxY + 1 };
};
