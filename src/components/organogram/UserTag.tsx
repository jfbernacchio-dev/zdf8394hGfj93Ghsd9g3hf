import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { User } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UserTagProps {
  userId: string;
  userName: string;
}

export const UserTag = ({ userId, userName }: UserTagProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `user-${userId}`,
    data: { type: 'user', userId }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
    >
      <Badge
        variant="secondary"
        className="cursor-grab active:cursor-grabbing flex items-center gap-1 px-2 py-1 hover:bg-accent/80 transition-colors"
      >
        <User className="h-3 w-3" />
        <span className="text-xs">{userName}</span>
      </Badge>
    </div>
  );
};
