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
    transition: transition || 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)',
    // Manter z-index alto enquanto arrasta
    zIndex: isDragging ? 999 : 'auto',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative transition-all duration-200',
        isDragging && 'opacity-40 cursor-grabbing scale-105 rotate-2',
        isOver && !isDragging && 'ring-2 ring-primary ring-offset-2 scale-102',
        className
      )}
    >
      {/* Drag Handle - aparece apenas em edit mode */}
      {isEditMode && !disabled && (
        <div
          {...attributes}
          {...listeners}
          className={cn(
            'absolute -left-10 top-1/2 -translate-y-1/2 z-[100]',
            'w-8 h-16 flex items-center justify-center',
            'bg-primary/20 hover:bg-primary/30 active:bg-primary/40 rounded-l-lg border-2 border-r-0 border-primary/40',
            'cursor-grab active:cursor-grabbing',
            'opacity-100', // SEMPRE VISÍVEL em edit mode
            'transition-all duration-200 hover:scale-110 hover:shadow-lg',
            'shadow-md'
          )}
          title="🔄 Arrastar para reordenar"
        >
          <GripVertical className="h-5 w-5 text-primary animate-pulse" />
        </div>
      )}

      {/* Conteúdo do card */}
      <div className={cn(isEditMode && 'group')}>
        {children}
      </div>

      {/* Indicador de posição durante drag */}
      {isOver && !isDragging && (
        <div className="absolute inset-0 bg-primary/10 border-2 border-dashed border-primary rounded-lg pointer-events-none animate-pulse" />
      )}
      
      {/* Shadow durante drag */}
      {isDragging && (
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg pointer-events-none blur-xl" />
      )}
    </div>
  );
};
