import { DndContext, DragEndEvent, DragOverlay } from '@dnd-kit/core';
import { Card } from '@/components/ui/card';
import { OrganogramNode } from './OrganogramNode';
import { useOrganogramData } from '@/hooks/useOrganogramData';
import { Loader2 } from 'lucide-react';

export const OrganogramView = () => {
  const {
    organizationTree,
    levelPermissions,
    isLoading,
    movePosition,
    assignUser,
    renamePosition,
    createPosition,
    deletePosition
  } = useOrganogramData();

  console.log('📊 [UI - OrganogramView] ESTADO RECEBIDO DO HOOK:');
  console.log('   ↳ organizationTree:', organizationTree);
  console.log('   ↳ organizationTree type:', typeof organizationTree);
  console.log('   ↳ organizationTree is array:', Array.isArray(organizationTree));
  console.log('   ↳ organizationTree length:', organizationTree?.length);
  console.log('   ↳ isLoading:', isLoading);
  console.log('   ↳ levelPermissions:', levelPermissions);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Moving a position
    if (activeData?.type === 'position' && overData?.type === 'position-drop') {
      const positionId = activeData.positionId as string;
      const newParentId = overData.positionId as string;
      
      if (positionId !== newParentId) {
        movePosition({ positionId, newParentId });
      }
    }

    // Moving a user
    if (activeData?.type === 'user' && overData?.type === 'position-drop') {
      const userId = activeData.userId as string;
      const positionId = overData.positionId as string;
      assignUser({ userId, positionId });
    }
  };

  const getPermissionsForLevel = (levelId: string) => {
    return levelPermissions?.find(lp => lp.level_id === levelId)?.permissions || [];
  };

  // Wrapper functions to match expected signatures
  const handleRename = (positionId: string, newName: string) => {
    renamePosition({ positionId, newName });
  };

  const handleCreate = (levelId: string, positionName: string, parentPositionId: string) => {
    createPosition({ levelId, positionName, parentPositionId });
  };

  const handleDelete = (positionId: string) => {
    deletePosition(positionId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!organizationTree || organizationTree.length === 0) {
    console.log('⚠️ [UI - OrganogramView] MOSTRANDO MENSAGEM DE VAZIO');
    console.log('   ↳ Condição: !organizationTree || organizationTree.length === 0');
    console.log('   ↳ !organizationTree:', !organizationTree);
    console.log('   ↳ organizationTree.length === 0:', organizationTree?.length === 0);
    
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          Nenhuma estrutura organizacional encontrada.
          <br />
          Configure os níveis e posições primeiro.
        </p>
      </Card>
    );
  }

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="space-y-4">
        {organizationTree.map((rootNode) => (
          <OrganogramNode
            key={rootNode.position_id}
            node={rootNode}
            onRename={handleRename}
            onCreate={handleCreate}
            onDelete={handleDelete}
            permissions={getPermissionsForLevel(rootNode.level_id)}
          />
        ))}
      </div>
      <DragOverlay>
        <Card className="p-3 shadow-xl opacity-80">
          <span className="text-sm font-medium">Arrastando...</span>
        </Card>
      </DragOverlay>
    </DndContext>
  );
};
