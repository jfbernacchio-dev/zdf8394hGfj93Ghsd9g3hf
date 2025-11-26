/**
 * ============================================================================
 * FASE C2.1 - Clinical Types
 * ============================================================================
 * 
 * Tipos TypeScript para estruturas clínicas.
 * 
 * IMPORTANTE: Estes tipos são específicos do template psicopatológico básico.
 * Quando outros templates forem adicionados, parte destes tipos deve ser
 * generalizada/abstraída.
 */

import type { PsychicFunction } from './constants';

// ========== CLINICAL COMPLAINT ==========

export interface ClinicalComplaintBase {
  id?: string;
  patient_id: string;
  created_by: string;
  created_at?: string;
  updated_at?: string;
  
  // Diagnóstico
  cid_code: string | null;
  cid_title: string | null;
  cid_group: string | null;
  has_no_diagnosis: boolean;
  
  // Caracterização clínica
  onset_type: string | null;
  onset_duration_weeks: number | null;
  course: string | null;
  severity: string | null;
  functional_impairment: string | null;
  
  // Avaliação de risco
  suicidality: string | null;
  aggressiveness: string | null;
  vulnerabilities: string[] | null;
  
  // Meta
  clinical_notes: string | null;
  is_active: boolean;
}

export interface ComplaintSymptom {
  id?: string;
  complaint_id: string;
  symptom_label: string;
  is_present: boolean;
  frequency: string | null;
  intensity: number | null;
  notes: string | null;
}

export interface ComplaintMedication {
  id?: string;
  complaint_id: string;
  class: string;
  substance: string | null;
  dosage: string | null;
  frequency: string | null;
  start_date: string | null;
  end_date: string | null;
  is_current: boolean;
  adverse_effects: string | null;
  notes: string | null;
}

// ========== SESSION EVALUATION ==========

/**
 * Estrutura de dados de consciência (específico template psicopatológico)
 */
export interface ConsciousnessData {
  level: number; // -100 (coma) a +100 (confusão)
  field: number; // -100 (estreitamento) a +100 (expansão)
  self_consciousness: number; // -100 (alienado) a +100 (hiperautoconsciente)
  oriented_auto: boolean;
  disoriented_time: boolean;
  disoriented_space: boolean;
  depersonalization: boolean;
  derealization: boolean;
  notes: string;
}

/**
 * Estrutura de dados de atenção
 */
export interface AttentionData {
  range: number; // 0-100 (amplitude)
  concentration: number; // 0-100
  distractibility: boolean;
  notes: string;
}

/**
 * Estrutura de dados de orientação
 */
export interface OrientationData {
  time: boolean;
  space: boolean;
  person: boolean;
  situation: boolean;
  reality_judgment: string; // Temporariamente string para compatibilidade
  insight: number; // 0-100
  comments: string;
}

/**
 * Estrutura de dados de sensopercepção
 */
export interface SensoperceptionData {
  global_perception: string; // Temporariamente string para compatibilidade
  auditory: boolean;
  visual: boolean;
  tactile: boolean;
  olfactory: boolean;
  kinesthetic: boolean;
  mixed: boolean;
  description: string;
}

/**
 * Estrutura de dados de memória
 */
export interface MemoryData {
  fixation: number; // 0-100
  recall: number; // 0-100
  auditory: boolean;
  hypermnesia: boolean;
  paramnesia: boolean;
  amnesia: boolean;
  phobias: boolean;
  notes: string;
}

/**
 * Estrutura de dados de pensamento
 */
export interface ThoughtData {
  course: number; // -100 (lentificação) a +100 (fuga de ideias)
  tangential: boolean;
  incoherent: boolean;
  dissociated: boolean;
  circumstantial: boolean;
  delusional: boolean;
  obsessive: boolean;
  overvalued: boolean;
  description: string;
}

/**
 * Estrutura de dados de linguagem
 */
export interface LanguageData {
  speech_rate: number; // -100 (muito lento) a +100 (muito rápido)
  articulation: string; // Temporariamente string para compatibilidade
  observations: string;
}

/**
 * Estrutura de dados de humor
 */
export interface MoodData {
  polarity: number; // -100 (depressivo) a +100 (eufórico)
  lability: number; // 0-100 (quanto maior, mais lábil)
  emotional_responsiveness: boolean;
  adequacy: string; // Temporariamente string para compatibilidade
  notes: string;
}

/**
 * Estrutura de dados de vontade
 */
export interface WillData {
  volitional_energy: number; // -100 (abulia) a +100 (hiperbulia)
  ambivalence: boolean;
  impulse_control: number; // -100 (sem controle) a +100 (controle excessivo)
  observations: string;
}

/**
 * Estrutura de dados de psicomotricidade
 */
export interface PsychomotorData {
  motor_activity: number; // -100 (hipoativo) a +100 (hiperativo)
  tone_gestures: string; // Temporariamente string para compatibilidade
  facial_expressiveness: number; // 0-100
  notes: string;
}

/**
 * Estrutura de dados de inteligência
 */
export interface IntelligenceData {
  abstract_reasoning: number; // 0-100
  learning_capacity: number; // 0-100
  adaptive_capacity: string; // Temporariamente string para compatibilidade
  facial_expressivity: number; // 0-100
  notes: string;
}

/**
 * Estrutura de dados de personalidade
 */
export interface PersonalityData {
  self_coherence: number; // 0-100 (coerência do self)
  affective_stability: number; // 0-100 (estabilidade afetiva)
  self_boundaries: string; // Temporariamente string para compatibilidade
  anxious: boolean;
  narcissistic: boolean;
  avoidant: boolean;
  obsessive: boolean;
  borderline: boolean;
  histrionic: boolean;
  antisocial: boolean;
  observations: string;
}

/**
 * Avaliação de sessão completa
 */
export interface SessionEvaluationBase {
  id?: string;
  session_id: string;
  patient_id: string;
  evaluated_by: string;
  created_at?: string;
  updated_at?: string;
  
  // Dados das funções psíquicas (JSONB no banco)
  consciousness_data: ConsciousnessData;
  orientation_data: OrientationData;
  attention_data: AttentionData;
  sensoperception_data: SensoperceptionData;
  memory_data: MemoryData;
  thought_data: ThoughtData;
  language_data: LanguageData;
  mood_data: MoodData;
  will_data: WillData;
  psychomotor_data: PsychomotorData;
  intelligence_data: IntelligenceData;
  personality_data: PersonalityData;
}

// ========== VALIDATION HELPERS ==========

/**
 * Tipo helper para validação de queixa mínima
 */
export interface ComplaintValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Tipo helper para validação de avaliação mínima
 */
export interface EvaluationValidationResult {
  isValid: boolean;
  errors: string[];
  filledFunctionsCount: number;
}
