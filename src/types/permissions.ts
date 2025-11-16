// ============================================================================
// PERMISSION TYPES - Sistema de Permissões Completo
// ============================================================================

/**
 * ROLES BÁSICOS DO SISTEMA
 */
export type UserRole = 'admin' | 'subordinate' | 'accountant';

/**
 * DOMÍNIOS DE PERMISSÃO
 * Define as áreas funcionais do sistema para controle granular
 */
export type PermissionDomain = 
  | 'clinical'      // Dados clínicos (queixas, evoluções, diagnósticos)
  | 'financial'     // Dados financeiros (sessões pagas, valores, NFSe)
  | 'administrative'// Dados administrativos (agendas, bloqueios, notificações)
  | 'patients'      // Gestão de pacientes
  | 'statistics'    // Estatísticas e métricas
  | 'nfse'          // Emissão e gestão de NFSe
  | 'schedule'      // Agenda e horários
  | 'reports';      // Relatórios e exportações

/**
 * NÍVEIS DE ACESSO
 */
export type AccessLevel = 'none' | 'read' | 'write' | 'full';

/**
 * PERMISSÕES ESTENDIDAS DE AUTONOMIA
 * Estrutura que representa todas as configurações de um subordinado
 */
export interface ExtendedAutonomyPermissions {
  // Configurações base (da tabela subordinate_autonomy_settings)
  managesOwnPatients: boolean;      // Gerencia apenas seus pacientes
  hasFinancialAccess: boolean;      // Tem acesso a dados financeiros
  nfseEmissionMode: 'own_company' | 'manager_company';
  
  // Permissões derivadas (calculadas)
  canFullSeeClinic: boolean;        // Pode ver dados clínicos de todos
  includeInFullFinancial: boolean;  // Inclui no fechamento do Full
  canViewFullFinancial: boolean;    // Pode ver fechamento geral
  canViewOwnFinancial: boolean;     // Pode ver suas próprias finanças
  canManageAllPatients: boolean;    // Acesso a todos os pacientes
  canManageOwnPatients: boolean;    // Acesso apenas aos seus
  isFullTherapist: boolean;         // É terapeuta Full
}

/**
 * PERMISSÕES POR DOMÍNIO
 * Define o nível de acesso em cada domínio específico
 */
export interface DomainPermissions {
  clinical: AccessLevel;
  financial: AccessLevel;
  administrative: AccessLevel;
  patients: AccessLevel;
  statistics: AccessLevel;
  nfse: AccessLevel;
  schedule: AccessLevel;
  reports: AccessLevel;
}

/**
 * ESTRUTURA DE PERMISSÃO PARA ROTAS
 */
export interface RoutePermission {
  allowedFor?: UserRole[];
  blockedFor?: UserRole[];
  requiresDomain?: PermissionDomain;
  minimumAccess?: AccessLevel;
}

export type RoutePermissionsConfig = Record<string, RoutePermission>;
