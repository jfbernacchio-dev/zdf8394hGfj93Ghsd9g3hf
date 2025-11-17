/**
 * ============================================================================
 * PERMISSION AWARE SECTION - FASE 3
 * ============================================================================
 * 
 * Componente inteligente que:
 * - Valida permissões de seção automaticamente
 * - Filtra cards visíveis baseado em permissões do usuário
 * - Oculta-se completamente se usuário não tiver acesso
 * - Suporta collapse/expand
 * - Integra com ResizableSection para edição
 * 
 * USO:
 * ```tsx
 * <PermissionAwareSection
 *   sectionConfig={mySectionConfig}
 *   isEditMode={isEditMode}
 *   onAddCard={(cardId) => console.log('Add', cardId)}
 *   onRemoveCard={(cardId) => console.log('Remove', cardId)}
 *   existingCardIds={['card-1', 'card-2']}
 * />
 * ```
 * 
 * ============================================================================
 */

import { useState } from 'react';
import { ChevronDown, ChevronUp, Plus, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ResizableSection } from '@/components/ResizableSection';
import { AddCardDialog } from '@/components/AddCardDialog';
import { useCardPermissions } from '@/hooks/useCardPermissions';
import type { SectionConfig } from '@/types/sectionTypes';
import type { CardConfig } from '@/types/cardTypes';

interface PermissionAwareSectionProps {
  sectionConfig: SectionConfig;
  isEditMode?: boolean;
  onAddCard?: (cardConfig: CardConfig) => void;
  onRemoveCard?: (cardId: string) => void;
  existingCardIds?: string[];
  tempHeight?: number | null;
  onTempHeightChange?: (id: string, height: number) => void;
  renderCards?: (visibleCards: CardConfig[]) => React.ReactNode;
  children?: React.ReactNode;
}

/**
 * Componente de Seção com Controle de Permissões
 * 
 * @param sectionConfig - Configuração da seção com permissões
 * @param isEditMode - Se está em modo de edição
 * @param onAddCard - Callback ao adicionar card
 * @param onRemoveCard - Callback ao remover card
 * @param existingCardIds - IDs dos cards já adicionados
 * @param renderCards - Função customizada para renderizar cards visíveis
 * @param children - Conteúdo alternativo (se não usar renderCards)
 */
export const PermissionAwareSection = ({
  sectionConfig,
  isEditMode = false,
  onAddCard,
  onRemoveCard,
  existingCardIds = [],
  tempHeight,
  onTempHeightChange,
  renderCards,
  children,
}: PermissionAwareSectionProps) => {
  const {
    shouldShowSection,
    getAvailableCardsForSection,
    loading: permissionsLoading,
  } = useCardPermissions();

  const [isCollapsed, setIsCollapsed] = useState(sectionConfig.startCollapsed || false);
  const [showAddDialog, setShowAddDialog] = useState(false);

  console.log(`🔐 [PermissionAwareSection] ${sectionConfig.id} RENDERIZOU:`, {
    permissionsLoading,
    shouldShow: shouldShowSection(sectionConfig),
    existingCardIds: existingCardIds.length,
    isEditMode,
    renderNumber: Date.now() // Para ver quantas vezes renderiza
  });

  // FASE 3: Validação automática de permissões
  if (permissionsLoading) {
    console.log(`⏳ [${sectionConfig.id}] Loading permissions...`);
    return null; // Ou skeleton loader se preferir
  }

  // FASE 3: Ocultar seção se usuário não tiver permissão
  if (!shouldShowSection(sectionConfig)) {
    console.log(`🚫 [${sectionConfig.id}] Sem permissão para ver seção`);
    return null;
  }

  // FASE 3: Filtrar cards visíveis por permissão
  const visibleCards = getAvailableCardsForSection(sectionConfig);
  const addedCards = visibleCards.filter(card => existingCardIds.includes(card.id));
  const availableCards = visibleCards.filter(card => !existingCardIds.includes(card.id));

  console.log(`✅ [${sectionConfig.id}] Vai renderizar:`, {
    visibleCards: visibleCards.length,
    addedCards: addedCards.length,
    availableCards: availableCards.length
  });

  // Se não há cards visíveis e não está em modo de edição, não renderizar
  if (addedCards.length === 0 && !isEditMode) {
    console.log(`📭 [${sectionConfig.id}] Sem cards para mostrar`);
    return null;
  }

  const handleToggleCollapse = () => {
    if (sectionConfig.collapsible) {
      setIsCollapsed(!isCollapsed);
    }
  };

  const sectionContent = (
    <div className="space-y-4">
      {/* Header da Seção */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-semibold">{sectionConfig.name}</h2>
            
            {sectionConfig.collapsible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToggleCollapse}
                className="h-8 w-8 p-0"
              >
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </Button>
            )}

            {/* Badge de domínio (opcional, para debug) */}
            {isEditMode && (
              <Badge variant="outline" className="text-xs">
                {sectionConfig.permissionConfig.primaryDomain}
              </Badge>
            )}
          </div>

          {sectionConfig.description && (
            <p className="text-sm text-muted-foreground mt-1">
              {sectionConfig.description}
            </p>
          )}
        </div>

        {/* Botão para adicionar cards (apenas em modo de edição) */}
        {isEditMode && onAddCard && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowAddDialog(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Adicionar Card
          </Button>
        )}
      </div>

      {/* Conteúdo da Seção (colapsável) */}
      {!isCollapsed && (
        <div className="space-y-4">
          {/* Renderizar cards usando função customizada ou children */}
          {renderCards ? renderCards(addedCards) : children}

          {/* Mensagem se não houver cards */}
          {addedCards.length === 0 && isEditMode && (
            <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border rounded-lg">
              <Lock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Nenhum card adicionado nesta seção.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Clique em "Adicionar Card" para começar.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Dialog para adicionar cards */}
      {isEditMode && onAddCard && onRemoveCard && (
        <AddCardDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onAddCard={onAddCard}
          onRemoveCard={onRemoveCard}
          existingCardIds={existingCardIds}
          sectionConfig={sectionConfig}
        />
      )}
    </div>
  );

  // Se não está em modo de edição, renderizar diretamente
  if (!isEditMode) {
    return sectionContent;
  }

  // Se está em modo de edição, envolver com ResizableSection
  return (
    <ResizableSection
      id={sectionConfig.id}
      isEditMode={isEditMode}
      defaultHeight={sectionConfig.defaultHeight || 400}
      tempHeight={tempHeight}
      onTempHeightChange={onTempHeightChange}
      className="p-6"
    >
      {sectionContent}
    </ResizableSection>
  );
};
