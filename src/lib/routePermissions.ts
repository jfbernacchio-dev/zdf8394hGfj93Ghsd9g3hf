import { RoutePermissionsConfig } from '@/types/permissions';

/**
 * ============================================================================
 * ROUTE PERMISSIONS CONFIGURATION
 * ============================================================================
 * 
 * Define quais roles têm acesso a cada rota do sistema.
 * 
 * LÓGICA:
 * - allowedFor: Lista branca - usuário DEVE ter um dos roles listados
 * - blockedFor: Lista negra - usuário NÃO PODE ter nenhum dos roles listados
 * - Se ambos definidos: allowedFor tem precedência
 * - Se nenhum definido: rota aberta para todos autenticados
 * 
 * DOMÍNIOS E NÍVEIS DE ACESSO:
 * - Para controle mais granular, algumas rotas especificam requiresDomain e minimumAccess
 * - Isso permite verificar permissões específicas além do role base
 * 
 * ============================================================================
 */

export const routePermissions: RoutePermissionsConfig = {
  // ==================== ROTAS ADMINISTRATIVAS ====================
  // Apenas Admin tem acesso
  '/admin-settings': {
    allowedFor: ['admin'],
  },
  
  '/audit-logs': {
    allowedFor: ['admin'],
  },
  
  '/security-incidents': {
    allowedFor: ['admin'],
  },
  
  '/log-review': {
    allowedFor: ['admin'],
  },
  
  '/permission-review': {
    allowedFor: ['admin'],
  },
  
  '/backup-tests': {
    allowedFor: ['admin'],
  },
  
  '/website-metrics': {
    allowedFor: ['admin'],
  },

  // ==================== GESTÃO DE TERAPEUTAS ====================
  // Admin e Full Therapists (não subordinados) podem gerenciar terapeutas
  '/therapists': {
    blockedFor: ['accountant', 'subordinate'],
  },
  
  '/create-therapist': {
    blockedFor: ['accountant', 'subordinate'],
  },

  '/permissions': {
    blockedFor: ['accountant', 'subordinate'],
  },

  // ==================== DASHBOARD ====================
  // Dashboard específico do contador
  '/accountant-dashboard': {
    allowedFor: ['accountant'],
  },
  
  // Dashboard principal (Admin e Subordinate)
  '/dashboard': {
    blockedFor: ['accountant'],
  },

  // ==================== ROTAS FINANCEIRAS ====================
  // Contador não tem acesso a finanças internas
  // Subordinados só acessam se hasFinancialAccess = true (verificado no componente)
  '/financial': {
    blockedFor: ['accountant'],
    requiresDomain: 'financial',
    minimumAccess: 'read',
  },
  
  '/nfse/config': {
    blockedFor: ['accountant'],
    requiresDomain: 'nfse',
    minimumAccess: 'write',
  },
  
  '/nfse/history': {
    blockedFor: ['accountant'],
    requiresDomain: 'nfse',
    minimumAccess: 'read',
  },
  
  '/invoice-logs': {
    blockedFor: ['accountant'],
    requiresDomain: 'financial',
    minimumAccess: 'read',
  },
  
  '/payment-control': {
    blockedFor: ['accountant'],
    requiresDomain: 'financial',
    minimumAccess: 'write',
  },

  // ==================== ROTAS CLÍNICAS ====================
  // Pacientes acessíveis por Admin e Subordinate (filtragem de dados acontece na query)
  '/patients': {
    blockedFor: ['accountant'],
    requiresDomain: 'patients',
    minimumAccess: 'read',
  },
  
  '/patients/new': {
    blockedFor: ['accountant'],
    requiresDomain: 'patients',
    minimumAccess: 'write',
  },
  
  '/schedule': {
    blockedFor: ['accountant'],
    requiresDomain: 'schedule',
    minimumAccess: 'read',
  },
  
  '/whatsapp': {
    blockedFor: ['accountant'],
    requiresDomain: 'administrative',
    minimumAccess: 'read',
  },

  // ==================== PERFIL ====================
  // Todos autenticados podem editar seu próprio perfil
  '/profile-edit': {
    // Sem restrições - qualquer usuário autenticado pode acessar
  },
};
