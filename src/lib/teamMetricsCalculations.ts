/**
 * 📊 TEAM METRICS CALCULATIONS
 * 
 * Funções de cálculo específicas para métricas de equipe
 * Complementa systemMetricsUtils.ts com cálculos agregados de múltiplos terapeutas
 */

import type { MetricsSession, MetricsPatient, MetricsScheduleBlock, MetricsProfile, FinancialSummary } from '@/lib/systemMetricsUtils';
import type { TeamMetricsSummary } from '@/types/teamMetricsTypes';
import { getFinancialSummary } from '@/lib/systemMetricsUtils';
import { isWithinInterval, parseISO, getDay, setHours, setMinutes, differenceInMinutes } from 'date-fns';

/**
 * Calcula o resumo expandido de métricas de equipe
 * Inclui todas as métricas básicas + métricas específicas de equipe
 */
export function getTeamMetricsSummary(params: {
  sessions: MetricsSession[];
  patients: MetricsPatient[];
  scheduleBlocks: MetricsScheduleBlock[];
  profiles: Record<string, MetricsProfile>;
  start: Date;
  end: Date;
}): TeamMetricsSummary {
  const { sessions, patients, scheduleBlocks, profiles, start, end } = params;

  // 1. Obter resumo financeiro básico
  const baseSummary = getFinancialSummary({ sessions, patients, start, end });

  // 2. Contar sessões attended e missed manualmente
  const attendedSessions = sessions.filter(s => {
    const sessionDate = parseISO(s.date);
    return s.status === 'attended' && isWithinInterval(sessionDate, { start, end });
  }).length;

  const missedSessions = sessions.filter(s => {
    const sessionDate = parseISO(s.date);
    return s.status === 'missed' && isWithinInterval(sessionDate, { start, end });
  }).length;

  // 3. Calcular faturamento por terapeuta
  const revenueByTherapist = calculateRevenueByTherapist(sessions, patients, start, end);
  const therapistsWithSessions = Object.keys(revenueByTherapist).length;
  const totalTeamRevenue = Object.values(revenueByTherapist).reduce((sum, rev) => sum + rev, 0);
  const averageRevenuePerTherapist = therapistsWithSessions > 0 
    ? totalTeamRevenue / therapistsWithSessions 
    : 0;

  // 4. Calcular taxa de comparecimento
  const totalCommittedSessions = attendedSessions + missedSessions;
  const attendanceRate = totalCommittedSessions > 0 
    ? (attendedSessions / totalCommittedSessions) * 100 
    : 0;

  // 5. Calcular ocupação média
  const { totalAvailableSlots, totalAttendedSlots } = calculateTeamOccupation(
    sessions,
    patients,
    scheduleBlocks,
    profiles,
    start,
    end
  );
  const averageOccupationRate = totalAvailableSlots > 0 
    ? (totalAttendedSlots / totalAvailableSlots) * 100 
    : 0;

  // 6. Calcular ticket médio
  const averageTicket = attendedSessions > 0 
    ? totalTeamRevenue / attendedSessions 
    : 0;

  return {
    ...baseSummary,
    attendedSessions,
    missedSessions,
    averageRevenuePerTherapist,
    therapistsWithSessions,
    attendanceRate,
    totalCommittedSessions,
    averageOccupationRate,
    totalAvailableSlots,
    totalAttendedSlots,
    averageTicket,
  };
}

/**
 * Calcula receita total por terapeuta no período
 * Retorna objeto: { therapistId: totalRevenue }
 */
function calculateRevenueByTherapist(
  sessions: MetricsSession[],
  patients: MetricsPatient[],
  start: Date,
  end: Date
): Record<string, number> {
  const patientToTherapist = new Map<string, string>();
  patients.forEach(p => patientToTherapist.set(p.id, p.user_id));

  const revenueByTherapist: Record<string, number> = {};

  sessions.forEach(session => {
    // Apenas sessões realizadas
    if (session.status !== 'attended') return;

    const sessionDate = parseISO(session.date);
    if (!isWithinInterval(sessionDate, { start, end })) return;

    const therapistId = patientToTherapist.get(session.patient_id);
    if (!therapistId) return;

    if (!revenueByTherapist[therapistId]) {
      revenueByTherapist[therapistId] = 0;
    }
    const sessionValue = typeof session.value === 'string' ? parseFloat(session.value) : (session.value || 0);
    revenueByTherapist[therapistId] += sessionValue;
  });

  return revenueByTherapist;
}

/**
 * Calcula ocupação total da equipe (slots disponíveis vs slots ocupados)
 */
function calculateTeamOccupation(
  sessions: MetricsSession[],
  patients: MetricsPatient[],
  scheduleBlocks: MetricsScheduleBlock[],
  profiles: Record<string, MetricsProfile>,
  start: Date,
  end: Date
): { totalAvailableSlots: number; totalAttendedSlots: number } {
  // Mapear paciente -> terapeuta
  const patientToTherapist = new Map<string, string>();
  patients.forEach(p => patientToTherapist.set(p.id, p.user_id));

  // 1. Calcular slots disponíveis por terapeuta
  const therapistIds = Object.keys(profiles);
  let totalAvailableSlots = 0;

  therapistIds.forEach(therapistId => {
    const profile = profiles[therapistId];
    if (!profile) return;

    const therapistBlocks = scheduleBlocks.filter(b => b.user_id === therapistId);
    const availableSlots = calculateAvailableSlotsForTherapist(
      profile,
      therapistBlocks,
      start,
      end
    );
    totalAvailableSlots += availableSlots;
  });

  // 2. Calcular slots ocupados (sessões realizadas)
  let totalAttendedSlots = 0;
  
  sessions.forEach(session => {
    if (session.status !== 'attended') return;

    const sessionDate = parseISO(session.date);
    if (!isWithinInterval(sessionDate, { start, end })) return;

    const therapistId = patientToTherapist.get(session.patient_id);
    if (!therapistId) return;

    const profile = profiles[therapistId];
    if (!profile) return;

    // Cada sessão realizada ocupa 1 slot
    totalAttendedSlots += 1;
  });

  return { totalAvailableSlots, totalAttendedSlots };
}

/**
 * Calcula slots disponíveis para um terapeuta individual
 * (Simplificado: conta dias úteis * slots por dia)
 */
function calculateAvailableSlotsForTherapist(
  profile: MetricsProfile,
  scheduleBlocks: MetricsScheduleBlock[],
  start: Date,
  end: Date
): number {
  const workDays = profile.work_days || [1, 2, 3, 4, 5];
  const slotDuration = profile.slot_duration || 50;
  const breakTime = profile.break_time || 10;
  const workStart = profile.work_start_time || '08:00';
  const workEnd = profile.work_end_time || '18:00';

  // Calcular minutos de trabalho por dia
  const [startHour, startMin] = workStart.split(':').map(Number);
  const [endHour, endMin] = workEnd.split(':').map(Number);
  
  const dayStart = setMinutes(setHours(new Date(), startHour), startMin);
  const dayEnd = setMinutes(setHours(new Date(), endHour), endMin);
  const workMinutesPerDay = differenceInMinutes(dayEnd, dayStart);
  
  // Slots por dia = workMinutes / (slotDuration + breakTime)
  const slotsPerDay = Math.floor(workMinutesPerDay / (slotDuration + breakTime));

  // Contar dias úteis no período
  let workingDays = 0;
  let current = new Date(start);
  
  while (current <= end) {
    const dayOfWeek = getDay(current);
    if (workDays.includes(dayOfWeek)) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  // Total de slots disponíveis
  let totalSlots = workingDays * slotsPerDay;

  // Subtrair bloqueios de agenda
  scheduleBlocks.forEach(block => {
    const blockStart = block.start_date ? parseISO(block.start_date) : start;
    const blockEnd = block.end_date ? parseISO(block.end_date) : end;

    // Verificar se bloco está no período
    if (blockStart > end || blockEnd < start) return;

    // Calcular duração do bloqueio em minutos
    const [bStartHour, bStartMin] = block.start_time.split(':').map(Number);
    const [bEndHour, bEndMin] = block.end_time.split(':').map(Number);
    
    const bStart = setMinutes(setHours(new Date(), bStartHour), bStartMin);
    const bEnd = setMinutes(setHours(new Date(), bEndHour), bEndMin);
    const blockMinutes = differenceInMinutes(bEnd, bStart);
    
    // Slots bloqueados
    const blockedSlots = Math.floor(blockMinutes / (slotDuration + breakTime));
    totalSlots -= blockedSlots;
  });

  return Math.max(0, totalSlots);
}
