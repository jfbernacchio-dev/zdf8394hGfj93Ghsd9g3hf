/**
 * ============================================================================
 * FASE C2.3 - Psychopathology Basic - Session Evaluation Model
 * ============================================================================
 * 
 * Definição declarativa da estrutura de Avaliação de Sessão (Exame Psíquico)
 * no template psicopatológico.
 * 
 * Reflete exatamente as 12 funções psíquicas de Dalgalarrondo como estão
 * implementadas em SessionEvaluationForm e session_evaluations.
 */

import type { FieldConfig } from './fieldTypes';
import { 
  RANGE_BIPOLAR, 
  RANGE_PERCENTILE, 
  PSYCHIC_FUNCTIONS,
  DEFAULT_EVALUATION_VALUES 
} from '@/lib/clinical/constants';
import type { PsychicFunction } from '@/lib/clinical/constants';

/**
 * ============================================================================
 * CONFIGURAÇÃO DE UMA FUNÇÃO PSÍQUICA
 * ============================================================================
 */

export interface PsychicFunctionConfig {
  /** ID da função (ex: 'consciousness', 'mood') */
  id: PsychicFunction;
  
  /** Nome legível (ex: 'Consciência', 'Humor') */
  label: string;
  
  /** Descrição da função */
  description?: string;
  
  /** Campos da função */
  fields: Record<string, FieldConfig>;
  
  /** Valores padrão (JSONB completo) */
  defaults: any;
  
  /** Ordem de exibição */
  order: number;
}

/**
 * ============================================================================
 * DEFINIÇÃO DAS 12 FUNÇÕES PSÍQUICAS
 * ============================================================================
 */

/**
 * 1. CONSCIÊNCIA
 */
export const CONSCIOUSNESS_FUNCTION: PsychicFunctionConfig = {
  id: 'consciousness',
  label: 'Consciência',
  description: 'Estado de vigilância e campo da consciência',
  order: 1,
  fields: {
    level: {
      type: 'bipolar',
      label: 'Nível',
      min: RANGE_BIPOLAR.min,
      max: RANGE_BIPOLAR.max,
      defaultValue: 0,
      description: 'De coma (-100) a confusão (+100)',
    },
    field: {
      type: 'bipolar',
      label: 'Campo',
      min: RANGE_BIPOLAR.min,
      max: RANGE_BIPOLAR.max,
      defaultValue: 0,
      description: 'De estreitamento (-100) a expansão (+100)',
    },
    self_consciousness: {
      type: 'bipolar',
      label: 'Autoconsciência',
      min: RANGE_BIPOLAR.min,
      max: RANGE_BIPOLAR.max,
      defaultValue: 0,
      description: 'De alienado (-100) a hiperautoconsciente (+100)',
    },
    oriented_auto: {
      type: 'boolean',
      label: 'Orientado Auto',
      defaultValue: false,
    },
    disoriented_time: {
      type: 'boolean',
      label: 'Desorientado Tempo',
      defaultValue: false,
    },
    disoriented_space: {
      type: 'boolean',
      label: 'Desorientado Espaço',
      defaultValue: false,
    },
    depersonalization: {
      type: 'boolean',
      label: 'Despersonalização',
      defaultValue: false,
    },
    derealization: {
      type: 'boolean',
      label: 'Desrealização',
      defaultValue: false,
    },
    notes: {
      type: 'text',
      label: 'Observações',
      defaultValue: '',
    },
  },
  defaults: DEFAULT_EVALUATION_VALUES.consciousness,
};

/**
 * 2. ORIENTAÇÃO
 */
export const ORIENTATION_FUNCTION: PsychicFunctionConfig = {
  id: 'orientation',
  label: 'Orientação',
  description: 'Orientação no tempo, espaço, pessoa e situação',
  order: 2,
  fields: {
    time: {
      type: 'boolean',
      label: 'Orientado no Tempo',
      defaultValue: true,
    },
    space: {
      type: 'boolean',
      label: 'Orientado no Espaço',
      defaultValue: true,
    },
    person: {
      type: 'boolean',
      label: 'Orientado quanto à Pessoa',
      defaultValue: true,
    },
    situation: {
      type: 'boolean',
      label: 'Orientado quanto à Situação',
      defaultValue: true,
    },
    reality_judgment: {
      type: 'enum',
      label: 'Juízo de Realidade',
      enumOptions: ['intact', 'compromised', 'absent'],
      defaultValue: 'intact',
    },
    insight: {
      type: 'unipolar',
      label: 'Insight',
      min: RANGE_PERCENTILE.min,
      max: RANGE_PERCENTILE.max,
      defaultValue: 80,
      description: 'Capacidade de crítica sobre o próprio estado',
    },
    comments: {
      type: 'text',
      label: 'Comentários',
      defaultValue: '',
    },
  },
  defaults: DEFAULT_EVALUATION_VALUES.orientation,
};

/**
 * 3. ATENÇÃO
 */
export const ATTENTION_FUNCTION: PsychicFunctionConfig = {
  id: 'attention',
  label: 'Atenção',
  description: 'Amplitude e concentração da atenção',
  order: 3,
  fields: {
    range: {
      type: 'unipolar',
      label: 'Amplitude',
      min: RANGE_PERCENTILE.min,
      max: RANGE_PERCENTILE.max,
      defaultValue: 80,
    },
    concentration: {
      type: 'unipolar',
      label: 'Concentração',
      min: RANGE_PERCENTILE.min,
      max: RANGE_PERCENTILE.max,
      defaultValue: 80,
    },
    distractibility: {
      type: 'boolean',
      label: 'Distraibilidade',
      defaultValue: false,
    },
    notes: {
      type: 'text',
      label: 'Observações',
      defaultValue: '',
    },
  },
  defaults: DEFAULT_EVALUATION_VALUES.attention,
};

/**
 * 4. SENSOPERCEPÇÃO
 */
export const SENSOPERCEPTION_FUNCTION: PsychicFunctionConfig = {
  id: 'sensoperception',
  label: 'Sensopercepção',
  description: 'Percepção sensorial e presença de alucinações',
  order: 4,
  fields: {
    global_perception: {
      type: 'enum',
      label: 'Percepção Global',
      enumOptions: ['normal', 'hiperestesia', 'hipoestesia', 'distorted'],
      defaultValue: 'normal',
    },
    auditory: {
      type: 'boolean',
      label: 'Alucinação Auditiva',
      defaultValue: false,
    },
    visual: {
      type: 'boolean',
      label: 'Alucinação Visual',
      defaultValue: false,
    },
    tactile: {
      type: 'boolean',
      label: 'Alucinação Tátil',
      defaultValue: false,
    },
    olfactory: {
      type: 'boolean',
      label: 'Alucinação Olfativa',
      defaultValue: false,
    },
    kinesthetic: {
      type: 'boolean',
      label: 'Alucinação Cinestésica',
      defaultValue: false,
    },
    mixed: {
      type: 'boolean',
      label: 'Alucinação Mista',
      defaultValue: false,
    },
    description: {
      type: 'text',
      label: 'Descrição',
      defaultValue: '',
    },
  },
  defaults: DEFAULT_EVALUATION_VALUES.sensoperception,
};

/**
 * 5. MEMÓRIA
 */
export const MEMORY_FUNCTION: PsychicFunctionConfig = {
  id: 'memory',
  label: 'Memória',
  description: 'Fixação e evocação de memórias',
  order: 5,
  fields: {
    fixation: {
      type: 'unipolar',
      label: 'Fixação',
      min: RANGE_PERCENTILE.min,
      max: RANGE_PERCENTILE.max,
      defaultValue: 80,
      description: 'Capacidade de formar novas memórias',
    },
    recall: {
      type: 'unipolar',
      label: 'Evocação',
      min: RANGE_PERCENTILE.min,
      max: RANGE_PERCENTILE.max,
      defaultValue: 80,
      description: 'Capacidade de recuperar memórias',
    },
    auditory: {
      type: 'boolean',
      label: 'Alucinação Auditiva de Memória',
      defaultValue: false,
    },
    hypermnesia: {
      type: 'boolean',
      label: 'Hipermnésia',
      defaultValue: false,
    },
    paramnesia: {
      type: 'boolean',
      label: 'Paramnésia',
      defaultValue: false,
    },
    amnesia: {
      type: 'boolean',
      label: 'Amnésia',
      defaultValue: false,
    },
    phobias: {
      type: 'boolean',
      label: 'Fobias',
      defaultValue: false,
    },
    notes: {
      type: 'text',
      label: 'Observações',
      defaultValue: '',
    },
  },
  defaults: DEFAULT_EVALUATION_VALUES.memory,
};

/**
 * 6. PENSAMENTO
 */
export const THOUGHT_FUNCTION: PsychicFunctionConfig = {
  id: 'thought',
  label: 'Pensamento',
  description: 'Curso e conteúdo do pensamento',
  order: 6,
  fields: {
    course: {
      type: 'bipolar',
      label: 'Curso',
      min: RANGE_BIPOLAR.min,
      max: RANGE_BIPOLAR.max,
      defaultValue: 0,
      description: 'De lentificação (-100) a fuga de ideias (+100)',
    },
    tangential: {
      type: 'boolean',
      label: 'Tangencial',
      defaultValue: false,
    },
    incoherent: {
      type: 'boolean',
      label: 'Incoerente',
      defaultValue: false,
    },
    dissociated: {
      type: 'boolean',
      label: 'Dissociado',
      defaultValue: false,
    },
    circumstantial: {
      type: 'boolean',
      label: 'Circunstancial',
      defaultValue: false,
    },
    delusional: {
      type: 'boolean',
      label: 'Delirante',
      defaultValue: false,
    },
    obsessive: {
      type: 'boolean',
      label: 'Obsessivo',
      defaultValue: false,
    },
    overvalued: {
      type: 'boolean',
      label: 'Ideias Supervalorizadas',
      defaultValue: false,
    },
    description: {
      type: 'text',
      label: 'Descrição',
      defaultValue: '',
    },
  },
  defaults: DEFAULT_EVALUATION_VALUES.thought,
};

/**
 * 7. LINGUAGEM
 */
export const LANGUAGE_FUNCTION: PsychicFunctionConfig = {
  id: 'language',
  label: 'Linguagem',
  description: 'Características da fala e linguagem',
  order: 7,
  fields: {
    speech_rate: {
      type: 'bipolar',
      label: 'Velocidade da Fala',
      min: RANGE_BIPOLAR.min,
      max: RANGE_BIPOLAR.max,
      defaultValue: 0,
      description: 'De muito lento (-100) a muito rápido (+100)',
    },
    articulation: {
      type: 'enum',
      label: 'Articulação',
      enumOptions: ['normal', 'disartria', 'gagueira', 'mutismo'],
      defaultValue: 'normal',
    },
    observations: {
      type: 'text',
      label: 'Observações',
      defaultValue: '',
    },
  },
  defaults: DEFAULT_EVALUATION_VALUES.language,
};

/**
 * 8. HUMOR
 */
export const MOOD_FUNCTION: PsychicFunctionConfig = {
  id: 'mood',
  label: 'Humor',
  description: 'Estado afetivo predominante',
  order: 8,
  fields: {
    polarity: {
      type: 'bipolar',
      label: 'Polaridade',
      min: RANGE_BIPOLAR.min,
      max: RANGE_BIPOLAR.max,
      defaultValue: 0,
      description: 'De depressivo (-100) a eufórico (+100)',
    },
    lability: {
      type: 'unipolar',
      label: 'Labilidade',
      min: RANGE_PERCENTILE.min,
      max: RANGE_PERCENTILE.max,
      defaultValue: 50,
      description: 'Quanto maior, mais lábil',
    },
    emotional_responsiveness: {
      type: 'boolean',
      label: 'Responsividade Emocional',
      defaultValue: true,
    },
    adequacy: {
      type: 'enum',
      label: 'Adequação',
      enumOptions: ['adequate', 'inadequate', 'incongruent'],
      defaultValue: 'adequate',
    },
    notes: {
      type: 'text',
      label: 'Observações',
      defaultValue: '',
    },
  },
  defaults: DEFAULT_EVALUATION_VALUES.mood,
};

/**
 * 9. VONTADE
 */
export const WILL_FUNCTION: PsychicFunctionConfig = {
  id: 'will',
  label: 'Vontade',
  description: 'Energia volitiva e controle de impulsos',
  order: 9,
  fields: {
    volitional_energy: {
      type: 'bipolar',
      label: 'Energia Volitiva',
      min: RANGE_BIPOLAR.min,
      max: RANGE_BIPOLAR.max,
      defaultValue: 0,
      description: 'De abulia (-100) a hiperbulia (+100)',
    },
    ambivalence: {
      type: 'boolean',
      label: 'Ambivalência',
      defaultValue: false,
    },
    impulse_control: {
      type: 'bipolar',
      label: 'Controle de Impulsos',
      min: RANGE_BIPOLAR.min,
      max: RANGE_BIPOLAR.max,
      defaultValue: 0,
      description: 'De sem controle (-100) a controle excessivo (+100)',
    },
    observations: {
      type: 'text',
      label: 'Observações',
      defaultValue: '',
    },
  },
  defaults: DEFAULT_EVALUATION_VALUES.will,
};

/**
 * 10. PSICOMOTRICIDADE
 */
export const PSYCHOMOTOR_FUNCTION: PsychicFunctionConfig = {
  id: 'psychomotor',
  label: 'Psicomotricidade',
  description: 'Atividade motora e expressividade',
  order: 10,
  fields: {
    motor_activity: {
      type: 'bipolar',
      label: 'Atividade Motora',
      min: RANGE_BIPOLAR.min,
      max: RANGE_BIPOLAR.max,
      defaultValue: 0,
      description: 'De hipoativo (-100) a hiperativo (+100)',
    },
    tone_gestures: {
      type: 'enum',
      label: 'Tônus e Gestos',
      enumOptions: ['normal', 'hipertônico', 'hipotônico', 'estereotipias'],
      defaultValue: 'normal',
    },
    facial_expressiveness: {
      type: 'unipolar',
      label: 'Expressividade Facial',
      min: RANGE_PERCENTILE.min,
      max: RANGE_PERCENTILE.max,
      defaultValue: 50,
    },
    notes: {
      type: 'text',
      label: 'Observações',
      defaultValue: '',
    },
  },
  defaults: DEFAULT_EVALUATION_VALUES.psychomotor,
};

/**
 * 11. INTELIGÊNCIA
 */
export const INTELLIGENCE_FUNCTION: PsychicFunctionConfig = {
  id: 'intelligence',
  label: 'Inteligência',
  description: 'Capacidades cognitivas',
  order: 11,
  fields: {
    abstract_reasoning: {
      type: 'unipolar',
      label: 'Raciocínio Abstrato',
      min: RANGE_PERCENTILE.min,
      max: RANGE_PERCENTILE.max,
      defaultValue: 80,
    },
    learning_capacity: {
      type: 'unipolar',
      label: 'Capacidade de Aprendizado',
      min: RANGE_PERCENTILE.min,
      max: RANGE_PERCENTILE.max,
      defaultValue: 80,
    },
    adaptive_capacity: {
      type: 'enum',
      label: 'Capacidade Adaptativa',
      enumOptions: ['normal', 'reduced', 'impaired'],
      defaultValue: 'normal',
    },
    facial_expressivity: {
      type: 'unipolar',
      label: 'Expressividade Facial',
      min: RANGE_PERCENTILE.min,
      max: RANGE_PERCENTILE.max,
      defaultValue: 50,
    },
    notes: {
      type: 'text',
      label: 'Observações',
      defaultValue: '',
    },
  },
  defaults: DEFAULT_EVALUATION_VALUES.intelligence,
};

/**
 * 12. PERSONALIDADE
 */
export const PERSONALITY_FUNCTION: PsychicFunctionConfig = {
  id: 'personality',
  label: 'Personalidade',
  description: 'Estrutura e traços de personalidade',
  order: 12,
  fields: {
    self_coherence: {
      type: 'unipolar',
      label: 'Coerência do Self',
      min: RANGE_PERCENTILE.min,
      max: RANGE_PERCENTILE.max,
      defaultValue: 80,
    },
    affective_stability: {
      type: 'unipolar',
      label: 'Estabilidade Afetiva',
      min: RANGE_PERCENTILE.min,
      max: RANGE_PERCENTILE.max,
      defaultValue: 80,
    },
    self_boundaries: {
      type: 'enum',
      label: 'Fronteiras do Self',
      enumOptions: ['normal', 'diffuse', 'rigid', 'fragmented'],
      defaultValue: 'normal',
    },
    anxious: {
      type: 'boolean',
      label: 'Traço Ansioso',
      defaultValue: false,
    },
    narcissistic: {
      type: 'boolean',
      label: 'Traço Narcisista',
      defaultValue: false,
    },
    avoidant: {
      type: 'boolean',
      label: 'Traço Evitativo',
      defaultValue: false,
    },
    obsessive: {
      type: 'boolean',
      label: 'Traço Obsessivo',
      defaultValue: false,
    },
    borderline: {
      type: 'boolean',
      label: 'Traço Borderline',
      defaultValue: false,
    },
    histrionic: {
      type: 'boolean',
      label: 'Traço Histriônico',
      defaultValue: false,
    },
    antisocial: {
      type: 'boolean',
      label: 'Traço Antissocial',
      defaultValue: false,
    },
    observations: {
      type: 'text',
      label: 'Observações',
      defaultValue: '',
    },
  },
  defaults: DEFAULT_EVALUATION_VALUES.personality,
};

/**
 * ============================================================================
 * MODELO COMPLETO DA AVALIAÇÃO DE SESSÃO
 * ============================================================================
 */

export interface SessionEvaluationModelConfig {
  functions: PsychicFunctionConfig[];
  validationRules: {
    minFunctionsWithData: number;
  };
}

/**
 * Configuração completa do modelo de Avaliação de Sessão
 */
export const SESSION_EVALUATION_MODEL_CONFIG: SessionEvaluationModelConfig = {
  functions: [
    CONSCIOUSNESS_FUNCTION,
    ORIENTATION_FUNCTION,
    ATTENTION_FUNCTION,
    SENSOPERCEPTION_FUNCTION,
    MEMORY_FUNCTION,
    THOUGHT_FUNCTION,
    LANGUAGE_FUNCTION,
    MOOD_FUNCTION,
    WILL_FUNCTION,
    PSYCHOMOTOR_FUNCTION,
    INTELLIGENCE_FUNCTION,
    PERSONALITY_FUNCTION,
  ],
  validationRules: {
    minFunctionsWithData: 3,
  },
};

/**
 * Helper: obter configuração de uma função específica
 */
export function getPsychicFunctionConfig(functionId: PsychicFunction): PsychicFunctionConfig | null {
  return SESSION_EVALUATION_MODEL_CONFIG.functions.find(f => f.id === functionId) || null;
}

/**
 * Helper: obter todas as funções ordenadas
 */
export function getAllPsychicFunctions(): PsychicFunctionConfig[] {
  return SESSION_EVALUATION_MODEL_CONFIG.functions.sort((a, b) => a.order - b.order);
}
