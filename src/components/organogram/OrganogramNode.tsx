import { useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ChevronDown, ChevronRight, Edit2, Plus, Trash2, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { UserTag } from './UserTag';
import { PermissionsPreview } from './PermissionsPreview';
import { OrganizationNode } from '@/hooks/useOrganogramData';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface OrganogramNodeProps {
  node: OrganizationNode;
  onRename: (positionId: string, newName: string) => void;
  onCreate: (levelId: string, name: string, parentId: string) => void;
  onDelete: (positionId: string) => void;
  permissions?: { domain: string; access_level: string }[];
  depth?: number;
}

export const OrganogramNode = ({
  node,
  onRename,
  onCreate,
  onDelete,
  permissions = [],
  depth = 0
}: OrganogramNodeProps) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showPermissions, setShowPermissions] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newName, setNewName] = useState('');

  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: `position-${node.position_id}`,
    data: { type: 'position', positionId: node.position_id }
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-position-${node.position_id}`,
    data: { type: 'position-drop', positionId: node.position_id }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  };

  const handleRename = () => {
    if (newName.trim()) {
      onRename(node.position_id, newName.trim());
      setShowRenameDialog(false);
      setNewName('');
    }
  };

  const handleCreate = () => {
    if (newName.trim()) {
      onCreate(node.level_id, newName.trim(), node.position_id);
      setShowCreateDialog(false);
      setNewName('');
    }
  };

  const handleDelete = () => {
    if (confirm(`Tem certeza que deseja deletar a posição "${node.position_name}"?`)) {
      onDelete(node.position_id);
    }
  };

  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="relative" style={{ marginLeft: depth > 0 ? '2rem' : '0' }}>
      {/* Connection line */}
      {depth > 0 && (
        <div className="absolute left-0 top-4 w-8 h-px bg-border" />
      )}

      <div
        ref={setDropRef}
        className={`transition-all ${isOver ? 'ring-2 ring-primary' : ''}`}
      >
        <Card
          ref={setDragRef}
          style={style}
          className={`mb-3 transition-all hover:shadow-md ${isDragging ? 'shadow-xl' : ''}`}
          onMouseEnter={() => setShowPermissions(true)}
          onMouseLeave={() => setShowPermissions(false)}
        >
          <div className="p-3 flex items-center gap-2">
            {/* Drag handle */}
            <div {...listeners} {...attributes} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>

            {/* Expand/collapse button */}
            {hasChildren && (
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* Node info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm truncate">{node.position_name}</span>
                <span className="text-xs text-muted-foreground">
                  Nível {node.level_number} • {node.level_name}
                </span>
              </div>
              {node.user_id && node.user_name && (
                <div className="mt-1">
                  <UserTag userId={node.user_id} userName={node.user_name} />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowRenameDialog(true)}
              >
                <Edit2 className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => setShowCreateDialog(true)}
              >
                <Plus className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                onClick={handleDelete}
                disabled={hasChildren || !!node.user_id}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>

          {/* Permissions preview */}
          {showPermissions && permissions.length > 0 && (
            <PermissionsPreview levelName={node.level_name} permissions={permissions} />
          )}
        </Card>
      </div>

      {/* Children */}
      {isExpanded && hasChildren && (
        <div className="ml-4 border-l-2 border-border pl-2">
          {node.children!.map((child) => (
            <OrganogramNode
              key={child.position_id}
              node={child}
              onRename={onRename}
              onCreate={onCreate}
              onDelete={onDelete}
              permissions={permissions}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renomear Posição</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rename">Novo nome</Label>
              <Input
                id="rename"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder={node.position_name}
                onKeyDown={(e) => e.key === 'Enter' && handleRename()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleRename}>Renomear</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Posição Subordinada</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="create">Nome da nova posição</Label>
              <Input
                id="create"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Terapeuta Junior"
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreate}>Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
