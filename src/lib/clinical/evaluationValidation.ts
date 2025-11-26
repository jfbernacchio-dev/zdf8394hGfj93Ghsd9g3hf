/**
 * ============================================================================
 * FASE C2.5B - Session Evaluation Validation (Zod)
 * ============================================================================
 * 
 * Schemas de validação robustos para avaliação de sessão.
 * Garante que os dados enviados ao Supabase estão dentro dos ranges esperados
 * e contêm conteúdo clínico mínimo.
 */

import { z } from 'zod';
import { RANGE_BIPOLAR, RANGE_PERCENTILE } from './constants';

/**
 * ============================================================================
 * SUB-SCHEMAS PARA CADA FUNÇÃO PSÍQUICA
 * ============================================================================
 */

export const ConsciousnessSchema = z.object({
  level: z.number().min(RANGE_BIPOLAR.min).max(RANGE_BIPOLAR.max),
  field: z.number().min(RANGE_BIPOLAR.min).max(RANGE_BIPOLAR.max),
  self_consciousness: z.number().min(RANGE_BIPOLAR.min).max(RANGE_BIPOLAR.max),
  oriented_auto: z.boolean(),
  disoriented_time: z.boolean(),
  disoriented_space: z.boolean(),
  depersonalization: z.boolean(),
  derealization: z.boolean(),
  notes: z.string().nullable().optional(),
});

export const OrientationSchema = z.object({
  time: z.boolean(),
  space: z.boolean(),
  person: z.boolean(),
  situation: z.boolean(),
  reality_judgment: z.enum(['intact', 'partially_altered', 'severely_altered', 'compromised', 'absent']),
  insight: z.number().min(RANGE_PERCENTILE.min).max(RANGE_PERCENTILE.max),
  comments: z.string().nullable().optional(),
});

export const AttentionSchema = z.object({
  range: z.number().min(RANGE_PERCENTILE.min).max(RANGE_PERCENTILE.max),
  concentration: z.number().min(RANGE_PERCENTILE.min).max(RANGE_PERCENTILE.max),
  distractibility: z.boolean(),
  notes: z.string().nullable().optional(),
});

export const SensoperceptionSchema = z.object({
  global_perception: z.enum(['normal', 'slightly_altered', 'distortive', 'hallucinatory', 'hiperestesia', 'hipoestesia', 'distorted']),
  auditory: z.boolean(),
  visual: z.boolean(),
  tactile: z.boolean(),
  olfactory: z.boolean(),
  kinesthetic: z.boolean(),
  mixed: z.boolean(),
  description: z.string().nullable().optional(),
});

export const MemorySchema = z.object({
  fixation: z.number().min(RANGE_PERCENTILE.min).max(RANGE_PERCENTILE.max),
  recall: z.number().min(RANGE_PERCENTILE.min).max(RANGE_PERCENTILE.max),
  auditory: z.boolean(),
  hypermnesia: z.boolean(),
  paramnesia: z.boolean(),
  amnesia: z.boolean(),
  phobias: z.boolean(),
  notes: z.string().nullable().optional(),
});

export const ThoughtSchema = z.object({
  course: z.number().min(RANGE_BIPOLAR.min).max(RANGE_BIPOLAR.max),
  tangential: z.boolean(),
  incoherent: z.boolean(),
  dissociated: z.boolean(),
  circumstantial: z.boolean(),
  delusional: z.boolean(),
  obsessive: z.boolean(),
  overvalued: z.boolean(),
  description: z.string().nullable().optional(),
});

export const LanguageSchema = z.object({
  speech_rate: z.number().min(RANGE_BIPOLAR.min).max(RANGE_BIPOLAR.max),
  articulation: z.enum(['normal', 'disartria', 'gagueira', 'mutismo']),
  observations: z.string().nullable().optional(),
});

export const MoodSchema = z.object({
  polarity: z.number().min(RANGE_BIPOLAR.min).max(RANGE_BIPOLAR.max),
  lability: z.number().min(RANGE_PERCENTILE.min).max(RANGE_PERCENTILE.max),
  emotional_responsiveness: z.boolean(),
  adequacy: z.enum(['adequate', 'inadequate', 'incongruent']),
  notes: z.string().nullable().optional(),
});

export const WillSchema = z.object({
  volitional_energy: z.number().min(RANGE_BIPOLAR.min).max(RANGE_BIPOLAR.max),
  ambivalence: z.boolean(),
  impulse_control: z.number().min(RANGE_BIPOLAR.min).max(RANGE_BIPOLAR.max),
  observations: z.string().nullable().optional(),
});

export const PsychomotorSchema = z.object({
  motor_activity: z.number().min(RANGE_BIPOLAR.min).max(RANGE_BIPOLAR.max),
  tone_gestures: z.enum(['normal', 'rigid', 'relaxed', 'bizarre']),
  facial_expressiveness: z.number().min(RANGE_PERCENTILE.min).max(RANGE_PERCENTILE.max),
  notes: z.string().nullable().optional(),
});

export const IntelligenceSchema = z.object({
  abstract_reasoning: z.number().min(RANGE_PERCENTILE.min).max(RANGE_PERCENTILE.max),
  learning_capacity: z.number().min(RANGE_PERCENTILE.min).max(RANGE_PERCENTILE.max),
  adaptive_capacity: z.enum(['normal', 'reduced', 'compromised']),
  facial_expressivity: z.number().min(RANGE_PERCENTILE.min).max(RANGE_PERCENTILE.max),
  notes: z.string().nullable().optional(),
});

export const PersonalitySchema = z.object({
  self_coherence: z.number().min(RANGE_PERCENTILE.min).max(RANGE_PERCENTILE.max),
  affective_stability: z.number().min(RANGE_PERCENTILE.min).max(RANGE_PERCENTILE.max),
  self_boundaries: z.enum(['normal', 'poorly_defined', 'diffuse']),
  anxious: z.boolean(),
  narcissistic: z.boolean(),
  avoidant: z.boolean(),
  obsessive: z.boolean(),
  borderline: z.boolean(),
  histrionic: z.boolean(),
  antisocial: z.boolean(),
  observations: z.string().nullable().optional(),
});

/**
 * ============================================================================
 * SCHEMA PRINCIPAL
 * ============================================================================
 */

const BaseSessionEvaluationSchema = z.object({
  session_id: z.string().uuid('ID de sessão inválido'),
  patient_id: z.string().uuid('ID de paciente inválido'),
  evaluated_by: z.string().uuid('ID de avaliador inválido'),
  organization_id: z.string().uuid('ID de organização inválido').nullable().optional(),
  
  consciousness_data: ConsciousnessSchema,
  orientation_data: OrientationSchema,
  attention_data: AttentionSchema,
  sensoperception_data: SensoperceptionSchema,
  memory_data: MemorySchema,
  thought_data: ThoughtSchema,
  language_data: LanguageSchema,
  mood_data: MoodSchema,
  will_data: WillSchema,
  psychomotor_data: PsychomotorSchema,
  intelligence_data: IntelligenceSchema,
  personality_data: PersonalitySchema,
});

/**
 * Helper para verificar se uma função psíquica tem conteúdo clínico significativo
 */
function hasClinicalContent(functionData: any, defaultData: any): boolean {
  // Se há notas/comments/observations/description com mais de 10 caracteres
  const textFields = ['notes', 'comments', 'observations', 'description'];
  for (const field of textFields) {
    if (functionData[field] && typeof functionData[field] === 'string' && functionData[field].length > 10) {
      return true;
    }
  }
  
  // Verificar se algum valor numérico difere do default
  for (const key of Object.keys(functionData)) {
    if (typeof functionData[key] === 'number' && functionData[key] !== defaultData[key]) {
      return true;
    }
  }
  
  // Verificar se algum boolean difere do default
  for (const key of Object.keys(functionData)) {
    if (typeof functionData[key] === 'boolean' && functionData[key] !== defaultData[key]) {
      return true;
    }
  }
  
  // Verificar se algum enum difere do default
  for (const key of Object.keys(functionData)) {
    if (typeof functionData[key] === 'string' && functionData[key] !== defaultData[key]) {
      return true;
    }
  }
  
  return false;
}

/**
 * Schema com validação de conteúdo mínimo (pelo menos 3 funções preenchidas)
 */
export const SessionEvaluationSchema = BaseSessionEvaluationSchema.refine(
  (data) => {
    const { DEFAULT_EVALUATION_VALUES } = require('./constants');
    
    const functionsWithContent = [
      hasClinicalContent(data.consciousness_data, DEFAULT_EVALUATION_VALUES.consciousness),
      hasClinicalContent(data.orientation_data, DEFAULT_EVALUATION_VALUES.orientation),
      hasClinicalContent(data.attention_data, DEFAULT_EVALUATION_VALUES.attention),
      hasClinicalContent(data.sensoperception_data, DEFAULT_EVALUATION_VALUES.sensoperception),
      hasClinicalContent(data.memory_data, DEFAULT_EVALUATION_VALUES.memory),
      hasClinicalContent(data.thought_data, DEFAULT_EVALUATION_VALUES.thought),
      hasClinicalContent(data.language_data, DEFAULT_EVALUATION_VALUES.language),
      hasClinicalContent(data.mood_data, DEFAULT_EVALUATION_VALUES.mood),
      hasClinicalContent(data.will_data, DEFAULT_EVALUATION_VALUES.will),
      hasClinicalContent(data.psychomotor_data, DEFAULT_EVALUATION_VALUES.psychomotor),
      hasClinicalContent(data.intelligence_data, DEFAULT_EVALUATION_VALUES.intelligence),
      hasClinicalContent(data.personality_data, DEFAULT_EVALUATION_VALUES.personality),
    ].filter(Boolean).length;
    
    return functionsWithContent >= 3;
  },
  {
    message: 'Preencha pelo menos três áreas da avaliação com dados clínicos significativos.',
  }
);

/**
 * ============================================================================
 * HELPERS DE VALIDAÇÃO
 * ============================================================================
 */

export interface EvaluationValidationResult {
  isValid: boolean;
  errors: string[];
  filledFunctionsCount?: number;
}

/**
 * Valida uma avaliação de sessão e retorna resultado estruturado
 */
export function validateSessionEvaluation(data: any): EvaluationValidationResult {
  const validation = SessionEvaluationSchema.safeParse(data);
  
  if (validation.success) {
    return {
      isValid: true,
      errors: [],
    };
  }
  
  return {
    isValid: false,
    errors: validation.error.errors.map(err => {
      const path = err.path.join('.');
      return `${path}: ${err.message}`;
    }),
  };
}

/**
 * Formata erros de validação para exibição amigável ao usuário
 */
export function formatValidationErrors(zodError: z.ZodError): string[] {
  return zodError.errors.map(err => {
    // Para erros de refinement (validação customizada), retornar a mensagem direta
    if (err.code === 'custom') {
      return err.message;
    }
    
    // Para erros de campo específico, incluir o caminho
    const fieldPath = err.path.join(' → ');
    return fieldPath ? `${fieldPath}: ${err.message}` : err.message;
  });
}
