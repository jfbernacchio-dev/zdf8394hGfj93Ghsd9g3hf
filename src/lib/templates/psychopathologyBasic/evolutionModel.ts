/**
 * ============================================================================
 * FASE C2.3 - Psychopathology Basic - Evolution Model
 * ============================================================================
 * 
 * Definição declarativa de como a Evolução Clínica funciona no template psicopatológico.
 * 
 * Por enquanto, mantém estrutura leve - será expandido na C2.6 quando
 * adaptarmos ClinicalEvolution para ser template-aware.
 */

import type { PsychicFunction } from '@/lib/clinical/constants';

/**
 * Tipo de gráfico suportado
 */
export type ChartType = 'line' | 'radar' | 'bar' | 'pie';

/**
 * Configuração de um gráfico
 */
export interface ChartConfig {
  /** ID único do gráfico */
  id: string;
  
  /** Label do gráfico */
  label: string;
  
  /** Função psíquica que alimenta este gráfico */
  functionId: PsychicFunction;
  
  /** Campos da função que entram no gráfico */
  fields: string[];
  
  /** Tipo de gráfico */
  chartType: ChartType;
  
  /** Descrição do que o gráfico mostra */
  description?: string;
  
  /** Caminho dos valores no JSONB (ex: 'mood_data.polarity') */
  valuePaths?: string[];
  
  /** Se os valores são bipolares (-100 a +100) */
  bipolar?: boolean;
  
  /** Domínio do eixo Y (para gráficos de linha) */
  yDomain?: [number, number];
}

/**
 * Configuração de um resumo textual
 */
export interface SummaryConfig {
  /** ID do resumo */
  id: string;
  
  /** Label do resumo */
  label: string;
  
  /** Função psíquica que alimenta este resumo */
  functionId: PsychicFunction;
  
  /** Descrição */
  description?: string;
}

/**
 * ============================================================================
 * GRÁFICOS DO TEMPLATE PSICOPATOLÓGICO
 * ============================================================================
 */

/**
 * Gráficos disponíveis
 * 
 * NOTA: Esta é uma definição inicial. Na C2.6, quando adaptarmos
 * ClinicalEvolution, estes gráficos serão usados de forma mais dinâmica.
 */
export const EVOLUTION_CHARTS: ChartConfig[] = [
  {
    id: 'consciousness-chart',
    label: 'Evolução da Consciência',
    functionId: 'consciousness',
    fields: ['level', 'field', 'self_consciousness'],
    chartType: 'line',
    description: 'Nível, campo e autoconsciência ao longo do tempo',
    valuePaths: ['consciousness_data.level', 'consciousness_data.field', 'consciousness_data.self_consciousness'],
    bipolar: true,
    yDomain: [-100, 100],
  },
  {
    id: 'mood-chart',
    label: 'Evolução do Humor',
    functionId: 'mood',
    fields: ['polarity', 'lability'],
    chartType: 'line',
    description: 'Polaridade e labilidade do humor',
    valuePaths: ['mood_data.polarity', 'mood_data.lability'],
    bipolar: false, // polarity é bipolar, lability é unipolar - mixed
    yDomain: [-100, 100],
  },
  {
    id: 'attention-chart',
    label: 'Evolução da Atenção',
    functionId: 'attention',
    fields: ['range', 'concentration'],
    chartType: 'line',
    description: 'Amplitude e concentração da atenção',
    valuePaths: ['attention_data.range', 'attention_data.concentration'],
    bipolar: false,
    yDomain: [0, 100],
  },
  {
    id: 'thought-chart',
    label: 'Evolução do Pensamento',
    functionId: 'thought',
    fields: ['course'],
    chartType: 'line',
    description: 'Curso do pensamento',
    valuePaths: ['thought_data.course'],
    bipolar: true,
    yDomain: [-100, 100],
  },
  {
    id: 'will-chart',
    label: 'Evolução da Vontade',
    functionId: 'will',
    fields: ['volitional_energy', 'impulse_control'],
    chartType: 'line',
    description: 'Energia volitiva e controle de impulsos',
    valuePaths: ['will_data.volitional_energy', 'will_data.impulse_control'],
    bipolar: true,
    yDomain: [-100, 100],
  },
  {
    id: 'psychomotor-chart',
    label: 'Evolução da Psicomotricidade',
    functionId: 'psychomotor',
    fields: ['motor_activity', 'facial_expressiveness'],
    chartType: 'line',
    description: 'Atividade motora e expressividade',
    valuePaths: ['psychomotor_data.motor_activity', 'psychomotor_data.facial_expressiveness'],
    bipolar: false, // motor_activity é bipolar, facial_expressiveness é unipolar
    yDomain: [-100, 100],
  },
  {
    id: 'memory-chart',
    label: 'Evolução da Memória',
    functionId: 'memory',
    fields: ['fixation', 'recall'],
    chartType: 'line',
    description: 'Fixação e evocação de memórias',
    valuePaths: ['memory_data.fixation', 'memory_data.recall'],
    bipolar: false,
    yDomain: [0, 100],
  },
  {
    id: 'orientation-chart',
    label: 'Evolução da Orientação',
    functionId: 'orientation',
    fields: ['insight'],
    chartType: 'line',
    description: 'Insight do paciente',
    valuePaths: ['orientation_data.insight'],
    bipolar: false,
    yDomain: [0, 100],
  },
  {
    id: 'language-chart',
    label: 'Evolução da Linguagem',
    functionId: 'language',
    fields: ['speech_rate'],
    chartType: 'line',
    description: 'Velocidade da fala',
    valuePaths: ['language_data.speech_rate'],
    bipolar: true,
    yDomain: [-100, 100],
  },
  {
    id: 'intelligence-chart',
    label: 'Evolução da Inteligência',
    functionId: 'intelligence',
    fields: ['learning_capacity', 'abstract_reasoning'],
    chartType: 'line',
    description: 'Capacidade de aprendizagem e raciocínio abstrato',
    valuePaths: ['intelligence_data.learning_capacity', 'intelligence_data.abstract_reasoning'],
    bipolar: false,
    yDomain: [0, 100],
  },
  {
    id: 'personality-chart',
    label: 'Evolução da Personalidade',
    functionId: 'personality',
    fields: ['self_coherence', 'affective_stability'],
    chartType: 'line',
    description: 'Coerência do self e estabilidade afetiva',
    valuePaths: ['personality_data.self_coherence', 'personality_data.affective_stability'],
    bipolar: false,
    yDomain: [0, 100],
  },
];

/**
 * Resumos textuais disponíveis
 */
export const EVOLUTION_SUMMARIES: SummaryConfig[] = [
  {
    id: 'general-summary',
    label: 'Resumo Geral',
    functionId: 'consciousness', // Placeholder
    description: 'Resumo interpretativo de todas as funções',
  },
];

/**
 * ============================================================================
 * MODELO COMPLETO DA EVOLUÇÃO
 * ============================================================================
 */

export interface EvolutionModelConfig {
  charts: ChartConfig[];
  summaries: SummaryConfig[];
  supportsTimeline: boolean;
  supportsComparison: boolean;
}

/**
 * Configuração completa do modelo de Evolução
 */
export const EVOLUTION_MODEL_CONFIG: EvolutionModelConfig = {
  charts: EVOLUTION_CHARTS,
  summaries: EVOLUTION_SUMMARIES,
  supportsTimeline: true,
  supportsComparison: true,
};

/**
 * Helper: obter configuração de um gráfico específico
 */
export function getChartConfig(chartId: string): ChartConfig | null {
  return EVOLUTION_CHARTS.find(c => c.id === chartId) || null;
}

/**
 * Helper: obter gráficos de uma função específica
 */
export function getChartsForFunction(functionId: PsychicFunction): ChartConfig[] {
  return EVOLUTION_CHARTS.filter(c => c.functionId === functionId);
}
