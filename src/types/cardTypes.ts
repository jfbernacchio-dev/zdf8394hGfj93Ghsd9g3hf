import type { PermissionDomain } from './permissions';
import type { Layout } from 'react-grid-layout';

export type CardCategory = 'statistics' | 'functional' | 'dashboard-cards' | 'dashboard-charts' | 'clinical';

/**
 * GRID CARD LAYOUT - FASE 2
 * Layout para React Grid Layout (sistema de grid de 12 colunas)
 */
export interface GridCardLayout extends Layout {
  i: string;        // cardId único
  x: number;        // coluna inicial (0-11)
  y: number;        // linha inicial (0-∞)
  w: number;        // largura em colunas (1-12)
  h: number;        // altura em rows (1-∞)
  minW?: number;    // largura mínima em colunas
  minH?: number;    // altura mínima em rows
  maxW?: number;    // largura máxima em colunas
  maxH?: number;    // altura máxima em rows
}

/**
 * Configuração de permissões para cada card - FASE 1
 * Define regras granulares de acesso baseadas em domínios e roles
 */
export interface CardPermissionConfig {
  /**
   * Domínio do card (classifica pela ORIGEM dos dados)
   * - 'financial': Valores, NFSe, pagamentos
   * - 'administrative': Sessões, agenda, notificações
   * - 'clinical': Queixas, evoluções, diagnósticos
   * - 'media': Google Ads, website, analytics
   * - 'general': Sem restrição (contato, perfil)
   */
  domain: PermissionDomain;
  
  /**
   * Se true, requer hasFinancialAccess === true
   * Usado para cards financeiros de subordinados
   */
  requiresFinancialAccess?: boolean;
  
  /**
   * Se true, requer canFullSeeClinic === true OU ser paciente próprio
   * Usado para dados clínicos sensíveis
   */
  requiresFullClinicalAccess?: boolean;
  
  /**
   * Roles bloqueadas para este card
   * Ex: ['subordinate'] para cards de mídia
   */
  blockedFor?: ('admin' | 'fulltherapist' | 'subordinate' | 'accountant')[];
  
  /**
   * Nível mínimo de acesso requerido
   * 'read', 'write', 'full'
   */
  minimumAccess?: 'read' | 'write' | 'full';
}

export interface CardConfig {
  id: string;
  name: string;
  description: string;
  detailedDescription?: string;
  category: CardCategory;
  icon?: string;
  defaultWidth?: number;
  defaultHeight?: number;
  permissionConfig?: CardPermissionConfig;
  isChart?: boolean; // FASE 2B: Flag para identificar cards gráficos
}

/**
 * ============================================================================
 * STAT CARDS - Patient Detail Page
 * ============================================================================
 */
export const AVAILABLE_STAT_CARDS: CardConfig[] = [
  {
    id: 'patient-stat-total',
    name: 'Total no Mês',
    description: 'Total de sessões no mês atual',
    detailedDescription: 'Contagem de todas as sessões deste paciente no mês civil corrente.',
    category: 'statistics', // DEPRECATED
    defaultWidth: 200,
    defaultHeight: 120,
    permissionConfig: {
      domain: 'administrative', // Métrica administrativa de sessões
    },
  },
  {
    id: 'patient-stat-attended',
    name: 'Comparecidas',
    description: 'Sessões comparecidas no mês',
    detailedDescription: 'Sessões onde o paciente compareceu ao atendimento.',
    category: 'statistics', // DEPRECATED
    defaultWidth: 200,
    defaultHeight: 120,
    permissionConfig: {
      domain: 'administrative', // Métrica administrativa de sessões
    },
  },
  {
    id: 'patient-stat-scheduled',
    name: 'Agendadas',
    description: 'Sessões agendadas no mês',
    detailedDescription: 'Sessões futuras já marcadas na agenda do paciente.',
    category: 'statistics', // DEPRECATED
    defaultWidth: 200,
    defaultHeight: 120,
    permissionConfig: {
      domain: 'administrative', // Métrica administrativa de agendamentos
    },
  },
  {
    id: 'patient-stat-unpaid',
    name: 'A Pagar',
    description: 'Sessões não pagas no mês',
    detailedDescription: 'Sessões realizadas mas sem registro de pagamento confirmado.',
    category: 'statistics', // DEPRECATED
    defaultWidth: 200,
    defaultHeight: 120,
    permissionConfig: {
      domain: 'financial', // Métrica financeira de inadimplência
      requiresFinancialAccess: true,
    },
  },
  {
    id: 'patient-stat-nfse',
    name: 'NFSe Emitida',
    description: 'Sessões com NFSe emitida',
    detailedDescription: 'Sessões que possuem Nota Fiscal de Serviço Eletrônica emitida.',
    category: 'statistics', // DEPRECATED
    defaultWidth: 200,
    defaultHeight: 120,
    permissionConfig: {
      domain: 'financial', // NFSe é financeiro
    },
  },
  {
    id: 'patient-stat-total-all',
    name: 'Total Geral',
    description: 'Todas as sessões registradas',
    detailedDescription: 'Contagem histórica total desde a primeira sessão até hoje.',
    category: 'statistics', // DEPRECATED
    defaultWidth: 200,
    defaultHeight: 120,
    permissionConfig: {
      domain: 'administrative', // Métrica administrativa de pacientes
    },
  },
  {
    id: 'patient-stat-revenue-month',
    name: 'Faturamento do Mês',
    description: 'Valor total faturado no mês',
    detailedDescription: 'Soma dos valores de todas as sessões do paciente no mês.',
    category: 'statistics', // DEPRECATED
    defaultWidth: 200,
    defaultHeight: 120,
    permissionConfig: {
      domain: 'financial', // Métrica financeira de receita
      requiresFinancialAccess: true,
    },
  },
  {
    id: 'patient-stat-paid-month',
    name: 'Recebido no Mês',
    description: 'Valor recebido (pago) no mês',
    detailedDescription: 'Soma dos valores efetivamente recebidos do paciente no mês corrente.',
    category: 'statistics',
    defaultWidth: 200,
    defaultHeight: 120,
    permissionConfig: {
      domain: 'financial',
      requiresFinancialAccess: true,
    },
  },
  {
    id: 'patient-stat-missed-month',
    name: 'Faltas no Mês',
    description: 'Total de faltas no mês',
    detailedDescription: 'Sessões marcadas como não comparecimento sem justificativa.',
    category: 'statistics',
    defaultWidth: 200,
    defaultHeight: 120,
    permissionConfig: {
      domain: 'administrative',
    },
  },
  {
    id: 'patient-stat-attendance-rate',
    name: 'Taxa de Comparecimento',
    description: 'Porcentagem de comparecimento',
    detailedDescription: 'Percentual de sessões comparecidas em relação às oportunidades.',
    category: 'statistics',
    defaultWidth: 200,
    defaultHeight: 120,
    permissionConfig: {
      domain: 'administrative',
    },
  },
  {
    id: 'patient-stat-unscheduled-month',
    name: 'Desmarcadas no Mês',
    description: 'Sessões desmarcadas no mês',
    detailedDescription: 'Sessões que foram agendadas mas posteriormente canceladas.',
    category: 'statistics',
    defaultWidth: 200,
    defaultHeight: 120,
    permissionConfig: {
      domain: 'administrative',
    },
  },
];

/**
 * ============================================================================
 * FUNCTIONAL CARDS - Patient Detail Page
 * ============================================================================
 */
export const AVAILABLE_FUNCTIONAL_CARDS: CardConfig[] = [
  {
    id: 'patient-next-appointment',
    name: 'Próximo Agendamento',
    description: 'Detalhes da próxima sessão agendada',
    detailedDescription: 'Informações completas do próximo compromisso futuro do paciente.',
    category: 'functional',
    defaultWidth: 350,
    defaultHeight: 220,
    permissionConfig: {
      domain: 'administrative',
    },
  },
  {
    id: 'patient-contact-info',
    name: 'Contato',
    description: 'Informações de contato do paciente',
    detailedDescription: 'Telefone, email e outras formas de contato.',
    category: 'functional',
    defaultWidth: 350,
    defaultHeight: 200,
    permissionConfig: {
      domain: 'general',
    },
  },
  {
    id: 'patient-payment-info',
    name: 'Informações de Pagamento',
    description: 'Dados de cobrança do paciente',
    detailedDescription: 'Formas de pagamento, valor da sessão, e configurações de faturamento.',
    category: 'functional',
    defaultWidth: 350,
    defaultHeight: 220,
    permissionConfig: {
      domain: 'financial',
      requiresFinancialAccess: true,
    },
  },
  {
    id: 'patient-session-frequency',
    name: 'Frequência de Sessões',
    description: 'Padrão de atendimento do paciente',
    detailedDescription: 'Frequência semanal e histórico de regularidade.',
    category: 'functional',
    defaultWidth: 350,
    defaultHeight: 200,
    permissionConfig: {
      domain: 'administrative',
    },
  },
  {
    id: 'patient-clinical-notes',
    name: 'Notas Clínicas',
    description: 'Anotações e observações clínicas',
    detailedDescription: 'Resumo das principais observações clínicas do paciente.',
    category: 'functional',
    defaultWidth: 400,
    defaultHeight: 300,
    permissionConfig: {
      domain: 'clinical',
    },
  },
  {
    id: 'patient-files-manager',
    name: 'Gerenciador de Arquivos',
    description: 'Upload e gestão de documentos',
    detailedDescription: 'Gerencia documentos, laudos, e outros arquivos do paciente.',
    category: 'functional',
    defaultWidth: 450,
    defaultHeight: 350,
    permissionConfig: {
      domain: 'administrative',
    },
  },
  {
    id: 'patient-session-history',
    name: 'Histórico de Sessões',
    description: 'Lista completa de sessões',
    detailedDescription: 'Todas as sessões do paciente com filtros e busca.',
    category: 'functional',
    defaultWidth: 600,
    defaultHeight: 400,
    permissionConfig: {
      domain: 'clinical',
    },
  },
  {
    id: 'patient-quick-actions',
    name: 'Ações Rápidas',
    description: 'Botões de ações comuns',
    detailedDescription: 'Agendar, editar, enviar mensagem, e outras ações rápidas.',
    category: 'functional',
    defaultWidth: 300,
    defaultHeight: 180,
    permissionConfig: {
      domain: 'administrative',
    },
  },
  {
    id: 'patient-nfse-list',
    name: 'Lista de NFSe',
    description: 'Notas fiscais do paciente',
    detailedDescription: 'Histórico de notas fiscais emitidas para este paciente.',
    category: 'functional',
    defaultWidth: 500,
    defaultHeight: 350,
    permissionConfig: {
      domain: 'financial',
    },
  },
  {
    id: 'patient-timeline',
    name: 'Linha do Tempo',
    description: 'Cronologia de eventos',
    detailedDescription: 'Histórico cronológico de todos os eventos do paciente.',
    category: 'functional',
    defaultWidth: 500,
    defaultHeight: 400,
    permissionConfig: {
      domain: 'clinical',
    },
  },
];

/**
 * ============================================================================
 * DASHBOARD CARDS - Metrics Section
 * ============================================================================
 */
export const AVAILABLE_DASHBOARD_CARDS: CardConfig[] = [
  {
    id: 'dashboard-total-patients',
    name: 'Total de Pacientes',
    description: 'Pacientes únicos com sessões no período',
    detailedDescription: 'Contagem de pacientes ativos no período selecionado.',
    category: 'dashboard-cards',
    defaultWidth: 280,
    defaultHeight: 160,
    permissionConfig: {
      domain: 'clinical',
    },
  },
  {
    id: 'dashboard-expected-revenue',
    name: 'Faturamento Esperado',
    description: 'Receita esperada no período',
    detailedDescription: 'Valor esperado baseado na frequência dos pacientes ativos.',
    category: 'dashboard-cards',
    defaultWidth: 280,
    defaultHeight: 160,
    permissionConfig: {
      domain: 'financial',
      requiresFinancialAccess: true,
    },
  },
  {
    id: 'dashboard-actual-revenue',
    name: 'Faturamento Real',
    description: 'Receita efetivamente realizada',
    detailedDescription: 'Valor total das sessões comparecidas no período.',
    category: 'dashboard-cards',
    defaultWidth: 280,
    defaultHeight: 160,
    permissionConfig: {
      domain: 'financial',
      requiresFinancialAccess: true,
    },
  },
  {
    id: 'dashboard-attended-sessions',
    name: 'Sessões Comparecidas',
    description: 'Total de sessões realizadas',
    detailedDescription: 'Número de sessões onde houve comparecimento.',
    category: 'dashboard-cards',
    defaultWidth: 280,
    defaultHeight: 160,
    permissionConfig: {
      domain: 'administrative',
    },
  },
  {
    id: 'dashboard-expected-sessions',
    name: 'Sessões Esperadas',
    description: 'Sessões previstas no período',
    detailedDescription: 'Número esperado de sessões baseado na frequência.',
    category: 'dashboard-cards',
    defaultWidth: 280,
    defaultHeight: 160,
    permissionConfig: {
      domain: 'administrative',
    },
  },
  {
    id: 'dashboard-missed-sessions',
    name: 'Faltas',
    description: 'Sessões não comparecidas',
    detailedDescription: 'Número de faltas sem justificativa no período.',
    category: 'dashboard-cards',
    defaultWidth: 280,
    defaultHeight: 160,
    permissionConfig: {
      domain: 'financial',
      requiresFinancialAccess: true,
    },
  },
  {
    id: 'dashboard-pending-sessions',
    name: 'Sessões Pendentes',
    description: 'Sessões agendadas futuras',
    detailedDescription: 'Número de sessões agendadas ainda não realizadas.',
    category: 'dashboard-cards',
    defaultWidth: 280,
    defaultHeight: 160,
    permissionConfig: {
      domain: 'administrative',
    },
  },
  {
    id: 'dashboard-unpaid-value',
    name: 'Valor a Receber',
    description: 'Total de valores não pagos',
    detailedDescription: 'Soma dos valores de sessões realizadas mas não pagas.',
    category: 'dashboard-cards',
    defaultWidth: 280,
    defaultHeight: 160,
    permissionConfig: {
      domain: 'financial',
      requiresFinancialAccess: true,
    },
  },
  {
    id: 'dashboard-active-therapists',
    name: 'Terapeutas Ativos',
    description: 'Número de terapeutas com sessões',
    detailedDescription: 'Terapeutas que realizaram sessões no período.',
    category: 'dashboard-cards',
    defaultWidth: 280,
    defaultHeight: 160,
    permissionConfig: {
      domain: 'administrative',
      blockedFor: ['subordinate'],
    },
  },
  {
    id: 'dashboard-attendance-rate',
    name: 'Taxa de Comparecimento',
    description: 'Porcentagem geral de comparecimento',
    detailedDescription: 'Percentual de sessões comparecidas vs agendadas.',
    category: 'dashboard-cards',
    defaultWidth: 280,
    defaultHeight: 160,
    permissionConfig: {
      domain: 'media',
      blockedFor: ['subordinate'],
    },
  },
  {
    id: 'dashboard-monthly-growth',
    name: 'Crescimento Mensal',
    description: 'Variação em relação ao mês anterior',
    detailedDescription: 'Percentual de crescimento/queda comparado ao mês anterior.',
    category: 'dashboard-cards',
    defaultWidth: 280,
    defaultHeight: 160,
    permissionConfig: {
      domain: 'media',
      blockedFor: ['subordinate'],
    },
  },
  {
    id: 'dashboard-payment-rate',
    name: 'Taxa de Pagamento',
    description: 'Porcentagem de sessões pagas',
    detailedDescription: 'Percentual de sessões com pagamento confirmado.',
    category: 'dashboard-cards',
    defaultWidth: 280,
    defaultHeight: 160,
    permissionConfig: {
      domain: 'financial',
      requiresFinancialAccess: true,
    },
  },
  {
    id: 'dashboard-quick-actions',
    name: 'Ações Rápidas',
    description: 'Acesso rápido a funções principais',
    detailedDescription: 'Botões de acesso rápido para criar paciente, agendar sessão, ver pendências financeiras.',
    category: 'dashboard-cards',
    defaultWidth: 280,
    defaultHeight: 160,
    permissionConfig: {
      domain: 'general',
    },
  },
  {
    id: 'dashboard-recent-sessions',
    name: 'Últimas Sessões',
    description: 'Sessões recentes realizadas',
    detailedDescription: 'Lista das últimas 5 sessões comparecidas com data, paciente e valor.',
    category: 'dashboard-cards',
    defaultWidth: 400,
    defaultHeight: 250,
    permissionConfig: {
      domain: 'general',
    },
  },
];

/**
 * ============================================================================
 * DASHBOARD CHARTS - Visualization Section
 * ============================================================================
 */
export const AVAILABLE_DASHBOARD_CHARTS: CardConfig[] = [
  {
    id: 'dashboard-chart-revenue-trend',
    name: 'Evolução da Receita',
    description: 'Tendência de receita no período',
    detailedDescription: 'Gráfico de linha mostrando evolução da receita.',
    category: 'dashboard-charts',
    defaultWidth: 600,
    defaultHeight: 400,
    isChart: true,
    permissionConfig: {
      domain: 'financial',
      requiresFinancialAccess: true,
    },
  },
  {
    id: 'dashboard-chart-session-types',
    name: 'Tipos de Sessão',
    description: 'Distribuição por status',
    detailedDescription: 'Gráfico de pizza mostrando distribuição de status.',
    category: 'dashboard-charts',
    defaultWidth: 500,
    defaultHeight: 400,
    isChart: true,
    permissionConfig: {
      domain: 'administrative',
    },
  },
  {
    id: 'dashboard-chart-therapist-distribution',
    name: 'Distribuição por Terapeuta',
    description: 'Sessões por terapeuta',
    detailedDescription: 'Gráfico de barras com número de sessões por terapeuta.',
    category: 'dashboard-charts',
    defaultWidth: 600,
    defaultHeight: 400,
    isChart: true,
    permissionConfig: {
      domain: 'administrative',
      blockedFor: ['subordinate'],
    },
  },
  {
    id: 'dashboard-chart-monthly-comparison',
    name: 'Comparação Temporal',
    description: 'Comparação entre períodos',
    detailedDescription: 'Gráfico comparando métricas entre diferentes períodos.',
    category: 'dashboard-charts',
    defaultWidth: 600,
    defaultHeight: 400,
    isChart: true,
    permissionConfig: {
      domain: 'clinical',
    },
  },
  {
    id: 'dashboard-chart-payment-status',
    name: 'Status de Pagamento',
    description: 'Situação financeira',
    detailedDescription: 'Gráfico mostrando pago vs pendente vs inadimplente.',
    category: 'dashboard-charts',
    defaultWidth: 500,
    defaultHeight: 400,
    isChart: true,
    permissionConfig: {
      domain: 'financial',
      requiresFinancialAccess: true,
    },
  },
  {
    id: 'dashboard-chart-attendance-weekly',
    name: 'Taxa de Comparecimento',
    description: 'Evolução semanal de comparecimento',
    detailedDescription: 'Gráfico de linha mostrando taxa ao longo das semanas.',
    category: 'dashboard-charts',
    defaultWidth: 600,
    defaultHeight: 400,
    isChart: true,
    permissionConfig: {
      domain: 'financial',
      requiresFinancialAccess: true,
    },
  },
  {
    id: 'dashboard-chart-revenue-by-therapist',
    name: 'Receita por Terapeuta',
    description: 'Faturamento individual',
    detailedDescription: 'Gráfico de barras com receita gerada por cada terapeuta.',
    category: 'dashboard-charts',
    defaultWidth: 600,
    defaultHeight: 400,
    isChart: true,
    permissionConfig: {
      domain: 'financial',
      requiresFinancialAccess: true,
      blockedFor: ['subordinate'],
    },
  },
  {
    id: 'dashboard-chart-patient-growth',
    name: 'Evolução de Pacientes',
    description: 'Crescimento da base de pacientes',
    detailedDescription: 'Gráfico mostrando evolução do número de pacientes.',
    category: 'dashboard-charts',
    defaultWidth: 600,
    defaultHeight: 400,
    isChart: true,
    permissionConfig: {
      domain: 'financial',
      requiresFinancialAccess: true,
    },
  },
  {
    id: 'dashboard-chart-hourly-distribution',
    name: 'Distribuição por Horário',
    description: 'Sessões por faixa horária',
    detailedDescription: 'Gráfico mostrando distribuição de sessões ao longo do dia.',
    category: 'dashboard-charts',
    defaultWidth: 600,
    defaultHeight: 400,
    isChart: true,
    permissionConfig: {
      domain: 'administrative',
    },
  },
  {
    id: 'dashboard-chart-cancellation-reasons',
    name: 'Motivos de Cancelamento',
    description: 'Análise de cancelamentos',
    detailedDescription: 'Gráfico mostrando principais motivos de desmarcação.',
    category: 'dashboard-charts',
    defaultWidth: 500,
    defaultHeight: 400,
    isChart: true,
    permissionConfig: {
      domain: 'administrative',
    },
  },
];

/**
 * ============================================================================
 * TEAM CARDS - Dashboard Team Section (Equipe)
 * ============================================================================
 */
export const AVAILABLE_TEAM_CARDS: CardConfig[] = [
  {
    id: 'dashboard-expected-revenue-team',
    name: 'Receita Esperada (Equipe)',
    description: 'Receita total esperada da equipe no período',
    detailedDescription: 'Soma de todas as sessões agendadas da equipe (subordinados). Considera mensalidades uma vez por mês.',
    category: 'dashboard-cards',
    defaultWidth: 280,
    defaultHeight: 160,
    permissionConfig: {
      domain: 'team',
      blockedFor: ['subordinate'],
    },
  },
  {
    id: 'dashboard-actual-revenue-team',
    name: 'Receita Realizada (Equipe)',
    description: 'Receita efetivamente realizada pela equipe',
    detailedDescription: 'Soma das sessões comparecidas da equipe. Considera mensalidades uma vez por mês.',
    category: 'dashboard-cards',
    defaultWidth: 280,
    defaultHeight: 160,
    permissionConfig: {
      domain: 'team',
      blockedFor: ['subordinate'],
    },
  },
  {
    id: 'dashboard-unpaid-value-team',
    name: 'A Receber (Equipe)',
    description: 'Valor pendente de pagamento da equipe',
    detailedDescription: 'Soma das sessões comparecidas mas não pagas da equipe. Considera mensalidades uma vez por mês.',
    category: 'dashboard-cards',
    defaultWidth: 280,
    defaultHeight: 160,
    permissionConfig: {
      domain: 'team',
      blockedFor: ['subordinate'],
    },
  },
  {
    id: 'dashboard-payment-rate-team',
    name: 'Taxa de Pagamento (Equipe)',
    description: 'Percentual de sessões pagas da equipe',
    detailedDescription: 'Percentual de sessões comparecidas que foram pagas pela equipe.',
    category: 'dashboard-cards',
    defaultWidth: 280,
    defaultHeight: 160,
    permissionConfig: {
      domain: 'team',
      blockedFor: ['subordinate'],
    },
  },
  {
    id: 'dashboard-total-patients-team',
    name: 'Total de Pacientes (Equipe)',
    description: 'Pacientes ativos da equipe',
    detailedDescription: 'Contagem de pacientes com status ativo gerenciados pela equipe.',
    category: 'dashboard-cards',
    defaultWidth: 280,
    defaultHeight: 160,
    permissionConfig: {
      domain: 'team',
      blockedFor: ['subordinate'],
    },
  },
  {
    id: 'dashboard-attended-sessions-team',
    name: 'Sessões Realizadas (Equipe)',
    description: 'Sessões comparecidas pela equipe',
    detailedDescription: 'Contagem e percentual de sessões comparecidas em relação ao total esperado da equipe.',
    category: 'dashboard-cards',
    defaultWidth: 280,
    defaultHeight: 160,
    permissionConfig: {
      domain: 'team',
      blockedFor: ['subordinate'],
    },
  },
  {
    id: 'dashboard-active-therapists-team',
    name: 'Terapeutas Ativos - Equipe',
    description: 'Número de subordinados com sessões no período',
    detailedDescription: 'Contagem de terapeutas subordinados que realizaram pelo menos uma sessão no período selecionado.',
    category: 'dashboard-cards',
    defaultWidth: 280,
    defaultHeight: 160,
    permissionConfig: {
      domain: 'team',
      blockedFor: ['subordinate'],
    },
  },
];

/**
 * ============================================================================
 * CLINICAL CARDS - Evolution Page
 * ============================================================================
 */
export const AVAILABLE_CLINICAL_CARDS: CardConfig[] = [
  {
    id: 'evolution-chart-consciousness',
    name: 'Evolução da Consciência',
    description: 'Acompanhamento dos níveis de consciência',
    detailedDescription: 'Gráfico temporal da evolução dos componentes da consciência.',
    category: 'clinical',
    defaultWidth: 600,
    defaultHeight: 400,
    permissionConfig: {
      domain: 'clinical',
    },
  },
  {
    id: 'evolution-chart-orientation',
    name: 'Tendências de Orientação',
    description: 'Orientação no tempo, espaço e pessoa',
    detailedDescription: 'Acompanhamento da orientação nas três esferas.',
    category: 'clinical',
    defaultWidth: 600,
    defaultHeight: 400,
    permissionConfig: {
      domain: 'clinical',
    },
  },
  {
    id: 'evolution-chart-attention',
    name: 'Atenção e Memória',
    description: 'Funções cognitivas básicas',
    detailedDescription: 'Evolução da atenção e capacidade de memória.',
    category: 'clinical',
    defaultWidth: 600,
    defaultHeight: 400,
    permissionConfig: {
      domain: 'clinical',
    },
  },
  {
    id: 'evolution-chart-mood',
    name: 'Acompanhamento de Humor',
    description: 'Estados afetivos ao longo do tempo',
    detailedDescription: 'Gráfico temporal dos estados de humor reportados.',
    category: 'clinical',
    defaultWidth: 600,
    defaultHeight: 400,
    permissionConfig: {
      domain: 'clinical',
    },
  },
  {
    id: 'evolution-chart-thought',
    name: 'Padrões de Pensamento',
    description: 'Curso, conteúdo e forma do pensamento',
    detailedDescription: 'Evolução dos aspectos formais e de conteúdo do pensamento.',
    category: 'clinical',
    defaultWidth: 600,
    defaultHeight: 400,
    permissionConfig: {
      domain: 'clinical',
    },
  },
  {
    id: 'evolution-chart-sensoperception',
    name: 'Percepção e Alucinações',
    description: 'Sensopercepção ao longo das sessões',
    detailedDescription: 'Acompanhamento de alterações perceptivas.',
    category: 'clinical',
    defaultWidth: 600,
    defaultHeight: 400,
    permissionConfig: {
      domain: 'clinical',
    },
  },
  {
    id: 'evolution-chart-language',
    name: 'Linguagem e Comunicação',
    description: 'Aspectos da linguagem',
    detailedDescription: 'Evolução da capacidade de comunicação verbal.',
    category: 'clinical',
    defaultWidth: 600,
    defaultHeight: 400,
    permissionConfig: {
      domain: 'clinical',
    },
  },
  {
    id: 'evolution-chart-intelligence',
    name: 'Inteligência e Raciocínio',
    description: 'Capacidades cognitivas complexas',
    detailedDescription: 'Acompanhamento das funções executivas e raciocínio.',
    category: 'clinical',
    defaultWidth: 600,
    defaultHeight: 400,
    permissionConfig: {
      domain: 'clinical',
    },
  },
  {
    id: 'evolution-chart-will',
    name: 'Volição e Motivação',
    description: 'Aspectos volitivos',
    detailedDescription: 'Evolução da motivação e capacidade de tomada de decisão.',
    category: 'clinical',
    defaultWidth: 600,
    defaultHeight: 400,
    permissionConfig: {
      domain: 'clinical',
    },
  },
  {
    id: 'evolution-chart-psychomotor',
    name: 'Atividade Psicomotora',
    description: 'Aspectos motores e comportamentais',
    detailedDescription: 'Acompanhamento da atividade motora e comportamental.',
    category: 'clinical',
    defaultWidth: 600,
    defaultHeight: 400,
    permissionConfig: {
      domain: 'clinical',
    },
  },
  {
    id: 'evolution-chart-memory',
    name: 'Memória',
    description: 'Diferentes tipos de memória',
    detailedDescription: 'Evolução da memória imediata, recente e remota.',
    category: 'clinical',
    defaultWidth: 600,
    defaultHeight: 400,
    permissionConfig: {
      domain: 'clinical',
    },
  },
  {
    id: 'evolution-chart-personality',
    name: 'Traços de Personalidade',
    description: 'Aspectos da personalidade',
    detailedDescription: 'Acompanhamento dos traços de personalidade ao longo do tratamento.',
    category: 'clinical',
    defaultWidth: 600,
    defaultHeight: 400,
    permissionConfig: {
      domain: 'clinical',
    },
  },
];

/**
 * ============================================================================
 * DASHBOARD CLINICAL CARDS - Dashboard Clinical Section
 * ============================================================================
 */
export const AVAILABLE_DASHBOARD_CLINICAL_CARDS: CardConfig[] = [
  {
    id: 'dashboard-active-complaints',
    name: 'Queixas Ativas',
    description: 'Número de queixas clínicas ativas',
    detailedDescription: 'Contagem de queixas clínicas marcadas como ativas (is_active=true) no sistema.',
    category: 'dashboard-cards',
    defaultWidth: 280,
    defaultHeight: 160,
    permissionConfig: {
      domain: 'clinical',
      requiresFullClinicalAccess: true,
    },
  },
  {
    id: 'dashboard-no-diagnosis',
    name: 'Sem Diagnóstico',
    description: 'Pacientes sem diagnóstico definido',
    detailedDescription: 'Contagem de pacientes ativos que ainda não possuem queixa clínica cadastrada ou marcada com has_no_diagnosis.',
    category: 'dashboard-cards',
    defaultWidth: 280,
    defaultHeight: 160,
    permissionConfig: {
      domain: 'clinical',
      requiresFullClinicalAccess: true,
    },
  },
];

/**
 * ============================================================================
 * MEDIA & MARKETING CARDS - SPRINT 7.4
 * ============================================================================
 */
export const AVAILABLE_MEDIA_CARDS: CardConfig[] = [
  {
    id: 'dashboard-whatsapp-unread',
    name: 'WhatsApp Não Lidas',
    description: 'Mensagens de WhatsApp não lidas',
    detailedDescription: 'Contagem total de mensagens não lidas nas conversas do WhatsApp integrado ao sistema.',
    category: 'dashboard-cards',
    defaultWidth: 280,
    defaultHeight: 160,
    permissionConfig: {
      domain: 'media',
      blockedFor: ['subordinate'],
    },
  },
  {
    id: 'media-website-visitors',
    name: 'Visitantes do Site',
    description: 'Visitas ao website no período',
    detailedDescription: 'Total de visitantes únicos e pageviews do website institucional.',
    category: 'dashboard-cards',
    defaultWidth: 300,
    defaultHeight: 180,
    permissionConfig: {
      domain: 'media',
      blockedFor: ['subordinate'],
    },
  },
  {
    id: 'media-ad-conversions',
    name: 'Conversões de Anúncios',
    description: 'Taxa de conversão de campanhas',
    detailedDescription: 'Métricas de performance de anúncios online (Google Ads, Facebook, etc).',
    category: 'dashboard-cards',
    defaultWidth: 300,
    defaultHeight: 180,
    permissionConfig: {
      domain: 'media',
      blockedFor: ['subordinate'],
    },
  },
  {
    id: 'media-lead-sources',
    name: 'Origem dos Leads',
    description: 'De onde vêm os novos pacientes',
    detailedDescription: 'Distribuição de origem dos leads: orgânico, anúncios, indicação, redes sociais.',
    category: 'dashboard-charts',
    defaultWidth: 400,
    defaultHeight: 300,
    permissionConfig: {
      domain: 'media',
      blockedFor: ['subordinate'],
    },
  },
  {
    id: 'media-contact-form-submissions',
    name: 'Formulários de Contato',
    description: 'Submissões de formulários no site',
    detailedDescription: 'Total de formulários de contato preenchidos no website.',
    category: 'dashboard-cards',
    defaultWidth: 300,
    defaultHeight: 180,
    permissionConfig: {
      domain: 'administrative',
      requiresFinancialAccess: false,
    },
  },
  {
    id: 'media-social-engagement',
    name: 'Engajamento Social',
    description: 'Interações em redes sociais',
    detailedDescription: 'Métricas de engajamento nas redes sociais (curtidas, comentários, compartilhamentos).',
    category: 'dashboard-cards',
    defaultWidth: 300,
    defaultHeight: 180,
    permissionConfig: {
      domain: 'administrative',
      requiresFinancialAccess: false,
    },
  },
];

/**
 * ============================================================================
 * ALL CARDS - Consolidated list
 * ============================================================================
 */
export const ALL_AVAILABLE_CARDS: CardConfig[] = [
  ...AVAILABLE_STAT_CARDS,
  ...AVAILABLE_FUNCTIONAL_CARDS,
  ...AVAILABLE_DASHBOARD_CARDS,
  ...AVAILABLE_DASHBOARD_CHARTS,
  ...AVAILABLE_TEAM_CARDS,
  ...AVAILABLE_CLINICAL_CARDS,
  ...AVAILABLE_DASHBOARD_CLINICAL_CARDS,
  ...AVAILABLE_MEDIA_CARDS,
];
