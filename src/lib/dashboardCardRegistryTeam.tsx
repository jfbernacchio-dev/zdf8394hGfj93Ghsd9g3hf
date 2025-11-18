/**
 * ============================================================================
 * DASHBOARD CARDS REGISTRY - TEAM (EQUIPE)
 * ============================================================================
 * 
 * Versões dos cards específicas para dados da equipe (subordinados)
 * FASE 1: Interface CardProps corrigida
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, TrendingUp, DollarSign, AlertCircle, Calendar, CheckCircle, XCircle, Clock, Percent } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { parseISO, format } from 'date-fns';

// ============================================================================
// INTERFACE CARDPROPS (mesma do dashboardCardRegistry.tsx)
// ============================================================================

interface CardProps {
  isEditMode?: boolean;
  className?: string;
  patients?: any[];
  sessions?: any[];
  start?: Date;
  end?: Date;
  automaticScale?: any;
  getScale?: (chartId: string) => any;
  setScaleOverride?: (chartId: string, scale: any | null) => void;
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

// ============================================================================
// CARDS FINANCEIROS - EQUIPE
// ============================================================================

export const DashboardExpectedRevenueTeam = ({ 
  patients = [], 
  sessions = [], 
  start, 
  end,
  isEditMode,
  className 
}: CardProps) => {
  // FASE 2: Filtrar sessões por período
  const periodSessions = sessions.filter(s => {
    if (!s.date || !start || !end) return false;
    try {
      const sessionDate = parseISO(s.date);
      return sessionDate >= start && sessionDate <= end;
    } catch {
      return false;
    }
  });

  // FASE 3: Fórmula correta com tracking de mensalistas
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
          <CardTitle className="text-sm font-medium">Receita Esperada - Equipe</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Receita esperada total da equipe considerando todas as sessões agendadas (excluindo faltadas)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          <div className="text-2xl font-bold">
            {expectedRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {periodSessions.length} sessões
        </p>
      </CardContent>
    </Card>
  );
};

export const DashboardActualRevenueTeam = ({ 
  patients = [], 
  sessions = [], 
  start, 
  end,
  isEditMode,
  className 
}: CardProps) => {
  // FASE 2: Filtrar sessões por período (attended ou paid)
  const periodSessions = sessions.filter(s => {
    if (!s.date || !start || !end) return false;
    try {
      const sessionDate = parseISO(s.date);
      return sessionDate >= start && sessionDate <= end && (s.status === 'attended' || s.paid);
    } catch {
      return false;
    }
  });

  // FASE 3: Fórmula correta com tracking de mensalistas
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
          <CardTitle className="text-sm font-medium">Receita Realizada - Equipe</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Valor total das sessões realizadas pela equipe no período</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <DollarSign className="h-4 w-4 text-green-500" />
          <div className="text-2xl font-bold text-green-600">
            {actualRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {periodSessions.length} sessões realizadas
        </p>
      </CardContent>
    </Card>
  );
};

export const DashboardUnpaidValueTeam = ({ 
  patients = [], 
  sessions = [], 
  start, 
  end,
  isEditMode,
  className 
}: CardProps) => {
  // FASE 2: Filtrar sessões não pagas por período
  const periodSessions = sessions.filter(s => {
    if (!s.date || !start || !end) return false;
    try {
      const sessionDate = parseISO(s.date);
      return sessionDate >= start && sessionDate <= end && s.status === 'attended' && !s.paid;
    } catch {
      return false;
    }
  });

  // FASE 3: Fórmula correta com tracking de mensalistas
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
          <CardTitle className="text-sm font-medium">Valores a Receber - Equipe</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Valor total de sessões realizadas pela equipe mas ainda não pagas</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-orange-500" />
          <div className="text-2xl font-bold text-orange-600">
            {unpaidValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {periodSessions.length} sessões pendentes
        </p>
      </CardContent>
    </Card>
  );
};

export const DashboardPaymentRateTeam = ({ 
  patients = [], 
  sessions = [], 
  start, 
  end,
  isEditMode,
  className 
}: CardProps) => {
  // FASE 2 & 3: Filtrar apenas sessões attended por período
  const periodSessions = sessions.filter(s => {
    if (!s.date || !start || !end) return false;
    try {
      const sessionDate = parseISO(s.date);
      return sessionDate >= start && sessionDate <= end && s.status === 'attended';
    } catch {
      return false;
    }
  });

  // FASE 3: Cálculo correto
  const paidSessions = periodSessions.filter(s => s.paid).length;
  const totalSessions = periodSessions.length;
  const paymentRate = totalSessions > 0 ? Math.round((paidSessions / totalSessions) * 100) : 0;

  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Taxa de Pagamento - Equipe</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Percentual de sessões realizadas pela equipe que já foram pagas</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Percent className="h-4 w-4 text-primary" />
          <div className="text-2xl font-bold">{paymentRate}%</div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {paidSessions} de {totalSessions} sessões pagas
        </p>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// CARDS ADMINISTRATIVOS - EQUIPE
// ============================================================================

export const DashboardTotalPatientsTeam = ({ 
  patients = [], 
  sessions = [], 
  start, 
  end,
  isEditMode,
  className 
}: CardProps) => {
  const activePatients = patients.filter((p: any) => p.status === 'active').length;
  
  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Pacientes Ativos - Equipe</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Total de pacientes ativos atendidos pela equipe</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" />
          <div className="text-2xl font-bold">{activePatients}</div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {patients.length} total
        </p>
      </CardContent>
    </Card>
  );
};

export const DashboardAttendedSessionsTeam = ({ 
  patients = [], 
  sessions = [], 
  start, 
  end,
  isEditMode,
  className 
}: CardProps) => {
  // FASE 2: Filtrar sessões por período
  const periodSessions = sessions.filter(s => {
    if (!s.date || !start || !end) return false;
    try {
      const sessionDate = parseISO(s.date);
      return sessionDate >= start && sessionDate <= end;
    } catch {
      return false;
    }
  });

  // FASE 3: Cálculo correto com percentual
  const attendedSessions = periodSessions.filter(s => s.status === 'attended');
  const percentage = periodSessions.length > 0 
    ? Math.round((attendedSessions.length / periodSessions.length) * 100) 
    : 0;
  
  return (
    <Card className={cn('h-full', className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium">Sessões Realizadas - Equipe</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="h-4 w-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>Total de sessões que foram realizadas pela equipe no período</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <div className="text-2xl font-bold text-green-600">{attendedSessions.length}</div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {percentage}% das esperadas
        </p>
      </CardContent>
    </Card>
  );
};
