import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { routePermissions } from '@/lib/routePermissions';
import { getUserRoles, checkRoutePermission } from '@/lib/checkPermissions';
import { toast } from 'sonner';

interface PermissionRouteProps {
  children: React.ReactNode;
  path: string;
}

export const PermissionRoute: React.FC<PermissionRouteProps> = ({ 
  children, 
  path 
}) => {
  const { isAdmin, isSubordinate, isAccountant, loading, rolesLoaded } = useAuth();
  const navigate = useNavigate();
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  // OPÇÃO B: Resetar estados quando a rota mudar
  useEffect(() => {
    console.log(`[PermissionRoute] Rota mudou para: ${path}, resetando estados`);
    setPermissionChecked(false);
    setIsRedirecting(false);
  }, [path]);

  console.log(`[PermissionRoute DEBUG] ${path}`, {
    loading,
    rolesLoaded,
    permissionChecked,
    isRedirecting,
    isAdmin,
    isSubordinate,
    isAccountant,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    console.log(`[PermissionRoute useEffect] ${path} - INÍCIO`, { loading, rolesLoaded });
    
    // OPÇÃO A: Aguardar carregamento do auth E dos roles
    if (loading || !rolesLoaded) {
      console.log(`[PermissionRoute useEffect] ${path} - Aguardando auth/roles`, { loading, rolesLoaded });
      return;
    }

    // Obter roles do usuário
    const userRoles = getUserRoles({ isAdmin, isSubordinate, isAccountant });
    console.log(`[PermissionRoute useEffect] ${path} - User roles:`, userRoles);

    // Buscar permissões da rota
    const permission = routePermissions[path];
    console.log(`[PermissionRoute useEffect] ${path} - Permission config:`, permission);

    // Verificar permissão
    const { allowed, reason } = checkRoutePermission(userRoles, permission);
    console.log(`[PermissionRoute useEffect] ${path} - Check result:`, { allowed, reason });

    if (!allowed) {
      console.warn(`[PermissionRoute] Acesso negado: ${path}`, { reason, userRoles });
      
      // Marcar que está redirecionando ANTES de fazer qualquer outra coisa
      setIsRedirecting(true);
      console.log(`[PermissionRoute useEffect] ${path} - Iniciando redirect`);
      
      // Toast de feedback
      toast.error(reason || 'Acesso negado');

      // Redirecionar baseado no role
      const targetRoute = isAccountant ? '/accountant-dashboard' : '/dashboard';
      console.log(`[PermissionRoute useEffect] ${path} - Redirecionando para: ${targetRoute}`);
      navigate(targetRoute, { replace: true });
    } else {
      console.log(`[PermissionRoute useEffect] ${path} - Permissão concedida, marcando como verificado`);
      // Permissão concedida - marcar como verificado
      setPermissionChecked(true);
    }
  }, [loading, rolesLoaded, isAdmin, isSubordinate, isAccountant, path, navigate]);

  // OPÇÃO A: Loading state durante carregamento do auth/roles ou se não verificou permissão
  // OPÇÃO B: Sempre resetar isRedirecting quando path mudar (linha 23)
  if (loading || !rolesLoaded || !permissionChecked || isRedirecting) {
    console.log(`[PermissionRoute RENDER] ${path} - Mostrando loading`, { loading, rolesLoaded, permissionChecked, isRedirecting });
    return (
      <div className="min-h-screen bg-[var(--gradient-soft)] flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  console.log(`[PermissionRoute RENDER] ${path} - Renderizando children`);
  return <>{children}</>;
};
