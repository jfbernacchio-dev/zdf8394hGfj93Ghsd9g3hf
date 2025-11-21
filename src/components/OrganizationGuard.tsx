import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

/**
 * ============================================================================
 * FASE 10.10: Organization Guard
 * ============================================================================
 * 
 * Componente de segurança que bloqueia acesso a páginas protegidas
 * se o usuário não tiver uma organização ativa.
 * 
 * Redireciona automaticamente para /setup-organization.
 * 
 * ============================================================================
 */

interface OrganizationGuardProps {
  children: React.ReactNode;
}

export function OrganizationGuard({ children }: OrganizationGuardProps) {
  const navigate = useNavigate();
  const { organizationId, organizations, loading, rolesLoaded, user } = useAuth();

  useEffect(() => {
    // Esperar loading completo
    if (loading || !rolesLoaded || !user) {
      return;
    }

    // Se não tem organização, redirecionar
    if (!organizationId || !organizations || organizations.length === 0) {
      console.warn('[ORG_GUARD] Usuário sem organização ativa, redirecionando...');
      navigate('/setup-organization', { replace: true });
    }
  }, [organizationId, organizations, loading, rolesLoaded, user, navigate]);

  // Loading state
  if (loading || !rolesLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </Card>
      </div>
    );
  }

  // Sem organização
  if (!organizationId || !organizations || organizations.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="p-8 max-w-lg">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Organização Necessária</AlertTitle>
            <AlertDescription className="mt-2">
              Você precisa criar ou selecionar uma organização para acessar esta página.
            </AlertDescription>
          </Alert>
          <div className="mt-6 flex justify-center">
            <Button onClick={() => navigate('/setup-organization')}>
              Configurar Organização
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Tudo OK, renderizar conteúdo
  return <>{children}</>;
}
