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

/**
 * ============================================================================
 * FASE 6C-2: Conectar níveis reais do banco
 * ============================================================================
 * 
 * Esta página agora busca organization_levels do Supabase.
 * Usuários ainda são placeholder (virão na FASE 6C-3).
 * Drag & drop ainda não funcional (virá na FASE 6C-4).
 */

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
  assistant: 'Assistente',
  accountant: 'Contador',
  admin: 'Admin',
};

export default function OrgManagement() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Query para buscar níveis reais do banco
  const { data: levels, isLoading } = useQuery({
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
                              0 membro(s)
                            </p>
                          </div>
                          <Badge variant="outline" className="ml-2">
                            N{level.level_number}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        {/* Users List - Placeholder vazio por enquanto */}
                        <div className="space-y-2 min-h-[200px] max-h-[400px] overflow-y-auto">
                          <div className="flex flex-col items-center justify-center py-12 text-center">
                            <Users className="h-12 w-12 text-muted-foreground/50 mb-3" />
                            <p className="text-sm text-muted-foreground">
                              Nenhum membro neste nível
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              (Usuários serão conectados na próxima fase)
                            </p>
                          </div>
                        </div>

                      <Separator />

                      {/* Actions */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full gap-2"
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
                    0
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    (Usuários virão na FASE 6C-3)
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
                <li>• <strong>Arrastar e soltar:</strong> Mova membros entre níveis para reorganizar a hierarquia</li>
                <li>• <strong>Gerenciar Permissões:</strong> Configure as permissões específicas de cada nível</li>
                <li>• <strong>Adicionar Nível:</strong> Crie novos níveis hierárquicos conforme necessário</li>
                <li>• <strong>Visualização:</strong> A estrutura mostra claramente quem está em cada nível</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
