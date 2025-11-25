/**
 * PATIENT OVERVIEW CARD REGISTRY
 * 
 * FASE C1.6: Implementação real dos cards da Visão Geral do PatientDetail
 * 
 * Este arquivo contém:
 * - PATIENT_OVERVIEW_AVAILABLE_CARDS: metadados dos cards disponíveis
 * - Componentes funcionais para os 12 cards MVP
 * - renderPatientOverviewCard(): função central de renderização
 * 
 * DADOS USADOS: patient, sessions, nfseIssued, complaints (já disponíveis no PatientDetail)
 */

import React from 'react';
import { format, parseISO, startOfMonth, endOfMonth, differenceInDays, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatBrazilianCurrency } from '@/lib/patientFinancialUtils';
import { 
  DollarSign, 
  Receipt, 
  FileText, 
  Stethoscope, 
  Pill, 
  ClipboardList,
  CalendarDays,
  Activity,
  TrendingUp,
  Phone,
  Shield,
  User,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
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

// ============================================================================
// FINANCIAL CARDS (3)
// ============================================================================

export const PatientRevenueMonthCard = ({ patient, sessions = [] }: PatientOverviewCardProps) => {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  // Filtrar sessões do mês atual que estão pagas
  const currentMonthSessions = sessions.filter(s => {
    if (!s.date) return false;
    const sessionDate = parseISO(s.date);
    return sessionDate >= monthStart && sessionDate <= monthEnd && s.paid && s.status === 'attended';
  });

  let revenue = 0;
  if (patient?.monthly_price) {
    // Paciente mensal: se tem sessão paga no mês, cobra 1x
    revenue = currentMonthSessions.length > 0 ? Number(patient.session_value || 0) : 0;
  } else {
    // Paciente por sessão: soma dos valores
    revenue = currentMonthSessions.reduce((sum, s) => sum + Number(s.value || 0), 0);
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Faturamento do Mês</CardTitle>
        <DollarSign className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formatBrazilianCurrency(revenue)}</div>
        <p className="text-xs text-muted-foreground mt-1">
          Baseado em {currentMonthSessions.length} sessão(ões) paga(s) em {format(now, 'MMMM/yyyy', { locale: ptBR })}
        </p>
      </CardContent>
    </Card>
  );
};

export const PatientPendingSessionsCard = ({ patient, sessions = [] }: PatientOverviewCardProps) => {
  // Filtrar sessões realizadas mas não pagas
  const pendingSessions = sessions.filter(s => s.status === 'attended' && !s.paid);

  let pendingValue = 0;
  if (patient?.monthly_price) {
    // Paciente mensal: agrupar por mês
    const monthsSet = new Set(
      pendingSessions.map(s => format(parseISO(s.date), 'yyyy-MM'))
    );
    pendingValue = monthsSet.size * Number(patient.session_value || 0);
  } else {
    // Paciente por sessão: soma direta
    pendingValue = pendingSessions.reduce((sum, s) => sum + Number(s.value || 0), 0);
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Sessões Pendentes</CardTitle>
        <Receipt className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{pendingSessions.length}</div>
        <p className="text-xs text-muted-foreground mt-1">
          Total em aberto: {formatBrazilianCurrency(pendingValue)}
        </p>
      </CardContent>
    </Card>
  );
};

export const PatientNfseCountCard = ({ patient, nfseIssued = [] }: PatientOverviewCardProps) => {
  // Filtrar NFSe deste paciente (se patient_id disponível)
  const patientNfse = patient?.id 
    ? nfseIssued.filter(n => n.patient_id === patient.id)
    : nfseIssued;

  const totalValue = patientNfse.reduce((sum, n) => sum + Number(n.service_value || 0), 0);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">NFSe Emitidas</CardTitle>
        <FileText className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{patientNfse.length}</div>
        <p className="text-xs text-muted-foreground mt-1">
          Valor total: {formatBrazilianCurrency(totalValue)}
        </p>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// CLINICAL CARDS (3)
// ============================================================================

export const PatientComplaintsSummaryCard = ({ complaints = [] }: PatientOverviewCardProps) => {
  // Pegar última queixa ativa
  const activeComplaints = complaints
    .filter((c: any) => c.is_active !== false)
    .sort((a: any, b: any) => {
      const dateA = new Date(a.created_at || 0);
      const dateB = new Date(b.created_at || 0);
      return dateB.getTime() - dateA.getTime();
    });

  const lastComplaint = activeComplaints[0];

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Resumo de Queixas</CardTitle>
        <Stethoscope className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {lastComplaint ? (
          <>
            <div className="space-y-2">
              {lastComplaint.cid_code && (
                <Badge variant="outline">
                  {lastComplaint.cid_code} - {lastComplaint.cid_title}
                </Badge>
              )}
              {lastComplaint.severity && (
                <div className="text-sm">
                  <span className="font-medium">Gravidade:</span> {lastComplaint.severity}
                </div>
              )}
              {lastComplaint.clinical_notes && (
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {lastComplaint.clinical_notes}
                </p>
              )}
              {lastComplaint.created_at && (
                <p className="text-xs text-muted-foreground">
                  Registrado em {format(parseISO(lastComplaint.created_at), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              )}
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">Nenhuma queixa registrada</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const PatientMedicationsListCard = ({ complaints = [] }: PatientOverviewCardProps) => {
  // Buscar medicações nas queixas ativas
  const medications: any[] = [];
  complaints
    .filter((c: any) => c.is_active !== false)
    .forEach((complaint: any) => {
      if (complaint.complaint_medications) {
        medications.push(...complaint.complaint_medications.filter((m: any) => m.is_current));
      }
    });

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Medicações Atuais</CardTitle>
        <Pill className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {medications.length > 0 ? (
          <ul className="space-y-2">
            {medications.slice(0, 5).map((med: any, idx: number) => (
              <li key={idx} className="text-sm border-l-2 border-primary/20 pl-2">
                <div className="font-medium">{med.substance || med.class}</div>
                {med.dosage && (
                  <div className="text-xs text-muted-foreground">{med.dosage}</div>
                )}
              </li>
            ))}
            {medications.length > 5 && (
              <li className="text-xs text-muted-foreground">
                + {medications.length - 5} mais...
              </li>
            )}
          </ul>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">Nenhuma medicação registrada</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const PatientDiagnosesListCard = ({ complaints = [] }: PatientOverviewCardProps) => {
  // Coletar diagnósticos únicos das queixas ativas
  const diagnoses = new Set<string>();
  complaints
    .filter((c: any) => c.is_active !== false && c.cid_code)
    .forEach((complaint: any) => {
      diagnoses.add(`${complaint.cid_code} - ${complaint.cid_title || 'Sem título'}`);
    });

  const diagnosesArray = Array.from(diagnoses);

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Diagnósticos (CID-10)</CardTitle>
        <ClipboardList className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {diagnosesArray.length > 0 ? (
          <ul className="space-y-1.5">
            {diagnosesArray.map((diagnosis, idx) => (
              <li key={idx} className="text-sm flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <span>{diagnosis}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">Nenhum diagnóstico registrado</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// SESSIONS CARDS (3)
// ============================================================================

export const PatientSessionsTimelineCard = ({ sessions = [] }: PatientOverviewCardProps) => {
  // Últimas 8 sessões, ordenadas por data decrescente
  const recentSessions = [...sessions]
    .sort((a, b) => {
      const dateA = new Date(a.date || 0);
      const dateB = new Date(b.date || 0);
      return dateB.getTime() - dateA.getTime();
    })
    .slice(0, 8);

  const getStatusLabel = (status: string) => {
    const statusMap: Record<string, string> = {
      attended: 'Realizada',
      missed: 'Falta',
      cancelled: 'Cancelada',
      rescheduled: 'Remarcada',
      scheduled: 'Agendada',
    };
    return statusMap[status] || status;
  };

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    if (status === 'attended') return 'default';
    if (status === 'missed') return 'destructive';
    if (status === 'cancelled') return 'secondary';
    return 'outline';
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Timeline de Sessões</CardTitle>
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {recentSessions.length > 0 ? (
          <div className="space-y-2">
            {recentSessions.map((session, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm border-l-2 border-muted pl-2 py-1">
                <span className="text-muted-foreground">
                  {format(parseISO(session.date), "dd/MM/yyyy", { locale: ptBR })}
                </span>
                <Badge variant={getStatusVariant(session.status)} className="text-xs">
                  {getStatusLabel(session.status)}
                </Badge>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertCircle className="h-4 w-4" />
            <p className="text-sm">Nenhuma sessão registrada</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const PatientSessionFrequencyCard = ({ sessions = [] }: PatientOverviewCardProps) => {
  // Calcular frequência média baseada nas últimas sessões realizadas
  const attendedSessions = sessions
    .filter(s => s.status === 'attended')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-10); // Últimas 10 sessões realizadas

  let frequencyLabel = 'Sem dados';
  let averageDays = 0;

  if (attendedSessions.length >= 2) {
    const dates = attendedSessions.map(s => parseISO(s.date));
    const intervals = [];
    for (let i = 1; i < dates.length; i++) {
      intervals.push(differenceInDays(dates[i], dates[i - 1]));
    }
    averageDays = Math.round(intervals.reduce((a, b) => a + b, 0) / intervals.length);

    if (averageDays <= 7) frequencyLabel = 'Semanal';
    else if (averageDays <= 14) frequencyLabel = 'Quinzenal';
    else if (averageDays <= 31) frequencyLabel = 'Mensal';
    else frequencyLabel = 'Esporádica';
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Frequência de Sessões</CardTitle>
        <Activity className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{frequencyLabel}</div>
        {averageDays > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            Média de {averageDays} dias entre sessões (últimas {attendedSessions.length})
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export const PatientAttendanceRateCard = ({ sessions = [] }: PatientOverviewCardProps) => {
  // Últimos 3 meses
  const threeMonthsAgo = subMonths(new Date(), 3);
  const recentSessions = sessions.filter(s => {
    const sessionDate = parseISO(s.date);
    return sessionDate >= threeMonthsAgo;
  });

  const attended = recentSessions.filter(s => s.status === 'attended').length;
  const missed = recentSessions.filter(s => s.status === 'missed').length;
  const total = attended + missed;

  const attendanceRate = total > 0 ? Math.round((attended / total) * 100) : 0;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Taxa de Comparecimento</CardTitle>
        <TrendingUp className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{attendanceRate}%</div>
        <p className="text-xs text-muted-foreground mt-1">
          {attended} presença(s) e {missed} falta(s) nos últimos 3 meses
        </p>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// CONTACT / DATA CARDS (3)
// ============================================================================

export const PatientContactInfoCard = ({ patient }: PatientOverviewCardProps) => {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Informações de Contato</CardTitle>
        <Phone className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {patient?.name && (
            <div>
              <div className="text-xs font-medium text-muted-foreground">Nome</div>
              <div className="text-sm">{patient.name}</div>
            </div>
          )}
          {patient?.phone && (
            <div>
              <div className="text-xs font-medium text-muted-foreground">Telefone</div>
              <div className="text-sm">{patient.phone}</div>
            </div>
          )}
          {patient?.email && (
            <div>
              <div className="text-xs font-medium text-muted-foreground">E-mail</div>
              <div className="text-sm">{patient.email}</div>
            </div>
          )}
          {!patient?.phone && !patient?.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">Contato não cadastrado</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const PatientConsentStatusCard = ({ patient }: PatientOverviewCardProps) => {
  const hasConsent = patient?.lgpd_consent_date || patient?.privacy_policy_accepted;
  const consentDate = patient?.lgpd_consent_date || patient?.privacy_policy_accepted_at;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Consentimento LGPD</CardTitle>
        <Shield className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {hasConsent ? (
            <>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Consentimento Ativo</span>
              </div>
              {consentDate && (
                <p className="text-xs text-muted-foreground">
                  Aceito em {format(parseISO(consentDate), "dd/MM/yyyy", { locale: ptBR })}
                </p>
              )}
            </>
          ) : (
            <div className="flex items-center gap-2 text-amber-600">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm font-medium">Sem consentimento registrado</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const PatientPersonalDataCard = ({ patient }: PatientOverviewCardProps) => {
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = parseISO(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const age = patient?.birth_date ? calculateAge(patient.birth_date) : null;

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Dados Pessoais</CardTitle>
        <User className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {patient?.cpf && (
            <div>
              <div className="text-xs font-medium text-muted-foreground">CPF</div>
              <div className="text-sm">{patient.cpf}</div>
            </div>
          )}
          {age !== null && (
            <div>
              <div className="text-xs font-medium text-muted-foreground">Idade</div>
              <div className="text-sm">{age} anos</div>
            </div>
          )}
          {patient?.is_minor && (
            <div>
              <Badge variant="secondary">Menor de idade</Badge>
              {patient?.guardian_name && (
                <div className="mt-1">
                  <div className="text-xs font-medium text-muted-foreground">Responsável</div>
                  <div className="text-sm">{patient.guardian_name}</div>
                </div>
              )}
            </div>
          )}
          {!patient?.cpf && !age && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <AlertCircle className="h-4 w-4" />
              <p className="text-sm">Dados pessoais não cadastrados</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
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
 * FASE C1.6: Cards agora mostram dados reais do paciente.
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
