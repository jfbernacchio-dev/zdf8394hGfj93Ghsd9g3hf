import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { GripHorizontal } from 'lucide-react';

interface ResizableSectionProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  isEditMode: boolean;
  defaultHeight?: number;
  tempHeight?: number | null;
  onTempHeightChange?: (id: string, height: number) => void;
}

export const ResizableSection = ({ 
  id, 
  children, 
  className, 
  isEditMode,
  defaultHeight = 400,
  tempHeight,
  onTempHeightChange
}: ResizableSectionProps) => {
  const [savedHeight, setSavedHeight] = useState(defaultHeight);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'top' | 'bottom' | null>(null);

  // Load saved height from localStorage on mount and when exiting edit mode
  useEffect(() => {
    const saved = localStorage.getItem(`section-height-${id}`);
    if (saved) {
      setSavedHeight(parseInt(saved));
    }
  }, [id, isEditMode]); // Reload when isEditMode changes

  // Use tempHeight if in edit mode and available, otherwise use savedHeight
  const currentHeight = isEditMode && tempHeight ? tempHeight : savedHeight;

  const handleMouseDown = (e: React.MouseEvent, direction: 'top' | 'bottom') => {
    if (!isEditMode) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    
    const startY = e.clientY;
    const startHeight = currentHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = moveEvent.clientY - startY;
      
      let newHeight = startHeight;
      
      if (direction === 'bottom') {
        newHeight = Math.max(150, startHeight + deltaY);
      } else { // top
        newHeight = Math.max(150, startHeight - deltaY);
      }
      
      if (onTempHeightChange) {
        onTempHeightChange(id, newHeight);
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
        isEditMode && "border-2 border-dashed border-primary/30 rounded-lg",
        className
      )}
      style={{ 
        minHeight: `${currentHeight}px`,
        height: `${currentHeight}px`
      }}
    >
      {/* Top resize handle */}
      {isEditMode && (
        <div
          className={cn(
            "absolute -top-3 left-1/2 -translate-x-1/2 cursor-ns-resize",
            "bg-primary hover:bg-primary/90 rounded-full p-2 flex items-center justify-center",
            "opacity-0 group-hover:opacity-100 transition-opacity z-20",
            "shadow-lg",
            isResizing && resizeDirection === 'top' && "opacity-100"
          )}
          onMouseDown={(e) => handleMouseDown(e, 'top')}
          title="Redimensionar seção"
        >
          <GripHorizontal className="w-4 h-4 text-primary-foreground" />
        </div>
      )}

      {/* Content */}
      <div className={cn(isEditMode && "overflow-hidden h-full")}>
        {children}
      </div>

      {/* Bottom resize handle */}
      {isEditMode && (
        <div
          className={cn(
            "absolute -bottom-3 left-1/2 -translate-x-1/2 cursor-ns-resize",
            "bg-primary hover:bg-primary/90 rounded-full p-2 flex items-center justify-center",
            "opacity-0 group-hover:opacity-100 transition-opacity z-20",
            "shadow-lg",
            isResizing && resizeDirection === 'bottom' && "opacity-100"
          )}
          onMouseDown={(e) => handleMouseDown(e, 'bottom')}
          title="Redimensionar seção"
        >
          <GripHorizontal className="w-4 h-4 text-primary-foreground" />
        </div>
      )}

      {/* Height indicator (optional, for debugging/UX) */}
      {isEditMode && isResizing && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-md shadow-lg text-sm font-medium z-30">
          {Math.round(currentHeight)}px
        </div>
      )}
    </div>
  );
};
