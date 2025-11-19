import { ReactNode } from 'react';
import GridLayout, { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { cn } from '@/lib/utils';

export interface GridCardLayout extends Layout {
  i: string;        // cardId único
  x: number;        // coluna inicial (0-11)
  y: number;        // linha inicial (0-∞)
  w: number;        // largura em colunas (1-12)
  h: number;        // altura em rows (1-∞)
  minW?: number;    // largura mínima
  minH?: number;    // altura mínima
  maxW?: number;    // largura máxima
  maxH?: number;    // altura máxima
}

interface GridCardContainerProps {
  /**
   * ID único da seção (usado para isolar contexto de grid)
   */
  sectionId: string;

  /**
   * Array de layouts dos cards (posição e dimensões)
   */
  layout: GridCardLayout[];

  /**
   * Callback chamado quando layout é alterado (drag ou resize)
   */
  onLayoutChange: (newLayout: GridCardLayout[]) => void;

  /**
   * Se true, habilita drag & drop e resize
   */
  isEditMode: boolean;

  /**
   * Children devem ser divs com data-grid attribute
   */
  children: ReactNode;

  /**
   * Classes CSS adicionais para o container
   */
  className?: string;

  /**
   * Largura do container em pixels (padrão: 1200)
   */
  width?: number;
}

/**
 * GRID CARD CONTAINER
 * 
 * Container que fornece grid system de 12 colunas para cards dentro de uma seção.
 * Usa React Grid Layout para drag & drop e resize com reflow automático.
 * 
 * CARACTERÍSTICAS:
 * - Grid de 12 colunas
 * - Altura de row: 60px
 * - Drag & drop livre dentro da seção
 * - Resize bidirecional (width + height)
 * - Reflow automático com colisão
 * - Compactação vertical automática
 * 
 * IMPORTANTE:
 * - Apenas funciona quando isEditMode = true
 * - Children devem ter data-grid attribute
 * - Use className ".drag-handle" para controlar onde arrastar
 * 
 * USO:
 * <GridCardContainer
 *   sectionId="dashboard-financial"
 *   layout={[
 *     { i: 'card-1', x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 1 },
 *     { i: 'card-2', x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 1 },
 *   ]}
 *   onLayoutChange={(newLayout) => updateLayout('dashboard-financial', newLayout)}
 *   isEditMode={isEditMode}
 * >
 *   {layout.map((item) => (
 *     <div key={item.i} data-grid={item}>
 *       <Card>...</Card>
 *     </div>
 *   ))}
 * </GridCardContainer>
 */
export const GridCardContainer = ({
  sectionId,
  layout,
  onLayoutChange,
  isEditMode,
  children,
  className,
  width = 1200,
}: GridCardContainerProps) => {
  /**
   * Callback quando layout muda (drag ou resize)
   */
  const handleLayoutChange = (newLayout: Layout[]) => {
    console.log('[GridCardContainer] Layout alterado:', {
      sectionId,
      oldLayout: layout,
      newLayout,
    });
    
    // Converter Layout[] para GridCardLayout[]
    const gridLayout: GridCardLayout[] = newLayout.map((item) => ({
      i: item.i,
      x: item.x,
      y: item.y,
      w: item.w,
      h: item.h,
      minW: item.minW,
      minH: item.minH,
      maxW: item.maxW,
      maxH: item.maxH,
    }));
    
    onLayoutChange(gridLayout);
  };

  return (
    <div className={cn('relative', className)}>
      <GridLayout
        className="layout"
        layout={layout}
        cols={12}              // Grid de 12 colunas
        rowHeight={30}         // Altura de cada row: 30px
        width={width}          // Largura total do container
        isDraggable={isEditMode}
        isResizable={isEditMode}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"  // Apenas elementos com esta classe podem arrastar
        compactType="vertical"           // Compactação automática vertical
        preventCollision={false}         // Permite reflow (empurrar outros cards)
        margin={[16, 16]}               // Margem entre cards: 16px
        containerPadding={[0, 0]}       // Padding do container: 0px
        useCSSTransforms={true}         // Usa CSS transforms (melhor performance)
        autoSize={true}                 // Ajusta altura do container automaticamente
      >
        {children}
      </GridLayout>
    </div>
  );
};
