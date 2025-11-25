/**
 * PATIENT OVERVIEW CARD REGISTRY
 * 
 * FASE C1.2: Registry de cards para a Visão Geral do PatientDetail
 * 
 * Este arquivo contém:
 * - PATIENT_OVERVIEW_AVAILABLE_CARDS: metadados dos cards disponíveis
 * - Componentes placeholder para os 12 cards MVP
 * - renderPatientOverviewCard(): função central de renderização
 * 
 * IMPORTANTE: Nesta fase (C1.2), os cards são apenas placeholders.
 * A implementação real será feita em C1.6.
 */

import type { PatientOverviewCardProps, PatientOverviewCardMetadata } from '@/types/patientOverviewCardTypes';

// ============================================================================
// CARDS DISPONÍVEIS (MVP - 12 CARDS)
// ============================================================================

/**
 * Lista de todos os cards disponíveis para a Visão Geral do paciente.
 * 
 * Organizados por domínio:
 * - Financial: 3 cards
 * - Clinical: 3 cards
 * - Sessions: 3 cards
 * - Contact: 3 cards
 */
export const PATIENT_OVERVIEW_AVAILABLE_CARDS: PatientOverviewCardMetadata[] = [
  // ========== FINANCIAL DOMAIN (3 cards) ==========
  {
    id: 'patient-revenue-month',
    label: 'Faturamento do Mês',
    description: 'Resumo financeiro mensal do paciente',
    domain: 'financial',
  },
  {
    id: 'patient-pending-sessions',
    label: 'Sessões Pendentes',
    description: 'Sessões realizadas aguardando pagamento',
    domain: 'financial',
  },
  {
    id: 'patient-nfse-count',
    label: 'NFSe Emitidas',
    description: 'Total de notas fiscais emitidas',
    domain: 'financial',
  },

  // ========== CLINICAL DOMAIN (3 cards) ==========
  {
    id: 'patient-complaints-summary',
    label: 'Resumo de Queixas',
    description: 'Queixas clínicas ativas do paciente',
    domain: 'clinical',
  },
  {
    id: 'patient-medications-list',
    label: 'Medicações',
    description: 'Lista de medicações em uso',
    domain: 'clinical',
  },
  {
    id: 'patient-diagnoses-list',
    label: 'Diagnósticos',
    description: 'Códigos CID e diagnósticos ativos',
    domain: 'clinical',
  },

  // ========== SESSIONS DOMAIN (3 cards) ==========
  {
    id: 'patient-sessions-timeline',
    label: 'Timeline de Sessões',
    description: 'Histórico recente de sessões',
    domain: 'sessions',
  },
  {
    id: 'patient-session-frequency',
    label: 'Frequência',
    description: 'Padrão de frequência das sessões',
    domain: 'sessions',
  },
  {
    id: 'patient-attendance-rate',
    label: 'Taxa de Comparecimento',
    description: 'Porcentagem de presença vs faltas',
    domain: 'sessions',
  },

  // ========== CONTACT DOMAIN (3 cards) ==========
  {
    id: 'patient-contact-info',
    label: 'Informações de Contato',
    description: 'Telefone, email, endereço',
    domain: 'contact',
  },
  {
    id: 'patient-consent-status',
    label: 'Status de Consentimento',
    description: 'LGPD e termos aceitos',
    domain: 'contact',
  },
  {
    id: 'patient-personal-data',
    label: 'Dados Pessoais',
    description: 'CPF, data de nascimento, responsáveis',
    domain: 'contact',
  },
];

// ============================================================================
// COMPONENTES PLACEHOLDER (12 CARDS MVP)
// ============================================================================

// ---------- FINANCIAL CARDS ----------

export const PatientRevenueMonthCard = (props: PatientOverviewCardProps) => {
  return <div>Card: Faturamento do Mês</div>;
};

export const PatientPendingSessionsCard = (props: PatientOverviewCardProps) => {
  return <div>Card: Sessões Pendentes</div>;
};

export const PatientNfseCountCard = (props: PatientOverviewCardProps) => {
  return <div>Card: NFSe Emitidas</div>;
};

// ---------- CLINICAL CARDS ----------

export const PatientComplaintsSummaryCard = (props: PatientOverviewCardProps) => {
  return <div>Card: Resumo de Queixas</div>;
};

export const PatientMedicationsListCard = (props: PatientOverviewCardProps) => {
  return <div>Card: Medicações</div>;
};

export const PatientDiagnosesListCard = (props: PatientOverviewCardProps) => {
  return <div>Card: Diagnósticos</div>;
};

// ---------- SESSIONS CARDS ----------

export const PatientSessionsTimelineCard = (props: PatientOverviewCardProps) => {
  return <div>Card: Timeline de Sessões</div>;
};

export const PatientSessionFrequencyCard = (props: PatientOverviewCardProps) => {
  return <div>Card: Frequência</div>;
};

export const PatientAttendanceRateCard = (props: PatientOverviewCardProps) => {
  return <div>Card: Taxa de Comparecimento</div>;
};

// ---------- CONTACT CARDS ----------

export const PatientContactInfoCard = (props: PatientOverviewCardProps) => {
  return <div>Card: Informações de Contato</div>;
};

export const PatientConsentStatusCard = (props: PatientOverviewCardProps) => {
  return <div>Card: Status de Consentimento</div>;
};

export const PatientPersonalDataCard = (props: PatientOverviewCardProps) => {
  return <div>Card: Dados Pessoais</div>;
};

// ============================================================================
// FUNÇÃO CENTRAL DE RENDERIZAÇÃO
// ============================================================================

/**
 * Renderiza um card da Visão Geral do paciente baseado no cardId.
 * 
 * @param cardId - ID único do card (ex: 'patient-revenue-month')
 * @param props - Props a serem passadas para o componente do card
 * @returns Componente React do card ou null se não encontrado
 * 
 * FASE C1.2: Retorna apenas placeholders.
 * FASE C1.6: Será atualizada com implementação real dos cards.
 */
export function renderPatientOverviewCard(
  cardId: string,
  props: PatientOverviewCardProps = {}
): React.ReactNode {
  switch (cardId) {
    // Financial cards
    case 'patient-revenue-month':
      return <PatientRevenueMonthCard {...props} />;
    case 'patient-pending-sessions':
      return <PatientPendingSessionsCard {...props} />;
    case 'patient-nfse-count':
      return <PatientNfseCountCard {...props} />;

    // Clinical cards
    case 'patient-complaints-summary':
      return <PatientComplaintsSummaryCard {...props} />;
    case 'patient-medications-list':
      return <PatientMedicationsListCard {...props} />;
    case 'patient-diagnoses-list':
      return <PatientDiagnosesListCard {...props} />;

    // Sessions cards
    case 'patient-sessions-timeline':
      return <PatientSessionsTimelineCard {...props} />;
    case 'patient-session-frequency':
      return <PatientSessionFrequencyCard {...props} />;
    case 'patient-attendance-rate':
      return <PatientAttendanceRateCard {...props} />;

    // Contact cards
    case 'patient-contact-info':
      return <PatientContactInfoCard {...props} />;
    case 'patient-consent-status':
      return <PatientConsentStatusCard {...props} />;
    case 'patient-personal-data':
      return <PatientPersonalDataCard {...props} />;

    // Fallback para IDs não reconhecidos
    default:
      console.warn(`[patientOverviewCardRegistry] Card não encontrado: ${cardId}`);
      return null;
  }
}
