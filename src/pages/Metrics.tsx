import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar, AlertCircle, TrendingUp, Users, DollarSign, BarChart3, Pencil, Save, RotateCcw, X } from 'lucide-react';
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
import { GridCardContainer } from '@/components/GridCardContainer';
import type { GridCardLayout } from '@/types/cardTypes';

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

// Import sections configuration (FASE C3.5)
import {
  METRICS_SECTIONS,
  METRICS_SUBTABS,
  getSubTabsForDomain,
  getDefaultSubTabForDomain,
  type MetricsDomain,
} from '@/lib/metricsSectionsConfig';

// Import metric card types (FASE C3.6)
import type { MetricsPeriodFilter } from '@/types/metricsCardTypes';

// Import metric card components (FASE C3.6)
import { MetricsRevenueTotalCard } from '@/components/cards/metrics/financial/MetricsRevenueTotalCard';
import { MetricsAvgPerSessionCard } from '@/components/cards/metrics/financial/MetricsAvgPerSessionCard';
import { MetricsForecastRevenueCard } from '@/components/cards/metrics/financial/MetricsForecastRevenueCard';
import { MetricsAvgPerActivePatientCard } from '@/components/cards/metrics/financial/MetricsAvgPerActivePatientCard';
import { MetricsLostRevenueCard } from '@/components/cards/metrics/financial/MetricsLostRevenueCard';
import { MetricsMissedRateCard } from '@/components/cards/metrics/administrative/MetricsMissedRateCard';
import { MetricsActivePatientsCard } from '@/components/cards/metrics/administrative/MetricsActivePatientsCard';
import { MetricsOccupationRateCard } from '@/components/cards/metrics/administrative/MetricsOccupationRateCard';
import { MetricsWebsiteViewsCard } from '@/components/cards/metrics/marketing/MetricsWebsiteViewsCard';
import { MetricsWebsiteVisitorsCard } from '@/components/cards/metrics/marketing/MetricsWebsiteVisitorsCard';
import { MetricsWebsiteConversionCard } from '@/components/cards/metrics/marketing/MetricsWebsiteConversionCard';
import { MetricsWebsiteCTRCard } from '@/components/cards/metrics/marketing/MetricsWebsiteCTRCard';

// Import chart components (FASE C3.7)
import { FinancialTrendsChart } from '@/components/charts/metrics/financial/FinancialTrendsChart';
import { FinancialPerformanceChart } from '@/components/charts/metrics/financial/FinancialPerformanceChart';
import { FinancialDistributionsChart } from '@/components/charts/metrics/financial/FinancialDistributionsChart';
import { AdminRetentionChart } from '@/components/charts/metrics/administrative/AdminRetentionChart';
import { AdminPerformanceChart } from '@/components/charts/metrics/administrative/AdminPerformanceChart';
import { AdminDistributionsChart } from '@/components/charts/metrics/administrative/AdminDistributionsChart';
import { MarketingWebsiteOverviewChart } from '@/components/charts/metrics/marketing/MarketingWebsiteOverviewChart';

type Period = 'week' | 'month' | 'year' | 'custom';

const Metrics = () => {
  const { user, organizationId } = useAuth();
  const { permissions, loading: permissionsLoading } = useEffectivePermissions();
  const { permissionContext } = useDashboardPermissions();
  const [searchParams, setSearchParams] = useSearchParams();

  // Layout management (FASE C3-R.1)
  const {
    layout: metricsLayout,
    updateLayout,
    saveLayout,
    resetLayout,
    hasUnsavedChanges,
    loading: layoutLoading,
    saving: layoutSaving,
  } = useDashboardLayout('metrics-grid');
  
  const [isEditMode, setIsEditMode] = useState(false);

  // Period state
  const [period, setPeriod] = useState<Period>('month');
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>(undefined);
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>(undefined);

  // Determine visible domains based on permissions
  const visibleDomains = useMemo<MetricsDomain[]>(() => {
    const domains: MetricsDomain[] = [];

    // Financial access
    if (permissionContext?.canAccessFinancial) {
      domains.push('financial');
    }

    // Administrative access
    if (permissionContext?.canAccessAdministrative) {
      domains.push('administrative');
    }

    // Marketing access
    if (permissionContext?.canAccessMarketing) {
      domains.push('marketing');
    }

    // Team access
    if (permissionContext?.canAccessTeam) {
      domains.push('team');
    }

    // Fallback: if no organization and no specific restrictions, assume full access
    if (!organizationId && domains.length === 0) {
      return ['financial', 'administrative', 'marketing', 'team'];
    }

    return domains;
  }, [
    permissionContext?.canAccessFinancial,
    permissionContext?.canAccessAdministrative,
    permissionContext?.canAccessMarketing,
    permissionContext?.canAccessTeam,
    organizationId,
  ]);

  // Current domain from URL or default to first visible
  const currentDomain = useMemo<MetricsDomain>(() => {
    const domainParam = searchParams.get('domain') as MetricsDomain | null;
    if (domainParam && visibleDomains.includes(domainParam)) {
      return domainParam;
    }
    return visibleDomains[0] || 'financial';
  }, [searchParams, visibleDomains]);

  // Available sub-tabs for current domain
  const availableSubTabs = useMemo(() => {
    return getSubTabsForDomain(currentDomain);
  }, [currentDomain]);

  // Current sub-tab from URL or default
  const currentSubTab = useMemo(() => {
    const subTabParam = searchParams.get('subTab');
    if (subTabParam && availableSubTabs.some(st => st.id === subTabParam)) {
      return subTabParam;
    }
    return getDefaultSubTabForDomain(currentDomain) || availableSubTabs[0]?.id || 'distribuicoes';
  }, [searchParams, currentDomain, availableSubTabs]);

  // Handler to change domain
  const handleDomainChange = (newDomain: MetricsDomain) => {
    const defaultSubTab = getDefaultSubTabForDomain(newDomain);
    setSearchParams({
      domain: newDomain,
      ...(defaultSubTab && { subTab: defaultSubTab }),
    });
  };

  // Handler to change sub-tab
  const handleSubTabChange = (newSubTab: string) => {
    setSearchParams({
      domain: currentDomain,
      subTab: newSubTab,
    });
  };

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
  const hasAnyMetricsAccess = visibleDomains.length > 0;

  // Prepare props for metric cards
  const periodFilter: MetricsPeriodFilter = {
    type: period,
    startDate: dateRange.start,
    endDate: dateRange.end,
  };

  const cardsLoading = patientsLoading || sessionsLoading || profileLoading || blocksLoading;
  const summary = aggregatedData?.summary ?? null;
  const trends = aggregatedData?.trends ?? [];
  const retention = aggregatedData?.retention ?? null;

  // Get current section layout for GridCardContainer (FASE C3-R.1)
  const currentSectionId = `metrics-${currentDomain}`;
  const currentSectionLayout = useMemo(() => {
    if (!metricsLayout || !metricsLayout[currentSectionId]) return [];
    return metricsLayout[currentSectionId].cardLayouts || [];
  }, [metricsLayout, currentSectionId]);

  // Helper: Map card ID to component (FASE C3-R.1)
  const getCardComponent = (cardId: string) => {
    const cardMap: Record<string, React.ReactNode> = {
      'metrics-revenue-total': <MetricsRevenueTotalCard periodFilter={periodFilter} summary={summary} isLoading={cardsLoading} />,
      'metrics-avg-per-session': <MetricsAvgPerSessionCard periodFilter={periodFilter} summary={summary} isLoading={cardsLoading} />,
      'metrics-forecast-revenue': <MetricsForecastRevenueCard periodFilter={periodFilter} summary={summary} isLoading={cardsLoading} />,
      'metrics-avg-per-active-patient': <MetricsAvgPerActivePatientCard periodFilter={periodFilter} summary={summary} isLoading={cardsLoading} />,
      'metrics-lost-revenue': <MetricsLostRevenueCard periodFilter={periodFilter} summary={summary} isLoading={cardsLoading} />,
      'metrics-missed-rate': <MetricsMissedRateCard periodFilter={periodFilter} summary={summary} isLoading={cardsLoading} />,
      'metrics-active-patients': <MetricsActivePatientsCard periodFilter={periodFilter} summary={summary} isLoading={cardsLoading} />,
      'metrics-occupation-rate': <MetricsOccupationRateCard periodFilter={periodFilter} summary={summary} isLoading={cardsLoading} />,
      'metrics-website-views': <MetricsWebsiteViewsCard isLoading={cardsLoading} />,
      'metrics-website-visitors': <MetricsWebsiteVisitorsCard isLoading={cardsLoading} />,
      'metrics-website-conversion': <MetricsWebsiteConversionCard isLoading={cardsLoading} />,
      'metrics-website-ctr': <MetricsWebsiteCTRCard isLoading={cardsLoading} />,
    };
    return cardMap[cardId] || null;
  };

  // Layout control handlers (FASE C3-R.1)
  const handleSaveLayout = async () => {
    await saveLayout();
  };

  const handleResetLayout = async () => {
    if (confirm('Tem certeza que deseja resetar o layout para o padrão? Esta ação não pode ser desfeita.')) {
      await resetLayout();
      setIsEditMode(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
  };

  // Render metric cards based on current domain (FASE C3-R.1 - Refatorado)
  const renderMetricCards = () => {
    if (currentDomain === 'team') {
      return (
        <Alert className="mb-6">
          <AlertDescription>
            Métricas da equipe serão implementadas em breve.
          </AlertDescription>
        </Alert>
      );
    }

    if (currentSectionLayout.length === 0) {
      return (
        <Alert className="mb-6">
          <AlertDescription>
            Nenhum card configurado para este domínio ainda.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="mb-6">
        <GridCardContainer
          sectionId={currentSectionId}
          layout={currentSectionLayout}
          onLayoutChange={(newLayout) => updateLayout(currentSectionId, newLayout)}
          isEditMode={isEditMode}
        >
          {currentSectionLayout.map((cardLayout) => {
            const CardComponent = getCardComponent(cardLayout.i);
            return (
              <div key={cardLayout.i} data-grid={cardLayout} className="drag-handle cursor-move">
                {CardComponent}
              </div>
            );
          })}
        </GridCardContainer>
      </div>
    );
  };

  // Render chart content based on current domain and sub-tab (FASE C3.7)
  const renderChartContent = (subTabId: string) => {
    const timeScale = getScale(`metrics-${currentDomain}-${subTabId}`);
    
    // Financial domain
    if (currentDomain === 'financial') {
      if (subTabId === 'tendencias') {
        return (
          <FinancialTrendsChart
            trends={trends}
            isLoading={cardsLoading}
            periodFilter={periodFilter}
            timeScale={timeScale}
          />
        );
      }
      
      if (subTabId === 'desempenho') {
        return (
          <FinancialPerformanceChart
            trends={trends}
            isLoading={cardsLoading}
            periodFilter={periodFilter}
            timeScale={timeScale}
          />
        );
      }
      
      if (subTabId === 'distribuicoes') {
        return (
          <FinancialDistributionsChart
            summary={summary}
            isLoading={cardsLoading}
            periodFilter={periodFilter}
            timeScale={timeScale}
          />
        );
      }
    }

    // Administrative domain
    if (currentDomain === 'administrative') {
      if (subTabId === 'retencao') {
        return (
          <AdminRetentionChart
            retention={retention}
            isLoading={cardsLoading}
            periodFilter={periodFilter}
            timeScale={timeScale}
          />
        );
      }
      
      if (subTabId === 'desempenho') {
        return (
          <AdminPerformanceChart
            trends={trends}
            isLoading={cardsLoading}
            periodFilter={periodFilter}
            timeScale={timeScale}
          />
        );
      }
      
      if (subTabId === 'distribuicoes') {
        return (
          <AdminDistributionsChart
            summary={summary}
            isLoading={cardsLoading}
            periodFilter={periodFilter}
            timeScale={timeScale}
          />
        );
      }
    }

    // Marketing domain
    if (currentDomain === 'marketing') {
      if (subTabId === 'website') {
        return (
          <MarketingWebsiteOverviewChart
            isLoading={cardsLoading}
          />
        );
      }
    }

    // Team domain - placeholder
    if (currentDomain === 'team') {
      return (
        <Alert>
          <AlertDescription>
            <strong>Em breve:</strong> Gráficos de equipe serão implementados em fases futuras.
          </AlertDescription>
        </Alert>
      );
    }

    // Fallback
    return (
      <Alert>
        <AlertDescription>
          <strong>Em breve:</strong> Gráfico de {subTabId} para {METRICS_SECTIONS.find(s => s.domain === currentDomain)?.title}.
        </AlertDescription>
      </Alert>
    );
  };

  if (!hasAnyMetricsAccess && !permissionsLoading) {
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
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Métricas</h1>
            <p className="text-muted-foreground">
              Visão geral financeira e administrativa do consultório
            </p>
          </div>
          
          {/* Layout Edit Controls (FASE C3-R.1) */}
          {!layoutLoading && (
            <div className="flex items-center gap-2">
              {!isEditMode ? (
                <Button 
                  onClick={() => setIsEditMode(true)} 
                  variant="outline"
                  size="sm"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar Layout
                </Button>
              ) : (
                <>
                  <Button 
                    onClick={handleSaveLayout} 
                    disabled={!hasUnsavedChanges || layoutSaving}
                    size="sm"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {layoutSaving ? 'Salvando...' : 'Salvar'}
                  </Button>
                  <Button 
                    onClick={handleResetLayout} 
                    variant="destructive"
                    size="sm"
                    disabled={layoutSaving}
                  >
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Resetar
                  </Button>
                  <Button 
                    onClick={handleCancelEdit} 
                    variant="ghost"
                    size="sm"
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                </>
              )}
              {hasUnsavedChanges && !isEditMode && (
                <span className="text-xs text-muted-foreground ml-2">
                  • Alterações não salvas
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Domain Selector */}
      {visibleDomains.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Domínio</CardTitle>
            <CardDescription>Selecione o tipo de métricas a visualizar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {visibleDomains.map((domain) => {
                const section = METRICS_SECTIONS.find(s => s.domain === domain);
                if (!section) return null;
                
                const isActive = currentDomain === domain;
                return (
                  <Button
                    key={domain}
                    variant={isActive ? 'default' : 'outline'}
                    onClick={() => handleDomainChange(domain)}
                    className="flex items-center gap-2"
                  >
                    {domain === 'financial' && <DollarSign className="h-4 w-4" />}
                    {domain === 'administrative' && <Users className="h-4 w-4" />}
                    {domain === 'team' && <TrendingUp className="h-4 w-4" />}
                    {domain === 'marketing' && <BarChart3 className="h-4 w-4" />}
                    {section.title}
                  </Button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

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

      {/* Current Domain Section */}
      {!isLoading && aggregatedData && (
        <Card className="overflow-hidden">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {currentDomain === 'financial' && <DollarSign className="h-5 w-5" />}
                  {currentDomain === 'administrative' && <Users className="h-5 w-5" />}
                  {currentDomain === 'team' && <TrendingUp className="h-5 w-5" />}
                  {currentDomain === 'marketing' && <BarChart3 className="h-5 w-5" />}
                  {METRICS_SECTIONS.find(s => s.domain === currentDomain)?.title}
                </CardTitle>
                <CardDescription className="mt-1">
                  {METRICS_SECTIONS.find(s => s.domain === currentDomain)?.description}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Numeric Cards Section (FASE C3-R.1 - Com GridCardContainer) */}
            {renderMetricCards()}

            {/* Sub-tabs for charts (bottom part) */}
            {availableSubTabs.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Visualizações Detalhadas</h3>
                <Tabs value={currentSubTab} onValueChange={handleSubTabChange}>
                  <TabsList className="grid w-full" style={{ gridTemplateColumns: `repeat(${availableSubTabs.length}, 1fr)` }}>
                    {availableSubTabs.map((subTab) => (
                      <TabsTrigger key={subTab.id} value={subTab.id}>
                        {subTab.label}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {availableSubTabs.map((subTab) => (
                    <TabsContent key={subTab.id} value={subTab.id} className="space-y-4">
                      {renderChartContent(subTab.id)}
                    </TabsContent>
                  ))}
                </Tabs>
              </div>
            )}
          </CardContent>
        </Card>
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
