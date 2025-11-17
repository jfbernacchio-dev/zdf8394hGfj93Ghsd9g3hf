/**
 * ============================================================================
 * DASHBOARD SECTION EXAMPLE - FASE 3B
 * ============================================================================
 * 
 * Exemplo de componente que integra:
 * - SortableCardContainer (drag & drop)
 * - SortableCard (wrapper para reordenamento)
 * - ResizableCardSimple (resize horizontal)
 * - useDashboardLayout (persistência)
 * 
 * Este é um EXEMPLO de referência. O componente real será implementado
 * na FASE 3D durante integração com DashboardExample.tsx.
 * 
 * ============================================================================
 */

import { useState } from 'react';
import { SortableCardContainer } from './SortableCardContainer';
import { SortableCard } from './SortableCard';
import { ResizableCardSimple } from './ResizableCardSimple';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import { Button } from './ui/button';
import { useDashboardLayout } from '@/hooks/useDashboardLayout';
import { Pencil, Save, X, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';

interface DashboardSectionExampleProps {
  sectionId: string;
  sectionName: string;
}

/**
 * Exemplo de renderização de card
 * Na prática, isso virá de um sistema de registry de cards
 */
const renderCardContent = (cardId: string) => {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="text-lg">{cardId}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">R$ 10.000</div>
        <div className="text-xs text-muted-foreground mt-1">
          Valor de exemplo
        </div>
      </CardContent>
    </Card>
  );
};

export const DashboardSectionExample = ({
  sectionId,
  sectionName,
}: DashboardSectionExampleProps) => {
  const [isEditMode, setIsEditMode] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  const {
    layout,
    loading,
    saving,
    isModified,
    updateCardWidth,
    updateCardOrder,
    saveLayout,
    resetLayout,
  } = useDashboardLayout();

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Carregando layout...
      </div>
    );
  }

  const section = layout[sectionId];
  if (!section) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Seção não encontrada: {sectionId}
      </div>
    );
  }

  // Ordenar cards por 'order'
  const sortedCards = [...section.cardLayouts].sort((a, b) => a.order - b.order);
  const cardIds = sortedCards.map(cl => cl.cardId);

  /**
   * HANDLER: Reordenar cards via drag & drop
   */
  const handleReorder = (newCardIds: string[]) => {
    updateCardOrder(sectionId, newCardIds);
    toast.success('Ordem atualizada!', {
      description: 'Salvando automaticamente...',
    });
  };

  /**
   * HANDLER: Salvar layout manualmente
   */
  const handleSave = async () => {
    await saveLayout();
    setIsEditMode(false);
    toast.success('Layout salvo com sucesso!');
  };

  /**
   * HANDLER: Cancelar edição (recarregar página para descartar mudanças locais)
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
   * HANDLER: Resetar layout para padrão
   */
  const handleReset = async () => {
    await resetLayout();
    setShowResetDialog(false);
    toast.success('Layout resetado!');
    setTimeout(() => window.location.reload(), 500);
  };

  return (
    <div className="space-y-4">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">{sectionName}</h2>
          <p className="text-sm text-muted-foreground">
            {sortedCards.length} cards
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Indicador de status */}
          {saving && (
            <span className="text-sm text-muted-foreground">
              Salvando...
            </span>
          )}
          {isModified && !saving && (
            <span className="text-sm text-yellow-600">
              ● Não salvo
            </span>
          )}

          {/* Botões de controle */}
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
              <Button
                variant="outline"
                onClick={handleCancel}
                size="sm"
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setIsEditMode(true)}
                size="sm"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Editar Layout
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
          )}
        </div>
      </div>

      {/* Seção de cards com drag & drop */}
      <SortableCardContainer
        sectionId={sectionId}
        cardIds={cardIds}
        onReorder={handleReorder}
        isEditMode={isEditMode}
        strategy="horizontal"
        className="flex flex-wrap gap-4 p-4 bg-muted/20 rounded-lg min-h-[200px]"
      >
        {sortedCards.map(cardLayout => (
          <SortableCard
            key={cardLayout.cardId}
            id={cardLayout.cardId}
            isEditMode={isEditMode}
          >
            <ResizableCardSimple
              id={cardLayout.cardId}
              sectionId={sectionId}
              isEditMode={isEditMode}
              defaultWidth={cardLayout.width}
              minWidth={280}
              maxWidth={600}
              tempWidth={cardLayout.width}
              onTempWidthChange={(cardId, width) =>
                updateCardWidth(sectionId, cardId, width)
              }
            >
              {renderCardContent(cardLayout.cardId)}
            </ResizableCardSimple>
          </SortableCard>
        ))}
      </SortableCardContainer>

      {/* Dialog de confirmação de reset */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Resetar Layout?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá restaurar o layout padrão e remover todas as suas
              customizações (larguras e ordem dos cards). Esta ação não pode
              ser desfeita.
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
    </div>
  );
};
