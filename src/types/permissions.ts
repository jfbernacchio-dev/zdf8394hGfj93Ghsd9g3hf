// ============================================================================
// PERMISSION TYPES - Sistema de Permissões Completo
// ============================================================================

/**
 * ROLES BÁSICOS DO SISTEMA
 */
export type UserRole = 'admin' | 'fulltherapist' | 'subordinate' | 'accountant';

/**
 * DOMÍNIOS DE PERMISSÃO - FASE 1
 * Define as áreas funcionais do sistema para controle granular
 * 
 * IMPORTANTE: Cards estatísticos são classificados pela ORIGEM dos dados,
 * não por serem "estatísticos". Ex: um gráfico de receita é 'financial'.
 */
export type PermissionDomain = 
  | 'financial'       // Valores, NFSe, pagamentos, métricas financeiras
  | 'administrative'  // Sessões, agenda, notificações, métricas administrativas
  | 'clinical'        // Queixas, evoluções, diagnósticos, métricas clínicas
  | 'media'           // Google Ads, website, analytics, métricas de marketing
  | 'general'         // Sem restrição (contato, perfil, informações básicas)
  | 'charts'          // FASE 2B: Seção especial que agrega gráficos de todos os domínios
  | 'team';           // Dados dos subordinados (equipe)

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
 * PERMISSÕES POR DOMÍNIO - FASE 1
 * Define o nível de acesso em cada domínio específico
 */
export interface DomainPermissions {
  financial: AccessLevel;
  administrative: AccessLevel;
  clinical: AccessLevel;
  media: AccessLevel;
  general: AccessLevel;
  charts: AccessLevel;
  team: AccessLevel;
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
