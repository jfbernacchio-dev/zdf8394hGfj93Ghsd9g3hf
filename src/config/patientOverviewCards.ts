/**
 * ============================================================================
 * PATIENT OVERVIEW CARDS CATALOG - FASE C1.1
 * ============================================================================
 * 
 * Catálogo centralizado de metadados dos cards da aba "Visão Geral"
 * do PatientDetail.tsx
 * 
 * Este arquivo define:
 * - Estrutura de metadados (PatientOverviewCardDefinition)
 * - Registro completo de todos os cards (PATIENT_OVERVIEW_CARDS)
 * - Funções auxiliares puras para consulta
 * 
 * ⚠️ IMPORTANTE:
 * - Este arquivo NÃO contém JSX ou lógica de renderização
 * - Este arquivo NÃO contém hooks ou React
 * - Este arquivo NÃO acessa localStorage ou faz IO
 * - Apenas tipos, dados e funções puras
 */

import type { PermissionDomain } from '@/types/permissions';

/**
 * Categoria do card na aba Visão Geral
 * - statistical: Cards de métricas/estatísticas (KPIs, contadores)
 * - functional: Cards com funcionalidade (ações, info, formulários)
 */
export type PatientOverviewCardCategory = 'statistical' | 'functional';

/**
 * Definição completa de metadados de um card da Visão Geral
 * 
 * Extende conceitos de CardConfig mas focado no contexto de paciente
 */
export interface PatientOverviewCardDefinition {
  /** Identificador único do card (ex: 'patient-stat-total') */
  id: string;
  
  /** Nome exibido do card */
  title: string;
  
  /** Descrição curta técnica */
  description: string;
  
  /** Categoria: 'statistical' ou 'functional' */
  cardCategory: PatientOverviewCardCategory;
  
  /** 
   * Domínio de permissão
   * - clinical: Dados clínicos sensíveis
   * - financial: Valores, NFSe, receitas
   * - administrative: Sessões, agenda, contatos
   * - general: Sem restrição específica
   */
  domain: PermissionDomain;
  
  /** 
   * Se true, requer acesso financeiro (hasFinancialAccess)
   * Usado para cards financeiros de subordinados
   */
  requiresFinancialAccess?: boolean;
  
  /** 
   * Se true, requer acesso clínico completo (canFullSeeClinic)
   * Usado para dados clínicos sensíveis
   */
  requiresFullClinicalAccess?: boolean;
  
  /** 
   * Roles bloqueadas explicitamente para este card
   * Ex: ['subordinate'] para cards administrativos avançados
   */
  blockedFor?: string[];
  
  /** Se true, o card é exibido por padrão (sem customização) */
  isDefaultVisible: boolean;
  
  /** Se true, o card está em desenvolvimento ou experimental */
  isExperimental?: boolean;
  
  /** Largura padrão recomendada (usado pelo grid futuro) */
  defaultWidth?: number;
  
  /** Altura padrão recomendada (usado pelo grid futuro) */
  defaultHeight?: number;
  
  /** 
   * Informações adicionais (opcional)
   * Para documentação ou uso futuro em templates
   */
  metadata?: {
    /** Tags para busca/filtro */
    tags?: string[];
    
    /** Prioridade de exibição (menor = mais importante) */
    priority?: number;
    
    /** Dependências de dados (ex: ['sessions', 'nfse']) */
    dataDependencies?: string[];
  };
}

/**
 * ============================================================================
 * REGISTRO DE CARDS ESTATÍSTICOS (STATS)
 * ============================================================================
 * 
 * Cards de métricas, contadores e KPIs do paciente
 */
const STATISTICAL_CARDS: Record<string, PatientOverviewCardDefinition> = {
  'patient-stat-total': {
    id: 'patient-stat-total',
    title: 'Total no Mês',
    description: 'Total de sessões no mês atual',
    cardCategory: 'statistical',
    domain: 'administrative',
    isDefaultVisible: true,
    defaultWidth: 200,
    defaultHeight: 120,
    metadata: {
      tags: ['sessões', 'mês', 'contagem'],
      priority: 1,
      dataDependencies: ['sessions'],
    },
  },
  
  'patient-stat-attended': {
    id: 'patient-stat-attended',
    title: 'Comparecidas',
    description: 'Sessões comparecidas no mês',
    cardCategory: 'statistical',
    domain: 'administrative',
    isDefaultVisible: true,
    defaultWidth: 200,
    defaultHeight: 120,
    metadata: {
      tags: ['sessões', 'comparecimento', 'status'],
      priority: 2,
      dataDependencies: ['sessions'],
    },
  },
  
  'patient-stat-scheduled': {
    id: 'patient-stat-scheduled',
    title: 'Agendadas',
    description: 'Sessões agendadas no mês',
    cardCategory: 'statistical',
    domain: 'administrative',
    isDefaultVisible: true,
    defaultWidth: 200,
    defaultHeight: 120,
    metadata: {
      tags: ['sessões', 'agenda', 'futuro'],
      priority: 3,
      dataDependencies: ['sessions'],
    },
  },
  
  'patient-stat-unpaid': {
    id: 'patient-stat-unpaid',
    title: 'A Pagar',
    description: 'Sessões não pagas no mês',
    cardCategory: 'statistical',
    domain: 'financial',
    requiresFinancialAccess: true,
    isDefaultVisible: true,
    defaultWidth: 200,
    defaultHeight: 120,
    metadata: {
      tags: ['pagamento', 'financeiro', 'pendente'],
      priority: 4,
      dataDependencies: ['sessions'],
    },
  },
  
  'patient-stat-nfse': {
    id: 'patient-stat-nfse',
    title: 'NFSe Emitida',
    description: 'Sessões com NFSe emitida',
    cardCategory: 'statistical',
    domain: 'financial',
    isDefaultVisible: true,
    defaultWidth: 200,
    defaultHeight: 120,
    metadata: {
      tags: ['nfse', 'fiscal', 'sessões'],
      priority: 5,
      dataDependencies: ['sessions', 'nfse_issued'],
    },
  },
  
  'patient-stat-total-all': {
    id: 'patient-stat-total-all',
    title: 'Total Geral',
    description: 'Todas as sessões registradas',
    cardCategory: 'statistical',
    domain: 'administrative',
    isDefaultVisible: false, // Não aparece por padrão
    defaultWidth: 200,
    defaultHeight: 120,
    metadata: {
      tags: ['sessões', 'histórico', 'total'],
      priority: 10,
      dataDependencies: ['sessions'],
    },
  },
  
  'patient-stat-revenue-month': {
    id: 'patient-stat-revenue-month',
    title: 'Faturamento do Mês',
    description: 'Valor total faturado no mês',
    cardCategory: 'statistical',
    domain: 'financial',
    requiresFinancialAccess: true,
    isDefaultVisible: false,
    defaultWidth: 200,
    defaultHeight: 120,
    metadata: {
      tags: ['faturamento', 'receita', 'valor'],
      priority: 6,
      dataDependencies: ['sessions'],
    },
  },
  
  'patient-stat-paid-month': {
    id: 'patient-stat-paid-month',
    title: 'Recebido no Mês',
    description: 'Valor recebido (pago) no mês',
    cardCategory: 'statistical',
    domain: 'financial',
    requiresFinancialAccess: true,
    isDefaultVisible: false,
    defaultWidth: 200,
    defaultHeight: 120,
    metadata: {
      tags: ['recebido', 'pago', 'valor'],
      priority: 7,
      dataDependencies: ['sessions'],
    },
  },
  
  'patient-stat-missed-month': {
    id: 'patient-stat-missed-month',
    title: 'Faltas no Mês',
    description: 'Total de faltas no mês',
    cardCategory: 'statistical',
    domain: 'administrative',
    isDefaultVisible: false,
    defaultWidth: 200,
    defaultHeight: 120,
    metadata: {
      tags: ['faltas', 'ausência', 'status'],
      priority: 8,
      dataDependencies: ['sessions'],
    },
  },
  
  'patient-stat-attendance-rate': {
    id: 'patient-stat-attendance-rate',
    title: 'Taxa de Comparecimento',
    description: 'Porcentagem de comparecimento',
    cardCategory: 'statistical',
    domain: 'administrative',
    isDefaultVisible: false,
    defaultWidth: 200,
    defaultHeight: 120,
    metadata: {
      tags: ['taxa', 'comparecimento', 'percentual'],
      priority: 9,
      dataDependencies: ['sessions'],
    },
  },
  
  'patient-stat-unscheduled-month': {
    id: 'patient-stat-unscheduled-month',
    title: 'Desmarcadas no Mês',
    description: 'Sessões desmarcadas no mês',
    cardCategory: 'statistical',
    domain: 'administrative',
    isDefaultVisible: false,
    defaultWidth: 200,
    defaultHeight: 120,
    metadata: {
      tags: ['desmarcadas', 'cancelamento', 'status'],
      priority: 11,
      dataDependencies: ['sessions'],
    },
  },
};

/**
 * ============================================================================
 * REGISTRO DE CARDS FUNCIONAIS
 * ============================================================================
 * 
 * Cards com ações, informações detalhadas e funcionalidades interativas
 */
const FUNCTIONAL_CARDS: Record<string, PatientOverviewCardDefinition> = {
  'patient-next-appointment': {
    id: 'patient-next-appointment',
    title: 'Próximo Agendamento',
    description: 'Detalhes da próxima sessão agendada',
    cardCategory: 'functional',
    domain: 'administrative',
    isDefaultVisible: true,
    defaultWidth: 350,
    defaultHeight: 220,
    metadata: {
      tags: ['agenda', 'próximo', 'futuro'],
      priority: 1,
      dataDependencies: ['sessions'],
    },
  },
  
  'patient-contact-info': {
    id: 'patient-contact-info',
    title: 'Contato',
    description: 'Informações de contato do paciente',
    cardCategory: 'functional',
    domain: 'general',
    isDefaultVisible: true,
    defaultWidth: 350,
    defaultHeight: 200,
    metadata: {
      tags: ['contato', 'telefone', 'email'],
      priority: 2,
      dataDependencies: ['patients'],
    },
  },
  
  'patient-clinical-complaint': {
    id: 'patient-clinical-complaint',
    title: 'Queixa Clínica',
    description: 'Queixa principal registrada',
    cardCategory: 'functional',
    domain: 'clinical',
    isDefaultVisible: true,
    defaultWidth: 431,
    defaultHeight: 364,
    metadata: {
      tags: ['clínica', 'queixa', 'diagnóstico'],
      priority: 3,
      dataDependencies: ['patient_complaints'],
    },
  },
  
  'patient-clinical-info': {
    id: 'patient-clinical-info',
    title: 'Informações Clínicas',
    description: 'Dados clínicos e administrativos do paciente',
    cardCategory: 'functional',
    domain: 'administrative',
    isDefaultVisible: true,
    defaultWidth: 700,
    defaultHeight: 280,
    metadata: {
      tags: ['profissional', 'valor', 'modalidade'],
      priority: 4,
      dataDependencies: ['patients', 'profiles'],
    },
  },
  
  'patient-history': {
    id: 'patient-history',
    title: 'Histórico',
    description: 'Histórico de alterações de sessões',
    cardCategory: 'functional',
    domain: 'administrative',
    isDefaultVisible: true,
    defaultWidth: 350,
    defaultHeight: 280,
    metadata: {
      tags: ['histórico', 'alterações', 'auditoria'],
      priority: 5,
      dataDependencies: ['session_history'],
    },
  },
  
  'recent-notes': {
    id: 'recent-notes',
    title: 'Últimas Notas',
    description: 'Notas clínicas recentes',
    cardCategory: 'functional',
    domain: 'clinical',
    isDefaultVisible: false,
    defaultWidth: 350,
    defaultHeight: 300,
    metadata: {
      tags: ['notas', 'clínica', 'recente'],
      priority: 6,
      dataDependencies: ['sessions'],
    },
  },
  
  'quick-actions': {
    id: 'quick-actions',
    title: 'Ações Rápidas',
    description: 'Botões de ações comuns',
    cardCategory: 'functional',
    domain: 'administrative',
    isDefaultVisible: false,
    defaultWidth: 350,
    defaultHeight: 280,
    metadata: {
      tags: ['ações', 'botões', 'comandos'],
      priority: 7,
      dataDependencies: [],
    },
  },
  
  'payment-summary': {
    id: 'payment-summary',
    title: 'Resumo de Pagamentos',
    description: 'Resumo financeiro do paciente',
    cardCategory: 'functional',
    domain: 'financial',
    requiresFinancialAccess: true,
    isDefaultVisible: false,
    defaultWidth: 350,
    defaultHeight: 250,
    metadata: {
      tags: ['pagamento', 'resumo', 'financeiro'],
      priority: 8,
      dataDependencies: ['sessions'],
    },
  },
  
  'session-frequency': {
    id: 'session-frequency',
    title: 'Frequência de Sessões',
    description: 'Padrão de atendimento do paciente',
    cardCategory: 'functional',
    domain: 'administrative',
    isDefaultVisible: false,
    defaultWidth: 350,
    defaultHeight: 250,
    metadata: {
      tags: ['frequência', 'padrão', 'regularidade'],
      priority: 9,
      dataDependencies: ['patients', 'sessions'],
    },
  },
};

/**
 * ============================================================================
 * REGISTRO COMPLETO DE TODOS OS CARDS DA VISÃO GERAL
 * ============================================================================
 */
export const PATIENT_OVERVIEW_CARDS: Record<string, PatientOverviewCardDefinition> = {
  ...STATISTICAL_CARDS,
  ...FUNCTIONAL_CARDS,
};

/**
 * ============================================================================
 * FUNÇÕES AUXILIARES PURAS
 * ============================================================================
 */

/**
 * Busca a definição de um card pelo ID
 * 
 * @param id - ID do card (ex: 'patient-stat-total')
 * @returns Definição do card ou undefined se não encontrado
 */
export function getPatientOverviewCardDefinition(
  id: string
): PatientOverviewCardDefinition | undefined {
  return PATIENT_OVERVIEW_CARDS[id];
}

/**
 * Retorna IDs dos cards que devem aparecer por padrão (sem customização)
 * 
 * @returns Array de IDs dos cards visíveis por padrão
 */
export function getDefaultPatientOverviewCardIds(): string[] {
  return Object.values(PATIENT_OVERVIEW_CARDS)
    .filter(card => card.isDefaultVisible)
    .sort((a, b) => (a.metadata?.priority ?? 999) - (b.metadata?.priority ?? 999))
    .map(card => card.id);
}

/**
 * Retorna todos os cards de uma categoria específica
 * 
 * @param category - 'statistical' ou 'functional'
 * @returns Array de definições de cards da categoria
 */
export function getCardsByCategory(
  category: PatientOverviewCardCategory
): PatientOverviewCardDefinition[] {
  return Object.values(PATIENT_OVERVIEW_CARDS).filter(
    card => card.cardCategory === category
  );
}

/**
 * Retorna todos os cards de um domínio específico
 * 
 * @param domain - Domínio de permissão
 * @returns Array de definições de cards do domínio
 */
export function getCardsByDomain(
  domain: PermissionDomain
): PatientOverviewCardDefinition[] {
  return Object.values(PATIENT_OVERVIEW_CARDS).filter(
    card => card.domain === domain
  );
}

/**
 * Retorna todos os cards que requerem acesso financeiro
 * 
 * @returns Array de definições de cards financeiros
 */
export function getFinancialCards(): PatientOverviewCardDefinition[] {
  return Object.values(PATIENT_OVERVIEW_CARDS).filter(
    card => card.requiresFinancialAccess
  );
}

/**
 * Retorna todos os cards que requerem acesso clínico completo
 * 
 * @returns Array de definições de cards clínicos sensíveis
 */
export function getFullClinicalCards(): PatientOverviewCardDefinition[] {
  return Object.values(PATIENT_OVERVIEW_CARDS).filter(
    card => card.requiresFullClinicalAccess
  );
}

/**
 * Verifica se um card existe no registro
 * 
 * @param id - ID do card
 * @returns true se o card existe
 */
export function cardExists(id: string): boolean {
  return id in PATIENT_OVERVIEW_CARDS;
}

/**
 * Retorna array com todos os IDs de cards registrados
 * 
 * @returns Array de todos os IDs
 */
export function getAllCardIds(): string[] {
  return Object.keys(PATIENT_OVERVIEW_CARDS);
}

/**
 * Retorna contagem total de cards registrados
 * 
 * @returns Número total de cards
 */
export function getTotalCardsCount(): number {
  return Object.keys(PATIENT_OVERVIEW_CARDS).length;
}

/**
 * Retorna contagem de cards por categoria
 * 
 * @returns Objeto com contagens { statistical: number, functional: number }
 */
export function getCardCountByCategory(): Record<PatientOverviewCardCategory, number> {
  const counts = { statistical: 0, functional: 0 } as Record<PatientOverviewCardCategory, number>;
  
  Object.values(PATIENT_OVERVIEW_CARDS).forEach(card => {
    counts[card.cardCategory]++;
  });
  
  return counts;
}
