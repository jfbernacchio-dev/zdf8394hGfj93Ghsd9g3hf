/**
 * 📊 SYSTEM METRICS UTILITIES
 * 
 * Módulo contendo TODAS as funções de cálculo de métricas financeiras e operacionais do sistema.
 * Extraído de Financial.tsx (FASE C3.1) sem modificações de lógica.
 * 
 * ⚠️ IMPORTANTE: Este código é uma cópia FIEL das funções originais.
 * NÃO foi otimizado, refatorado ou modificado.
 * 
 * @phase C3.1 - Extração cirúrgica
 * @source src/pages/Financial.tsx
 */

import { parseISO, format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TimeScale } from '@/hooks/useChartTimeScale';

// ============================================================
// TIPOS
// ============================================================

/**
 * Representa uma sessão para cálculos de métricas
 * Compatível com Database['public']['Tables']['sessions']['Row']
 */
export interface MetricsSession {
  id: string;
  patient_id: string;
  date: string; // ISO date string
  status: 'attended' | 'missed' | 'rescheduled' | 'cancelled';
  value: number | string;
  show_in_schedule?: boolean;
  patients?: {
    name?: string;
    user_id?: string;
  };
}

/**
 * Representa um paciente para cálculos de métricas
 * Compatível com Database['public']['Tables']['patients']['Row']
 */
export interface MetricsPatient {
  id: string;
  name: string;
  status: 'active' | 'inactive' | string;
  frequency: string;
  session_value: number | string;
  monthly_price?: boolean;
  created_at?: string;
  updated_at?: string;
  user_id: string;
}

/**
 * Representa um bloqueio de agenda
 */
export interface MetricsScheduleBlock {
  id: string;
  user_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  start_date?: string;
  end_date?: string;
  reason?: string;
}

/**
 * Perfil do profissional (para cálculo de ocupação)
 */
export interface MetricsProfile {
  work_days?: number[];
  work_start_time?: string;
  work_end_time?: string;
  slot_duration?: number;
  break_time?: number;
}

/**
 * Range de datas
 */
export interface DateRange {
  start: Date;
  end: Date;
}

// ============================================================
// TIPOS DE FACHADA PÚBLICA (FASE C3.3)
// ============================================================

/**
 * Sumário financeiro do período selecionado
 * Agrega as principais métricas financeiras em um único objeto
 */
export interface FinancialSummary {
  totalRevenue: number;                // receita total no período
  totalSessions: number;               // total de sessões realizadas
  missedRate: number;                  // taxa de falta 0–100 (%)
  avgPerSession: number;               // ticket médio por sessão
  activePatients: number;              // pacientes ativos no período
  lostRevenue: number;                 // receita perdida por faltas
  avgRevenuePerActivePatient: number;  // ticket médio por paciente ativo
  forecastRevenue: number;             // previsão de receita mensal
}

/**
 * Ponto de tendência financeira para séries temporais (gráficos)
 * Representa métricas em um ponto específico no tempo
 */
export interface FinancialTrendPoint {
  label: string;       // "Jan/25", "01/2025", etc.
  date: string;        // ISO "2025-01-01"
  revenue: number;     // receita no período
  sessions: number;    // sessões realizadas no período
  missedRate: number;  // taxa de falta 0–100 (%)
  growth: number;      // crescimento percentual vs período anterior
}

/**
 * Sumário de retenção e churn de pacientes
 */
export interface RetentionSummary {
  newPatients: number;      // novos pacientes no período
  inactivePatients: number; // pacientes que ficaram inativos no período
  retentionRate3m: number;  // taxa de retenção em 3 meses (0–100)
  retentionRate6m: number;  // taxa de retenção em 6 meses (0–100)
  retentionRate12m: number; // taxa de retenção em 12 meses (0–100)
  churnRate: number;        // taxa de churn geral (0–100)
}

// ============================================================
// HELPER: getDateRange (usado internamente)
// ============================================================

/**
 * Calcula o range de datas baseado no período selecionado
 * 
 * @source Financial.tsx linha 183-202
 */
export const getDateRange = (
  period: string,
  customStartDate: string,
  customEndDate: string
): DateRange => {
  const now = new Date();
  let start: Date, end: Date;

  if (period === 'custom') {
    start = new Date(customStartDate);
    end = new Date(customEndDate);
  } else if (period === '3months') {
    start = subMonths(now, 3);
    end = now;
  } else if (period === '6months') {
    start = subMonths(now, 6);
    end = now;
  } else {
    start = new Date(now.getFullYear(), 0, 1);
    end = now;
  }

  return { start, end };
};

// ============================================================
// FUNÇÕES PRINCIPAIS DE MÉTRICAS
// ============================================================

/**
 * Calcula receita mensal ao longo do período
 * Considera pacientes mensalistas (conta uma vez por mês)
 * 
 * @source Financial.tsx linha 216-263
 */
export const getMonthlyRevenue = (params: {
  sessions: MetricsSession[];
  patients: MetricsPatient[];
  start: Date;
  end: Date;
}): Array<{
  month: string;
  receita: number;
  sessoes: number;
  esperadas: number;
  encerrados: number;
}> => {
  const { sessions, patients, start, end } = params;
  const months = eachMonthOfInterval({ start, end });
  
  return months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    const monthSessions = sessions.filter(s => {
      const date = parseISO(s.date);
      return date >= monthStart && date <= monthEnd && s.status === 'attended';
    });

    // Calculate revenue considering monthly patients
    const monthlyPatients = new Set<string>();
    const revenue = monthSessions.reduce((sum, s) => {
      const patient = patients.find(p => p.id === s.patient_id);
      if (patient?.monthly_price) {
        // For monthly patients, count only once per month
        if (!monthlyPatients.has(s.patient_id)) {
          monthlyPatients.add(s.patient_id);
          return sum + Number(s.value);
        }
        return sum;
      }
      return sum + Number(s.value);
    }, 0);

    const expected = sessions.filter(s => {
      const date = parseISO(s.date);
      return date >= monthStart && date <= monthEnd && s.show_in_schedule !== false;
    }).length;

    // Count inactive patients in this month
    const inactiveCount = patients.filter(p => {
      if (p.status !== 'inactive' || !p.updated_at) return false;
      const updatedDate = parseISO(p.updated_at);
      return updatedDate >= monthStart && updatedDate <= monthEnd;
    }).length;

    return {
      month: format(month, 'MMM/yy', { locale: ptBR }),
      receita: revenue,
      sessoes: monthSessions.length,
      esperadas: expected,
      encerrados: inactiveCount,
    };
  });
};

/**
 * Calcula distribuição de receita por paciente
 * Considera pacientes mensalistas (conta uma vez por mês)
 * 
 * @source Financial.tsx linha 266-296
 */
export const getPatientDistribution = (params: {
  sessions: MetricsSession[];
  patients: MetricsPatient[];
}): Array<{ name: string; value: number }> => {
  const { sessions, patients } = params;
  const patientRevenue = new Map<string, number>();
  const monthlyPatients = new Map<string, Set<string>>();
  
  sessions.forEach(session => {
    if (session.status === 'attended') {
      const patientName = session.patients?.name || 'Desconhecido';
      const patient = patients.find(p => p.id === session.patient_id);
      const current = patientRevenue.get(patientName) || 0;
      
      if (patient?.monthly_price) {
        // For monthly patients, count once per month
        const monthKey = format(parseISO(session.date), 'yyyy-MM');
        if (!monthlyPatients.has(patientName)) {
          monthlyPatients.set(patientName, new Set());
        }
        const months = monthlyPatients.get(patientName)!;
        if (!months.has(monthKey)) {
          months.add(monthKey);
          patientRevenue.set(patientName, current + Number(session.value));
        }
      } else {
        patientRevenue.set(patientName, current + Number(session.value));
      }
    }
  });

  return Array.from(patientRevenue.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

/**
 * Calcula taxa de falta por mês
 * Usa apenas sessões visíveis (show_in_schedule !== false)
 * 
 * @source Financial.tsx linha 299-322
 */
export const getMissedRate = (params: {
  sessions: MetricsSession[];
  start: Date;
  end: Date;
}): Array<{
  month: string;
  taxa: number;
  faltas: number;
  total: number;
}> => {
  const { sessions, start, end } = params;
  
  // Only visible sessions
  const visibleSessions = sessions.filter(s => s.show_in_schedule !== false);
  
  const months = eachMonthOfInterval({ start, end });
  
  return months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    const monthSessions = visibleSessions.filter(s => {
      const date = parseISO(s.date);
      return date >= monthStart && date <= monthEnd;
    });

    const missed = monthSessions.filter(s => s.status === 'missed').length;
    const total = monthSessions.length;
    const rate = total > 0 ? (missed / total) * 100 : 0;

    return {
      month: format(month, 'MMM/yy', { locale: ptBR }),
      taxa: Number(rate.toFixed(1)),
      faltas: missed,
      total,
    };
  });
};

/**
 * Calcula faturamento médio por paciente (top 10)
 * Considera pacientes mensalistas
 * 
 * @source Financial.tsx linha 325-374
 */
export const getAvgRevenuePerPatient = (params: {
  sessions: MetricsSession[];
  patients: MetricsPatient[];
}): Array<{
  name: string;
  faturamento: number;
  media: number;
  sessoes: number;
}> => {
  const { sessions, patients } = params;
  const patientRevenue = new Map<string, { revenue: number; sessions: number; monthly: boolean }>();
  const monthlyPatients = new Map<string, Set<string>>();
  
  sessions.forEach(session => {
    if (session.status === 'attended') {
      const patientName = session.patients?.name || 'Desconhecido';
      const patient = patients.find(p => p.id === session.patient_id);
      const current = patientRevenue.get(patientName) || { revenue: 0, sessions: 0, monthly: false };
      
      if (patient?.monthly_price) {
        // For monthly patients, count revenue once per month
        const monthKey = format(parseISO(session.date), 'yyyy-MM');
        if (!monthlyPatients.has(patientName)) {
          monthlyPatients.set(patientName, new Set());
        }
        const months = monthlyPatients.get(patientName)!;
        if (!months.has(monthKey)) {
          months.add(monthKey);
          patientRevenue.set(patientName, {
            revenue: current.revenue + Number(session.value),
            sessions: current.sessions + 1,
            monthly: true,
          });
        } else {
          patientRevenue.set(patientName, {
            ...current,
            sessions: current.sessions + 1,
          });
        }
      } else {
        patientRevenue.set(patientName, {
          revenue: current.revenue + Number(session.value),
          sessions: current.sessions + 1,
          monthly: false,
        });
      }
    }
  });

  return Array.from(patientRevenue.entries())
    .map(([name, data]) => ({
      name,
      faturamento: data.revenue,
      media: data.sessions > 0 ? data.revenue / data.sessions : 0,
      sessoes: data.sessions,
    }))
    .sort((a, b) => b.faturamento - a.faturamento)
    .slice(0, 10); // Limit to top 10 patients
};

/**
 * Calcula receita total do período
 * Considera pacientes mensalistas (conta uma vez por mês)
 * 
 * @source Financial.tsx linha 377-395
 */
export const calculateTotalRevenue = (params: {
  sessions: MetricsSession[];
  patients: MetricsPatient[];
}): number => {
  const { sessions, patients } = params;
  const monthlyPatientsTracked = new Map<string, Set<string>>();
  
  return sessions
    .filter(s => s.status === 'attended')
    .reduce((sum, s) => {
      const patient = patients.find(p => p.id === s.patient_id);
      if (patient?.monthly_price) {
        const monthKey = format(parseISO(s.date), 'yyyy-MM');
        if (!monthlyPatientsTracked.has(s.patient_id)) {
          monthlyPatientsTracked.set(s.patient_id, new Set());
        }
        const months = monthlyPatientsTracked.get(s.patient_id)!;
        if (!months.has(monthKey)) {
          months.add(monthKey);
          return sum + Number(s.value);
        }
        return sum;
      }
      return sum + Number(s.value);
    }, 0);
};

/**
 * Calcula total de sessões realizadas
 * 
 * @source Financial.tsx linha 397
 */
export const calculateTotalSessions = (params: {
  sessions: MetricsSession[];
}): number => {
  const { sessions } = params;
  return sessions.filter(s => s.status === 'attended').length;
};

/**
 * Calcula número de sessões perdidas (faltas)
 * Usa apenas sessões visíveis
 * 
 * @source Financial.tsx linha 398
 */
export const calculateMissedSessions = (params: {
  sessions: MetricsSession[];
}): number => {
  const { sessions } = params;
  const visibleSessions = sessions.filter(s => s.show_in_schedule !== false);
  return visibleSessions.filter(s => s.status === 'missed').length;
};

/**
 * Calcula taxa de falta geral (%)
 * Usa apenas sessões visíveis
 * 
 * @source Financial.tsx linha 399-401
 */
export const calculateMissedRatePercentage = (params: {
  sessions: MetricsSession[];
}): string => {
  const { sessions } = params;
  const visibleSessions = sessions.filter(s => s.show_in_schedule !== false);
  const missedSessions = visibleSessions.filter(s => s.status === 'missed').length;
  
  return visibleSessions.length > 0 
    ? ((missedSessions / visibleSessions.length) * 100).toFixed(1) 
    : '0.0';
};

/**
 * Calcula valor médio por sessão realizada
 * 
 * @source Financial.tsx linha 403
 */
export const calculateAvgPerSession = (params: {
  totalRevenue: number;
  totalSessions: number;
}): number => {
  const { totalRevenue, totalSessions } = params;
  return totalSessions > 0 ? totalRevenue / totalSessions : 0;
};

/**
 * Conta pacientes ativos
 * 
 * @source Financial.tsx linha 404
 */
export const calculateActivePatients = (params: {
  patients: MetricsPatient[];
}): number => {
  const { patients } = params;
  return patients.filter(p => p.status === 'active').length;
};

/**
 * Lista faltas por paciente
 * Usa apenas sessões visíveis
 * 
 * @source Financial.tsx linha 407-421
 */
export const getMissedByPatient = (params: {
  sessions: MetricsSession[];
}): Array<{ name: string; faltas: number }> => {
  const { sessions } = params;
  const visibleSessions = sessions.filter(s => s.show_in_schedule !== false);
  const patientMissed = new Map<string, number>();
  
  visibleSessions.forEach(session => {
    if (session.status === 'missed') {
      const patientName = session.patients?.name || 'Desconhecido';
      const current = patientMissed.get(patientName) || 0;
      patientMissed.set(patientName, current + 1);
    }
  });

  return Array.from(patientMissed.entries())
    .map(([name, faltas]) => ({ name, faltas }))
    .sort((a, b) => b.faltas - a.faltas);
};

/**
 * Distribuição de faltas por paciente (para gráfico de pizza)
 * Usa apenas sessões visíveis
 * 
 * @source Financial.tsx linha 424-438
 */
export const getMissedDistribution = (params: {
  sessions: MetricsSession[];
}): Array<{ name: string; value: number }> => {
  const { sessions } = params;
  const visibleSessions = sessions.filter(s => s.show_in_schedule !== false);
  const patientMissed = new Map<string, number>();
  
  visibleSessions.forEach(session => {
    if (session.status === 'missed') {
      const patientName = session.patients?.name || 'Desconhecido';
      const current = patientMissed.get(patientName) || 0;
      patientMissed.set(patientName, current + 1);
    }
  });

  return Array.from(patientMissed.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

/**
 * Calcula valor perdido por faltas
 * Usa apenas sessões visíveis
 * 
 * @source Financial.tsx linha 449-451
 */
export const calculateLostRevenue = (params: {
  sessions: MetricsSession[];
}): number => {
  const { sessions } = params;
  const visibleSessions = sessions.filter(s => s.show_in_schedule !== false);
  
  return visibleSessions
    .filter(s => s.status === 'missed')
    .reduce((sum, s) => sum + Number(s.value), 0);
};

/**
 * Calcula receita média por paciente ativo
 * 
 * @source Financial.tsx linha 454
 */
export const calculateAvgRevenuePerActivePatient = (params: {
  totalRevenue: number;
  activePatients: number;
}): number => {
  const { totalRevenue, activePatients } = params;
  return activePatients > 0 ? totalRevenue / activePatients : 0;
};

/**
 * Calcula previsão de receita mensal
 * Baseado em pacientes mensalistas + frequência de semanais
 * 
 * @source Financial.tsx linha 457-469
 */
export const getForecastRevenue = (params: {
  patients: MetricsPatient[];
}): number => {
  const { patients } = params;
  
  const monthlyTotal = patients
    .filter(p => p.status === 'active' && p.monthly_price)
    .reduce((sum, p) => sum + Number(p.session_value), 0);
  
  const weeklyPatients = patients.filter(p => p.status === 'active' && !p.monthly_price);
  const weeklyTotal = weeklyPatients.reduce((sum, p) => {
    const frequency = p.frequency === 'weekly' ? 4 : p.frequency === 'biweekly' ? 2 : 0;
    return sum + (Number(p.session_value) * frequency);
  }, 0);

  return monthlyTotal + weeklyTotal;
};

/**
 * Calcula taxa de ocupação da agenda
 * Baseado em horários de trabalho e bloqueios
 * Pode ultrapassar 100% se houver sessões fora do horário
 * 
 * @source Financial.tsx linha 476-531
 */
export const calculateOccupationRate = (params: {
  sessions: MetricsSession[];
  profile: MetricsProfile | null;
  scheduleBlocks: MetricsScheduleBlock[];
  start: Date;
  end: Date;
}): number => {
  const { sessions, profile, scheduleBlocks, start, end } = params;
  
  if (!profile) return 0;
  
  const visibleSessions = sessions.filter(s => s.show_in_schedule !== false);
  
  const workDays = profile.work_days || [1, 2, 3, 4, 5];
  const startTime = profile.work_start_time || '08:00';
  const endTime = profile.work_end_time || '18:00';
  const slotDuration = profile.slot_duration || 60;
  const breakTime = profile.break_time || 15;
  
  // Calculate total available slots per week (baseado apenas no horário de trabalho declarado)
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const totalMinutesPerDay = (endHour * 60 + endMin) - (startHour * 60 + startMin);
  
  // Slots per day considering session duration + break time
  const slotsPerDay = Math.floor(totalMinutesPerDay / (slotDuration + breakTime));
  const slotsPerWeek = workDays.length * slotsPerDay;
  
  // Calculate weeks in the selected period
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));
  
  const totalAvailableSlots = slotsPerWeek * diffWeeks;
  
  // Calculate blocked slots from schedule_blocks
  let blockedSlots = 0;
  scheduleBlocks.forEach(block => {
    const blockStart = block.start_date ? parseISO(block.start_date) : start;
    const blockEnd = block.end_date ? parseISO(block.end_date) : end;
    
    // Only count blocks that overlap with the selected period
    if (blockStart <= end && blockEnd >= start) {
      const [blockStartHour, blockStartMin] = block.start_time.split(':').map(Number);
      const [blockEndHour, blockEndMin] = block.end_time.split(':').map(Number);
      const blockedMinutes = (blockEndHour * 60 + blockEndMin) - (blockStartHour * 60 + blockStartMin);
      const blockedSlotsPerOccurrence = Math.floor(blockedMinutes / (slotDuration + breakTime));
      
      // Calculate number of occurrences in the period
      const effectiveStart = blockStart < start ? start : blockStart;
      const effectiveEnd = blockEnd > end ? end : blockEnd;
      const daysDiff = Math.ceil((effectiveEnd.getTime() - effectiveStart.getTime()) / (1000 * 60 * 60 * 24));
      const weeksDiff = Math.ceil(daysDiff / 7);
      
      blockedSlots += blockedSlotsPerOccurrence * weeksDiff;
    }
  });
  
  // Calculate actually used slots (only visible attended sessions, excluding hidden sessions)
  const usedSlots = visibleSessions.filter(s => s.status === 'attended').length;
  
  // Available slots minus blocked slots (denominador fixo baseado no horário de trabalho)
  const effectiveAvailableSlots = Math.max(totalAvailableSlots - blockedSlots, 0);
  
  // Pode ultrapassar 100% se houver sessões fora do horário de trabalho
  return effectiveAvailableSlots > 0 ? (usedSlots / effectiveAvailableSlots) * 100 : 0;
};

/**
 * Compara ticket médio entre pacientes mensalistas e semanais
 * 
 * @source Financial.tsx linha 536-575
 */
export const getTicketComparison = (params: {
  sessions: MetricsSession[];
  patients: MetricsPatient[];
}): Array<{ tipo: string; ticket: number; quantidade: number }> => {
  const { sessions, patients } = params;
  const monthlyPatientRevenue = new Map<string, number>();
  const weeklyPatientRevenue = new Map<string, number>();
  const monthlyPatientsSet = new Map<string, Set<string>>();

  sessions.forEach(session => {
    if (session.status === 'attended') {
      const patient = patients.find(p => p.id === session.patient_id);
      if (patient) {
        const current = patient.monthly_price 
          ? monthlyPatientRevenue.get(session.patient_id) || 0
          : weeklyPatientRevenue.get(session.patient_id) || 0;

        if (patient.monthly_price) {
          const monthKey = format(parseISO(session.date), 'yyyy-MM');
          if (!monthlyPatientsSet.has(session.patient_id)) {
            monthlyPatientsSet.set(session.patient_id, new Set());
          }
          const months = monthlyPatientsSet.get(session.patient_id)!;
          if (!months.has(monthKey)) {
            months.add(monthKey);
            monthlyPatientRevenue.set(session.patient_id, current + Number(session.value));
          }
        } else {
          weeklyPatientRevenue.set(session.patient_id, current + Number(session.value));
        }
      }
    }
  });

  const monthlyCount = monthlyPatientRevenue.size;
  const weeklyCount = weeklyPatientRevenue.size;
  const monthlyTotal = Array.from(monthlyPatientRevenue.values()).reduce((a, b) => a + b, 0);
  const weeklyTotal = Array.from(weeklyPatientRevenue.values()).reduce((a, b) => a + b, 0);

  return [
    { tipo: 'Mensais', ticket: monthlyCount > 0 ? monthlyTotal / monthlyCount : 0, quantidade: monthlyCount },
    { tipo: 'Semanais', ticket: weeklyCount > 0 ? weeklyTotal / weeklyCount : 0, quantidade: weeklyCount },
  ];
};

/**
 * Calcula tendência de crescimento mês a mês
 * Mostra crescimento percentual vs mês anterior
 * 
 * @source Financial.tsx linha 578-636
 */
export const getGrowthTrend = (params: {
  sessions: MetricsSession[];
  patients: MetricsPatient[];
  start: Date;
  end: Date;
}): Array<{
  month: string;
  receita: number;
  crescimento: number;
}> => {
  const { sessions, patients, start, end } = params;
  const months = eachMonthOfInterval({ start, end });
  
  return months.map((month, index) => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    const monthSessions = sessions.filter(s => {
      const date = parseISO(s.date);
      return date >= monthStart && date <= monthEnd && s.status === 'attended';
    });

    const monthlyPatientsInMonth = new Set<string>();
    const revenue = monthSessions.reduce((sum, s) => {
      const patient = patients.find(p => p.id === s.patient_id);
      if (patient?.monthly_price) {
        if (!monthlyPatientsInMonth.has(s.patient_id)) {
          monthlyPatientsInMonth.add(s.patient_id);
          return sum + Number(s.value);
        }
        return sum;
      }
      return sum + Number(s.value);
    }, 0);

    let growth = 0;
    if (index > 0) {
      const prevMonth = months[index - 1];
      const prevMonthStart = startOfMonth(prevMonth);
      const prevMonthEnd = endOfMonth(prevMonth);
      
      const prevMonthSessions = sessions.filter(s => {
        const date = parseISO(s.date);
        return date >= prevMonthStart && date <= prevMonthEnd && s.status === 'attended';
      });

      const prevMonthlyPatients = new Set<string>();
      const prevRevenue = prevMonthSessions.reduce((sum, s) => {
        const patient = patients.find(p => p.id === s.patient_id);
        if (patient?.monthly_price) {
          if (!prevMonthlyPatients.has(s.patient_id)) {
            prevMonthlyPatients.add(s.patient_id);
            return sum + Number(s.value);
          }
          return sum;
        }
        return sum + Number(s.value);
      }, 0);

      growth = prevRevenue > 0 ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;
    }

    return {
      month: format(month, 'MMM/yy', { locale: ptBR }),
      receita: revenue,
      crescimento: Number(growth.toFixed(1)),
    };
  });
};

/**
 * Compara novos pacientes vs encerrados por mês
 * 
 * @source Financial.tsx linha 639-664
 */
export const getNewVsInactive = (params: {
  patients: MetricsPatient[];
  start: Date;
  end: Date;
}): Array<{
  month: string;
  novos: number;
  encerrados: number;
}> => {
  const { patients, start, end } = params;
  const months = eachMonthOfInterval({ start, end });
  
  return months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    const newPatients = patients.filter(p => {
      if (!p.created_at) return false;
      const createdDate = parseISO(p.created_at);
      return createdDate >= monthStart && createdDate <= monthEnd;
    }).length;

    const inactivePatients = patients.filter(p => {
      if (p.status !== 'inactive' || !p.updated_at) return false;
      const updatedDate = parseISO(p.updated_at);
      return updatedDate >= monthStart && updatedDate <= monthEnd;
    }).length;

    return {
      month: format(month, 'MMM/yy', { locale: ptBR }),
      novos: newPatients,
      encerrados: inactivePatients,
    };
  });
};

/**
 * Calcula taxa de retenção em 3, 6 e 12 meses
 * Compara pacientes ativos agora vs criados naquele período
 * 
 * @source Financial.tsx linha 667-692
 */
export const getRetentionRate = (params: {
  patients: MetricsPatient[];
}): Array<{ periodo: string; taxa: number }> => {
  const { patients } = params;
  const now = new Date();
  const threeMonthsAgo = subMonths(now, 3);
  const sixMonthsAgo = subMonths(now, 6);
  const twelveMonthsAgo = subMonths(now, 12);

  const calculateRetention = (startDate: Date) => {
    const patientsAtStart = patients.filter(p => {
      if (!p.created_at) return false;
      const createdDate = parseISO(p.created_at);
      return createdDate <= startDate;
    });

    const stillActive = patientsAtStart.filter(p => p.status === 'active');
    
    return patientsAtStart.length > 0 
      ? (stillActive.length / patientsAtStart.length) * 100 
      : 0;
  };

  return [
    { periodo: '3 meses', taxa: Number(calculateRetention(threeMonthsAgo).toFixed(1)) },
    { periodo: '6 meses', taxa: Number(calculateRetention(sixMonthsAgo).toFixed(1)) },
    { periodo: '12 meses', taxa: Number(calculateRetention(twelveMonthsAgo).toFixed(1)) },
  ];
};

/**
 * Calcula valor perdido por faltas por mês
 * Usa apenas sessões visíveis
 * 
 * @source Financial.tsx linha 695-714
 */
export const getLostRevenueByMonth = (params: {
  sessions: MetricsSession[];
  start: Date;
  end: Date;
}): Array<{ month: string; perdido: number }> => {
  const { sessions, start, end } = params;
  const visibleSessions = sessions.filter(s => s.show_in_schedule !== false);
  const months = eachMonthOfInterval({ start, end });
  
  return months.map(month => {
    const monthStart = startOfMonth(month);
    const monthEnd = endOfMonth(month);
    
    const missedInMonth = visibleSessions.filter(s => {
      const date = parseISO(s.date);
      return date >= monthStart && date <= monthEnd && s.status === 'missed';
    });

    const lost = missedInMonth.reduce((sum, s) => sum + Number(s.value), 0);

    return {
      month: format(month, 'MMM/yy', { locale: ptBR }),
      perdido: lost,
    };
  });
};

// ============================================================
// PUBLIC FACADE API (FASE C3.3)
// ============================================================

/**
 * 🎯 FACHADA PÚBLICA: Sumário Financeiro Completo
 * 
 * Agrega todas as principais métricas financeiras em um único objeto.
 * Esta função é a porta de entrada principal para obter dados financeiros
 * agregados do período selecionado.
 * 
 * @param params Parâmetros com sessões, pacientes e período
 * @returns FinancialSummary com todas as métricas calculadas
 * 
 * @example
 * ```ts
 * const summary = getFinancialSummary({
 *   sessions: metricsSessions,
 *   patients: metricsPatients,
 *   start: new Date('2025-01-01'),
 *   end: new Date('2025-12-31')
 * });
 * 
 * console.log(summary.totalRevenue); // 45000
 * console.log(summary.missedRate);   // 8.5
 * ```
 */
export function getFinancialSummary(params: {
  sessions: MetricsSession[];
  patients: MetricsPatient[];
  start: Date;
  end: Date;
}): FinancialSummary {
  const { sessions, patients } = params;

  // Calcular métricas base
  const totalRevenue = calculateTotalRevenue({ sessions, patients });
  const totalSessions = calculateTotalSessions({ sessions });
  const activePatients = calculateActivePatients({ patients });
  const lostRevenue = calculateLostRevenue({ sessions });
  const forecastRevenue = getForecastRevenue({ patients });

  // Taxa de falta como número (0-100)
  const missedRateStr = calculateMissedRatePercentage({ sessions });
  const missedRate = parseFloat(missedRateStr);

  // Médias calculadas
  const avgPerSession = calculateAvgPerSession({ totalRevenue, totalSessions });
  const avgRevenuePerActivePatient = calculateAvgRevenuePerActivePatient({
    totalRevenue,
    activePatients
  });

  return {
    totalRevenue,
    totalSessions,
    missedRate,
    avgPerSession,
    activePatients,
    lostRevenue,
    avgRevenuePerActivePatient,
    forecastRevenue
  };
}

/**
 * 🎯 FACHADA PÚBLICA: Tendências Financeiras ao Longo do Tempo
 * 
 * Gera uma série temporal de pontos de métricas financeiras para visualização
 * em gráficos. Cada ponto representa um intervalo de tempo (dia, semana ou mês)
 * com suas respectivas métricas.
 * 
 * @param params Parâmetros com sessões, pacientes, período e escala de tempo
 * @returns Array de FinancialTrendPoint para cada intervalo
 * 
 * @example
 * ```ts
 * const trends = getFinancialTrends({
 *   sessions: metricsSessions,
 *   patients: metricsPatients,
 *   start: new Date('2025-01-01'),
 *   end: new Date('2025-12-31'),
 *   timeScale: 'monthly'
 * });
 * 
 * trends.forEach(point => {
 *   console.log(`${point.label}: R$ ${point.revenue}`);
 * });
 * ```
 */
export function getFinancialTrends(params: {
  sessions: MetricsSession[];
  patients: MetricsPatient[];
  start: Date;
  end: Date;
  timeScale: TimeScale; // FASE C3-R.2: Aceita 'daily' | 'weekly' | 'monthly'
}): FinancialTrendPoint[] {
  const { sessions, patients, start, end, timeScale } = params;

  // FASE C3-R.2: Por enquanto, apenas 'monthly' está implementado
  // TODO: Implementar suporte a 'daily' e 'weekly' em fases futuras
  if (timeScale !== 'monthly') {
    console.warn(`[getFinancialTrends] timeScale '${timeScale}' não implementado ainda. Usando 'monthly' como fallback.`);
  }

  // Usar as funções existentes que já calculam por mês
  const monthlyRevenue = getMonthlyRevenue({ sessions, patients, start, end });
  const growthTrend = getGrowthTrend({ sessions, patients, start, end });
  const missedRateData = getMissedRate({ sessions, start, end });

  // Combinar os dados em FinancialTrendPoint
  return monthlyRevenue.map((monthData, index) => {
    const growth = growthTrend[index]?.crescimento || 0;
    const missed = missedRateData[index]?.taxa || 0;

    // Tentar extrair a data do label (ex: "Jan/25" -> "2025-01-01")
    // Para simplificar, vamos usar o índice para gerar a data
    const monthDate = eachMonthOfInterval({ start, end })[index];
    const isoDate = monthDate ? format(monthDate, 'yyyy-MM-dd') : '';

    return {
      label: monthData.month,
      date: isoDate,
      revenue: monthData.receita,
      sessions: monthData.sessoes,
      missedRate: missed,
      growth: growth
    };
  });
}

/**
 * 🎯 FACHADA PÚBLICA: Sumário de Retenção e Churn
 * 
 * Calcula métricas de retenção de pacientes ao longo de diferentes períodos,
 * bem como o número de novos pacientes e inativos no período selecionado.
 * 
 * @param params Parâmetros com pacientes e período
 * @returns RetentionSummary com métricas de retenção
 * 
 * @example
 * ```ts
 * const retention = getRetentionAndChurn({
 *   patients: metricsPatients,
 *   start: new Date('2025-01-01'),
 *   end: new Date('2025-12-31')
 * });
 * 
 * console.log(`Taxa de retenção 3m: ${retention.retentionRate3m}%`);
 * console.log(`Taxa de churn: ${retention.churnRate}%`);
 * ```
 */
export function getRetentionAndChurn(params: {
  patients: MetricsPatient[];
  start: Date;
  end: Date;
}): RetentionSummary {
  const { patients, start, end } = params;

  // Calcular novos e inativos no período
  const newVsInactiveData = getNewVsInactive({ patients, start, end });
  const totalNew = newVsInactiveData.reduce((sum, d) => sum + d.novos, 0);
  const totalInactive = newVsInactiveData.reduce((sum, d) => sum + d.encerrados, 0);

  // Calcular taxas de retenção
  const retentionRates = getRetentionRate({ patients });
  const retention3m = retentionRates.find(r => r.periodo === '3 meses')?.taxa || 0;
  const retention6m = retentionRates.find(r => r.periodo === '6 meses')?.taxa || 0;
  const retention12m = retentionRates.find(r => r.periodo === '12 meses')?.taxa || 0;

  // Churn é o inverso da retenção (usando a retenção de 3 meses como base)
  const churnRate = 100 - retention3m;

  return {
    newPatients: totalNew,
    inactivePatients: totalInactive,
    retentionRate3m: retention3m,
    retentionRate6m: retention6m,
    retentionRate12m: retention12m,
    churnRate: churnRate
  };
}
