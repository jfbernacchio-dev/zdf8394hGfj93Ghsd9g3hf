import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { UserPlus, Shield, UserMinus, Trash2 } from 'lucide-react';

interface UserWithRoles {
  id: string;
  email: string;
  full_name: string;
  cpf: string;
  roles: string[];
  created_by: string | null;
  supervisor_name: string | null;
  is_subordinate: boolean;
}

export const AccessManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRoles[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  
  // Criar novo usuário
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newFullName, setNewFullName] = useState('');
  const [newCpf, setNewCpf] = useState('');
  const [newCrp, setNewCrp] = useState('');
  const [newRole, setNewRole] = useState<'accountant' | 'admin' | 'therapist'>('therapist');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      
      // Buscar todos os profiles com informações de subordinação
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, cpf, created_by')
        .order('full_name');

      if (profilesError) throw profilesError;

      // Buscar roles de cada usuário
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Buscar informações dos supervisores
      const supervisorIds = profiles?.filter(p => p.created_by).map(p => p.created_by) || [];
      const { data: supervisors, error: supervisorsError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', supervisorIds);

      if (supervisorsError) throw supervisorsError;

      // Montar lista de usuários
      const usersWithRoles: UserWithRoles[] = (profiles || []).map(profile => {
        const userRoles = roles?.filter(r => r.user_id === profile.id).map(r => r.role) || [];
        const supervisor = supervisors?.find(s => s.id === profile.created_by);
        const isSubordinate = !!profile.created_by;
        
        return {
          id: profile.id,
          email: `${profile.id.substring(0, 8)}...`,
          full_name: profile.full_name,
          cpf: profile.cpf,
          roles: userRoles,
          created_by: profile.created_by,
          supervisor_name: supervisor?.full_name || null,
          is_subordinate: isSubordinate,
        };
      });

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar usuários',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      // Usar Edge Function para criar usuário (evita problemas com RLS)
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão não encontrada');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-user-with-role`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: newEmail,
            password: newPassword,
            full_name: newFullName,
            cpf: newCpf,
            crp: newCrp,
            birth_date: '2000-01-01',
            role: newRole,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao criar usuário');
      }

      const roleLabels = {
        admin: 'Administrador',
        accountant: 'Contador',
        therapist: 'Terapeuta Full'
      };

      toast({
        title: 'Usuário criado!',
        description: `Acesso criado para ${newEmail} com perfil de ${roleLabels[newRole]}.`,
      });

      // Reset form
      setNewEmail('');
      setNewPassword('');
      setNewFullName('');
      setNewCpf('');
      setNewCrp('');
      setNewRole('therapist');
      setIsCreateDialogOpen(false);
      
      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Erro ao criar usuário',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setCreating(false);
    }
  };

  const handleToggleRole = async (userId: string, role: 'admin' | 'accountant', currentlyHas: boolean) => {
    try {
      if (currentlyHas) {
        // Remover role
        const { error } = await supabase
          .from('user_roles')
          .delete()
          .eq('user_id', userId)
          .eq('role', role);

        if (error) throw error;

        toast({
          title: 'Permissão removida',
          description: `Permissão de ${role} foi removida.`,
        });
      } else {
        // Adicionar role
        const { error } = await supabase
          .from('user_roles')
          .insert([{ user_id: userId, role: role }]);

        if (error) throw error;

        toast({
          title: 'Permissão adicionada',
          description: `Permissão de ${role} foi adicionada.`,
        });
      }

      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Erro ao alterar permissão',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Tem certeza que deseja deletar permanentemente o usuário "${userName}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Sessão não encontrada');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Erro ao deletar usuário');
      }

      toast({
        title: 'Usuário deletado',
        description: `O usuário ${userName} foi removido permanentemente do sistema.`,
      });

      loadUsers();
    } catch (error: any) {
      toast({
        title: 'Erro ao deletar usuário',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case 'admin':
        return 'destructive';
      case 'accountant':
        return 'secondary';
      case 'therapist':
        return 'default';
      default:
        return 'outline';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'accountant':
        return 'Contador';
      case 'therapist':
        return 'Terapeuta';
      default:
        return role;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Carregando usuários...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Gerenciamento de Acessos</h3>
          <p className="text-sm text-muted-foreground">
            Gerencie usuários e suas permissões no sistema
          </p>
        </div>
        
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Criar Acesso
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleCreateUser}>
              <DialogHeader>
                <DialogTitle>Criar Novo Acesso</DialogTitle>
                <DialogDescription>
                  Crie um novo usuário com acesso ao sistema. O usuário poderá alterar a senha posteriormente.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="new-email">Email*</Label>
                  <Input
                    id="new-email"
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    placeholder="usuario@email.com"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="new-password">Senha Temporária*</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    placeholder="Mínimo 6 caracteres"
                    minLength={6}
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="new-fullname">Nome Completo (opcional)</Label>
                  <Input
                    id="new-fullname"
                    value={newFullName}
                    onChange={(e) => setNewFullName(e.target.value)}
                    placeholder="Nome completo"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="new-cpf">CPF (opcional)</Label>
                    <Input
                      id="new-cpf"
                      value={newCpf}
                      onChange={(e) => setNewCpf(e.target.value)}
                      placeholder="000.000.000-00"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="new-crp">CRP (opcional)</Label>
                    <Input
                      id="new-crp"
                      value={newCrp}
                      onChange={(e) => setNewCrp(e.target.value)}
                      placeholder="00/00000"
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="new-role">Tipo de Acesso*</Label>
                  <Select value={newRole} onValueChange={(value: any) => setNewRole(value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="therapist">Terapeuta Full (pode ter subordinados e accountant)</SelectItem>
                      <SelectItem value="accountant">Contador (apenas dados financeiros)</SelectItem>
                      <SelectItem value="admin">Administrador (acesso completo)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={creating}>
                  {creating ? 'Criando...' : 'Criar Acesso'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários do Sistema</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>CPF</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Subordinado a</TableHead>
                <TableHead>Permissões Extras</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => {
                const hasAdminRole = user.roles.includes('admin');
                const hasAccountantRole = user.roles.includes('accountant');
                const hasTherapistRole = user.roles.includes('therapist');
                
                // Determinar o tipo principal do usuário
                let userType = null;
                if (hasAdminRole) {
                  userType = <Badge variant="destructive">Administrador</Badge>;
                } else if (hasAccountantRole && !hasTherapistRole) {
                  userType = <Badge variant="secondary">Contador</Badge>;
                } else if (user.is_subordinate) {
                  userType = <Badge className="bg-yellow-500 text-white hover:bg-yellow-600">Subordinado</Badge>;
                } else if (hasTherapistRole || (!hasAdminRole && !hasAccountantRole && !user.is_subordinate)) {
                  userType = <Badge className="bg-green-600 text-white hover:bg-green-700">Terapeuta Full</Badge>;
                }
                
                // Permissões extras (accountant)
                const extraPermissions = hasAccountantRole ? (
                  <Badge variant="secondary">Contador</Badge>
                ) : (
                  <span className="text-muted-foreground text-sm">-</span>
                );

                return (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name}</TableCell>
                    <TableCell className="text-muted-foreground">{user.cpf}</TableCell>
                    <TableCell>{userType}</TableCell>
                    <TableCell>
                      {user.supervisor_name ? (
                        <span className="text-sm">{user.supervisor_name}</span>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>{extraPermissions}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant={hasAccountantRole ? 'destructive' : 'outline'}
                          onClick={() => handleToggleRole(user.id, 'accountant', hasAccountantRole)}
                        >
                          {hasAccountantRole ? (
                            <>
                              <UserMinus className="w-3 h-3 mr-1" />
                              Remover Contador
                            </>
                          ) : (
                            <>
                              <Shield className="w-3 h-3 mr-1" />
                              Adicionar Contador
                            </>
                          )}
                        </Button>
                        
                        <Button
                          size="sm"
                          variant={hasAdminRole ? 'destructive' : 'outline'}
                          onClick={() => handleToggleRole(user.id, 'admin', hasAdminRole)}
                        >
                          {hasAdminRole ? (
                            <>
                              <UserMinus className="w-3 h-3 mr-1" />
                              Remover Admin
                            </>
                          ) : (
                            <>
                              <Shield className="w-3 h-3 mr-1" />
                              Adicionar Admin
                            </>
                          )}
                        </Button>

                        {!hasAdminRole && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteUser(user.id, user.full_name)}
                            title="Deletar usuário permanentemente"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
