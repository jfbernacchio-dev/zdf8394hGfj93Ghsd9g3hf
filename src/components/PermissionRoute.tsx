import React, { useEffect } from 'react';
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

  useEffect(() => {
    // Aguardar carregamento do auth
    if (loading) return;

    // Obter roles do usuário
    const userRoles = getUserRoles({ isAdmin, isSubordinate, isAccountant });

    // Buscar permissões da rota
    const permission = routePermissions[path];

    // Verificar permissão
    const { allowed, reason } = checkRoutePermission(userRoles, permission);

    if (!allowed) {
      console.warn(`[PermissionRoute] Acesso negado: ${path}`, { reason, userRoles });
      
      // Toast de feedback
      toast.error(reason || 'Acesso negado');

      // Redirecionar baseado no role
      if (isAccountant) {
        navigate('/accountant-dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [loading, isAdmin, isSubordinate, isAccountant, path, navigate]);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--gradient-soft)] flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  // Verificação síncrona antes de renderizar
  const userRoles = getUserRoles({ isAdmin, isSubordinate, isAccountant });
  const permission = routePermissions[path];
  const { allowed } = checkRoutePermission(userRoles, permission);

  if (!allowed) {
    return null; // Não renderiza nada enquanto redireciona
  }

  return <>{children}</>;
};
