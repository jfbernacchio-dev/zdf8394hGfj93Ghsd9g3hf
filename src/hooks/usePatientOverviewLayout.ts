import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import type { GridCardLayout } from '@/types/cardTypes';
import type { PatientOverviewGridLayout } from '@/lib/defaultLayoutPatientOverview';
import { DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT } from '@/lib/defaultLayoutPatientOverview';
import { findNextAvailablePosition } from '@/lib/gridLayoutUtils';

/**
 * HOOK: usePatientOverviewLayout - FASE C1.1
 * 
 * Gerencia persistência de layout da aba "Visão Geral" do PatientDetail com React Grid Layout.
 * 
 * NOTA IMPORTANTE:
 * - FASE C1.1 usa APENAS localStorage (sem Supabase)
 * - Estrutura preparada para futuras integrações com Supabase
 * - Baseado no hook useDashboardLayout.ts mas com escopo limitado
 */

const LAYOUT_TYPE = 'patient-overview-grid';
const DEBOUNCE_SAVE_MS = 2000;

interface UsePatientOverviewLayoutReturn {
  layout: PatientOverviewGridLayout;
  loading: boolean;
  saving: boolean;
  isModified: boolean;
  updateLayout: (sectionId: string, newLayout: GridCardLayout[]) => void;
  addCard: (sectionId: string, cardId: string) => void;
  removeCard: (sectionId: string, cardId: string) => void;
  saveLayout: () => Promise<void>;
  resetLayout: () => Promise<void>;
  hasUnsavedChanges: boolean;
}

export const usePatientOverviewLayout = (): UsePatientOverviewLayoutReturn => {
  const [layout, setLayout] = useState<PatientOverviewGridLayout>(DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT);
  const [originalLayout, setOriginalLayout] = useState<PatientOverviewGridLayout>(DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  /**
   * LOAD LAYOUT FROM LOCALSTORAGE
   * 
   * FASE C1.1: Apenas localStorage (sem Supabase)
   */
  const loadLayoutFromLocalStorage = useCallback((): PatientOverviewGridLayout => {
    // Começar com layout padrão
    const merged = { ...DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT };

    console.log('[usePatientOverviewLayout] Carregando customizações do localStorage');

    // Aplicar customizações do localStorage em cada card de cada seção
    Object.keys(merged).forEach(sectionId => {
      const section = merged[sectionId];
      
      section.cardLayouts = section.cardLayouts.map(cardLayout => {
        const key = `grid-card-${sectionId}-${cardLayout.i}`;
        const saved = localStorage.getItem(key);
        
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as GridCardLayout;
            console.log(`[usePatientOverviewLayout] Aplicando customização:`, {
              sectionId,
              cardId: cardLayout.i,
              original: cardLayout,
              customized: parsed,
            });
            return { ...cardLayout, ...parsed };
          } catch (error) {
            console.error(`[usePatientOverviewLayout] Erro ao parsear customização:`, error);
          }
        }
        
        return cardLayout;
      });
    });

    console.log('[usePatientOverviewLayout] Layout final carregado:', merged);
    return merged;
  }, []);

  /**
   * INITIALIZE LAYOUT
   */
  useEffect(() => {
    const initLayout = () => {
      setLoading(true);
      const finalLayout = loadLayoutFromLocalStorage();
      setLayout(finalLayout);
      setOriginalLayout(finalLayout);
      setLoading(false);
      console.log('[usePatientOverviewLayout] Layout inicializado');
    };

    initLayout();
  }, [loadLayoutFromLocalStorage]);

  /**
   * CHECK IF MODIFIED
   */
  const isModified = JSON.stringify(layout) !== JSON.stringify(originalLayout);
  const hasUnsavedChanges = isModified;

  /**
   * UPDATE LAYOUT
   */
  const updateLayout = useCallback((sectionId: string, newLayout: GridCardLayout[]) => {
    console.log('[usePatientOverviewLayout] Atualizando layout da seção:', {
      sectionId,
      newLayout,
    });

    setLayout((prev) => {
      const section = prev[sectionId];
      if (!section) {
        console.warn(`[usePatientOverviewLayout] Seção ${sectionId} não encontrada`);
        return prev;
      }

      // Salvar cada card no localStorage
      newLayout.forEach((cardLayout) => {
        const key = `grid-card-${sectionId}-${cardLayout.i}`;
        localStorage.setItem(key, JSON.stringify(cardLayout));
      });

      return {
        ...prev,
        [sectionId]: {
          ...section,
          cardLayouts: newLayout,
        },
      };
    });
  }, []);

  /**
   * ADD CARD
   */
  const addCard = useCallback((sectionId: string, cardId: string) => {
    console.log(`[usePatientOverviewLayout] Adicionando card ${cardId} à seção ${sectionId}`);
    
    setLayout((prev) => {
      const section = prev[sectionId];
      if (!section) {
        console.warn(`[usePatientOverviewLayout] Seção ${sectionId} não encontrada`);
        return prev;
      }

      if (section.cardLayouts.some(cl => cl.i === cardId)) {
        console.warn(`[usePatientOverviewLayout] Card ${cardId} já existe na seção ${sectionId}`);
        return prev;
      }

      const { x, y } = findNextAvailablePosition(section.cardLayouts, 3, 2);

      const newCard: GridCardLayout = {
        i: cardId,
        x,
        y,
        w: 3,
        h: 2,
        minW: 2,
        minH: 1,
        maxW: 12,
      };

      console.log(`[usePatientOverviewLayout] Novo card grid criado:`, newCard);

      const key = `grid-card-${sectionId}-${cardId}`;
      localStorage.setItem(key, JSON.stringify(newCard));

      return {
        ...prev,
        [sectionId]: {
          ...section,
          cardLayouts: [...section.cardLayouts, newCard],
        },
      };
    });
  }, []);

  /**
   * REMOVE CARD
   */
  const removeCard = useCallback((sectionId: string, cardId: string) => {
    console.log(`[usePatientOverviewLayout] Removendo card ${cardId} da seção ${sectionId}`);
    
    setLayout((prev) => {
      const section = prev[sectionId];
      if (!section) {
        console.warn(`[usePatientOverviewLayout] Seção ${sectionId} não encontrada`);
        return prev;
      }

      const filteredCards = section.cardLayouts.filter(cl => cl.i !== cardId);

      const key = `grid-card-${sectionId}-${cardId}`;
      localStorage.removeItem(key);

      console.log(`[usePatientOverviewLayout] Cards restantes:`, filteredCards);

      return {
        ...prev,
        [sectionId]: {
          ...section,
          cardLayouts: filteredCards,
        },
      };
    });
  }, []);

  /**
   * SAVE LAYOUT
   * 
   * FASE C1.1: Apenas salva no localStorage
   * Futura integração com Supabase será implementada quando necessário
   */
  const saveLayout = useCallback(async () => {
    setSaving(true);
    try {
      // Layout já está salvo no localStorage através de updateLayout
      // Esta função existe para manter API compatível com dashboard
      setOriginalLayout(layout);
      toast.success('Layout salvo com sucesso!');
      console.log('[usePatientOverviewLayout] Layout salvo (localStorage apenas)');
    } catch (error) {
      console.error('[usePatientOverviewLayout] Erro ao salvar layout:', error);
      toast.error('Erro ao salvar layout');
    } finally {
      setSaving(false);
    }
  }, [layout]);

  /**
   * RESET LAYOUT
   */
  const resetLayout = useCallback(async () => {
    try {
      // Limpar localStorage
      Object.keys(DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT).forEach(sectionId => {
        const section = DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT[sectionId];
        section.cardLayouts.forEach(card => {
          const key = `grid-card-${sectionId}-${card.i}`;
          localStorage.removeItem(key);
        });
      });

      setLayout(DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT);
      setOriginalLayout(DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT);
      
      toast.success('Layout resetado para o padrão!');
      console.log('[usePatientOverviewLayout] Layout resetado');
    } catch (error) {
      console.error('[usePatientOverviewLayout] Erro ao resetar layout:', error);
      toast.error('Erro ao resetar layout');
    }
  }, []);

  /**
   * AUTO-SAVE com debounce
   */
  useEffect(() => {
    if (!isModified) return;

    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const timeout = setTimeout(() => {
      console.log('[usePatientOverviewLayout] Auto-save triggered');
      saveLayout();
    }, DEBOUNCE_SAVE_MS);

    setSaveTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [layout, isModified, saveLayout]);

  return {
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
  };
};
