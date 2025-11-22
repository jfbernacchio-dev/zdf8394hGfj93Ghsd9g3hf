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
  const { 
    organizationId, 
    organizations, 
    loading, 
    rolesLoaded, 
    organizationsLoading, // FASE 11.3.1
    user 
  } = useAuth();

  useEffect(() => {
    console.log('[ORG_GUARD] 🔍 Verificando estado', {
      loading,
      rolesLoaded,
      organizationsLoading,
      user: user?.id,
      organizationId,
      organizationsCount: organizations?.length,
      pathname: window.location.pathname
    });

    // ✅ REGRA 1: Esperar TODOS os loadings terminarem
    if (loading || !rolesLoaded || organizationsLoading) {
      console.log('[ORG_GUARD] ⏳ Ainda carregando, aguardando...');
      return;
    }

    // ✅ REGRA 2: Se não há usuário, não fazemos nada (ProtectedRoute já cuida)
    if (!user) {
      console.log('[ORG_GUARD] ⚠️ Sem usuário autenticado');
      return;
    }

    // ✅ REGRA 3: Se tem organizações mas organizationId está null, não redirecionar
    // (AuthContext deve resolver automaticamente)
    if (organizations && organizations.length > 0 && !organizationId) {
      console.warn('[ORG_GUARD] ⚠️ Tem orgs mas organizationId null - aguardando resolução automática', {
        organizations: organizations.map(o => ({ id: o.id, name: o.legal_name }))
      });
      return;
    }

    // ✅ REGRA 4: Só redirecionar se REALMENTE não há organizações
    // APÓS todos os loadings terminarem
    if (organizations && organizations.length === 0 && !organizationId) {
      console.error('[ORG_GUARD] 🚫 REDIRECIONANDO para /setup-organization', {
        reason: 'Usuário sem organizações após loading completo',
        userId: user.id,
        email: user.email,
        organizationId,
        organizationsCount: 0,
        loading,
        rolesLoaded,
        organizationsLoading
      });
      navigate('/setup-organization', { replace: true });
      return;
    }

    console.log('[ORG_GUARD] ✅ Validação OK, permitindo acesso', {
      organizationId,
      organizationsCount: organizations?.length
    });
  }, [organizationId, organizations, loading, rolesLoaded, organizationsLoading, user, navigate]);

  // ✅ Loading state - mostrar enquanto QUALQUER coisa está carregando
  if (loading || !rolesLoaded || organizationsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">
            {loading && 'Carregando autenticação...'}
            {!loading && !rolesLoaded && 'Carregando perfil...'}
            {!loading && rolesLoaded && organizationsLoading && 'Carregando organizações...'}
          </p>
        </Card>
      </div>
    );
  }

  // ✅ Sem organização (APENAS após loading completo)
  if (organizations && organizations.length === 0 && !organizationId) {
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

  // ✅ Tudo OK, renderizar conteúdo
  return <>{children}</>;
}
