import { RoutePermission, UserRole } from '@/types/permissions';

interface UserRoles {
  isAdmin: boolean;
  isSubordinate: boolean;
  isAccountant: boolean;
}

/**
 * Converte flags booleanas em array de roles
 */
export function getUserRoles(flags: UserRoles): UserRole[] {
  const roles: UserRole[] = [];
  
  if (flags.isAdmin) roles.push('admin');
  if (flags.isSubordinate) roles.push('subordinate');
  if (flags.isAccountant) roles.push('accountant');
  
  return roles;
}

/**
 * Verifica se usuário tem permissão para acessar rota
 * 
 * Lógica:
 * 1. Se allowedFor existe: usuário DEVE ter um dos roles listados
 * 2. Se blockedFor existe: usuário NÃO PODE ter nenhum dos roles listados
 * 3. Se ambos existem: allowedFor tem precedência
 * 4. Se nenhum existe: permite acesso (rota aberta)
 */
export function checkRoutePermission(
  userRoles: UserRole[],
  permission: RoutePermission | undefined
): { allowed: boolean; reason?: string } {
  // Rota não configurada = permitir acesso
  if (!permission) {
    return { allowed: true };
  }

  const { allowedFor, blockedFor } = permission;

  // REGRA 1: allowedFor (lista branca)
  if (allowedFor && allowedFor.length > 0) {
    const hasAllowedRole = userRoles.some(role => allowedFor.includes(role));
    
    if (!hasAllowedRole) {
      return { 
        allowed: false, 
        reason: `Acesso restrito. Roles permitidos: ${allowedFor.join(', ')}` 
      };
    }
    
    return { allowed: true };
  }

  // REGRA 2: blockedFor (lista negra)
  if (blockedFor && blockedFor.length > 0) {
    const hasBlockedRole = userRoles.some(role => blockedFor.includes(role));
    
    if (hasBlockedRole) {
      return { 
        allowed: false, 
        reason: `Acesso negado para seu perfil` 
      };
    }
    
    return { allowed: true };
  }

  // Sem restrições = permitir
  return { allowed: true };
}
