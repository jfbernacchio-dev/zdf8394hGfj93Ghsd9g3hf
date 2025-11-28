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

import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Users, Calendar, AlertCircle, DollarSign, FileText, Activity, CheckCircle2, XCircle, Clock, Settings2, Info, Plus, ExternalLink, CreditCard, UserPlus, User, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
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
  DashboardActiveTherapistsTeam,
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold mb-1">Fórmula:</p>
              <p className="text-xs mb-2">Soma de (valor_mensal por mês) + Soma de (valor_sessão agendada)</p>
              <p className="text-xs">Valor total esperado com base nas sessões agendadas no período. Para pacientes com mensalidade fixa, considera o valor mensal uma vez por mês.</p>
            </TooltipContent>
          </Tooltip>
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold mb-1">Fórmula:</p>
              <p className="text-xs mb-2">Soma de (valor_sessão) onde status = "attended" OU paid = true</p>
              <p className="text-xs">Valor total de sessões realizadas e pagas no período. Inclui apenas sessões com status "realizada" ou marcadas como pagas.</p>
            </TooltipContent>
          </Tooltip>
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
  // IMPORTANTE: Valores Pendentes deve mostrar TODO o histórico, não apenas o período filtrado
  // Isso está alinhado com o comportamento do /dashboard
  const allUnpaidSessions = sessions.filter(s => {
    if (!s.date) return false;
    try {
      return !s.paid && s.status === 'attended';
    } catch {
      return false;
    }
  });

  const monthlyPatientsInPeriod = new Map<string, Set<string>>();
  const unpaidValue = allUnpaidSessions.reduce((sum, s) => {
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold mb-1">Fórmula:</p>
              <p className="text-xs mb-2">Soma de (valor_sessão) onde status = "attended" E paid = false (histórico completo)</p>
              <p className="text-xs">Valor total de sessões realizadas mas ainda não pagas em TODO o histórico. Representa o montante a receber de pacientes.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <CardDescription className="text-xs">A receber</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-red-500">{formatBrazilianCurrency(unpaidValue)}</div>
        <p className="text-xs text-muted-foreground mt-1">
          {allUnpaidSessions.length} sessões não pagas
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold mb-1">Fórmula:</p>
              <p className="text-xs mb-2">(Sessões pagas / Total de sessões realizadas) × 100</p>
              <p className="text-xs">Percentual de sessões realizadas que já foram pagas. Indica a eficiência na cobrança e recebimento de pagamentos.</p>
            </TooltipContent>
          </Tooltip>
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold mb-1">Contagem de pacientes ativos</p>
              <p className="text-xs">Número total de pacientes com status "ativo" em tratamento contínuo no sistema.</p>
            </TooltipContent>
          </Tooltip>
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold mb-1">Total de sessões agendadas</p>
              <p className="text-xs">Número total de sessões programadas no período selecionado, independente do status.</p>
            </TooltipContent>
          </Tooltip>
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold mb-1">Fórmula:</p>
              <p className="text-xs mb-2">Count(sessões) onde status = "attended"</p>
              <p className="text-xs">Sessões efetivamente realizadas no período. Mostra o percentual em relação ao total esperado.</p>
            </TooltipContent>
          </Tooltip>
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold mb-1">Fórmula:</p>
              <p className="text-xs mb-2">Count(sessões) onde status = "missed"</p>
              <p className="text-xs">Sessões agendadas em que o paciente faltou sem aviso. Indica o percentual de faltas sobre o total esperado.</p>
            </TooltipContent>
          </Tooltip>
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold mb-1">Sessões futuras agendadas</p>
              <p className="text-xs">Sessões futuras já agendadas no período. Útil para planejamento e previsão de agenda.</p>
            </TooltipContent>
          </Tooltip>
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold mb-1">Fórmula:</p>
              <p className="text-xs mb-2">(Sessões comparecidas / Total de sessões passadas) × 100</p>
              <p className="text-xs">Percentual de pacientes que compareceram às sessões sobre o total de sessões concluídas (realizadas ou faltadas).</p>
            </TooltipContent>
          </Tooltip>
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
 * CLINICAL CARDS
 */

export const DashboardActiveComplaints = ({ isEditMode, className, patients = [] }: CardProps) => {
  const [complaintsCount, setComplaintsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadComplaints() {
      try {
        const patientIds = patients.filter(p => p.status === 'active').map(p => p.id);
        if (patientIds.length === 0) {
          setComplaintsCount(0);
          setLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('clinical_complaints')
          .select('id', { count: 'exact', head: true })
          .in('patient_id', patientIds)
          .eq('is_active', true);

        if (error) throw error;
        setComplaintsCount(data?.length || 0);
      } catch (error) {
        console.error('[DashboardActiveComplaints] Error:', error);
        setComplaintsCount(0);
      } finally {
        setLoading(false);
      }
    }

    loadComplaints();
  }, [patients]);

  const totalActivePatients = patients.filter(p => p.status === 'active').length;

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Queixas Ativas
          </CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold mb-1">Queixas Ativas</p>
              <p className="text-xs">Número de queixas clínicas marcadas como ativas no sistema. Fórmula: COUNT(queixas WHERE is_active = true). Indica pacientes com diagnóstico ativo em acompanhamento.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <CardDescription className="text-xs">Em acompanhamento</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-2xl font-bold text-muted-foreground">...</div>
        ) : (
          <>
            <div className="text-2xl font-bold">{complaintsCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              De {totalActivePatients} pacientes
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export const DashboardNoDiagnosis = ({ isEditMode, className, patients = [] }: CardProps) => {
  const [noDiagnosisCount, setNoDiagnosisCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadNoDiagnosis() {
      try {
        const activePatients = patients.filter(p => p.status === 'active');
        if (activePatients.length === 0) {
          setNoDiagnosisCount(0);
          setLoading(false);
          return;
        }

        const patientIds = activePatients.map(p => p.id);

        // Buscar quais pacientes têm queixas ativas
        const { data: complaintsData } = await supabase
          .from('clinical_complaints')
          .select('patient_id')
          .in('patient_id', patientIds)
          .eq('is_active', true);

        const patientsWithComplaints = new Set(complaintsData?.map(c => c.patient_id) || []);

        // Contar pacientes sem queixas ativas
        const count = activePatients.filter(p => !patientsWithComplaints.has(p.id)).length;
        setNoDiagnosisCount(count);
      } catch (error) {
        console.error('[DashboardNoDiagnosis] Error:', error);
        setNoDiagnosisCount(0);
      } finally {
        setLoading(false);
      }
    }

    loadNoDiagnosis();
  }, [patients]);

  const totalActivePatients = patients.filter(p => p.status === 'active').length;
  const percentage = totalActivePatients > 0 
    ? Math.round((noDiagnosisCount / totalActivePatients) * 100) 
    : 0;

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            Sem Diagnóstico
          </CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold mb-1">Pacientes Sem Diagnóstico</p>
              <p className="text-xs">Pacientes ativos que ainda não possuem queixa clínica cadastrada ou marcada com has_no_diagnosis=true. Fórmula: COUNT(pacientes ativos WHERE NOT EXISTS(queixa ativa) OR has_no_diagnosis = true). Requer avaliação diagnóstica.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <CardDescription className="text-xs">Requer avaliação</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-2xl font-bold text-muted-foreground">...</div>
        ) : (
          <>
            <div className="text-2xl font-bold text-yellow-600">{noDiagnosisCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {percentage}% dos pacientes
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * MEDIA CARDS
 */

export const DashboardWhatsappUnread = ({ isEditMode, className }: CardProps) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [conversationCount, setConversationCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    async function loadWhatsappData() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('whatsapp_conversations')
          .select('unread_count')
          .eq('user_id', user.id)
          .eq('status', 'active');

        if (error) throw error;

        const total = data?.reduce((sum, conv) => sum + (conv.unread_count || 0), 0) || 0;
        const convs = data?.filter(c => c.unread_count > 0).length || 0;

        setUnreadCount(total);
        setConversationCount(convs);
      } catch (error) {
        console.error('[DashboardWhatsappUnread] Error:', error);
        setUnreadCount(0);
        setConversationCount(0);
      } finally {
        setLoading(false);
      }
    }

    loadWhatsappData();
  }, [user]);

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">WhatsApp Não Lidas</CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold mb-1">Mensagens WhatsApp Não Lidas</p>
              <p className="text-xs">Contagem total de mensagens não lidas nas conversas do WhatsApp integrado. Fórmula: SUM(conversas.unread_count WHERE status = 'active'). Indica mensagens pendentes de resposta.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <CardDescription className="text-xs">Requer resposta</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-2xl font-bold text-muted-foreground">...</div>
        ) : (
          <>
            <div className="text-2xl font-bold">{unreadCount}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Em {conversationCount} conversas
            </p>
          </>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * GENERAL CARDS
 */

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const AVAILABLE_QUICK_ACTIONS: QuickAction[] = [
  { id: 'new-session', label: 'Nova Sessão', icon: <Calendar className="h-4 w-4" />, path: '/schedule' },
  { id: 'register-payment', label: 'Registrar Pagamento', icon: <CreditCard className="h-4 w-4" />, path: '/payment-control' },
  { id: 'add-patient', label: 'Adicionar Paciente', icon: <UserPlus className="h-4 w-4" />, path: '/patients/new' },
  { id: 'view-patients', label: 'Ver Pacientes', icon: <Users className="h-4 w-4" />, path: '/patients' },
  { id: 'edit-profile', label: 'Editar Perfil', icon: <User className="h-4 w-4" />, path: '/profile/edit' },
  { id: 'issue-nfse', label: 'Emitir NFSe', icon: <FileText className="h-4 w-4" />, path: '/nfse-config' },
  { id: 'view-schedule', label: 'Ver Agenda', icon: <Calendar className="h-4 w-4" />, path: '/schedule' },
  { id: 'financial-reports', label: 'Relatórios Financeiros', icon: <BarChart3 className="h-4 w-4" />, path: '/financial' },
  { id: 'team-management', label: 'Gestão de Equipe', icon: <Users className="h-4 w-4" />, path: '/therapist-management' },
  { id: 'admin-settings', label: 'Configurações', icon: <SettingsIcon className="h-4 w-4" />, path: '/admin-settings' },
];

const DEFAULT_ACTIONS = ['new-session', 'register-payment', 'add-patient'];

export const DashboardQuickActions = ({ isEditMode, className }: CardProps) => {
  const navigate = useNavigate();
  const [selectedActions, setSelectedActions] = useState<string[]>([]);
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('dashboard-quick-actions-config');
    if (saved) {
      try {
        setSelectedActions(JSON.parse(saved));
      } catch {
        setSelectedActions(DEFAULT_ACTIONS);
      }
    } else {
      setSelectedActions(DEFAULT_ACTIONS);
    }
  }, []);

  const handleToggleAction = (actionId: string) => {
    setSelectedActions(prev => {
      const newSelection = prev.includes(actionId)
        ? prev.filter(id => id !== actionId)
        : [...prev, actionId];
      
      // Garante pelo menos 1 ação selecionada
      if (newSelection.length === 0) return prev;
      
      return newSelection;
    });
  };

  const handleSaveConfig = () => {
    localStorage.setItem('dashboard-quick-actions-config', JSON.stringify(selectedActions));
    setIsConfigOpen(false);
  };

  const activeActions = AVAILABLE_QUICK_ACTIONS.filter(action => 
    selectedActions.includes(action.id)
  );

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-sm font-medium">Ações Rápidas</CardTitle>
            <CardDescription className="text-xs">Atalhos principais</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold mb-1">Ações Rápidas</p>
                <p className="text-xs">Botões de acesso rápido para funções principais do sistema como criar paciente, agendar sessão, registrar pagamento, etc. Use o ícone de configurações para personalizar os atalhos exibidos.</p>
              </TooltipContent>
            </Tooltip>
            <Dialog open={isConfigOpen} onOpenChange={setIsConfigOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-6 w-6">
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Configurar Atalhos</DialogTitle>
                <DialogDescription>
                  Selecione os atalhos que deseja exibir no card
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {AVAILABLE_QUICK_ACTIONS.map(action => (
                  <div key={action.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={action.id}
                      checked={selectedActions.includes(action.id)}
                      onCheckedChange={() => handleToggleAction(action.id)}
                    />
                    <label
                      htmlFor={action.id}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2 cursor-pointer"
                    >
                      {action.icon}
                      {action.label}
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsConfigOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveConfig}>
                  Salvar
                </Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {activeActions.map(action => (
            <Button
              key={action.id}
              variant="outline"
              className="h-auto py-3 px-2 flex flex-col items-center gap-1 hover:bg-accent"
              onClick={() => navigate(action.path)}
            >
              {action.icon}
              <span className="text-xs">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export const DashboardRecentSessions = ({ isEditMode, className, sessions = [], patients = [] }: CardProps) => {
  const navigate = useNavigate();

  const recentSessions = useMemo(() => {
    return sessions
      .filter(s => s.status === 'attended')
      .sort((a, b) => {
        const dateA = parseISO(a.date);
        const dateB = parseISO(b.date);
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5)
      .map(session => {
        const patient = patients.find(p => p.id === session.patient_id);
        return {
          ...session,
          patientName: patient?.name || 'Paciente não encontrado',
          patientId: patient?.id,
        };
      });
  }, [sessions, patients]);

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Sessões Recentes</CardTitle>
          <Tooltip>
            <TooltipTrigger asChild>
              <Info className="h-4 w-4 text-muted-foreground cursor-help" />
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="font-semibold mb-1">Últimas Sessões</p>
              <p className="text-xs">Lista das 5 sessões mais recentes realizadas (status = 'attended'), ordenadas por data decrescente. Mostra data, hora e paciente. Clique em uma sessão para ir ao cadastro do paciente.</p>
            </TooltipContent>
          </Tooltip>
        </div>
        <CardDescription className="text-xs">Últimas sessões realizadas</CardDescription>
      </CardHeader>
      <CardContent>
        {recentSessions.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Nenhuma sessão recente
          </p>
        ) : (
          <div className="space-y-2">
            {recentSessions.map((session) => (
              <button
                key={session.id}
                onClick={() => session.patientId && navigate(`/patients/${session.patientId}`)}
                className="w-full text-left hover:bg-accent rounded-md p-2 transition-colors flex items-start gap-2"
              >
                <CheckCircle2 className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{session.patientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {format(parseISO(session.date), "dd/MM", { locale: ptBR })}
                    {session.time && ` às ${session.time}`}
                  </p>
                </div>
                <ExternalLink className="h-3 w-3 text-muted-foreground flex-shrink-0" />
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

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
          <div className="flex items-center gap-2">
            <div>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Tendência de Receita
              </CardTitle>
              <CardDescription className="text-xs">Evolução temporal</CardDescription>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold mb-1">Tendência de Receita</p>
                <p className="text-xs mb-2">Gráfico de linha mostrando a evolução da receita ao longo do período selecionado.</p>
                <p className="text-xs font-mono bg-muted p-1 rounded">Fórmula: SUM(sessões.value WHERE status='attended') agrupado por intervalo de tempo</p>
                <p className="text-xs mt-2">Use o botão de configurações para alternar entre visualização diária, semanal ou mensal.</p>
              </TooltipContent>
            </Tooltip>
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
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <DollarSign className="h-4 w-4 text-primary" />
                Status de Pagamentos
              </CardTitle>
              <CardDescription className="text-xs">Distribuição</CardDescription>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold mb-1">Status de Pagamentos</p>
                <p className="text-xs mb-2">Gráfico de pizza mostrando a distribuição entre sessões pagas e não pagas.</p>
                <p className="text-xs font-mono bg-muted p-1 rounded">Pagos: COUNT(sessões WHERE paid=true) | Não Pagos: COUNT(sessões WHERE paid=false OR null)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
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
  
  // Calcular taxa de comparecimento por intervalo
  const chartData = start && end 
    ? generateTimeIntervals(start, end, currentScale).map(intervalDate => {
        const bounds = getIntervalBounds(intervalDate, currentScale);
        const intervalSessions = sessions.filter(session => {
          if (!session.date) return false;
          try {
            const sessionDate = parseISO(session.date);
            return sessionDate >= bounds.start && sessionDate <= bounds.end;
          } catch {
            return false;
          }
        });

        const expected = intervalSessions.filter(s => ['attended', 'missed'].includes(s.status)).length;
        
        // Só adiciona se houver sessões esperadas neste intervalo
        if (expected > 0) {
          const attended = intervalSessions.filter(s => s.status === 'attended').length;
          const rate = (attended / expected) * 100;
          
          return {
            label: formatTimeLabel(intervalDate, currentScale),
            taxa: Math.round(rate),
          };
        }
        return null;
      }).filter(d => d !== null)
    : [];

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                Taxa de Comparecimento
              </CardTitle>
              <CardDescription className="text-xs">Evolução temporal</CardDescription>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold mb-1">Taxa de Comparecimento</p>
                <p className="text-xs mb-2">Gráfico mostrando o percentual de comparecimento ao longo do tempo.</p>
                <p className="text-xs font-mono bg-muted p-1 rounded">Taxa = (Comparecidas / Total Esperado) × 100</p>
              </TooltipContent>
            </Tooltip>
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
              domain={[0, 100]}
            />
            <RechartsTooltip 
              formatter={(value: number) => `${value}%`}
              contentStyle={{ fontSize: '12px' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px' }} />
            <Line 
              type="monotone" 
              dataKey="taxa" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={{ r: 3 }}
              name="Taxa de Comparecimento %" 
            />
          </LineChart>
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
      fill: 'hsl(var(--success))' 
    },
    { 
      name: 'Faltadas', 
      value: sessionTypes.missed || 0, 
      fill: 'hsl(var(--destructive))' 
    },
    { 
      name: 'Pendentes', 
      value: sessionTypes.pending || 0, 
      fill: 'hsl(var(--warning))' 
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
  end,
  automaticScale = 'monthly',
  getScale,
  setScaleOverride,
  clearOverride,
  hasOverride
}: CardProps) => {
  const chartId = 'dashboard-chart-monthly-comparison';
  const currentScale = getScale ? getScale(chartId) : automaticScale;
  
  // Gerar dados agregados por intervalo com sessões no período
  const chartData = start && end 
    ? generateTimeIntervals(start, end, currentScale).map(intervalDate => {
        const bounds = getIntervalBounds(intervalDate, currentScale);
        const intervalSessions = sessions.filter(session => {
          if (!session.date) return false;
          try {
            const sessionDate = parseISO(session.date);
            return sessionDate >= bounds.start && sessionDate <= bounds.end;
          } catch {
            return false;
          }
        });

        return {
          label: formatTimeLabel(intervalDate, currentScale),
          attended: intervalSessions.filter(s => s.status === 'attended').length,
          missed: intervalSessions.filter(s => s.status === 'missed').length,
          pending: intervalSessions.filter(s => s.status === 'pending').length,
          total: intervalSessions.length,
        };
      })
    : [];

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                Comparação Temporal
              </CardTitle>
              <CardDescription className="text-xs">Sessões no período</CardDescription>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-semibold mb-1">Comparação Temporal</p>
                <p className="text-xs mb-2">Gráfico de barras comparando sessões realizadas, faltas e pendentes ao longo do tempo.</p>
                <p className="text-xs font-mono bg-muted p-1 rounded">Comparecidas + Faltas + Pendentes por intervalo</p>
              </TooltipContent>
            </Tooltip>
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
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
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
              <Bar dataKey="attended" fill="hsl(var(--success))" name="Compareceram" />
              <Bar dataKey="missed" fill="hsl(var(--destructive))" name="Faltaram" />
              <Bar dataKey="pending" fill="hsl(var(--warning))" name="Pendentes" />
            </BarChart>
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

export const DashboardChartHourlyDistribution = ({ 
  isEditMode, 
  className, 
  sessions = [],
  start,
  end
}: CardProps) => {
  const chartData = useMemo(() => {
    // Filtrar sessões atendidas no período
    const validSessions = sessions.filter(s => {
      if (s.status !== 'attended' || !s.time) return false;
      if (!s.date || !start || !end) return false;
      try {
        const sessionDate = parseISO(s.date);
        return sessionDate >= start && sessionDate <= end;
      } catch {
        return false;
      }
    });

    // Agrupar por hora (08:00 -> 08, 14:30 -> 14)
    const hourCounts = validSessions.reduce((acc, session) => {
      const hour = session.time.split(':')[0];
      acc[hour] = (acc[hour] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Criar array ordenado de 8h às 20h
    const hours = [];
    for (let h = 8; h <= 20; h++) {
      const hourKey = h.toString().padStart(2, '0');
      hours.push({
        hour: `${hourKey}:00`,
        count: hourCounts[hourKey] || 0,
      });
    }

    return hours;
  }, [sessions, start, end]);

  const totalSessions = chartData.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4 text-primary" />
          Distribuição por Horário
        </CardTitle>
        <CardDescription className="text-xs">Sessões atendidas no período</CardDescription>
      </CardHeader>
      <CardContent>
        {totalSessions > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis 
                dataKey="hour" 
                tick={{ fontSize: 10 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                stroke="hsl(var(--muted-foreground))"
              />
              <RechartsTooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))'
                }}
                formatter={(value: any) => [`${value} sessões`, 'Total']}
              />
              <Bar dataKey="count" fill="hsl(var(--primary))" name="Sessões" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[220px] flex items-center justify-center text-xs text-muted-foreground">
            Sem sessões no período
          </div>
        )}
      </CardContent>
    </Card>
  );
};

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
  'dashboard-active-therapists-team': DashboardActiveTherapistsTeam,

  // Metrics Cards (FASE C3.6)
  'metrics-revenue-total': () => null, // placeholder - será renderizado diretamente em Metrics.tsx
  'metrics-avg-per-session': () => null,
  'metrics-forecast-revenue': () => null,
  'metrics-avg-per-active-patient': () => null,
  'metrics-lost-revenue': () => null,
  'metrics-missed-rate': () => null,
  'metrics-active-patients': () => null,
  'metrics-occupation-rate': () => null,
  'metrics-website-views': () => null,
  'metrics-website-visitors': () => null,
  'metrics-website-conversion': () => null,
  'metrics-website-ctr': () => null,
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
