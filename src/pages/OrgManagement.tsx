import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Settings, Users } from 'lucide-react';
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
}

// Cores automáticas por índice
const LEVEL_COLORS = [
  'bg-purple-100 border-purple-300',
  'bg-blue-100 border-blue-300',
  'bg-green-100 border-green-300',
  'bg-yellow-100 border-yellow-300',
  'bg-orange-100 border-orange-300',
  'bg-pink-100 border-pink-300',
  'bg-indigo-100 border-indigo-300',
  'bg-red-100 border-red-300',
];

const ROLE_LABELS: Record<string, string> = {
  psychologist: 'Psicólogo',
  assistant: 'Secretária',
  accountant: 'Contador',
  admin: 'Admin',
};

const ROLE_COLORS: Record<string, string> = {
  psychologist: 'bg-blue-100 text-blue-700 border-blue-200',
  assistant: 'bg-purple-100 text-purple-700 border-purple-200',
  accountant: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  admin: 'bg-red-100 text-red-700 border-red-200',
};

export default function OrgManagement() {
  const navigate = useNavigate();
  const { user, isAdmin, roleGlobal } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

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

  // Query para buscar níveis reais do banco
  const { data: levels, isLoading: isLoadingLevels } = useQuery({
    queryKey: ['organization-levels', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('organization_levels')
        .select('*')
        .eq('organization_id', user.id)
        .order('level_number', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Query para buscar usuários com suas posições
  const { data: userPositions, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['user-positions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Primeiro buscar todos os níveis da organização
      const { data: orgLevels } = await supabase
        .from('organization_levels')
        .select('id')
        .eq('organization_id', user.id);

      if (!orgLevels || orgLevels.length === 0) return [];

      const levelIds = orgLevels.map(l => l.id);

      // Buscar positions desses níveis
      const { data: positions } = await supabase
        .from('organization_positions')
        .select('id, level_id')
        .in('level_id', levelIds);

      if (!positions || positions.length === 0) return [];

      const positionIds = positions.map(p => p.id);

      // Buscar user_positions com profiles
      const { data, error } = await supabase
        .from('user_positions')
        .select(`
          id,
          user_id,
          position_id,
          profiles!inner (
            full_name
          )
        `)
        .in('position_id', positionIds);

      if (error) {
        toast({
          title: 'Erro ao carregar usuários',
          description: error.message,
          variant: 'destructive',
        });
        throw error;
      }

      if (!data || data.length === 0) return [];

      // Buscar roles dos usuários
      const userIds = data.map(up => up.user_id);
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', userIds);

      // Criar mapa de roles
      const rolesMap = new Map<string, string>();
      rolesData?.forEach(r => rolesMap.set(r.user_id, r.role));

      // Enriquecer com level_id e role
      const enrichedData = data?.map(up => {
        const position = positions.find(p => p.id === up.position_id);
        return {
          ...up,
          level_id: position?.level_id,
          role: rolesMap.get(up.user_id),
        };
      });

      return enrichedData || [];
    },
    enabled: !!user?.id,
  });

  // Agrupar usuários por level_id
  const usersByLevel = useMemo(() => {
    const map = new Map<string, UserInLevel[]>();
    
    if (!userPositions) return map;

    userPositions.forEach((position: any) => {
      const levelId = position.level_id;
      const fullName = position.profiles?.full_name || 'Sem nome';
      const role = position.role;
      
      if (!levelId) return;

      const userInfo: UserInLevel = {
        id: position.id,
        user_id: position.user_id,
        full_name: fullName,
        avatar_url: undefined,
        role: role,
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

  // FASE 6D-3: Mutation para persistir movimento de usuários entre níveis
  const updateUserPositionMutation = useMutation({
    mutationFn: async ({ 
      userPositionId, 
      destinationLevelId 
    }: { 
      userPositionId: string; 
      destinationLevelId: string;
    }) => {
      if (!user?.id) throw new Error('Usuário não autenticado');

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
      } else {
        targetPositionId = existingPosition.id;
      }

      // 2. Atualizar user_positions
      const { error: updateError } = await supabase
        .from('user_positions')
        .update({ position_id: targetPositionId })
        .eq('id', userPositionId);

      if (updateError) throw updateError;

      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-levels'] });
      queryClient.invalidateQueries({ queryKey: ['user-positions'] });
      toast({
        title: 'Movido com sucesso!',
        description: 'O membro foi movido para o novo nível.',
      });
    },
    onError: (error: any) => {
      console.error('[OrgManagement] Erro ao mover usuário:', error);
      toast({
        title: 'Erro ao mover usuário',
        description: error?.message || 'Não foi possível mover o membro para o novo nível.',
        variant: 'destructive',
      });
    },
  });

  // FASE 6D-2: Handlers para drag & drop com validações
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    fromLevelId: string,
    user: UserInLevel
  ) => {
    const isPsychologist = roleGlobal === 'psychologist';
    const isSubordinate = roleGlobal === 'assistant' || roleGlobal === 'accountant';

    // Assistente/Contador não podem mover ninguém
    if (isSubordinate) {
      e.preventDefault();
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
      toast({
        title: 'Permissão negada',
        description: 'Você não tem permissão para reorganizar o organograma.',
        variant: 'destructive',
      });
      return;
    }

    setDraggingUser({ fromLevelId, user });
  };

  const handleDragEnd = () => {
    setDraggingUser(null);
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    targetLevelId: string
  ) => {
    const isPsychologist = roleGlobal === 'psychologist';
    
    // Admin e Psicólogo podem fazer drop
    if (!isAdmin && !isPsychologist) return;
    
    e.preventDefault(); // Necessário para permitir drop
  };

  const handleDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetLevelId: string
  ) => {
    e.preventDefault();
    if (!draggingUser || !localUsersByLevel || !levels) return;

    const { fromLevelId, user } = draggingUser;

    // FASE 6D-2: Validações de regras de negócio
    
    // Regra estrutural: não pode mover para o mesmo nível
    if (fromLevelId === targetLevelId) {
      setDraggingUser(null);
      return;
    }

    // Determinar papéis
    const isPsychologist = roleGlobal === 'psychologist';
    const isSubordinate = roleGlobal === 'assistant' || roleGlobal === 'accountant';

    // REGRA 1: Assistente/Contador não podem mover ninguém
    if (isSubordinate) {
      toast({
        title: 'Permissão negada',
        description: 'Seu papel não permite alterar a organização.',
        variant: 'destructive',
      });
      setDraggingUser(null);
      return;
    }

    // Buscar informações dos níveis
    const sourceLevelInfo = levels.find(l => l.id === fromLevelId);
    const targetLevelInfo = levels.find(l => l.id === targetLevelId);

    if (!sourceLevelInfo || !targetLevelInfo) {
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
      // Para isso, preciso encontrar em qual nível o user.id está
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
    // Se chegou aqui e é admin, ou se é psicólogo que passou pelas validações, executar o movimento

    // Criar cópia do mapa
    const clone = new Map(localUsersByLevel);

    const fromList = [...(clone.get(fromLevelId) ?? [])];
    const toList = [...(clone.get(targetLevelId) ?? [])];

    // Remover usuário do nível de origem
    const index = fromList.findIndex((u) => u.id === user.id);
    if (index === -1) {
      setDraggingUser(null);
      return;
    }

    fromList.splice(index, 1);
    toList.push(user);

    clone.set(fromLevelId, fromList);
    clone.set(targetLevelId, toList);

    setLocalUsersByLevel(clone);
    setDraggingUser(null);

    // FASE 6D-3: Persistir movimento no banco
    updateUserPositionMutation.mutate({
      userPositionId: user.id,
      destinationLevelId: targetLevelId,
    });
  };

  // Mutation para adicionar novo nível
  const addLevelMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error('Usuário não autenticado');

      const maxLevelNumber = levels?.reduce((max, level) => 
        Math.max(max, level.level_number), 0) || 0;
      
      const newLevelNumber = maxLevelNumber + 1;

      const { data, error } = await supabase
        .from('organization_levels')
        .insert({
          organization_id: user.id,
          level_number: newLevelNumber,
          level_name: `Nível ${newLevelNumber}`,
          description: null,
        })
        .select()
        .single();

      if (error) throw error;
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
      toast({
        title: 'Erro ao adicionar nível',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const handleAddLevel = () => {
    addLevelMutation.mutate();
  };

  const handleManagePermissions = (levelId: string, levelName: string, levelNumber: number) => {
    setSelectedLevel({ id: levelId, name: levelName, number: levelNumber });
    setPermissionModalOpen(true);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="border-b bg-card">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/dashboard')}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight">
                    Gestão Organizacional
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Organize sua equipe em níveis hierárquicos e gerencie permissões
                  </p>
                </div>
              </div>

              <Button 
                size="lg" 
                className="gap-2"
                onClick={handleAddLevel}
                disabled={addLevelMutation.isPending}
              >
                <Plus className="h-4 w-4" />
                {addLevelMutation.isPending ? 'Adicionando...' : 'Adicionar Nível'}
              </Button>
            </div>
          </div>
        </div>

        {/* Organogram View */}
        <div className="container mx-auto px-4 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground">Carregando níveis...</p>
            </div>
          ) : !levels || levels.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Users className="h-16 w-16 text-muted-foreground/50 mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum nível configurado ainda</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Clique em "+ Adicionar Nível" para começar a estruturar sua organização.
              </p>
            </div>
          ) : (
            <ScrollArea className="w-full">
              <div className="flex gap-6 pb-4" style={{ minWidth: 'fit-content' }}>
                {levels.map((level, index) => (
                  <div key={level.id} className="flex-shrink-0">
                    {/* Level Card */}
                    <Card className={`w-[320px] ${LEVEL_COLORS[index % LEVEL_COLORS.length]} border-2`}>
                      <CardHeader className="pb-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg font-semibold">
                              {level.level_name}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                              {localUsersByLevel.get(level.id)?.length || 0} membro(s)
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            N{level.level_number}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {/* Users List - FASE 6D-1: Drag & drop zone */}
                        <div 
                          className="space-y-2 min-h-[200px] max-h-[400px] overflow-y-auto rounded-md border-2 border-dashed border-transparent hover:border-primary/30 transition-colors p-2"
                          onDragOver={(e) => handleDragOver(e, level.id)}
                          onDrop={(e) => handleDrop(e, level.id)}
                        >
                          {localUsersByLevel.get(level.id)?.map((userInfo) => {
                            const initials = userInfo.full_name
                              .split(' ')
                              .map(n => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase();

                            return (
                              <Card
                                key={userInfo.id}
                                className={`p-3 bg-background hover:shadow-sm transition-shadow ${(isAdmin || roleGlobal === 'psychologist') ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                draggable={isAdmin || roleGlobal === 'psychologist'}
                                onDragStart={(e) => handleDragStart(e, level.id, userInfo)}
                                onDragEnd={handleDragEnd}
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-10 w-10">
                                    <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                      {initials}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">
                                      {userInfo.full_name}
                                    </p>
                                    {userInfo.role && (
                                      <Badge 
                                        variant="outline" 
                                        className={`text-xs mt-1 ${ROLE_COLORS[userInfo.role] || 'bg-gray-100 text-gray-700 border-gray-200'}`}
                                      >
                                        {ROLE_LABELS[userInfo.role] || userInfo.role}
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </Card>
                            );
                          })}

                          {(!localUsersByLevel.get(level.id) || localUsersByLevel.get(level.id)?.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-12 text-center">
                              <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
                              <p className="text-sm text-muted-foreground">
                                Nenhum membro neste nível
                              </p>
                            </div>
                          )}
                        </div>

                      <Separator />

                      {/* Actions */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
                        onClick={() => handleManagePermissions(
                          level.id,
                          level.level_name,
                          level.level_number
                        )}
                      >
                        <Settings className="h-4 w-4" />
                        Gerenciar Permissões
                      </Button>
                    </CardContent>
                  </Card>

                    {/* Connector Line (visual only) */}
                    {index < levels.length - 1 && (
                      <div className="absolute top-1/2 -translate-y-1/2 w-6 h-0.5 bg-border ml-[320px]" />
                    )}
                  </div>
                ))}

                {/* Add Level Placeholder */}
                <div className="flex-shrink-0">
                  <Card className="w-[320px] border-2 border-dashed border-muted-foreground/30 bg-muted/20">
                    <CardContent className="flex flex-col items-center justify-center h-[200px] text-center">
                      <Plus className="h-12 w-12 text-muted-foreground/50 mb-3" />
                      <p className="text-sm font-medium text-muted-foreground">
                        Adicionar novo nível
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Expanda sua hierarquia
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </ScrollArea>
          )}

          {/* Info Section */}
          {levels && levels.length > 0 && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Total de Membros
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {totalMembers}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    Níveis Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{levels.length}</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium">
                    Status
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    {levels.length > 0 ? 'Configurado' : 'Aguardando configuração'}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Instructions */}
          <Card className="mt-8 bg-muted/50">
            <CardContent className="py-6">
              <h3 className="font-semibold mb-2">Como usar:</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• <strong>Arrastar e soltar:</strong> {
                  isAdmin 
                    ? 'Arraste membros entre níveis para reorganizar (prévia visual, não salva automaticamente)' 
                    : roleGlobal === 'psychologist'
                    ? 'Você pode mover subordinados diretos para níveis abaixo do seu'
                    : 'Apenas administradores e psicólogos podem reorganizar membros'
                }</li>
                <li>• <strong>Gerenciar Permissões:</strong> Configure as permissões específicas de cada nível</li>
                <li>• <strong>Adicionar Nível:</strong> Crie novos níveis hierárquicos conforme necessário</li>
                <li>• <strong>Visualização:</strong> A estrutura mostra claramente quem está em cada nível</li>
              </ul>
            </CardContent>
          </Card>
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
