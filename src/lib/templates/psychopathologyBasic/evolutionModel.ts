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
  },
  {
    id: 'mood-chart',
    label: 'Evolução do Humor',
    functionId: 'mood',
    fields: ['polarity', 'lability'],
    chartType: 'line',
    description: 'Polaridade e labilidade do humor',
  },
  {
    id: 'attention-chart',
    label: 'Evolução da Atenção',
    functionId: 'attention',
    fields: ['range', 'concentration'],
    chartType: 'line',
    description: 'Amplitude e concentração da atenção',
  },
  {
    id: 'thought-chart',
    label: 'Evolução do Pensamento',
    functionId: 'thought',
    fields: ['course'],
    chartType: 'line',
    description: 'Curso do pensamento',
  },
  {
    id: 'will-chart',
    label: 'Evolução da Vontade',
    functionId: 'will',
    fields: ['volitional_energy', 'impulse_control'],
    chartType: 'line',
    description: 'Energia volitiva e controle de impulsos',
  },
  {
    id: 'psychomotor-chart',
    label: 'Evolução da Psicomotricidade',
    functionId: 'psychomotor',
    fields: ['motor_activity', 'facial_expressiveness'],
    chartType: 'line',
    description: 'Atividade motora e expressividade',
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
