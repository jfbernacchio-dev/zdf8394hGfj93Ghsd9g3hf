import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Permission {
  domain: string;
  access_level: string;
}

interface PermissionsPreviewProps {
  levelName: string;
  permissions: Permission[];
}

const getAccessLevelColor = (level: string) => {
  switch (level) {
    case 'full':
      return 'bg-green-500/20 text-green-700 dark:text-green-300';
    case 'view':
      return 'bg-blue-500/20 text-blue-700 dark:text-blue-300';
    case 'none':
      return 'bg-gray-500/20 text-gray-700 dark:text-gray-300';
    default:
      return 'bg-primary/20 text-primary';
  }
};

const translateDomain = (domain: string) => {
  const translations: Record<string, string> = {
    financial: 'Financeiro',
    clinical: 'Clínico',
    team: 'Equipe',
    administrative: 'Administrativo',
    reports: 'Relatórios',
    settings: 'Configurações',
    patients: 'Pacientes'
  };
  return translations[domain] || domain;
};

const translateAccessLevel = (level: string) => {
  const translations: Record<string, string> = {
    full: 'Completo',
    view: 'Visualizar',
    none: 'Nenhum',
    edit: 'Editar'
  };
  return translations[level] || level;
};

export const PermissionsPreview = ({ levelName, permissions }: PermissionsPreviewProps) => {
  return (
    <Card className="absolute left-full ml-4 top-0 z-50 w-64 shadow-lg border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm">Permissões - {levelName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {permissions.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nenhuma permissão configurada</p>
        ) : (
          permissions.map((perm) => (
            <div key={perm.domain} className="flex items-center justify-between">
              <span className="text-xs font-medium">{translateDomain(perm.domain)}</span>
              <Badge className={`text-xs ${getAccessLevelColor(perm.access_level)}`}>
                {translateAccessLevel(perm.access_level)}
              </Badge>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
};
