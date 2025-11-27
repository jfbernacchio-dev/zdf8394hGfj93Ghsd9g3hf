import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Users, AlertCircle, Calendar, PieChartIcon, Target, Activity, Percent, CalendarIcon, ChevronLeft, ChevronRight, PlusCircle, Receipt } from 'lucide-react';
import { parseISO, format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths, differenceInMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { RegisterPaymentDialog } from '@/components/RegisterPaymentDialog';
import { useQuery } from '@tanstack/react-query';
import { useEffectivePermissions } from '@/hooks/useEffectivePermissions';
import { useCardPermissions } from '@/hooks/useCardPermissions';

// 🧪 FASE C3.2 - Imports do systemMetricsUtils
import {
  type MetricsPatient,
  type MetricsSession,
  type DateRange,
  getMonthlyRevenue as getMonthlyRevenueNEW,
  getPatientDistribution as getPatientDistributionNEW,
  getMissedRate as getMissedRateNEW,
  getAvgRevenuePerPatient as getAvgRevenuePerPatientNEW,
  calculateTotalRevenue,
  calculateTotalSessions,
  calculateMissedRatePercentage,
  calculateAvgPerSession,
  calculateActivePatients,
  getMissedByPatient as getMissedByPatientNEW,
  getMissedDistribution as getMissedDistributionNEW,
  calculateLostRevenue,
  calculateAvgRevenuePerActivePatient,
  getForecastRevenue as getForecastRevenueNEW,
  calculateOccupationRate as calculateOccupationRateNEW,
  getTicketComparison as getTicketComparisonNEW,
  getGrowthTrend as getGrowthTrendNEW,
  getNewVsInactive as getNewVsInactiveNEW,
  getRetentionRate as getRetentionRateNEW,
  getLostRevenueByMonth as getLostRevenueByMonthNEW,
} from '@/lib/systemMetricsUtils';

const COLORS = ['hsl(100, 20%, 55%)', 'hsl(100, 25%, 65%)', 'hsl(100, 30%, 75%)', 'hsl(100, 15%, 45%)', 'hsl(100, 35%, 85%)', 'hsl(40, 35%, 75%)'];

// 🚩 FEATURE FLAG - Controle de rollback
const USE_NEW_METRICS = import.meta.env.VITE_USE_NEW_METRICS === 'true';

const Financial = () => {
  const { user, isAdmin, roleGlobal, organizationId } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [profile, setProfile] = useState<any>(null);
  const [scheduleBlocks, setScheduleBlocks] = useState<any[]>([]);
  const [period, setPeriod] = useState('year');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // 🔐 PERMISSIONS - usar novo sistema
  const { 
    permissions, 
    loading: permissionsLoading,
    financialAccess 
  } = useEffectivePermissions();
  const { canViewFullFinancial } = useCardPermissions();

  // Derivar flags localmente
  const isAccountant = roleGlobal === 'accountant';
  const isAssistant = roleGlobal === 'assistant';
  const isPsychologist = roleGlobal === 'psychologist';

  // Subordinado = não é admin e não é psicólogo nível 1
  const isSubordinate =
    (isAssistant || isAccountant) ||
    (isPsychologist && permissions?.levelNumber && permissions.levelNumber > 1);

  const isFullTherapist =
    isPsychologist &&
    permissions?.levelNumber &&
    permissions.levelNumber === 1;

  // Validação local de permissão financeira (camada extra de segurança)
  useEffect(() => {
    const validateAccess = async () => {
      if (!user || !isSubordinate) return;

      const { hasFinancialAccess } = await import('@/lib/resolveEffectivePermissions');
      const hasAccess = await hasFinancialAccess(user.id);

      if (!hasAccess) {
        window.location.href = '/dashboard';
      }
    };

    validateAccess();
  }, [user, isSubordinate]);

  useEffect(() => {
    if (user && !permissionsLoading) {
      loadData();
    }
  }, [user, permissionsLoading]);

  const loadData = async () => {
    console.log('[ORG] Financial - organizationId:', organizationId);
    
    // 🏢 FILTRO POR ORGANIZAÇÃO
    if (!organizationId) {
      console.warn('[ORG] Sem organizationId - não carregando dados');
      setPatients([]);
      setSessions([]);
      return;
    }

    const { getUserIdsInOrganization } = await import('@/lib/organizationFilters');
    const orgUserIds = await getUserIdsInOrganization(organizationId);

    if (orgUserIds.length === 0) {
      console.warn('[ORG] Nenhum usuário na organização');
      setPatients([]);
      setSessions([]);
      return;
    }

    // Load profile data
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*, professional_roles(*)') // FASE 1.4: carregar professional role
      .eq('id', user!.id)
      .single();

    setProfile(profileData);

    // Load schedule blocks (apenas do usuário atual)
    const { data: blocksData } = await supabase
      .from('schedule_blocks')
      .select('*')
      .eq('user_id', user!.id);

    setScheduleBlocks(blocksData || []);

    // 🔐 QUERY FILTERING BASEADO EM PERMISSÕES + ORGANIZAÇÃO
    const viewFullFinancial = canViewFullFinancial();

    if (viewFullFinancial) {
      // Admin/Full vê fechamento completo (próprio + subordinados sem acesso financeiro) DA MESMA ORG
      
      // Load subordinates without financial access
      const { getSubordinatesForFinancialClosing } = await import('@/lib/resolveEffectivePermissions');
      const subordinateIds = await getSubordinatesForFinancialClosing(user!.id);

      // Filtrar subordinados pela organização
      const viewableUserIds = [user!.id, ...subordinateIds].filter(id => orgUserIds.includes(id));

      // Load patients desses usuários
      const { data: patientsData } = await supabase
        .from('patients')
        .select('*')
        .in('user_id', viewableUserIds);

      // Load sessions desses pacientes
      let sessionsQuery = supabase
        .from('sessions')
        .select(`
          *,
          patients!inner (
            user_id,
            name
          )
        `)
        .in('patients.user_id', viewableUserIds);

      const { data: sessionsData } = await sessionsQuery;

      setPatients(patientsData || []);
      setSessions(sessionsData || []);
    } else {
      // Subordinado com acesso financeiro limitado - só vê seus próprios dados DA MESMA ORG
      if (!orgUserIds.includes(user!.id)) {
        console.warn('[ORG] Usuário não pertence à organização ativa');
        setPatients([]);
        setSessions([]);
        return;
      }

      const { data: patientsData } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', user!.id);

      const { data: sessionsData } = await supabase
        .from('sessions')
        .select(`
          *,
          patients!inner (
            user_id,
            name
          )
        `)
        .eq('patients.user_id', user!.id);

      setPatients(patientsData || []);
      setSessions(sessionsData || []);
    }
  };

  const getDateRange = () => {
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

  const { start, end } = getDateRange();

  // All sessions in period (for financial metrics)
  const periodSessions = sessions.filter(session => {
    const date = parseISO(session.date);
    return date >= start && date <= end;
  });

  // Only visible sessions (for operational metrics - excludes hidden sessions)
  const visiblePeriodSessions = periodSessions.filter(session => session.show_in_schedule !== false);

  // 🔄 ADAPTADORES DE TIPO - Patient/Session → Metrics*
  const mapPatientsToMetricsPatients = (patientsData: any[]): MetricsPatient[] => {
    return patientsData.map((p) => ({
      id: p.id,
      name: p.name,
      session_value: p.session_value,
      frequency: p.frequency,
      monthly_price: p.monthly_price,
      status: p.status,
      user_id: p.user_id,
      start_date: p.start_date,
      created_at: p.created_at,
      updated_at: p.updated_at,
    }));
  };

  const mapSessionsToMetricsSessions = (sessionsData: any[]): MetricsSession[] => {
    return sessionsData.map((s) => ({
      id: s.id,
      patient_id: s.patient_id,
      date: s.date,
      status: s.status === 'scheduled' ? 'rescheduled' : s.status as 'attended' | 'missed' | 'rescheduled' | 'cancelled',
      value: s.value,
      show_in_schedule: s.show_in_schedule,
      patients: s.patients,
    }));
  };

  // Receita por mês - VERSÃO ANTIGA
  const getMonthlyRevenueOLD = () => {
    const months = eachMonthOfInterval({ start, end });
    
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthSessions = periodSessions.filter(s => {
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

  // Distribuição por paciente - VERSÃO ANTIGA
  const getPatientDistributionOLD = () => {
    const patientRevenue = new Map<string, number>();
    const monthlyPatients = new Map<string, Set<string>>();
    
    periodSessions.forEach(session => {
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

  // Taxa de faltas por mês (only visible sessions) - VERSÃO ANTIGA
  const getMissedRateOLD = () => {
    const months = eachMonthOfInterval({ start, end });
    
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthSessions = visiblePeriodSessions.filter(s => {
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

  // Faturamento médio por paciente - VERSÃO ANTIGA
  const getAvgRevenuePerPatientOLD = () => {
    const patientRevenue = new Map<string, { revenue: number; sessions: number; monthly: boolean }>();
    const monthlyPatients = new Map<string, Set<string>>();
    
    periodSessions.forEach(session => {
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

  // Calculate total revenue considering monthly patients - VERSÃO ANTIGA
  const calculateTotalRevenueOLD = (): number => {
    const monthlyPatientsTracked = new Map<string, Set<string>>();
    return periodSessions
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

  const calculateTotalSessionsOLD = (): number => {
    return periodSessions.filter(s => s.status === 'attended').length;
  };

  const calculateMissedRateOLD = (): string | number => {
    const missedSessions = visiblePeriodSessions.filter(s => s.status === 'missed').length;
    return visiblePeriodSessions.length > 0 
      ? ((missedSessions / visiblePeriodSessions.length) * 100).toFixed(1) 
      : 0;
  };

  const calculateAvgPerSessionOLD = (totalRev: number, totalSess: number): number => {
    return totalSess > 0 ? totalRev / totalSess : 0;
  };

  const calculateActivePatientsOLD = (): number => {
    return patients.filter(p => p.status === 'active').length;
  };

  // Faltas por paciente (only visible sessions) - VERSÃO ANTIGA
  const getMissedByPatientOLD = () => {
    const patientMissed = new Map<string, number>();
    
    visiblePeriodSessions.forEach(session => {
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

  // Distribuição de faltas por paciente (only visible sessions) - VERSÃO ANTIGA
  const getMissedDistributionOLD = () => {
    const patientMissed = new Map<string, number>();
    
    visiblePeriodSessions.forEach(session => {
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

  // Valor perdido por faltas (only visible sessions) - VERSÃO ANTIGA
  const calculateLostRevenueOLD = (): number => {
    return visiblePeriodSessions
      .filter(s => s.status === 'missed')
      .reduce((sum, s) => sum + Number(s.value), 0);
  };

  // Previsão de receita mensal - VERSÃO ANTIGA
  const getForecastRevenueOLD = () => {
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

  // Taxa de ocupação da agenda baseada nos horários de trabalho configurados - VERSÃO ANTIGA
  // NOTA: Sessões fora do horário de trabalho são contabilizadas mas não aumentam o total de slots disponíveis,
  // permitindo que a taxa de ocupação ultrapasse 100%
  const calculateOccupationRateOLD = () => {
    if (!profile) return 0;
    
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
    const usedSlots = visiblePeriodSessions.filter(s => s.status === 'attended').length;
    
    // Available slots minus blocked slots (denominador fixo baseado no horário de trabalho)
    const effectiveAvailableSlots = Math.max(totalAvailableSlots - blockedSlots, 0);
    
    // Pode ultrapassar 100% se houver sessões fora do horário de trabalho
    return effectiveAvailableSlots > 0 ? (usedSlots / effectiveAvailableSlots) * 100 : 0;
  };

  // Ticket médio mensal vs semanal - VERSÃO ANTIGA
  const getTicketComparisonOLD = () => {
    const monthlyPatientRevenue = new Map<string, number>();
    const weeklyPatientRevenue = new Map<string, number>();
    const monthlyPatientsSet = new Map<string, Set<string>>();

    periodSessions.forEach(session => {
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

  // Tendência de crescimento mês a mês - VERSÃO ANTIGA
  const getGrowthTrendOLD = () => {
    const months = eachMonthOfInterval({ start, end });
    
    return months.map((month, index) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthSessions = periodSessions.filter(s => {
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
        
        const prevMonthSessions = periodSessions.filter(s => {
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

  // Pacientes novos vs encerrados - VERSÃO ANTIGA
  const getNewVsInactiveOLD = () => {
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

  // Taxa de retenção - VERSÃO ANTIGA
  const getRetentionRateOLD = () => {
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

  // Valor perdido por faltas por mês (only visible sessions) - VERSÃO ANTIGA
  const getLostRevenueByMonthOLD = () => {
    const months = eachMonthOfInterval({ start, end });
    
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const missedInMonth = visiblePeriodSessions.filter(s => {
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

  const monthlyData = useMemo(() => {
    if (!sessions.length || !patients.length) return [];
    
    if (USE_NEW_METRICS) {
      const metricsSessions = mapSessionsToMetricsSessions(periodSessions);
      const metricsPatients = mapPatientsToMetricsPatients(patients);
      return getMonthlyRevenueNEW({
        sessions: metricsSessions,
        patients: metricsPatients,
        start,
        end,
      });
    }
    
    return getMonthlyRevenueOLD();
  }, [sessions, patients, periodSessions, start, end]);

  const patientDistribution = useMemo(() => {
    if (!sessions.length || !patients.length) return [];
    
    if (USE_NEW_METRICS) {
      const metricsSessions = mapSessionsToMetricsSessions(periodSessions);
      const metricsPatients = mapPatientsToMetricsPatients(patients);
      return getPatientDistributionNEW({
        sessions: metricsSessions,
        patients: metricsPatients,
      });
    }
    
    return getPatientDistributionOLD();
  }, [sessions, patients, periodSessions]);

  const missedRateData = useMemo(() => {
    if (!sessions.length || !patients.length) return [];
    
    if (USE_NEW_METRICS) {
      const metricsSessions = mapSessionsToMetricsSessions(visiblePeriodSessions);
      return getMissedRateNEW({
        sessions: metricsSessions,
        start,
        end,
      });
    }
    
    return getMissedRateOLD();
  }, [sessions, visiblePeriodSessions, start, end]);

  const avgRevenueData = useMemo(() => {
    if (!sessions.length || !patients.length) return [];
    
    if (USE_NEW_METRICS) {
      const metricsSessions = mapSessionsToMetricsSessions(periodSessions);
      const metricsPatients = mapPatientsToMetricsPatients(patients);
      return getAvgRevenuePerPatientNEW({
        sessions: metricsSessions,
        patients: metricsPatients,
      });
    }
    
    return getAvgRevenuePerPatientOLD();
  }, [sessions, patients, periodSessions]);

  const totalRevenue = useMemo(() => {
    if (!sessions.length || !patients.length) return 0;
    
    if (USE_NEW_METRICS) {
      const metricsSessions = mapSessionsToMetricsSessions(periodSessions);
      const metricsPatients = mapPatientsToMetricsPatients(patients);
      return calculateTotalRevenue({
        sessions: metricsSessions,
        patients: metricsPatients,
      });
    }
    
    return calculateTotalRevenueOLD();
  }, [sessions, patients, periodSessions]);

  const totalSessions = useMemo(() => {
    if (!sessions.length) return 0;
    
    if (USE_NEW_METRICS) {
      const metricsSessions = mapSessionsToMetricsSessions(periodSessions);
      return calculateTotalSessions({
        sessions: metricsSessions,
      });
    }
    
    return calculateTotalSessionsOLD();
  }, [sessions, periodSessions]);

  const missedRate = useMemo(() => {
    if (!sessions.length) return 0;
    
    if (USE_NEW_METRICS) {
      const metricsSessions = mapSessionsToMetricsSessions(visiblePeriodSessions);
      return calculateMissedRatePercentage({
        sessions: metricsSessions,
      });
    }
    
    return calculateMissedRateOLD();
  }, [sessions, visiblePeriodSessions]);

  const avgPerSession = useMemo(() => {
    if (!totalRevenue || !totalSessions) return 0;
    
    if (USE_NEW_METRICS) {
      return calculateAvgPerSession({
        totalRevenue,
        totalSessions,
      });
    }
    
    return calculateAvgPerSessionOLD(totalRevenue, totalSessions);
  }, [totalRevenue, totalSessions]);

  const activePatients = useMemo(() => {
    if (!patients.length) return 0;
    
    if (USE_NEW_METRICS) {
      const metricsPatients = mapPatientsToMetricsPatients(patients);
      return calculateActivePatients({
        patients: metricsPatients,
      });
    }
    
    return calculateActivePatientsOLD();
  }, [patients]);

  const missedByPatient = useMemo(() => {
    if (!sessions.length) return [];
    
    if (USE_NEW_METRICS) {
      const metricsSessions = mapSessionsToMetricsSessions(visiblePeriodSessions);
      return getMissedByPatientNEW({
        sessions: metricsSessions,
      });
    }
    
    return getMissedByPatientOLD();
  }, [sessions, visiblePeriodSessions]);

  const missedDistribution = useMemo(() => {
    if (!sessions.length) return [];
    
    if (USE_NEW_METRICS) {
      const metricsSessions = mapSessionsToMetricsSessions(visiblePeriodSessions);
      return getMissedDistributionNEW({
        sessions: metricsSessions,
      });
    }
    
    return getMissedDistributionOLD();
  }, [sessions, visiblePeriodSessions]);

  const totalMissed = missedDistribution.reduce((sum, p) => sum + p.value, 0);

  const lostRevenue = useMemo(() => {
    if (!sessions.length) return 0;
    
    if (USE_NEW_METRICS) {
      const metricsSessions = mapSessionsToMetricsSessions(visiblePeriodSessions);
      return calculateLostRevenue({
        sessions: metricsSessions,
      });
    }
    
    return calculateLostRevenueOLD();
  }, [sessions, visiblePeriodSessions]);

  const avgRevenuePerActivePatient = useMemo(() => {
    if (!totalRevenue || !activePatients) return 0;
    
    if (USE_NEW_METRICS) {
      return calculateAvgRevenuePerActivePatient({
        totalRevenue,
        activePatients,
      });
    }
    
    return activePatients > 0 ? totalRevenue / activePatients : 0;
  }, [totalRevenue, activePatients]);

  const forecastRevenue = useMemo(() => {
    if (!patients.length) return 0;
    
    if (USE_NEW_METRICS) {
      const metricsPatients = mapPatientsToMetricsPatients(patients);
      return getForecastRevenueNEW({
        patients: metricsPatients,
      });
    }
    
    return getForecastRevenueOLD();
  }, [patients]);

  const occupationRate = useMemo(() => {
    if (!sessions.length || !profile) return 0;
    
    if (USE_NEW_METRICS) {
      const metricsSessions = mapSessionsToMetricsSessions(visiblePeriodSessions);
      return calculateOccupationRateNEW({
        sessions: metricsSessions,
        profile,
        scheduleBlocks,
        start,
        end,
      });
    }
    
    return calculateOccupationRateOLD();
  }, [sessions, visiblePeriodSessions, profile, scheduleBlocks, start, end]);

  const ticketComparison = useMemo(() => {
    if (!sessions.length || !patients.length) return [];
    
    if (USE_NEW_METRICS) {
      const metricsSessions = mapSessionsToMetricsSessions(periodSessions);
      const metricsPatients = mapPatientsToMetricsPatients(patients);
      return getTicketComparisonNEW({
        sessions: metricsSessions,
        patients: metricsPatients,
      });
    }
    
    return getTicketComparisonOLD();
  }, [sessions, patients, periodSessions]);

  const growthTrend = useMemo(() => {
    if (!sessions.length || !patients.length) return [];
    
    if (USE_NEW_METRICS) {
      const metricsSessions = mapSessionsToMetricsSessions(periodSessions);
      const metricsPatients = mapPatientsToMetricsPatients(patients);
      return getGrowthTrendNEW({
        sessions: metricsSessions,
        patients: metricsPatients,
        start,
        end,
      });
    }
    
    return getGrowthTrendOLD();
  }, [sessions, patients, periodSessions, start, end]);

  const newVsInactive = useMemo(() => {
    if (!patients.length) return [];
    
    if (USE_NEW_METRICS) {
      const metricsPatients = mapPatientsToMetricsPatients(patients);
      return getNewVsInactiveNEW({
        patients: metricsPatients,
        start,
        end,
      });
    }
    
    return getNewVsInactiveOLD();
  }, [patients, start, end]);

  const retentionRate = useMemo(() => {
    if (!patients.length) return [];
    
    if (USE_NEW_METRICS) {
      const metricsPatients = mapPatientsToMetricsPatients(patients);
      return getRetentionRateNEW({
        patients: metricsPatients,
      });
    }
    
    return getRetentionRateOLD();
  }, [patients]);

  const lostRevenueByMonth = useMemo(() => {
    if (!sessions.length) return [];
    
    if (USE_NEW_METRICS) {
      const metricsSessions = mapSessionsToMetricsSessions(visiblePeriodSessions);
      return getLostRevenueByMonthNEW({
        sessions: metricsSessions,
        start,
        end,
      });
    }
    
    return getLostRevenueByMonthOLD();
  }, [sessions, visiblePeriodSessions, start, end]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Análise Financeira</h1>
        <p className="text-muted-foreground">Métricas, insights e controle completo das finanças</p>
      </div>

      <Card className="p-6 mb-6 shadow-[var(--shadow-card)] border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Período</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="3months">Últimos 3 Meses</SelectItem>
                <SelectItem value="6months">Últimos 6 Meses</SelectItem>
                <SelectItem value="year">Este Ano</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>

              {period === 'custom' && (
                <>
                  <div className="space-y-2">
                    <Label>Data Inicial</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !customStartDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customStartDate ? format(new Date(customStartDate + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : <span>Selecione</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={customStartDate ? new Date(customStartDate + 'T00:00:00') : undefined}
                          onSelect={(date) => {
                            if (date) setCustomStartDate(format(date, 'yyyy-MM-dd'));
                          }}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="space-y-2">
                    <Label>Data Final</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !customEndDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {customEndDate ? format(new Date(customEndDate + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : <span>Selecione</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <CalendarComponent
                          mode="single"
                          selected={customEndDate ? new Date(customEndDate + 'T00:00:00') : undefined}
                          onSelect={(date) => {
                            if (date) setCustomEndDate(format(date, 'yyyy-MM-dd'));
                          }}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </>
              )}
        </div>
      </Card>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 shadow-[var(--shadow-card)] border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[hsl(var(--success))]" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-1">
            {formatBrazilianCurrency(totalRevenue)}
          </h3>
          <p className="text-sm text-muted-foreground">Receita Total</p>
        </Card>

        <Card className="p-6 shadow-[var(--shadow-card)] border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-1">
            {formatBrazilianCurrency(avgPerSession)}
          </h3>
          <p className="text-sm text-muted-foreground">Média por Sessão</p>
        </Card>

        <Card className="p-6 shadow-[var(--shadow-card)] border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-1">
            {missedRate}%
          </h3>
          <p className="text-sm text-muted-foreground">Taxa de Faltas</p>
        </Card>

        <Card className="p-6 shadow-[var(--shadow-card)] border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-accent" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-1">
            {activePatients}
          </h3>
          <p className="text-sm text-muted-foreground">Pacientes Ativos</p>
        </Card>
      </div>

      {/* Métricas secundárias */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 shadow-[var(--shadow-card)] border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Target className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-1">
            {formatBrazilianCurrency(forecastRevenue)}
          </h3>
          <p className="text-sm text-muted-foreground">Previsão Mensal</p>
        </Card>

        <Card className="p-6 shadow-[var(--shadow-card)] border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Activity className="w-6 h-6 text-accent" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-1">
            {formatBrazilianCurrency(avgRevenuePerActivePatient)}
          </h3>
          <p className="text-sm text-muted-foreground">Média por Paciente Ativo</p>
        </Card>

        <Card className="p-6 shadow-[var(--shadow-card)] border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-1">
            {formatBrazilianCurrency(lostRevenue)}
            <span className="text-sm font-normal text-muted-foreground ml-2">
              ({totalRevenue > 0 ? ((lostRevenue / totalRevenue) * 100).toFixed(1) : '0.0'}%)
            </span>
          </h3>
          <p className="text-sm text-muted-foreground">Perdido com Faltas</p>
        </Card>

        <Card className="p-6 shadow-[var(--shadow-card)] border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <Percent className="w-6 h-6 text-[hsl(var(--success))]" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-1">
            {occupationRate.toFixed(1)}%
          </h3>
          <p className="text-sm text-muted-foreground">Taxa de Ocupação</p>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
          <TabsTrigger value="performance">Desempenho</TabsTrigger>
          <TabsTrigger value="retention">Retenção</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Evolução da Receita Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: any) => formatBrazilianCurrency(value)}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="receita" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Receita"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Sessões Realizadas vs Esperadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="esperadas" fill="hsl(var(--muted))" name="Esperadas" />
                  <Bar dataKey="sessoes" fill="hsl(var(--primary))" name="Realizadas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Tendência de Crescimento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-muted-foreground">
                Variação percentual da receita mês a mês
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={growthTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'crescimento') return `${value}%`;
                      return formatBrazilianCurrency(value);
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="crescimento" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Crescimento (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Faturamento por Paciente (Top 10)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-muted-foreground">
                Comparativo de faturamento total e valor médio por sessão
              </div>
              <ResponsiveContainer width="100%" height={Math.max(400, avgRevenueData.length * 60)}>
                <BarChart data={avgRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                    tick={({ x, y, payload }) => {
                      const words = payload.value.split(' ');
                      const displayText = words.length > 2 ? `${words[0]} ${words[1]}` : payload.value;
                      return (
                        <text x={x} y={y} textAnchor="end" transform={`rotate(-45 ${x} ${y})`} fill="hsl(var(--muted-foreground))">
                          {displayText}
                        </text>
                      );
                    }}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: any) => formatBrazilianCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="faturamento" fill="hsl(var(--primary))" name="Faturamento Total" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="media" fill="hsl(var(--accent))" name="Média por Sessão" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5" />
                Previsão vs Realizado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-muted-foreground">
                Comparação entre receita prevista (baseada em pacientes ativos) e receita real por mês
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyData.map((m, i) => ({ ...m, previsao: forecastRevenue }))}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: any) => formatBrazilianCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="previsao" fill="hsl(var(--muted))" name="Previsão Mensal" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="receita" fill="hsl(var(--primary))" name="Realizado" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                Distribuição de Receita por Paciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={500}>
                <PieChart>
                  <Pie
                    data={patientDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {patientDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: any) => formatBrazilianCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Ticket Médio: Mensais vs Semanais
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-muted-foreground">
                Comparação do faturamento médio entre pacientes mensais e semanais
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={ticketComparison}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="tipo" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: any) => formatBrazilianCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="ticket" fill="hsl(var(--primary))" name="Ticket Médio" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-4">
                {ticketComparison.map(item => (
                  <div key={item.tipo} className="p-4 bg-muted/30 rounded-lg">
                    <p className="text-sm text-muted-foreground">{item.tipo}</p>
                    <p className="text-lg font-bold text-foreground">{formatBrazilianCurrency(item.ticket)}</p>
                    <p className="text-xs text-muted-foreground">{item.quantidade} pacientes</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Taxa de Faltas por Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={missedRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'taxa') return `${value}%`;
                      return value;
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="taxa" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    name="Taxa (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Pacientes Encerrados por Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-muted-foreground">
                Número de pacientes que tiveram suas fichas encerradas
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="encerrados" fill="hsl(var(--destructive))" name="Pacientes Encerrados" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Faltas por Paciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-muted-foreground">
                Número de faltas de cada paciente no período
              </div>
              <ResponsiveContainer width="100%" height={Math.max(400, missedByPatient.length * 50)}>
                <BarChart data={missedByPatient} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <YAxis 
                    dataKey="name" 
                    type="category"
                    stroke="hsl(var(--muted-foreground))"
                    width={150}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="faltas" fill="hsl(var(--destructive))" name="Faltas" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5" />
                Valor Perdido por Faltas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-muted-foreground">
                Receita não realizada devido a faltas por mês
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={lostRevenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: any) => formatBrazilianCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="perdido" fill="hsl(var(--destructive))" name="Valor Perdido" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="retention" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Taxa de Retenção de Pacientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-muted-foreground">
                Percentual de pacientes que continuam ativos após determinados períodos
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={retentionRate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="periodo" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: any) => `${value}%`}
                  />
                  <Legend />
                  <Bar dataKey="taxa" fill="hsl(var(--success))" name="Taxa de Retenção (%)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-3 gap-4">
                {retentionRate.map(item => (
                  <div key={item.periodo} className="p-4 bg-muted/30 rounded-lg text-center">
                    <p className="text-sm text-muted-foreground">{item.periodo}</p>
                    <p className="text-2xl font-bold text-foreground">{item.taxa}%</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Pacientes Novos vs Encerrados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-muted-foreground">
                Comparativo mensal entre novos cadastros e fichas encerradas
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={newVsInactive}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="novos" fill="hsl(var(--success))" name="Novos Pacientes" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="encerrados" fill="hsl(var(--destructive))" name="Pacientes Encerrados" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Financial;