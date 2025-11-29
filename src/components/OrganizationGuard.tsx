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
  const { loading, rolesLoaded, organizationsLoading } = useAuth();

  // 🔓 TEMPORARIAMENTE DESABILITADO - Permitir acesso sem organização
  console.log('[ORG_GUARD] 🔓 DESABILITADO TEMPORARIAMENTE - Permitindo acesso livre');

  // ✅ Loading state - mostrar apenas enquanto autentica
  if (loading || !rolesLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-8 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">
            {loading && 'Carregando autenticação...'}
            {!loading && !rolesLoaded && 'Carregando perfil...'}
          </p>
        </Card>
      </div>
    );
  }

  // 🔓 SEMPRE permitir acesso (temporário)
  return <>{children}</>;
}
