/**
 * ============================================================================
 * DASHBOARD EXAMPLE - FASE 3D (COMPLETO)
 * ============================================================================
 * 
 * Dashboard customizável com:
 * - Resize horizontal de cards (ResizableCardSimple)
 * - Drag & drop dentro de seções (SortableCard)
 * - Persistência Supabase + localStorage (useDashboardLayout)
 * - Filtro por permissões (PermissionAwareSection)
 * - Sistema de seções com collapse
 * 
 * ============================================================================
 */

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Pencil, Save, X, RotateCcw, Loader2, CheckCircle2, AlertCircle, Sparkles, GripVertical, Plus, CalendarIcon, Settings } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { AddCardDialog } from '@/components/AddCardDialog';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DEFAULT_DASHBOARD_GRID_LAYOUT } from '@/lib/defaultLayoutDashboardExample';
import { useChartTimeScale, generateTimeIntervals, formatTimeLabel, getIntervalBounds, getScaleLabel, TimeScale } from '@/hooks/useChartTimeScale';
import { useDashboardPermissions, filterCardsByPermissions } from '@/hooks/useDashboardPermissions';
import { ALL_AVAILABLE_CARDS } from '@/types/cardTypes';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { GridCardContainer } from '@/components/GridCardContainer';
import { Card as UICard, CardContent } from '@/components/ui/card';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { renderDashboardCard } from '@/lib/dashboardCardRegistry';
import { DASHBOARD_SECTIONS } from '@/lib/defaultSectionsDashboard';
import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useOwnData } from '@/hooks/useOwnData';
import { useTeamData } from '@/hooks/useTeamData';
import { getUserIdsInOrganization } from '@/lib/organizationFilters';

export default function DashboardExample() {
  const { user, organizationId } = useAuth();
  
  // FASE 12.3: Log de inicialização
  useEffect(() => {
    console.log('[DASHBOARD] ✅ FASE 12.3 aplicada. Dashboard agora respeita level_role_settings + sharing.', {
      userId: user?.id,
      organizationId,
    });
  }, [user, organizationId]);
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [isAddCardDialogOpen, setIsAddCardDialogOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [allPatients, setAllPatients] = useState<any[]>([]);
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [period, setPeriod] = useState('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [profiles, setProfiles] = useState<any[]>([]);

  // FASE 12.1: Sistema de permissões integrado
  const { permissionContext, loading: permissionsLoading, canViewCard } = useDashboardPermissions();
  
  // 🔍 LOG: Permissões carregadas
  useEffect(() => {
    if (!permissionsLoading) {
      console.log('[PERMISSIONS] ✅ Permissões carregadas:', permissionContext);
    }
  }, [permissionsLoading, permissionContext]);

  // Buscar dados da equipe
  const { teamPatients, teamSessions, subordinateIds, loading: teamLoading } = useTeamData();

  // Filtrar dados próprios (excluindo subordinados)
  const { ownPatients, ownSessions } = useOwnData(allPatients, allSessions, subordinateIds);

  const {
    layout,
    loading,
    saving,
    isModified,
    hasUnsavedChanges,
    updateLayout,
    addCard,
    removeCard,
    saveLayout,
    resetLayout,
  } = useDashboardLayout();

  // 🔍 LOG: Layout carregado no componente
  useEffect(() => {
    console.log('[COMPONENT_LAYOUT] 📦 Layout recebido do hook:', layout);
    console.log('[COMPONENT_LAYOUT] 🔑 Keys no layout:', Object.keys(layout));
    console.log('[COMPONENT_LAYOUT] 👥 dashboard-team existe?', 'dashboard-team' in layout);
    console.log('[COMPONENT_LAYOUT] 📊 dashboard-team cardLayouts:', layout['dashboard-team']?.cardLayouts);
  }, [layout]);

  // Check if layout is customized
  const isLayoutCustomized = useMemo(() => {
    if (!layout) return false;
    
    return Object.keys(layout).some(sectionId => {
      const currentCards = layout[sectionId]?.cardLayouts || [];
      const defaultCards = DEFAULT_DASHBOARD_GRID_LAYOUT[sectionId]?.cardLayouts || [];
      
      if (currentCards.length !== defaultCards.length) return true;
      
      return currentCards.some((card: any) => {
        const defaultCard = defaultCards.find((c: any) => c.i === card.i);
        if (!defaultCard) return true;
        return card.x !== defaultCard.x || 
               card.y !== defaultCard.y || 
               card.w !== defaultCard.w || 
               card.h !== defaultCard.h;
      });
    });
  }, [layout]);

  useEffect(() => {
    if (user && !teamLoading && organizationId) {
      loadData();
    }
  }, [user, teamLoading, subordinateIds, organizationId]);

  const loadData = async () => {
    if (!organizationId) return;
    
    const orgUserIds = await getUserIdsInOrganization(organizationId);
    
    const { data: patientsData } = await supabase
      .from('patients')
      .select('*')
      .in('user_id', orgUserIds);
    
    const patientIds = (patientsData || []).map(p => p.id);
    const allPatientIds = [...patientIds, ...teamPatients.map(p => p.id)];
    
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('*')
      .in('patient_id', allPatientIds);
    
    // Buscar profiles apenas dos subordinados que pertencem à organização ativa
    let profilesData: any[] = [];
    if (subordinateIds && subordinateIds.length > 0) {
      const orgFilteredSubordinates = subordinateIds.filter(id => orgUserIds.includes(id));
      if (orgFilteredSubordinates.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name, professional_role_id, professional_roles(*)')
          .in('id', orgFilteredSubordinates)
          .order('full_name');
        profilesData = data || [];
      }
    }
    
    setAllPatients(patientsData || []);
    setAllSessions(sessionsData || []);
    setProfiles(profilesData);
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
      start = new Date('2020-01-01');
      end = now;
    } else {
      // month (padrão) - MÊS COMPLETO
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    }

    return { start, end };
  };

  const { start, end } = getDateRange();
  
  // Hook para determinar escala automática baseada no período
  const { 
    automaticScale, 
    getScale, 
    setScaleOverride, 
    clearOverride, 
    hasOverride 
  } = useChartTimeScale({ startDate: start, endDate: end });
  
  /**
   * AGREGAÇÃO DE DADOS PARA GRÁFICOS
   * Gera intervalos de tempo e calcula métricas para cada intervalo
   */
  const aggregatedData = useMemo(() => {
    return generateTimeIntervals(start, end, automaticScale).map(intervalDate => {
      const bounds = getIntervalBounds(intervalDate, automaticScale);
      
      const intervalSessions = ownSessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= bounds.start && sessionDate <= bounds.end;
      });

      const attendedCount = intervalSessions.filter(s => s.status === 'attended').length;
      const missedCount = intervalSessions.filter(s => s.status === 'missed').length;
      const pendingCount = intervalSessions.filter(s => s.status === 'pending').length;
      const paidCount = intervalSessions.filter(s => s.paid).length;
      const unpaidCount = intervalSessions.filter(s => !s.paid && s.status === 'attended').length;
      
      const totalRevenue = intervalSessions
        .filter(s => s.status === 'attended')
        .reduce((sum, s) => sum + (s.value || 0), 0);
      
      const paidRevenue = intervalSessions
        .filter(s => s.paid)
        .reduce((sum, s) => sum + (s.value || 0), 0);
      
      const unpaidRevenue = intervalSessions
        .filter(s => !s.paid && s.status === 'attended')
        .reduce((sum, s) => sum + (s.value || 0), 0);

      return {
        label: formatTimeLabel(intervalDate, automaticScale),
        interval: intervalDate,
        attended: attendedCount,
        missed: missedCount,
        pending: pendingCount,
        paid: paidCount,
        unpaid: unpaidCount,
        totalRevenue,
        paidRevenue,
        unpaidRevenue,
        total: intervalSessions.length,
      };
    });
  }, [start, end, automaticScale, ownSessions]);

  /**
   * AGREGAÇÃO DE DADOS DA EQUIPE
   */
  const teamAggregatedData = useMemo(() => {
    return generateTimeIntervals(start, end, automaticScale).map(intervalDate => {
      const bounds = getIntervalBounds(intervalDate, automaticScale);
      
      const intervalSessions = teamSessions.filter(session => {
        const sessionDate = new Date(session.date);
        return sessionDate >= bounds.start && sessionDate <= bounds.end;
      });

      const attendedCount = intervalSessions.filter(s => s.status === 'attended').length;
      const missedCount = intervalSessions.filter(s => s.status === 'missed').length;
      const pendingCount = intervalSessions.filter(s => s.status === 'pending').length;
      const paidCount = intervalSessions.filter(s => s.paid).length;
      const unpaidCount = intervalSessions.filter(s => !s.paid && s.status === 'attended').length;
      
      const totalRevenue = intervalSessions
        .filter(s => s.status === 'attended')
        .reduce((sum, s) => sum + (s.value || 0), 0);
      
      const paidRevenue = intervalSessions
        .filter(s => s.paid)
        .reduce((sum, s) => sum + (s.value || 0), 0);
      
      const unpaidRevenue = intervalSessions
        .filter(s => !s.paid && s.status === 'attended')
        .reduce((sum, s) => sum + (s.value || 0), 0);

      return {
        label: formatTimeLabel(intervalDate, automaticScale),
        interval: intervalDate,
        attended: attendedCount,
        missed: missedCount,
        pending: pendingCount,
        paid: paidCount,
        unpaid: unpaidCount,
        totalRevenue,
        paidRevenue,
        unpaidRevenue,
        total: intervalSessions.length,
      };
    });
  }, [start, end, automaticScale, teamSessions]);

  /**
   * HANDLER: Salvar layout
   */
  const handleSave = async () => {
    await saveLayout();
    setIsEditMode(false);
    toast.success('Layout salvo com sucesso!');
  };

  /**
   * HANDLER: Cancelar edição
   */
  const handleCancel = () => {
    if (isModified) {
      const confirm = window.confirm(
        'Você tem mudanças não salvas. Deseja descartar?'
      );
      if (!confirm) return;
    }
    window.location.reload();
  };

  /**
   * HANDLER: Resetar layout
   */
  const handleReset = async () => {
    await resetLayout();
    setShowResetDialog(false);
    toast.success('Layout restaurado para o padrão!');
    setTimeout(() => window.location.reload(), 500);
  };

  /**
   * HANDLER: Toggle seção colapsada
   */
  const toggleSectionCollapse = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  /**
   * RENDER: Indicador de status
   */
  const renderStatusIndicator = () => {
    if (saving) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Salvando...</span>
        </div>
      );
    }

    if (isModified) {
      return (
        <div className="flex items-center gap-2 text-sm text-yellow-600">
          <AlertCircle className="h-4 w-4" />
          <span>Mudanças não salvas</span>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <CheckCircle2 className="h-4 w-4 text-green-500" />
        <span>Layout salvo</span>
      </div>
    );
  };

  // FASE 12.1: Filtrar seções visíveis baseado em permissões
  // IMPORTANTE: Este useMemo DEVE estar antes do early return para evitar erro de hooks
  const visibleSections = useMemo(() => {
    if (!permissionContext) return {};
    if (permissionsLoading) return {}; // ⚠️ não filtra sections enquanto permissões estiverem carregando
    
    const filtered: Record<string, typeof DASHBOARD_SECTIONS[string]> = {};
    
    Object.entries(DASHBOARD_SECTIONS).forEach(([sectionId, section]) => {
      // Verificar se seção tem algum card visível
      const sectionCards = ALL_AVAILABLE_CARDS.filter(card => 
        section.availableCardIds.includes(card.id)
      );
      const visibleCards = filterCardsByPermissions(sectionCards, permissionContext);
      
      // 🎯 LOG ESPECÍFICO PARA DASHBOARD-TEAM
      if (sectionId === 'dashboard-team') {
        console.log('[TEAM_DEBUG] 🔎 Detalhes completos de dashboard-team', {
          sectionId,
          totalCards: sectionCards.length,
          visibleCards: visibleCards.length,
          permissionContext,
          cardsDetailed: sectionCards.map(card => ({
            id: card.id,
            domain: card.permissionConfig?.domain,
            isVisible: visibleCards.some(vc => vc.id === card.id),
          })),
        });
      }
      
      console.log('[VISIBLE_SECTIONS_CALC] 🔍 Seção:', sectionId, {
        totalCards: sectionCards.length,
        visibleCards: visibleCards.length,
        willInclude: visibleCards.length > 0
      });
      
      // Só incluir seção se tiver pelo menos um card visível
      if (visibleCards.length > 0) {
        filtered[sectionId] = section;
      }
    });
    
    console.log('[VISIBLE_SECTIONS] ✅ Seções finais visíveis:', Object.keys(filtered));
    console.log('[VISIBLE_SECTIONS] 👥 dashboard-team está visível?', 'dashboard-team' in filtered);
    return filtered;
  }, [permissionContext, permissionsLoading]);

  // FASE 12.1: Aguardar carregamento de permissões
  if (loading || permissionsLoading) {
    return (
      <Layout>
        <div className="space-y-6 p-6 animate-fade-in">
          {/* Header skeleton */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
          
          {/* Sections skeleton */}
          {[1, 2].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="h-6 w-48" />
              <div className="flex gap-4">
                <Skeleton className="h-64 w-80" />
                <Skeleton className="h-64 w-80" />
                <Skeleton className="h-64 w-80" />
              </div>
            </div>
          ))}
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-6 animate-fade-in">
        {/* Header com controles */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Dashboard Customizável</h1>
              <p className="text-muted-foreground">
                Organize seu painel de controle
              </p>
            </div>

            {/* Period Filter - Compacto */}
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="z-50 bg-background">
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

            {period === 'custom' && (
              <>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-[130px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customStartDate ? format(new Date(customStartDate + 'T00:00:00'), 'dd/MM', { locale: ptBR }) : 'Início'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 bg-background" align="start">
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

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="w-[130px] justify-start text-left font-normal">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {customEndDate ? format(new Date(customEndDate + 'T00:00:00'), 'dd/MM', { locale: ptBR }) : 'Fim'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-50 bg-background" align="start">
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
              </>
            )}
          </div>

            <div className="flex items-center gap-3">
              {/* Badge Personalizado */}
              {isLayoutCustomized && (
                <Badge variant="secondary" className="text-xs">
                  Personalizado
                </Badge>
              )}

              {/* Status indicator */}
              {renderStatusIndicator()}

            {/* Controles de edição */}
            {isEditMode ? (
              <>
                <Button
                  onClick={() => setIsAddCardDialogOpen(true)}
                  variant="default"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Card
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving || !isModified}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
                <Button variant="outline" onClick={handleCancel} size="sm">
                  <X className="h-4 w-4 mr-2" />
                  Cancelar
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowResetDialog(true)}
                  size="sm"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Resetar
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setIsEditMode(true)}
                size="sm"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Editar Layout
              </Button>
            )}
            </div>
          </div>

        {/* Instruções em edit mode */}
        {isEditMode && (
          <Card className="bg-primary/5 border-primary/20 animate-scale-in">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                Modo de Edição Ativo
              </CardTitle>
              <div className="text-xs text-muted-foreground space-y-1 mt-2">
                <p>• <strong>Arraste</strong> o ícone 
                  <GripVertical className="inline h-3 w-3 mx-1" /> 
                  à esquerda para reordenar cards
                </p>
                <p>• <strong>Redimensione</strong> usando a alça à direita do card</p>
                <p>• <strong>Auto-save</strong> ativado - mudanças são salvas automaticamente após 2s</p>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Renderizar seções */}
        <div className="space-y-6">
          {Object.entries(visibleSections).map(([sectionId, sectionConfig]) => {
            const section = layout[sectionId];
            
            console.log('[RENDER_SECTION] 🎨 Tentando renderizar:', {
              sectionId,
              sectionConfig: sectionConfig.name,
              section,
              hasSection: !!section,
              cardLayoutsCount: section?.cardLayouts?.length || 0
            });
            
            if (!section || !section.cardLayouts.length) {
              console.log('[RENDER_SECTION] ⚠️ PULANDO seção (vazia ou sem permissão):', sectionId);
              // Seção vazia ou sem permissão
              return null;
            }

            const cardLayouts = section.cardLayouts;
            const isCollapsed = collapsedSections.has(sectionId);

            return (
              <div key={sectionId} className="space-y-3">
                {/* Section Header */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => toggleSectionCollapse(sectionId)}
                    className="flex items-center gap-2 group hover:opacity-80 transition-all duration-200"
                  >
                    <h2 className="text-xl font-semibold group-hover:text-primary transition-colors">
                      {sectionConfig.name}
                    </h2>
                    {isCollapsed ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all duration-200 group-hover:scale-110" />
                    ) : (
                      <ChevronUp className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-all duration-200 group-hover:scale-110" />
                    )}
                  </button>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {cardLayouts.length} {cardLayouts.length === 1 ? 'card' : 'cards'}
                    </Badge>
                  </div>
                </div>

                {/* Section Content */}
                {!isCollapsed && (
                  <div className="animate-accordion-down">
                    <div className={cn(
                      'p-4 rounded-lg min-h-[200px] transition-all duration-300 relative',
                      isEditMode && 'bg-muted/20 border-2 border-dashed border-primary/30 shadow-inner'
                    )}>
                      {/* Grid de fundo em edit mode */}
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
                        sectionId={sectionId}
                        layout={cardLayouts}
                        onLayoutChange={(newLayout) => {
                          updateLayout(sectionId, newLayout);
                          toast.success('Layout atualizado!', {
                            description: 'Salvando automaticamente...',
                          });
                        }}
                        isEditMode={isEditMode}
                        width={1200}
                      >
                        {cardLayouts.length === 0 && (
                          <div className="w-full flex flex-col items-center justify-center py-12 text-center">
                            <div className="rounded-full bg-muted p-4 mb-4">
                              <AlertCircle className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Nenhum card disponível nesta seção
                            </p>
                          </div>
                        )}
                        {cardLayouts.map((cardLayout) => {
                          // FASE 12.1: Verificar permissão do card antes de renderizar
                          const card = ALL_AVAILABLE_CARDS.find(c => c.id === cardLayout.i);
                          if (!card || !canViewCard(card)) {
                            return null;
                          }

                          return (
                            <div key={cardLayout.i} data-grid={cardLayout}>
                              <UICard className="h-full flex flex-col shadow-md hover:shadow-lg transition-shadow">
                                {isEditMode && (
                                  <div className="drag-handle cursor-move bg-primary/10 hover:bg-primary/20 active:bg-primary/30 p-2 border-b flex items-center justify-center group transition-colors">
                                    <GripVertical className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                                  </div>
                                )}
                                <CardContent className="p-4 flex-1 overflow-auto">
                                  {renderDashboardCard(cardLayout.i, {
                                    isEditMode,
                                    patients: sectionId === 'dashboard-team' ? teamPatients : ownPatients,
                                    sessions: sectionId === 'dashboard-team' ? teamSessions : ownSessions,
                                    profiles,
                                    start,
                                    end,
                                    automaticScale,
                                    getScale,
                                    setScaleOverride,
                                    clearOverride,
                                    hasOverride,
                                    aggregatedData: sectionId === 'dashboard-team' ? teamAggregatedData : aggregatedData,
                                  })}
                                </CardContent>
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
                )}
              </div>
            );
          })}
        </div>

        {/* Dialog de confirmação de reset */}
        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Resetar Layout?</AlertDialogTitle>
              <AlertDialogDescription>
                Isso irá restaurar o layout para o padrão e remover todas as
                suas customizações (larguras e ordem dos cards). Esta ação não
                pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleReset}>
                Confirmar Reset
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Aviso de mudanças não salvas ao sair */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-4 right-4 z-50 animate-slide-in-right">
            <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 shadow-lg backdrop-blur-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                  <AlertCircle className="h-4 w-4 animate-pulse" />
                  <span className="font-medium">
                    Você tem mudanças não salvas
                  </span>
                </div>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Dialog para adicionar cards */}
        <AddCardDialog
          open={isAddCardDialogOpen}
          onOpenChange={setIsAddCardDialogOpen}
          onAddCard={(sectionId: string, cardId: string) => {
            addCard(sectionId, cardId);
            toast.success('Card adicionado!');
          }}
          onRemoveCard={(sectionId: string, cardId: string) => {
            removeCard(sectionId, cardId);
            toast.success('Card removido!');
          }}
          sectionCards={Object.fromEntries(
            Object.entries(layout).map(([sectionId, section]) => [
              sectionId,
              section.cardLayouts.map(cl => cl.i)
            ])
          )}
        />
      </div>
    </Layout>
  );
}
