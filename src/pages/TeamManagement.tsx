import { useState, useMemo } from 'react';
import { Users, Plus, User, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const { user } = useAuth();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
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

  const handleAddMember = () => {
    console.log('Mock: Adicionar membro', formData);
    setIsAddModalOpen(false);
    setFormData({ name: '', email: '', role: '', level: '' });
  };

  const renderMemberCard = (member: TeamMember) => {
    const roleLabel = getRoleBadge(member.role);
    const roleColor = getRoleColor(member.role);
    
    return (
      <Card key={member.id} className="transition-all hover:shadow-sm">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Novo Membro</DialogTitle>
              <DialogDescription>
                Preencha os dados do novo membro da equipe (funcionalidade em desenvolvimento)
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  placeholder="Digite o nome completo"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="email@exemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger id="role">
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
                <Label htmlFor="level">Nível Organizacional</Label>
                <Select 
                  value={formData.level} 
                  onValueChange={(value) => setFormData({ ...formData, level: value })}
                  disabled={!levels || levels.length === 0}
                >
                  <SelectTrigger id="level">
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
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddMember} disabled>
                Adicionar (em breve)
              </Button>
            </div>
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
