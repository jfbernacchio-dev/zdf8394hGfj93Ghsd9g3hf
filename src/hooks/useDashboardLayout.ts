import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { GridCardLayout } from '@/types/cardTypes';
import type { DashboardGridLayout } from '@/lib/defaultLayoutDashboardExample';
import { 
  DEFAULT_DASHBOARD_GRID_LAYOUT,
} from '@/lib/defaultLayoutDashboardExample';
import { DEFAULT_METRICS_LAYOUT } from '@/lib/defaultLayoutMetrics';
import { findNextAvailablePosition } from '@/lib/gridLayoutUtils';

/**
 * SANITIZAÇÃO DE LAYOUT
 * Remove propriedades extras adicionadas pelo react-grid-layout
 * para garantir que apenas dados essenciais sejam salvos no Supabase
 */
type RawLayoutItem = any;

function sanitizeLayoutItem(item: RawLayoutItem): GridCardLayout {
  return {
    i: String(item.i),
    x: Number(item.x),
    y: Number(item.y),
    w: Number(item.w),
    h: Number(item.h),
    minW: item.minW != null ? Number(item.minW) : undefined,
    minH: item.minH != null ? Number(item.minH) : undefined,
    maxW: item.maxW != null ? Number(item.maxW) : undefined,
    maxH: item.maxH != null ? Number(item.maxH) : undefined,
  };
}

function sanitizeLayout(layout: RawLayoutItem[]): GridCardLayout[] {
  if (!Array.isArray(layout)) return [];
  return layout.map(sanitizeLayoutItem);
}

function sanitizeDashboardLayout(dashboardLayout: DashboardGridLayout): DashboardGridLayout {
  const sanitized: DashboardGridLayout = {} as DashboardGridLayout;
  
  Object.keys(dashboardLayout).forEach((sectionId) => {
    const section = dashboardLayout[sectionId];
    sanitized[sectionId] = {
      ...section,
      cardLayouts: sanitizeLayout(section.cardLayouts),
    };
  });
  
  return sanitized;
}

/**
 * HOOK: useDashboardLayout - FASE 3 (React Grid Layout)
 * 
 * Gerencia persistência de layout do Dashboard Example com React Grid Layout:
 * - Supabase (user_layout_preferences)
 * - localStorage (customizações temporárias)
 * 
 * MIGRAÇÃO FASE 3:
 * - Substituído DashboardExampleLayout por DashboardGridLayout
 * - Agora usa GridCardLayout (x, y, w, h) ao invés de CardLayout (width, order)
 * - updateCardWidth + updateCardOrder → updateLayout (aceita GridCardLayout[])
 */

const DEBOUNCE_SAVE_MS = 2000;

interface UseDashboardLayoutReturn {
  layout: DashboardGridLayout;
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

/**
 * Hook para gerenciar layout de dashboard com React Grid Layout
 * 
 * @param layoutType - Tipo do layout ('dashboard-example-grid' ou 'metrics-grid')
 */
export const useDashboardLayout = (layoutType: string = 'dashboard-example-grid'): UseDashboardLayoutReturn => {
  const { user } = useAuth();
  
  // Determinar default layout baseado no layoutType
  const getDefaultLayout = useCallback((): DashboardGridLayout => {
    if (layoutType === 'metrics-grid') {
      return DEFAULT_METRICS_LAYOUT;
    }
    return DEFAULT_DASHBOARD_GRID_LAYOUT;
  }, [layoutType]);

  const defaultLayout = useMemo(() => getDefaultLayout(), [getDefaultLayout]);
  
  const [layout, setLayout] = useState<DashboardGridLayout>(defaultLayout);
  const [originalLayout, setOriginalLayout] = useState<DashboardGridLayout>(defaultLayout);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  /**
   * LOAD LAYOUT FROM SUPABASE
   */
  const loadLayoutFromDatabase = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_layout_preferences')
        .select('*')
        .eq('user_id', user.id)
        .eq('layout_type', layoutType)
        .maybeSingle();

      if (error) throw error;

      if (data?.layout_config) {
        const dbLayout = data.layout_config as unknown as DashboardGridLayout;
        console.log('[DB_LAYOUT] 📦 Layout carregado do Supabase:', dbLayout);
        console.log('[DB_LAYOUT] 🔑 Keys presentes:', Object.keys(dbLayout));
        console.log('[DB_LAYOUT] 👥 dashboard-team existe?', 'dashboard-team' in dbLayout);
        console.log('[DB_LAYOUT] 📊 dashboard-team cardLayouts:', dbLayout['dashboard-team']?.cardLayouts);
        setOriginalLayout(dbLayout);
        return dbLayout;
      }

      console.log('[DB_LAYOUT] ⚠️ Nenhum layout salvo, usando padrão');
      return defaultLayout;
    } catch (error) {
      console.error('[useDashboardLayout] Erro ao carregar layout:', error);
      toast.error('Erro ao carregar preferências de layout');
      return defaultLayout;
    }
  }, [user?.id, defaultLayout, layoutType]);

  /**
   * LOAD LAYOUT FROM LOCALSTORAGE
   */
  const loadLayoutFromLocalStorage = useCallback((baseLayout: DashboardGridLayout): DashboardGridLayout => {
    // ✅ MERGE: DEFAULT primeiro, depois baseLayout sobrescreve
    // Isso garante que novas sections apareçam mesmo em layouts antigos
    const merged = { ...defaultLayout, ...baseLayout };

    console.log('[LAYOUT_AFTER_MERGE] 🔀 Resultado do spread operator:', merged);
    console.log('[MERGED_KEYS] 🔑 Keys no merged:', Object.keys(merged));
    console.log('[MERGED_KEYS] 👥 dashboard-team no merged?', 'dashboard-team' in merged);
    console.log('[MERGED_KEYS] 📊 dashboard-team cardLayouts após merge:', merged['dashboard-team']?.cardLayouts);

    Object.keys(merged).forEach(sectionId => {
      const section = merged[sectionId];
      
      section.cardLayouts = section.cardLayouts.map(cardLayout => {
        const key = `grid-card-${sectionId}-${cardLayout.i}`;
        const saved = localStorage.getItem(key);
        
        if (saved) {
          try {
            const parsed = JSON.parse(saved) as GridCardLayout;
            console.log(`[useDashboardLayout] Aplicando customização do localStorage:`, {
              sectionId,
              cardId: cardLayout.i,
              original: cardLayout,
              customized: parsed,
            });
            return { ...cardLayout, ...parsed };
          } catch (error) {
            console.error(`[useDashboardLayout] Erro ao parsear customização:`, error);
          }
        }
        
        return cardLayout;
      });
    });

    console.log('[FINAL_LAYOUT] ✅ Layout final após aplicar localStorage:', merged);
    console.log('[FINAL_LAYOUT] 👥 dashboard-team final:', merged['dashboard-team']);
    console.log('[FINAL_LAYOUT] 📊 dashboard-team cardLayouts final:', merged['dashboard-team']?.cardLayouts);
    return merged;
  }, [defaultLayout]);

  /**
   * INITIALIZE LAYOUT
   */
  useEffect(() => {
    const initLayout = async () => {
      setLoading(true);
      const dbLayout = await loadLayoutFromDatabase();
      const finalLayout = loadLayoutFromLocalStorage(dbLayout);
      console.log('[INIT_LAYOUT] 🎬 Antes de setLayout:', finalLayout);
      console.log('[INIT_LAYOUT] 👥 dashboard-team antes do setState:', finalLayout['dashboard-team']);
      setLayout(finalLayout);
      setLoading(false);
    };

    initLayout();
  }, [loadLayoutFromDatabase, loadLayoutFromLocalStorage]);

  /**
   * CHECK IF MODIFIED
   */
  const isModified = JSON.stringify(layout) !== JSON.stringify(originalLayout);
  const hasUnsavedChanges = isModified;

  /**
   * UPDATE LAYOUT (FASE 3 - Nova função)
   */
  const updateLayout = useCallback((sectionId: string, newLayout: GridCardLayout[]) => {
    console.log('[METRICS-LAYOUT] 🔄 updateLayout called:', {
      sectionId,
      cardCount: newLayout.length,
      cardIds: newLayout.map(c => c.i),
    });

    setLayout((prev) => {
      const section = prev[sectionId];
      if (!section) {
        console.warn(`[METRICS-LAYOUT] ⚠️ Seção ${sectionId} não encontrada`);
        return prev;
      }

      // Salvar cada card no localStorage
      newLayout.forEach((cardLayout) => {
        const key = `grid-card-${sectionId}-${cardLayout.i}`;
        localStorage.setItem(key, JSON.stringify(cardLayout));
      });

      const updated = {
        ...prev,
        [sectionId]: {
          ...section,
          cardLayouts: newLayout,
        },
      };

      console.log('[METRICS-LAYOUT] ✅ Layout atualizado no estado React');
      return updated;
    });
  }, []);

  /**
   * ADD CARD
   */
  const addCard = useCallback((sectionId: string, cardId: string) => {
    console.log(`[useDashboardLayout] Adicionando card ${cardId} à seção ${sectionId}`);
    
    setLayout((prev) => {
      const section = prev[sectionId];
      if (!section) {
        console.warn(`[useDashboardLayout] Seção ${sectionId} não encontrada`);
        return prev;
      }

      if (section.cardLayouts.some(cl => cl.i === cardId)) {
        console.warn(`[useDashboardLayout] Card ${cardId} já existe na seção ${sectionId}`);
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

      console.log(`[useDashboardLayout] Novo card grid criado:`, newCard);

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
    console.log(`[useDashboardLayout] Removendo card ${cardId} da seção ${sectionId}`);
    
    setLayout((prev) => {
      const section = prev[sectionId];
      if (!section) {
        console.warn(`[useDashboardLayout] Seção ${sectionId} não encontrada`);
        return prev;
      }

      const filteredCards = section.cardLayouts.filter(cl => cl.i !== cardId);

      const key = `grid-card-${sectionId}-${cardId}`;
      localStorage.removeItem(key);

      console.log(`[useDashboardLayout] Cards restantes:`, filteredCards);

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
   * SAVE LAYOUT TO SUPABASE
   */
  const saveLayout = useCallback(async () => {
    if (!user?.id) {
      console.error('[METRICS-LAYOUT] ❌ Tentou salvar sem usuário autenticado');
      toast.error('Usuário não autenticado');
      return;
    }

    console.log('[METRICS-LAYOUT] 💾 Iniciando salvamento...', {
      userId: user.id,
      layoutType,
      sectionsCount: Object.keys(layout).length,
    });

    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('user_layout_preferences')
        .select('id, version')
        .eq('user_id', user.id)
        .eq('layout_type', layoutType)
        .maybeSingle();

      // ✅ CORREÇÃO CRÍTICA: Sanitizar ANTES de qualquer operação
      const sanitizedLayout = sanitizeDashboardLayout(layout);
      
      console.log('[METRICS-LAYOUT] 🧹 Layout sanitizado:', {
        before: Object.keys(layout).map(k => ({
          section: k,
          cardCount: layout[k].cardLayouts.length,
          sampleCard: layout[k].cardLayouts[0],
        })),
        after: Object.keys(sanitizedLayout).map(k => ({
          section: k,
          cardCount: sanitizedLayout[k].cardLayouts.length,
          sampleCard: sanitizedLayout[k].cardLayouts[0],
        })),
      });

      if (existing) {
        console.log('[METRICS-LAYOUT] 🔄 Atualizando registro existente:', existing.id);
        
        const { data, error } = await supabase
          .from('user_layout_preferences')
          .update({
            layout_config: sanitizedLayout as any,
            version: existing.version + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) {
          console.error('[METRICS-LAYOUT] ❌ Erro do Supabase no UPDATE:', error);
          throw error;
        }

        console.log('[METRICS-LAYOUT] ✅ UPDATE bem-sucedido, data:', data);
      } else {
        console.log('[METRICS-LAYOUT] ➕ Criando novo registro');
        
        const { data, error } = await supabase
          .from('user_layout_preferences')
          .insert({
            user_id: user.id,
            layout_type: layoutType,
            layout_config: sanitizedLayout as any,
            version: 1,
          });

        if (error) {
          console.error('[METRICS-LAYOUT] ❌ Erro do Supabase no INSERT:', error);
          throw error;
        }

        console.log('[METRICS-LAYOUT] ✅ INSERT bem-sucedido, data:', data);
      }

      // ✅ CORREÇÃO CRÍTICA: Atualizar originalLayout com layout SANITIZADO
      // Isso garante que isModified não retorne falso positivo
      setOriginalLayout(sanitizedLayout);
      
      toast.success('Layout salvo com sucesso!');
      console.log('[METRICS-LAYOUT] ✅ originalLayout atualizado com versão sanitizada');
      console.log('[METRICS-LAYOUT] ✅ Salvamento concluído com sucesso!');
    } catch (error) {
      // ✅ CORREÇÃO: Só exibir toast de erro se houver erro REAL
      console.error('[METRICS-LAYOUT] ❌ ERRO CAPTURADO - Disparando toast de erro:', error);
      toast.error('Erro ao salvar layout');
    } finally {
      setSaving(false);
      console.log('[METRICS-LAYOUT] 🏁 Finalizando saveLayout (saving=false)');
    }
  }, [user?.id, layout, layoutType]);

  /**
   * RESET LAYOUT
   */
  const resetLayout = useCallback(async () => {
    if (!user?.id) {
      console.error('[METRICS-LAYOUT] ❌ Tentou resetar sem usuário autenticado');
      toast.error('Usuário não autenticado');
      return;
    }

    console.log('[METRICS-LAYOUT] 🔄 Iniciando reset do layout...');

    try {
      // Limpar localStorage
      console.log('[METRICS-LAYOUT] 🗑️ Limpando localStorage...');
      Object.keys(defaultLayout).forEach(sectionId => {
        const section = defaultLayout[sectionId];
        section.cardLayouts.forEach(card => {
          const key = `grid-card-${sectionId}-${card.i}`;
          localStorage.removeItem(key);
        });
      });

      // Deletar do Supabase
      console.log('[METRICS-LAYOUT] 🗑️ Deletando do Supabase...');
      const { error } = await supabase
        .from('user_layout_preferences')
        .delete()
        .eq('user_id', user.id)
        .eq('layout_type', layoutType);

      if (error) {
        console.error('[METRICS-LAYOUT] ❌ Erro do Supabase no DELETE:', error);
        throw error;
      }

      console.log('[METRICS-LAYOUT] ✅ Deletado do Supabase com sucesso');

      // ✅ CORREÇÃO: Sanitizar o defaultLayout antes de setar como originalLayout
      const sanitizedDefault = sanitizeDashboardLayout(defaultLayout);
      
      setLayout(sanitizedDefault);
      setOriginalLayout(sanitizedDefault);
      
      toast.success('Layout resetado para o padrão!');
      console.log('[METRICS-LAYOUT] ✅ Reset concluído com sucesso');
    } catch (error) {
      console.error('[METRICS-LAYOUT] ❌ ERRO ao resetar layout:', error);
      toast.error('Erro ao resetar layout');
    }
  }, [user?.id, defaultLayout, layoutType]);

  /**
   * AUTO-SAVE com debounce
   */
  useEffect(() => {
    if (!isModified) {
      console.log('[METRICS-LAYOUT] ⏭️ Auto-save ignorado (isModified=false)');
      return;
    }

    console.log('[METRICS-LAYOUT] ⏰ Auto-save agendado (debounce 2s)...', {
      isModified,
      sectionsCount: Object.keys(layout).length,
    });

    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const timeout = setTimeout(() => {
      console.log('[METRICS-LAYOUT] 🚀 Auto-save DISPARADO após debounce');
      saveLayout();
    }, DEBOUNCE_SAVE_MS);

    setSaveTimeout(timeout);

    return () => {
      if (timeout) {
        console.log('[METRICS-LAYOUT] 🧹 Auto-save cancelado (novo layout incoming)');
        clearTimeout(timeout);
      }
    };
  }, [layout, isModified]);

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
