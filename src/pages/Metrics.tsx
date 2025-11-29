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
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffectivePermissions } from '@/hooks/useEffectivePermissions';
import { useDashboardPermissions } from '@/hooks/useDashboardPermissions';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { useChartTimeScale } from '@/hooks/useChartTimeScale';
import { useOwnData } from '@/hooks/useOwnData';
import { useTeamData } from '@/hooks/useTeamData';
import { ResizableSection } from '@/components/ResizableSection';
import { GridCardContainer } from '@/components/GridCardContainer';
import type { GridCardLayout } from '@/types/cardTypes';
import { findNextAvailablePosition } from '@/lib/gridLayoutUtils';
import { Card as UICard } from '@/components/ui/card';
import { GripVertical } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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

// Import metrics card registry (FASE C3-R.8)
import { getMetricsCardById, getMetricsCardsByDomain, canUserViewCard } from '@/lib/metricsCardRegistry';

// Import metrics charts registry (FASE 2)
import { getMetricsChartById, type MetricsChartDomain } from '@/lib/metricsChartsRegistry';

// Import charts selection hook (FASE 2 - Persistência via Supabase)
import { useMetricsChartsSelection } from '@/hooks/useMetricsChartsSelection';

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

// Import chart components (FASE C3.7 + C3-R.4)
import { FinancialTrendsChart } from '@/components/charts/metrics/financial/FinancialTrendsChart';
import { FinancialPerformanceChart } from '@/components/charts/metrics/financial/FinancialPerformanceChart';
import { FinancialDistributionsChart } from '@/components/charts/metrics/financial/FinancialDistributionsChart';
import { FinancialRevenueDistributionChart } from '@/components/charts/metrics/financial/FinancialRevenueDistributionChart';
import { FinancialSessionStatusChart } from '@/components/charts/metrics/financial/FinancialSessionStatusChart';
import { FinancialMonthlyPerformanceChart } from '@/components/charts/metrics/financial/FinancialMonthlyPerformanceChart';
import { FinancialWeeklyComparisonChart } from '@/components/charts/metrics/financial/FinancialWeeklyComparisonChart';
import { FinancialRevenueTrendChart } from '@/components/charts/metrics/financial/FinancialRevenueTrendChart';
import { FinancialForecastVsActualChart } from '@/components/charts/metrics/financial/FinancialForecastVsActualChart';
import { FinancialConversionRateChart } from '@/components/charts/metrics/financial/FinancialConversionRateChart';
import { FinancialTicketComparisonChart } from '@/components/charts/metrics/financial/FinancialTicketComparisonChart';
import { FinancialInactiveByMonthChart } from '@/components/charts/metrics/financial/FinancialInactiveByMonthChart';
import { FinancialMissedByPatientChart } from '@/components/charts/metrics/financial/FinancialMissedByPatientChart';
import { FinancialLostRevenueChart } from '@/components/charts/metrics/financial/FinancialLostRevenueChart';
import { FinancialRetentionRateChart } from '@/components/charts/metrics/financial/FinancialRetentionRateChart';
import { FinancialNewVsInactiveChart } from '@/components/charts/metrics/financial/FinancialNewVsInactiveChart';
import { FinancialTopPatientsChart } from '@/components/charts/metrics/financial/FinancialTopPatientsChart';
import { AdminRetentionChart } from '@/components/charts/metrics/administrative/AdminRetentionChart';
import { AdminPerformanceChart } from '@/components/charts/metrics/administrative/AdminPerformanceChart';
import { AdminDistributionsChart } from '@/components/charts/metrics/administrative/AdminDistributionsChart';
import { AdminFrequencyDistributionChart } from '@/components/charts/metrics/administrative/AdminFrequencyDistributionChart';
import { AdminAttendanceRateChart } from '@/components/charts/metrics/administrative/AdminAttendanceRateChart';
import { AdminWeeklyOccupationChart } from '@/components/charts/metrics/administrative/AdminWeeklyOccupationChart';
import { AdminChurnRetentionChart } from '@/components/charts/metrics/administrative/AdminChurnRetentionChart';
import { MarketingWebsiteOverviewChart } from '@/components/charts/metrics/marketing/MarketingWebsiteOverviewChart';
import { TeamIndividualPerformanceChart } from '@/components/charts/metrics/team/TeamIndividualPerformanceChart';
import { TeamRevenueComparisonChart } from '@/components/charts/metrics/team/TeamRevenueComparisonChart';
import { TeamPatientDistributionChart } from '@/components/charts/metrics/team/TeamPatientDistributionChart';
import { TeamWorkloadChart } from '@/components/charts/metrics/team/TeamWorkloadChart';
import { TeamMonthlyEvolutionChart } from '@/components/charts/metrics/team/TeamMonthlyEvolutionChart';
import { TeamOccupationByMemberChart } from '@/components/charts/metrics/team/TeamOccupationByMemberChart';
import { TeamAttendanceByTherapistChart } from '@/components/charts/metrics/team/TeamAttendanceByTherapistChart';
import { RegisterPaymentDialog } from '@/components/RegisterPaymentDialog';
import { MetricsAddCardDialog } from '@/components/MetricsAddCardDialog';
import { Plus } from 'lucide-react';

type Period = 'week' | 'month' | 'year' | 'custom';

const Metrics = () => {
  const { user, organizationId } = useAuth();
  const { permissions, loading: permissionsLoading } = useEffectivePermissions();
  const { permissionContext } = useDashboardPermissions();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

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
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showAddCardDialog, setShowAddCardDialog] = useState(false);

  // FASE 2: Charts selection (agora via hook dedicado)
  const {
    chartsSelection,
    isLoading: chartsSelectionLoading,
    addChart,
    removeChart,
  } = useMetricsChartsSelection();

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

  // Chart time scale integration (FASE C3-R.2)
  // Calculate chartId for current domain/subTab
  const currentChartId = `metrics-${currentDomain}-${currentSubTab}`;
  
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

  // Get current time scale for charts (moved here from renderChartContent)
  const currentTimeScale = getScale(currentChartId);

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

      // ✅ FASE 1.2.1: Adicionar join com patients para trazer nome
      const result = await (supabase as any)
        .from('sessions')
        .select(`
          *,
          patients!inner (
            name,
            user_id
          )
        `)
        .in('patients.user_id', orgUserIds)
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

    return rawSessions.map((s: any) => ({
      id: s.id,
      patient_id: s.patient_id,
      date: s.date,
      status: (s.status === 'scheduled' ? 'rescheduled' : s.status) as 'attended' | 'missed' | 'cancelled' | 'rescheduled',
      value: s.value || 0,
      show_in_schedule: s.show_in_schedule,  // ✅ FASE 1.2.1: Adicionar
      patients: s.patients ? { name: s.patients.name } : undefined,  // ✅ FASE 1.2.1: Adicionar
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

  // 🔥 FASE 1.1 CORRIGIDA: Fonte única de dados + derivação em memória
  const { subordinateIds, loading: teamLoading } = useTeamData();
  
  const { ownPatients, ownSessions } = useOwnData(
    metricsPatients, 
    metricsSessions, 
    subordinateIds
  );

  // 🔥 CORREÇÃO 3: Derivar teamPatients e teamSessions em memória (não duplicar queries)
  const teamPatients = useMemo(() => {
    if (subordinateIds.length === 0) return [];
    return metricsPatients.filter(p => subordinateIds.includes(p.user_id));
  }, [metricsPatients, subordinateIds]);

  const teamSessions = useMemo(() => {
    if (teamPatients.length === 0) return [];
    const teamPatientIds = new Set(teamPatients.map(p => p.id));
    return metricsSessions.filter(s => teamPatientIds.has(s.patient_id));
  }, [metricsSessions, teamPatients]);

  // Aggregate OWN data (for financial/administrative domains)
  const ownAggregatedData = useMemo(() => {
    if (!ownPatients || !ownSessions) return null;

    try {
      const summary = getFinancialSummary({
        sessions: ownSessions,
        patients: ownPatients,
        start: dateRange.start,
        end: dateRange.end,
      });

      const trends = getFinancialTrends({
        sessions: ownSessions,
        patients: ownPatients,
        start: dateRange.start,
        end: dateRange.end,
        timeScale: automaticScale,
      });

      const retention = getRetentionAndChurn({
        patients: ownPatients,
        start: dateRange.start,
        end: dateRange.end,
      });

      return {
        summary,
        trends,
        retention,
      };
    } catch (error) {
      console.error('[Metrics] Error calculating own aggregated data:', error);
      return null;
    }
  }, [ownPatients, ownSessions, dateRange.start, dateRange.end, automaticScale]);

  // Aggregate TEAM data (for team domain)
  const teamAggregatedData = useMemo(() => {
    if (!teamPatients || !teamSessions) return null;

    try {
      const summary = getFinancialSummary({
        sessions: teamSessions,
        patients: teamPatients,
        start: dateRange.start,
        end: dateRange.end,
      });

      const trends = getFinancialTrends({
        sessions: teamSessions,
        patients: teamPatients,
        start: dateRange.start,
        end: dateRange.end,
        timeScale: automaticScale,
      });

      const retention = getRetentionAndChurn({
        patients: teamPatients,
        start: dateRange.start,
        end: dateRange.end,
      });

      return {
        summary,
        trends,
        retention,
      };
    } catch (error) {
      console.error('[Metrics] Error calculating team aggregated data:', error);
      return null;
    }
  }, [teamPatients, teamSessions, dateRange.start, dateRange.end, automaticScale]);

  const isLoading = patientsLoading || sessionsLoading || layoutLoading || permissionsLoading || chartsSelectionLoading;

  // Permission check
  const hasAnyMetricsAccess = visibleDomains.length > 0;

  // Prepare props for metric cards
  const periodFilter: MetricsPeriodFilter = {
    type: period,
    startDate: dateRange.start,
    endDate: dateRange.end,
  };

  const cardsLoading = patientsLoading || sessionsLoading || profileLoading || blocksLoading || teamLoading;
  
  // Select data based on current domain
  const currentAggregatedData = currentDomain === 'team' ? teamAggregatedData : ownAggregatedData;
  const summary = currentAggregatedData?.summary ?? null;
  const trends = currentAggregatedData?.trends ?? [];
  const retention = currentAggregatedData?.retention ?? null;

  // Select patients/sessions based on current domain
  const currentPatients = currentDomain === 'team' ? teamPatients : ownPatients;
  const currentSessions = currentDomain === 'team' ? teamSessions : ownSessions;

  // Get current section layout for GridCardContainer (FASE C3-R.1)
  const currentSectionId = `metrics-${currentDomain}`;
  const currentSectionLayout = useMemo(() => {
    if (!metricsLayout || !metricsLayout[currentSectionId]) return [];
    return metricsLayout[currentSectionId].cardLayouts || [];
  }, [metricsLayout, currentSectionId]);

  // Helper: Map card ID to component using registry (FASE C3-R.8)
  const getCardComponent = (cardId: string) => {
    const cardDef = getMetricsCardById(cardId);
    if (!cardDef) return null;

    const CardComponent = cardDef.component;

    // Determine props based on card domain
    // Financial and Administrative cards need full props
    if (cardDef.domain === 'financial' || cardDef.domain === 'administrative') {
      return (
        <CardComponent
          periodFilter={periodFilter}
          summary={summary}
          isLoading={cardsLoading}
        />
      );
    }

    // Marketing cards are mocked and only need isLoading
    if (cardDef.domain === 'marketing') {
      return <CardComponent isLoading={cardsLoading} />;
    }

    // Team cards (future implementation)
    return null;
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

  // Get existing card IDs for current section (FASE 1.3)
  const getExistingCardIds = (): string[] => {
    if (!metricsLayout || !metricsLayout[currentSectionId]) return [];
    return metricsLayout[currentSectionId].cardLayouts.map(c => c.i);
  };

  // Handler to add a card (FASE 1.3)
  const handleAddCard = (cardId: string) => {
    if (!metricsLayout) return;
    
    const existingCardIds = getExistingCardIds();
    if (existingCardIds.includes(cardId)) {
      console.warn(`Card ${cardId} already exists in layout`);
      return;
    }

    const cardDef = getMetricsCardById(cardId);
    if (!cardDef) {
      console.error(`Card definition not found for ${cardId}`);
      return;
    }

    // Find next available position in grid
    const existingLayout = metricsLayout[currentSectionId]?.cardLayouts || [];
    const nextPosition = findNextAvailablePosition(existingLayout);

    // Create new layout item with default dimensions
    const newLayoutItem: GridCardLayout = {
      i: cardId,
      x: nextPosition.x,
      y: nextPosition.y,
      w: cardDef.defaultLayout?.w || 4,
      h: cardDef.defaultLayout?.h || 2,
      minW: cardDef.defaultLayout?.minW,
      minH: cardDef.defaultLayout?.minH,
      maxW: cardDef.defaultLayout?.maxW,
      maxH: cardDef.defaultLayout?.maxH,
    };

    // Update layout
    const updatedLayout = [...existingLayout, newLayoutItem];
    updateLayout(currentSectionId, updatedLayout);
  };

  // Handler to remove a card (FASE 1.3)
  const handleRemoveCard = (cardId: string) => {
    if (!metricsLayout) return;

    const existingLayout = metricsLayout[currentSectionId]?.cardLayouts || [];
    const updatedLayout = existingLayout.filter(c => c.i !== cardId);
    updateLayout(currentSectionId, updatedLayout);
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
        {/* ✅ FASE 2.1: Container wrapper com padding, min-height e visual feedback */}
        <div className={cn(
          'p-4 rounded-lg min-h-[200px] transition-all duration-300 relative',
          isEditMode && 'bg-muted/20 border-2 border-dashed border-primary/30 shadow-inner'
        )}>
          {/* ✅ Grid de fundo em edit mode */}
          {isEditMode && (
            <div 
              className="absolute inset-0 pointer-events-none opacity-10 z-0 rounded-lg"
              style={{
                backgroundImage: 'linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)',
                backgroundSize: '100px 60px',
              }}
            />
          )}
          
          <GridCardContainer
            sectionId={currentSectionId}
            layout={currentSectionLayout}
            onLayoutChange={(newLayout) => updateLayout(currentSectionId, newLayout)}
            isEditMode={isEditMode}
            width={1200}
          >
          {currentSectionLayout.map((cardLayout) => {
            const CardComponent = getCardComponent(cardLayout.i);
            return (
              <div key={cardLayout.i} data-grid={cardLayout}>
                {/* ✅ FASE 2.2: Card externo com estrutura correta */}
                <UICard className="h-full flex flex-col shadow-md hover:shadow-lg transition-shadow">
                  {/* ✅ Drag handle visível apenas em edit mode */}
                  {isEditMode && (
                    <div className="drag-handle cursor-move bg-primary/10 hover:bg-primary/20 active:bg-primary/30 p-2 border-b flex items-center justify-center group transition-colors">
                      <GripVertical className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    </div>
                  )}
                  
                  {/* ✅ Conteúdo do card */}
                  <CardContent className="p-4 flex-1 overflow-auto">
                    {CardComponent}
                  </CardContent>
                  
                  {/* ✅ Badge de dimensões em edit mode */}
                  {isEditMode && (
                    <Badge variant="secondary" className="absolute top-2 right-2 text-xs z-10">
                      {cardLayout.w} × {cardLayout.h}
                    </Badge>
                  )}
                </UICard>
              </div>
            );
          })}
          </GridCardContainer>
        </div>
      </div>
    );
  };

  // FASE 2: Render chart content dinamicamente baseado na seleção
  // Agora ao invés de hardcode, renderiza apenas os gráficos selecionados
  const renderChartContent = (subTabId: string) => {
    const chartTimeScale = getScale(`metrics-${currentDomain}-${subTabId}`);
    const domain = currentDomain as MetricsChartDomain;
    
    // Obter gráficos selecionados para este domínio/sub-tab
    const selectedCharts = (chartsSelection[domain] || [])
      .map(chartId => getMetricsChartById(chartId))
      .filter(chartDef => chartDef && chartDef.subTab === subTabId);

    if (selectedCharts.length === 0) {
      return (
        <Alert>
          <AlertDescription>
            Nenhum gráfico selecionado para esta visualização. Use o botão "Adicionar Cards" para gerenciar os gráficos.
          </AlertDescription>
        </Alert>
      );
    }

    return (
      <div className="grid gap-6">
        {selectedCharts.map((chartDef) => {
          if (!chartDef) return null;
          
          const ChartComponent = chartDef.component;
          
          // Props comuns a todos os charts
          const commonProps = {
            periodFilter,
            timeScale: chartTimeScale,
            isLoading: cardsLoading,
          };

          // Determinar props adicionais baseado no tipo de chart
          // Alguns charts precisam de trends, outros de sessions/patients, etc
          let additionalProps = {};
          
          // Charts que usam trends
          if (chartDef.id.includes('trend') || chartDef.id.includes('performance') || 
              chartDef.id.includes('monthly') || chartDef.id.includes('weekly') || 
              chartDef.id.includes('inactive') || chartDef.id.includes('evolution') ||
              chartDef.id.includes('attendance-rate')) {
            additionalProps = { trends };
          }
          
          // Charts que usam summary
          if (chartDef.id.includes('distribution') || chartDef.id.includes('status')) {
            additionalProps = { ...additionalProps, summary };
          }
          
          // Charts que usam sessions/patients
          if (chartDef.id.includes('missed') || chartDef.id.includes('lost') || 
              chartDef.id.includes('ticket') || chartDef.id.includes('top-patients') ||
              chartDef.id.includes('individual') || chartDef.id.includes('revenue-comparison') ||
              chartDef.id.includes('patient-distribution') || chartDef.id.includes('workload') ||
              chartDef.id.includes('frequency')) {
            additionalProps = { 
              ...additionalProps, 
              sessions: currentSessions, 
              patients: currentPatients 
            };
          }
          
          // Charts que usam retention
          if (chartDef.id.includes('retention') && chartDef.id.includes('admin')) {
            additionalProps = { ...additionalProps, retention };
          }
          
          // Charts específicos de team que precisam de profiles
          if (chartDef.domain === 'team') {
            additionalProps = { 
              ...additionalProps,
              profiles: {}, // TODO: Fetch team profiles in future
            };
            
            // Team charts que precisam de sessions/patients (já adicionados acima)
            if (chartDef.id.includes('individual') || chartDef.id.includes('revenue-comparison')) {
              additionalProps = {
                ...additionalProps,
                sessions: metricsSessions,
                patients: metricsPatients,
              };
            }
            
            // TeamWorkloadChart precisa de scheduleBlocks
            if (chartDef.id.includes('workload')) {
              additionalProps = {
                ...additionalProps,
                scheduleBlocks: metricsScheduleBlocks,
              };
            }
            
            // TeamOccupationByMemberChart e TeamAttendanceByTherapistChart precisam de scheduleBlocks
            if (chartDef.id.includes('occupation-by-member') || chartDef.id.includes('attendance-by-therapist')) {
              additionalProps = {
                ...additionalProps,
                scheduleBlocks: metricsScheduleBlocks,
              };
            }
          }
          
          // AdminWeeklyOccupationChart precisa de profile e scheduleBlocks
          if (chartDef.id === 'admin-weekly-occupation-chart') {
            additionalProps = {
              ...additionalProps,
              profile: metricsProfile,
              scheduleBlocks: metricsScheduleBlocks,
            };
          }
          
          // Charts de retenção financeira que precisam de patients
          if (chartDef.id.includes('retention-rate') || chartDef.id.includes('new-vs-inactive')) {
            additionalProps = {
              ...additionalProps,
              patients: currentPatients,
            };
          }
          
          // ForecastVsActual precisa de summary também
          if (chartDef.id.includes('forecast')) {
            additionalProps = { ...additionalProps, summary };
          }

          return (
            <Card key={chartDef.id}>
              <CardHeader>
                <CardTitle>{chartDef.title}</CardTitle>
                <CardDescription>{chartDef.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartComponent {...commonProps} {...additionalProps} />
              </CardContent>
            </Card>
          );
        })}
      </div>
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
          
          {/* Financial Domain: NFSe Button (FASE C3-R.7) */}
          {currentDomain === 'financial' && (
            <Button 
              onClick={() => setShowPaymentDialog(true)} 
              variant="default"
              size="sm"
              className="ml-2"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Registrar Pagamento NFSe
            </Button>
          )}
          
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
                    onClick={() => setShowAddCardDialog(true)} 
                    variant="outline"
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Cards
                  </Button>
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
      {!isLoading && currentAggregatedData && (
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
      {!isLoading && currentAggregatedData && process.env.NODE_ENV === 'development' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Debug: Dados Agregados (Dev Only)</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs overflow-auto max-h-96 bg-muted p-4 rounded-md">
              {JSON.stringify(
                {
                  summary: currentAggregatedData.summary,
                  trendsCount: currentAggregatedData.trends.length,
                  retention: currentAggregatedData.retention,
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
      
      {/* NFSe Payment Dialog (FASE C3-R.7) */}
      <RegisterPaymentDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        onSuccess={() => {
          // Refetch queries on success
          queryClient.invalidateQueries({ queryKey: ['metrics-patients'] });
          queryClient.invalidateQueries({ queryKey: ['metrics-sessions'] });
        }}
      />

      {/* Add Card Dialog (FASE 2 - MetricsAddCardDialog com gráficos) */}
      <MetricsAddCardDialog
        open={showAddCardDialog}
        onOpenChange={setShowAddCardDialog}
        domainKey={currentDomain}
        existingCardIds={getExistingCardIds()}
        onAddCard={(domainKey: string, cardId: string) => handleAddCard(cardId)}
        onRemoveCard={(domainKey: string, cardId: string) => handleRemoveCard(cardId)}
        selectedChartIds={chartsSelection[currentDomain as MetricsChartDomain] || []}
        onAddChart={(domainKey: string, chartId: string) => addChart(domainKey as MetricsChartDomain, chartId)}
        onRemoveChart={(domainKey: string, chartId: string) => removeChart(domainKey as MetricsChartDomain, chartId)}
      />
    </div>
  );
};

export default Metrics;
