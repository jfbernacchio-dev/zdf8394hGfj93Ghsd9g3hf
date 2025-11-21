import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Info, Save, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { PermissionDomain, AccessLevel } from '@/types/permissions';

/**
 * ============================================================================
 * PÁGINA: LevelPermissionsManagement (FASE 3)
 * ============================================================================
 * 
 * Interface para DONOS DE ORGANIZAÇÃO configurarem permissões por nível.
 * 
 * FUNCIONALIDADES:
 * - Visualizar níveis da organização
 * - Configurar permissões por domínio (financial, clinical, administrative, etc)
 * - Configurar settings financeiros (manages_own_patients, has_financial_access)
 * - Aplicar mudanças a TODOS usuários do nível simultaneamente
 * 
 * IMPORTANTE: Sistema novo PARALELO, não afeta sistema antigo ainda
 * ============================================================================
 */

interface OrganizationLevel {
  id: string;
  levelNumber: number;
  levelName: string;
  description: string;
  userCount: number;
}

interface LevelPermissionSet {
  domain: PermissionDomain;
  accessLevel: AccessLevel;
  managesOwnPatients: boolean;
  hasFinancialAccess: boolean;
  nfseEmissionMode: 'own_company' | 'manager_company';
}

const DOMAINS: PermissionDomain[] = [
  'financial',
  'administrative',
  'clinical',
  'media',
  'marketing',
  'general',
  'charts',
  'team',
];

const DOMAIN_LABELS: Record<PermissionDomain, string> = {
  financial: 'Financeiro',
  administrative: 'Administrativo',
  clinical: 'Clínico',
  media: 'Mídia',
  marketing: 'Marketing',
  general: 'Geral',
  charts: 'Gráficos/Estatísticas',
  team: 'Equipe',
};

const ACCESS_LEVELS: AccessLevel[] = ['none', 'read', 'write', 'full'];

const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  none: 'Sem Acesso',
  read: 'Leitura',
  write: 'Leitura + Escrita',
  full: 'Total',
};

export default function LevelPermissionsManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [levels, setLevels] = useState<OrganizationLevel[]>([]);
  const [selectedLevelId, setSelectedLevelId] = useState<string | null>(null);
  const [permissions, setPermissions] = useState<Record<PermissionDomain, LevelPermissionSet>>({} as any);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ============================================================================
  // CARREGAR NÍVEIS DA ORGANIZAÇÃO
  // ============================================================================
  useEffect(() => {
    async function loadLevels() {
      if (!user) return;

      try {
        const { data: levelsData, error: levelsError } = await supabase
          .from('organization_levels')
          .select('*')
          .eq('organization_id', user.id)
          .order('level_number');

        if (levelsError) throw levelsError;

        if (!levelsData || levelsData.length === 0) {
          toast.info('Nenhuma estrutura organizacional encontrada');
          setLoading(false);
          return;
        }

        // Contar usuários por nível
        const levelsWithCount = await Promise.all(
          levelsData.map(async (level) => {
            const { count } = await supabase
              .from('user_positions')
              .select('*', { count: 'exact', head: true })
              .in('position_id', 
                (await supabase
                  .from('organization_positions')
                  .select('id')
                  .eq('level_id', level.id)
                ).data?.map(p => p.id) || []
              );

            return {
              id: level.id,
              levelNumber: level.level_number,
              levelName: level.level_name,
              description: level.description || '',
              userCount: count || 0,
            };
          })
        );

        setLevels(levelsWithCount);
        
        // Auto-selecionar primeiro nível
        if (levelsWithCount.length > 0) {
          setSelectedLevelId(levelsWithCount[0].id);
        }
      } catch (error) {
        console.error('Erro ao carregar níveis:', error);
        toast.error('Erro ao carregar estrutura organizacional');
      } finally {
        setLoading(false);
      }
    }

    loadLevels();
  }, [user]);

  // ============================================================================
  // CARREGAR PERMISSÕES DO NÍVEL SELECIONADO
  // ============================================================================
  useEffect(() => {
    async function loadPermissions() {
      if (!selectedLevelId) return;

      try {
        const { data, error } = await supabase
          .from('level_permission_sets')
          .select('*')
          .eq('level_id', selectedLevelId);

        if (error) throw error;

        // Converter array para objeto indexado por domínio
        const permsObj: Record<PermissionDomain, LevelPermissionSet> = {} as any;
        
        DOMAINS.forEach(domain => {
          const perm = data?.find(p => p.domain === domain);
          
          if (perm) {
            permsObj[domain] = {
              domain: perm.domain as PermissionDomain,
              accessLevel: perm.access_level as AccessLevel,
              managesOwnPatients: perm.manages_own_patients || false,
              hasFinancialAccess: perm.has_financial_access || false,
              nfseEmissionMode: (perm.nfse_emission_mode as 'own_company' | 'manager_company') || 'manager_company',
            };
          } else {
            // Permissão não configurada, usar default
            permsObj[domain] = {
              domain,
              accessLevel: domain === 'general' ? 'full' : 'none',
              managesOwnPatients: false,
              hasFinancialAccess: false,
              nfseEmissionMode: 'manager_company',
            };
          }
        });

        setPermissions(permsObj);
      } catch (error) {
        console.error('Erro ao carregar permissões:', error);
        toast.error('Erro ao carregar permissões do nível');
      }
    }

    loadPermissions();
  }, [selectedLevelId]);

  // ============================================================================
  // SALVAR PERMISSÕES
  // ============================================================================
  async function handleSavePermissions() {
    if (!selectedLevelId) return;

    setSaving(true);
    try {
      // Deletar permissões antigas
      await supabase
        .from('level_permission_sets')
        .delete()
        .eq('level_id', selectedLevelId);

      // Inserir novas permissões
      const permissionsArray = DOMAINS.map(domain => ({
        level_id: selectedLevelId,
        domain,
        access_level: permissions[domain].accessLevel,
        manages_own_patients: permissions[domain].managesOwnPatients,
        has_financial_access: permissions[domain].hasFinancialAccess,
        nfse_emission_mode: permissions[domain].nfseEmissionMode,
      }));

      const { error } = await supabase
        .from('level_permission_sets')
        .insert(permissionsArray);

      if (error) throw error;

      toast.success('Permissões salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar permissões:', error);
      toast.error('Erro ao salvar permissões');
    } finally {
      setSaving(false);
    }
  }

  // ============================================================================
  // HANDLERS DE MUDANÇA
  // ============================================================================
  function handleAccessLevelChange(domain: PermissionDomain, newLevel: AccessLevel) {
    setPermissions(prev => ({
      ...prev,
      [domain]: {
        ...prev[domain],
        accessLevel: newLevel,
      },
    }));
  }

  function handleToggleChange(domain: PermissionDomain, field: 'managesOwnPatients' | 'hasFinancialAccess', value: boolean) {
    setPermissions(prev => ({
      ...prev,
      [domain]: {
        ...prev[domain],
        [field]: value,
      },
    }));
  }

  // ============================================================================
  // RENDER
  // ============================================================================
  const selectedLevel = levels.find(l => l.id === selectedLevelId);

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <Skeleton className="h-12 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (levels.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Nenhuma estrutura organizacional encontrada. Configure sua organização primeiro.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" onClick={() => navigate('/dashboard')} className="mb-2">
            <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
          </Button>
          <h1 className="text-3xl font-bold">Permissões por Nível</h1>
          <p className="text-muted-foreground">Configure as permissões de cada nível organizacional</p>
        </div>
        <Badge variant="outline" className="gap-2">
          <Shield className="h-4 w-4" />
          Sistema Novo (FASE 3)
        </Badge>
      </div>

      {/* Info Alert */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Sistema Paralelo:</strong> Esta configuração ainda não afeta o sistema atual. 
          As mudanças aqui servem para preparar a nova estrutura organizacional.
        </AlertDescription>
      </Alert>

      {/* Seletor de Nível */}
      <Card>
        <CardHeader>
          <CardTitle>Selecione o Nível</CardTitle>
          <CardDescription>
            Escolha o nível hierárquico para configurar suas permissões
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedLevelId || undefined} onValueChange={setSelectedLevelId}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione um nível" />
            </SelectTrigger>
            <SelectContent>
              {levels.map(level => (
                <SelectItem key={level.id} value={level.id}>
                  Nível {level.levelNumber}: {level.levelName} ({level.userCount} usuários)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Configuração de Permissões */}
      {selectedLevel && (
        <Card>
          <CardHeader>
            <CardTitle>
              Permissões: {selectedLevel.levelName}
            </CardTitle>
            <CardDescription>
              Configure o nível de acesso para cada domínio. Alterações se aplicam a todos os {selectedLevel.userCount} usuários deste nível.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Permissões por Domínio */}
            {DOMAINS.map(domain => (
              <div key={domain} className="space-y-4 p-4 border rounded-lg">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-semibold">{DOMAIN_LABELS[domain]}</Label>
                  <Select
                    value={permissions[domain]?.accessLevel}
                    onValueChange={(value) => handleAccessLevelChange(domain, value as AccessLevel)}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCESS_LEVELS.map(level => (
                        <SelectItem key={level} value={level}>
                          {ACCESS_LEVEL_LABELS[level]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Configurações Específicas do Domínio Financial */}
                {domain === 'financial' && (
                  <div className="ml-4 space-y-3 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="manages-own">Gerencia Apenas Próprios Pacientes</Label>
                      <Switch
                        id="manages-own"
                        checked={permissions[domain]?.managesOwnPatients}
                        onCheckedChange={(checked) => handleToggleChange(domain, 'managesOwnPatients', checked)}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="has-financial">Tem Acesso Financeiro Próprio</Label>
                      <Switch
                        id="has-financial"
                        checked={permissions[domain]?.hasFinancialAccess}
                        onCheckedChange={(checked) => handleToggleChange(domain, 'hasFinancialAccess', checked)}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* Botão Salvar */}
            <div className="flex justify-end pt-4">
              <Button onClick={handleSavePermissions} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar Permissões'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
