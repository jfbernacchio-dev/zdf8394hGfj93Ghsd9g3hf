/**
 * ============================================================================
 * ADD CARD DIALOG - FASE 2 (REFATORAÇÃO COMPLETA)
 * ============================================================================
 * 
 * Dialog para adicionar/remover cards no dashboard
 * Organizado por seções com estrutura de domínios
 * 
 * NOVA ESTRUTURA (FASE 2):
 * - Tabs principais: Uma por seção (Financeira, Administrativa, Clínica, Mídia)
 * - Sub-tabs: "Disponível" e "Adicionados" em cada seção
 * - Filtragem automática por permissões
 * 
 * RETROCOMPATIBILIDADE:
 * - Mantém suporte para assinaturas antigas dos outros componentes
 * - Novos componentes devem usar a nova assinatura com sectionId
 * 
 * ============================================================================
 */

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Plus, X, DollarSign, Calendar, Activity, BarChart3, Settings, TrendingUp } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useCardPermissions } from '@/hooks/useCardPermissions';
import { DASHBOARD_SECTIONS } from '@/lib/defaultSectionsDashboard';
import type { CardConfig } from '@/types/cardTypes';

interface AddCardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  // Nova assinatura FASE 2
  onAddCard: ((sectionId: string, cardId: string) => void) | ((cardConfig: CardConfig) => void);
  onRemoveCard: ((sectionId: string, cardId: string) => void) | ((cardId: string) => void);
  // Nova prop FASE 2
  sectionCards?: Record<string, string[]>;
  // Props legadas (para compatibilidade)
  existingCardIds?: string[];
  mode?: 'patient' | 'dashboard-unified' | 'evolution';
  sectionConfig?: any;
}

/**
 * Mapeamento de ícones por seção
 */
const SECTION_ICONS = {
  'dashboard-financial': DollarSign,
  'dashboard-administrative': Calendar,
  'dashboard-clinical': Activity,
  'dashboard-media': BarChart3,
  'dashboard-general': Settings,
  'dashboard-charts': TrendingUp,
} as const;

/**
 * Mapeamento de domínios para labels em português
 */
const DOMAIN_LABELS: Record<string, string> = {
  financial: 'Financeiro',
  administrative: 'Administrativo',
  clinical: 'Clínico',
  media: 'Mídia',
  general: 'Geral',
  charts: 'Gráficos',
};

export const AddCardDialog = ({ 
  open, 
  onOpenChange, 
  onAddCard, 
  onRemoveCard, 
  sectionCards,
  existingCardIds = [],
  mode,
  sectionConfig,
}: AddCardDialogProps) => {
  const { getAvailableCardsForSection, canViewSection, loading: permissionsLoading } = useCardPermissions();
  
  // Detectar se está usando nova ou antiga API
  const isNewAPI = sectionCards !== undefined;
  
  // Estado: qual seção está selecionada
  const [selectedSection, setSelectedSection] = useState<string>('dashboard-financial');
  
  // Estado: dentro da seção, qual sub-tab (disponível ou adicionados)
  const [viewMode, setViewMode] = useState<'available' | 'added'>('available');
  
  // FASE 2B: Estado para sub-domínio quando em seção de gráficos
  const [selectedChartDomain, setSelectedChartDomain] = useState<string>('financial');

  /**
   * Wrapper para onAddCard que suporta ambas as assinaturas
   */
  const handleAdd = (sectionId: string, cardId: string, card: CardConfig) => {
    if (onAddCard.length === 2) {
      // Nova assinatura: (sectionId, cardId)
      (onAddCard as (sectionId: string, cardId: string) => void)(sectionId, cardId);
    } else {
      // Assinatura antiga: (cardConfig)
      (onAddCard as (cardConfig: CardConfig) => void)(card);
      onOpenChange(false);
    }
  };

  /**
   * Wrapper para onRemoveCard que suporta ambas as assinaturas
   */
  const handleRemove = (sectionId: string, cardId: string) => {
    if (onRemoveCard.length === 2) {
      // Nova assinatura: (sectionId, cardId)
      (onRemoveCard as (sectionId: string, cardId: string) => void)(sectionId, cardId);
    } else {
      // Assinatura antiga: (cardId)
      (onRemoveCard as (cardId: string) => void)(cardId);
    }
  };

  /**
   * Processa dados de uma seção específica (NOVA API)
   */
  const getSectionData = (sectionId: string) => {
    const sectionConfig = DASHBOARD_SECTIONS[sectionId];
    if (!sectionConfig) return null;

    // Verificar se usuário pode ver a seção
    if (!canViewSection(sectionConfig)) return null;

    // Pegar todos os cards disponíveis (filtrados por permissão)
    const availableCards = getAvailableCardsForSection(sectionConfig);
    
    // IDs dos cards já adicionados nesta seção
    const addedCardIds = sectionCards?.[sectionId] || [];
    
    // Separar em "disponível" vs "adicionado"
    const notAddedCards = availableCards.filter(card => !addedCardIds.includes(card.id));
    const addedCards = availableCards.filter(card => addedCardIds.includes(card.id));

    return {
      config: sectionConfig,
      availableCards: notAddedCards,
      addedCards,
    };
  };

  /**
   * FASE 2B: Filtra gráficos por domínio (para seção de charts)
   */
  const getChartsForDomain = (domain: string, sectionData: ReturnType<typeof getSectionData>) => {
    if (!sectionData) return { availableCards: [], addedCards: [] };
    
    const availableFiltered = sectionData.availableCards.filter(
      card => card.isChart && card.permissionConfig?.domain === domain
    );
    
    const addedFiltered = sectionData.addedCards.filter(
      card => card.isChart && card.permissionConfig?.domain === domain
    );
    
    return {
      availableCards: availableFiltered,
      addedCards: addedFiltered,
    };
  };

  /**
   * Renderiza um card individual
   */
  const renderCardItem = (
    card: CardConfig, 
    sectionId: string, 
    action: 'add' | 'remove'
  ) => {
    return (
      <Card key={card.id} className="p-4 hover:border-primary/50 transition-colors">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm mb-1">{card.name}</h4>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {card.description}
            </p>
            {card.permissionConfig && (
              <Badge variant="outline" className="mt-2 text-xs">
                {DOMAIN_LABELS[card.permissionConfig.domain] || card.permissionConfig.domain}
              </Badge>
            )}
          </div>
          
          {action === 'add' ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleAdd(sectionId, card.id, card)}
              className="shrink-0"
            >
              <Plus className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => handleRemove(sectionId, card.id)}
              className="shrink-0 text-destructive hover:text-destructive"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Card>
    );
  };

  // Se não está usando nova API, retornar null por enquanto (modo legado não implementado)
  if (!isNewAPI) {
    return null;
  }

  // Filtrar seções visíveis pelo usuário
  const visibleSections = Object.keys(DASHBOARD_SECTIONS).filter(sectionId => {
    const sectionConfig = DASHBOARD_SECTIONS[sectionId];
    return canViewSection(sectionConfig);
  });

  // Se não há seções visíveis, não renderizar nada
  if (visibleSections.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Adicionar Cards ao Dashboard</DialogTitle>
          <DialogDescription>
            Escolha cards para adicionar ou remover de cada seção
          </DialogDescription>
        </DialogHeader>

        {permissionsLoading ? (
          <div className="py-8 text-center text-muted-foreground">
            Carregando permissões...
          </div>
        ) : (
          <Tabs value={selectedSection} onValueChange={setSelectedSection}>
            {/* Tabs principais: Uma por seção */}
            <TabsList className="grid grid-cols-2 lg:grid-cols-4 w-full">
              {visibleSections.map(sectionId => {
                const section = DASHBOARD_SECTIONS[sectionId];
                const SectionIcon = SECTION_ICONS[sectionId as keyof typeof SECTION_ICONS];
                
                return (
                  <TabsTrigger key={sectionId} value={sectionId} className="gap-2">
                    {SectionIcon && <SectionIcon className="w-4 h-4" />}
                    <span className="hidden sm:inline">{section.name}</span>
                    <span className="sm:hidden">{section.name.split(' ')[0]}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {/* Conteúdo de cada seção */}
            {visibleSections.map(sectionId => {
              const sectionData = getSectionData(sectionId);
              
              if (!sectionData) return null;

              const { config, availableCards, addedCards } = sectionData;

              return (
                <TabsContent key={sectionId} value={sectionId} className="mt-4">
                  <div className="mb-4">
                    <h3 className="text-sm font-semibold mb-1">{config.name}</h3>
                    <p className="text-xs text-muted-foreground">{config.description}</p>
                  </div>

                  {/* FASE 2B: Renderização condicional - 3 níveis para charts, 2 níveis para outras */}
                  {sectionId === 'dashboard-charts' ? (
                    /* TRÊS NÍVEIS: Tab de domínio → Tab disponível/adicionados */
                    <Tabs value={selectedChartDomain} onValueChange={setSelectedChartDomain}>
                      <TabsList className="grid w-full grid-cols-4 mb-4">
                        <TabsTrigger value="financial">Financeiros</TabsTrigger>
                        <TabsTrigger value="administrative">Administrativos</TabsTrigger>
                        <TabsTrigger value="clinical">Clínicos</TabsTrigger>
                        <TabsTrigger value="media">Mídia</TabsTrigger>
                      </TabsList>

                      {['financial', 'administrative', 'clinical', 'media'].map(domain => {
                        const chartsData = getChartsForDomain(domain, sectionData);
                        
                        return (
                          <TabsContent key={domain} value={domain}>
                            {/* Segundo nível: Disponível vs Adicionados */}
                            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'available' | 'added')}>
                              <TabsList className="grid w-full grid-cols-2 mb-4">
                                <TabsTrigger value="available">
                                  Disponível ({chartsData.availableCards.length})
                                </TabsTrigger>
                                <TabsTrigger value="added">
                                  Adicionados ({chartsData.addedCards.length})
                                </TabsTrigger>
                              </TabsList>

                              {/* Cards disponíveis */}
                              <TabsContent value="available">
                                <ScrollArea className="h-[400px] pr-4">
                                  {chartsData.availableCards.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                      <p>Nenhum gráfico {DOMAIN_LABELS[domain].toLowerCase()} disponível</p>
                                      <p className="text-xs mt-2">
                                        Todos os gráficos desta categoria já foram adicionados
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      {chartsData.availableCards.map(card => 
                                        renderCardItem(card, sectionId, 'add')
                                      )}
                                    </div>
                                  )}
                                </ScrollArea>
                              </TabsContent>

                              {/* Cards adicionados */}
                              <TabsContent value="added">
                                <ScrollArea className="h-[400px] pr-4">
                                  {chartsData.addedCards.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground">
                                      <p>Nenhum gráfico {DOMAIN_LABELS[domain].toLowerCase()} adicionado</p>
                                      <p className="text-xs mt-2">
                                        Vá para a aba "Disponível" para adicionar gráficos
                                      </p>
                                    </div>
                                  ) : (
                                    <div className="space-y-3">
                                      {chartsData.addedCards.map(card => 
                                        renderCardItem(card, sectionId, 'remove')
                                      )}
                                    </div>
                                  )}
                                </ScrollArea>
                              </TabsContent>
                            </Tabs>
                          </TabsContent>
                        );
                      })}
                    </Tabs>
                  ) : (
                    /* DOIS NÍVEIS: Sistema atual para outras seções */
                    <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'available' | 'added')}>
                      <TabsList className="grid w-full grid-cols-2 mb-4">
                        <TabsTrigger value="available">
                          Disponível ({availableCards.length})
                        </TabsTrigger>
                        <TabsTrigger value="added">
                          Adicionados ({addedCards.length})
                        </TabsTrigger>
                      </TabsList>

                      {/* Cards disponíveis para adicionar */}
                      <TabsContent value="available">
                        <ScrollArea className="h-[400px] pr-4">
                          {availableCards.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <p>Nenhum card disponível para adicionar</p>
                              <p className="text-xs mt-2">
                                Todos os cards desta seção já foram adicionados
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {availableCards.map(card => 
                                renderCardItem(card, sectionId, 'add')
                              )}
                            </div>
                          )}
                        </ScrollArea>
                      </TabsContent>

                      {/* Cards já adicionados */}
                      <TabsContent value="added">
                        <ScrollArea className="h-[400px] pr-4">
                          {addedCards.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                              <p>Nenhum card adicionado ainda</p>
                              <p className="text-xs mt-2">
                                Vá para a aba "Disponível" para adicionar cards
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {addedCards.map(card => 
                                renderCardItem(card, sectionId, 'remove')
                              )}
                            </div>
                          )}
                        </ScrollArea>
                      </TabsContent>
                    </Tabs>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        )}
      </DialogContent>
    </Dialog>
  );
};
