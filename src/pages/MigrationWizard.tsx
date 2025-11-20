import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, XCircle, AlertCircle, ArrowRight, Users, Database } from 'lucide-react';
import { toast } from 'sonner';

/**
 * ============================================================================
 * PÁGINA: MigrationWizard (FASE 5)
 * ============================================================================
 * 
 * Interface para migração de usuários do sistema antigo de permissões
 * (therapist_assignments + subordinate_autonomy_settings) para o novo
 * sistema de níveis hierárquicos (organization_levels + user_positions).
 * 
 * FUNCIONALIDADES:
 * 1. Visualizar status de migração de todos os usuários
 * 2. Comparar permissões antigas vs novas
 * 3. Migrar usuários individualmente ou em massa
 * 4. Rollback de migrações (quando necessário)
 * 
 * ============================================================================
 */

interface UserMigrationStatus {
  userId: string;
  fullName: string;
  email: string | null;
  isInOldSystem: boolean;
  isInNewSystem: boolean;
  systemStatus: 'old_only' | 'new_only' | 'both' | 'none';
  oldSystemData: {
    isSubordinate: boolean;
    managerId?: string;
    managerName?: string;
    managesOwnPatients?: boolean;
    hasFinancialAccess?: boolean;
  } | null;
  newSystemData: {
    organizationId: string;
    positionId: string;
    positionName: string | null;
    levelNumber: number;
    levelName: string;
    isOwner: boolean;
  } | null;
}

export default function MigrationWizard() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserMigrationStatus[]>([]);
  const [migrating, setMigrating] = useState<string | null>(null);

  // Apenas admins podem acessar
  useEffect(() => {
    if (!isAdmin) {
      toast.error('Acesso negado', {
        description: 'Apenas administradores podem acessar esta página'
      });
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);

  useEffect(() => {
    loadUserStatuses();
  }, []);

  /**
   * Carrega status de migração de todos os usuários
   */
  async function loadUserStatuses() {
    try {
      setLoading(true);

      // 1. Buscar todos os profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name');

      if (profilesError) throw profilesError;

      // 2. Buscar emails - auth admin não disponível no client
      // Vamos buscar apenas dos profiles

      // 3. Buscar dados do sistema antigo (therapist_assignments)
      const { data: assignments, error: assignmentsError } = await supabase
        .from('therapist_assignments')
        .select(`
          subordinate_id,
          manager_id,
          profiles!therapist_assignments_manager_id_fkey (
            full_name
          )
        `);

      if (assignmentsError) throw assignmentsError;

      // 4. Buscar autonomy settings (sistema antigo)
      const { data: autonomySettings, error: autonomyError } = await supabase
        .from('subordinate_autonomy_settings')
        .select('*');

      if (autonomyError) throw autonomyError;

      // 5. Buscar posições organizacionais (sistema novo)
      const { data: userPositions, error: positionsError } = await supabase
        .rpc('get_organization_hierarchy_info', { _user_id: user!.id });

      if (positionsError) console.warn('Erro ao buscar hierarquia:', positionsError);

      // 6. Para cada user, buscar suas informações de hierarquia
      const usersWithStatus = await Promise.all(
        profiles?.map(async (profile) => {
          // Sistema antigo
          const assignment = assignments?.find(a => a.subordinate_id === profile.id);
          const autonomy = autonomySettings?.find(a => a.subordinate_id === profile.id);

          // Sistema novo
          const { data: hierarchyData } = await supabase
            .rpc('get_organization_hierarchy_info', { _user_id: profile.id });

          const hierarchy = hierarchyData?.[0];

          const isInOldSystem = !!assignment;
          const isInNewSystem = !!hierarchy;

          let systemStatus: UserMigrationStatus['systemStatus'] = 'none';
          if (isInOldSystem && isInNewSystem) systemStatus = 'both';
          else if (isInOldSystem) systemStatus = 'old_only';
          else if (isInNewSystem) systemStatus = 'new_only';

          // Email não disponível via client API

          return {
            userId: profile.id,
            fullName: profile.full_name,
            email: null, // Email não disponível via client
            isInOldSystem,
            isInNewSystem,
            systemStatus,
            oldSystemData: isInOldSystem ? {
              isSubordinate: true,
              managerId: assignment?.manager_id,
              managerName: (assignment as any)?.profiles?.full_name,
              managesOwnPatients: autonomy?.manages_own_patients,
              hasFinancialAccess: autonomy?.has_financial_access,
            } : null,
            newSystemData: isInNewSystem ? {
              organizationId: hierarchy.organization_id,
              positionId: hierarchy.position_id,
              positionName: hierarchy.position_name,
              levelNumber: hierarchy.level_number,
              levelName: hierarchy.level_name,
              isOwner: hierarchy.is_owner,
            } : null,
          } as UserMigrationStatus;
        }) || []
      );

      setUsers(usersWithStatus);
    } catch (error) {
      console.error('Erro ao carregar status:', error);
      toast.error('Erro ao carregar dados de migração');
    } finally {
      setLoading(false);
    }
  }

  /**
   * Migra um usuário do sistema antigo para o novo
   */
  async function migrateUser(userId: string) {
    try {
      setMigrating(userId);
      
      const userStatus = users.find(u => u.userId === userId);
      if (!userStatus || !userStatus.oldSystemData) {
        throw new Error('Usuário não encontrado ou não está no sistema antigo');
      }

      // Verificar se já está no novo sistema
      if (userStatus.isInNewSystem) {
        toast.warning('Usuário já está no novo sistema');
        return;
      }

      // 1. Criar organização para o manager (se não existir)
      const managerId = userStatus.oldSystemData.managerId;
      if (!managerId) {
        throw new Error('Manager não encontrado');
      }

      // Buscar se manager já tem organização
      const { data: managerHierarchy } = await supabase
        .rpc('get_organization_hierarchy_info', { _user_id: managerId });

      let organizationId: string;
      let level2Id: string;

      if (managerHierarchy && managerHierarchy.length > 0) {
        // Manager já tem organização
        organizationId = managerHierarchy[0].organization_id;
        
        // Buscar Level 2
        const { data: levels } = await supabase
          .from('organization_levels')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('level_number', 2)
          .single();

        if (!levels) {
          throw new Error('Level 2 não encontrado na organização');
        }

        level2Id = levels.id;
      } else {
        throw new Error('Manager precisa estar migrado primeiro');
      }

      // 2. Criar posição para o subordinado no Level 2
      const { data: newPosition, error: positionError } = await supabase
        .from('organization_positions')
        .insert({
          level_id: level2Id,
          parent_position_id: managerHierarchy[0].position_id,
          position_name: `Subordinado - ${userStatus.fullName}`,
        })
        .select()
        .single();

      if (positionError) throw positionError;

      // 3. Atribuir usuário à posição
      const { error: userPositionError } = await supabase
        .from('user_positions')
        .insert({
          user_id: userId,
          position_id: newPosition.id,
        });

      if (userPositionError) throw userPositionError;

      // 4. Criar permissões no novo sistema baseado no antigo
      const autonomy = userStatus.oldSystemData;
      
      const domains = ['financial', 'administrative', 'clinical', 'media', 'general', 'charts', 'team'];
      
      const permissionsToInsert = domains.map(domain => {
        let accessLevel = 'read';
        
        if (domain === 'financial') {
          accessLevel = autonomy.hasFinancialAccess ? 'write' : 'none';
        } else if (domain === 'team' || domain === 'media') {
          accessLevel = 'none'; // Subordinados não veem team/media
        } else if (domain === 'general') {
          accessLevel = 'full';
        }

        return {
          level_id: level2Id,
          domain,
          access_level: accessLevel,
          manages_own_patients: autonomy.managesOwnPatients || false,
          has_financial_access: autonomy.hasFinancialAccess || false,
          nfse_emission_mode: 'manager_company',
        };
      });

      const { error: permissionsError } = await supabase
        .from('level_permission_sets')
        .insert(permissionsToInsert);

      if (permissionsError) throw permissionsError;

      toast.success('Usuário migrado com sucesso!', {
        description: `${userStatus.fullName} agora usa o novo sistema de permissões`
      });

      // Recarregar dados
      await loadUserStatuses();
    } catch (error) {
      console.error('Erro na migração:', error);
      toast.error('Erro ao migrar usuário', {
        description: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    } finally {
      setMigrating(null);
    }
  }

  /**
   * Estatísticas gerais
   */
  const stats = {
    total: users.length,
    oldOnly: users.filter(u => u.systemStatus === 'old_only').length,
    newOnly: users.filter(u => u.systemStatus === 'new_only').length,
    both: users.filter(u => u.systemStatus === 'both').length,
    none: users.filter(u => u.systemStatus === 'none').length,
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando dados de migração...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Assistente de Migração</h1>
        <p className="text-muted-foreground mt-2">
          Migre usuários do sistema antigo de permissões para o novo sistema de níveis hierárquicos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4" />
              Total de Usuários
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              Sistema Antigo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{stats.oldOnly}</div>
            <p className="text-xs text-muted-foreground mt-1">Necessita migração</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Sistema Novo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.newOnly}</div>
            <p className="text-xs text-muted-foreground mt-1">Já migrados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="h-4 w-4 text-blue-500" />
              Ambos Sistemas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.both}</div>
            <p className="text-xs text-muted-foreground mt-1">Em transição</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert de Instruções */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Managers devem ser migrados antes de seus subordinados. 
          O sistema antigo continua funcionando durante a migração.
        </AlertDescription>
      </Alert>

      {/* Tabs para filtrar usuários */}
      <Tabs defaultValue="old_only">
        <TabsList>
          <TabsTrigger value="old_only">
            Aguardando Migração ({stats.oldOnly})
          </TabsTrigger>
          <TabsTrigger value="new_only">
            Migrados ({stats.newOnly})
          </TabsTrigger>
          <TabsTrigger value="both">
            Em Transição ({stats.both})
          </TabsTrigger>
          <TabsTrigger value="all">
            Todos ({stats.total})
          </TabsTrigger>
        </TabsList>

        {/* Lista de Usuários - Sistema Antigo */}
        <TabsContent value="old_only" className="space-y-4">
          {users.filter(u => u.systemStatus === 'old_only').map(user => (
            <Card key={user.userId}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{user.fullName}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-orange-500 border-orange-500">
                    Sistema Antigo
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Manager</p>
                    <p className="font-medium">{user.oldSystemData?.managerName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Gerencia Próprios Pacientes</p>
                    <p className="font-medium">
                      {user.oldSystemData?.managesOwnPatients ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 inline" />
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Acesso Financeiro</p>
                    <p className="font-medium">
                      {user.oldSystemData?.hasFinancialAccess ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 inline" />
                      )}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-end">
                  <Button
                    onClick={() => migrateUser(user.userId)}
                    disabled={!!migrating}
                  >
                    {migrating === user.userId ? (
                      <>
                        <div className="animate-spin h-4 w-4 border-2 border-background border-t-transparent rounded-full mr-2" />
                        Migrando...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="h-4 w-4 mr-2" />
                        Migrar para Novo Sistema
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {users.filter(u => u.systemStatus === 'old_only').length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-green-500" />
                <p>Todos os usuários do sistema antigo foram migrados!</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Lista de Usuários - Sistema Novo */}
        <TabsContent value="new_only" className="space-y-4">
          {users.filter(u => u.systemStatus === 'new_only').map(user => (
            <Card key={user.userId}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{user.fullName}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-green-500 border-green-500">
                    Sistema Novo
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Posição</p>
                    <p className="font-medium">{user.newSystemData?.positionName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Nível</p>
                    <p className="font-medium">
                      Level {user.newSystemData?.levelNumber} - {user.newSystemData?.levelName}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Owner da Organização</p>
                    <p className="font-medium">
                      {user.newSystemData?.isOwner ? (
                        <CheckCircle2 className="h-4 w-4 text-green-500 inline" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500 inline" />
                      )}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Lista de Usuários - Ambos Sistemas */}
        <TabsContent value="both" className="space-y-4">
          {users.filter(u => u.systemStatus === 'both').map(user => (
            <Card key={user.userId}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{user.fullName}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                  <Badge variant="outline" className="text-blue-500 border-blue-500">
                    Ambos Sistemas
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Este usuário está em ambos os sistemas. O sistema novo terá prioridade.
                    Você pode remover do sistema antigo quando confirmar que tudo está funcionando.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Todos os Usuários */}
        <TabsContent value="all" className="space-y-4">
          {users.map(user => (
            <Card key={user.userId}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{user.fullName}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </div>
                  <Badge 
                    variant="outline" 
                    className={
                      user.systemStatus === 'old_only' ? 'text-orange-500 border-orange-500' :
                      user.systemStatus === 'new_only' ? 'text-green-500 border-green-500' :
                      user.systemStatus === 'both' ? 'text-blue-500 border-blue-500' :
                      ''
                    }
                  >
                    {user.systemStatus === 'old_only' && 'Sistema Antigo'}
                    {user.systemStatus === 'new_only' && 'Sistema Novo'}
                    {user.systemStatus === 'both' && 'Ambos Sistemas'}
                    {user.systemStatus === 'none' && 'Sem Sistema'}
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
