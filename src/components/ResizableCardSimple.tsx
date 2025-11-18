import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { GripVertical, Sparkles } from 'lucide-react';

interface ResizableCardSimpleProps {
  id: string;
  sectionId: string;
  children: React.ReactNode;
  className?: string;
  isEditMode: boolean;
  defaultWidth?: number;
  minWidth?: number;
  maxWidth?: number;
  tempWidth?: number | null;
  onTempWidthChange?: (cardId: string, width: number) => void;
  isCustomized?: boolean;
}

/**
 * RESIZABLE CARD SIMPLE
 * 
 * Versão simplificada do ResizableCard para uso em seções sequenciais.
 * 
 * DIFERENÇAS EM RELAÇÃO AO ResizableCard ORIGINAL:
 * - Apenas resize HORIZONTAL (largura)
 * - SEM drag & drop de posição (x, y)
 * - SEM alignment guides
 * - Comportamento em GRID RESPONSIVO ao invés de absolute positioning
 * 
 * USO:
 * - Dentro de seções que usam grid/flex layout
 * - Cards mantêm ordem sequencial definida por array
 * - Largura é relativa ao container (não pixels absolutos)
 */
export const ResizableCardSimple = ({ 
  id, 
  sectionId,
  children, 
  className, 
  isEditMode,
  defaultWidth = 400,
  minWidth = 280,
  maxWidth = 800,
  tempWidth,
  onTempWidthChange,
  isCustomized = false,
}: ResizableCardSimpleProps) => {
  const [savedWidth, setSavedWidth] = useState(defaultWidth);
  const [isResizing, setIsResizing] = useState(false);

  // Load saved width from localStorage on mount
  useEffect(() => {
    const storageKey = `card-width-${sectionId}-${id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsedWidth = parseInt(saved, 10);
      if (!isNaN(parsedWidth)) {
        setSavedWidth(parsedWidth);
      }
    }
  }, [id, sectionId]);

  // Use tempWidth if in edit mode and available, otherwise use savedWidth
  const currentWidth = isEditMode && tempWidth !== null && tempWidth !== undefined ? tempWidth : savedWidth;

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    
    const startX = e.clientX;
    const startWidth = currentWidth;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const newWidth = Math.max(minWidth, Math.min(maxWidth, startWidth + deltaX));
      
      if (onTempWidthChange) {
        onTempWidthChange(id, newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Save to localStorage when exiting edit mode
  useEffect(() => {
    if (!isEditMode && tempWidth !== null && tempWidth !== undefined && tempWidth !== savedWidth) {
      const storageKey = `card-width-${sectionId}-${id}`;
      localStorage.setItem(storageKey, tempWidth.toString());
      setSavedWidth(tempWidth);
    }
  }, [isEditMode, tempWidth, savedWidth, id, sectionId]);

  return (
    <div
      className={cn(
        "relative transition-all duration-200 group",
        isResizing && "z-50 scale-[1.02]",
        isEditMode && "ml-12", // Margem esquerda quando em edit mode para dar espaço ao drag handle
        className
      )}
      style={{ 
        width: `${currentWidth}px`,
        flexShrink: 0,
      }}
    >
      <Card 
        className={cn(
          "h-full overflow-hidden transition-all duration-300",
          isEditMode && "ring-2 ring-primary/20 hover:ring-primary/40 hover:shadow-lg",
          isResizing && "ring-2 ring-primary shadow-xl scale-100"
        )}
      >
        {/* Customization badge */}
        {isCustomized && !isEditMode && (
          <Badge 
            variant="secondary" 
            className="absolute top-2 right-2 z-10 text-xs flex items-center gap-1 animate-fade-in"
          >
            <Sparkles className="h-3 w-3" />
            Personalizado
          </Badge>
        )}
        {children}
      </Card>

      {/* Resize Handle - Right Edge */}
      {isEditMode && (
        <div
          className={cn(
            'absolute top-0 right-0 bottom-0 w-2 cursor-ew-resize z-10',
            'hover:bg-primary/30 active:bg-primary/50',
            'transition-all duration-200',
            'opacity-0 group-hover:opacity-100',
            isResizing && 'bg-primary/50 opacity-100'
          )}
          onMouseDown={handleMouseDown}
          title="Arrastar para redimensionar"
        >
          {/* Visual indicator */}
          <div className={cn(
            "absolute top-1/2 right-0 -translate-y-1/2 w-1 h-12 bg-primary rounded-l transition-all duration-200",
            isResizing && "h-full animate-pulse"
          )} />
          {/* Grip icon */}
          <GripVertical className={cn(
            "absolute top-1/2 right-0.5 -translate-y-1/2 h-4 w-4 text-primary",
            "transition-transform duration-200",
            isResizing && "scale-125"
          )} />
        </div>
      )}

      {/* Width Indicator (shown during resize) */}
      {isEditMode && isResizing && (
        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-medium whitespace-nowrap z-50">
          {currentWidth}px
        </div>
      )}
    </div>
  );
};
