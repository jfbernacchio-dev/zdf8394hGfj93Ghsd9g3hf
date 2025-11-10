import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Users, Calendar, DollarSign, TrendingUp, AlertCircle, CheckCircle2, CalendarIcon, Settings, Save, RotateCcw, Plus, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { parseISO, format, eachMonthOfInterval, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NotificationPrompt } from '@/components/NotificationPrompt';
import { ComplianceReminder } from '@/components/ComplianceReminder';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';
import { ResizableCard } from '@/components/ResizableCard';
import { ResizableSection } from '@/components/ResizableSection';
import { DEFAULT_DASHBOARD_LAYOUT } from '@/lib/defaultLayoutDashboard';
import { toast } from 'sonner';
import { AddCardDialog } from '@/components/AddCardDialog';
import { CardConfig, AVAILABLE_DASHBOARD_CHARTS } from '@/types/cardTypes';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useChartTimeScale, generateTimeIntervals, formatTimeLabel, getIntervalBounds, getScaleLabel, TimeScale } from '@/hooks/useChartTimeScale';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { useLayoutSync } from '@/hooks/useLayoutSync';
import { resetLayoutToDefault, getActiveProfileId, getProfiles, LayoutProfile } from '@/lib/layoutSync';
import { RequireActiveProfileDialog } from '@/components/RequireActiveProfileDialog';
import { SaveLayoutDialog } from '@/components/SaveLayoutDialog';

const DashboardTest = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [period, setPeriod] = useState('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'expected' | 'actual' | 'unpaid' | null>(null);

  // Edit mode state (declared before useLayoutSync)
  const [isEditMode, setIsEditMode] = useState(false);
  const [tempCardSizes, setTempCardSizes] = useState<Record<string, { width: number; height: number; x: number; y: number }>>({});
  const [tempSectionHeights, setTempSectionHeights] = useState<Record<string, number>>({});

  // Layout sync
  const { layout, saveUserLayout, isLoading: isLayoutLoading, isSyncing } = useLayoutSync('dashboard', DEFAULT_DASHBOARD_LAYOUT, isEditMode);
  const [visibleCards, setVisibleCards] = useState<string[]>(DEFAULT_DASHBOARD_LAYOUT.visibleCards);

  // Active profile state
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [activeProfileName, setActiveProfileName] = useState<string>('');
  const [showProfileRequiredDialog, setShowProfileRequiredDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pendingSave, setPendingSave] = useState<any>(null);
  
  // Add card dialog state
  const [isAddCardDialogOpen, setIsAddCardDialogOpen] = useState(false);
  const [isAddChartDialogOpen, setIsAddChartDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  // Update visible cards when layout changes
  useEffect(() => {
    if (!isLayoutLoading) {
      setVisibleCards(layout.visibleCards);
    }
  }, [layout, isLayoutLoading]);

  // Load active profile
  useEffect(() => {
    if (user) {
      getActiveProfileId(user.id).then(async (profileId) => {
        setActiveProfileId(profileId);
        if (profileId) {
          const profiles = await getProfiles(user.id);
          const active = profiles.find((p: LayoutProfile) => p.id === profileId);
          if (active) {
            setActiveProfileName(active.profile_name);
          }
        }
      });
    }
  }, [user]);

  const loadData = async () => {
    const { data: patientsData } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', user!.id);

    const { data: sessionsData } = await supabase
      .from('sessions')
      .select(`
        *,
        patients!inner (
          user_id
        )
      `)
      .eq('patients.user_id', user!.id);

    setPatients(patientsData || []);
    setSessions(sessionsData || []);
  };

  const getDateRange = () => {
    const now = new Date();
    let start: Date, end: Date;

    if (period === 'custom') {
      start = new Date(customStartDate);
      end = new Date(customEndDate);
    } else if (period === 'week') {
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      end = now;
    } else if (period === 'thisWeek') {
      // Esta Semana (domingo a sábado)
      const dayOfWeek = now.getDay();
      start = new Date(now);
      start.setDate(now.getDate() - dayOfWeek);
      start.setHours(0, 0, 0, 0);
      end = now;
    } else if (period === 'lastMonth') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (period === 'last2Months') {
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      end = now;
    } else if (period === 'q1') {
      // Q1: Janeiro a Março
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear(), 2, 31);
    } else if (period === 'q2') {
      // Q2: Abril a Junho
      start = new Date(now.getFullYear(), 3, 1);
      end = new Date(now.getFullYear(), 5, 30);
    } else if (period === 'q3') {
      // Q3: Julho a Setembro
      start = new Date(now.getFullYear(), 6, 1);
      end = new Date(now.getFullYear(), 8, 30);
    } else if (period === 'q4') {
      // Q4: Outubro a Dezembro
      start = new Date(now.getFullYear(), 9, 1);
      end = new Date(now.getFullYear(), 11, 31);
    } else if (period === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = now;
    } else if (period === 'all' || period === 'allTime') {
      // Todo período: desde a primeira sessão até hoje
      start = new Date('2020-01-01'); // Data bem antiga para pegar todo histórico
      end = now;
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return { start, end };
  };

  const { start, end } = getDateRange();
  
  // Time scale management
  const { 
    automaticScale, 
    getScale, 
    setScaleOverride, 
    clearOverride, 
    hasOverride 
  } = useChartTimeScale({ startDate: start, endDate: end });
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const periodSessions = sessions.filter(session => {
    const date = parseISO(session.date);
    return date >= start && date <= end;
  });

  const visiblePeriodSessions = periodSessions.filter(session => session.show_in_schedule !== false);
  const attendedSessions = periodSessions.filter(s => s.status === 'attended');
  const expectedSessions = visiblePeriodSessions.length;
  const missedSessions = visiblePeriodSessions.filter(s => s.status === 'missed');
  const pendingSessions = visiblePeriodSessions.filter(s => {
    const sessionDate = parseISO(s.date);
    return sessionDate > now && s.status !== 'attended' && s.status !== 'missed';
  });
  
  const missedPercent = expectedSessions > 0 ? ((missedSessions.length / expectedSessions) * 100).toFixed(0) : 0;
  const pendingPercent = expectedSessions > 0 ? ((pendingSessions.length / expectedSessions) * 100).toFixed(0) : 0;
  
  const totalExpected = patients
    .filter(p => p.status === 'active')
    .reduce((sum, patient) => {
      const patientStart = new Date(patient.start_date);
      const periodStart = patientStart > start ? patientStart : start;
      
      if (periodStart > end) return sum;
      
      if (patient.monthly_price) {
        const months = eachMonthOfInterval({ start: periodStart, end });
        return sum + (months.length * Number(patient.session_value || 0));
      } else {
        const weeks = Math.floor((end.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24 * 7));
        const multiplier = patient.frequency === 'weekly' ? 1 : 0.5;
        const sessions = Math.max(1, Math.ceil(weeks * multiplier));
        return sum + (sessions * Number(patient.session_value || 0));
      }
    }, 0);
  
  const monthlyPatientsTracked = new Map<string, Set<string>>();
  const totalActual = attendedSessions.reduce((sum, s) => {
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
  const revenuePercent = totalExpected > 0 ? ((totalActual / totalExpected) * 100).toFixed(0) : 0;
  
  const allAttendedSessions = sessions.filter(s => s.status === 'attended');
  const unpaidSessions = allAttendedSessions.filter(s => !s.paid);
  
  const unpaidMonthlyTracked = new Map<string, Set<string>>();
  const unpaidValue = unpaidSessions.reduce((sum, s) => {
    const patient = patients.find(p => p.id === s.patient_id);
    if (patient?.monthly_price) {
      const monthKey = format(parseISO(s.date), 'yyyy-MM');
      if (!unpaidMonthlyTracked.has(s.patient_id)) {
        unpaidMonthlyTracked.set(s.patient_id, new Set());
      }
      const months = unpaidMonthlyTracked.get(s.patient_id)!;
      if (!months.has(monthKey)) {
        months.add(monthKey);
        return sum + Number(s.value);
      }
      return sum;
    }
    return sum + Number(s.value);
  }, 0);

  const openDialog = (type: 'expected' | 'actual' | 'unpaid') => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const getDialogData = () => {
    if (dialogType === 'expected') {
      const activePatients = patients.filter(p => p.status === 'active');
      return activePatients.map(patient => {
        const patientStart = new Date(patient.start_date);
        const periodStart = patientStart > start ? patientStart : start;
        
        if (periodStart > end) {
          return {
            patient: patient.name,
            sessions: 0,
            value: 0,
          };
        }
        
        if (patient.monthly_price) {
          const months = eachMonthOfInterval({ start: periodStart, end });
          return {
            patient: patient.name,
            sessions: months.length,
            value: months.length * Number(patient.session_value || 0),
          };
        } else {
          const weeks = Math.floor((end.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24 * 7));
          const multiplier = patient.frequency === 'weekly' ? 1 : 0.5;
          const expectedSessions = Math.max(1, Math.ceil(weeks * multiplier));
          const expectedValue = expectedSessions * Number(patient.session_value || 0);
          
          return {
            patient: patient.name,
            sessions: expectedSessions,
            value: expectedValue,
          };
        }
      });
    } else if (dialogType === 'actual') {
      const patientRevenue = new Map<string, { sessions: number; value: number; monthly: boolean }>();
      const monthlyPatientsInDialog = new Map<string, Set<string>>();
      
      attendedSessions.forEach(session => {
        const patient = patients.find(p => p.id === session.patient_id);
        if (patient) {
          const current = patientRevenue.get(patient.name) || { sessions: 0, value: 0, monthly: false };
          
          if (patient.monthly_price) {
            const monthKey = format(parseISO(session.date), 'yyyy-MM');
            if (!monthlyPatientsInDialog.has(patient.name)) {
              monthlyPatientsInDialog.set(patient.name, new Set());
            }
            const months = monthlyPatientsInDialog.get(patient.name)!;
            if (!months.has(monthKey)) {
              months.add(monthKey);
              patientRevenue.set(patient.name, {
                sessions: current.sessions + 1,
                value: current.value + Number(session.value),
                monthly: true,
              });
            } else {
              patientRevenue.set(patient.name, {
                ...current,
                sessions: current.sessions + 1,
              });
            }
          } else {
            patientRevenue.set(patient.name, {
              sessions: current.sessions + 1,
              value: current.value + Number(session.value),
              monthly: false,
            });
          }
        }
      });
      
      return Array.from(patientRevenue.entries()).map(([patient, data]) => ({
        patient,
        sessions: data.sessions,
        value: data.value,
      }));
    } else if (dialogType === 'unpaid') {
      const patientUnpaid = new Map<string, { sessions: number; value: number; monthly: boolean }>();
      const unpaidMonthlyInDialog = new Map<string, Set<string>>();
      
      unpaidSessions.forEach(session => {
        const patient = patients.find(p => p.id === session.patient_id);
        if (patient) {
          const current = patientUnpaid.get(patient.name) || { sessions: 0, value: 0, monthly: false };
          
          if (patient.monthly_price) {
            const monthKey = format(parseISO(session.date), 'yyyy-MM');
            if (!unpaidMonthlyInDialog.has(patient.name)) {
              unpaidMonthlyInDialog.set(patient.name, new Set());
            }
            const months = unpaidMonthlyInDialog.get(patient.name)!;
            if (!months.has(monthKey)) {
              months.add(monthKey);
              patientUnpaid.set(patient.name, {
                sessions: current.sessions + 1,
                value: current.value + Number(session.value),
                monthly: true,
              });
            } else {
              patientUnpaid.set(patient.name, {
                ...current,
                sessions: current.sessions + 1,
              });
            }
          } else {
            patientUnpaid.set(patient.name, {
              sessions: current.sessions + 1,
              value: current.value + Number(session.value),
              monthly: false,
            });
          }
        }
      });
      
      return Array.from(patientUnpaid.entries()).map(([patient, data]) => ({
        patient,
        sessions: data.sessions,
        value: data.value,
      }));
    }
    return [];
  };

  const handleSaveLayout = async () => {
    // Check if user has active profile
    if (!activeProfileId) {
      setShowProfileRequiredDialog(true);
      return;
    }

    const newLayout = {
      visibleCards,
      cardSizes: { ...layout.cardSizes, ...tempCardSizes },
      sectionHeights: { ...layout.sectionHeights, ...tempSectionHeights }
    };
    
    setPendingSave(newLayout);
    setShowSaveDialog(true);
  };

  const handleConfirmSave = async (updateActiveProfile: boolean) => {
    if (!pendingSave) return;
    
    try {
      const success = await saveUserLayout(pendingSave, updateActiveProfile);
      
      if (success) {
        // CRITICAL: Exit edit mode and clear temp states BEFORE reload
        setIsEditMode(false);
        setTempCardSizes({});
        setTempSectionHeights({});
        setPendingSave(null);
        
        toast.success('Layout salvo e sincronizado!');
        
        // Small delay to ensure state updates are flushed
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        toast.error('Erro ao salvar layout. Verifique sua conexão.');
      }
    } catch (error) {
      console.error('[Dashboard] Error in handleConfirmSave:', error);
      toast.error('Erro inesperado ao salvar layout');
    }
  };

  const handleCancelEdit = () => {
    setTempCardSizes({});
    setTempSectionHeights({});
    setIsEditMode(false);
    setVisibleCards(layout.visibleCards);
  };

  const handleResetLayout = async () => {
    if (!user) return;
    
    const success = await resetLayoutToDefault(user.id, 'dashboard');
    if (success) {
      setTempCardSizes({});
      setTempSectionHeights({});
      setVisibleCards(DEFAULT_DASHBOARD_LAYOUT.visibleCards);
      toast.success('Layout restaurado para o padrão!');
      setTimeout(() => window.location.reload(), 300);
    } else {
      toast.error('Erro ao resetar layout.');
    }
  };

  const handleTempCardSizeChange = (id: string, size: { width: number; height: number; x: number; y: number }) => {
    setTempCardSizes(prev => ({ ...prev, [id]: size }));
  };

  const handleTempSectionHeightChange = (id: string, height: number) => {
    setTempSectionHeights(prev => ({ ...prev, [id]: height }));
  };

  const handleAddCard = async (card: CardConfig) => {
    const newVisibleCards = [...visibleCards, card.id];
    setVisibleCards(newVisibleCards);
    
    const defaultSize = {
      width: card.defaultWidth || 280,
      height: card.defaultHeight || 160,
      x: 0,
      y: 0,
    };
    
    const newLayout = {
      visibleCards: newVisibleCards,
      cardSizes: { ...layout.cardSizes, [card.id]: defaultSize },
      sectionHeights: layout.sectionHeights
    };
    
    await saveUserLayout(newLayout);
    toast.success(`Card "${card.name}" adicionado!`);
  };

  const handleRemoveCard = async (cardId: string) => {
    const newVisibleCards = visibleCards.filter(id => id !== cardId);
    setVisibleCards(newVisibleCards);
    
    const { [cardId]: removed, ...remainingCardSizes } = layout.cardSizes;
    
    const newLayout = {
      visibleCards: newVisibleCards,
      cardSizes: remainingCardSizes,
      sectionHeights: layout.sectionHeights
    };
    
    await saveUserLayout(newLayout);
    toast.success('Card removido!');
  };

  const getSavedCardSize = (id: string) => {
    if (tempCardSizes[id]) return tempCardSizes[id];
    return layout.cardSizes[id] || DEFAULT_DASHBOARD_LAYOUT.cardSizes[id];
  };

  const getSavedSectionHeight = (id: string) => {
    if (tempSectionHeights[id]) return tempSectionHeights[id];
    return layout.sectionHeights[id] || DEFAULT_DASHBOARD_LAYOUT.sectionHeights[id] || 400;
  };

  const allCardSizes = Object.keys(DEFAULT_DASHBOARD_LAYOUT.cardSizes).reduce((acc, id) => {
    acc[id] = getSavedCardSize(id);
    return acc;
  }, {} as Record<string, { width: number; height: number; x: number; y: number }>);

  const renderCard = (
    id: string,
    icon: React.ReactNode,
    value: string | number,
    label: string,
    onClick?: () => void,
    iconBgColor: string = 'bg-primary/10',
    iconColor: string = 'text-primary'
  ) => {
    if (!visibleCards.includes(id)) return null;

    const CardContent = (
      <>
        <div className="flex items-center justify-between mb-4">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", iconBgColor)}>
            {icon}
          </div>
        </div>
        <h3 className="text-2xl font-bold text-foreground mb-1">{value}</h3>
        <p className="text-sm text-muted-foreground">{label}</p>
      </>
    );

    return (
      <ResizableCard
        key={id}
        id={id}
        className={cn(
          "p-6 shadow-[var(--shadow-card)] border-border",
          onClick && "cursor-pointer hover:shadow-lg transition-shadow"
        )}
        isEditMode={isEditMode}
        defaultWidth={getSavedCardSize(id)?.width || 280}
        defaultHeight={getSavedCardSize(id)?.height || 160}
        tempSize={tempCardSizes[id]}
        onTempSizeChange={handleTempCardSizeChange}
        allCardSizes={allCardSizes}
      >
        <div onClick={onClick}>
          {CardContent}
        </div>
      </ResizableCard>
    );
  };

  const renderChart = (id: string) => {
    if (!visibleCards.includes(id)) return null;

    const chartConfig = [...AVAILABLE_DASHBOARD_CHARTS].find(c => c.id === id);
    if (!chartConfig) return null;

    // Determine if this chart uses time-based data
    const timeBasedCharts = [
      'chart-monthly-comparison',
      'chart-revenue-trend',
      'chart-attendance-weekly',
      'chart-patient-growth',
    ];
    const isTimeBasedChart = timeBasedCharts.includes(id);
    const currentScale = isTimeBasedChart ? getScale(id) : null;

    let chartContent;
    const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--muted))', '#8b5cf6', '#ec4899'];

    switch (id) {
      case 'chart-monthly-comparison': {
        const intervals = generateTimeIntervals(start, end, currentScale!);
        const chartData = [];
        
        intervals.forEach(intervalDate => {
          const { start: intervalStart, end: intervalEnd } = getIntervalBounds(intervalDate, currentScale!);
          
          const intervalSessions = sessions.filter(s => {
            if (!s.date) return false;
            try {
              const sessionDate = parseISO(s.date);
              return sessionDate >= intervalStart && sessionDate <= intervalEnd;
            } catch {
              return false;
            }
          });
          
          // Só adiciona se houver sessões neste intervalo
          if (intervalSessions.length > 0) {
            const attended = intervalSessions.filter(s => s.status === 'attended').length;
            
            // Calculate revenue considering monthly patients
            const monthlyPatientsInInterval = new Map<string, Set<string>>();
            const revenue = intervalSessions
              .filter(s => s.status === 'attended')
              .reduce((sum, s) => {
                const patient = patients.find(p => p.id === s.patient_id);
                if (patient?.monthly_price) {
                  const monthKey = format(parseISO(s.date), 'yyyy-MM');
                  if (!monthlyPatientsInInterval.has(s.patient_id)) {
                    monthlyPatientsInInterval.set(s.patient_id, new Set());
                  }
                  const months = monthlyPatientsInInterval.get(s.patient_id)!;
                  if (!months.has(monthKey)) {
                    months.add(monthKey);
                    return sum + (Number(s.value) || 0);
                  }
                  return sum;
                }
                return sum + (Number(s.value) || 0);
              }, 0);
            
            const attendanceRate = intervalSessions.length > 0 
              ? (attended / intervalSessions.length) * 100 
              : 0;
            
            chartData.push({
              label: formatTimeLabel(intervalDate, currentScale!),
              sessoes: attended,
              receita: revenue / 100,
              taxa: Math.round(attendanceRate),
            });
          }
        });
        
        chartContent = chartData.length > 0 && chartData.some(d => d.sessoes > 0 || d.faturamento > 0) ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--foreground))" />
              <YAxis yAxisId="left" stroke="hsl(var(--foreground))" />
              <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Bar yAxisId="left" dataKey="sessoes" fill={COLORS[0]} name="Sessões" />
              <Bar yAxisId="left" dataKey="receita" fill={COLORS[1]} name="Receita (R$)" />
              <Bar yAxisId="right" dataKey="taxa" fill={COLORS[2]} name="Taxa (%)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Sem dados disponíveis para o período</p>
          </div>
        );
        break;
      }

      case 'chart-revenue-trend': {
        const intervals = generateTimeIntervals(start, end, currentScale!);
        const chartData = [];
        
        intervals.forEach(intervalDate => {
          const { start: intervalStart, end: intervalEnd } = getIntervalBounds(intervalDate, currentScale!);
          
          const intervalSessions = sessions.filter(s => {
            if (!s.date) return false;
            try {
              const sessionDate = parseISO(s.date);
              return sessionDate >= intervalStart && 
                     sessionDate <= intervalEnd && 
                     s.status === 'attended';
            } catch {
              return false;
            }
          });
          
          // Só adiciona se houver sessões atendidas neste intervalo
          if (intervalSessions.length > 0) {
            // Calculate revenue considering monthly patients
            const monthlyPatientsInInterval = new Map<string, Set<string>>();
            const revenue = intervalSessions.reduce((sum, s) => {
              const patient = patients.find(p => p.id === s.patient_id);
              if (patient?.monthly_price) {
                const monthKey = format(parseISO(s.date), 'yyyy-MM');
                if (!monthlyPatientsInInterval.has(s.patient_id)) {
                  monthlyPatientsInInterval.set(s.patient_id, new Set());
                }
                const months = monthlyPatientsInInterval.get(s.patient_id)!;
                if (!months.has(monthKey)) {
                  months.add(monthKey);
                  return sum + (Number(s.value) || 0);
                }
                return sum;
              }
              return sum + (Number(s.value) || 0);
            }, 0);
            
            chartData.push({
              label: formatTimeLabel(intervalDate, currentScale!),
              valor: revenue / 100,
            });
          }
        });
        
        chartContent = chartData.length > 0 && chartData.some(d => d.valor > 0) ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--foreground))" />
              <YAxis stroke="hsl(var(--foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
              />
              <Legend />
              <Line type="monotone" dataKey="valor" stroke={COLORS[0]} strokeWidth={2} name="Receita (R$)" />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Sem dados disponíveis para o período</p>
          </div>
        );
        break;
      }

      case 'chart-session-types': {
        const statusCounts = {
          'Comparecida': periodSessions.filter(s => s.status === 'attended').length,
          'Faltou': periodSessions.filter(s => s.status === 'missed').length,
          'Agendada': periodSessions.filter(s => s.status === 'scheduled').length,
          'Cancelada': periodSessions.filter(s => s.status === 'cancelled').length,
        };
        
        const pieData = Object.entries(statusCounts)
          .filter(([_, value]) => value > 0)
          .map(([name, value]) => ({ name, value }));
        
        chartContent = (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
        break;
      }

      case 'chart-payment-status': {
        const attendedPeriodSessions = periodSessions.filter(s => s.status === 'attended');
        const paymentCounts = {
          'Pago': attendedPeriodSessions.filter(s => s.paid === true).length,
          'Não Pago': attendedPeriodSessions.filter(s => s.paid === false || s.paid === null).length,
        };
        
        const pieData = Object.entries(paymentCounts)
          .filter(([_, value]) => value > 0)
          .map(([name, value]) => ({ name, value }));
        
        chartContent = (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
        break;
      }

      case 'chart-therapist-distribution': {
        // Group sessions by therapist
        const therapistSessionCount = new Map<string, number>();
        
        periodSessions.filter(s => s.status === 'attended').forEach(session => {
          const patient = patients.find(p => p.id === session.patient_id);
          if (patient) {
            const count = therapistSessionCount.get(patient.user_id) || 0;
            therapistSessionCount.set(patient.user_id, count + 1);
          }
        });

        const chartData = Array.from(therapistSessionCount.entries()).map(([userId, count]) => ({
          terapeuta: userId === user?.id ? 'Você' : 'Terapeuta',
          sessoes: count,
        }));

        chartContent = chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="terapeuta" stroke="hsl(var(--foreground))" />
              <YAxis stroke="hsl(var(--foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Bar dataKey="sessoes" fill={COLORS[0]} name="Sessões Realizadas" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
          </div>
        );
        break;
      }

      case 'chart-attendance-weekly': {
        const intervals = generateTimeIntervals(start, end, currentScale!);
        const chartData = [];
        
        intervals.forEach(intervalDate => {
          const { start: intervalStart, end: intervalEnd } = getIntervalBounds(intervalDate, currentScale!);
          
          const intervalSessions = sessions.filter(s => {
            if (!s.date) return false;
            try {
              const sessionDate = parseISO(s.date);
              return sessionDate >= intervalStart && sessionDate <= intervalEnd;
            } catch {
              return false;
            }
          });
          
          const expected = intervalSessions.filter(s => ['attended', 'missed'].includes(s.status)).length;
          
          // Só adiciona se houver sessões esperadas neste intervalo
          if (expected > 0) {
            const attended = intervalSessions.filter(s => s.status === 'attended').length;
            const rate = (attended / expected) * 100;
            
            chartData.push({
              label: formatTimeLabel(intervalDate, currentScale!),
              taxa: Math.round(rate),
            });
          }
        });

        chartContent = (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--foreground))" />
              <YAxis stroke="hsl(var(--foreground))" domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                formatter={(value) => `${value}%`}
              />
              <Legend />
              <Line type="monotone" dataKey="taxa" stroke={COLORS[0]} strokeWidth={2} name="Taxa de Comparecimento (%)" />
            </LineChart>
          </ResponsiveContainer>
        );
        break;
      }

      case 'chart-revenue-by-therapist': {
        // Group revenue by therapist considering monthly patients
        const therapistRevenue = new Map<string, number>();
        const monthlyPatientsByTherapist = new Map<string, Map<string, Set<string>>>();
        
        periodSessions.filter(s => s.status === 'attended').forEach(session => {
          const patient = patients.find(p => p.id === session.patient_id);
          if (patient) {
            const therapistId = patient.user_id;
            
            if (patient.monthly_price) {
              const monthKey = format(parseISO(session.date), 'yyyy-MM');
              if (!monthlyPatientsByTherapist.has(therapistId)) {
                monthlyPatientsByTherapist.set(therapistId, new Map());
              }
              const therapistMonthly = monthlyPatientsByTherapist.get(therapistId)!;
              if (!therapistMonthly.has(session.patient_id)) {
                therapistMonthly.set(session.patient_id, new Set());
              }
              const months = therapistMonthly.get(session.patient_id)!;
              if (!months.has(monthKey)) {
                months.add(monthKey);
                const current = therapistRevenue.get(therapistId) || 0;
                therapistRevenue.set(therapistId, current + (Number(session.value) || 0));
              }
            } else {
              const current = therapistRevenue.get(therapistId) || 0;
              therapistRevenue.set(therapistId, current + (Number(session.value) || 0));
            }
          }
        });

        const chartData = Array.from(therapistRevenue.entries()).map(([userId, revenue]) => ({
          terapeuta: userId === user?.id ? 'Você' : 'Terapeuta',
          receita: revenue / 100,
        }));

        chartContent = chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--foreground))" />
              <YAxis dataKey="terapeuta" type="category" stroke="hsl(var(--foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
                formatter={(value) => `R$ ${Number(value).toFixed(2)}`}
              />
              <Legend />
              <Bar dataKey="receita" fill={COLORS[1]} name="Receita (R$)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
          </div>
        );
        break;
      }

      case 'chart-patient-growth': {
        const intervals = generateTimeIntervals(start, end, currentScale!);
        const chartData = [];
        const patientFirstSession = new Map<string, Date>();
        
        // Find first session date for each patient
        sessions.forEach(s => {
          if (!s.date) return;
          try {
            const sessionDate = parseISO(s.date);
            const current = patientFirstSession.get(s.patient_id);
            if (!current || sessionDate < current) {
              patientFirstSession.set(s.patient_id, sessionDate);
            }
          } catch {}
        });
        
        let previousCount = 0;
        intervals.forEach(intervalDate => {
          const { end: intervalEnd } = getIntervalBounds(intervalDate, currentScale!);
          
          // Count patients with first session up to this interval
          const activePatients = Array.from(patientFirstSession.values())
            .filter(firstDate => firstDate <= intervalEnd).length;
          
          // Só adiciona se houver mudança ou se for o primeiro ponto com dados
          if (activePatients > 0 && (activePatients !== previousCount || chartData.length === 0)) {
            chartData.push({
              label: formatTimeLabel(intervalDate, currentScale!),
              pacientes: activePatients,
            });
            previousCount = activePatients;
          }
        });

        chartContent = (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" stroke="hsl(var(--foreground))" />
              <YAxis stroke="hsl(var(--foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="pacientes" stroke={COLORS[2]} strokeWidth={2} fill={COLORS[2]} fillOpacity={0.2} name="Pacientes Ativos" />
            </LineChart>
          </ResponsiveContainer>
        );
        break;
      }

      case 'chart-hourly-distribution': {
        // Count sessions by hour
        const hourCounts = new Map<number, number>();
        
        periodSessions.forEach(s => {
          if (!s.time) return;
          try {
            const [hour] = s.time.split(':').map(Number);
            hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
          } catch {}
        });

        const chartData = Array.from({ length: 24 }, (_, hour) => ({
          hora: `${hour}h`,
          sessoes: hourCounts.get(hour) || 0,
        })).filter(d => d.sessoes > 0);

        chartContent = chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="hora" stroke="hsl(var(--foreground))" />
              <YAxis stroke="hsl(var(--foreground))" />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))', 
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Bar dataKey="sessoes" fill={COLORS[3]} name="Sessões" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground">Sem dados disponíveis</p>
          </div>
        );
        break;
      }

      case 'chart-cancellation-reasons': {
        // For now show a placeholder since we don't have cancellation reasons in the schema
        chartContent = (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center px-4">
              Gráfico de motivos de cancelamento requer campo adicional no banco de dados
            </p>
          </div>
        );
        break;
      }

      default:
        chartContent = (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-sm text-muted-foreground text-center px-4">
              Gráfico em desenvolvimento<br/>
              <span className="text-xs">{chartConfig.detailedDescription?.substring(0, 100)}...</span>
            </p>
          </div>
        );
    }

    const ChartContent = (
      <div className="flex flex-col h-full p-6">
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-foreground">{chartConfig.name}</h3>
              {isTimeBasedChart && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent/50 text-accent-foreground">
                  {hasOverride(id) ? getScaleLabel(currentScale!) : `Auto: ${getScaleLabel(automaticScale)}`}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">{chartConfig.description}</p>
          </div>
          {isTimeBasedChart && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 hover:bg-accent">
                  <Clock className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-popover border-border z-50">
                <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Escala de Tempo
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => clearOverride(id)}
                  className={cn(
                    "cursor-pointer",
                    !hasOverride(id) && "bg-accent"
                  )}
                >
                  Automática ({getScaleLabel(automaticScale)})
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => setScaleOverride(id, 'daily')}
                  className={cn(
                    "cursor-pointer",
                    currentScale === 'daily' && hasOverride(id) && "bg-accent"
                  )}
                >
                  Diária
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setScaleOverride(id, 'weekly')}
                  className={cn(
                    "cursor-pointer",
                    currentScale === 'weekly' && hasOverride(id) && "bg-accent"
                  )}
                >
                  Semanal
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setScaleOverride(id, 'monthly')}
                  className={cn(
                    "cursor-pointer",
                    currentScale === 'monthly' && hasOverride(id) && "bg-accent"
                  )}
                >
                  Mensal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        <div className="flex-1 min-h-[200px]">
          {chartContent}
        </div>
      </div>
    );

    return (
      <ResizableCard
        key={id}
        id={id}
        isEditMode={isEditMode}
        defaultWidth={chartConfig.defaultWidth || 600}
        defaultHeight={chartConfig.defaultHeight || 400}
        tempSize={tempCardSizes[id]}
        onTempSizeChange={(cardId, newSize) => {
          setTempCardSizes(prev => ({
            ...prev,
            [cardId]: newSize
          }));
        }}
        allCardSizes={isEditMode ? tempCardSizes : allCardSizes}
      >
        {ChartContent}
      </ResizableCard>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Test</h1>
          <p className="text-muted-foreground">Layout customizável - Versão de teste</p>
        </div>
        
        <div className="flex gap-2">
          {!isEditMode ? (
            <Button onClick={() => setIsEditMode(true)} variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Editar Layout
            </Button>
          ) : (
            <>
              <Button onClick={handleResetLayout} variant="outline" size="sm">
                <RotateCcw className="w-4 h-4 mr-2" />
                Restaurar Padrão
              </Button>
              <Button onClick={handleCancelEdit} variant="outline" size="sm">
                Cancelar
              </Button>
              <Button onClick={handleSaveLayout} size="sm">
                <Save className="w-4 h-4 mr-2" />
                Salvar Layout
              </Button>
            </>
          )}
        </div>
      </div>

      <ComplianceReminder />

      <Card className="p-6 mb-6 shadow-[var(--shadow-card)] border-border">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Período</Label>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="month">Este Mês</SelectItem>
                <SelectItem value="thisWeek">Esta Semana</SelectItem>
                <SelectItem value="lastMonth">Último Mês</SelectItem>
                <SelectItem value="last2Months">Últimos 2 Meses</SelectItem>
                <SelectItem value="q1">Q1 (Jan-Mar)</SelectItem>
                <SelectItem value="q2">Q2 (Abr-Jun)</SelectItem>
                <SelectItem value="q3">Q3 (Jul-Set)</SelectItem>
                <SelectItem value="q4">Q4 (Out-Dez)</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
                <SelectItem value="all">Todo Período</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {period === 'custom' ? (
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
          ) : <div className="hidden md:block" />}
        </div>
      </Card>

      {/* Metrics Section - All Cards */}
      <div>
        {isEditMode && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Métricas</h2>
            <Button
              onClick={() => setIsAddCardDialogOpen(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Card
            </Button>
          </div>
        )}
        <ResizableSection
          id="metrics-section"
          isEditMode={isEditMode}
          defaultHeight={getSavedSectionHeight('metrics-section')}
          tempHeight={tempSectionHeights['metrics-section']}
          onTempHeightChange={handleTempSectionHeightChange}
        >
          <div className="relative h-full">
            {renderCard(
              'total-patients',
              <Users className="w-6 h-6 text-primary" />,
              patients.length,
              'Total de Pacientes'
            )}
            {renderCard(
              'expected-revenue',
              <TrendingUp className="w-6 h-6 text-blue-500" />,
              formatBrazilianCurrency(totalExpected),
              'Receita Esperada',
              () => openDialog('expected'),
              'bg-blue-500/10',
              'text-blue-500'
            )}
            {renderCard(
              'actual-revenue',
              <DollarSign className="w-6 h-6 text-[hsl(var(--success))]" />,
              formatBrazilianCurrency(totalActual),
              `Receita Efetiva (${revenuePercent}%)`,
              () => openDialog('actual'),
              'bg-success/10',
              'text-[hsl(var(--success))]'
            )}
            {renderCard(
              'attended-sessions',
              <CheckCircle2 className="w-6 h-6 text-accent" />,
              visiblePeriodSessions.filter(s => s.status === 'attended').length,
              'Sessões Realizadas',
              undefined,
              'bg-accent/10',
              'text-accent'
            )}
            {renderCard(
              'expected-sessions',
              <Calendar className="w-6 h-6 text-accent" />,
              expectedSessions,
              'Sessões Esperadas',
              undefined,
              'bg-accent/10',
              'text-accent'
            )}
            {renderCard(
              'missed-sessions',
              <AlertCircle className="w-6 h-6 text-destructive" />,
              missedSessions.length,
              `Sessões Desmarcadas (${missedPercent}%)`,
              undefined,
              'bg-destructive/10',
              'text-destructive'
            )}
            {renderCard(
              'pending-sessions',
              <Calendar className="w-6 h-6 text-muted-foreground" />,
              pendingSessions.length,
              `Sessões Pendentes (${pendingPercent}%)`,
              undefined,
              'bg-muted/50',
              'text-muted-foreground'
            )}
            {renderCard(
              'unpaid-value',
              <DollarSign className="w-6 h-6 text-[hsl(var(--warning))]" />,
              formatBrazilianCurrency(unpaidValue),
              `Em Aberto (${unpaidSessions.length})`,
              () => openDialog('unpaid'),
              'bg-warning/10',
              'text-[hsl(var(--warning))]'
            )}
          </div>
        </ResizableSection>
      </div>

      {/* Separator between sections */}
      <Separator className="my-8" />

      {/* Charts Section - For Visualizations */}
      <div>
        {isEditMode && (
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Gráficos e Visualizações</h2>
            <Button
              onClick={() => setIsAddChartDialogOpen(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Gráfico
            </Button>
          </div>
        )}
        <ResizableSection
          id="charts-section"
          isEditMode={isEditMode}
          defaultHeight={getSavedSectionHeight('charts-section')}
          tempHeight={tempSectionHeights['charts-section']}
          onTempHeightChange={handleTempSectionHeightChange}
        >
          {visibleCards.filter(id => id.startsWith('chart-')).length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <p className="text-muted-foreground">
                {isEditMode 
                  ? 'Clique em "Adicionar Gráfico" para adicionar visualizações'
                  : 'Nenhum gráfico adicionado. Entre no modo de edição para adicionar gráficos.'
                }
              </p>
            </Card>
          ) : (
            <div className="relative h-full">
              {visibleCards
                .filter(id => id.startsWith('chart-'))
                .map(id => renderChart(id))
              }
            </div>
          )}
        </ResizableSection>
      </div>

      {/* Add Card Dialogs */}
      <AddCardDialog
        open={isAddCardDialogOpen}
        onOpenChange={setIsAddCardDialogOpen}
        onAddCard={handleAddCard}
        onRemoveCard={handleRemoveCard}
        existingCardIds={visibleCards}
        mode="dashboard-cards"
      />
      
      <AddCardDialog
        open={isAddChartDialogOpen}
        onOpenChange={setIsAddChartDialogOpen}
        onAddCard={handleAddCard}
        onRemoveCard={handleRemoveCard}
        existingCardIds={visibleCards}
        mode="dashboard-charts"
      />

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogType === 'expected' && 'Detalhes da Receita Esperada'}
              {dialogType === 'actual' && 'Detalhes da Receita Efetiva'}
              {dialogType === 'unpaid' && 'Detalhes dos Valores em Aberto'}
            </DialogTitle>
            <DialogDescription>
              Detalhamento por paciente das sessões e valores
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Paciente</TableHead>
                  <TableHead>Sessões</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getDialogData().map((row, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{row.patient}</TableCell>
                    <TableCell>{row.sessions}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatBrazilianCurrency(row.value)}
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-bold bg-muted/50">
                  <TableCell>Total</TableCell>
                  <TableCell>
                    {getDialogData().reduce((sum, row) => sum + row.sessions, 0)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatBrazilianCurrency(
                      getDialogData().reduce((sum, row) => sum + row.value, 0)
                    )}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <RequireActiveProfileDialog 
        open={showProfileRequiredDialog}
        onOpenChange={setShowProfileRequiredDialog}
      />

      <SaveLayoutDialog
        open={showSaveDialog}
        onOpenChange={setShowSaveDialog}
        onConfirm={handleConfirmSave}
        activeProfileName={activeProfileName}
      />

      <NotificationPrompt />
    </div>
  );
};

export default DashboardTest;
