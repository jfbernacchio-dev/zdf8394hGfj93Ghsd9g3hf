import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffectivePermissions } from '@/hooks/useEffectivePermissions';
import { useToast } from '@/hooks/use-toast';
import { routePermissions } from '@/lib/routePermissions';
import { checkRoutePermission, getUserRoles } from '@/lib/checkPermissions';
import type { PermissionDomain, AccessLevel } from '@/types/permissions';
import type { EffectivePermissions } from '@/lib/resolveEffectivePermissions';

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
  const { user, rolesLoaded, roleGlobal, isClinicalProfessional } = useAuth();
  const effective = useEffectivePermissions();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Derive flags from new permission system
  const isAdmin = roleGlobal === 'admin';
  const isAccountant = roleGlobal === 'accountant';
  const isAssistant = roleGlobal === 'assistant';
  const isPsychologist = roleGlobal === 'psychologist';
  
  // Subordinate: assistant or accountant roles
  const isSubordinate = isAssistant || isAccountant;
  // Full therapist: psychologist role (not subordinate)
  const isFullTherapist = isPsychologist;
  
  // Effective clinical flag with fallback for compatibility
  // Se isClinicalProfessional vier undefined/null, usa roleGlobal === 'psychologist' como fallback
  const effectiveIsClinicalProfessional =
    typeof isClinicalProfessional === 'boolean'
      ? isClinicalProfessional
      : roleGlobal === 'psychologist';
  
  const permissionsLoading = effective.loading;
  const permissions = effective.permissions;

  useEffect(() => {
    // Aguardar carregamento de autenticação e roles
    if (!user || !rolesLoaded) {
      return;
    }

    // Aguardar carregamento de permissões de subordinado (se aplicável)
    if (isSubordinate && permissionsLoading) {
      return;
    }
    
    // Obter roles do usuário
    const userRoles = getUserRoles({ 
      isAdmin, 
      isFullTherapist,
      isSubordinate, 
      isAccountant,
      isClinicalProfessional: effectiveIsClinicalProfessional
    });

    // Buscar configuração da rota
    const routeConfig = routePermissions[path];

    // ETAPA 1: Verificar permissão baseada em ROLE (allowedFor/blockedFor)
    const roleCheck = checkRoutePermission(userRoles, routeConfig);
    
    if (!roleCheck.allowed) {
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
  }, [user, rolesLoaded, isAdmin, isSubordinate, isAccountant, permissionsLoading, permissions, path, navigate, toast, isFullTherapist, effectiveIsClinicalProfessional]);

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
 * Mapeia domínio para nível de acesso com base nas permissões efetivas
 */
function getDomainAccess(
  domain: PermissionDomain,
  permissions: EffectivePermissions | null
): AccessLevel {
  if (!permissions) return 'none';

  switch (domain) {
    case 'financial':
      return permissions.financialAccess as AccessLevel;
    
    case 'clinical':
      return permissions.canAccessClinical ? 'full' : 'none';
    
    case 'administrative':
      return 'read';
    
    case 'media':
      return 'none';
    
    case 'general':
      return 'read';
    
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
