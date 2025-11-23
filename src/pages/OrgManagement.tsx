import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Settings, Users, Trash2, TriangleAlert, User } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import Layout from '@/components/Layout';
import { LevelPermissionModal } from '@/components/LevelPermissionModal';
import { getUserRoleLabelForUI } from '@/lib/professionalRoles';

/**
 * ============================================================================
 * FASE 6C-3: Conectar usuários reais aos níveis
 * ============================================================================
 * 
 * Esta página agora busca organization_levels e user_positions do Supabase.
 * Usuários são renderizados dentro de cada nível.
 * Drag & drop ainda não funcional (virá na FASE 6C-4).
 */

interface UserInLevel {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  role?: string;
  professional_role_id?: string | null;
  professional_roles?: {
    id: string;
    slug: string;
    label: string;
    is_clinical: boolean;
  } | null;
}

// Cores automáticas por índice - tons pastel suaves com border-top para hierarquia
const LEVEL_COLORS = [
  'bg-purple-50/80 border-purple-200/60 hover:border-purple-300/80 border-t-4 border-t-purple-300/40',
  'bg-blue-50/80 border-blue-200/60 hover:border-blue-300/80 border-t-4 border-t-blue-300/40',
  'bg-green-50/80 border-green-200/60 hover:border-green-300/80 border-t-4 border-t-green-300/40',
  'bg-amber-50/80 border-amber-200/60 hover:border-amber-300/80 border-t-4 border-t-amber-300/40',
  'bg-orange-50/80 border-orange-200/60 hover:border-orange-300/80 border-t-4 border-t-orange-300/40',
  'bg-pink-50/80 border-pink-200/60 hover:border-pink-300/80 border-t-4 border-t-pink-300/40',
  'bg-indigo-50/80 border-indigo-200/60 hover:border-indigo-300/80 border-t-4 border-t-indigo-300/40',
  'bg-rose-50/80 border-rose-200/60 hover:border-rose-300/80 border-t-4 border-t-rose-300/40',
];

const ROLE_LABELS: Record<string, string> = {
  psychologist: 'Psicólogo',
  assistant: 'Secretária',
  accountant: 'Contador',
  admin: 'Admin',
};

const ROLE_COLORS: Record<string, string> = {
  psychologist: 'bg-blue-50/80 text-blue-700 border-blue-200/60',
  assistant: 'bg-purple-50/80 text-purple-700 border-purple-200/60',
  accountant: 'bg-amber-50/80 text-amber-700 border-amber-200/60',
  admin: 'bg-rose-50/80 text-rose-700 border-rose-200/60',
};

export default function OrgManagement() {
  const navigate = useNavigate();
  const { user, isAdmin, roleGlobal, organizationId } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  console.log('[ORG] organizationId:', organizationId);
  console.log('[ORG] user.id:', user?.id);

  // Estado do modal de permissões
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<{
    id: string;
    name: string;
    number: number;
  } | null>(null);

  // FASE 6D-1: Estado local para drag & drop (apenas em memória)
  const [localUsersByLevel, setLocalUsersByLevel] = useState<Map<string, UserInLevel[]>>(new Map());
  const [draggingUser, setDraggingUser] = useState<{
    fromLevelId: string;
    user: UserInLevel;
  } | null>(null);
  
  // FASE 6E-2: Estado para controlar hover durante drag
  const [dragOverLevelId, setDragOverLevelId] = useState<string | null>(null);

  // FASE 7.4: Query para buscar níveis reais do banco com retry automático
  const { data: levels, isLoading: isLoadingLevels, error: errorLevels } = useQuery({
    queryKey: ['organization-levels', organizationId],
    queryFn: async () => {
      if (!organizationId) {
        console.log('[ORG] Sem organizationId, retornando vazio');
        return [];
      }
      
      console.log('[ORG] Carregando níveis para organizationId:', organizationId);
      
      const { data, error } = await supabase
        .from('organization_levels')
        .select('*')
        .eq('organization_id', organizationId)
        .order('level_number', { ascending: true });

        if (error) {
          console.debug('[OrgManagement] Erro ao carregar níveis:', error);
          console.log('[ORG_MGMT] ❌ Erro ao buscar níveis', {
            error,
            organizationId,
          });
          throw error;
        }
      
      // FASE 7.6: Sanitização de dados antes de retornar
      const safeLevels = (data || []).filter(level => {
        const isValid = level.id && 
                       typeof level.level_number === 'number' && 
                       level.level_name && 
                       level.organization_id;
        
        if (!isValid) {
          console.debug('[OrgManagement] Nível com dados inconsistentes filtrado:', level);
        }
        
        return isValid;
      });
      
      console.debug('[OrgManagement] Níveis carregados:', safeLevels.length);
      console.log('[ORG_MGMT] 🔎 Dados de níveis carregados', {
        levelsCount: safeLevels?.length || 0,
        organizationId,
        error: null,
      });
      return safeLevels;
    },
    enabled: !!organizationId,
    retry: 3,
    retryDelay: 500,
  });

  // FASE 7.4: Query para buscar usuários com suas posições com retry automático
  const { data: userPositions, isLoading: isLoadingUsers, error: errorUsers } = useQuery({
    queryKey: ['user-positions', organizationId],
    queryFn: async () => {
      if (!organizationId) {
        console.log('[ORG] Sem organizationId para carregar posições');
        return [];
      }

      try {
        console.log('[ORG] Carregando posições para organizationId:', organizationId);
        
        // Primeiro buscar todos os níveis da organização
        const { data: orgLevels } = await supabase
          .from('organization_levels')
          .select('id')
          .eq('organization_id', organizationId);

        if (!orgLevels || orgLevels.length === 0) {
          console.debug('[OrgManagement] Nenhum nível encontrado para carregar usuários');
          return [];
        }

        const levelIds = orgLevels.map(l => l.id);

        // Buscar positions desses níveis
        console.log('[ORG_MGMT] 🔎 Carregando positions para level_ids:', levelIds);
        const { data: positions, error: posError } = await supabase
          .from('organization_positions')
          .select('id, level_id')
          .in('level_id', levelIds);

        console.log('[ORG_MGMT] 🔎 Dados de posições carregados', {
          positionsCount: positions?.length,
          errorPositions: posError,
        });
        
        if (posError) {
          console.error('[ORG_MGMT] ❌ Erro ao buscar positions:', {
            message: posError.message,
            details: posError.details,
            hint: posError.hint,
            code: posError.code
          });
        }

        if (!positions || positions.length === 0) {
          console.debug('[OrgManagement] Nenhuma posição encontrada');
          return [];
        }

        const positionIds = positions.map(p => p.id);

        // Buscar user_positions sem join com profiles
        const { data, error } = await supabase
          .from('user_positions')
          .select('id, user_id, position_id')
          .in('position_id', positionIds);

        if (error) {
          console.debug('[OrgManagement] Erro ao carregar user_positions:', error);
          console.log('[ORG_MGMT] ❌ Erro ao buscar user_positions', {
            error,
            organizationId,
          });
          toast({
            title: 'Erro ao carregar membros',
            description: 'Erro ao carregar membros da organização. Tente recarregar a página.',
            variant: 'destructive',
          });
          throw error;
        }

        if (!data || data.length === 0) {
          console.debug('[OrgManagement] Nenhum user_position encontrado');
          return [];
        }

        // Buscar profiles dos usuários
        const userIds = data.map(up => up.user_id);
        
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, professional_role_id, professional_roles(*)')
          .in('id', userIds);

        if (profilesError) {
          console.debug('[OrgManagement] Erro ao carregar profiles:', profilesError);
          toast({
            title: 'Erro ao carregar perfis',
            description: 'Erro ao carregar membros da organização. Tente recarregar a página.',
            variant: 'destructive',
          });
          throw profilesError;
        }

        // Criar mapa de profiles
        const profilesMap = new Map<string, any>();
        profilesData?.forEach(p => {
          profilesMap.set(p.id, {
            full_name: p.full_name,
            professional_role_id: p.professional_role_id,
            professional_roles: p.professional_roles,
          });
        });

        // Buscar roles dos usuários
        const { data: rolesData } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        // Criar mapa de roles
        const rolesMap = new Map<string, string>();
        rolesData?.forEach(r => rolesMap.set(r.user_id, r.role));

        // FASE 7.6 & 7.7: Enriquecer e sanitizar dados
        const enrichedData = data
          ?.map(up => {
            const position = positions.find(p => p.id === up.position_id);
            
            // FASE 7.7: Filtrar user_positions órfãos (positions que apontam para levels inexistentes)
            if (!position || !position.level_id) {
              console.debug('[OrgManagement] user_position órfão detectado:', up.id);
              return null;
            }
            
            // Verificar se o level_id existe nos níveis válidos
            if (!levelIds.includes(position.level_id)) {
              console.debug('[OrgManagement] position aponta para level inexistente:', position);
              return null;
            }
            
            const fullName = profilesMap.get(up.user_id)?.full_name || 'Sem nome';

            return {
              ...up,
              level_id: position.level_id,
              role: rolesMap.get(up.user_id),
              full_name: fullName,
              professional_role_id: profilesMap.get(up.user_id)?.professional_role_id,
              professional_roles: profilesMap.get(up.user_id)?.professional_roles,
            };
          })
          .filter((item): item is NonNullable<typeof item> => item !== null); // Remover nulls

        console.debug('[OrgManagement] Usuários carregados:', enrichedData?.length || 0);
        console.log('[ORG_MGMT] 🔎 Dados de posições e usuários carregados', {
          positionsCount: positions?.length || 0,
          userPositionsCount: enrichedData?.length || 0,
          organizationId,
          errorPositions: null,
          errorUserPositions: null,
        });
        return enrichedData || [];
      } catch (error) {
        console.debug('[OrgManagement] Erro geral ao carregar usuários:', error);
        throw error;
      }
    },
    enabled: !!organizationId,
    retry: 3,
    retryDelay: 500,
  });

  // Agrupar usuários por level_id
  const usersByLevel = useMemo(() => {
    const map = new Map<string, UserInLevel[]>();
    
    if (!userPositions) return map;

    userPositions.forEach((position: any) => {
      const levelId = position.level_id;
      const fullName = position.full_name || 'Sem nome';
      const role = position.role;
      
      if (!levelId) return;

      const userInfo: UserInLevel = {
        id: position.id,
        user_id: position.user_id,
        full_name: fullName,
        avatar_url: undefined,
        role: role,
        professional_role_id: position.professional_role_id,
        professional_roles: position.professional_roles,
      };

      const existing = map.get(levelId) || [];
      map.set(levelId, [...existing, userInfo]);
    });

    return map;
  }, [userPositions]);

  // FASE 6D-1: Inicializar estado local quando usersByLevel mudar
  useEffect(() => {
    if (!usersByLevel) return;
    
    // Criar cópia independente do mapa
    const clone = new Map<string, UserInLevel[]>();
    usersByLevel.forEach((users, levelId) => {
      clone.set(levelId, [...users]);
    });
    setLocalUsersByLevel(clone);
  }, [usersByLevel]);

  // Total de membros (agora usa localUsersByLevel)
  const totalMembers = useMemo(() => {
    let count = 0;
    localUsersByLevel.forEach(users => count += users.length);
    return count;
  }, [localUsersByLevel]);

  const isLoading = isLoadingLevels || isLoadingUsers;

  // FASE 7.2 & 7.8: Mutation para persistir movimento de usuários entre níveis com fail-safe e logs
  const updateUserPositionMutation = useMutation({
    mutationFn: async ({ 
      userPositionId, 
      destinationLevelId,
      rollbackData 
    }: { 
      userPositionId: string; 
      destinationLevelId: string;
      rollbackData: { fromLevelId: string; toLevelId: string };
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      console.debug('[OrgManagement] Iniciando movimento de usuário:', { userPositionId, destinationLevelId });

      try {
        // 1. Buscar ou criar position para o nível de destino
        let { data: existingPosition, error: fetchError } = await supabase
          .from('organization_positions')
          .select('id')
          .eq('level_id', destinationLevelId)
          .limit(1)
          .maybeSingle();

        if (fetchError) throw fetchError;

        let targetPositionId: string;

        if (!existingPosition) {
          // Criar nova posição automaticamente
          const { data: newPosition, error: insertError } = await supabase
            .from('organization_positions')
            .insert({
              level_id: destinationLevelId,
              position_name: 'Posição automática',
              parent_position_id: null,
            })
            .select('id')
            .single();

          if (insertError) throw insertError;
          targetPositionId = newPosition.id;
          console.debug('[OrgManagement] Nova posição criada:', targetPositionId);
        } else {
          targetPositionId = existingPosition.id;
        }

        // 2. Atualizar user_positions
        const { error: updateError } = await supabase
          .from('user_positions')
          .update({ position_id: targetPositionId })
          .eq('id', userPositionId);

        if (updateError) throw updateError;

        console.debug('[OrgManagement] Usuário movido com sucesso:', userPositionId);
        return { success: true, rollbackData };
      } catch (error) {
        console.debug('[OrgManagement] Erro durante movimento, preparando rollback:', error);
        throw error;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organization-levels'] });
      queryClient.invalidateQueries({ queryKey: ['user-positions'] });
      
      // FASE 6D-4: Limpar estado local para forçar reconstrução com dados reais do banco
      setLocalUsersByLevel(new Map());
      
      console.debug('[OrgManagement] Movimento persistido com sucesso');
      
      toast({
        title: 'Movido com sucesso!',
        description: 'O membro foi movido para o novo nível.',
      });
    },
    onError: (error: any, variables) => {
      console.debug('[OrgManagement] Erro ao mover usuário, executando rollback:', error);
      
      // FASE 7.2: Fail-safe - Rollback do estado local
      const { rollbackData } = variables;
      if (rollbackData && draggingUser) {
        const clone = new Map(localUsersByLevel);
        const fromList = [...(clone.get(rollbackData.fromLevelId) ?? [])];
        const toList = [...(clone.get(rollbackData.toLevelId) ?? [])];
        
        // Remover do destino e devolver à origem
        const index = toList.findIndex((u) => u.id === draggingUser.user.id);
        if (index !== -1) {
          toList.splice(index, 1);
          fromList.push(draggingUser.user);
          
          clone.set(rollbackData.fromLevelId, fromList);
          clone.set(rollbackData.toLevelId, toList);
          
          setLocalUsersByLevel(clone);
          console.debug('[OrgManagement] Rollback executado com sucesso');
        }
      }
      
      toast({
        title: 'Erro ao mover usuário',
        description: error?.message || 'Não foi possível mover o membro. O estado foi restaurado.',
        variant: 'destructive',
      });
    },
  });

  // FASE 6E-2: Função auxiliar para verificar se o drop seria válido (apenas para feedback visual)
  const isValidDropTarget = (targetLevelId: string): boolean => {
    if (!draggingUser || !levels) return false;
    
    const { fromLevelId } = draggingUser;
    
    // Mesmo nível = inválido
    if (fromLevelId === targetLevelId) return false;
    
    // Subordinados não podem mover ninguém
    const isSubordinate = roleGlobal === 'assistant' || roleGlobal === 'accountant';
    if (isSubordinate) return false;
    
    // Admin pode mover para qualquer lugar
    if (isAdmin) return true;
    
    // Psicólogo: só pode mover para níveis abaixo
    const isPsychologist = roleGlobal === 'psychologist';
    if (isPsychologist) {
      const sourceLevelInfo = levels.find(l => l.id === fromLevelId);
      const targetLevelInfo = levels.find(l => l.id === targetLevelId);
      
      if (!sourceLevelInfo || !targetLevelInfo) return false;
      
      // Buscar nível do psicólogo logado
      let userLevelNumber = 1;
      for (const [levelId, users] of usersByLevel.entries()) {
        const foundUser = users.find(u => u.user_id === user?.id);
        if (foundUser) {
          const levelInfo = levels.find(l => l.id === levelId);
          if (levelInfo) {
            userLevelNumber = levelInfo.level_number;
            break;
          }
        }
      }
      
      // Só pode mover para níveis com número maior (abaixo)
      if (targetLevelInfo.level_number <= userLevelNumber) return false;
      
      // Não pode mover pessoas de níveis acima dele
      if (sourceLevelInfo.level_number < userLevelNumber) return false;
      
      return true;
    }
    
    return false;
  };

  // FASE 7.1 & 7.5: Handlers para drag & drop com proteção contra race conditions e guards estritos
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    fromLevelId: string,
    user: UserInLevel
  ) => {
    // FASE 7.1: Proteção contra race condition - não permitir drag se há mutation pendente
    if (updateUserPositionMutation.isPending || deleteLevelMutation.isPending || addLevelMutation.isPending) {
      e.preventDefault();
      console.debug('[OrgManagement] Drag bloqueado: mutation pendente');
      return;
    }
    
    // FASE 7.5: Guard estrito de roles
    const isPsychologist = roleGlobal === 'psychologist';
    const isSubordinate = roleGlobal === 'assistant' || roleGlobal === 'accountant';

    // Assistente/Contador não podem mover ninguém
    if (isSubordinate) {
      e.preventDefault();
      console.debug('[OrgManagement] Drag negado: papel subordinado');
      toast({
        title: 'Permissão negada',
        description: 'Seu papel não permite alterar a organização.',
        variant: 'destructive',
      });
      return;
    }

    // Admin e Psicólogo podem iniciar o drag
    if (!isAdmin && !isPsychologist) {
      e.preventDefault();
      console.debug('[OrgManagement] Drag negado: sem permissão');
      toast({
        title: 'Permissão negada',
        description: 'Você não tem permissão para reorganizar o organograma.',
        variant: 'destructive',
      });
      return;
    }

    console.debug('[OrgManagement] Drag iniciado:', { fromLevelId, userId: user.id });
    setDraggingUser({ fromLevelId, user });
  };

  // FASE 7.9: Proteção contra drag outside bounds
  const handleDragEnd = () => {
    console.debug('[OrgManagement] Drag finalizado');
    setDraggingUser(null);
    setDragOverLevelId(null); // FASE 6E-2: Limpar hover
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    targetLevelId: string
  ) => {
    const isPsychologist = roleGlobal === 'psychologist';
    
    // Admin e Psicólogo podem fazer drop
    if (!isAdmin && !isPsychologist) return;
    
    e.preventDefault(); // Necessário para permitir drop
    
    // FASE 6E-2: Atualizar visual do hover
    setDragOverLevelId(targetLevelId);
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetLevelId: string
  ) => {
    e.preventDefault();
    
    // FASE 7.1: Proteção contra race condition
    if (updateUserPositionMutation.isPending) {
      console.debug('[OrgManagement] Drop bloqueado: mutation já em andamento');
      return;
    }
    
    if (!draggingUser || !localUsersByLevel || !levels) {
      console.debug('[OrgManagement] Drop ignorado: dados insuficientes');
      return;
    }

    const { fromLevelId, user } = draggingUser;

    // FASE 6D-2: Validações de regras de negócio
    
    // Regra estrutural: não pode mover para o mesmo nível
    if (fromLevelId === targetLevelId) {
      console.debug('[OrgManagement] Drop ignorado: mesmo nível');
      setDraggingUser(null);
      return;
    }

    // FASE 7.5: Determinar papéis com guard estrito
    const isPsychologist = roleGlobal === 'psychologist';
    const isSubordinate = roleGlobal === 'assistant' || roleGlobal === 'accountant';

    // REGRA 1: Assistente/Contador não podem mover ninguém (guard redundante)
    if (isSubordinate) {
      console.debug('[OrgManagement] Drop negado: papel subordinado');
      toast({
        title: 'Permissão negada',
        description: 'Seu papel não permite alterar a organização.',
        variant: 'destructive',
      });
      setDraggingUser(null);
      return;
    }
    
    // Guard adicional: verificar se tem permissão
    if (!isAdmin && !isPsychologist) {
      console.debug('[OrgManagement] Drop negado: sem permissão');
      setDraggingUser(null);
      return;
    }

    // FASE 7.6: Buscar informações dos níveis com validação
    const sourceLevelInfo = levels.find(l => l.id === fromLevelId);
    const targetLevelInfo = levels.find(l => l.id === targetLevelId);

    if (!sourceLevelInfo || !targetLevelInfo) {
      console.debug('[OrgManagement] Drop falhou: níveis não encontrados');
      toast({
        title: 'Erro',
        description: 'Não foi possível identificar os níveis de origem e destino.',
        variant: 'destructive',
      });
      setDraggingUser(null);
      return;
    }

    const sourceLevelNumber = sourceLevelInfo.level_number;
    const targetLevelNumber = targetLevelInfo.level_number;

    // REGRA 2: Psicólogo só pode mover para níveis abaixo do seu
    if (isPsychologist) {
      // Buscar o nível do psicólogo logado
      let userLevelNumber = 1; // Default
      
      for (const [levelId, users] of usersByLevel.entries()) {
        const foundUser = users.find(u => u.user_id === user?.id);
        if (foundUser) {
          const levelInfo = levels.find(l => l.id === levelId);
          if (levelInfo) {
            userLevelNumber = levelInfo.level_number;
            break;
          }
        }
      }

      // Psicólogo só pode mover para níveis com número MAIOR (abaixo na hierarquia)
      if (targetLevelNumber <= userLevelNumber) {
        console.debug('[OrgManagement] Drop negado: psicólogo tentou mover para nível acima ou igual');
        toast({
          title: 'Movimento não permitido',
          description: 'Você só pode mover membros para níveis abaixo do seu.',
          variant: 'destructive',
        });
        setDraggingUser(null);
        return;
      }

      // Psicólogo não pode mover pessoas de níveis acima dele
      if (sourceLevelNumber < userLevelNumber) {
        console.debug('[OrgManagement] Drop negado: psicólogo tentou mover de nível superior');
        toast({
          title: 'Movimento não permitido',
          description: 'Você não pode mover membros de níveis superiores ao seu.',
          variant: 'destructive',
        });
        setDraggingUser(null);
        return;
      }
    }

    // REGRA 3: Admin pode mover qualquer um (sem restrições)
    
    console.debug('[OrgManagement] Drop validado, executando movimento:', {
      from: fromLevelId,
      to: targetLevelId,
      user: user.id
    });

    // Criar cópia do mapa
    const clone = new Map(localUsersByLevel);

    const fromList = [...(clone.get(fromLevelId) ?? [])];
    const toList = [...(clone.get(targetLevelId) ?? [])];

    // Remover usuário do nível de origem
    const index = fromList.findIndex((u) => u.id === user.id);
    if (index === -1) {
      console.debug('[OrgManagement] Drop falhou: usuário não encontrado na lista de origem');
      setDraggingUser(null);
      return;
    }

    fromList.splice(index, 1);
    toList.push(user);

    clone.set(fromLevelId, fromList);
    clone.set(targetLevelId, toList);

    setLocalUsersByLevel(clone);
    setDragOverLevelId(null); // FASE 6E-2: Limpar hover

    // FASE 7.2: Persistir movimento no banco com dados de rollback
    updateUserPositionMutation.mutate({
      userPositionId: user.id,
      destinationLevelId: targetLevelId,
      rollbackData: { fromLevelId, toLevelId: targetLevelId },
    });
    
    // Limpar draggingUser após iniciar a mutation
    setDraggingUser(null);
  };

  // FASE 7.1 & 7.8: Mutation para adicionar novo nível com proteção e logs
  const addLevelMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error('Organização não configurada');

      console.debug('[OrgManagement] Iniciando criação de nível para org:', organizationId);

      const maxLevelNumber = levels?.reduce((max, level) => 
        Math.max(max, level.level_number), 0) || 0;
      
      const newLevelNumber = maxLevelNumber + 1;

      const { data, error } = await supabase
        .from('organization_levels')
        .insert({
          organization_id: organizationId,
          level_number: newLevelNumber,
          level_name: `Nível ${newLevelNumber}`,
          description: null,
        })
        .select()
        .single();

      if (error) {
        console.debug('[OrgManagement] Erro ao criar nível:', error);
        throw error;
      }
      
      console.debug('[OrgManagement] Nível criado com sucesso:', data.id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-levels'] });
      toast({
        title: 'Nível adicionado',
        description: 'O novo nível foi criado com sucesso.',
      });
    },
    onError: (error) => {
      console.debug('[OrgManagement] Falha ao adicionar nível');
      toast({
        title: 'Erro ao adicionar nível',
        description: 'Erro ao carregar níveis organizacionais.',
        variant: 'destructive',
      });
    },
  });

  // FASE 7.1: Handler com proteção contra race condition
  const handleAddLevel = () => {
    if (addLevelMutation.isPending) {
      console.debug('[OrgManagement] Criação de nível bloqueada: mutation pendente');
      return;
    }
    addLevelMutation.mutate();
  };

  // FASE 7.1 & 7.8: Mutation para excluir nível com proteção e logs
  const deleteLevelMutation = useMutation({
    mutationFn: async (levelId: string) => {
      console.debug('[OrgManagement] Iniciando exclusão de nível:', levelId);
      
      const { error } = await supabase
        .from('organization_levels')
        .delete()
        .eq('id', levelId);

      if (error) {
        console.debug('[OrgManagement] Erro ao excluir nível:', error);
        throw error;
      }
      
      console.debug('[OrgManagement] Nível excluído com sucesso:', levelId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-levels', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['user-positions', user?.id] }).catch(() => {});
      toast({
        title: 'Nível excluído com sucesso',
        description: 'A estrutura organizacional foi atualizada.',
      });
    },
    onError: () => {
      console.debug('[OrgManagement] Falha ao excluir nível');
      toast({
        title: 'Erro ao excluir nível',
        description: 'Não foi possível excluir este nível. Tente novamente.',
        variant: 'destructive',
      });
    },
  });

  // FASE 7.1 & 7.5: Handler para excluir nível com guards estritos
  const handleDeleteLevel = (levelId: string) => {
    // Guard: apenas admin pode excluir
    if (!isAdmin) {
      console.debug('[OrgManagement] Exclusão negada: não é admin');
      return;
    }
    
    // FASE 7.1: Proteção contra race condition
    if (deleteLevelMutation.isPending) {
      console.debug('[OrgManagement] Exclusão bloqueada: mutation pendente');
      return;
    }

    const memberCount = localUsersByLevel.get(levelId)?.length ?? 0;

    if (memberCount > 0) {
      console.debug('[OrgManagement] Exclusão bloqueada: nível possui membros');
      toast({
        title: 'Não é possível excluir este nível',
        description: 'Você precisa mover todos os membros deste nível antes de excluí-lo.',
        variant: 'destructive',
      });
      return;
    }

    const confirmed = window.confirm('Tem certeza que deseja excluir este nível? Esta ação não pode ser desfeita.');
    if (!confirmed) {
      console.debug('[OrgManagement] Exclusão cancelada pelo usuário');
      return;
    }

    deleteLevelMutation.mutate(levelId);
  };

  const handleManagePermissions = (levelId: string, levelName: string, levelNumber: number) => {
    setSelectedLevel({ id: levelId, name: levelName, number: levelNumber });
    setPermissionModalOpen(true);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background" aria-label="Gestão organizacional">
        {/* Header */}
        <div className="border-b bg-gradient-to-b from-card to-background/50 shadow-sm">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/dashboard')}
                  className="h-10 w-10"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Gestão Organizacional
                  </h1>
                  <p className="text-sm md:text-base text-muted-foreground mt-2">
                    Organize sua equipe em níveis hierárquicos, defina cargos e gerencie permissões de forma visual
                  </p>
                </div>
              </div>

              {organizationId && (
                <Button 
                  size="lg" 
                  className="gap-2 shadow-md hover:shadow-lg transition-all"
                  onClick={handleAddLevel}
                  disabled={addLevelMutation.isPending}
                  aria-label="Adicionar novo nível organizacional"
                >
                  <Plus className="h-5 w-5" />
                  {addLevelMutation.isPending ? 'Adicionando...' : 'Adicionar Nível'}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Organogram View */}
        <div className="container mx-auto px-4 py-8">
          {/* Validação: usuário sem organização */}
          {!organizationId ? (
            <div className="flex flex-col items-center justify-center py-16 text-center max-w-xl mx-auto">
              <div className="p-6 rounded-full bg-amber-50 mb-4">
                <TriangleAlert className="h-16 w-16 text-amber-500" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Configuração de empresa pendente</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Para usar o organograma, você precisa configurar sua empresa/CNPJ no perfil.
              </p>
              <Button 
                size="lg"
                onClick={() => navigate('/profile-edit')}
                className="gap-2"
              >
                <User className="h-5 w-5" />
                Ir para o perfil
              </Button>
            </div>
          ) : (
            <>
          {/* FASE 6E-6: Estado de erro ao carregar níveis */}
          {errorLevels ? (
            <div className="flex flex-col items-center justify-center py-12 text-center max-w-xl mx-auto">
              <div className="p-4 rounded-full bg-red-50 mb-4">
                <TriangleAlert className="h-10 w-10 text-red-500" />
              </div>
              <h3 className="text-base font-semibold mb-2">Erro ao carregar níveis</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Não foi possível carregar sua estrutura organizacional.
              </p>
              <Button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['organization-levels', user?.id] })}
                className="gap-2"
              >
                <Settings className="h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          ) : isLoadingLevels ? (
            /* FASE 6E-6: Loading state refinado */
            <div className="flex flex-col items-center justify-center py-12">
              <ScrollArea className="w-full">
                <div className="flex gap-6 pb-4" style={{ minWidth: 'fit-content' }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex-shrink-0 min-w-[280px] md:min-w-[340px] w-[340px]">
                      <div className="rounded-xl border-2 bg-muted/30 h-[380px] p-6 animate-pulse">
                        <div className="h-6 bg-muted-foreground/20 rounded w-3/4 mb-3" />
                        <div className="h-4 bg-muted-foreground/10 rounded w-1/2 mb-6" />
                        <div className="space-y-3">
                          {[1, 2, 3, 4].map((j) => (
                            <div key={j} className="h-16 bg-muted-foreground/10 rounded-lg" />
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <p className="text-sm text-muted-foreground mt-4 animate-pulse">Carregando estrutura organizacional...</p>
            </div>
          ) : !levels || levels.length === 0 ? (
            /* FASE 6E-6: Empty state elegante */
            <div className="flex flex-col items-center justify-center py-16 text-center max-w-xl mx-auto">
              <div className="p-6 rounded-full bg-primary/10 mb-4">
                <Users className="h-16 w-16 text-primary/70" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhum nível criado ainda</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Crie o primeiro nível para organizar sua equipe em uma estrutura hierárquica clara.
              </p>
              <Button 
                size="lg"
                onClick={handleAddLevel}
                disabled={addLevelMutation.isPending}
                className="gap-2"
              >
                <Plus className="h-5 w-5" />
                Criar primeiro nível
              </Button>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <div className="flex gap-6 pb-4" style={{ minWidth: 'fit-content' }}>
                {levels.map((level, index) => {
                  // FASE 6E-2: Verificar se este nível é um drop target válido
                  const isValidTarget = draggingUser ? isValidDropTarget(level.id) : false;
                  const isBeingHovered = dragOverLevelId === level.id;
                  const showDropFeedback = draggingUser && isBeingHovered && isValidTarget;
                  const showInvalidFeedback = draggingUser && isBeingHovered && !isValidTarget;
                  
                  return (
                    <div key={level.id} className="flex-shrink-0 relative">
                      {/* Level Card */}
                      <Card 
                        className={`
                          min-w-[280px] md:min-w-[340px] w-[340px] ${LEVEL_COLORS[index % LEVEL_COLORS.length]} border-2 
                          transition-all duration-200 ease-out
                          ${showDropFeedback ? 'shadow-md ring-2 ring-primary/40' : 'shadow-sm hover:shadow-md'}
                          ${showInvalidFeedback ? 'opacity-40' : ''}
                        `}
                        role="group"
                        aria-label={`Nível ${level.level_number} - ${level.level_name}`}
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg font-semibold tracking-tight">
                                {level.level_name}
                              </CardTitle>
                              <Badge className="mt-2 bg-primary/10 text-primary font-medium px-2 py-0.5 border-0">
                                {localUsersByLevel.get(level.id)?.length || 0} membro(s)
                              </Badge>
                              {/* FASE 6E-6: Erro ao carregar usuários */}
                              {errorUsers && (
                                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                                  <TriangleAlert className="h-3 w-3" />
                                  Erro ao carregar membros deste nível
                                </p>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="font-semibold px-3">
                                N{level.level_number}
                              </Badge>
                              {/* FASE 6E-5: Botão de excluir nível (apenas admin e nível vazio) */}
                              {isAdmin && (() => {
                                const memberCount = localUsersByLevel.get(level.id)?.length ?? 0;
                                const hasMembers = memberCount > 0;
                                const isDeleting = deleteLevelMutation.isPending;
                                
                                return (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className={`h-8 w-8 rounded-full border border-red-200/60 text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors ${
                                      hasMembers ? 'opacity-40 cursor-not-allowed hover:bg-transparent hover:text-red-500' : ''
                                    }`}
                                    onClick={() => {
                                      if (hasMembers) {
                                        toast({
                                          title: 'Nível não pode ser excluído',
                                          description: 'Mova todos os membros para outros níveis antes de excluir este.',
                                          variant: 'destructive',
                                        });
                                        return;
                                      }
                                      handleDeleteLevel(level.id);
                                    }}
                                    aria-label={
                                      hasMembers
                                        ? `Não é possível excluir o nível ${level.level_number} - possui membros`
                                        : `Excluir nível ${level.level_number} ${isDeleting ? '- excluindo...' : ''}`
                                    }
                                    disabled={isDeleting}
                                  >
                                    {isDeleting ? (
                                      <div className="h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </Button>
                                );
                              })()}
                            </div>
                          </div>
                        </CardHeader>

                        <CardContent className="space-y-3">
                          {/* FASE 6E-6: Loading state para usuários dentro do nível */}
                          {isLoadingUsers && (
                            <div className="space-y-3 p-3">
                              {[1, 2, 3].map((i) => (
                                <div key={i} className="h-16 rounded-lg bg-muted/30 animate-pulse" />
                              ))}
                            </div>
                          )}
                          
                          {/* Users List - FASE 6D-1: Drag & drop zone */}
                          {!isLoadingUsers && (
                            <div 
                              className={`
                                space-y-2 min-h-[200px] max-h-[400px] overflow-y-auto rounded-lg 
                                border-2 border-dashed transition-all duration-200 ease-out
                                ${showDropFeedback 
                                  ? 'border-primary/60 bg-primary/10 p-3' 
                                  : showInvalidFeedback
                                  ? 'border-destructive/40 opacity-40 cursor-not-allowed p-3'
                                  : 'border-muted-foreground/20 p-3'
                                }
                              `}
                              onDragOver={(e) => handleDragOver(e, level.id)}
                              onDrop={(e) => handleDrop(e, level.id)}
                              onDragLeave={() => setDragOverLevelId(null)}
                              aria-dropeffect="move"
                              aria-label={
                                draggingUser 
                                  ? isValidTarget
                                    ? `Nível ${level.level_number} - destino permitido`
                                    : `Nível ${level.level_number} - destino proibido`
                                  : `Nível ${level.level_number}`
                              }
                            >
                              {localUsersByLevel.get(level.id)?.map((userInfo) => {
                                const initials = userInfo.full_name
                                  .split(' ')
                                  .map(n => n[0])
                                  .slice(0, 2)
                                  .join('')
                                  .toUpperCase();

                                const isDraggable = isAdmin || roleGlobal === 'psychologist';
                                const isBeingDragged = draggingUser?.user.id === userInfo.id;
                                const isSaving = updateUserPositionMutation.isPending && isBeingDragged;
                                
                                // FASE 6E-2: Determinar se o usuário não pode ser arrastado
                                const isNotDraggable = !isDraggable && (roleGlobal === 'assistant' || roleGlobal === 'accountant');

                                return (
                                  <Card
                                    key={userInfo.id}
                                    className={`
                                      p-3 bg-white/80 dark:bg-neutral-800/50 border border-black/5
                                      transition-all duration-200 ease-out
                                      ${isDraggable && !isSaving ? 'cursor-grab active:cursor-grabbing' : ''}
                                      ${isNotDraggable ? 'cursor-not-allowed opacity-75' : ''}
                                      ${isSaving ? 'opacity-40 cursor-wait' : ''}
                                      ${isBeingDragged && !isSaving
                                        ? 'opacity-40 scale-95' 
                                        : 'opacity-100 scale-100 hover:shadow hover:translate-y-[1px]'
                                      }
                                    `}
                                    draggable={isDraggable && !isSaving}
                                    onDragStart={(e) => handleDragStart(e, level.id, userInfo)}
                                    onDragEnd={handleDragEnd}
                                    aria-label={`Membro ${userInfo.full_name}${isSaving ? ' - salvando...' : ''}`}
                                  >
                                    <div className="flex items-center gap-3">
                                      <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-neutral-900">
                                        <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                                          {initials}
                                        </AvatarFallback>
                                      </Avatar>
                                      <div className="flex-1 min-w-0">
                                        <p className="font-semibold text-sm truncate">
                                          {userInfo.full_name}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                          {userInfo.role && (
                                            <Badge 
                                              variant="outline" 
                                              className={`text-xs font-medium ${ROLE_COLORS[userInfo.role] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                                            >
                                              {getUserRoleLabelForUI(userInfo, userInfo.role)}
                                            </Badge>
                                          )}
                                          {/* FASE 6E-6: Badge "Salvando..." durante persistência */}
                                          {isSaving && (
                                            <Badge variant="secondary" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                              Salvando...
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                </Card>
                              );
                            })}

                              {/* FASE 6E-6: Placeholder elegante de drop para níveis vazios */}
                              {(!localUsersByLevel.get(level.id) || localUsersByLevel.get(level.id)?.length === 0) && (
                                showDropFeedback ? (
                                  <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="h-14 w-14 rounded-full border-2 border-dashed border-primary/50 flex items-center justify-center mb-3">
                                      <Users className="h-7 w-7 text-primary/60" />
                                    </div>
                                    <p className="text-sm font-medium text-primary">
                                      Solte o membro aqui
                                    </p>
                                  </div>
                                ) : (
                                  <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <div className="p-3 rounded-full bg-muted/50 mb-2">
                                      <User className="h-8 w-8 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      Nenhum membro neste nível
                                    </p>
                                    {(isAdmin || roleGlobal === 'psychologist') && (
                                      <p className="text-xs text-muted-foreground/70 mt-1">
                                        Arraste membros de outros níveis para cá
                                      </p>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          )}

                          <Separator className="my-3" />

                          {/* Actions */}
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full gap-2 transition-all duration-200 ease-out"
                            onClick={() => handleManagePermissions(
                              level.id,
                              level.level_name,
                              level.level_number
                            )}
                            aria-label={`Gerenciar permissões do nível ${level.level_name}`}
                          >
                            <Settings className="h-4 w-4" />
                            Gerenciar Permissões
                          </Button>
                        </CardContent>
                      </Card>

                      {/* Connector Line (visual only) */}
                      {index < levels.length - 1 && (
                        <div className="absolute top-1/2 -translate-y-1/2 w-8 h-0.5 bg-gradient-to-r from-border to-transparent ml-[320px]" />
                      )}
                    </div>
                  );
                })}

                {/* Add Level Placeholder */}
                <div className="flex-shrink-0">
                  <Card className="min-w-[280px] md:min-w-[340px] w-[340px] border-2 border-dashed border-primary/30 bg-primary/5 hover:bg-primary/10 hover:border-primary/50 transition-all duration-200 ease-out cursor-pointer group" onClick={handleAddLevel}>
                    <CardContent className="flex flex-col items-center justify-center h-[200px] text-center space-y-3">
                      <Plus className="h-14 w-14 text-primary/60 group-hover:text-primary transition-all duration-200" />
                      <div>
                        <p className="text-sm font-semibold text-primary/80 group-hover:text-primary transition-colors">
                          Adicionar novo nível
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Expanda sua hierarquia organizacional
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </ScrollArea>
          )}

          {/* Info Section */}
          {levels && levels.length > 0 && (
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="shadow-sm hover:shadow-md transition-all duration-200 ease-out border-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Users className="h-5 w-5 text-primary" />
                    </div>
                    Membros na Organização
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-primary">
                    {totalMembers}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-all duration-200 ease-out border-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Settings className="h-5 w-5 text-primary" />
                    </div>
                    Níveis Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-4xl font-bold text-primary">
                    {levels.length}
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-sm hover:shadow-md transition-all duration-200 ease-out border-primary/10">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-green-500/10">
                      <div className="h-5 w-5 rounded-full bg-green-500" />
                    </div>
                    Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge className="bg-green-500 text-white border-0 px-3 py-1 text-sm font-medium">
                    {levels.length > 0 ? '✓ Configurado' : 'Aguardando'}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Instructions */}
          <Card className="mt-10 bg-muted/30 border-muted-foreground/20 shadow-sm hover:shadow-md transition-all duration-200 ease-out">
            <CardContent className="py-6 px-6">
              <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary" />
                Como usar o organograma
              </h3>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="text-primary font-semibold mt-0.5">↕</span>
                  <div>
                    <strong className="text-foreground font-medium">Arrastar e soltar:</strong>{' '}
                    <span className="text-muted-foreground">
                      {isAdmin 
                        ? 'Arraste membros entre níveis para reorganizar a hierarquia. As mudanças são salvas automaticamente.' 
                        : roleGlobal === 'psychologist'
                        ? 'Você pode mover subordinados diretos para níveis abaixo do seu.'
                        : 'Apenas administradores e psicólogos podem reorganizar membros.'}
                    </span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-semibold mt-0.5">⚙</span>
                  <div>
                    <strong className="text-foreground font-medium">Gerenciar Permissões:</strong>{' '}
                    <span className="text-muted-foreground">Configure as permissões e acessos específicos de cada nível hierárquico.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-semibold mt-0.5">+</span>
                  <div>
                    <strong className="text-foreground font-medium">Adicionar Nível:</strong>{' '}
                    <span className="text-muted-foreground">Crie novos níveis hierárquicos conforme sua organização cresce.</span>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-primary font-semibold mt-0.5">👁</span>
                  <div>
                    <strong className="text-foreground font-medium">Visualização clara:</strong>{' '}
                    <span className="text-muted-foreground">A estrutura mostra de forma intuitiva a posição de cada membro na hierarquia.</span>
                  </div>
                </li>
              </ul>
            </CardContent>
          </Card>
          </>
          )}
        </div>

        {/* Modal de Permissões */}
        {selectedLevel && (
          <LevelPermissionModal
            open={permissionModalOpen}
            onOpenChange={setPermissionModalOpen}
            levelId={selectedLevel.id}
            levelName={selectedLevel.name}
            levelNumber={selectedLevel.number}
          />
        )}
      </div>
    </Layout>
  );
}
