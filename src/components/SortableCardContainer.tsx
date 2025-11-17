import { ReactNode } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useState } from 'react';
import { cn } from '@/lib/utils';

interface SortableCardContainerProps {
  /**
   * ID único da seção (usado para isolar contexto de drag & drop)
   */
  sectionId: string;

  /**
   * Array de IDs dos cards na ordem atual
   */
  cardIds: string[];

  /**
   * Callback chamado quando ordem é alterada
   */
  onReorder: (newCardIds: string[]) => void;

  /**
   * Se true, habilita drag & drop
   */
  isEditMode: boolean;

  /**
   * Children devem ser SortableCard components
   */
  children: ReactNode;

  /**
   * Layout strategy: 'vertical' ou 'horizontal'
   */
  strategy?: 'vertical' | 'horizontal';

  /**
   * Classes CSS adicionais para o container
   */
  className?: string;
}

/**
 * SORTABLE CARD CONTAINER
 * 
 * Container que fornece contexto de drag & drop para cards dentro de uma seção.
 * 
 * CARACTERÍSTICAS:
 * - Isolamento por seção: cards só podem ser reordenados dentro da mesma seção
 * - Estratégias: vertical (padrão) ou horizontal
 * - Restrição: não permite drag para fora do container
 * - Overlay: mostra preview do card sendo arrastado
 * 
 * IMPORTANTE:
 * - Apenas funciona quando isEditMode = true
 * - Children devem ser SortableCard components
 * - cardIds deve conter todos os IDs dos cards renderizados
 * 
 * USO:
 * <SortableCardContainer
 *   sectionId="dashboard-financial"
 *   cardIds={['card-1', 'card-2', 'card-3']}
 *   onReorder={(newIds) => updateCardOrder('dashboard-financial', newIds)}
 *   isEditMode={isEditMode}
 * >
 *   {cardIds.map(cardId => (
 *     <SortableCard key={cardId} id={cardId} isEditMode={isEditMode}>
 *       <ResizableCardSimple>...</ResizableCardSimple>
 *     </SortableCard>
 *   ))}
 * </SortableCardContainer>
 */
export const SortableCardContainer = ({
  sectionId,
  cardIds,
  onReorder,
  isEditMode,
  children,
  strategy = 'horizontal',
  className,
}: SortableCardContainerProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  // Configurar sensores de drag
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px de movimento antes de iniciar drag (evita cliques acidentais)
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  /**
   * Callback quando drag inicia
   */
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    console.log('[SortableCardContainer] Drag iniciado:', {
      sectionId,
      cardId: event.active.id,
    });
  };

  /**
   * Callback quando drag termina
   */
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    setActiveId(null);

    // Se não há destino válido, abortar
    if (!over) {
      console.log('[SortableCardContainer] Drag cancelado - sem destino válido');
      return;
    }

    // Se card foi solto na mesma posição, nada a fazer
    if (active.id === over.id) {
      console.log('[SortableCardContainer] Drag cancelado - mesma posição');
      return;
    }

    // Calcular nova ordem
    const oldIndex = cardIds.indexOf(active.id as string);
    const newIndex = cardIds.indexOf(over.id as string);

    if (oldIndex === -1 || newIndex === -1) {
      console.error('[SortableCardContainer] Card não encontrado:', {
        activeId: active.id,
        overId: over.id,
        cardIds,
      });
      return;
    }

    // Criar novo array com ordem atualizada
    const newCardIds = [...cardIds];
    const [movedCard] = newCardIds.splice(oldIndex, 1);
    newCardIds.splice(newIndex, 0, movedCard);

    console.log('[SortableCardContainer] Reordenação:', {
      sectionId,
      from: oldIndex,
      to: newIndex,
      oldOrder: cardIds,
      newOrder: newCardIds,
    });

    // Notificar parent component
    onReorder(newCardIds);
  };

  /**
   * Callback quando drag é cancelado (ESC, por exemplo)
   */
  const handleDragCancel = () => {
    setActiveId(null);
    console.log('[SortableCardContainer] Drag cancelado');
  };

  // Se não está em edit mode, renderizar children sem drag & drop
  if (!isEditMode) {
    return <div className={className}>{children}</div>;
  }

  const sortingStrategy =
    strategy === 'vertical'
      ? verticalListSortingStrategy
      : horizontalListSortingStrategy;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
      id={`dnd-section-${sectionId}`} // ID único para isolar contexto
    >
      <SortableContext items={cardIds} strategy={sortingStrategy}>
        <div className={cn('relative', className)}>
          {children}
        </div>
      </SortableContext>

      {/* DragOverlay - mostra preview do card sendo arrastado */}
      <DragOverlay
        dropAnimation={{
          duration: 200,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
        }}
      >
        {activeId ? (
          <div className="opacity-80 cursor-grabbing shadow-2xl ring-2 ring-primary">
            <div className="bg-card p-4 rounded-lg border border-border">
              <div className="text-sm font-medium text-card-foreground">
                Movendo card...
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ID: {activeId}
              </div>
            </div>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
