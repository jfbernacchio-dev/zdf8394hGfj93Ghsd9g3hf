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

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Pencil, Save, X, RotateCcw, Loader2, CheckCircle2, AlertCircle, Sparkles, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
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
import { SortableCardContainer } from '@/components/SortableCardContainer';
import { SortableCard } from '@/components/SortableCard';
import { ResizableCardSimple } from '@/components/ResizableCardSimple';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { renderDashboardCard } from '@/lib/dashboardCardRegistry';
import { DASHBOARD_SECTIONS } from '@/lib/defaultSectionsDashboard';
import Layout from '@/components/Layout';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function DashboardExample() {
  const { user } = useAuth();
  const [isEditMode, setIsEditMode] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const [patients, setPatients] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [period, setPeriod] = useState('month');

  const {
    layout,
    loading,
    saving,
    isModified,
    hasUnsavedChanges,
    updateCardWidth,
    updateCardOrder,
    saveLayout,
    resetLayout,
  } = useDashboardLayout();

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    const { data: patientsData } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', user!.id);
    
    const patientIds = (patientsData || []).map(p => p.id);
    
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('*')
      .in('patient_id', patientIds);
    
    setPatients(patientsData || []);
    setSessions(sessionsData || []);
  };

  const getDateRange = () => {
    const now = new Date();
    let start: Date, end: Date;

    if (period === 'week') {
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      end = now;
    } else if (period === 'lastMonth') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0);
    } else {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = now;
    }

    return { start, end };
  };

  const { start, end } = getDateRange();

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

  if (loading) {
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
          <div>
            <h1 className="text-3xl font-bold">Dashboard Customizável</h1>
            <p className="text-muted-foreground">
              Organize seu painel de controle
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Status indicator */}
            {renderStatusIndicator()}

            {/* Controles de edição */}
            {isEditMode ? (
              <>
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
          {Object.entries(DASHBOARD_SECTIONS).map(([sectionId, sectionConfig]) => {
            const section = layout[sectionId];
            if (!section || !section.cardLayouts.length) {
              // Seção vazia ou sem permissão
              return null;
            }

            const sortedCards = [...section.cardLayouts].sort(
              (a, b) => a.order - b.order
            );
            const cardIds = sortedCards.map((cl) => cl.cardId);
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
                      {sortedCards.length} {sortedCards.length === 1 ? 'card' : 'cards'}
                    </Badge>
                  </div>
                </div>

                {/* Section Content */}
                {!isCollapsed && (
                  <div className="animate-accordion-down">
                  <SortableCardContainer
                    sectionId={sectionId}
                    cardIds={cardIds}
                    onReorder={(newIds) => {
                      updateCardOrder(sectionId, newIds);
                      toast.success('Ordem atualizada!', {
                        description: 'Salvando automaticamente...',
                      });
                    }}
                    isEditMode={isEditMode}
                    strategy="horizontal"
                    className={cn(
                      'flex flex-wrap gap-4 p-4 rounded-lg min-h-[200px] transition-all duration-300',
                      isEditMode && 'bg-muted/20 border-2 border-dashed border-primary/30 shadow-inner'
                    )}
                  >
                    {sortedCards.length === 0 && (
                      <div className="w-full flex flex-col items-center justify-center py-12 text-center">
                        <div className="rounded-full bg-muted p-4 mb-4">
                          <AlertCircle className="h-8 w-8 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Nenhum card disponível nesta seção
                        </p>
                      </div>
                    )}
                    {sortedCards.map((cardLayout) => {
                      const minWidth =
                        sectionConfig.minCardWidth || 280;
                      const maxWidth =
                        sectionConfig.maxCardWidth || 800;
                      const defaultWidth =
                        sectionConfig.defaultCardWidth || 300;
                      
                      // Check if card was customized
                      const isCustomized = cardLayout.width !== defaultWidth;

                      return (
                        <SortableCard
                          key={cardLayout.cardId}
                          id={cardLayout.cardId}
                          isEditMode={isEditMode}
                        >
                          <ResizableCardSimple
                            id={cardLayout.cardId}
                            sectionId={sectionId}
                            isEditMode={isEditMode}
                            defaultWidth={defaultWidth}
                            minWidth={minWidth}
                            maxWidth={maxWidth}
                            tempWidth={cardLayout.width}
                            onTempWidthChange={(cardId, width) =>
                              updateCardWidth(sectionId, cardId, width)
                            }
                            isCustomized={isCustomized}
                          >
                  {renderDashboardCard(cardLayout.cardId, {
                    isEditMode,
                    patients,
                    sessions,
                    start,
                    end,
                    scale: 'week',
                  })}
                          </ResizableCardSimple>
                        </SortableCard>
                      );
                    })}
                  </SortableCardContainer>
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
      </div>
    </Layout>
  );
}
