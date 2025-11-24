/**
 * ============================================================================
 * TRACK C1.1 - Patient Overview Cards Metadata
 * ============================================================================
 * 
 * Camada de metadados para os cards da aba "Visão Geral" do PatientDetail.
 * 
 * Esta fase NÃO altera o layout ou JSX atual - apenas define metadados
 * que serão usados nas próximas fases para controle de visibilidade.
 * 
 * ============================================================================
 */

// ============================================================================
// TIPOS BASE
// ============================================================================

/**
 * Categoria de card na Visão Geral do Paciente
 * - functional: Cards de ações, atalhos, fluxos (ex: agendar, registrar queixa)
 * - statistical: Cards de métricas, números, gráficos (ex: frequência, pagamentos)
 */
export type PatientOverviewCardCategory = 'functional' | 'statistical';

/**
 * Domínios de permissão aplicáveis aos cards
 */
export type PatientOverviewDomain =
  | 'clinical'        // Dados clínicos, prontuário, sessões
  | 'financial'       // Valores, NFSe, pagamentos
  | 'administrative'  // Gestão, cadastro, configurações
  | 'communication'   // WhatsApp, notificações (futuro)
  | 'general';        // Informações neutras, não específicas

/**
 * Escopo de usuário que pode ver o card
 * Por enquanto conservador: 'all' para maioria dos casos
 */
export type PatientOverviewUserScope =
  | 'all'               // Qualquer usuário com acesso ao paciente
  | 'psychologist'      // Apenas psicólogos
  | 'psychiatrist'      // Apenas psiquiatras
  | 'nutritionist'      // Apenas nutricionistas
  | 'speech_therapist'  // Apenas fonoaudiólogos
  | 'assistant'         // Apenas assistentes
  | 'accountant'        // Apenas contadores
  | 'admin'             // Apenas admins
  | 'owner';            // Apenas owners

/**
 * Escopo de abordagem clínica (futuro)
 * Por enquanto, quase tudo será null
 */
export type PatientOverviewApproachScope =
  | null
  | 'psychopathological_basic'; // Template psicopatológico básico

// ============================================================================
// INTERFACE PRINCIPAL
// ============================================================================

/**
 * Definição completa de metadados de um card da Visão Geral
 */
export interface PatientOverviewCardDefinition {
  /** ID único e estável do card (deve corresponder ao ID usado no JSX atual) */
  id: string;
  
  /** Título do card (para UI futura) */
  title: string;
  
  /** Descrição opcional (para tooltips, docs) */
  description?: string;
  
  /** Categoria: funcional ou estatístico */
  cardCategory: PatientOverviewCardCategory;
  
  /** Domínio de permissão */
  domain: PatientOverviewDomain;
  
  /** Lista de tipos de usuário que podem ver o card */
  userScope: PatientOverviewUserScope[];
  
  /** Abordagem clínica específica (null = todas) */
  approachScope: PatientOverviewApproachScope;
  
  /** Se deve aparecer no layout padrão (usado em fases futuras) */
  pinnedByDefault?: boolean;
  
  /** Se é um card core/essencial (não usado ainda, reservado para futuro) */
  core?: boolean;
}

// ============================================================================
// REGISTRO DE CARDS
// ============================================================================

/**
 * Registro central de todos os cards da aba "Visão Geral"
 * 
 * IMPORTANTE: Os IDs aqui correspondem aos IDs usados em PatientDetail.tsx
 * NÃO altere os IDs sem sincronizar com o código existente.
 */
export const PATIENT_OVERVIEW_CARD_DEFINITIONS: PatientOverviewCardDefinition[] = [
  // ===== FUNCTIONAL CARDS =====
  
  {
    id: 'patient-next-appointment',
    title: 'Próximo Agendamento',
    description: 'Exibe data e horário da próxima sessão agendada',
    cardCategory: 'functional',
    domain: 'clinical',
    userScope: ['all'],
    approachScope: null,
    pinnedByDefault: true,
    core: true
  },
  
  {
    id: 'patient-contact-info',
    title: 'Informações de Contato',
    description: 'Telefone, email, endereço e CPF do paciente',
    cardCategory: 'functional',
    domain: 'general',
    userScope: ['all'],
    approachScope: null,
    pinnedByDefault: true,
    core: true
  },
  
  {
    id: 'patient-clinical-complaint',
    title: 'Queixa Clínica',
    description: 'Queixa principal relatada pelo paciente',
    cardCategory: 'functional',
    domain: 'clinical',
    userScope: ['all'], // Por enquanto all, mas requer acesso clínico no canSeeOverviewCard
    approachScope: null,
    pinnedByDefault: true,
    core: true
  },
  
  {
    id: 'patient-clinical-info',
    title: 'Informações Clínicas',
    description: 'Profissional responsável, valor da sessão, modalidade e horário padrão',
    cardCategory: 'functional',
    domain: 'administrative', // Misto: clinical + administrative, mas predomina administrativo
    userScope: ['all'],
    approachScope: null,
    pinnedByDefault: true,
    core: true
  },
  
  {
    id: 'patient-history',
    title: 'Histórico',
    description: 'Histórico de alterações de sessões e agendamentos',
    cardCategory: 'functional',
    domain: 'administrative',
    userScope: ['all'],
    approachScope: null,
    pinnedByDefault: true,
    core: false
  },
  
  {
    id: 'recent-notes',
    title: 'Últimas Notas',
    description: 'Notas clínicas mais recentes das sessões',
    cardCategory: 'functional',
    domain: 'clinical',
    userScope: ['all'],
    approachScope: null,
    pinnedByDefault: true,
    core: false
  },
  
  {
    id: 'quick-actions',
    title: 'Ações Rápidas',
    description: 'Atalhos para ações comuns: nova sessão, nota, recibo, exportar',
    cardCategory: 'functional',
    domain: 'general',
    userScope: ['all'],
    approachScope: null,
    pinnedByDefault: true,
    core: true
  },
  
  // ===== STATISTICAL CARDS =====
  
  {
    id: 'payment-summary',
    title: 'Resumo de Pagamentos',
    description: 'Total faturado, recebido e pendente',
    cardCategory: 'statistical',
    domain: 'financial',
    userScope: ['all'], // Será bloqueado por hasFinancialAccess no canSeeOverviewCard
    approachScope: null,
    pinnedByDefault: true,
    core: false
  },
  
  {
    id: 'session-frequency',
    title: 'Frequência de Sessões',
    description: 'Dia/horário padrão e taxa de comparecimento',
    cardCategory: 'statistical',
    domain: 'administrative', // Pode ser considerado clinical também, mas é mais administrativo
    userScope: ['all'],
    approachScope: null,
    pinnedByDefault: true,
    core: false
  }
];

/**
 * Mapa de definições por ID para acesso rápido
 */
export const PATIENT_OVERVIEW_CARD_DEFINITIONS_BY_ID: Record<string, PatientOverviewCardDefinition> = 
  PATIENT_OVERVIEW_CARD_DEFINITIONS.reduce((acc, card) => {
    acc[card.id] = card;
    return acc;
  }, {} as Record<string, PatientOverviewCardDefinition>);

// ============================================================================
// HELPERS DE CONSULTA
// ============================================================================

/**
 * Recupera a definição de metadados de um card pelo ID
 * 
 * @param cardId - ID do card (ex: 'patient-next-appointment')
 * @returns Definição do card ou undefined se não encontrado
 */
export function getPatientOverviewCardDefinition(
  cardId: string
): PatientOverviewCardDefinition | undefined {
  return PATIENT_OVERVIEW_CARD_DEFINITIONS_BY_ID[cardId];
}

// ============================================================================
// CONTEXTO DE PERMISSÕES (interface para canSeeOverviewCard)
// ============================================================================

/**
 * Contexto de permissões do usuário para determinar visibilidade de cards
 * 
 * IMPORTANTE: Este contexto será montado no PatientDetail.tsx em fases futuras.
 * Aqui apenas definimos a interface necessária.
 */
export interface PatientOverviewContext {
  /** Role profissional do usuário (ex: 'psychologist', 'psychiatrist') */
  userProfessionalRole?: string;
  
  /** Roles globais do usuário (ex: ['admin'], ['psychologist']) */
  userGlobalRoles: string[];
  
  /** Se o usuário tem acesso clínico (de useEffectivePermissions) */
  hasClinicalAccess: boolean;
  
  /** Se o usuário tem acesso financeiro (de useEffectivePermissions) */
  hasFinancialAccess: boolean;
  
  /** Abordagem clínica ativa do usuário/contexto (futuro, por enquanto sempre null) */
  activeApproach?: string | null;
}

// ============================================================================
// HELPER DE PERMISSÃO (PURA, SEM HOOKS)
// ============================================================================

/**
 * Determina se um card deve ser visível para o usuário dado o contexto
 * 
 * IMPORTANTE: Esta função é PURA e não chama hooks.
 * O contexto deve ser montado pelo componente que a chama.
 * 
 * @param card - Definição do card a verificar
 * @param context - Contexto de permissões do usuário
 * @returns true se o card deve ser exibido, false caso contrário
 */
export function canSeeOverviewCard(
  card: PatientOverviewCardDefinition,
  context: PatientOverviewContext
): boolean {
  // ===== 1. VERIFICAR USER SCOPE =====
  // Se userScope contém 'all', libera independente da profissão
  if (!card.userScope.includes('all')) {
    // Se não contém 'all', precisa fazer match com professional role
    const userRole = context.userProfessionalRole;
    
    if (!userRole || !card.userScope.includes(userRole as PatientOverviewUserScope)) {
      // Não há match entre a profissão do usuário e os scopes permitidos
      return false;
    }
  }
  
  // ===== 2. VERIFICAR DOMAIN (permissões de acesso) =====
  // Bloquear cards financeiros se não tem acesso financeiro
  if (card.domain === 'financial' && !context.hasFinancialAccess) {
    return false;
  }
  
  // Bloquear cards clínicos se não tem acesso clínico
  if (card.domain === 'clinical' && !context.hasClinicalAccess) {
    return false;
  }
  
  // Para 'general', 'administrative' e 'communication': 
  // Por enquanto, não bloqueamos aqui.
  // Bloqueios finos virão de outras camadas (RLS, permission engine).
  
  // ===== 3. VERIFICAR APPROACH SCOPE =====
  // Se o card não tem approachScope (null), libera para qualquer abordagem
  if (card.approachScope === null) {
    return true; // Sem restrição de abordagem
  }
  
  // Se o card tem approachScope específico, verificar se context.activeApproach corresponde
  if (card.approachScope === 'psychopathological_basic') {
    // Por enquanto, vamos liberar se activeApproach for null ou 'psychopathological_basic'
    // NÃO implementamos lógica de múltiplas abordagens ainda
    const userApproach = context.activeApproach;
    
    if (userApproach === null || userApproach === 'psychopathological_basic') {
      return true;
    }
    
    return false; // Abordagem não compatível
  }
  
  // Se chegou aqui, passou por todas as verificações
  return true;
}
