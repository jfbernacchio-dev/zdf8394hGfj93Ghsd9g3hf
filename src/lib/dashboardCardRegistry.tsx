/**
 * ============================================================================
 * DASHBOARD CARD REGISTRY - FASE 3D
 * ============================================================================
 * 
 * Registry centralizado para renderização de cards do dashboard.
 * Mapeia cardId → Componente React
 * 
 * ESTRUTURA:
 * - Cada card é um componente React independente
 * - Props opcionais para customização (isEditMode, etc.)
 * - Dados mockados para a FASE 3D (na produção, carregar dados reais)
 * 
 * ============================================================================
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, Calendar, AlertCircle, DollarSign, FileText, Activity, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';
import { parseISO, format } from 'date-fns';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TimeScale } from '@/hooks/useChartTimeScale';

interface CardProps {
  isEditMode?: boolean;
  className?: string;
  patients?: any[];
  sessions?: any[];
  start?: Date;
  end?: Date;
  scale?: TimeScale;
  aggregatedData?: Array<{
    label: string;
    interval: Date;
    attended: number;
    missed: number;
    pending: number;
    paid: number;
    unpaid: number;
    totalRevenue: number;
    paidRevenue: number;
    unpaidRevenue: number;
    total: number;
  }>;
}

/**
 * FINANCIAL CARDS
 */

export const DashboardExpectedRevenue = ({ isEditMode, className, patients = [], sessions = [], start, end }: CardProps) => {
  const periodSessions = sessions.filter(s => {
    if (!s.date || !start || !end) return false;
    try {
      const sessionDate = parseISO(s.date);
      return sessionDate >= start && sessionDate <= end;
    } catch {
      return false;
    }
  });

  const monthlyPatientsInPeriod = new Map<string, Set<string>>();
  const expectedRevenue = periodSessions.reduce((sum, s) => {
    const patient = patients.find(p => p.id === s.patient_id);
    if (!patient) return sum;
    
    if (patient.monthly_price) {
      const monthKey = format(parseISO(s.date), 'yyyy-MM');
      if (!monthlyPatientsInPeriod.has(monthKey)) {
        monthlyPatientsInPeriod.set(monthKey, new Set());
      }
      const patientsSet = monthlyPatientsInPeriod.get(monthKey)!;
      if (!patientsSet.has(patient.id)) {
        patientsSet.add(patient.id);
        return sum + patient.session_value;
      }
      return sum;
    } else {
      return sum + s.value;
    }
  }, 0);

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          Receita Esperada
        </CardTitle>
        <CardDescription className="text-xs">Período selecionado</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary">{formatBrazilianCurrency(expectedRevenue)}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {periodSessions.length} sessões
        </p>
      </CardContent>
    </Card>
  );
};

export const DashboardActualRevenue = ({ isEditMode, className, patients = [], sessions = [], start, end }: CardProps) => {
  const periodSessions = sessions.filter(s => {
    if (!s.date || !start || !end) return false;
    try {
      const sessionDate = parseISO(s.date);
      return sessionDate >= start && sessionDate <= end && (s.status === 'attended' || s.paid);
    } catch {
      return false;
    }
  });

  const monthlyPatientsInPeriod = new Map<string, Set<string>>();
  const actualRevenue = periodSessions.reduce((sum, s) => {
    const patient = patients.find(p => p.id === s.patient_id);
    if (!patient) return sum;
    
    if (patient.monthly_price) {
      const monthKey = format(parseISO(s.date), 'yyyy-MM');
      if (!monthlyPatientsInPeriod.has(monthKey)) {
        monthlyPatientsInPeriod.set(monthKey, new Set());
      }
      const patientsSet = monthlyPatientsInPeriod.get(monthKey)!;
      if (!patientsSet.has(patient.id)) {
        patientsSet.add(patient.id);
        return sum + patient.session_value;
      }
      return sum;
    } else {
      return sum + s.value;
    }
  }, 0);

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-600" />
          Receita Realizada
        </CardTitle>
        <CardDescription className="text-xs">Período selecionado</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-green-600">{formatBrazilianCurrency(actualRevenue)}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {periodSessions.length} sessões realizadas
        </p>
      </CardContent>
    </Card>
  );
};

export const DashboardUnpaidValue = ({ isEditMode, className, patients = [], sessions = [], start, end }: CardProps) => {
  const periodSessions = sessions.filter(s => {
    if (!s.date || !start || !end) return false;
    try {
      const sessionDate = parseISO(s.date);
      return sessionDate >= start && sessionDate <= end && !s.paid && s.status === 'attended';
    } catch {
      return false;
    }
  });

  const monthlyPatientsInPeriod = new Map<string, Set<string>>();
  const unpaidValue = periodSessions.reduce((sum, s) => {
    const patient = patients.find(p => p.id === s.patient_id);
    if (!patient) return sum;
    
    if (patient.monthly_price) {
      const monthKey = format(parseISO(s.date), 'yyyy-MM');
      if (!monthlyPatientsInPeriod.has(monthKey)) {
        monthlyPatientsInPeriod.set(monthKey, new Set());
      }
      const patientsSet = monthlyPatientsInPeriod.get(monthKey)!;
      if (!patientsSet.has(patient.id)) {
        patientsSet.add(patient.id);
        return sum + patient.session_value;
      }
      return sum;
    } else {
      return sum + s.value;
    }
  }, 0);

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-red-500" />
          Valores Pendentes
        </CardTitle>
        <CardDescription className="text-xs">A receber</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-red-500">{formatBrazilianCurrency(unpaidValue)}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {periodSessions.length} sessões não pagas
        </p>
      </CardContent>
    </Card>
  );
};

export const DashboardPaymentRate = ({ isEditMode, className, patients = [], sessions = [], start, end }: CardProps) => {
  const periodSessions = sessions.filter(s => {
    if (!s.date || !start || !end) return false;
    try {
      const sessionDate = parseISO(s.date);
      return sessionDate >= start && sessionDate <= end && s.status === 'attended';
    } catch {
      return false;
    }
  });

  const paidSessions = periodSessions.filter(s => s.paid).length;
  const totalSessions = periodSessions.length;
  const paymentRate = totalSessions > 0 ? Math.round((paidSessions / totalSessions) * 100) : 0;

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Taxa de Pagamento</CardTitle>
        <CardDescription className="text-xs">Período selecionado</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{paymentRate}%</div>
        <p className="text-xs text-muted-foreground mt-1">
          {paidSessions} de {totalSessions} sessões pagas
        </p>
      </CardContent>
    </Card>
  );
};

/**
 * ADMINISTRATIVE CARDS
 */

export const DashboardTotalPatients = ({ isEditMode, className, patients = [] }: CardProps) => {
  const activePatients = patients.filter(p => p.status === 'active').length;

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Pacientes Ativos
        </CardTitle>
        <CardDescription className="text-xs">Total</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{activePatients}</div>
        <p className="text-xs text-muted-foreground mt-1">
          Pacientes em tratamento
        </p>
      </CardContent>
    </Card>
  );
};

export const DashboardExpectedSessions = ({ isEditMode, className, sessions = [], start, end }: CardProps) => {
  const periodSessions = sessions.filter(s => {
    if (!s.date || !start || !end) return false;
    try {
      const sessionDate = parseISO(s.date);
      return sessionDate >= start && sessionDate <= end;
    } catch {
      return false;
    }
  });

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4 text-primary" />
          Sessões Esperadas
        </CardTitle>
        <CardDescription className="text-xs">Período selecionado</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{periodSessions.length}</div>
        <p className="text-xs text-muted-foreground mt-1">
          Total de sessões
        </p>
      </CardContent>
    </Card>
  );
};

export const DashboardAttendedSessions = ({ isEditMode, className, sessions = [], start, end }: CardProps) => {
  const periodSessions = sessions.filter(s => {
    if (!s.date || !start || !end) return false;
    try {
      const sessionDate = parseISO(s.date);
      return sessionDate >= start && sessionDate <= end;
    } catch {
      return false;
    }
  });

  const attendedSessions = periodSessions.filter(s => s.status === 'attended');
  const percentage = periodSessions.length > 0 
    ? Math.round((attendedSessions.length / periodSessions.length) * 100) 
    : 0;

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          Sessões Realizadas
        </CardTitle>
        <CardDescription className="text-xs">Período selecionado</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-green-600">{attendedSessions.length}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {percentage}% das esperadas
        </p>
      </CardContent>
    </Card>
  );
};

export const DashboardMissedSessions = ({ isEditMode, className, sessions = [], start, end }: CardProps) => {
  const periodSessions = sessions.filter(s => {
    if (!s.date || !start || !end) return false;
    try {
      const sessionDate = parseISO(s.date);
      return sessionDate >= start && sessionDate <= end;
    } catch {
      return false;
    }
  });

  const missedSessions = periodSessions.filter(s => s.status === 'missed');
  const percentage = periodSessions.length > 0 
    ? Math.round((missedSessions.length / periodSessions.length) * 100) 
    : 0;

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <XCircle className="h-4 w-4 text-red-500" />
          Faltas
        </CardTitle>
        <CardDescription className="text-xs">Período selecionado</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-red-500">{missedSessions.length}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {percentage}% de faltas
        </p>
      </CardContent>
    </Card>
  );
};

export const DashboardPendingSessions = ({ isEditMode, className, sessions = [], start, end }: CardProps) => {
  const now = new Date();
  const periodSessions = sessions.filter(s => {
    if (!s.date || !start || !end) return false;
    try {
      const sessionDate = parseISO(s.date);
      return sessionDate >= start && sessionDate <= end && sessionDate >= now && s.status === 'scheduled';
    } catch {
      return false;
    }
  });

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-yellow-600" />
          Sessões Pendentes
        </CardTitle>
        <CardDescription className="text-xs">Futuras</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-yellow-600">{periodSessions.length}</div>
        <p className="text-xs text-muted-foreground mt-1">
          Agendadas
        </p>
      </CardContent>
    </Card>
  );
};

export const DashboardAttendanceRate = ({ isEditMode, className, sessions = [], start, end }: CardProps) => {
  const periodSessions = sessions.filter(s => {
    if (!s.date || !start || !end) return false;
    try {
      const sessionDate = parseISO(s.date);
      return sessionDate >= start && sessionDate <= end;
    } catch {
      return false;
    }
  });

  const completedSessions = periodSessions.filter(s => s.status === 'attended' || s.status === 'missed');
  const attendedSessions = periodSessions.filter(s => s.status === 'attended');
  const attendanceRate = completedSessions.length > 0 
    ? Math.round((attendedSessions.length / completedSessions.length) * 100) 
    : 0;

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">Taxa de Comparecimento</CardTitle>
        <CardDescription className="text-xs">Período selecionado</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{attendanceRate}%</div>
        <p className="text-xs text-muted-foreground mt-1">
          {attendedSessions.length} de {completedSessions.length} sessões
        </p>
      </CardContent>
    </Card>
  );
};

/**
 * CLINICAL CARDS (placeholders)
 */

export const DashboardActiveComplaints = ({ isEditMode, className }: CardProps) => (
  <Card className={cn('h-full', className)}>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-medium flex items-center gap-2">
        <FileText className="h-4 w-4 text-primary" />
        Queixas Ativas
      </CardTitle>
      <CardDescription className="text-xs">Em acompanhamento</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">45</div>
      <p className="text-xs text-muted-foreground mt-1">
        De 28 pacientes
      </p>
    </CardContent>
  </Card>
);

export const DashboardNoDiagnosis = ({ isEditMode, className }: CardProps) => (
  <Card className={cn('h-full', className)}>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-medium flex items-center gap-2">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        Sem Diagnóstico
      </CardTitle>
      <CardDescription className="text-xs">Requer avaliação</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-yellow-600">7</div>
      <p className="text-xs text-muted-foreground mt-1">
        25% dos pacientes
      </p>
    </CardContent>
  </Card>
);

/**
 * MEDIA CARDS (placeholders)
 */

export const DashboardWhatsappUnread = ({ isEditMode, className }: CardProps) => (
  <Card className={cn('h-full', className)}>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-medium">WhatsApp Não Lidas</CardTitle>
      <CardDescription className="text-xs">Requer resposta</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">8</div>
      <p className="text-xs text-muted-foreground mt-1">
        De 5 conversas
      </p>
    </CardContent>
  </Card>
);

/**
 * GENERAL CARDS (placeholders)
 */

export const DashboardQuickActions = ({ isEditMode, className }: CardProps) => (
  <Card className={cn('h-full', className)}>
    <CardHeader>
      <CardTitle className="text-sm font-medium">Ações Rápidas</CardTitle>
      <CardDescription className="text-xs">Atalhos principais</CardDescription>
    </CardHeader>
    <CardContent className="space-y-2">
      <div className="text-xs text-muted-foreground">
        • Nova Sessão<br />
        • Registrar Pagamento<br />
        • Adicionar Paciente
      </div>
    </CardContent>
  </Card>
);

export const DashboardRecentSessions = ({ isEditMode, className }: CardProps) => (
  <Card className={cn('h-full', className)}>
    <CardHeader>
      <CardTitle className="text-sm font-medium">Sessões Recentes</CardTitle>
      <CardDescription className="text-xs">Últimas atividades</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="text-xs text-muted-foreground space-y-1">
        • João Silva - 10/11<br />
        • Maria Santos - 10/11<br />
        • Ana Oliveira - 09/11
      </div>
    </CardContent>
  </Card>
);

/**
 * CHART CARDS (placeholders for now)
 */

const ChartPlaceholder = ({ title, description }: { title: string; description: string }) => (
  <Card className="h-full">
    <CardHeader>
      <CardTitle className="text-sm font-medium">{title}</CardTitle>
      <CardDescription className="text-xs">{description}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="h-32 bg-muted/20 rounded flex items-center justify-center text-xs text-muted-foreground">
        Gráfico (em desenvolvimento)
      </div>
    </CardContent>
  </Card>
);

export const DashboardChartRevenueTrend = (props: CardProps) => (
  <ChartPlaceholder title="Tendência de Receita" description="Últimos 6 meses" />
);

export const DashboardChartPaymentStatus = (props: CardProps) => (
  <ChartPlaceholder title="Status de Pagamentos" description="Distribuição" />
);

export const DashboardChartMonthlyComparison = (props: CardProps) => (
  <ChartPlaceholder title="Comparação Mensal" description="Receita vs Esperado" />
);

export const DashboardChartRevenueByTherapist = (props: CardProps) => (
  <ChartPlaceholder title="Receita por Terapeuta" description="Este mês" />
);

export const DashboardChartSessionTypes = (props: CardProps) => (
  <ChartPlaceholder title="Tipos de Sessão" description="Distribuição" />
);

export const DashboardChartTherapistDistribution = (props: CardProps) => (
  <ChartPlaceholder title="Distribuição por Terapeuta" description="Pacientes" />
);

export const DashboardChartAttendanceWeekly = (props: CardProps) => (
  <ChartPlaceholder title="Comparecimento Semanal" description="Últimas 4 semanas" />
);

export const DashboardChartPatientGrowth = (props: CardProps) => (
  <ChartPlaceholder title="Crescimento de Pacientes" description="Últimos 12 meses" />
);

export const DashboardChartHourlyDistribution = (props: CardProps) => (
  <ChartPlaceholder title="Distribuição por Horário" description="Sessões" />
);

export const DashboardChartCancellationReasons = (props: CardProps) => (
  <ChartPlaceholder title="Motivos de Cancelamento" description="Este mês" />
);

/**
 * CARD REGISTRY MAP
 * Mapeia cardId → Componente React
 */
export const DASHBOARD_CARD_COMPONENTS: Record<string, React.ComponentType<CardProps>> = {
  // Financial
  'dashboard-expected-revenue': DashboardExpectedRevenue,
  'dashboard-actual-revenue': DashboardActualRevenue,
  'dashboard-unpaid-value': DashboardUnpaidValue,
  'dashboard-payment-rate': DashboardPaymentRate,
  
  // Administrative
  'dashboard-total-patients': DashboardTotalPatients,
  'dashboard-expected-sessions': DashboardExpectedSessions,
  'dashboard-attended-sessions': DashboardAttendedSessions,
  'dashboard-missed-sessions': DashboardMissedSessions,
  'dashboard-pending-sessions': DashboardPendingSessions,
  'dashboard-attendance-rate': DashboardAttendanceRate,
  
  // Clinical
  'dashboard-active-complaints': DashboardActiveComplaints,
  'dashboard-no-diagnosis': DashboardNoDiagnosis,
  
  // Media
  'dashboard-whatsapp-unread': DashboardWhatsappUnread,
  
  // General
  'dashboard-quick-actions': DashboardQuickActions,
  'dashboard-recent-sessions': DashboardRecentSessions,
  
  // Charts
  'dashboard-chart-revenue-trend': DashboardChartRevenueTrend,
  'dashboard-chart-payment-status': DashboardChartPaymentStatus,
  'dashboard-chart-monthly-comparison': DashboardChartMonthlyComparison,
  'dashboard-chart-revenue-by-therapist': DashboardChartRevenueByTherapist,
  'dashboard-chart-session-types': DashboardChartSessionTypes,
  'dashboard-chart-therapist-distribution': DashboardChartTherapistDistribution,
  'dashboard-chart-attendance-weekly': DashboardChartAttendanceWeekly,
  'dashboard-chart-patient-growth': DashboardChartPatientGrowth,
  'dashboard-chart-hourly-distribution': DashboardChartHourlyDistribution,
  'dashboard-chart-cancellation-reasons': DashboardChartCancellationReasons,
};

/**
 * RENDER CARD BY ID
 * Helper function para renderizar um card pelo ID
 */
export const renderDashboardCard = (cardId: string, props?: CardProps) => {
  const Component = DASHBOARD_CARD_COMPONENTS[cardId];
  
  if (!Component) {
    console.warn(`[dashboardCardRegistry] Card não encontrado: ${cardId}`);
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-sm">Card não encontrado</CardTitle>
          <CardDescription className="text-xs">{cardId}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-xs text-muted-foreground">
            Componente não registrado
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return <Component {...props} />;
};
