/**
 * ============================================================================
 * FASE C2.3 - Psychopathology Basic Template (Main Export)
 * ============================================================================
 * 
 * Template Psicopatológico Básico - definição declarativa completa.
 * 
 * Este template formaliza o que o sistema já faz hoje em:
 * - Queixa Clínica (ClinicalComplaintForm + clinical_complaints)
 * - Avaliação de Sessão (SessionEvaluationForm + session_evaluations)
 * - Evolução Clínica (ClinicalEvolution)
 * 
 * IMPORTANTE:
 * - Esta é uma camada declarativa, NÃO substitui as telas atuais
 * - Será usada nas fases C2.4, C2.5 e C2.6 para tornar as telas template-aware
 * - Por enquanto, é apenas documentação formal da estrutura existente
 */

import { COMPLAINT_MODEL_CONFIG } from './complaintModel';
import { SESSION_EVALUATION_MODEL_CONFIG } from './sessionEvaluationModel';
import { EVOLUTION_MODEL_CONFIG } from './evolutionModel';
import * as EvolutionInterpreter from './evolutionInterpreter';

/**
 * ============================================================================
 * CONFIGURAÇÃO COMPLETA DO TEMPLATE PSICOPATOLÓGICO BÁSICO
 * ============================================================================
 */

export interface PsychopathologyBasicTemplateConfig {
  /** Configuração do modelo de Queixa Clínica */
  complaintModel: typeof COMPLAINT_MODEL_CONFIG;
  
  /** Configuração do modelo de Avaliação de Sessão */
  sessionEvaluationModel: typeof SESSION_EVALUATION_MODEL_CONFIG;
  
  /** Configuração do modelo de Evolução */
  evolutionModel: typeof EVOLUTION_MODEL_CONFIG;
  
  /** Interpreter para evolução clínica */
  evolutionInterpreter: typeof EvolutionInterpreter;
  
  /** Metadados do template */
  metadata: {
    version: string;
    lastUpdated: string;
    author: string;
  };
}

/**
 * Template Psicopatológico Básico - Configuração Completa
 * 
 * USO FUTURO (C2.4 a C2.7):
 * - C2.4: ClinicalComplaintForm usará complaintModel
 * - C2.5: SessionEvaluationForm usará sessionEvaluationModel
 * - C2.6: ClinicalEvolution usará evolutionModel
 * - C2.7: Patient Overview cards filtrarão por este template
 */
export const PSYCHOPATHOLOGY_BASIC_TEMPLATE_CONFIG: PsychopathologyBasicTemplateConfig = {
  complaintModel: COMPLAINT_MODEL_CONFIG,
  sessionEvaluationModel: SESSION_EVALUATION_MODEL_CONFIG,
  evolutionModel: EVOLUTION_MODEL_CONFIG,
  evolutionInterpreter: EvolutionInterpreter,
  metadata: {
    version: '1.0.0',
    lastUpdated: '2025-01-26',
    author: 'TRACK C2 - Clinical Templates System',
  },
};

/**
 * ============================================================================
 * EXPORTS
 * ============================================================================
 */

// Re-export dos modelos individuais
export * from './complaintModel';
export * from './sessionEvaluationModel';
export * from './evolutionModel';
export * from './evolutionInterpreter';
export * from './fieldTypes';

// Export padrão
export default PSYCHOPATHOLOGY_BASIC_TEMPLATE_CONFIG;
