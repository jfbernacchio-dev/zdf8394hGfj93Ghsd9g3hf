/**
 * ============================================================================
 * DASHBOARD EXAMPLE - FASE 5 (IMPLEMENTAÇÃO DE REFERÊNCIA)
 * ============================================================================
 * 
 * Este é um exemplo completo de como o Dashboard deve ser implementado
 * usando o sistema de PermissionAwareSection da FASE 5.
 * 
 * PARA MIGRAR O DASHBOARD REAL:
 * 1. Copiar esta estrutura para src/pages/Dashboard.tsx
 * 2. Adicionar a lógica de carregamento de dados existente
 * 3. Conectar os cards reais com dados da base
 * 4. Testar com todos os perfis de usuário
 * 
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, RotateCcw, Save, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { PermissionAwareSection } from '@/components/PermissionAwareSection';
import { DASHBOARD_SECTIONS, DEFAULT_DASHBOARD_SECTIONS } from '@/lib/defaultSectionsDashboard';
import { ResizableCard } from '@/components/ResizableCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import type { CardConfig } from '@/types/cardTypes';
import Layout from '@/components/Layout';

export default function DashboardExample() {
  const { user } = useAuth();

  // FASE 5: Estado baseado em SEÇÕES (não mais array de cardIds)
  const [sectionCards, setSectionCards] = useState<Record<string, string[]>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showResetDialog, setShowResetDialog] = useState(false);

  // Carregar layout salvo ou usar padrão
  useEffect(() => {
    console.log('🔍 [DashboardExample] useEffect user:', user?.id);
    if (user) {
      loadLayout();
    }
  }, [user]);

  useEffect(() => {
    console.log('🎨 [DashboardExample] sectionCards atualizado:', sectionCards);
    console.log('🔢 Total de seções com cards:', Object.keys(sectionCards).filter(k => sectionCards[k].length > 0).length);
  }, [sectionCards]);

  const loadLayout = () => {
    console.log('🔍 [DashboardExample] loadLayout chamado');
    console.log('📦 DEFAULT_DASHBOARD_SECTIONS:', DEFAULT_DASHBOARD_SECTIONS);
    const saved = localStorage.getItem('dashboard-section-cards');
    console.log('💾 localStorage saved:', saved);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        console.log('✅ Carregado do localStorage:', parsed);
        setSectionCards(parsed);
      } catch {
        console.log('❌ Erro ao parsear, usando DEFAULT');
        setSectionCards(DEFAULT_DASHBOARD_SECTIONS);
      }
    } else {
      // FASE 5: Migração automática de layout antigo (se existir)
      const oldCards = localStorage.getItem('dashboard-visible-cards');
      if (oldCards) {
        try {
          const parsed: string[] = JSON.parse(oldCards);
          const migrated = migrateOldLayout(parsed);
          console.log('🔄 Migrado de layout antigo:', migrated);
          setSectionCards(migrated);
          localStorage.setItem('dashboard-section-cards', JSON.stringify(migrated));
        } catch {
          console.log('❌ Erro ao migrar, usando DEFAULT');
          setSectionCards(DEFAULT_DASHBOARD_SECTIONS);
        }
      } else {
        console.log('🆕 Primeira vez, usando DEFAULT:', DEFAULT_DASHBOARD_SECTIONS);
        setSectionCards(DEFAULT_DASHBOARD_SECTIONS);
      }
    }
  };

  // FASE 5: Migração automática de layout antigo
  const migrateOldLayout = (oldCards: string[]): Record<string, string[]> => {
    const migrated: Record<string, string[]> = {
      'dashboard-financial': [],
      'dashboard-administrative': [],
      'dashboard-clinical': [],
      'dashboard-media': [],
    };

    oldCards.forEach(cardId => {
      // Classificar cards por domínio baseado no ID
      if (cardId.includes('revenue') || cardId.includes('payment') || cardId.includes('nfse') || cardId.includes('financial')) {
        migrated['dashboard-financial'].push(cardId);
      } else if (cardId.includes('session') || cardId.includes('patient') || cardId.includes('schedule')) {
        migrated['dashboard-administrative'].push(cardId);
      } else if (cardId.includes('complaint') || cardId.includes('diagnosis') || cardId.includes('clinical')) {
        migrated['dashboard-clinical'].push(cardId);
      } else if (cardId.includes('website') || cardId.includes('traffic') || cardId.includes('contact')) {
        migrated['dashboard-media'].push(cardId);
      }
    });

    return migrated;
  };

  const handleAddCard = (sectionId: string, card: CardConfig) => {
    setSectionCards(prev => ({
      ...prev,
      [sectionId]: [...(prev[sectionId] || []), card.id],
    }));

    toast.success(`Card adicionado: ${card.name}`);
  };

  const handleRemoveCard = (sectionId: string, cardId: string) => {
    setSectionCards(prev => ({
      ...prev,
      [sectionId]: (prev[sectionId] || []).filter(id => id !== cardId),
    }));

    toast.success("Card removido da seção");
  };

  const handleToggleEditMode = () => {
    if (isEditMode) {
      setShowSaveDialog(true);
    } else {
      setIsEditMode(true);
    }
  };

  const handleSaveLayout = () => {
    localStorage.setItem('dashboard-section-cards', JSON.stringify(sectionCards));
    setIsEditMode(false);
    setShowSaveDialog(false);

    toast.success("Layout salvo com sucesso");
  };

  const handleCancelLayout = () => {
    loadLayout(); // Recarregar do storage
    setIsEditMode(false);
    setShowSaveDialog(false);

    toast.info("Alterações descartadas");
  };

  const handleResetLayout = () => {
    setSectionCards(DEFAULT_DASHBOARD_SECTIONS);
    localStorage.setItem('dashboard-section-cards', JSON.stringify(DEFAULT_DASHBOARD_SECTIONS));
    setIsEditMode(false);
    setShowResetDialog(false);

    toast.success("Layout restaurado para o padrão");
  };

  // Mock: Renderizar cards (na implementação real, usar dados reais)
  const renderCards = (cards: CardConfig[]) => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map(card => (
          <Card key={card.id} className="h-[200px]">
            <CardHeader>
              <CardTitle className="text-base">{card.name}</CardTitle>
              <CardDescription>{card.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {/* Aqui viria o dado real do card */}
                --
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <Layout>
      <div className="space-y-8 p-6">
        {/* Header com controles de edição */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Visão geral de toda a clínica</p>
          </div>

          <div className="flex items-center gap-2">
            {isEditMode ? (
              <>
                <Button variant="outline" size="sm" onClick={() => setShowResetDialog(true)}>
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Restaurar Padrão
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancelLayout}>
                  <X className="w-4 h-4 mr-2" />
                  Cancelar
                </Button>
                <Button variant="default" size="sm" onClick={handleToggleEditMode}>
                  <Save className="w-4 h-4 mr-2" />
                  Salvar
                </Button>
              </>
            ) : (
              <Button variant="outline" size="sm" onClick={handleToggleEditMode}>
                <Settings className="w-4 h-4 mr-2" />
                Editar Layout
              </Button>
            )}
          </div>
        </div>

        {/* FASE 5: Renderizar todas as seções usando PermissionAwareSection */}
        {Object.keys(DASHBOARD_SECTIONS).map(sectionId => {
          console.log(`📋 Renderizando seção ${sectionId}, cards:`, sectionCards[sectionId] || []);
          return (
            <PermissionAwareSection
              key={sectionId}
              sectionConfig={DASHBOARD_SECTIONS[sectionId]}
              isEditMode={isEditMode}
              existingCardIds={sectionCards[sectionId] || []}
              onAddCard={(card) => handleAddCard(sectionId, card)}
              onRemoveCard={(cardId) => handleRemoveCard(sectionId, cardId)}
              renderCards={renderCards}
            />
          );
        })}

        {/* Dialogs de confirmação */}
        <AlertDialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Salvar alterações no layout?</AlertDialogTitle>
              <AlertDialogDescription>
                Deseja salvar as configurações atuais do layout ou cancelar as alterações?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelLayout}>
                Cancelar alterações
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleSaveLayout}>
                Salvar configurações
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restaurar layout padrão?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação irá restaurar o layout para as configurações padrão. Todas as personalizações atuais serão perdidas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleResetLayout}>
                Sim, restaurar padrão
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}
