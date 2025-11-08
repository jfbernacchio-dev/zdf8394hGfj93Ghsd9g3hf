import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Plus, BarChart3, Layers } from 'lucide-react';
import { AVAILABLE_STAT_CARDS, AVAILABLE_FUNCTIONAL_CARDS, CardConfig } from '@/types/cardTypes';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface AddCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddCard: (cardConfig: CardConfig) => void;
  existingCardIds: string[];
}

export const AddCardDialog = ({ open, onOpenChange, onAddCard, existingCardIds }: AddCardDialogProps) => {
  const [selectedTab, setSelectedTab] = useState<'statistics' | 'functional'>('statistics');

  const availableStatCards = AVAILABLE_STAT_CARDS.filter(card => !existingCardIds.includes(card.id));
  const availableFunctionalCards = AVAILABLE_FUNCTIONAL_CARDS.filter(card => !existingCardIds.includes(card.id));

  const handleAddCard = (card: CardConfig) => {
    onAddCard(card);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Adicionar Card ao Layout</DialogTitle>
          <DialogDescription>
            Escolha um card para adicionar à visualização do paciente
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
            <ScrollArea className="h-[50vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                {availableStatCards.length > 0 ? (
                  availableStatCards.map((card) => (
                    <Card key={card.id} className="p-4 hover:bg-accent/5 transition-colors">
                      <div className="flex flex-col gap-3">
                        <div>
                          <h4 className="font-semibold text-base mb-1">{card.name}</h4>
                          <p className="text-sm text-muted-foreground">{card.description}</p>
                        </div>
                        <Button
                          onClick={() => handleAddCard(card)}
                          size="sm"
                          className="w-full gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar
                        </Button>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    Todos os cards estatísticos já estão adicionados
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="functional" className="mt-4">
            <ScrollArea className="h-[50vh]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pr-4">
                {availableFunctionalCards.length > 0 ? (
                  availableFunctionalCards.map((card) => (
                    <Card key={card.id} className="p-4 hover:bg-accent/5 transition-colors">
                      <div className="flex flex-col gap-3">
                        <div>
                          <h4 className="font-semibold text-base mb-1">{card.name}</h4>
                          <p className="text-sm text-muted-foreground">{card.description}</p>
                        </div>
                        <Button
                          onClick={() => handleAddCard(card)}
                          size="sm"
                          className="w-full gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar
                        </Button>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-8 text-muted-foreground">
                    Todos os cards funcionais disponíveis já estão adicionados
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
