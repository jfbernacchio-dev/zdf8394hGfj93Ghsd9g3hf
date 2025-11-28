import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, AlertCircle, TrendingUp, Users, DollarSign } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { useEffectivePermissions } from '@/hooks/useEffectivePermissions';
import { useDashboardPermissions } from '@/hooks/useDashboardPermissions';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { useChartTimeScale } from '@/hooks/useChartTimeScale';
import { ResizableSection } from '@/components/ResizableSection';

// Import metrics utils and types
import {
  type MetricsPatient,
  type MetricsSession,
  type MetricsScheduleBlock,
  type MetricsProfile,
  getFinancialSummary,
  getFinancialTrends,
  getRetentionAndChurn,
} from '@/lib/systemMetricsUtils';

// Local sections configuration (not in global registry yet)
const METRICS_SECTIONS = [
  {
    id: 'metrics-financial',
    title: 'Financeiro',
    description: 'Receita, faltas, ticket médio e indicadores financeiros.',
  },
  {
    id: 'metrics-administrative',
    title: 'Administrativo',
    description: 'Volume de pacientes, status e fluxo administrativo.',
  },
  {
    id: 'metrics-team',
    title: 'Equipe',
    description: 'Distribuição de carga e métricas por terapeuta.',
  },
];

type Period = 'week' | 'month' | 'year' | 'custom';

const Metrics = () => {
  const { user, organizationId } = useAuth();
  const { permissions, loading: permissionsLoading } = useEffectivePermissions();
  const { permissionContext } = useDashboardPermissions();

  // Period state
  const [period, setPeriod] = useState<Period>('month');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);

  // Calculate date range based on period
  const dateRange = useMemo(() => {
    const now = new Date();
    let start: Date;
    let end: Date;

    switch (period) {
      case 'week':
        start = startOfWeek(now, { weekStartsOn: 0 });
        end = endOfWeek(now, { weekStartsOn: 0 });
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'year':
        start = startOfYear(now);
        end = endOfYear(now);
        break;
      case 'custom':
        if (customStartDate && customEndDate) {
          start = customStartDate;
          end = customEndDate;
        } else {
          // Fallback to current month if custom dates not set
          start = startOfMonth(now);
          end = endOfMonth(now);
        }
        break;
      default:
        start = startOfMonth(now);
        end = endOfMonth(now);
    }

    return { start, end };
  }, [period, customStartDate, customEndDate]);

  // Layout integration
  const {
    layout,
    loading: layoutLoading,
    updateLayout,
    saveLayout,
    resetLayout,
    isModified,
  } = useDashboardLayout();

  // Chart time scale integration
  const {
    automaticScale,
    getScale,
    setScaleOverride,
    clearOverride,
    hasOverride,
  } = useChartTimeScale({
    startDate: dateRange.start,
    endDate: dateRange.end,
  });

  // Load patients from organization
  const { data: rawPatients, isLoading: patientsLoading } = useQuery({
    queryKey: ['metrics-patients', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];

      const { getUserIdsInOrganization } = await import('@/lib/organizationFilters');
      const orgUserIds = await getUserIdsInOrganization(organizationId);

      if (orgUserIds.length === 0) return [];

      const { data, error } = await supabase
        .from('patients')
        .select('*')
        .in('user_id', orgUserIds)
        .eq('organization_id', organizationId);

      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId && !!user,
  });

  // Load sessions from organization for date range
  type SessionRow = Database['public']['Tables']['sessions']['Row'];
  const { data: rawSessions, isLoading: sessionsLoading } = useQuery<SessionRow[]>({
    queryKey: ['metrics-sessions', organizationId, dateRange.start.toISOString(), dateRange.end.toISOString()],
    queryFn: async (): Promise<SessionRow[]> => {
      if (!organizationId) return [];

      const { getUserIdsInOrganization } = await import('@/lib/organizationFilters');
      const orgUserIds = await getUserIdsInOrganization(organizationId);

      if (orgUserIds.length === 0) return [];

      const result = await (supabase as any)
        .from('sessions')
        .select('*')
        .in('user_id', orgUserIds)
        .eq('organization_id', organizationId)
        .gte('date', dateRange.start.toISOString().split('T')[0])
        .lte('date', dateRange.end.toISOString().split('T')[0]);

      if (result.error) throw result.error;
      return (result.data || []) as SessionRow[];
    },
    enabled: !!organizationId && !!user,
  });

  // Load profile data
  const { data: rawProfile, isLoading: profileLoading } = useQuery({
    queryKey: ['metrics-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*, professional_roles(*)')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Load schedule blocks
  const { data: rawScheduleBlocks, isLoading: blocksLoading } = useQuery({
    queryKey: ['metrics-schedule-blocks', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('schedule_blocks')
        .select('*')
        .eq('user_id', user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Adapters: Convert Supabase types to Metrics types
  const metricsPatients: MetricsPatient[] = useMemo(() => {
    if (!rawPatients) return [];

    return rawPatients.map((p) => ({
      id: p.id,
      user_id: p.user_id,
      name: p.name,
      status: p.status,
      frequency: p.frequency,
      session_value: p.session_value,
      monthly_price: p.monthly_price || false,
      start_date: p.start_date,
    }));
  }, [rawPatients]);

  const metricsSessions: MetricsSession[] = useMemo(() => {
    if (!rawSessions) return [];

    return rawSessions.map((s) => ({
      id: s.id,
      patient_id: s.patient_id,
      date: s.date,
      status: (s.status === 'scheduled' ? 'rescheduled' : s.status) as 'attended' | 'missed' | 'cancelled' | 'rescheduled',
      value: s.value || 0,
    }));
  }, [rawSessions]);

  const metricsProfile: MetricsProfile | null = useMemo(() => {
    if (!rawProfile) return null;

    return {
      id: rawProfile.id,
      slot_duration: rawProfile.slot_duration || 50,
      break_time: rawProfile.break_time || 10,
      work_start_time: rawProfile.work_start_time || '08:00',
      work_end_time: rawProfile.work_end_time || '18:00',
      work_days: rawProfile.work_days || [1, 2, 3, 4, 5],
    };
  }, [rawProfile]);

  const metricsScheduleBlocks: MetricsScheduleBlock[] = useMemo(() => {
    if (!rawScheduleBlocks) return [];

    return rawScheduleBlocks.map((b) => ({
      id: b.id,
      user_id: b.user_id,
      day_of_week: b.day_of_week,
      start_time: b.start_time,
      end_time: b.end_time,
      start_date: b.start_date,
      end_date: b.end_date,
    }));
  }, [rawScheduleBlocks]);

  // Aggregate data using systemMetricsUtils
  const aggregatedData = useMemo(() => {
    if (!metricsPatients || !metricsSessions) return null;

    try {
      const summary = getFinancialSummary({
        sessions: metricsSessions,
        patients: metricsPatients,
        start: dateRange.start,
        end: dateRange.end,
      });

      const trends = getFinancialTrends({
        sessions: metricsSessions,
        patients: metricsPatients,
        start: dateRange.start,
        end: dateRange.end,
        timeScale: 'monthly', // Only monthly for now
      });

      const retention = getRetentionAndChurn({
        patients: metricsPatients,
        start: dateRange.start,
        end: dateRange.end,
      });

      return {
        summary,
        trends,
        retention,
      };
    } catch (error) {
      console.error('[Metrics] Error calculating aggregated data:', error);
      return null;
    }
  }, [metricsPatients, metricsSessions, dateRange.start, dateRange.end]);

  const isLoading = patientsLoading || sessionsLoading || layoutLoading || permissionsLoading;

  // Permission check
  const canViewFinancial = permissionContext?.canAccessFinancial || false;
  const canViewMetrics = permissionContext?.canAccessAdministrative || canViewFinancial;

  if (!canViewMetrics && !permissionsLoading) {
    return (
      <div className="p-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Você não tem permissão para acessar esta página.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Métricas</h1>
        <p className="text-muted-foreground">
          Visão geral financeira e administrativa do consultório
        </p>
      </div>

      {/* Period Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Período de Análise</CardTitle>
          <CardDescription>
            Selecione o período para visualizar as métricas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-end">
            {/* Period selector */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Período</label>
              <Select value={period} onValueChange={(value) => setPeriod(value as Period)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Esta Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="year">Este Ano</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Custom date range (only when period is custom) */}
            {period === 'custom' && (
              <>
                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">Data Inicial</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !customStartDate && 'text-muted-foreground'
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {customStartDate ? format(customStartDate, 'PP', { locale: ptBR }) : 'Selecione'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customStartDate}
                        onSelect={setCustomStartDate}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex-1 min-w-[200px]">
                  <label className="text-sm font-medium mb-2 block">Data Final</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full justify-start text-left font-normal',
                          !customEndDate && 'text-muted-foreground'
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {customEndDate ? format(customEndDate, 'PP', { locale: ptBR }) : 'Selecione'}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={customEndDate}
                        onSelect={setCustomEndDate}
                        locale={ptBR}
                        disabled={(date) =>
                          customStartDate ? date < customStartDate : false
                        }
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </>
            )}

            {/* Selected period display */}
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm font-medium mb-2 block">Período Selecionado</label>
              <div className="p-3 bg-muted rounded-md text-sm">
                <p className="font-medium">
                  {format(dateRange.start, 'dd/MM/yyyy', { locale: ptBR })} -{' '}
                  {format(dateRange.end, 'dd/MM/yyyy', { locale: ptBR })}
                </p>
                <p className="text-muted-foreground text-xs mt-1">
                  Escala automática: {automaticScale === 'daily' ? 'Diária' : automaticScale === 'weekly' ? 'Semanal' : 'Mensal'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-6">
          {METRICS_SECTIONS.map((section) => (
            <Card key={section.id}>
              <CardHeader>
                <Skeleton className="h-6 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                  <Skeleton className="h-32" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Sections with data */}
      {!isLoading && aggregatedData && (
        <div className="space-y-6">
          {METRICS_SECTIONS.map((section) => (
            <Card key={section.id} className="overflow-hidden">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {section.id === 'metrics-financial' && <DollarSign className="h-5 w-5" />}
                      {section.id === 'metrics-administrative' && <Users className="h-5 w-5" />}
                      {section.id === 'metrics-team' && <TrendingUp className="h-5 w-5" />}
                      {section.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {section.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Financial section - show some debug data */}
                {section.id === 'metrics-financial' && aggregatedData.summary && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Receita Total</p>
                        <p className="text-2xl font-bold">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(aggregatedData.summary.totalRevenue)}
                        </p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Total de Sessões</p>
                        <p className="text-2xl font-bold">{aggregatedData.summary.totalSessions}</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Taxa de Faltas</p>
                        <p className="text-2xl font-bold">{aggregatedData.summary.missedRate.toFixed(1)}%</p>
                      </div>
                      <div className="p-4 bg-muted/50 rounded-lg">
                        <p className="text-sm text-muted-foreground">Pacientes Ativos</p>
                        <p className="text-2xl font-bold">{aggregatedData.summary.activePatients}</p>
                      </div>
                    </div>
                    <Alert>
                      <AlertDescription>
                        <strong>Em breve:</strong> Cards de métricas interativos com gráficos e análises detalhadas.
                      </AlertDescription>
                    </Alert>
                  </div>
                )}

                {/* Other sections - placeholders */}
                {section.id !== 'metrics-financial' && (
                  <Alert>
                    <AlertDescription>
                      <strong>Em breve:</strong> Cards de métricas desta seção.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Debug data (optional - can be removed later) */}
      {!isLoading && aggregatedData && process.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Debug: Dados Agregados (Dev Only)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto max-h-96 bg-muted p-4 rounded-md">
              {JSON.stringify(
                {
                  summary: aggregatedData.summary,
                  trendsCount: aggregatedData.trends.length,
                  retention: aggregatedData.retention,
                  dateRange: {
                    start: dateRange.start.toISOString(),
                    end: dateRange.end.toISOString(),
                  },
                  automaticScale,
                },
                null,
                2
              )}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Metrics;
