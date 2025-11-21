import { useState } from 'react';
import { Users, Plus, User, Edit, Trash2, MoveVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

const TeamManagement = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: '',
    level: ''
  });

  // Mock data for team members
  const mockProfessionals = [
    { id: '1', name: 'Psicólogo 1', role: 'psychologist', level: 'Nível 1' },
    { id: '2', name: 'Psicólogo 2', role: 'psychologist', level: 'Nível 2' }
  ];

  const mockAdministrative = [
    { id: '3', name: 'Assistente 1', role: 'assistant', level: 'Nível 3' },
    { id: '4', name: 'Contador 1', role: 'accountant', level: 'Nível 3' }
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleBadge = (role: string) => {
    const badges = {
      psychologist: { label: 'Psicólogo', variant: 'default' as const },
      assistant: { label: 'Assistente', variant: 'secondary' as const },
      accountant: { label: 'Contador', variant: 'outline' as const }
    };
    return badges[role as keyof typeof badges] || { label: role, variant: 'default' as const };
  };

  const handleAddMember = () => {
    console.log('Mock: Adicionar membro', formData);
    setIsAddModalOpen(false);
    setFormData({ name: '', email: '', role: '', level: '' });
  };

  const handleMove = (id: string) => {
    console.log('Mock: Mover membro', id);
  };

  const handleEdit = (id: string) => {
    console.log('Mock: Editar membro', id);
  };

  const handleDelete = (id: string) => {
    console.log('Mock: Excluir membro', id);
  };

  const renderMemberCard = (member: { id: string; name: string; role: string; level: string }) => {
    const badgeInfo = getRoleBadge(member.role);
    return (
      <Card key={member.id} className="transition-all hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold text-foreground">{member.name}</h3>
                <Badge variant={badgeInfo.variant}>{badgeInfo.label}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">{member.level}</p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleMove(member.id)}
                title="Mover"
              >
                <MoveVertical className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleEdit(member.id)}
                title="Editar"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(member.id)}
                title="Excluir"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

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
                Preencha os dados do novo membro da equipe
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
                    <SelectItem value="assistant" disabled>Assistente (em breve)</SelectItem>
                    <SelectItem value="accountant" disabled>Contador (em breve)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="level">Nível Organizacional</Label>
                <Select value={formData.level} onValueChange={(value) => setFormData({ ...formData, level: value })}>
                  <SelectTrigger id="level">
                    <SelectValue placeholder="Selecione um nível" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Nível 1</SelectItem>
                    <SelectItem value="2">Nível 2</SelectItem>
                    <SelectItem value="3">Nível 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddMember}>
                Adicionar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-8">
        {/* Profissionais Clínicos */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Profissionais
              </CardTitle>
              <CardDescription>
                Psicólogos e terapeutas da clínica
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockProfessionals.map(renderMemberCard)}
            </CardContent>
          </Card>
        </section>

        {/* Equipe Administrativa */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Administrativo
              </CardTitle>
              <CardDescription>
                Assistentes e contadores
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {mockAdministrative.map(renderMemberCard)}
            </CardContent>
          </Card>
        </section>

        {/* Outros Membros */}
        <section>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Outros Membros
              </CardTitle>
              <CardDescription>
                Convidados e membros externos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Nenhum membro externo adicionado ainda</p>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
};

export default TeamManagement;
