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

import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, Calendar, AlertCircle, DollarSign, FileText, Activity, CheckCircle2, XCircle, Clock, Settings2, Info } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';
import { parseISO, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from 'recharts';
import { TimeScale, getScaleLabel, generateTimeIntervals, formatTimeLabel, getIntervalBounds } from '@/hooks/useChartTimeScale';
import {
  DashboardExpectedRevenueTeam,
  DashboardActualRevenueTeam,
  DashboardUnpaidValueTeam,
  DashboardPaymentRateTeam,
  DashboardTotalPatientsTeam,
  DashboardAttendedSessionsTeam,
} from './dashboardCardRegistryTeam';

interface CardProps {
  isEditMode?: boolean;
  className?: string;
  patients?: any[];
  sessions?: any[];
  profiles?: any[];
  start?: Date;
  end?: Date;
  automaticScale?: TimeScale;
  getScale?: (chartId: string) => TimeScale;
  setScaleOverride?: (chartId: string, scale: TimeScale | null) => void;
  clearOverride?: (chartId: string) => void;
  hasOverride?: (chartId: string) => boolean;
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-primary" />
            Receita Esperada
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Valor total esperado com base nas sessões agendadas no período. Para pacientes com mensalidade fixa, considera o valor mensal uma vez por mês.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            Receita Realizada
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Valor total de sessões realizadas e pagas no período. Inclui apenas sessões com status "realizada" ou marcadas como pagas.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500" />
            Valores Pendentes
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Valor total de sessões realizadas mas ainda não pagas. Representa o montante a receber de pacientes.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Taxa de Pagamento</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Percentual de sessões realizadas que já foram pagas. Indica a eficiência na cobrança e recebimento de pagamentos.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Pacientes Ativos
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Número total de pacientes com status "ativo" em tratamento contínuo.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Sessões Esperadas
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Número total de sessões agendadas no período selecionado, independente do status.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            Sessões Realizadas
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Sessões efetivamente realizadas no período. Mostra o percentual em relação ao total esperado.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <XCircle className="h-4 w-4 text-red-500" />
            Faltas
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Sessões agendadas em que o paciente faltou sem aviso. Indica o percentual de faltas sobre o total esperado.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Clock className="h-4 w-4 text-yellow-600" />
            Sessões Pendentes
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Sessões futuras já agendadas no período. Útil para planejamento e previsão de agenda.</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Taxa de Comparecimento</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Percentual de pacientes que compareceram às sessões sobre o total de sessões concluídas (realizadas ou faltadas).</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
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

/**
 * CHART CARDS
 * Gráficos com sistema de escala embutido
 */

export const DashboardChartRevenueTrend = ({ 
  isEditMode, 
  className, 
  patients = [], 
  sessions = [], 
  start, 
  end, 
  automaticScale = 'weekly',
  getScale,
  setScaleOverride,
  clearOverride,
  hasOverride,
  aggregatedData = []
}: CardProps) => {
  const chartId = 'dashboard-chart-revenue-trend';
  const currentScale = getScale ? getScale(chartId) : automaticScale;
  
  // Gerar dados específicos para este gráfico usando a escala correta
  const chartData = start && end 
    ? generateTimeIntervals(start, end, currentScale).map(intervalDate => {
        const bounds = getIntervalBounds(intervalDate, currentScale);
        const intervalSessions = sessions.filter(session => {
          const sessionDate = new Date(session.date);
          return sessionDate >= bounds.start && sessionDate <= bounds.end;
        });

        const totalRevenue = intervalSessions
          .filter(s => s.status === 'attended')
          .reduce((sum, s) => sum + (s.value || 0), 0);

        return {
          label: formatTimeLabel(intervalDate, currentScale),
          value: totalRevenue,
        };
      })
    : [];

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Tendência de Receita
            </CardTitle>
            <CardDescription className="text-xs">Evolução temporal</CardDescription>
          </div>
          {setScaleOverride && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => clearOverride?.(chartId)}
                  className={cn(
                    "cursor-pointer",
                    !hasOverride?.(chartId) && "bg-accent"
                  )}
                >
                  Automática ({getScaleLabel(automaticScale)})
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setScaleOverride(chartId, 'daily')}
                  className={cn(
                    "cursor-pointer",
                    currentScale === 'daily' && hasOverride?.(chartId) && "bg-accent"
                  )}
                >
                  Diária
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setScaleOverride(chartId, 'weekly')}
                  className={cn(
                    "cursor-pointer",
                    currentScale === 'weekly' && hasOverride?.(chartId) && "bg-accent"
                  )}
                >
                  Semanal
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setScaleOverride(chartId, 'monthly')}
                  className={cn(
                    "cursor-pointer",
                    currentScale === 'monthly' && hasOverride?.(chartId) && "bg-accent"
                  )}
                >
                  Mensal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="label" 
              className="text-xs"
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fontSize: 11 }}
              tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
            />
            <RechartsTooltip 
              formatter={(value: number) => formatBrazilianCurrency(value)}
              contentStyle={{ fontSize: '12px' }}
            />
            <Line
              type="monotone" 
              dataKey="value" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ fill: 'hsl(var(--primary))', r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const DashboardChartPaymentStatus = ({ 
  isEditMode, 
  className, 
  aggregatedData = []
}: CardProps) => {
  const pieData = aggregatedData.length > 0 
    ? [
        { name: 'Pagos', value: aggregatedData.reduce((sum, d) => sum + d.paid, 0) },
        { name: 'Não Pagos', value: aggregatedData.reduce((sum, d) => sum + d.unpaid, 0) },
      ]
    : [];

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--destructive))'];

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          Status de Pagamentos
        </CardTitle>
        <CardDescription className="text-xs">Distribuição</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export const DashboardChartAttendanceWeekly = ({ 
  isEditMode, 
  className, 
  patients = [], 
  sessions = [], 
  start, 
  end, 
  automaticScale = 'weekly',
  getScale,
  setScaleOverride,
  clearOverride,
  hasOverride,
  aggregatedData = []
}: CardProps) => {
  const chartId = 'dashboard-chart-attendance-weekly';
  const currentScale = getScale ? getScale(chartId) : automaticScale;
  
  const chartData = start && end 
    ? generateTimeIntervals(start, end, currentScale).map(intervalDate => {
        const bounds = getIntervalBounds(intervalDate, currentScale);
        const intervalSessions = sessions.filter(session => {
          const sessionDate = new Date(session.date);
          return sessionDate >= bounds.start && sessionDate <= bounds.end;
        });

        return {
          label: formatTimeLabel(intervalDate, currentScale),
          attended: intervalSessions.filter(s => s.status === 'attended').length,
          missed: intervalSessions.filter(s => s.status === 'missed').length,
          pending: intervalSessions.filter(s => s.status === 'pending').length,
        };
      })
    : [];

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Comparecimento
            </CardTitle>
            <CardDescription className="text-xs">Por período</CardDescription>
          </div>
          {setScaleOverride && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <Settings2 className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  onClick={() => clearOverride?.(chartId)}
                  className={cn(
                    "cursor-pointer",
                    !hasOverride?.(chartId) && "bg-accent"
                  )}
                >
                  Automática ({getScaleLabel(automaticScale)})
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setScaleOverride(chartId, 'daily')}
                  className={cn(
                    "cursor-pointer",
                    currentScale === 'daily' && hasOverride?.(chartId) && "bg-accent"
                  )}
                >
                  Diária
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setScaleOverride(chartId, 'weekly')}
                  className={cn(
                    "cursor-pointer",
                    currentScale === 'weekly' && hasOverride?.(chartId) && "bg-accent"
                  )}
                >
                  Semanal
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setScaleOverride(chartId, 'monthly')}
                  className={cn(
                    "cursor-pointer",
                    currentScale === 'monthly' && hasOverride?.(chartId) && "bg-accent"
                  )}
                >
                  Mensal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="label" 
              className="text-xs"
              tick={{ fontSize: 11 }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fontSize: 11 }}
            />
            <RechartsTooltip contentStyle={{ fontSize: '12px' }} />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Bar dataKey="attended" fill="hsl(var(--primary))" name="Compareceram" />
            <Bar dataKey="missed" fill="hsl(var(--destructive))" name="Faltaram" />
            <Bar dataKey="pending" fill="hsl(var(--muted))" name="Pendentes" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// GRÁFICO 1: TIPOS DE SESSÃO (Pie Chart)
// ============================================================================
export const DashboardChartSessionTypes = ({ 
  isEditMode, 
  className, 
  sessions = [],
  start,
  end
}: CardProps) => {
  // Filtrar sessões no período
  const periodSessions = sessions.filter(s => {
    if (!s.date || !start || !end) return false;
    try {
      const sessionDate = parseISO(s.date);
      return sessionDate >= start && sessionDate <= end;
    } catch {
      return false;
    }
  });

  // Contar por status
  const sessionTypes = periodSessions.reduce((acc, s) => {
    const status = s.status || 'pending';
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = [
    { 
      name: 'Atendidas', 
      value: sessionTypes.attended || 0, 
      fill: 'hsl(var(--chart-1))' 
    },
    { 
      name: 'Faltadas', 
      value: sessionTypes.missed || 0, 
      fill: 'hsl(var(--chart-2))' 
    },
    { 
      name: 'Pendentes', 
      value: sessionTypes.pending || 0, 
      fill: 'hsl(var(--chart-3))' 
    },
  ];

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Activity className="h-4 w-4 text-primary" />
          Tipos de Sessão
        </CardTitle>
        <CardDescription className="text-xs">Distribuição por status</CardDescription>
      </CardHeader>
      <CardContent>
        {total > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={70}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <RechartsTooltip />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">
            Sem dados no período
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// GRÁFICO 2: COMPARAÇÃO MENSAL (Line Chart)
// ============================================================================
export const DashboardChartMonthlyComparison = ({ 
  isEditMode, 
  className, 
  sessions = [],
  start,
  end
}: CardProps) => {
  const chartData = useMemo(() => {
    if (!start || !end) return [];
    
    const months = [];
    const current = new Date(start);
    while (current <= end) {
      months.push(new Date(current));
      current.setMonth(current.getMonth() + 1);
    }

    return months.map(monthDate => {
      const monthKey = format(monthDate, 'yyyy-MM');
      const monthSessions = sessions.filter(s => {
        if (!s.date) return false;
        try {
          const sessionMonth = format(parseISO(s.date), 'yyyy-MM');
          return sessionMonth === monthKey;
        } catch {
          return false;
        }
      });
      
      const attendedSessions = monthSessions.filter(s => s.status === 'attended');
      const receita = attendedSessions
        .filter(s => s.paid)
        .reduce((sum, s) => sum + (s.value || 0), 0);
      
      const totalNonPending = monthSessions.filter(s => s.status !== 'pending').length;
      const taxaComparecimento = totalNonPending > 0
        ? (attendedSessions.length / totalNonPending) * 100
        : 0;

      return {
        month: format(monthDate, 'MMM yyyy', { locale: ptBR }),
        receita,
        sessoes_atendidas: attendedSessions.length,
        sessoes_faltadas: monthSessions.filter(s => s.status === 'missed').length,
        taxa_comparecimento: taxaComparecimento,
      };
    });
  }, [sessions, start, end]);

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Comparação Mensal
        </CardTitle>
        <CardDescription className="text-xs">Evolução de métricas</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                yAxisId="left"
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                label={{ value: 'R$', angle: -90, position: 'insideLeft', fontSize: 10 }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                label={{ value: '%', angle: 90, position: 'insideRight', fontSize: 10 }}
              />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))'
                }}
                formatter={(value: any, name: string) => {
                  if (name === 'receita') return [formatBrazilianCurrency(value), 'Receita'];
                  if (name === 'taxa_comparecimento') return [`${value.toFixed(1)}%`, 'Taxa'];
                  return [value, name];
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line 
                yAxisId="left"
                type="monotone" 
                dataKey="receita" 
                stroke="hsl(var(--chart-1))" 
                name="Receita"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="taxa_comparecimento" 
                stroke="hsl(var(--chart-2))" 
                name="Taxa %"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
            Sem dados no período
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// GRÁFICO 3: RECEITA POR TERAPEUTA (Bar Chart)
// ============================================================================
export const DashboardChartRevenueByTherapist = ({ 
  isEditMode, 
  className, 
  sessions = [],
  patients = [],
  profiles = [],
  start,
  end
}: CardProps) => {
  const chartData = useMemo(() => {
    // Filtrar sessões atendidas e pagas no período
    const validSessions = sessions.filter(s => {
      if (s.status !== 'attended' || !s.paid) return false;
      if (!s.date || !start || !end) return false;
      try {
        const sessionDate = parseISO(s.date);
        return sessionDate >= start && sessionDate <= end;
      } catch {
        return false;
      }
    });

    // Agrupar por terapeuta
    const revenueByTherapist = validSessions.reduce((acc, session) => {
      const patient = patients.find(p => p.id === session.patient_id);
      if (!patient) return acc;
      
      const therapistId = patient.user_id;
      if (!acc[therapistId]) {
        const profile = profiles.find(p => p.id === therapistId);
        acc[therapistId] = {
          therapist_id: therapistId,
          therapist_name: profile?.full_name || 'Terapeuta',
          total_revenue: 0,
          session_count: 0,
        };
      }
      
      acc[therapistId].total_revenue += session.value || 0;
      acc[therapistId].session_count += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(revenueByTherapist)
      .sort((a: any, b: any) => b.total_revenue - a.total_revenue);
  }, [sessions, patients, profiles, start, end]);

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-primary" />
          Receita por Terapeuta
        </CardTitle>
        <CardDescription className="text-xs">Sessões pagas no período</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 40)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 100 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                type="number" 
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                tickFormatter={(value) => formatBrazilianCurrency(value)}
              />
              <YAxis 
                type="category" 
                dataKey="therapist_name" 
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                width={90}
              />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))'
                }}
                formatter={(value: any, name: string, props: any) => {
                  return [
                    `${formatBrazilianCurrency(value)} (${props.payload.session_count} sessões)`,
                    'Receita'
                  ];
                }}
              />
              <Bar dataKey="total_revenue" fill="hsl(var(--chart-1))" name="Receita" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">
            Sem dados no período
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// GRÁFICO 4: DISTRIBUIÇÃO POR TERAPEUTA (Stacked Bar Chart)
// ============================================================================
export const DashboardChartTherapistDistribution = ({ 
  isEditMode, 
  className, 
  sessions = [],
  patients = [],
  profiles = [],
  start,
  end
}: CardProps) => {
  const chartData = useMemo(() => {
    // Filtrar pacientes ativos no período (que tem sessões)
    const periodSessions = sessions.filter(s => {
      if (!s.date || !start || !end) return false;
      try {
        const sessionDate = parseISO(s.date);
        return sessionDate >= start && sessionDate <= end;
      } catch {
        return false;
      }
    });

    const patientIdsInPeriod = new Set(periodSessions.map(s => s.patient_id));
    const activePatientsInPeriod = patients.filter(p => patientIdsInPeriod.has(p.id));

    // Agrupar por terapeuta
    const distribution = activePatientsInPeriod.reduce((acc, patient) => {
      const therapistId = patient.user_id;
      if (!acc[therapistId]) {
        const profile = profiles.find(p => p.id === therapistId);
        acc[therapistId] = {
          therapist_name: profile?.full_name || 'Terapeuta',
          patient_count: 0,
          session_count: 0,
        };
      }
      acc[therapistId].patient_count += 1;
      return acc;
    }, {} as Record<string, any>);

    // Adicionar contagem de sessões
    periodSessions.forEach(s => {
      const patient = patients.find(p => p.id === s.patient_id);
      if (patient && distribution[patient.user_id]) {
        distribution[patient.user_id].session_count += 1;
      }
    });

    return Object.values(distribution)
      .sort((a: any, b: any) => b.patient_count - a.patient_count);
  }, [sessions, patients, profiles, start, end]);

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          Distribuição por Terapeuta
        </CardTitle>
        <CardDescription className="text-xs">Pacientes e sessões</CardDescription>
      </CardHeader>
      <CardContent>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={Math.max(200, chartData.length * 50)}>
            <BarChart data={chartData} margin={{ bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="therapist_name" 
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis 
                tick={{ fontSize: 11 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))'
                }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="patient_count" fill="hsl(var(--chart-4))" name="Pacientes" stackId="a" />
              <Bar dataKey="session_count" fill="hsl(var(--chart-1))" name="Sessões" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[200px] flex items-center justify-center text-xs text-muted-foreground">
            Sem dados no período
          </div>
        )}
      </CardContent>
    </Card>
  );
};

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

  // Team (Equipe)
  'dashboard-expected-revenue-team': DashboardExpectedRevenueTeam,
  'dashboard-actual-revenue-team': DashboardActualRevenueTeam,
  'dashboard-unpaid-value-team': DashboardUnpaidValueTeam,
  'dashboard-payment-rate-team': DashboardPaymentRateTeam,
  'dashboard-total-patients-team': DashboardTotalPatientsTeam,
  'dashboard-attended-sessions-team': DashboardAttendedSessionsTeam,
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
