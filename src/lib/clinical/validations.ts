/**
 * ============================================================================
 * FASE C2.1 - Clinical Validations
 * ============================================================================
 * 
 * Funções de validação para dados clínicos.
 */

import type { 
  ClinicalComplaintBase, 
  ComplaintValidationResult,
  SessionEvaluationBase,
  EvaluationValidationResult 
} from './types';
import { EVALUATION_MIN_VALIDATION } from './constants';

/**
 * Valida se uma queixa clínica tem dados mínimos suficientes para ser salva
 * 
 * REGRAS:
 * - Deve ter CID (cid_code) OU has_no_diagnosis = true
 * - Não pode ter ambos vazios
 */
export function validateComplaintMinimum(
  complaint: Partial<ClinicalComplaintBase>
): ComplaintValidationResult {
  const errors: string[] = [];

  // Regra principal: CID OU "sem diagnóstico"
  const hasCid = !!complaint.cid_code && complaint.cid_code.trim().length > 0;
  const hasNoDiagnosis = complaint.has_no_diagnosis === true;

  if (!hasCid && !hasNoDiagnosis) {
    errors.push('É necessário selecionar um diagnóstico CID-10 ou marcar "Sem diagnóstico"');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Valida se uma avaliação de sessão tem dados mínimos suficientes para ser salva
 * 
 * REGRAS:
 * - Pelo menos 3 funções psíquicas devem ter dados preenchidos
 * - Uma função é considerada "preenchida" se tiver valores diferentes dos defaults
 *   ou se tiver notas/observações
 */
export function validateEvaluationMinimum(
  evaluation: Partial<SessionEvaluationBase>
): EvaluationValidationResult {
  const errors: string[] = [];
  let filledCount = 0;

  // Helper para verificar se um objeto tem dados diferentes dos defaults
  const hasNonDefaultData = (data: any, notes_field: string): boolean => {
    if (!data) return false;
    
    // Se tem notas/observações preenchidas, conta como preenchido
    const notesKey = notes_field as keyof typeof data;
    if (data[notesKey] && typeof data[notesKey] === 'string' && data[notesKey].trim().length > 0) {
      return true;
    }

    // Verificar se algum campo tem valor diferente do default
    // (simplificado: se não for um objeto vazio ou com todos valores false/0/'')
    const values = Object.values(data);
    return values.some(v => {
      if (typeof v === 'boolean') return v === true;
      if (typeof v === 'number') return v !== 0;
      if (typeof v === 'string') return v.trim().length > 0 && v !== 'normal';
      return false;
    });
  };

  // Checar cada função psíquica
  if (hasNonDefaultData(evaluation.consciousness_data, 'notes')) filledCount++;
  if (hasNonDefaultData(evaluation.orientation_data, 'comments')) filledCount++;
  if (hasNonDefaultData(evaluation.attention_data, 'notes')) filledCount++;
  if (hasNonDefaultData(evaluation.sensoperception_data, 'description')) filledCount++;
  if (hasNonDefaultData(evaluation.memory_data, 'notes')) filledCount++;
  if (hasNonDefaultData(evaluation.thought_data, 'description')) filledCount++;
  if (hasNonDefaultData(evaluation.language_data, 'observations')) filledCount++;
  if (hasNonDefaultData(evaluation.mood_data, 'notes')) filledCount++;
  if (hasNonDefaultData(evaluation.will_data, 'observations')) filledCount++;
  if (hasNonDefaultData(evaluation.psychomotor_data, 'notes')) filledCount++;
  if (hasNonDefaultData(evaluation.intelligence_data, 'notes')) filledCount++;
  if (hasNonDefaultData(evaluation.personality_data, 'observations')) filledCount++;

  if (filledCount < EVALUATION_MIN_VALIDATION.minFunctionsWithData) {
    errors.push(
      `É necessário preencher pelo menos ${EVALUATION_MIN_VALIDATION.minFunctionsWithData} funções psíquicas. ` +
      `Atualmente ${filledCount} funções estão preenchidas.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    filledFunctionsCount: filledCount,
  };
}
