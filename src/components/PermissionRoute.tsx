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
  const { isAdmin, isSubordinate, isAccountant, loading } = useAuth();
  const navigate = useNavigate();
  const [permissionChecked, setPermissionChecked] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);

  console.log(`[PermissionRoute DEBUG] ${path}`, {
    loading,
    permissionChecked,
    isRedirecting,
    isAdmin,
    isSubordinate,
    isAccountant,
    timestamp: new Date().toISOString()
  });

  useEffect(() => {
    console.log(`[PermissionRoute useEffect] ${path} - INÍCIO`, { loading });
    
    // Aguardar carregamento do auth
    if (loading) {
      console.log(`[PermissionRoute useEffect] ${path} - Aguardando auth`);
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
  }, [loading, isAdmin, isSubordinate, isAccountant, path, navigate]);

  // Loading state durante carregamento do auth ou enquanto redireciona
  if (loading || !permissionChecked || isRedirecting) {
    console.log(`[PermissionRoute RENDER] ${path} - Mostrando loading`, { loading, permissionChecked, isRedirecting });
    return (
      <div className="min-h-screen bg-[var(--gradient-soft)] flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  console.log(`[PermissionRoute RENDER] ${path} - Renderizando children`);
  return <>{children}</>;
};
