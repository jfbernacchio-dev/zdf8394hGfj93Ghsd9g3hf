import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Settings, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import Layout from '@/components/Layout';

/**
 * ============================================================================
 * FASE 6C-1: Estrutura Visual Placeholder
 * ============================================================================
 * 
 * Esta página renderiza apenas a estrutura visual do organograma.
 * Dados mockados - sem conexão com backend ainda.
 * Drag & drop não funcional ainda.
 */

// Mock data para visualização
const MOCK_LEVELS = [
  {
    id: '1',
    name: 'Nível 1 - Proprietários',
    levelNumber: 1,
    color: 'bg-purple-100 border-purple-300',
    users: [
      { id: 'u1', name: 'João Silva', initials: 'JS', role: 'psychologist' },
      { id: 'u2', name: 'Maria Santos', initials: 'MS', role: 'psychologist' },
    ]
  },
  {
    id: '2',
    name: 'Nível 2 - Coordenação',
    levelNumber: 2,
    color: 'bg-blue-100 border-blue-300',
    users: [
      { id: 'u3', name: 'Pedro Costa', initials: 'PC', role: 'psychologist' },
      { id: 'u4', name: 'Ana Paula', initials: 'AP', role: 'assistant' },
    ]
  },
  {
    id: '3',
    name: 'Nível 3 - Equipe',
    levelNumber: 3,
    color: 'bg-green-100 border-green-300',
    users: [
      { id: 'u5', name: 'Carlos Oliveira', initials: 'CO', role: 'psychologist' },
      { id: 'u6', name: 'Juliana Reis', initials: 'JR', role: 'psychologist' },
      { id: 'u7', name: 'Roberto Lima', initials: 'RL', role: 'assistant' },
    ]
  },
];

const ROLE_LABELS: Record<string, string> = {
  psychologist: 'Psicólogo',
  assistant: 'Assistente',
  accountant: 'Contador',
  admin: 'Admin',
};

export default function OrgManagement() {
  const navigate = useNavigate();
  const [levels] = useState(MOCK_LEVELS);

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

              <Button size="lg" className="gap-2">
                <Plus className="h-4 w-4" />
                Adicionar Nível
              </Button>
            </div>
          </div>
        </div>

        {/* Organogram View */}
        <div className="container mx-auto px-4 py-8">
          <ScrollArea className="w-full">
            <div className="flex gap-6 pb-4" style={{ minWidth: 'fit-content' }}>
              {levels.map((level, index) => (
                <div key={level.id} className="flex-shrink-0">
                  {/* Level Card */}
                  <Card className={`w-[320px] ${level.color} border-2`}>
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg font-semibold">
                            {level.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {level.users.length} membro(s)
                          </p>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          N{level.levelNumber}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {/* Users List */}
                      <div className="space-y-2 min-h-[200px] max-h-[400px] overflow-y-auto">
                        {level.users.map((user) => (
                          <Card
                            key={user.id}
                            className="p-3 cursor-move hover:shadow-md transition-shadow bg-background"
                          >
                            <div className="flex items-center gap-3">
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-primary/10 text-primary font-medium">
                                  {user.initials}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm truncate">
                                  {user.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {ROLE_LABELS[user.role] || user.role}
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))}

                        {level.users.length === 0 && (
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

          {/* Info Section */}
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
                  {levels.reduce((acc, level) => acc + level.users.length, 0)}
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
                  Configurado
                </Badge>
              </CardContent>
            </Card>
          </div>

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
