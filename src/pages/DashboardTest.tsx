import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Users, Calendar, DollarSign, TrendingUp, AlertCircle, CheckCircle2, CalendarIcon, Settings, Save, RotateCcw, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { parseISO, format, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { NotificationPrompt } from '@/components/NotificationPrompt';
import { ComplianceReminder } from '@/components/ComplianceReminder';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';
import { ResizableCard } from '@/components/ResizableCard';
import { ResizableSection } from '@/components/ResizableSection';
import { DEFAULT_DASHBOARD_LAYOUT, resetToDefaultDashboardLayout } from '@/lib/defaultLayoutDashboard';
import { toast } from 'sonner';
import { AddCardDialog } from '@/components/AddCardDialog';
import { CardConfig, AVAILABLE_DASHBOARD_CHARTS } from '@/types/cardTypes';

const DashboardTest = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [period, setPeriod] = useState('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'expected' | 'actual' | 'unpaid' | null>(null);

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [visibleCards, setVisibleCards] = useState<string[]>([]);
  const [tempCardSizes, setTempCardSizes] = useState<Record<string, { width: number; height: number; x: number; y: number }>>({});
  const [tempSectionHeights, setTempSectionHeights] = useState<Record<string, number>>({});
  
  // Add card dialog state
  const [isAddCardDialogOpen, setIsAddCardDialogOpen] = useState(false);
  const [isAddChartDialogOpen, setIsAddChartDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
      loadLayout();
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

  const loadLayout = () => {
    const savedCards = localStorage.getItem('dashboard-visible-cards');
    if (savedCards) {
      setVisibleCards(JSON.parse(savedCards));
    } else {
      setVisibleCards(DEFAULT_DASHBOARD_LAYOUT.visibleCards);
    }
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
    } else if (period === 'lastMonth') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else if (period === 'last2Months') {
      start = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      end = now;
    } else if (period === 'year') {
      start = new Date(now.getFullYear(), 0, 1);
      end = now;
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return { start, end };
  };

  const { start, end } = getDateRange();
  
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

  const handleSaveLayout = () => {
    // Save visible cards
    localStorage.setItem('dashboard-visible-cards', JSON.stringify(visibleCards));
    
    // Save temp sizes to localStorage with the correct key that ResizableCard uses
    Object.entries(tempCardSizes).forEach(([id, size]) => {
      localStorage.setItem(`card-size-${id}`, JSON.stringify(size));
    });
    
    // Save temp section heights
    Object.entries(tempSectionHeights).forEach(([id, height]) => {
      localStorage.setItem(`section-height-${id}`, height.toString());
    });
    
    // Clear temp state
    setTempCardSizes({});
    setTempSectionHeights({});
    setIsEditMode(false);
    
    toast.success('Layout salvo com sucesso!');
    
    // Force reload to apply saved sizes
    setTimeout(() => window.location.reload(), 300);
  };

  const handleCancelEdit = () => {
    setTempCardSizes({});
    setTempSectionHeights({});
    setIsEditMode(false);
    loadLayout();
  };

  const handleResetLayout = () => {
    resetToDefaultDashboardLayout();
    setTempCardSizes({});
    setTempSectionHeights({});
    loadLayout();
    toast.success('Layout restaurado para o padrão!');
  };

  const handleTempCardSizeChange = (id: string, size: { width: number; height: number; x: number; y: number }) => {
    setTempCardSizes(prev => ({ ...prev, [id]: size }));
  };

  const handleTempSectionHeightChange = (id: string, height: number) => {
    setTempSectionHeights(prev => ({ ...prev, [id]: height }));
  };

  const handleAddCard = (card: CardConfig) => {
    const newVisibleCards = [...visibleCards, card.id];
    setVisibleCards(newVisibleCards);
    localStorage.setItem('dashboard-visible-cards', JSON.stringify(newVisibleCards));
    
    // Set default size for the new card
    const defaultSize = {
      width: card.defaultWidth || 280,
      height: card.defaultHeight || 160,
      x: 0,
      y: 0,
    };
    localStorage.setItem(`card-size-${card.id}`, JSON.stringify(defaultSize));
    
    toast.success(`Card "${card.name}" adicionado!`);
  };

  const handleRemoveCard = (cardId: string) => {
    const newVisibleCards = visibleCards.filter(id => id !== cardId);
    setVisibleCards(newVisibleCards);
    localStorage.setItem('dashboard-visible-cards', JSON.stringify(newVisibleCards));
    localStorage.removeItem(`card-size-${cardId}`);
    toast.success('Card removido!');
  };

  const getSavedCardSize = (id: string) => {
    if (tempCardSizes[id]) return tempCardSizes[id];
    const saved = localStorage.getItem(`card-size-${id}`);
    if (saved) return JSON.parse(saved);
    return DEFAULT_DASHBOARD_LAYOUT.cardSizes[id];
  };

  const getSavedSectionHeight = (id: string) => {
    if (tempSectionHeights[id]) return tempSectionHeights[id];
    const saved = localStorage.getItem(`section-height-${id}`);
    if (saved) return parseInt(saved);
    return DEFAULT_DASHBOARD_LAYOUT.sectionHeights[id] || 400;
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

    return (
      <Card
        key={id}
        className={cn(
          "p-6 shadow-[var(--shadow-card)] border-border h-full flex flex-col",
          isEditMode && "ring-2 ring-primary/30 ring-offset-2"
        )}
      >
        <h3 className="text-lg font-semibold text-foreground mb-2">{chartConfig.name}</h3>
        <p className="text-sm text-muted-foreground mb-4">{chartConfig.description}</p>
        <div className="flex-1 flex items-center justify-center border border-dashed border-border rounded-lg bg-muted/20 min-h-[300px]">
          <p className="text-sm text-muted-foreground text-center px-4">
            Gráfico em desenvolvimento<br/>
            <span className="text-xs">{chartConfig.detailedDescription?.substring(0, 100)}...</span>
          </p>
        </div>
      </Card>
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
                <SelectItem value="lastMonth">Último Mês</SelectItem>
                <SelectItem value="last2Months">Últimos 2 Meses</SelectItem>
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
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Métricas</h2>
          {isEditMode && (
            <Button
              onClick={() => setIsAddCardDialogOpen(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Card
            </Button>
          )}
        </div>
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

      {/* Charts Section - For Visualizations */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground">Gráficos e Visualizações</h2>
          {isEditMode && (
            <Button
              onClick={() => setIsAddChartDialogOpen(true)}
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Adicionar Gráfico
            </Button>
          )}
        </div>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
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

      <NotificationPrompt />
    </div>
  );
};

export default DashboardTest;
