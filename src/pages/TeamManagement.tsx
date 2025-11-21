import { useState, useMemo } from 'react';
import { Users, Plus, User, Loader2 } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface TeamMember {
  id: string;
  user_id: string;
  full_name: string;
  role: string;
  level_name: string;
  level_number: number;
  position_name?: string;
}

const ROLE_LABELS: Record<string, string> = {
  psychologist: 'Psicólogo',
  assistant: 'Secretária',
  accountant: 'Contador',
  admin: 'Administrador',
};

const ROLE_COLORS: Record<string, string> = {
  psychologist: 'bg-blue-50/80 text-blue-700 border-blue-200/60',
  assistant: 'bg-purple-50/80 text-purple-700 border-purple-200/60',
  accountant: 'bg-amber-50/80 text-amber-700 border-amber-200/60',
  admin: 'bg-rose-50/80 text-rose-700 border-rose-200/60',
};

const TeamManagement = () => {
  const { user, createTherapist } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('existing');
  
  // Form para vincular existente
  const [linkFormData, setLinkFormData] = useState({
    email: '',
    role: '',
    level: ''
  });

  // Form para criar novo
  const [createFormData, setCreateFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    cpf: '',
    crp: '',
    birth_date: '',
    role: 'psychologist', // Por enquanto só psicólogo
    level: ''
  });

  // Carregar níveis da organização
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

  // Carregar membros da equipe
  const { data: teamMembers, isLoading: isLoadingMembers } = useQuery({
    queryKey: ['team-members', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      try {
        // Buscar níveis da organização
        const { data: orgLevels } = await supabase
          .from('organization_levels')
          .select('id, level_name, level_number')
          .eq('organization_id', user.id);

        if (!orgLevels || orgLevels.length === 0) return [];

        const levelIds = orgLevels.map(l => l.id);

        // Buscar posições desses níveis
        const { data: positions } = await supabase
          .from('organization_positions')
          .select('id, level_id, position_name')
          .in('level_id', levelIds);

        if (!positions || positions.length === 0) return [];

        const positionIds = positions.map(p => p.id);

        // Buscar user_positions
        const { data: userPositions } = await supabase
          .from('user_positions')
          .select('user_id, position_id')
          .in('position_id', positionIds);

        if (!userPositions || userPositions.length === 0) return [];

        const userIds = [...new Set(userPositions.map(up => up.user_id))];

        // Buscar profiles
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name')
          .in('id', userIds);

        // Buscar roles
        const { data: roles } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        // Montar estrutura de membros
        const members: TeamMember[] = [];

        for (const up of userPositions) {
          const position = positions.find(p => p.id === up.position_id);
          if (!position) continue;

          const level = orgLevels.find(l => l.id === position.level_id);
          if (!level) continue;

          const profile = profiles?.find(p => p.id === up.user_id);
          if (!profile) continue;

          const userRole = roles?.find(r => r.user_id === up.user_id);

          members.push({
            id: up.user_id,
            user_id: up.user_id,
            full_name: profile.full_name || 'Sem nome',
            role: userRole?.role || 'psychologist',
            level_name: level.level_name,
            level_number: level.level_number,
            position_name: position.position_name || undefined,
          });
        }

        return members;
      } catch (error) {
        console.error('[TeamManagement] Erro ao carregar membros:', error);
        return [];
      }
    },
    enabled: !!user?.id,
  });

  // Agrupar membros por role
  const membersByRole = useMemo(() => {
    if (!teamMembers) return {
      psychologist: [],
      assistant: [],
      accountant: [],
      admin: [],
      other: []
    };

    return {
      psychologist: teamMembers.filter(m => m.role === 'psychologist'),
      assistant: teamMembers.filter(m => m.role === 'assistant'),
      accountant: teamMembers.filter(m => m.role === 'accountant'),
      admin: teamMembers.filter(m => m.role === 'admin'),
      other: teamMembers.filter(m => !['psychologist', 'assistant', 'accountant', 'admin'].includes(m.role))
    };
  }, [teamMembers]);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadge = (role: string) => {
    return ROLE_LABELS[role] || role;
  };

  const getRoleColor = (role: string) => {
    return ROLE_COLORS[role] || 'bg-gray-50/80 text-gray-700 border-gray-200/60';
  };

  // Vincular usuário existente
  const handleLinkExisting = async () => {
    if (!user?.id) return;
    if (!linkFormData.email || !linkFormData.role || !linkFormData.level) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha email, função e nível organizacional.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Buscar usuário por CPF ou nome
      const search = linkFormData.email.trim();
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, cpf')
        .or(`cpf.eq.${search},full_name.ilike.%${search}%`);

      if (profileError) throw profileError;

      if (!profiles || profiles.length === 0) {
        toast({
          title: "Usuário não encontrado",
          description: "Usuário não encontrado no sistema.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      const targetUser = profiles[0];

      // Garantir role
      const { data: existingRole } = await supabase
        .from('user_roles')
        .select('*')
        .eq('user_id', targetUser.id)
        .maybeSingle();

      if (!existingRole) {
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert({
            user_id: targetUser.id,
            role: linkFormData.role as 'psychologist' | 'assistant' | 'accountant' | 'admin',
          });

        if (roleError) throw roleError;
      } else if (existingRole.role !== linkFormData.role) {
        const { error: updateRoleError } = await supabase
          .from('user_roles')
          .update({ role: linkFormData.role as 'psychologist' | 'assistant' | 'accountant' | 'admin' })
          .eq('user_id', targetUser.id);

        if (updateRoleError) throw updateRoleError;
      }

      // Encontrar ou criar posição
      let positionId: string;

      const { data: existingPosition } = await supabase
        .from('organization_positions')
        .select('id')
        .eq('level_id', linkFormData.level)
        .maybeSingle();

      if (existingPosition) {
        positionId = existingPosition.id;
      } else {
        const { data: newPosition, error: positionError } = await supabase
          .from('organization_positions')
          .insert({
            level_id: linkFormData.level,
            position_name: 'Profissional',
            parent_position_id: null,
          })
          .select('id')
          .single();

        if (positionError) throw positionError;
        positionId = newPosition.id;
      }

      // Verificar se já existe vínculo
      const { data: existingUserPosition } = await supabase
        .from('user_positions')
        .select('id, position_id')
        .eq('user_id', targetUser.id)
        .maybeSingle();

      if (existingUserPosition) {
        const { error: updatePositionError } = await supabase
          .from('user_positions')
          .update({ position_id: positionId })
          .eq('user_id', targetUser.id);

        if (updatePositionError) throw updatePositionError;
      } else {
        const { error: userPositionError } = await supabase
          .from('user_positions')
          .insert({
            user_id: targetUser.id,
            position_id: positionId,
          });

        if (userPositionError) throw userPositionError;
      }

      await queryClient.invalidateQueries({ queryKey: ['team-members'] });
      
      toast({
        title: "Membro vinculado com sucesso",
        description: `${targetUser.full_name} foi adicionado à equipe.`,
      });

      setIsAddModalOpen(false);
      setLinkFormData({ email: '', role: '', level: '' });
    } catch (error) {
      console.error('[TeamManagement] Erro ao vincular membro:', error);
      toast({
        title: "Erro ao vincular membro",
        description: "Ocorreu um erro ao tentar vincular o membro.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Criar novo usuário
  const handleCreateNew = async () => {
    if (!user?.id) return;
    
    // Validações
    if (!createFormData.full_name || !createFormData.email) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome completo e e-mail.",
        variant: "destructive",
      });
      return;
    }

    if (createFormData.role === 'psychologist' && !createFormData.level) {
      toast({
        title: "Nível obrigatório",
        description: "Selecione o nível organizacional para o psicólogo.",
        variant: "destructive",
      });
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(createFormData.email.trim())) {
      toast({
        title: "E-mail inválido",
        description: "Digite um e-mail válido.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.debug('🔵 [CREATE_USER] Iniciando criação de usuário', {
        email: createFormData.email,
        full_name: createFormData.full_name,
        role: createFormData.role,
        level: createFormData.level
      });

      // 1. Criar usuário usando createTherapist
      console.debug('🔵 [CREATE_USER] Passo 1: Criando usuário no auth...');
      const temporaryPassword = `Temp${Math.random().toString(36).slice(2, 10)}!`;
      
      const { error: createError, userId } = await createTherapist(
        createFormData.email,
        temporaryPassword,
        {
          full_name: createFormData.full_name,
          cpf: createFormData.cpf || '',
          crp: createFormData.crp || '',
          birth_date: createFormData.birth_date || '2000-01-01',
        }
      );

      let finalUserId = userId;

      if (createError || !userId) {
        const msg = createError?.message?.toLowerCase?.() || '';
        const code = (createError as any)?.code || '';

        const isAlreadyExists =
          code === 'user_already_exists' ||
          msg.includes('already registered') ||
          msg.includes('user already exists');

        if (isAlreadyExists) {
          console.debug('🔵 [CREATE_USER] Usuário já existe no sistema');
          toast({
            title: "Usuário já cadastrado",
            description: "Este e-mail já está cadastrado. Use a aba 'Vincular Existente' para adicionar o usuário à equipe.",
            variant: "destructive",
          });
          setIsSubmitting(false);
          return;
        } else {
          // Erro real (não é "já existe")
          console.error('❌ [CREATE_USER] Erro no passo 1 (auth/profile):', {
            error: createError,
            message: createError?.message,
            code: (createError as any)?.code
          });
          throw createError || new Error('Falha ao criar usuário');
        }
      }
      
      console.debug('✅ [CREATE_USER] Passo 1 concluído. userId:', finalUserId);

      // 2. Criar role psychologist
      console.debug('🔵 [CREATE_USER] Passo 2: Criando role psychologist...');
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: finalUserId,
          role: 'psychologist',
        });

      if (roleError) {
        console.error('❌ [CREATE_USER] Erro no passo 2 (role):', {
          error: roleError,
          message: roleError.message,
          code: roleError.code
        });
        throw roleError;
      }

      console.debug('✅ [CREATE_USER] Passo 2 concluído.');

      // 3. Vincular ao nível escolhido
      console.debug('🔵 [CREATE_USER] Passo 3: Vinculando ao nível organizacional...');
      // Encontrar ou criar posição
      let positionId: string;

      const { data: existingPosition } = await supabase
        .from('organization_positions')
        .select('id')
        .eq('level_id', createFormData.level)
        .maybeSingle();

      if (existingPosition) {
        positionId = existingPosition.id;
        console.debug('🔵 [CREATE_USER] Posição existente encontrada:', positionId);
      } else {
        console.debug('🔵 [CREATE_USER] Criando nova posição...');
        const { data: newPosition, error: positionError } = await supabase
          .from('organization_positions')
          .insert({
            level_id: createFormData.level,
            position_name: 'Psicólogo',
            parent_position_id: null,
          })
          .select('id')
          .single();

        if (positionError) {
          console.error('❌ [CREATE_USER] Erro ao criar posição:', {
            error: positionError,
            message: positionError.message,
            code: positionError.code
          });
          throw positionError;
        }
        positionId = newPosition.id;
        console.debug('✅ [CREATE_USER] Nova posição criada:', positionId);
      }

      // Criar vínculo em user_positions
      console.debug('🔵 [CREATE_USER] Criando vínculo em user_positions...');
      const { error: userPositionError } = await supabase
        .from('user_positions')
        .insert({
          user_id: finalUserId,
          position_id: positionId,
        });

      if (userPositionError) {
        console.error('❌ [CREATE_USER] Erro ao criar vínculo user_positions:', {
          error: userPositionError,
          message: userPositionError.message,
          code: userPositionError.code
        });
        throw userPositionError;
      }

      console.debug('✅ [CREATE_USER] Passo 3 concluído.');
      console.debug('🟢 [CREATE_USER] Usuário criado com sucesso!', { userId: finalUserId });

      await queryClient.invalidateQueries({ queryKey: ['team-members'] });
      
      toast({
        title: "Usuário criado e vinculado à equipe",
        description: `${createFormData.full_name} foi criado com sucesso.`,
      });

      setIsAddModalOpen(false);
      setCreateFormData({
        full_name: '',
        email: '',
        password: '',
        cpf: '',
        crp: '',
        birth_date: '',
        role: 'psychologist',
        level: ''
      });
    } catch (error: any) {
      console.error('❌ [CREATE_USER ERROR] Falha ao criar usuário:', {
        message: error?.message,
        code: error?.code,
        details: error,
      });

      // Mapear mensagens de erro comuns
      let userMessage = 'Erro ao criar usuário. Verifique os dados e tente novamente.';

      if (typeof error?.message === 'string') {
        const errorMsg = error.message.toLowerCase();
        
        if (errorMsg.includes('duplicate key') || errorMsg.includes('already registered') || errorMsg.includes('user already exists')) {
          userMessage = 'Já existe um usuário cadastrado com este e-mail.';
        } else if (errorMsg.includes('email') || errorMsg.includes('invalid email')) {
          userMessage = 'Há um problema com o e-mail informado. Verifique e tente novamente.';
        } else if (errorMsg.includes('violates row-level security') || errorMsg.includes('permission denied')) {
          userMessage = 'Você não tem permissão para criar usuários neste nível.';
        } else {
          // Usar a mensagem do erro se for segura
          userMessage = error.message;
        }
      }

      toast({
        title: "Erro ao criar usuário",
        description: userMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderMemberCard = (member: TeamMember) => {
    const roleLabel = getRoleBadge(member.role);
    const roleColor = getRoleColor(member.role);
    const isClinical = member.role === 'psychologist'; // Por enquanto só psicólogos
    
    return (
      <Card key={member.id} className="transition-all hover:shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-4 mb-3">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(member.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">{member.full_name}</h3>
                <Badge className={`${roleColor} border`}>{roleLabel}</Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>{member.level_name}</span>
                {member.position_name && (
                  <>
                    <span>•</span>
                    <span>{member.position_name}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          {isClinical && (
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => navigate(`/therapist/${member.user_id}`)}
            >
              Ver Perfil
            </Button>
          )}
        </CardContent>
      </Card>
    );
  };

  const isLoading = isLoadingLevels || isLoadingMembers;

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando equipe...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-4xl font-bold text-foreground mb-2">Equipe</h1>
          <p className="text-muted-foreground text-lg">
            Gerencie os profissionais e colaboradores da sua clínica
          </p>
        </div>
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Plus className="h-5 w-5" />
              Adicionar Membro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Adicionar Novo Membro</DialogTitle>
              <DialogDescription>
                Vincule um usuário existente ou crie um novo psicólogo na equipe
              </DialogDescription>
            </DialogHeader>
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="existing">Vincular Existente</TabsTrigger>
                <TabsTrigger value="create">Criar Novo Usuário</TabsTrigger>
              </TabsList>

              {/* Tab: Vincular Existente */}
              <TabsContent value="existing" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="link-email">Email ou CPF</Label>
                  <Input
                    id="link-email"
                    type="text"
                    placeholder="Digite email ou CPF do usuário existente"
                    value={linkFormData.email}
                    onChange={(e) => setLinkFormData({ ...linkFormData, email: e.target.value })}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-muted-foreground">
                    O usuário já deve ter uma conta no sistema
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link-role">Função</Label>
                  <Select 
                    value={linkFormData.role} 
                    onValueChange={(value) => setLinkFormData({ ...linkFormData, role: value })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="link-role">
                      <SelectValue placeholder="Selecione uma função" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="psychologist">Psicólogo</SelectItem>
                      <SelectItem value="assistant">Secretária</SelectItem>
                      <SelectItem value="accountant">Contador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link-level">Nível Organizacional</Label>
                  <Select 
                    value={linkFormData.level} 
                    onValueChange={(value) => setLinkFormData({ ...linkFormData, level: value })}
                    disabled={!levels || levels.length === 0 || isSubmitting}
                  >
                    <SelectTrigger id="link-level">
                      <SelectValue placeholder={
                        levels && levels.length > 0 
                          ? "Selecione um nível" 
                          : "Nenhum nível disponível"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {levels?.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.level_name} (Nível {level.level_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
                    Cancelar
                  </Button>
                  <Button onClick={handleLinkExisting} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Vinculando...
                      </>
                    ) : (
                      'Vincular Membro'
                    )}
                  </Button>
                </div>
              </TabsContent>

              {/* Tab: Criar Novo */}
              <TabsContent value="create" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">Nome Completo *</Label>
                  <Input
                    id="create-name"
                    type="text"
                    placeholder="Digite o nome completo"
                    value={createFormData.full_name}
                    onChange={(e) => setCreateFormData({ ...createFormData, full_name: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-email">E-mail *</Label>
                  <Input
                    id="create-email"
                    type="email"
                    placeholder="email@exemplo.com"
                    value={createFormData.email}
                    onChange={(e) => setCreateFormData({ ...createFormData, email: e.target.value })}
                    disabled={isSubmitting}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-role">Tipo de Profissional *</Label>
                  <Select 
                    value={createFormData.role} 
                    onValueChange={(value) => setCreateFormData({ ...createFormData, role: value })}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id="create-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="psychologist">Psicólogo</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Por enquanto apenas Psicólogo disponível
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="create-level">Nível Organizacional *</Label>
                  <Select 
                    value={createFormData.level} 
                    onValueChange={(value) => setCreateFormData({ ...createFormData, level: value })}
                    disabled={!levels || levels.length === 0 || isSubmitting}
                  >
                    <SelectTrigger id="create-level">
                      <SelectValue placeholder={
                        levels && levels.length > 0 
                          ? "Selecione um nível" 
                          : "Nenhum nível disponível"
                      } />
                    </SelectTrigger>
                    <SelectContent>
                      {levels?.map((level) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.level_name} (Nível {level.level_number})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddModalOpen(false)} disabled={isSubmitting}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreateNew} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Criando usuário...
                      </>
                    ) : (
                      'Criar e Vincular'
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </DialogContent>
        </Dialog>
      </div>

      {/* Empty state quando não há membros */}
      {teamMembers && teamMembers.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-xl font-semibold mb-2">Nenhum membro na equipe</h3>
            <p className="text-muted-foreground mb-6">
              Configure o organograma para adicionar membros à equipe
            </p>
            <Button variant="outline" onClick={() => window.location.href = '/org-management'}>
              Ir para Organograma
            </Button>
          </div>
        </Card>
      )}

      {/* Sections com membros reais */}
      {teamMembers && teamMembers.length > 0 && (
        <div className="space-y-8">
          {/* Profissionais Clínicos */}
          {membersByRole.psychologist.length > 0 && (
            <section>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Profissionais
                  </CardTitle>
                  <CardDescription>
                    Psicólogos e terapeutas da clínica ({membersByRole.psychologist.length})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[600px]">
                    <div className="space-y-3">
                      {membersByRole.psychologist
                        .sort((a, b) => a.full_name.localeCompare(b.full_name))
                        .map(renderMemberCard)}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Equipe Administrativa */}
          {(membersByRole.assistant.length > 0 || membersByRole.accountant.length > 0) && (
            <section>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Administrativo
                  </CardTitle>
                  <CardDescription>
                    Assistentes e contadores ({membersByRole.assistant.length + membersByRole.accountant.length})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[600px]">
                    <div className="space-y-3">
                      {[...membersByRole.assistant, ...membersByRole.accountant]
                        .sort((a, b) => a.full_name.localeCompare(b.full_name))
                        .map(renderMemberCard)}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Administradores */}
          {membersByRole.admin.length > 0 && (
            <section>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Administradores
                  </CardTitle>
                  <CardDescription>
                    Membros com acesso administrativo ({membersByRole.admin.length})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[400px]">
                    <div className="space-y-3">
                      {membersByRole.admin
                        .sort((a, b) => a.full_name.localeCompare(b.full_name))
                        .map(renderMemberCard)}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Outros Membros */}
          {membersByRole.other.length > 0 && (
            <section>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Outros Membros
                  </CardTitle>
                  <CardDescription>
                    Outros profissionais ({membersByRole.other.length})
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[400px]">
                    <div className="space-y-3">
                      {membersByRole.other
                        .sort((a, b) => a.full_name.localeCompare(b.full_name))
                        .map(renderMemberCard)}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default TeamManagement;
