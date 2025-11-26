/**
 * ============================================================================
 * FASE C2.1 - Clinical Constants
 * ============================================================================
 * 
 * Constantes centralizadas para o sistema clínico.
 * 
 * IMPORTANTE: Estes valores são específicos do template psicopatológico básico
 * (psicólogos/psiquiatras). Quando outros templates forem adicionados, estas
 * constantes devem ser movidas para o template específico.
 */

// ========== RANGES PADRÃO ==========

/**
 * Range bipolar: -100 a +100
 * Usado para: consciência (nível, campo, auto), pensamento (curso),
 * vontade (energia volitiva), psicomotricidade (atividade motora), humor (polaridade)
 */
export const RANGE_BIPOLAR = {
  min: -100,
  max: 100,
  neutral: 0,
} as const;

/**
 * Range percentil: 0 a 100
 * Usado para: atenção (amplitude, concentração), memória (fixação, evocação),
 * orientação (insight), inteligência (raciocínio, capacidade de aprendizado),
 * personalidade (coerência do self, estabilidade afetiva)
 */
export const RANGE_PERCENTILE = {
  min: 0,
  max: 100,
  optimal: 80,
} as const;

/**
 * Range de intensidade de sintomas: 1 a 5
 */
export const SYMPTOM_INTENSITY_RANGE = {
  min: 1,
  max: 5,
  default: 3,
} as const;

// ========== FUNÇÕES PSÍQUICAS (DALGALARRONDO) ==========

/**
 * Lista oficial das 12 funções psíquicas conforme modelo de Dalgalarrondo
 * 
 * Ordem hierárquica:
 * 1. Consciência (base para todas as demais)
 * 2. Orientação
 * 3. Atenção
 * 4. Sensopercepção
 * 5. Memória
 * 6. Pensamento
 * 7. Linguagem
 * 8. Humor
 * 9. Vontade
 * 10. Psicomotricidade
 * 11. Inteligência
 * 12. Personalidade
 */
export const PSYCHIC_FUNCTIONS = [
  'consciousness',
  'orientation',
  'attention',
  'sensoperception',
  'memory',
  'thought',
  'language',
  'mood',
  'will',
  'psychomotor',
  'intelligence',
  'personality',
] as const;

export type PsychicFunction = typeof PSYCHIC_FUNCTIONS[number];

/**
 * Labels legíveis das funções psíquicas
 */
export const PSYCHIC_FUNCTION_LABELS: Record<PsychicFunction, string> = {
  consciousness: 'Consciência',
  orientation: 'Orientação',
  attention: 'Atenção',
  sensoperception: 'Sensopercepção',
  memory: 'Memória',
  thought: 'Pensamento',
  language: 'Linguagem',
  mood: 'Humor',
  will: 'Vontade',
  psychomotor: 'Psicomotricidade',
  intelligence: 'Inteligência',
  personality: 'Personalidade',
};

// ========== VALIDAÇÕES MÍNIMAS ==========

/**
 * Critério mínimo para considerar uma queixa clínica válida:
 * - Deve ter CID OU has_no_diagnosis = true
 * - Não pode ter ambos vazios
 */
export const COMPLAINT_MIN_VALIDATION = {
  requiresCidOrNoDiagnosis: true,
} as const;

/**
 * Critério mínimo para considerar uma avaliação de sessão válida:
 * - Pelo menos 3 funções psíquicas com dados preenchidos
 */
export const EVALUATION_MIN_VALIDATION = {
  minFunctionsWithData: 3,
} as const;

// ========== DEFAULTS ==========

/**
 * Valores padrão para campos de queixa clínica
 */
export const DEFAULT_COMPLAINT_VALUES = {
  is_active: true,
  has_no_diagnosis: false,
  severity: null,
  functional_impairment: null,
  suicidality: 'nenhum',
  aggressiveness: 'nenhum',
} as const;

/**
 * Valores padrão para campos de avaliação de sessão
 * (específicos do template psicopatológico)
 */
export const DEFAULT_EVALUATION_VALUES = {
  consciousness: {
    level: 0,
    field: 0,
    self_consciousness: 0,
    oriented_auto: false,
    disoriented_time: false,
    disoriented_space: false,
    depersonalization: false,
    derealization: false,
    notes: '',
  },
  attention: {
    range: 80,
    concentration: 80,
    distractibility: false,
    notes: '',
  },
  orientation: {
    time: true,
    space: true,
    person: true,
    situation: true,
    reality_judgment: 'intact',
    insight: 80,
    comments: '',
  },
  memory: {
    fixation: 80,
    recall: 80,
    auditory: false,
    hypermnesia: false,
    paramnesia: false,
    amnesia: false,
    phobias: false,
    notes: '',
  },
  mood: {
    polarity: 0,
    lability: 50,
    emotional_responsiveness: true,
    adequacy: 'adequate',
    notes: '',
  },
  thought: {
    course: 0,
    tangential: false,
    incoherent: false,
    dissociated: false,
    circumstantial: false,
    delusional: false,
    obsessive: false,
    overvalued: false,
    description: '',
  },
  language: {
    speech_rate: 0,
    articulation: 'normal',
    observations: '',
  },
  sensoperception: {
    global_perception: 'normal',
    auditory: false,
    visual: false,
    tactile: false,
    olfactory: false,
    kinesthetic: false,
    mixed: false,
    description: '',
  },
  will: {
    volitional_energy: 0,
    ambivalence: false,
    impulse_control: 0,
    observations: '',
  },
  psychomotor: {
    motor_activity: 0,
    tone_gestures: 'normal',
    facial_expressiveness: 50,
    notes: '',
  },
  intelligence: {
    abstract_reasoning: 80,
    learning_capacity: 80,
    adaptive_capacity: 'normal',
    facial_expressivity: 50,
    notes: '',
  },
  personality: {
    self_coherence: 80,
    affective_stability: 80,
    self_boundaries: 'normal',
    anxious: false,
    narcissistic: false,
    avoidant: false,
    obsessive: false,
    borderline: false,
    histrionic: false,
    antisocial: false,
    observations: '',
  },
} as const;
