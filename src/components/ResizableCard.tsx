import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { GripVertical, X } from 'lucide-react';

interface ResizableCardProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  isEditMode: boolean;
  defaultWidth?: number;
  defaultHeight?: number;
}

type ResizeDirection = 'n' | 's' | 'e' | 'w' | 'ne' | 'nw' | 'se' | 'sw';

export const ResizableCard = ({ 
  id, 
  children, 
  className, 
  isEditMode,
  defaultWidth = 280,
  defaultHeight = 160,
}: ResizableCardProps) => {
  const [savedSize, setSavedSize] = useState({ width: defaultWidth, height: defaultHeight, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<ResizeDirection | null>(null);

  // Load saved size from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(`card-size-${id}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setSavedSize({ ...parsed, x: parsed.x || 0, y: parsed.y || 0 });
    }
  }, [id]);

  // Salva no localStorage
  const saveToLocalStorage = (size: { width: number; height: number; x: number; y: number }) => {
    localStorage.setItem(`card-size-${id}`, JSON.stringify(size));
  };

  const handleDragStart = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startPosX = savedSize.x;
    const startPosY = savedSize.y;

    const handleDragMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      const newSize = { 
        ...savedSize,
        x: startPosX + deltaX, 
        y: startPosY + deltaY 
      };
      setSavedSize(newSize);
      // Salva DURANTE o movimento
      saveToLocalStorage(newSize);
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleDragMove);
      document.removeEventListener('mouseup', handleDragEnd);
    };

    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
  };

  const handleMouseDown = (e: React.MouseEvent, direction: ResizeDirection) => {
    if (!isEditMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = savedSize.width;
    const startHeight = savedSize.height;
    const startPosX = savedSize.x;
    const startPosY = savedSize.y;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      let newWidth = startWidth;
      let newHeight = startHeight;
      let newX = startPosX;
      let newY = startPosY;
      
      switch (direction) {
        case 'e': // East (right)
          newWidth = Math.max(150, startWidth + deltaX);
          break;
        case 'w': // West (left)
          newWidth = Math.max(150, startWidth - deltaX);
          newX = startPosX + deltaX;
          if (newWidth === 150) {
            newX = startPosX + startWidth - 150;
          }
          break;
        case 's': // South (bottom)
          newHeight = Math.max(60, startHeight + deltaY);
          break;
        case 'n': // North (top)
          newHeight = Math.max(60, startHeight - deltaY);
          newY = startPosY + deltaY;
          if (newHeight === 60) {
            newY = startPosY + startHeight - 60;
          }
          break;
        case 'se': // Southeast (bottom-right)
          newWidth = Math.max(150, startWidth + deltaX);
          newHeight = Math.max(60, startHeight + deltaY);
          break;
        case 'sw': // Southwest (bottom-left)
          newWidth = Math.max(150, startWidth - deltaX);
          newX = startPosX + deltaX;
          if (newWidth === 150) {
            newX = startPosX + startWidth - 150;
          }
          newHeight = Math.max(60, startHeight + deltaY);
          break;
        case 'ne': // Northeast (top-right)
          newWidth = Math.max(150, startWidth + deltaX);
          newHeight = Math.max(60, startHeight - deltaY);
          newY = startPosY + deltaY;
          if (newHeight === 60) {
            newY = startPosY + startHeight - 60;
          }
          break;
        case 'nw': // Northwest (top-left)
          newWidth = Math.max(150, startWidth - deltaX);
          newX = startPosX + deltaX;
          if (newWidth === 150) {
            newX = startPosX + startWidth - 150;
          }
          newHeight = Math.max(60, startHeight - deltaY);
          newY = startPosY + deltaY;
          if (newHeight === 60) {
            newY = startPosY + startHeight - 60;
          }
          break;
      }
      
      const newSize = { width: newWidth, height: newHeight, x: newX, y: newY };
      setSavedSize(newSize);
      // Salva DURANTE o movimento
      saveToLocalStorage(newSize);
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
        isEditMode && "border-2 border-dashed border-primary/30 rounded-lg"
      )}
      style={{ 
        width: `${savedSize.width}px`,
        height: `${savedSize.height}px`,
        transform: `translate(${savedSize.x}px, ${savedSize.y}px)`,
        position: isEditMode ? 'absolute' : 'relative'
      }}
    >
      {/* Drag handle (top center) */}
      {isEditMode && (
        <div
          className={cn(
            "absolute -top-3 left-1/2 -translate-x-1/2 cursor-move",
            "bg-primary hover:bg-primary/90 rounded-full p-2 flex items-center justify-center",
            "opacity-0 group-hover:opacity-100 transition-opacity z-20",
            "shadow-lg",
            isDragging && "opacity-100"
          )}
          onMouseDown={handleDragStart}
          title="Arrastar card"
        >
          <GripVertical className="w-4 h-4 text-primary-foreground" />
        </div>
      )}

      {/* Content */}
      <Card className={cn("h-full w-full overflow-hidden", className)}>
        {children}
      </Card>

      {/* Resize handles - Corners */}
      {isEditMode && (
        <>
          {/* Top-left */}
          <div
            className={cn(
              "absolute top-0 left-0 w-4 h-4 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize",
              "bg-primary hover:bg-primary/90 rounded-full",
              "opacity-0 group-hover:opacity-100 transition-opacity z-10",
              isResizing && resizeDirection === 'nw' && "opacity-100"
            )}
            onMouseDown={(e) => handleMouseDown(e, 'nw')}
          />
          
          {/* Top-right */}
          <div
            className={cn(
              "absolute top-0 right-0 w-4 h-4 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize",
              "bg-primary hover:bg-primary/90 rounded-full",
              "opacity-0 group-hover:opacity-100 transition-opacity z-10",
              isResizing && resizeDirection === 'ne' && "opacity-100"
            )}
            onMouseDown={(e) => handleMouseDown(e, 'ne')}
          />
          
          {/* Bottom-left */}
          <div
            className={cn(
              "absolute bottom-0 left-0 w-4 h-4 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize",
              "bg-primary hover:bg-primary/90 rounded-full",
              "opacity-0 group-hover:opacity-100 transition-opacity z-10",
              isResizing && resizeDirection === 'sw' && "opacity-100"
            )}
            onMouseDown={(e) => handleMouseDown(e, 'sw')}
          />
          
          {/* Bottom-right */}
          <div
            className={cn(
              "absolute bottom-0 right-0 w-4 h-4 translate-x-1/2 translate-y-1/2 cursor-nwse-resize",
              "bg-primary hover:bg-primary/90 rounded-full",
              "opacity-0 group-hover:opacity-100 transition-opacity z-10",
              isResizing && resizeDirection === 'se' && "opacity-100"
            )}
            onMouseDown={(e) => handleMouseDown(e, 'se')}
          />

          {/* Edges */}
          <div
            className={cn(
              "absolute top-1/2 left-0 w-2 h-16 -translate-y-1/2 -translate-x-1/2 cursor-ew-resize",
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

          <div
            className={cn(
              "absolute top-0 left-1/2 w-16 h-2 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize",
              "bg-primary/60 hover:bg-primary rounded",
              "opacity-0 group-hover:opacity-100 transition-opacity z-10",
              isResizing && resizeDirection === 'n' && "opacity-100"
            )}
            onMouseDown={(e) => handleMouseDown(e, 'n')}
          />
          
          <div
            className={cn(
              "absolute bottom-0 left-1/2 w-16 h-2 -translate-x-1/2 translate-y-1/2 cursor-ns-resize",
              "bg-primary/60 hover:bg-primary rounded",
              "opacity-0 group-hover:opacity-100 transition-opacity z-10",
              isResizing && resizeDirection === 's' && "opacity-100"
            )}
            onMouseDown={(e) => handleMouseDown(e, 's')}
          />
        </>
      )}

      {/* Size indicator */}
      {isEditMode && (isDragging || isResizing) && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-md shadow-lg text-sm font-medium z-30 pointer-events-none">
          {Math.round(savedSize.width)} × {Math.round(savedSize.height)}
        </div>
      )}
    </div>
  );
};
