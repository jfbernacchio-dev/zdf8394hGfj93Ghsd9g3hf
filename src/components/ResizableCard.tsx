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
  allCardSizes?: Record<string, { width: number; height: number }>;
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export const ResizableCard = ({ 
  id, 
  children, 
  className, 
  isEditMode,
  defaultWidth = 300,
  defaultHeight = 200,
  tempSize,
  onTempSizeChange,
  allCardSizes = {}
}: ResizableCardProps) => {
  const [savedSize, setSavedSize] = useState({ width: defaultWidth, height: defaultHeight });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null);
  const [alignmentGuides, setAlignmentGuides] = useState<{ vertical: number[], horizontal: number[] }>({ 
    vertical: [], 
    horizontal: [] 
  });

  // Load saved size from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`card-size-${id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setSavedSize({ width: parsed.width, height: parsed.height });
    }
  }, [id]);

  // Use tempSize if in edit mode and available, otherwise use savedSize
  const currentSize = isEditMode && tempSize ? tempSize : savedSize;

  const SNAP_THRESHOLD = 8; // pixels

  const checkAlignment = (newWidth: number, newHeight: number) => {
    const guides = { vertical: [] as number[], horizontal: [] as number[] };
    
    // Check against other cards
    Object.entries(allCardSizes).forEach(([otherId, otherSize]) => {
      if (otherId === id) return;
      
      // Check width alignment (vertical line at matching width)
      if (Math.abs(newWidth - otherSize.width) < SNAP_THRESHOLD) {
        guides.vertical.push(otherSize.width);
      }
      
      // Check height alignment (horizontal line at matching height)
      if (Math.abs(newHeight - otherSize.height) < SNAP_THRESHOLD) {
        guides.horizontal.push(otherSize.height);
      }
    });
    
    setAlignmentGuides(guides);
  };

  const handleMouseDown = (e: React.MouseEvent, direction: ResizeDirection) => {
    if (!isEditMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = currentSize.width;
    const startHeight = currentSize.height;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      
      // Handle different resize directions
      // For left/top sides, we resize in the opposite direction
      switch (direction) {
        case 'e': // East (right)
          newWidth = Math.max(200, startWidth + deltaX);
          break;
        case 'w': // West (left) - expand/contract from left
          newWidth = Math.max(200, startWidth - deltaX);
          break;
        case 's': // South (bottom)
          newHeight = Math.max(150, startHeight + deltaY);
          break;
        case 'n': // North (top) - expand/contract from top
          newHeight = Math.max(150, startHeight - deltaY);
          break;
        case 'se': // Southeast (bottom-right)
          newWidth = Math.max(200, startWidth + deltaX);
          newHeight = Math.max(150, startHeight + deltaY);
          break;
        case 'sw': // Southwest (bottom-left)
          newWidth = Math.max(200, startWidth - deltaX);
          newHeight = Math.max(150, startHeight + deltaY);
          break;
        case 'ne': // Northeast (top-right)
          newWidth = Math.max(200, startWidth + deltaX);
          newHeight = Math.max(150, startHeight - deltaY);
          break;
        case 'nw': // Northwest (top-left)
          newWidth = Math.max(200, startWidth - deltaX);
          newHeight = Math.max(150, startHeight - deltaY);
          break;
      }
      
      checkAlignment(newWidth, newHeight);
      
      if (onTempSizeChange) {
        onTempSizeChange(id, { width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeDirection(null);
      setAlignmentGuides({ vertical: [], horizontal: [] });
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

      {/* Vertical Alignment guides (for width matching) */}
      {isEditMode && alignmentGuides.vertical.map((x, i) => (
        <div
          key={`v-guide-${i}`}
          className="fixed top-0 bottom-0 w-0.5 bg-blue-500/70 z-50 pointer-events-none shadow-lg"
          style={{ left: `${x}px` }}
        />
      ))}
      
      {/* Horizontal Alignment guides (for height matching) */}
      {isEditMode && alignmentGuides.horizontal.map((y, i) => (
        <div
          key={`h-guide-${i}`}
          className="fixed left-0 right-0 h-0.5 bg-blue-500/70 z-50 pointer-events-none shadow-lg"
          style={{ top: `${y}px` }}
        />
      ))}

      {/* Resize handles */}
      {isEditMode && (
        <>
          {/* Corner handles */}
          <div
            className={cn(
              "absolute top-0 left-0 w-4 h-4 cursor-nwse-resize",
              "bg-primary/80 hover:bg-primary rounded-br-lg -translate-x-1/2 -translate-y-1/2",
              "opacity-0 group-hover:opacity-100 transition-opacity z-10",
              isResizing && resizeDirection === 'nw' && "opacity-100"
            )}
            onMouseDown={(e) => handleMouseDown(e, 'nw')}
          />
          
          <div
            className={cn(
              "absolute top-0 right-0 w-4 h-4 cursor-nesw-resize",
              "bg-primary/80 hover:bg-primary rounded-bl-lg translate-x-1/2 -translate-y-1/2",
              "opacity-0 group-hover:opacity-100 transition-opacity z-10",
              isResizing && resizeDirection === 'ne' && "opacity-100"
            )}
            onMouseDown={(e) => handleMouseDown(e, 'ne')}
          />
          
          <div
            className={cn(
              "absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize",
              "bg-primary/80 hover:bg-primary rounded-tr-lg -translate-x-1/2 translate-y-1/2",
              "opacity-0 group-hover:opacity-100 transition-opacity z-10",
              isResizing && resizeDirection === 'sw' && "opacity-100"
            )}
            onMouseDown={(e) => handleMouseDown(e, 'sw')}
          />
          
          <div
            className={cn(
              "absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize",
              "bg-primary/80 hover:bg-primary rounded-tl-lg translate-x-1/2 translate-y-1/2",
              "flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10",
              isResizing && resizeDirection === 'se' && "opacity-100"
            )}
            onMouseDown={(e) => handleMouseDown(e, 'se')}
          >
            <GripHorizontal className="w-3 h-3 text-primary-foreground rotate-45" />
          </div>

          {/* Edge handles */}
          <div
            className={cn(
              "absolute top-0 left-1/2 h-2 w-16 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize",
              "bg-primary/60 hover:bg-primary rounded",
              "opacity-0 group-hover:opacity-100 transition-opacity z-10",
              isResizing && resizeDirection === 'n' && "opacity-100"
            )}
            onMouseDown={(e) => handleMouseDown(e, 'n')}
          />
          
          <div
            className={cn(
              "absolute bottom-0 left-1/2 h-2 w-16 -translate-x-1/2 translate-y-1/2 cursor-ns-resize",
              "bg-primary/60 hover:bg-primary rounded",
              "opacity-0 group-hover:opacity-100 transition-opacity z-10",
              isResizing && resizeDirection === 's' && "opacity-100"
            )}
            onMouseDown={(e) => handleMouseDown(e, 's')}
          />
          
          <div
            className={cn(
              "absolute left-0 top-1/2 w-2 h-16 -translate-y-1/2 -translate-x-1/2 cursor-ew-resize",
              "bg-primary/60 hover:bg-primary rounded",
              "opacity-0 group-hover:opacity-100 transition-opacity z-10",
              isResizing && resizeDirection === 'w' && "opacity-100"
            )}
            onMouseDown={(e) => handleMouseDown(e, 'w')}
          />
          
          <div
            className={cn(
              "absolute right-0 top-1/2 w-2 h-16 -translate-y-1/2 translate-x-1/2 cursor-ew-resize",
              "bg-primary/60 hover:bg-primary rounded",
              "opacity-0 group-hover:opacity-100 transition-opacity z-10",
              isResizing && resizeDirection === 'e' && "opacity-100"
            )}
            onMouseDown={(e) => handleMouseDown(e, 'e')}
          />
        </>
      )}
    </div>
  );
};
