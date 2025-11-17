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

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Pencil, Save, X, RotateCcw, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
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
  const [isEditMode, setIsEditMode] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

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
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Carregando dashboard...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6 p-6">
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
          <Card className="bg-primary/5 border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Modo de Edição
              </CardTitle>
              <div className="text-xs text-muted-foreground space-y-1 mt-2">
                <p>• <strong>Arraste</strong> o ícone à esquerda para reordenar cards</p>
                <p>• <strong>Redimensione</strong> usando a alça à direita do card</p>
                <p>• Mudanças são salvas automaticamente após 2 segundos</p>
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
                    className="flex items-center gap-2 group hover:opacity-80 transition-opacity"
                  >
                    <h2 className="text-xl font-semibold">
                      {sectionConfig.name}
                    </h2>
                    {isCollapsed ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    ) : (
                      <ChevronUp className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    )}
                  </button>
                  <span className="text-sm text-muted-foreground">
                    {sortedCards.length} cards
                  </span>
                </div>

                {/* Section Content */}
                {!isCollapsed && (
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
                      'flex flex-wrap gap-4 p-4 rounded-lg min-h-[200px]',
                      isEditMode && 'bg-muted/20 border-2 border-dashed border-border'
                    )}
                  >
                    {sortedCards.map((cardLayout) => {
                      const minWidth =
                        sectionConfig.minCardWidth || 280;
                      const maxWidth =
                        sectionConfig.maxCardWidth || 800;
                      const defaultWidth =
                        sectionConfig.defaultCardWidth || 300;

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
                          >
                            {renderDashboardCard(cardLayout.cardId, {
                              isEditMode,
                            })}
                          </ResizableCardSimple>
                        </SortableCard>
                      );
                    })}
                  </SortableCardContainer>
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
          <div className="fixed bottom-4 right-4 z-50">
            <Card className="bg-yellow-50 border-yellow-200 shadow-lg">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2 text-sm text-yellow-800">
                  <AlertCircle className="h-4 w-4" />
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
