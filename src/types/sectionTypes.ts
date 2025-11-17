// ============================================================================
// SECTION TYPES - FASE 1
// ============================================================================
// Define configurações de seções que contêm cards, incluindo domínios
// de permissão para controle de visibilidade automático.

import type { PermissionDomain, UserRole } from './permissions';

/**
 * Configuração de permissão para seções
 * Define quais usuários podem ver uma seção inteira
 */
export interface SectionPermissionConfig {
  /**
   * Domínio principal da seção
   * Determina a categoria de dados exibidos
   */
  primaryDomain: PermissionDomain;
  
  /**
   * Domínios secundários aceitos nesta seção
   * Permite cards de outros domínios compatíveis
   */
  secondaryDomains?: PermissionDomain[];
  
  /**
   * Roles bloqueadas para esta seção
   * A seção não será exibida para estas roles
   */
  blockedFor?: UserRole[];
  
  /**
   * Se true, a seção só mostra dados do próprio usuário
   * Usado para subordinados que gerenciam apenas próprios pacientes
   */
  requiresOwnDataOnly?: boolean;
}

/**
 * Configuração completa de uma seção
 * Define ID, nome, descrição e permissões
 */
export interface SectionConfig {
  /**
   * ID único da seção (usado no localStorage)
   */
  id: string;
  
  /**
   * Nome exibido da seção
   */
  name: string;
  
  /**
   * Descrição da seção
   */
  description?: string;
  
  /**
   * Configuração de permissões da seção
   */
  permissionConfig: SectionPermissionConfig;
  
  /**
   * IDs dos cards disponíveis nesta seção
   * Serão filtrados automaticamente por permissões
   */
  availableCardIds: string[];
  
  /**
   * Altura padrão da seção (em px)
   */
  defaultHeight?: number;
  
  /**
   * Se true, a seção é colapsável
   */
  collapsible?: boolean;
  
  /**
   * Se true, a seção inicia colapsada
   */
  startCollapsed?: boolean;
}

/**
 * EXEMPLO DE USO:
 * 
 * const dashboardSections: SectionConfig[] = [
 *   {
 *     id: 'dashboard-financial-section',
 *     name: 'Métricas Financeiras',
 *     description: 'Receita, pagamentos e NFSe',
 *     permissionConfig: {
 *       primaryDomain: 'financial',
 *       requiresOwnDataOnly: true,
 *     },
 *     availableCardIds: [
 *       'dashboard-revenue-month',
 *       'dashboard-revenue-total',
 *       'dashboard-chart-revenue-trend',
 *       'dashboard-nfse-summary',
 *     ],
 *     defaultHeight: 400,
 *   },
 *   {
 *     id: 'dashboard-clinical-section',
 *     name: 'Visão Clínica',
 *     description: 'Pacientes e atendimentos',
 *     permissionConfig: {
 *       primaryDomain: 'clinical',
 *       secondaryDomains: ['administrative'], // Permite cards administrativos
 *       requiresOwnDataOnly: true,
 *     },
 *     availableCardIds: [
 *       'dashboard-total-patients',
 *       'dashboard-sessions-month',
 *       'dashboard-chart-session-types',
 *     ],
 *     defaultHeight: 400,
 *   },
 *   {
 *     id: 'dashboard-media-section',
 *     name: 'Marketing e Mídia',
 *     description: 'Google Ads, SEO e analytics',
 *     permissionConfig: {
 *       primaryDomain: 'media',
 *       blockedFor: ['subordinate'], // Subordinados não veem marketing
 *     },
 *     availableCardIds: [
 *       'dashboard-google-ads-performance',
 *       'dashboard-website-traffic',
 *       'dashboard-conversion-rate',
 *     ],
 *     defaultHeight: 300,
 *   },
 * ];
 */

/**
 * Type helper para páginas com seções
 */
export type PageSectionsConfig = Record<string, SectionConfig[]>;

/**
 * EXEMPLO DE CONFIGURAÇÃO DE PÁGINA:
 * 
 * export const DASHBOARD_SECTIONS: PageSectionsConfig = {
 *   'dashboard': [
 *     // ... seções do dashboard
 *   ],
 *   'patient-detail': [
 *     // ... seções do detalhe do paciente
 *   ],
 * };
 */
