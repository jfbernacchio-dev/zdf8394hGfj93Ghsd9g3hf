/**
 * ============================================================================
 * FASE C2.2 - Template Registry
 * ============================================================================
 * 
 * Registro central de todos os templates clínicos disponíveis no sistema.
 * 
 * IMPORTANTE:
 * - Por enquanto só temos psychology_basic (template psicopatológico padrão)
 * - Futuros templates de outras profissões/abordagens serão adicionados aqui
 * - Este é o único lugar onde definimos quais templates existem
 */

import type { ClinicalTemplate, RoleTemplateMapping, ApproachTemplateMapping } from './templateTypes';

/**
 * ============================================================================
 * DEFINIÇÃO DE TEMPLATES DISPONÍVEIS
 * ============================================================================
 */

/**
 * Template Psicopatológico Básico
 * 
 * Usado por: Psicólogos, Psiquiatras (profissionais clínicos padrão)
 * 
 * Features:
 * - Queixa clínica com CID-10, sintomas, medicações
 * - Avaliação de sessão com 12 funções psíquicas
 * - Evolução com gráficos temporais e resumo interpretativo
 */
export const PSYCHOLOGY_BASIC_TEMPLATE: ClinicalTemplate = {
  id: 'psychology_basic',
  type: 'role',
  label: 'Psicopatológico Básico',
  description: 'Template padrão para avaliação psicopatológica com 12 funções psíquicas',
  supportsComplaint: true,
  supportsSessionEvaluation: true,
  supportsEvolution: true,
  version: '1.0.0',
  tags: ['psychology', 'psychiatry', 'psychopathology']
};

/**
 * Template TCC (stub para futuro)
 * 
 * Quando implementado, este template pode ter:
 * - Queixa focada em pensamentos automáticos
 * - Avaliação de sessão com registros cognitivos
 * - Evolução com gráficos de esquemas e distorções
 */
export const TCC_TEMPLATE_STUB: ClinicalTemplate = {
  id: 'tcc',
  type: 'approach',
  label: 'TCC (Terapia Cognitivo-Comportamental)',
  description: 'Template para abordagem TCC (não implementado ainda)',
  supportsComplaint: false,
  supportsSessionEvaluation: false,
  supportsEvolution: false,
  version: '0.1.0',
  tags: ['tcc', 'cognitive', 'behavioral']
};

/**
 * ============================================================================
 * REGISTRO DE TEMPLATES
 * ============================================================================
 */

/**
 * Todos os templates disponíveis no sistema
 */
export const AVAILABLE_TEMPLATES: Record<string, ClinicalTemplate> = {
  psychology_basic: PSYCHOLOGY_BASIC_TEMPLATE,
  tcc: TCC_TEMPLATE_STUB,
};

/**
 * ============================================================================
 * MAPEAMENTOS
 * ============================================================================
 */

/**
 * Mapeamento de professional_role.slug para template ID
 */
export const ROLE_TO_TEMPLATE: Record<string, string> = {
  psychologist: 'psychology_basic',
  psychiatrist: 'psychology_basic',
  psychoanalyst: 'psychology_basic',
  // Roles não clínicos não têm template associado
  // assistant, accountant, etc. → undefined
};

/**
 * Mapeamento de clinical_approach.slug para template ID
 * (Preparado para o futuro, quando tivermos abordagens com templates específicos)
 */
export const APPROACH_TO_TEMPLATE: Record<string, string> = {
  tcc: 'tcc', // stub para futuro
  // Outras abordagens podem ser adicionadas aqui
};

/**
 * Template padrão de fallback (usado quando role não tem mapeamento)
 */
export const DEFAULT_FALLBACK_TEMPLATE_ID = 'psychology_basic';

/**
 * ============================================================================
 * HELPERS DE ACESSO
 * ============================================================================
 */

/**
 * Obtém um template por ID
 */
export function getTemplateById(templateId: string): ClinicalTemplate | null {
  return AVAILABLE_TEMPLATES[templateId] || null;
}

/**
 * Obtém template ID baseado no slug do role
 */
export function getTemplateIdForRole(roleSlug: string): string | null {
  return ROLE_TO_TEMPLATE[roleSlug] || null;
}

/**
 * Obtém template ID baseado no slug da abordagem
 */
export function getTemplateIdForApproach(approachSlug: string): string | null {
  return APPROACH_TO_TEMPLATE[approachSlug] || null;
}

/**
 * Obtém o template de fallback padrão
 */
export function getFallbackTemplate(): ClinicalTemplate {
  return AVAILABLE_TEMPLATES[DEFAULT_FALLBACK_TEMPLATE_ID];
}

/**
 * Verifica se um template está completamente implementado
 */
export function isTemplateFullyImplemented(template: ClinicalTemplate): boolean {
  return template.supportsComplaint && 
         template.supportsSessionEvaluation && 
         template.supportsEvolution;
}
