import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { GridCardLayout } from '@/types/cardTypes';
import type { PatientOverviewGridLayout } from '@/lib/defaultLayoutPatientOverview';
import { DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT } from '@/lib/defaultLayoutPatientOverview';

/**
 * HOOK: usePatientOverviewLayout - FASE C1.10.3-H2 (Supabase)
 * 
 * Gerencia persistência de layout da aba "Visão Geral" com Supabase:
 * - Supabase (patient_overview_layouts) como fonte da verdade
 * - localStorage apenas como cache de edição
 * 
 * ARQUITETURA (idêntica ao useDashboardLayout):
 * - Carregar do DB ao montar (loadLayoutFromDatabase)
 * - Auto-save com debounce (saveLayout)
 * - Reset deleta do DB (resetLayout)
 * - Merge com defaults para novos cards
 * 
 * RESOLVEU:
 * - ✅ RESSALVA 1: Isolamento por user_id no DB
 * - ✅ RESSALVA 2: DB é fonte única (não há chaves órfãs)
 * - ✅ RESSALVA 3: Sem migração (sem flags permanentes)
 */

const DEBOUNCE_SAVE_MS = 1500; // Mesmo debounce da Dashboard

// ============================================================================
// INTERFACE DE RETORNO
// ============================================================================

interface UsePatientOverviewLayoutReturn {
  layout: PatientOverviewGridLayout;
  loading: boolean;
  saving: boolean;
  isModified: boolean;
  hasUnsavedChanges: boolean;
  updateLayout: (sectionId: string, newLayout: GridCardLayout[]) => void;
  addCard: (sectionId: string, cardId: string) => void;
  removeCard: (sectionId: string, cardId: string) => void;
  saveLayout: () => Promise<void>;
  resetLayout: () => Promise<void>;
}

// ============================================================================
// HELPERS: localStorage (cache apenas)
// ============================================================================

/**
 * Gera chave única para localStorage baseada em userId e patientId
 */
const getStorageKey = (userId: string, patientId?: string): string => {
  return patientId 
    ? `patient-overview-layout-${userId}-${patientId}`
    : `patient-overview-layout-${userId}-general`;
};

/**
 * Salva layout no localStorage como cache
 */
const saveLayoutToLocalStorage = (userId: string, layout: PatientOverviewGridLayout, patientId?: string): void => {
  try {
    const key = getStorageKey(userId, patientId);
    localStorage.setItem(key, JSON.stringify(layout));
    console.log('[usePatientOverviewLayout] 💾 Layout salvo no localStorage (cache):', key);
  } catch (error) {
    console.error('[usePatientOverviewLayout] ❌ Erro ao salvar no localStorage:', error);
  }
};

/**
 * Limpa layout do localStorage
 */
const clearLayoutFromLocalStorage = (userId?: string, patientId?: string): void => {
  if (!userId) return;
  
  try {
    const key = getStorageKey(userId, patientId);
    localStorage.removeItem(key);
    console.log('[usePatientOverviewLayout] 🗑️ Layout removido do localStorage:', key);
  } catch (error) {
    console.error('[usePatientOverviewLayout] ❌ Erro ao limpar localStorage:', error);
  }
};

/**
 * Merge layout do DB com defaults
 * Garante que novos cards/sections apareçam mesmo em layouts antigos
 */
const mergeLayoutWithDefaults = (
  dbLayout: PatientOverviewGridLayout, 
  defaultLayout: PatientOverviewGridLayout
): PatientOverviewGridLayout => {
  const merged = { ...defaultLayout };
  
  Object.keys(dbLayout).forEach(sectionId => {
    if (merged[sectionId]) {
      // Section existe: merge cards (prioriza DB, adiciona novos do default)
      const dbCards = dbLayout[sectionId].cardLayouts;
      const defaultCards = defaultLayout[sectionId].cardLayouts;
      
      const dbCardIds = new Set(dbCards.map(c => c.i));
      const newCards = defaultCards.filter(c => !dbCardIds.has(c.i));
      
      merged[sectionId] = {
        cardLayouts: [...dbCards, ...newCards]
      };
    } else {
      // Section não existe no default: adicionar completa
      merged[sectionId] = dbLayout[sectionId];
    }
  });
  
  console.log('[usePatientOverviewLayout] 🔀 Layout merged com defaults:', {
    dbSections: Object.keys(dbLayout),
    defaultSections: Object.keys(defaultLayout),
    mergedSections: Object.keys(merged)
  });
  
  return merged;
};

// ============================================================================
// HOOK
// ============================================================================

export const usePatientOverviewLayout = (patientId?: string): UsePatientOverviewLayoutReturn => {
  const [layout, setLayout] = useState<PatientOverviewGridLayout>(DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT);
  const [originalLayout, setOriginalLayout] = useState<PatientOverviewGridLayout>(DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  /**
   * LOAD LAYOUT FROM SUPABASE
   * CORREÇÃO H2: Usar .maybeSingle() em vez de .single()
   */
  const loadLayoutFromDatabase = useCallback(async (userId: string, patientId?: string): Promise<PatientOverviewGridLayout | null> => {
    try {
      setLoading(true);

      let query = supabase
        .from('patient_overview_layouts')
        .select('*')
        .eq('user_id', userId);

      if (patientId) {
        query = query.eq('patient_id', patientId);
      } else {
        query = query.is('patient_id', null);
      }

      // ✅ CORREÇÃO: Usar maybeSingle() - não lança erro se não encontrar
      const { data, error } = await query.maybeSingle();

      if (error) {
        console.error('[usePatientOverviewLayout] ❌ Erro ao carregar layout do DB:', error);
        return null;
      }

      if (data?.layout_json) {
        console.log('[usePatientOverviewLayout] 📦 Layout carregado do Supabase:', data);
        return data.layout_json as unknown as PatientOverviewGridLayout;
      }

      console.log('[usePatientOverviewLayout] ⚠️ Nenhum layout salvo, usando padrão');
      return null;
    } catch (err) {
      console.error('[usePatientOverviewLayout] ❌ Exception ao carregar layout:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * INITIALIZE LAYOUT
   * Carrega do Supabase ao montar, merge com defaults, atualiza cache local
   */
  useEffect(() => {
    const initializeLayout = async () => {
      setLoading(true);
      
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        // Não logado: usar default local
        console.log('[usePatientOverviewLayout] ⚠️ Usuário não autenticado, usando default');
        setLayout(DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT);
        setOriginalLayout(DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT);
        setLoading(false);
        return;
      }

      // Logado: carregar do DB
      const dbLayout = await loadLayoutFromDatabase(user.id, patientId);

      if (dbLayout) {
        // Merge com defaults (garante novos cards apareçam)
        const merged = mergeLayoutWithDefaults(dbLayout, DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT);
        setLayout(merged);
        setOriginalLayout(merged);
        
        // Atualizar cache local
        saveLayoutToLocalStorage(user.id, merged, patientId);
      } else {
        // Primeira vez: usar default
        console.log('[usePatientOverviewLayout] 🆕 Primeira vez, usando default');
        setLayout(DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT);
        setOriginalLayout(DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT);
      }

      setLoading(false);
    };

    initializeLayout();
  }, [patientId, loadLayoutFromDatabase]);

  /**
   * CHECK IF MODIFIED
   */
  const isModified = JSON.stringify(layout) !== JSON.stringify(originalLayout);
  const hasUnsavedChanges = isModified;

  /**
   * UPDATE LAYOUT
   * Atualiza layout de uma seção e salva no cache local
   */
  const updateLayout = useCallback(async (sectionId: string, newLayout: GridCardLayout[]) => {
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

      const updated = {
        ...prev,
        [sectionId]: {
          ...section,
          cardLayouts: newLayout,
        },
      };

      // Atualizar cache local imediatamente
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          saveLayoutToLocalStorage(user.id, updated, patientId);
        }
      });

      return updated;
    });
  }, [patientId]);

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

      // Encontrar próxima posição disponível
      const maxY = section.cardLayouts.reduce((max, card) => Math.max(max, card.y + card.h), 0);

      const newCard: GridCardLayout = {
        i: cardId,
        x: 0,
        y: maxY,
        w: 4,
        h: 3,
        minW: 3,
        minH: 2,
      };

      console.log(`[usePatientOverviewLayout] Novo card grid criado:`, newCard);

      const updated = {
        ...prev,
        [sectionId]: {
          ...section,
          cardLayouts: [...section.cardLayouts, newCard],
        },
      };

      // Atualizar cache local
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          saveLayoutToLocalStorage(user.id, updated, patientId);
        }
      });

      return updated;
    });
  }, [patientId]);

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

      console.log(`[usePatientOverviewLayout] Cards restantes:`, filteredCards);

      const updated = {
        ...prev,
        [sectionId]: {
          ...section,
          cardLayouts: filteredCards,
        },
      };

      // Atualizar cache local
      supabase.auth.getUser().then(({ data: { user } }) => {
        if (user) {
          saveLayoutToLocalStorage(user.id, updated, patientId);
        }
      });

      return updated;
    });
  }, [patientId]);

  /**
   * SAVE LAYOUT TO SUPABASE
   * UPSERT baseado em (user_id, patient_id)
   */
  const saveLayout = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from('patient_overview_layouts')
        .upsert(
          {
            user_id: user.id,
            patient_id: patientId || null,
            layout_json: layout as any,
            version: 1,
          },
          { 
            onConflict: 'user_id,patient_id'
          }
        );

      if (error) throw error;

      setOriginalLayout(layout);
      saveLayoutToLocalStorage(user.id, layout, patientId);
      
      toast.success('Layout salvo com sucesso!');
      console.log('[usePatientOverviewLayout] ✅ Layout salvo no Supabase');
    } catch (error) {
      console.error('[usePatientOverviewLayout] ❌ Erro ao salvar layout:', error);
      toast.error('Erro ao salvar layout');
    } finally {
      setSaving(false);
    }
  }, [layout, patientId]);

  /**
   * RESET LAYOUT
   * CORREÇÃO H2: Tratamento correto de patient_id null no DELETE
   */
  const resetLayout = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      // Deletar do Supabase
      let deleteQuery = supabase
        .from('patient_overview_layouts')
        .delete()
        .eq('user_id', user.id);
      
      // ✅ CORREÇÃO: Tratamento correto de patient_id null
      if (patientId) {
        deleteQuery = deleteQuery.eq('patient_id', patientId);
      } else {
        deleteQuery = deleteQuery.is('patient_id', null);
      }
      
      const { error } = await deleteQuery;

      if (error) throw error;

      // Limpar cache local
      clearLayoutFromLocalStorage(user.id, patientId);

      // Voltar ao default
      setLayout(DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT);
      setOriginalLayout(DEFAULT_PATIENT_OVERVIEW_GRID_LAYOUT);
      
      toast.success('Layout resetado para o padrão!');
      console.log('[usePatientOverviewLayout] ✅ Layout resetado');
    } catch (error) {
      console.error('[usePatientOverviewLayout] ❌ Erro ao resetar layout:', error);
      toast.error('Erro ao resetar layout');
    }
  }, [patientId]);

  /**
   * AUTO-SAVE com debounce
   * Salva automaticamente no Supabase após 1.5s de inatividade
   */
  useEffect(() => {
    if (!isModified) return;

    const timer = setTimeout(() => {
      console.log('[usePatientOverviewLayout] ⏰ Auto-save triggered');
      saveLayout();
    }, DEBOUNCE_SAVE_MS);

    return () => clearTimeout(timer);
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
