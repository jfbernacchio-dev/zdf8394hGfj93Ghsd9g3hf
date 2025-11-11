import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Plus, BarChart3, Layers, Info, PieChart, TrendingUp, X } from 'lucide-react';
import { AVAILABLE_STAT_CARDS, AVAILABLE_FUNCTIONAL_CARDS, AVAILABLE_DASHBOARD_CARDS, AVAILABLE_DASHBOARD_CHARTS, AVAILABLE_CLINICAL_CARDS, CardConfig } from '@/types/cardTypes';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface AddCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCard: (cardConfig: CardConfig) => void;
  onRemoveCard: (cardId: string) => void;
  existingCardIds: string[];
  mode?: 'patient' | 'dashboard-unified' | 'evolution';
}

export const AddCardDialog = ({ open, onOpenChange, onAddCard, onRemoveCard, existingCardIds, mode = 'patient' }: AddCardDialogProps) => {
  const [selectedTab, setSelectedTab] = useState<'statistics' | 'functional' | 'metrics' | 'charts' | 'clinical'>(() => {
    if (mode === 'dashboard-unified') return 'metrics';
    if (mode === 'evolution') return 'statistics';
    return 'statistics';
  });
  const [viewMode, setViewMode] = useState<'available' | 'added'>('available');

  const availableStatCards = AVAILABLE_STAT_CARDS.filter(card => !existingCardIds.includes(card.id));
  const availableFunctionalCards = AVAILABLE_FUNCTIONAL_CARDS.filter(card => !existingCardIds.includes(card.id));
  const availableDashboardCards = AVAILABLE_DASHBOARD_CARDS.filter(card => !existingCardIds.includes(card.id));
  const availableDashboardCharts = AVAILABLE_DASHBOARD_CHARTS.filter(card => !existingCardIds.includes(card.id));
  const availableClinicalCards = AVAILABLE_CLINICAL_CARDS.filter(card => !existingCardIds.includes(card.id));

  const addedStatCards = AVAILABLE_STAT_CARDS.filter(card => existingCardIds.includes(card.id));
  const addedFunctionalCards = AVAILABLE_FUNCTIONAL_CARDS.filter(card => existingCardIds.includes(card.id));
  const addedDashboardCards = AVAILABLE_DASHBOARD_CARDS.filter(card => existingCardIds.includes(card.id));
  const addedDashboardCharts = AVAILABLE_DASHBOARD_CHARTS.filter(card => existingCardIds.includes(card.id));
  const addedClinicalCards = AVAILABLE_CLINICAL_CARDS.filter(card => existingCardIds.includes(card.id));

  const handleAddCard = (card: CardConfig) => {
    onAddCard(card);
    onOpenChange(false);
  };

  const handleRemoveCard = (cardId: string) => {
    onRemoveCard(cardId);
  };

  const renderCardItem = (card: CardConfig, isAdded: boolean = false) => (
    <Card key={card.id} className="p-4 hover:bg-accent/5 transition-colors">
      <div className="flex flex-col gap-3">
        <div className="flex items-start gap-2">
          <div className="flex-1">
            <h4 className="font-semibold text-base mb-1">{card.name}</h4>
            <p className="text-sm text-muted-foreground">{card.description}</p>
          </div>
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center cursor-help">
                  <Info className="w-3 h-3 text-primary" />
                </div>
              </TooltipTrigger>
              <TooltipContent side="left" className="max-w-xs">
                <p className="text-sm">{card.detailedDescription || card.description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        {isAdded ? (
          <Button
            onClick={() => handleRemoveCard(card.id)}
            size="sm"
            variant="destructive"
            className="w-full gap-2"
          >
            <X className="w-4 h-4" />
            Remover
          </Button>
        ) : (
          <Button
            onClick={() => handleAddCard(card)}
            size="sm"
            className="w-full gap-2"
          >
            <Plus className="w-4 h-4" />
            Adicionar
          </Button>
        )}
      </div>
    </Card>
  );

  if (mode === 'dashboard-unified') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Gerenciar Cards do Dashboard</DialogTitle>
            <DialogDescription>
              Adicione ou remova cards, gráficos e dados clínicos do dashboard
            </DialogDescription>
          </DialogHeader>

          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'metrics' | 'charts' | 'clinical')}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="metrics" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Cards Métricos
              </TabsTrigger>
              <TabsTrigger value="charts" className="gap-2">
                <PieChart className="w-4 h-4" />
                Cards Gráficos
              </TabsTrigger>
              <TabsTrigger value="clinical" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Cards Clínicos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="metrics" className="mt-4">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'available' | 'added')}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="available">
                    Disponíveis ({availableDashboardCards.length})
                  </TabsTrigger>
                  <TabsTrigger value="added">
                    Adicionados ({addedDashboardCards.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="available">
                  <ScrollArea className="h-[45vh]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                      {availableDashboardCards.length > 0 ? (
                        availableDashboardCards.map((card) => renderCardItem(card, false))
                      ) : (
                        <div className="col-span-2 text-center py-8 text-muted-foreground">
                          Todos os cards métricos já estão adicionados
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="added">
                  <ScrollArea className="h-[45vh]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                      {addedDashboardCards.length > 0 ? (
                        addedDashboardCards.map((card) => renderCardItem(card, true))
                      ) : (
                        <div className="col-span-2 text-center py-8 text-muted-foreground">
                          Nenhum card métrico adicionado ainda
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="charts" className="mt-4">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'available' | 'added')}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="available">
                    Disponíveis ({availableDashboardCharts.length})
                  </TabsTrigger>
                  <TabsTrigger value="added">
                    Adicionados ({addedDashboardCharts.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="available">
                  <ScrollArea className="h-[45vh]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                      {availableDashboardCharts.length > 0 ? (
                        availableDashboardCharts.map((card) => renderCardItem(card, false))
                      ) : (
                        <div className="col-span-2 text-center py-8 text-muted-foreground">
                          Todos os gráficos já estão adicionados
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="added">
                  <ScrollArea className="h-[45vh]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                      {addedDashboardCharts.length > 0 ? (
                        addedDashboardCharts.map((card) => renderCardItem(card, true))
                      ) : (
                        <div className="col-span-2 text-center py-8 text-muted-foreground">
                          Nenhum gráfico adicionado ainda
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="clinical" className="mt-4">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'available' | 'added')}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="available">
                    Disponíveis ({availableClinicalCards.length})
                  </TabsTrigger>
                  <TabsTrigger value="added">
                    Adicionados ({addedClinicalCards.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="available">
                  <ScrollArea className="h-[45vh]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                      {availableClinicalCards.length > 0 ? (
                        availableClinicalCards.map((card) => renderCardItem(card, false))
                      ) : (
                        <div className="col-span-2 text-center py-8 text-muted-foreground">
                          Todos os cards clínicos já estão adicionados
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="added">
                  <ScrollArea className="h-[45vh]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                      {addedClinicalCards.length > 0 ? (
                        addedClinicalCards.map((card) => renderCardItem(card, true))
                      ) : (
                        <div className="col-span-2 text-center py-8 text-muted-foreground">
                          Nenhum card clínico adicionado ainda
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  }

  if (mode === 'evolution') {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Gerenciar Cards de Evolução</DialogTitle>
            <DialogDescription>
              Adicione ou remova cards da seção de evolução do paciente
            </DialogDescription>
          </DialogHeader>

          <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'statistics' | 'clinical')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="statistics" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                Cards Estatísticos
              </TabsTrigger>
              <TabsTrigger value="clinical" className="gap-2">
                <TrendingUp className="w-4 h-4" />
                Cards Clínicos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="statistics" className="mt-4">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'available' | 'added')}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="available">
                    Disponíveis ({availableStatCards.length})
                  </TabsTrigger>
                  <TabsTrigger value="added">
                    Adicionados ({addedStatCards.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="available">
                  <ScrollArea className="h-[45vh]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                      {availableStatCards.length > 0 ? (
                        availableStatCards.map((card) => renderCardItem(card, false))
                      ) : (
                        <div className="col-span-2 text-center py-8 text-muted-foreground">
                          Todos os cards estatísticos já estão adicionados
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="added">
                  <ScrollArea className="h-[45vh]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                      {addedStatCards.length > 0 ? (
                        addedStatCards.map((card) => renderCardItem(card, true))
                      ) : (
                        <div className="col-span-2 text-center py-8 text-muted-foreground">
                          Nenhum card estatístico adicionado ainda
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </TabsContent>

            <TabsContent value="clinical" className="mt-4">
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'available' | 'added')}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="available">
                    Disponíveis ({availableClinicalCards.length})
                  </TabsTrigger>
                  <TabsTrigger value="added">
                    Adicionados ({addedClinicalCards.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="available">
                  <ScrollArea className="h-[45vh]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                      {availableClinicalCards.length > 0 ? (
                        availableClinicalCards.map((card) => renderCardItem(card, false))
                      ) : (
                        <div className="col-span-2 text-center py-8 text-muted-foreground">
                          Todos os cards clínicos já estão adicionados
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>

                <TabsContent value="added">
                  <ScrollArea className="h-[45vh]">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                      {addedClinicalCards.length > 0 ? (
                        addedClinicalCards.map((card) => renderCardItem(card, true))
                      ) : (
                        <div className="col-span-2 text-center py-8 text-muted-foreground">
                          Nenhum card clínico adicionado ainda
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Gerenciar Cards do Layout</DialogTitle>
          <DialogDescription>
            Adicione ou remova cards da visualização do paciente
          </DialogDescription>
        </DialogHeader>

        <Tabs value={selectedTab} onValueChange={(v) => setSelectedTab(v as 'statistics' | 'functional')}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="statistics" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Cards Estatísticos
            </TabsTrigger>
            <TabsTrigger value="functional" className="gap-2">
              <Layers className="w-4 h-4" />
              Cards Funcionais
            </TabsTrigger>
          </TabsList>

          <TabsContent value="statistics" className="mt-4">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'available' | 'added')}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="available">
                  Disponíveis ({availableStatCards.length})
                </TabsTrigger>
                <TabsTrigger value="added">
                  Adicionados ({addedStatCards.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="available">
                <ScrollArea className="h-[45vh]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                    {availableStatCards.length > 0 ? (
                      availableStatCards.map((card) => renderCardItem(card, false))
                    ) : (
                      <div className="col-span-2 text-center py-8 text-muted-foreground">
                        Todos os cards estatísticos já estão adicionados
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="added">
                <ScrollArea className="h-[45vh]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                    {addedStatCards.length > 0 ? (
                      addedStatCards.map((card) => renderCardItem(card, true))
                    ) : (
                      <div className="col-span-2 text-center py-8 text-muted-foreground">
                        Nenhum card estatístico adicionado ainda
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </TabsContent>

          <TabsContent value="functional" className="mt-4">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'available' | 'added')}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="available">
                  Disponíveis ({availableFunctionalCards.length})
                </TabsTrigger>
                <TabsTrigger value="added">
                  Adicionados ({addedFunctionalCards.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="available">
                <ScrollArea className="h-[45vh]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                    {availableFunctionalCards.length > 0 ? (
                      availableFunctionalCards.map((card) => renderCardItem(card, false))
                    ) : (
                      <div className="col-span-2 text-center py-8 text-muted-foreground">
                        Todos os cards funcionais já estão adicionados
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>

              <TabsContent value="added">
                <ScrollArea className="h-[45vh]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                    {addedFunctionalCards.length > 0 ? (
                      addedFunctionalCards.map((card) => renderCardItem(card, true))
                    ) : (
                      <div className="col-span-2 text-center py-8 text-muted-foreground">
                        Nenhum card funcional adicionado ainda
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
