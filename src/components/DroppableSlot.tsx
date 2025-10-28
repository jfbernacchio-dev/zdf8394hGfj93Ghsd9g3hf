import { useDroppable } from '@dnd-kit/core';
import { CSSProperties } from 'react';

interface DroppableSlotProps {
  id: string;
  date: string;
  time?: string;
  children?: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}

export const DroppableSlot = ({ id, date, time, children, className, style }: DroppableSlotProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { date, time }
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`pointer-events-none ${className} ${isOver ? 'bg-primary/10 ring-2 ring-primary' : ''}`}
      style={style}
    >
      {children}
    </div>
  );
};
