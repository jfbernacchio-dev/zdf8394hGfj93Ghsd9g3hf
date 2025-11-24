/**
 * ============================================================================
 * PATIENT OVERVIEW GRID - FASE C1.3
 * ============================================================================
 * 
 * Grid component específico para a aba "Visão Geral" do PatientDetail.
 * Reaproveita GridCardContainer da Dashboard para fornecer drag & drop + resize.
 * 
 * PROPÓSITO:
 * - Envolver cards da overview em um grid React Grid Layout
 * - Fornecer drag & drop e resize quando em edit mode
 * - Manter layout em memória (persistência virá em fase futura)
 * 
 * IMPORTANTE:
 * - NÃO conhece lógica de paciente (patientId, dados clínicos, etc.)
 * - Apenas recebe cardIds e renderiza com layout grid
 * - Por enquanto, não persiste layout (apenas ordem em memória)
 * 
 * ============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { GridCardContainer, GridCardLayout } from '@/components/GridCardContainer';

interface PatientOverviewGridProps {
  /**
   * Lista já filtrada de IDs de cards visíveis (vem do canSeeOverviewCard)
   */
  cardIds: string[];
  
  /**
   * Função de render para cada card individual
   * Deve retornar o JSX do card (já encapsulado se necessário)
   */
  renderCard: (cardId: string) => React.ReactNode;
  
  /**
   * Callback quando layout muda (drag ou resize)
   * Por enquanto, recebe apenas nova ordem de cardIds
   */
  onLayoutChange?: (newOrder: string[]) => void;
  
  /**
   * Se true, habilita drag & drop e resize
   */
  isEditMode?: boolean;
}

/**
 * DEFAULT GRID LAYOUT FOR PATIENT OVERVIEW CARDS
 * 
 * Define posicionamento padrão no grid de 12 colunas:
 * - Cards pequenos (métricas, resumos): 3-4 cols × 4-6 rows
 * - Cards médios (ações, contato, histórico): 4-6 cols × 6-8 rows
 * - Cards grandes (clínica, info detalhada): 6-12 cols × 8-10 rows
 * 
 * NOTA: Ajuste conforme necessário para fit visual ideal
 */
const DEFAULT_CARD_LAYOUTS: Record<string, GridCardLayout> = {
  // Cards grandes (informações principais)
  'patient-contact-info': { i: 'patient-contact-info', x: 0, y: 0, w: 6, h: 8, minW: 4, minH: 6, maxW: 12 },
  'patient-clinical-info': { i: 'patient-clinical-info', x: 6, y: 0, w: 6, h: 8, minW: 4, minH: 6, maxW: 12 },
  'patient-clinical-complaint': { i: 'patient-clinical-complaint', x: 0, y: 8, w: 6, h: 10, minW: 4, minH: 8, maxW: 12 },
  
  // Cards médios (ações e histórico)
  'patient-next-appointment': { i: 'patient-next-appointment', x: 6, y: 8, w: 3, h: 6, minW: 2, minH: 4, maxW: 6 },
  'quick-actions': { i: 'quick-actions', x: 9, y: 8, w: 3, h: 8, minW: 2, minH: 6, maxW: 6 },
  'patient-history': { i: 'patient-history', x: 0, y: 18, w: 4, h: 8, minW: 3, minH: 6, maxW: 8 },
  'recent-notes': { i: 'recent-notes', x: 4, y: 18, w: 4, h: 8, minW: 3, minH: 6, maxW: 8 },
  
  // Cards financeiros/frequência
  'payment-summary': { i: 'payment-summary', x: 8, y: 18, w: 4, h: 8, minW: 3, minH: 6, maxW: 8 },
  'session-frequency': { i: 'session-frequency', x: 0, y: 26, w: 4, h: 8, minW: 3, minH: 6, maxW: 8 },
};

/**
 * PATIENT OVERVIEW GRID
 * 
 * Wrapper grid para cards da aba "Visão Geral" do PatientDetail.
 * 
 * CARACTERÍSTICAS:
 * - Usa GridCardContainer (React Grid Layout) da Dashboard
 * - Layout padrão definido em DEFAULT_CARD_LAYOUTS
 * - Drag & drop + resize apenas em edit mode
 * - Por enquanto, apenas ordem é atualizada via onLayoutChange
 * 
 * USO:
 * <PatientOverviewGrid
 *   cardIds={filteredOverviewCards}
 *   renderCard={renderOverviewCard}
 *   onLayoutChange={(newOrder) => updateCardOrder(newOrder)}
 *   isEditMode={isEditMode}
 * />
 */
export const PatientOverviewGrid = ({
  cardIds,
  renderCard,
  onLayoutChange,
  isEditMode = false,
}: PatientOverviewGridProps) => {
  // Estado interno: layout grid dos cards
  const [gridLayout, setGridLayout] = useState<GridCardLayout[]>([]);
  
  /**
   * Inicializa layout baseado em cardIds visíveis
   * Usa default layout se disponível, senão gera posicionamento automático
   */
  useEffect(() => {
    const initialLayout: GridCardLayout[] = cardIds.map((cardId, index) => {
      // Se tem layout padrão definido, usa
      if (DEFAULT_CARD_LAYOUTS[cardId]) {
        return DEFAULT_CARD_LAYOUTS[cardId];
      }
      
      // Se não, gera posicionamento automático sequencial
      // Grid de 3 colunas (4 cols cada), 6 rows de altura
      const col = (index % 3) * 4;
      const row = Math.floor(index / 3) * 6;
      
      return {
        i: cardId,
        x: col,
        y: row,
        w: 4,
        h: 6,
        minW: 3,
        minH: 4,
        maxW: 12,
      };
    });
    
    setGridLayout(initialLayout);
  }, [cardIds]);
  
  /**
   * Handler: Layout mudou (drag ou resize)
   * Atualiza estado interno e notifica parent via callback
   */
  const handleLayoutChange = useCallback((newLayout: GridCardLayout[]) => {
    setGridLayout(newLayout);
    
    // Extrai nova ordem de cardIds (ordenado por posição y, depois x)
    const sortedLayout = [...newLayout].sort((a, b) => {
      if (a.y === b.y) return a.x - b.x;
      return a.y - b.y;
    });
    
    const newOrder = sortedLayout.map(item => item.i);
    
    // Notifica parent component (se callback fornecido)
    if (onLayoutChange) {
      onLayoutChange(newOrder);
    }
  }, [onLayoutChange]);
  
  // Não renderizar se ainda não tem layout
  if (gridLayout.length === 0) {
    return null;
  }
  
  return (
    <GridCardContainer
      sectionId="patient-overview"
      layout={gridLayout}
      onLayoutChange={handleLayoutChange}
      isEditMode={isEditMode}
      className="min-h-[600px]"
    >
      {gridLayout.map((cardLayout) => (
        <div key={cardLayout.i} data-grid={cardLayout}>
          {renderCard(cardLayout.i)}
        </div>
      ))}
    </GridCardContainer>
  );
};
