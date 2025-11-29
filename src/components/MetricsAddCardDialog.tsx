/**
 * ============================================================================
 * METRICS ADD CARD DIALOG - FASE 1
 * ============================================================================
 * 
 * Dialog específico para adicionar/remover cards na página /metrics
 * 
 * FASE 1: Apenas Cards Métricos (cards numéricos do grid superior)
 * - Consciente do domínio atual (financial / administrative / marketing / team)
 * - Sub-abas: "Disponíveis" e "Adicionados"
 * - Usa METRICS_CARD_REGISTRY como fonte da verdade
 * 
 * FASES FUTURAS:
 * - FASE 2/3: Adicionar suporte para "Cards Gráficos"
 * 
 * ============================================================================
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Plus, X, Info } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { getMetricsCardsByDomain } from '@/lib/metricsCardRegistry';
import type { MetricsCardDefinition } from '@/lib/metricsCardRegistry';

/**
 * Props do componente
 */
interface MetricsAddCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  
  // Domínio atual da /metrics
  domainKey: string; // 'financial' | 'administrative' | 'marketing' | 'team'
  
  // IDs dos cards já presentes no layout do domínio atual
  existingCardIds: string[];
  
  // Callbacks para adicionar/remover cards
  onAddCard: (domainKey: string, cardId: string) => void;
  onRemoveCard: (domainKey: string, cardId: string) => void;
}

/**
 * Mapeamento de domínios para labels em português
 */
const DOMAIN_LABELS: Record<string, string> = {
  financial: 'Financeiro',
  administrative: 'Administrativo',
  marketing: 'Marketing',
  team: 'Equipe',
};

/**
 * Componente MetricsAddCardDialog
 */
export const MetricsAddCardDialog = ({
  open,
  onOpenChange,
  domainKey,
  existingCardIds,
  onAddCard,
  onRemoveCard,
}: MetricsAddCardDialogProps) => {
  // Estado: qual sub-tab está selecionada (disponível ou adicionados)
  const [viewMode, setViewMode] = useState<'available' | 'added'>('available');

  // Obter todos os cards do domínio atual
  const allDomainCards = getMetricsCardsByDomain(
    domainKey as 'financial' | 'administrative' | 'marketing' | 'team'
  );

  // Separar em disponíveis vs adicionados
  const availableCards = allDomainCards.filter(card => !existingCardIds.includes(card.id));
  const addedCards = allDomainCards.filter(card => existingCardIds.includes(card.id));

  // Ordenar por título
  const sortedAvailable = [...availableCards].sort((a, b) => a.title.localeCompare(b.title));
  const sortedAdded = [...addedCards].sort((a, b) => a.title.localeCompare(b.title));

  /**
   * Renderiza um card individual
   */
  const renderCardItem = (
    card: MetricsCardDefinition,
    action: 'add' | 'remove'
  ) => {
    return (
      <Card key={card.id} className="p-4 hover:border-primary/50 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-medium text-sm">{card.title}</h4>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-4 w-4 p-0">
                    <Info className="h-3 w-3 text-muted-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="max-w-xs">
                  <p className="font-semibold mb-1">{card.title}</p>
                  <p className="text-xs">{card.description}</p>
                </TooltipContent>
              </Tooltip>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
              {card.description}
            </p>
            <div className="flex flex-wrap gap-1">
              <Badge variant="outline" className="text-xs">
                {DOMAIN_LABELS[card.domain] || card.domain}
              </Badge>
            </div>
          </div>
          
          {action === 'add' ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onAddCard(domainKey, card.id)}
              className="shrink-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRemoveCard(domainKey, card.id)}
              className="shrink-0 text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Card>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Gerenciar Cards de Métricas</DialogTitle>
          <DialogDescription>
            Domínio atual: <strong>{DOMAIN_LABELS[domainKey] || domainKey}</strong>
          </DialogDescription>
        </DialogHeader>

        {/* FASE 1: Apenas Cards Métricos */}
        <div className="mt-4">
          <h3 className="text-sm font-semibold mb-4">Cards Métricos</h3>
          
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'available' | 'added')}>
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="available">
                Disponíveis ({sortedAvailable.length})
              </TabsTrigger>
              <TabsTrigger value="added">
                Adicionados ({sortedAdded.length})
              </TabsTrigger>
            </TabsList>

            {/* Cards disponíveis para adicionar */}
            <TabsContent value="available">
              <ScrollArea className="h-[400px] pr-4">
                {sortedAvailable.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhum card disponível para adicionar</p>
                    <p className="text-xs mt-2">
                      Todos os cards de métricas já foram adicionados
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 pb-4">
                    {sortedAvailable.map(card => renderCardItem(card, 'add'))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {/* Cards adicionados para remover */}
            <TabsContent value="added">
              <ScrollArea className="h-[400px] pr-4">
                {sortedAdded.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>Nenhum card adicionado</p>
                    <p className="text-xs mt-2">
                      Vá para a aba "Disponíveis" para adicionar cards
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3 pb-4">
                    {sortedAdded.map(card => renderCardItem(card, 'remove'))}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>

        {/* NOTA PARA FASE 2/3: Aqui será adicionada a aba "Cards Gráficos" */}
      </DialogContent>
    </Dialog>
  );
};
