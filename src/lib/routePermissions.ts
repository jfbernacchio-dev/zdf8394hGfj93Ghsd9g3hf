import { RoutePermissionsConfig } from '@/types/permissions';

export const routePermissions: RoutePermissionsConfig = {
  // =====================================================
  // ROTAS FINANCEIRAS (bloqueadas para subordinados e contadores)
  // =====================================================
  '/financial': {
    blockedFor: ['subordinate', 'accountant']
  },
  '/nfse/config': {
    blockedFor: ['subordinate', 'accountant']
  },
  '/nfse/history': {
    blockedFor: ['subordinate', 'accountant']
  },
  '/invoice-logs': {
    blockedFor: ['subordinate', 'accountant']
  },
  '/payment-control': {
    blockedFor: ['subordinate', 'accountant']
  },

  // =====================================================
  // GESTÃO DE TERAPEUTAS (só admins/Therapist Full)
  // =====================================================
  '/therapists': {
    allowedFor: ['admin']  // subordinate e accountant bloqueados implicitamente
  },
  '/create-therapist': {
    allowedFor: ['admin']
  },

  // =====================================================
  // WHATSAPP (bloqueado para subordinados e contadores)
  // =====================================================
  '/whatsapp': {
    blockedFor: ['subordinate', 'accountant']
  },

  // =====================================================
  // ADMIN & SEGURANÇA (só admins)
  // =====================================================
  '/admin-settings': {
    allowedFor: ['admin']
  },
  '/audit-logs': {
    allowedFor: ['admin']
  },
  '/security-incidents': {
    allowedFor: ['admin']
  },
  '/log-review': {
    allowedFor: ['admin']
  },
  '/permission-review': {
    allowedFor: ['admin']
  },
  '/backup-tests': {
    allowedFor: ['admin']
  },

  // =====================================================
  // ROTAS CLÍNICAS (bloqueadas só para contadores)
  // NOTA: Rotas com parâmetros dinâmicos (/:id, /:patientId) 
  // herdam a permissão da rota base /patients
  // =====================================================
  '/patients': {
    blockedFor: ['accountant']
  },
  '/patients/new': {
    blockedFor: ['accountant']
  },
  '/schedule': {
    blockedFor: ['accountant']
  },

  // =====================================================
  // DASHBOARD DO CONTADOR (só contadores)
  // =====================================================
  '/accountant-dashboard': {
    allowedFor: ['accountant']
  },

  // =====================================================
  // ROTAS PÚBLICAS/ABERTAS (sem restrições explícitas)
  // =====================================================
  '/dashboard': {},  // Todos autenticados podem
  '/profile-edit': {},
  '/website-metrics': {},  // Vazio por enquanto
};
