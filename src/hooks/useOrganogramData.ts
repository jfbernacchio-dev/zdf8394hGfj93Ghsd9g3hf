import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface OrganizationNode {
  position_id: string;
  position_name: string;
  level_id: string;
  level_name: string;
  level_number: number;
  parent_position_id: string | null;
  user_id: string | null;
  user_name: string | null;
  children?: OrganizationNode[];
}

export interface LevelPermissions {
  level_id: string;
  level_name: string;
  permissions: {
    domain: string;
    access_level: string;
  }[];
}

export const useOrganogramData = () => {
  const queryClient = useQueryClient();

  // Fetch organization tree
  const { data: organizationTree, isLoading } = useQuery({
    queryKey: ['organization-tree'],
    queryFn: async () => {
      // Get all positions with their users
      const { data: positions, error: posError } = await supabase
        .from('organization_positions')
        .select(`
          id,
          position_name,
          level_id,
          parent_position_id,
          organization_levels(level_name, level_number)
        `);

      console.log('🔍 [DIAGNÓSTICO 1] POSITIONS QUERY RESULT:', JSON.stringify(positions, null, 2));
      if (posError) throw posError;

      // Get all user positions
      const { data: userPositions, error: userPosError } = await supabase
        .from('user_positions')
        .select(`
          position_id,
          user_id,
          profiles(full_name)
        `);

      console.log('🔍 [DIAGNÓSTICO 2] USER_POSITIONS QUERY RESULT:', JSON.stringify(userPositions, null, 2));
      if (userPosError) throw userPosError;

      // Build tree structure
      const positionsMap = new Map<string, OrganizationNode>();
      
      positions?.forEach(pos => {
        const userPos = userPositions?.find(up => up.position_id === pos.id);
        positionsMap.set(pos.id, {
          position_id: pos.id,
          position_name: pos.position_name || 'Sem nome',
          level_id: pos.level_id,
          level_name: (pos.organization_levels as any)?.level_name || '',
          level_number: (pos.organization_levels as any)?.level_number || 0,
          parent_position_id: pos.parent_position_id,
          user_id: userPos?.user_id || null,
          user_name: (userPos?.profiles as any)?.full_name || null,
          children: []
        });
      });

      console.log('🔍 [DIAGNÓSTICO 3] POSITIONS_MAP COMPLETO ANTES DO BUILD_TREE:');
      console.log('Total de nós:', positionsMap.size);
      positionsMap.forEach((node, key) => {
        console.log(`Node ${key}:`, {
          position_id: node.position_id,
          position_name: node.position_name,
          parent_position_id: node.parent_position_id,
          user_id: node.user_id,
          user_name: node.user_name,
          level_name: node.level_name,
          children_count: node.children?.length || 0
        });
      });

      // Build hierarchy
      const roots: OrganizationNode[] = [];
      
      console.log('🔍 [DIAGNÓSTICO 4] TRACE DO BUILD_TREE:');
      let nodesWithParent = 0;
      let nodesWithoutParent = 0;
      
      positionsMap.forEach(node => {
        if (node.parent_position_id) {
          nodesWithParent++;
          console.log(`  ↳ Node ${node.position_name} tem parent: ${node.parent_position_id}`);
          const parent = positionsMap.get(node.parent_position_id);
          if (parent) {
            parent.children = parent.children || [];
            parent.children.push(node);
            console.log(`    ✅ Parent encontrado: ${parent.position_name}`);
          } else {
            console.log(`    ❌ Parent NÃO encontrado no map!`);
          }
        } else {
          nodesWithoutParent++;
          console.log(`  ↳ Node ${node.position_name} é RAIZ (parent_position_id: ${node.parent_position_id})`);
          roots.push(node);
        }
      });
      
      console.log('🔍 [DIAGNÓSTICO 5] RESUMO BUILD_TREE:');
      console.log('  Total de nós:', positionsMap.size);
      console.log('  Nós COM parent:', nodesWithParent);
      console.log('  Nós SEM parent (raízes):', nodesWithoutParent);
      console.log('  Roots array final:', JSON.stringify(roots, null, 2));

      console.log('🔍 [DIAGNÓSTICO 6] ORGANIZATION_TREE FINAL (retorno):', JSON.stringify(roots, null, 2));

      return roots;
    }
  });

  // Fetch level permissions
  const { data: levelPermissions } = useQuery({
    queryKey: ['level-permissions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('level_permission_sets')
        .select(`
          level_id,
          domain,
          access_level,
          organization_levels(level_name)
        `);

      if (error) throw error;

      // Group by level
      const grouped = new Map<string, LevelPermissions>();
      data?.forEach(perm => {
        if (!grouped.has(perm.level_id)) {
          grouped.set(perm.level_id, {
            level_id: perm.level_id,
            level_name: (perm.organization_levels as any)?.level_name || '',
            permissions: []
          });
        }
        grouped.get(perm.level_id)?.permissions.push({
          domain: perm.domain,
          access_level: perm.access_level
        });
      });

      return Array.from(grouped.values());
    }
  });

  // Move position
  const movePositionMutation = useMutation({
    mutationFn: async ({ positionId, newParentId }: { positionId: string; newParentId: string | null }) => {
      const { error } = await supabase
        .from('organization_positions')
        .update({ parent_position_id: newParentId })
        .eq('id', positionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-tree'] });
      toast.success('Posição movida com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao mover posição: ' + error.message);
    }
  });

  // Assign user to position
  const assignUserMutation = useMutation({
    mutationFn: async ({ userId, positionId }: { userId: string; positionId: string }) => {
      // First, remove user from old position
      await supabase
        .from('user_positions')
        .delete()
        .eq('user_id', userId);

      // Then assign to new position
      const { error } = await supabase
        .from('user_positions')
        .insert({ user_id: userId, position_id: positionId });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-tree'] });
      toast.success('Usuário atribuído com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao atribuir usuário: ' + error.message);
    }
  });

  // Create position
  const createPositionMutation = useMutation({
    mutationFn: async ({ 
      levelId, 
      positionName, 
      parentPositionId 
    }: { 
      levelId: string; 
      positionName: string; 
      parentPositionId?: string | null;
    }) => {
      const { error } = await supabase
        .from('organization_positions')
        .insert({
          level_id: levelId,
          position_name: positionName,
          parent_position_id: parentPositionId || null
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-tree'] });
      toast.success('Posição criada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao criar posição: ' + error.message);
    }
  });

  // Rename position
  const renamePositionMutation = useMutation({
    mutationFn: async ({ positionId, newName }: { positionId: string; newName: string }) => {
      const { error } = await supabase
        .from('organization_positions')
        .update({ position_name: newName })
        .eq('id', positionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-tree'] });
      toast.success('Posição renomeada com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao renomear posição: ' + error.message);
    }
  });

  // Delete position
  const deletePositionMutation = useMutation({
    mutationFn: async (positionId: string) => {
      const { error } = await supabase
        .from('organization_positions')
        .delete()
        .eq('id', positionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-tree'] });
      toast.success('Posição removida com sucesso');
    },
    onError: (error) => {
      toast.error('Erro ao deletar posição: ' + error.message);
    }
  });

  return {
    organizationTree,
    levelPermissions,
    isLoading,
    movePosition: movePositionMutation.mutate,
    assignUser: assignUserMutation.mutate,
    createPosition: createPositionMutation.mutate,
    renamePosition: renamePositionMutation.mutate,
    deletePosition: deletePositionMutation.mutate
  };
};
