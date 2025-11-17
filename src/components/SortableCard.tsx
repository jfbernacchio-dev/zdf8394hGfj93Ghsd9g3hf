import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/lib/utils';
import { GripVertical } from 'lucide-react';

interface SortableCardProps {
  id: string;
  children: React.ReactNode;
  isEditMode: boolean;
  disabled?: boolean;
  className?: string;
}

/**
 * SORTABLE CARD
 * 
 * Wrapper para cards que podem ser reordenados via drag & drop.
 * Usado dentro de SortableCardContainer (que fornece contexto DnD).
 * 
 * IMPORTANTE:
 * - Apenas funciona em EDIT MODE
 * - Drag handle visível apenas em edit mode
 * - Não permite drag entre seções diferentes
 * 
 * USO:
 * <SortableCard id={cardId} isEditMode={isEditMode}>
 *   <ResizableCardSimple>...</ResizableCardSimple>
 * </SortableCard>
 */
export const SortableCard = ({
  id,
  children,
  isEditMode,
  disabled = false,
  className,
}: SortableCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({
    id,
    disabled: !isEditMode || disabled,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Manter z-index alto enquanto arrasta
    zIndex: isDragging ? 999 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative',
        isDragging && 'opacity-50 cursor-grabbing',
        isOver && !isDragging && 'ring-2 ring-primary ring-offset-2',
        className
      )}
    >
      {/* Drag Handle - aparece apenas em edit mode */}
      {isEditMode && !disabled && (
        <div
          {...attributes}
          {...listeners}
          className={cn(
            'absolute -left-8 top-1/2 -translate-y-1/2 z-10',
            'w-6 h-12 flex items-center justify-center',
            'bg-muted/80 hover:bg-muted rounded-l border border-r-0 border-border',
            'cursor-grab active:cursor-grabbing',
            'opacity-0 group-hover:opacity-100 hover:opacity-100',
            'transition-opacity duration-200'
          )}
          title="Arrastar para reordenar"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </div>
      )}

      {/* Conteúdo do card */}
      <div className={cn(isEditMode && 'group')}>
        {children}
      </div>

      {/* Indicador de posição durante drag */}
      {isOver && !isDragging && (
        <div className="absolute inset-0 bg-primary/5 border-2 border-dashed border-primary rounded-lg pointer-events-none" />
      )}
    </div>
  );
};
