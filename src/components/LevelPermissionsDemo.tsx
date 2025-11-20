import { useLevelPermissions } from '@/hooks/useLevelPermissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Shield, Users, TrendingUp } from 'lucide-react';
import { AccessLevel } from '@/types/permissions';

/**
 * ============================================================================
 * COMPONENTE: LevelPermissionsDemo (FASE 3)
 * ============================================================================
 * 
 * Componente de demonstração do novo sistema de permissões por nível.
 * Exibe as permissões e informações hierárquicas do usuário logado.
 * 
 * OBJETIVO: Validar que o hook useLevelPermissions está funcionando
 * ============================================================================
 */

const ACCESS_LEVEL_COLORS: Record<AccessLevel, string> = {
  none: 'bg-gray-500',
  read: 'bg-blue-500',
  write: 'bg-yellow-500',
  full: 'bg-green-500',
};

const ACCESS_LEVEL_LABELS: Record<AccessLevel, string> = {
  none: 'Sem Acesso',
  read: 'Leitura',
  write: 'Escrita',
  full: 'Total',
};

export function LevelPermissionsDemo() {
  const { levelPermissions, levelInfo, loading, isOrganizationOwner, error } = useLevelPermissions();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Permissões por Nível (Carregando...)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Shield className="h-5 w-5" />
            Erro ao Carregar Permissões
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Permissões por Nível (Sistema Novo)
        </CardTitle>
        <CardDescription>
          Visualização das permissões baseadas no seu nível organizacional
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações Hierárquicas */}
        {levelInfo && (
          <div className="space-y-2 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Posição:</span>
              <Badge variant="outline">{levelInfo.positionName || 'Sem nome'}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Nível:</span>
              <Badge variant="outline">
                <TrendingUp className="h-3 w-3 mr-1" />
                {levelInfo.levelNumber} - {levelInfo.levelName}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Tipo:</span>
              <Badge variant={isOrganizationOwner ? 'default' : 'secondary'}>
                {isOrganizationOwner ? 'Proprietário' : 'Membro'}
              </Badge>
            </div>
            {levelInfo.directSuperiorUserId && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Superior Direto:</span>
                <Badge variant="outline">
                  <Users className="h-3 w-3 mr-1" />
                  Sim
                </Badge>
              </div>
            )}
          </div>
        )}

        {/* Permissões por Domínio */}
        {levelPermissions && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold">Permissões por Domínio:</h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(levelPermissions).map(([domain, value]) => {
                if (typeof value === 'string' && ['none', 'read', 'write', 'full'].includes(value)) {
                  const accessLevel = value as AccessLevel;
                  return (
                    <div key={domain} className="flex items-center justify-between p-2 border rounded">
                      <span className="text-xs font-medium capitalize">{domain}</span>
                      <Badge className={ACCESS_LEVEL_COLORS[accessLevel]}>
                        {ACCESS_LEVEL_LABELS[accessLevel]}
                      </Badge>
                    </div>
                  );
                }
                return null;
              })}
            </div>
          </div>
        )}

        {/* Configurações Financeiras */}
        {levelPermissions && (
          <div className="space-y-2 p-3 border rounded-lg">
            <h4 className="text-sm font-semibold">Configurações Financeiras:</h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Gerencia próprios pacientes:</span>
                <Badge variant={levelPermissions.managesOwnPatients ? 'default' : 'secondary'}>
                  {levelPermissions.managesOwnPatients ? 'Sim' : 'Não'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Acesso financeiro próprio:</span>
                <Badge variant={levelPermissions.hasFinancialAccess ? 'default' : 'secondary'}>
                  {levelPermissions.hasFinancialAccess ? 'Sim' : 'Não'}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Emissão NFSe:</span>
                <Badge variant="outline">
                  {levelPermissions.nfseEmissionMode === 'own_company' ? 'Empresa Própria' : 'Empresa do Gestor'}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Sem posição organizacional */}
        {!levelInfo && (
          <div className="p-4 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
            Usuário sem posição organizacional configurada.
            <br />
            <span className="text-xs">(Usando permissões full padrão durante migração)</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
