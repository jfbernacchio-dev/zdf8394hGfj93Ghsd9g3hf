import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { routePermissions } from '@/lib/routePermissions';
import { checkRoutePermission, getUserRoles } from '@/lib/checkPermissions';
import { useSubordinatePermissions } from '@/hooks/useSubordinatePermissions';
import type { PermissionDomain, AccessLevel } from '@/types/permissions';

/**
 * ============================================================================
 * COMPONENT: PermissionRoute
 * ============================================================================
 * 
 * Componente de proteção de rotas baseado em roles E permissões de domínio.
 * 
 * FLUXO:
 * 1. Verifica autenticação (já feito por ProtectedRoute no App.tsx)
 * 2. Carrega roles do usuário (admin, subordinate, accountant)
 * 3. Carrega permissões de subordinado (se aplicável)
 * 4. Verifica permissão de rota baseado em:
 *    - allowedFor / blockedFor (role-based)
 *    - requiresDomain + minimumAccess (permission-based)
 * 5. Redireciona se acesso negado
 * 
 * CASOS ESPECIAIS:
 * - Admin: sempre tem acesso total a todos os domínios
 * - Subordinate: acesso baseado em subordinate_autonomy_settings
 * - Accountant: bloqueado de rotas clínicas/financeiras
 * 
 * ============================================================================
 */

interface PermissionRouteProps {
  children: React.ReactNode;
  path: string;
}

export function PermissionRoute({ children, path }: PermissionRouteProps) {
  const { user, isAdmin, isFullTherapist, isSubordinate, isAccountant, rolesLoaded } = useAuth();
  const { permissions, loading: permissionsLoading } = useSubordinatePermissions();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Aguardar carregamento de autenticação e roles
    if (!user || !rolesLoaded) {
      return;
    }

    // Aguardar carregamento de permissões de subordinado (se aplicável)
    if (isSubordinate && permissionsLoading) {
      return;
    }

    // 🔍 LOG DIAGNÓSTICO: Estado completo no PermissionRoute
    console.log('====================================');
    console.log('🔍 [PermissionRoute] VERIFICAÇÃO DE ACESSO');
    console.log('====================================');
    console.log('Path tentado:', path);
    console.log('User ID:', user?.id);
    console.log('rolesLoaded:', rolesLoaded);
    console.log('Flags de autenticação:');
    console.log('  - isAdmin:', isAdmin);
    console.log('  - isFullTherapist:', isFullTherapist);
    console.log('  - isSubordinate:', isSubordinate);
    console.log('  - isAccountant:', isAccountant);
    
    // Obter roles do usuário
    const userRoles = getUserRoles({ 
      isAdmin, 
      isFullTherapist,
      isSubordinate, 
      isAccountant 
    });

    console.log('User roles calculadas:', userRoles);

    // Buscar configuração da rota
    const routeConfig = routePermissions[path];
    console.log('Configuração da rota:', JSON.stringify(routeConfig, null, 2));

    // ETAPA 1: Verificar permissão baseada em ROLE (allowedFor/blockedFor)
    const roleCheck = checkRoutePermission(userRoles, routeConfig);
    
    console.log('Resultado da verificação:');
    console.log('  - allowed:', roleCheck.allowed);
    console.log('  - reason:', roleCheck.reason);
    console.log('====================================');
    
    if (!roleCheck.allowed) {
      console.log('❌ [PermissionRoute] ACESSO NEGADO!');
      console.log(`Path: ${path}`);
      console.log(`Razão: ${roleCheck.reason}`);
      console.log('====================================');
      
      setHasPermission(false);
      setIsRedirecting(true);
      
      toast({
        title: "Acesso negado",
        description: roleCheck.reason || "Você não tem permissão para acessar esta página.",
        variant: "destructive",
      });

      // Redirecionar para dashboard apropriado
      const targetDashboard = isAccountant ? '/accountant-dashboard' : '/dashboard';
      navigate(targetDashboard, { replace: true });
      return;
    }
    
    console.log('✅ [PermissionRoute] ACESSO PERMITIDO!');
    console.log('====================================');

    // ETAPA 2: Verificar permissão baseada em DOMÍNIO (se especificado)
    if (routeConfig?.requiresDomain && routeConfig?.minimumAccess) {
      const domain = routeConfig.requiresDomain as PermissionDomain;
      const minAccess = routeConfig.minimumAccess as AccessLevel;

      // Admin sempre tem acesso total
      if (isAdmin) {
        setHasPermission(true);
        return;
      }

      // Subordinado: verificar permissões específicas
      if (isSubordinate && permissions) {
        const domainAccess = getDomainAccess(domain, permissions);
        const hasAccess = checkAccessLevel(domainAccess, minAccess);

        if (!hasAccess) {
          console.log(`[PermissionRoute] Insufficient domain access for ${path}: requires ${minAccess} on ${domain}, has ${domainAccess}`);
          setHasPermission(false);
          setIsRedirecting(true);
          
          toast({
            title: "Acesso restrito",
            description: "Você não tem permissão suficiente para acessar esta funcionalidade.",
            variant: "destructive",
          });

          navigate('/dashboard', { replace: true });
          return;
        }
      }
    }

    // Acesso permitido
    setHasPermission(true);
  }, [user, rolesLoaded, isAdmin, isSubordinate, isAccountant, permissionsLoading, permissions, path, navigate, toast]);

  // Loading state
  if (!user || !rolesLoaded || (isSubordinate && permissionsLoading) || hasPermission === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Redirecting state - mostra loading enquanto redireciona
  if (isRedirecting || !hasPermission) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Redirecionando...</p>
        </div>
      </div>
    );
  }

  // Render protected content
  return <>{children}</>;
}

/**
 * Mapeia domínio para nível de acesso com base nas permissões do subordinado
 */
function getDomainAccess(
  domain: PermissionDomain,
  permissions: ReturnType<typeof useSubordinatePermissions>['permissions']
): AccessLevel {
  if (!permissions) return 'none';

  switch (domain) {
    case 'financial':
    case 'nfse':
      return permissions.hasFinancialAccess ? 'full' : 'none';
    
    case 'patients':
      return permissions.canManageAllPatients ? 'full' : 
             permissions.canManageOwnPatients ? 'read' : 'none';
    
    case 'clinical':
      return permissions.canFullSeeClinic ? 'full' : 
             permissions.canManageOwnPatients ? 'read' : 'none';
    
    case 'schedule':
    case 'administrative':
      // Subordinados sempre têm acesso read a agenda e administrativo
      return 'read';
    
    case 'statistics':
    case 'reports':
      // Relatórios seguem mesma regra de finanças
      return permissions.hasFinancialAccess ? 'read' : 'none';
    
    default:
      return 'none';
  }
}

/**
 * Verifica se o nível de acesso atual atende ao mínimo requerido
 */
function checkAccessLevel(current: AccessLevel, required: AccessLevel): boolean {
  const levels: AccessLevel[] = ['none', 'read', 'write', 'full'];
  const currentIndex = levels.indexOf(current);
  const requiredIndex = levels.indexOf(required);
  
  return currentIndex >= requiredIndex;
}
