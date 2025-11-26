/**
 * ============================================================================
 * FASE C2.2 - Clinical Template Types
 * ============================================================================
 * 
 * Define os tipos e interfaces do sistema de templates clínicos.
 * 
 * Templates clínicos definem:
 * - Qual estrutura de queixa usar
 * - Quais funções psíquicas avaliar
 * - Como interpretar/visualizar evoluções
 * 
 * Tipos de template:
 * - 'role': baseado no papel profissional (ex: psychology_basic)
 * - 'approach': baseado na abordagem clínica (ex: tcc, junguiana)
 */

/**
 * Tipo de template clínico
 */
export type ClinicalTemplateType = 'role' | 'approach';

/**
 * Interface principal de um template clínico
 */
export interface ClinicalTemplate {
  /** Identificador único do template */
  id: string;
  
  /** Tipo do template (baseado em role ou abordagem) */
  type: ClinicalTemplateType;
  
  /** Nome amigável do template */
  label: string;
  
  /** Descrição opcional do template */
  description?: string;
  
  /** Se este template suporta modelo de Queixa Clínica */
  supportsComplaint: boolean;
  
  /** Se este template suporta Avaliação de Sessão (exame psíquico) */
  supportsSessionEvaluation: boolean;
  
  /** Se este template suporta visualização de Evolução (gráficos/resumos) */
  supportsEvolution: boolean;
  
  /** Versão do template (para futuras migrações) */
  version?: string;
  
  /** Tags para categorização futura */
  tags?: string[];
}

/**
 * Resultado da resolução de templates ativos para um usuário
 */
export interface ActiveTemplatesResult {
  /** Template baseado no papel profissional (role) */
  activeRoleTemplate: ClinicalTemplate | null;
  
  /** Template baseado na abordagem clínica ativa (approach) */
  activeApproachTemplate: ClinicalTemplate | null;
  
  /** Lista de todos os templates ativos (normalmente [role] ou [role, approach]) */
  activeTemplates: ClinicalTemplate[];
  
  /** Flag indicando se houve fallback para template padrão */
  usedFallback: boolean;
}

/**
 * Mapeamento de role profissional para template
 */
export interface RoleTemplateMapping {
  /** Slug do professional_role */
  roleSlug: string;
  
  /** ID do template correspondente */
  templateId: string;
}

/**
 * Mapeamento de abordagem clínica para template
 */
export interface ApproachTemplateMapping {
  /** Slug da clinical_approach */
  approachSlug: string;
  
  /** ID do template correspondente */
  templateId: string;
}
