// Define todos os roles possíveis no sistema
export type UserRole = 'admin' | 'subordinate' | 'accountant';

// Define tipos de permissão
export type PermissionType = 'allowedFor' | 'blockedFor';

// Estrutura de permissão para cada rota
export interface RoutePermission {
  allowedFor?: UserRole[];  // Lista branca (só esses podem)
  blockedFor?: UserRole[];  // Lista negra (esses não podem)
}

// Tipo para o objeto completo de configuração
export type RoutePermissionsConfig = Record<string, RoutePermission>;
