import { useDroppable } from '@dnd-kit/core';

interface DroppableSlotProps {
  id: string;
  date: string;
  time?: string;
  children: React.ReactNode;
  className?: string;
}

export const DroppableSlot = ({ id, date, time, children, className }: DroppableSlotProps) => {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { date, time }
  });

  return (
    <div 
      ref={setNodeRef} 
      className={`${className} ${isOver ? 'bg-primary/10 ring-2 ring-primary' : ''}`}
    >
      {children}
    </div>
  );
};
