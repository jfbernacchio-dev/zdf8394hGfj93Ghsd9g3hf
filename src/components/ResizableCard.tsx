import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { GripHorizontal } from 'lucide-react';

interface ResizableCardProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  isEditMode: boolean;
  defaultWidth?: number;
  defaultHeight?: number;
  tempSize?: { width: number; height: number } | null;
  onTempSizeChange?: (id: string, size: { width: number; height: number }) => void;
}

export const ResizableCard = ({ 
  id, 
  children, 
  className, 
  isEditMode,
  defaultWidth = 300,
  defaultHeight = 200,
  tempSize,
  onTempSizeChange
}: ResizableCardProps) => {
  const [savedSize, setSavedSize] = useState({ width: defaultWidth, height: defaultHeight });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'both' | 'horizontal' | 'vertical' | null>(null);

  // Load saved size from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`card-size-${id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setSavedSize(parsed);
    }
  }, [id]);

  // Use tempSize if in edit mode and available, otherwise use savedSize
  const currentSize = isEditMode && tempSize ? tempSize : savedSize;

  const handleMouseDown = (e: React.MouseEvent, direction: 'both' | 'horizontal' | 'vertical') => {
    if (!isEditMode) return;
    
    e.preventDefault();
    setIsResizing(true);
    setResizeDirection(direction);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = currentSize.width;
    const startHeight = currentSize.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      const newSize = { 
        width: startWidth,
        height: startHeight
      };
      
      if (direction === 'both' || direction === 'horizontal') {
        newSize.width = Math.max(200, startWidth + deltaX);
      }
      if (direction === 'both' || direction === 'vertical') {
        newSize.height = Math.max(150, startHeight + deltaY);
      }
      
      if (onTempSizeChange) {
        onTempSizeChange(id, newSize);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div 
      className={cn(
        "relative group",
        isResizing && "cursor-move"
      )}
      style={{ 
        width: `${currentSize.width}px`,
        height: `${currentSize.height}px`,
        minWidth: '200px',
        minHeight: '150px'
      }}
    >
      <Card 
        className={cn(
          className,
          "h-full w-full overflow-auto",
          isEditMode && "ring-2 ring-primary/30 ring-offset-2"
        )}
      >
        {children}
      </Card>

      {/* Resize handles */}
      {isEditMode && (
        <>
          {/* Bottom-right corner handle */}
          <div
            className={cn(
              "absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize",
              "bg-primary/80 hover:bg-primary rounded-tl-lg",
              "flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
              isResizing && resizeDirection === 'both' && "opacity-100"
            )}
            onMouseDown={(e) => handleMouseDown(e, 'both')}
          >
            <GripHorizontal className="w-4 h-4 text-primary-foreground rotate-45" />
          </div>

          {/* Right edge handle */}
          <div
            className={cn(
              "absolute top-1/2 right-0 w-2 h-16 -translate-y-1/2 cursor-ew-resize",
              "bg-primary/60 hover:bg-primary rounded-l",
              "opacity-0 group-hover:opacity-100 transition-opacity",
              isResizing && resizeDirection === 'horizontal' && "opacity-100"
            )}
            onMouseDown={(e) => handleMouseDown(e, 'horizontal')}
          />

          {/* Bottom edge handle */}
          <div
            className={cn(
              "absolute bottom-0 left-1/2 h-2 w-16 -translate-x-1/2 cursor-ns-resize",
              "bg-primary/60 hover:bg-primary rounded-t",
              "opacity-0 group-hover:opacity-100 transition-opacity",
              isResizing && resizeDirection === 'vertical' && "opacity-100"
            )}
            onMouseDown={(e) => handleMouseDown(e, 'vertical')}
          />
        </>
      )}
    </div>
  );
};
