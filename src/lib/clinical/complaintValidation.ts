/**
 * ============================================================================
 * FASE C2.4 - Clinical Complaint Validation (Zod Schema)
 * ============================================================================
 * 
 * Schema de validação robusto para Queixa Clínica usando Zod.
 * 
 * Garante que:
 * - Dados obrigatórios estão presentes
 * - Enums estão dentro das opções válidas
 * - Não permite salvar queixa completamente vazia
 */

import { z } from 'zod';

/**
 * ============================================================================
 * SCHEMAS DE SUB-ESTRUTURAS
 * ============================================================================
 */

/**
 * Schema para Sintoma
 */
export const SymptomSchema = z.object({
  symptom_label: z.string().min(1, 'Sintoma deve ter um rótulo'),
  is_present: z.boolean().default(true),
  frequency: z.enum(['raro', 'ocasional', 'frequente', 'constante']).nullable().optional(),
  intensity: z.number().min(1).max(5).nullable().optional(),
  category: z.string().nullable().optional(),
});

/**
 * Schema para Medicação
 */
export const MedicationSchema = z.object({
  class: z.enum([
    'Antidepressivo',
    'Ansiolítico',
    'Antipsicótico',
    'Estabilizador de Humor',
    'Estimulante',
    'Outro'
  ], { errorMap: () => ({ message: 'Classe de medicação inválida' }) }),
  substance: z.string().nullable().optional(),
  dosage: z.string().nullable().optional(),
  frequency: z.string().nullable().optional(),
  start_date: z.string().nullable().optional(),
  end_date: z.string().nullable().optional(),
  is_current: z.boolean().default(true),
  adverse_effects: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

/**
 * ============================================================================
 * SCHEMA PRINCIPAL DE CLINICAL COMPLAINT
 * ============================================================================
 */

export const ClinicalComplaintSchema = z.object({
  // Identificadores
  patient_id: z.string().uuid('ID do paciente inválido'),
  created_by: z.string().uuid('ID do criador inválido'),
  organization_id: z.string().uuid('ID da organização inválido').nullable().optional(),
  
  // Diagnóstico CID-10
  cid_code: z.string().max(10).nullable().optional(),
  cid_title: z.string().max(500).nullable().optional(),
  cid_group: z.string().max(10).nullable().optional(),
  has_no_diagnosis: z.boolean().default(false),
  
  // Caracterização Clínica
  onset_type: z.enum(['agudo', 'insidioso', 'subagudo']).nullable().optional(),
  onset_duration_weeks: z.number().int().min(0).max(1000).nullable().optional(),
  course: z.enum([
    'episódico',
    'contínuo',
    'recorrente',
    'progressivo',
    'em remissão'
  ]).nullable().optional(),
  severity: z.enum(['leve', 'moderado', 'grave', 'psicótico']).nullable().optional(),
  functional_impairment: z.enum([
    'nenhum',
    'mínimo',
    'leve',
    'moderado',
    'grave',
    'incapacitante'
  ]).nullable().optional(),
  
  // Avaliação de Risco
  suicidality: z.enum(['nenhum', 'ideação', 'plano', 'tentativa']).nullable().optional(),
  aggressiveness: z.enum(['nenhum', 'verbal', 'física', 'grave']).nullable().optional(),
  vulnerabilities: z.array(z.string()).nullable().optional(),
  
  // Notas Clínicas
  clinical_notes: z.string().max(10000).nullable().optional(),
  
  // Meta
  is_active: z.boolean().default(true),
  reported_by: z.string().max(100).nullable().optional(),
  
}).refine(
  (data) => {
    // REGRA CRÍTICA: Deve ter pelo menos UM dos seguintes:
    // 1. CID preenchido, OU
    // 2. has_no_diagnosis = true, OU
    // 3. Notas clínicas não vazias (mínimo 20 caracteres)
    
    const hasCID = !!data.cid_code && data.cid_code.trim().length > 0;
    const hasNoDiagnosis = data.has_no_diagnosis === true;
    const hasSignificantNotes = !!data.clinical_notes && data.clinical_notes.trim().length >= 20;
    
    return hasCID || hasNoDiagnosis || hasSignificantNotes;
  },
  {
    message: 'A queixa deve ter pelo menos um CID, marcar "sem diagnóstico", ou conter notas clínicas significativas (mínimo 20 caracteres).',
  }
);

/**
 * Schema completo com sintomas e medicações (usado no form)
 */
export const ClinicalComplaintWithRelationsSchema = z.object({
  complaint: ClinicalComplaintSchema,
  symptoms: z.array(SymptomSchema).optional(),
  medications: z.array(MedicationSchema).optional(),
});

/**
 * ============================================================================
 * TIPOS DERIVADOS
 * ============================================================================
 */

export type ClinicalComplaintInput = z.infer<typeof ClinicalComplaintSchema>;
export type SymptomInput = z.infer<typeof SymptomSchema>;
export type MedicationInput = z.infer<typeof MedicationSchema>;
export type ClinicalComplaintWithRelations = z.infer<typeof ClinicalComplaintWithRelationsSchema>;

/**
 * ============================================================================
 * HELPERS DE VALIDAÇÃO
 * ============================================================================
 */

/**
 * Valida dados de queixa clínica
 * 
 * @param data Dados da queixa
 * @returns Resultado da validação
 */
export function validateClinicalComplaint(data: unknown) {
  return ClinicalComplaintSchema.safeParse(data);
}

/**
 * Valida queixa com sintomas e medicações
 * 
 * @param data Dados completos
 * @returns Resultado da validação
 */
export function validateClinicalComplaintWithRelations(data: unknown) {
  return ClinicalComplaintWithRelationsSchema.safeParse(data);
}

/**
 * Formata erros do Zod de forma amigável para exibição clínica
 * 
 * @param errors Erros do Zod
 * @returns Mensagem legível humanizada (prioriza o erro mais relevante)
 */
export function formatValidationErrors(errors: z.ZodError): string {
  // Priorizar erro de refinamento (regra customizada) se existir
  const refinementError = errors.errors.find(err => err.code === 'custom');
  if (refinementError) {
    return refinementError.message;
  }

  // Caso contrário, pegar o primeiro erro e humanizá-lo
  const firstError = errors.errors[0];
  if (!firstError) return 'Erro de validação desconhecido.';

  // Mapear mensagens técnicas para mensagens clínicas
  const errorMessage = firstError.message;
  
  // Severity
  if (errorMessage.includes('severity')) {
    return 'Preencha o campo de gravidade clínica da queixa.';
  }
  
  // CID/diagnosis
  if (errorMessage.includes('cid') || errorMessage.includes('diagnosis')) {
    return 'Informe um CID, marque "sem diagnóstico" ou adicione notas clínicas significativas (mínimo 20 caracteres).';
  }

  // Medicação
  if (errorMessage.includes('Classe de medicação')) {
    return 'Selecione uma classe válida para a medicação.';
  }

  // IDs inválidos
  if (errorMessage.includes('inválido')) {
    return 'Dados de identificação inválidos. Entre em contato com o suporte.';
  }

  // Fallback: retornar mensagem original se não houver mapeamento
  return errorMessage;
}
