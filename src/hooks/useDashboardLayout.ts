import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { DashboardExampleLayout, CardLayout } from '@/lib/defaultLayoutDashboardExample';
import { 
  DEFAULT_DASHBOARD_EXAMPLE_LAYOUT,
  resetToDefaultDashboardExampleLayout 
} from '@/lib/defaultLayoutDashboardExample';

/**
 * HOOK: useDashboardLayout
 * 
 * Gerencia persistência de layout do Dashboard Example entre:
 * - Supabase (user_layout_preferences)
 * - localStorage (customizações temporárias)
 * 
 * FLUXO:
 * 1. Carrega do Supabase ao montar
 * 2. Faz merge com localStorage (localStorage tem prioridade)
 * 3. Salva de volta no Supabase ao finalizar edição
 * 4. Permite reset para layout padrão
 * 
 * DIFERENÇA DO SISTEMA ORIGINAL:
 * - Dashboard original: usa user_layout_templates (templates salvos)
 * - Dashboard Example: usa user_layout_preferences (preferências ativas)
 */

const LAYOUT_TYPE = 'dashboard-example';
const DEBOUNCE_SAVE_MS = 2000; // 2 segundos de debounce para auto-save

interface UseDashboardLayoutReturn {
  layout: DashboardExampleLayout;
  loading: boolean;
  saving: boolean;
  isModified: boolean;
  updateCardWidth: (sectionId: string, cardId: string, width: number) => void;
  updateCardOrder: (sectionId: string, cardIds: string[]) => void;
  addCard: (sectionId: string, cardId: string) => void;
  removeCard: (sectionId: string, cardId: string) => void;
  saveLayout: () => Promise<void>;
  resetLayout: () => Promise<void>;
  hasUnsavedChanges: boolean;
}

export const useDashboardLayout = (): UseDashboardLayoutReturn => {
  const { user } = useAuth();
  const [layout, setLayout] = useState<DashboardExampleLayout>(DEFAULT_DASHBOARD_EXAMPLE_LAYOUT);
  const [originalLayout, setOriginalLayout] = useState<DashboardExampleLayout>(DEFAULT_DASHBOARD_EXAMPLE_LAYOUT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  /**
   * LOAD LAYOUT FROM SUPABASE
   * Carrega preferências do usuário do banco de dados
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
        .eq('layout_type', LAYOUT_TYPE)
        .maybeSingle();

      if (error) throw error;

      if (data?.layout_config) {
        // Validar e converter Json para DashboardExampleLayout
        const dbLayout = data.layout_config as unknown as DashboardExampleLayout;
        console.log('[useDashboardLayout] Layout carregado do Supabase:', dbLayout);
        setOriginalLayout(dbLayout);
        return dbLayout;
      }

      console.log('[useDashboardLayout] Nenhum layout salvo, usando padrão');
      return DEFAULT_DASHBOARD_EXAMPLE_LAYOUT;
    } catch (error) {
      console.error('[useDashboardLayout] Erro ao carregar layout:', error);
      toast.error('Erro ao carregar preferências de layout');
      return DEFAULT_DASHBOARD_EXAMPLE_LAYOUT;
    }
  }, [user?.id]);

  /**
   * LOAD LAYOUT FROM LOCALSTORAGE
   * Carrega customizações temporárias (width e order) do localStorage
   */
  const loadLayoutFromLocalStorage = useCallback((baseLayout: DashboardExampleLayout): DashboardExampleLayout => {
    const merged = { ...baseLayout };

    Object.keys(merged).forEach(sectionId => {
      const section = merged[sectionId];
      
      section.cardLayouts = section.cardLayouts.map(cardLayout => {
        // Carregar width customizado
        const widthKey = `card-width-${sectionId}-${cardLayout.cardId}`;
        const savedWidth = localStorage.getItem(widthKey);
        const width = savedWidth ? parseInt(savedWidth, 10) : cardLayout.width;

        // Carregar order customizado
        const orderKey = `card-order-${sectionId}-${cardLayout.cardId}`;
        const savedOrder = localStorage.getItem(orderKey);
        const order = savedOrder ? parseInt(savedOrder, 10) : cardLayout.order;

        return {
          ...cardLayout,
          width: !isNaN(width) ? width : cardLayout.width,
          order: !isNaN(order) ? order : cardLayout.order,
        };
      }).sort((a, b) => a.order - b.order); // Reordenar por order
    });

    console.log('[useDashboardLayout] Layout mesclado com localStorage:', merged);
    return merged;
  }, []);

  /**
   * INITIALIZE LAYOUT
   * Carrega do Supabase + merge com localStorage
   */
  useEffect(() => {
    const initializeLayout = async () => {
      setLoading(true);
      const dbLayout = await loadLayoutFromDatabase();
      const mergedLayout = loadLayoutFromLocalStorage(dbLayout);
      setLayout(mergedLayout);
      setOriginalLayout(dbLayout);
      setLoading(false);
    };

    initializeLayout();
  }, [loadLayoutFromDatabase, loadLayoutFromLocalStorage]);

  /**
   * CHECK IF MODIFIED
   * Verifica se o layout atual difere do original
   */
  const isModified = JSON.stringify(layout) !== JSON.stringify(originalLayout);
  const hasUnsavedChanges = isModified;

  /**
   * UPDATE CARD WIDTH
   * Atualiza largura de um card específico
   */
  const updateCardWidth = useCallback((sectionId: string, cardId: string, width: number) => {
    setLayout(prev => {
      const section = prev[sectionId];
      if (!section) return prev;

      return {
        ...prev,
        [sectionId]: {
          ...section,
          cardLayouts: section.cardLayouts.map(cl =>
            cl.cardId === cardId ? { ...cl, width } : cl
          ),
        },
      };
    });

    // Salvar no localStorage imediatamente
    const widthKey = `card-width-${sectionId}-${cardId}`;
    localStorage.setItem(widthKey, width.toString());
  }, []);

  /**
   * UPDATE CARD ORDER
   * Atualiza ordem dos cards em uma seção (usado pelo drag & drop)
   */
  const updateCardOrder = useCallback((sectionId: string, cardIds: string[]) => {
    setLayout(prev => {
      const section = prev[sectionId];
      if (!section) return prev;

      const reordered = cardIds.map((cardId, index) => {
        const cardLayout = section.cardLayouts.find(cl => cl.cardId === cardId);
        if (!cardLayout) return null;
        return { ...cardLayout, order: index };
      }).filter(Boolean) as CardLayout[];

      return {
        ...prev,
        [sectionId]: {
          ...section,
          cardLayouts: reordered,
        },
      };
    });

    // Salvar orders no localStorage
    cardIds.forEach((cardId, index) => {
      const orderKey = `card-order-${sectionId}-${cardId}`;
      localStorage.setItem(orderKey, index.toString());
    });
  }, []);

  /**
   * ADD CARD
   * Adiciona um card a uma seção
   */
  const addCard = useCallback((sectionId: string, cardId: string) => {
    console.log(`[useDashboardLayout] Adicionando card ${cardId} à seção ${sectionId}`);
    
    setLayout((prev) => {
      const section = prev[sectionId];
      if (!section) {
        console.warn(`[useDashboardLayout] Seção ${sectionId} não encontrada`);
        return prev;
      }

      // Verificar se o card já existe
      if (section.cardLayouts.some(cl => cl.cardId === cardId)) {
        console.warn(`[useDashboardLayout] Card ${cardId} já existe na seção ${sectionId}`);
        return prev;
      }

      // Determinar a ordem do novo card (maior ordem + 1)
      const maxOrder = section.cardLayouts.length > 0
        ? Math.max(...section.cardLayouts.map(cl => cl.order))
        : -1;

      // Obter configuração padrão da seção para width padrão
      const defaultWidth = 300; // width padrão

      const newCard: CardLayout = {
        cardId,
        order: maxOrder + 1,
        width: defaultWidth,
      };

      console.log(`[useDashboardLayout] Novo card criado:`, newCard);

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
   * Remove um card de uma seção
   */
  const removeCard = useCallback((sectionId: string, cardId: string) => {
    console.log(`[useDashboardLayout] Removendo card ${cardId} da seção ${sectionId}`);
    
    setLayout((prev) => {
      const section = prev[sectionId];
      if (!section) {
        console.warn(`[useDashboardLayout] Seção ${sectionId} não encontrada`);
        return prev;
      }

      // Filtrar o card
      const filteredCards = section.cardLayouts.filter(cl => cl.cardId !== cardId);

      // Remover do localStorage
      const widthKey = `card-width-${sectionId}-${cardId}`;
      const orderKey = `card-order-${sectionId}-${cardId}`;
      localStorage.removeItem(widthKey);
      localStorage.removeItem(orderKey);

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
   * Persiste layout atual no banco de dados
   */
  const saveLayout = useCallback(async () => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    setSaving(true);
    try {
      // Verificar se já existe um registro
      const { data: existing } = await supabase
        .from('user_layout_preferences')
        .select('id, version')
        .eq('user_id', user.id)
        .eq('layout_type', LAYOUT_TYPE)
        .maybeSingle();

      if (existing) {
        // Atualizar registro existente
        const { error } = await supabase
          .from('user_layout_preferences')
          .update({
            layout_config: layout as any,
            version: existing.version + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Criar novo registro
        const { error } = await supabase
          .from('user_layout_preferences')
          .insert({
            user_id: user.id,
            layout_type: LAYOUT_TYPE,
            layout_config: layout as any,
            version: 1,
          });

        if (error) throw error;
      }

      setOriginalLayout(layout);
      console.log('[useDashboardLayout] Layout salvo no Supabase');
      toast.success('Layout salvo com sucesso!');
    } catch (error) {
      console.error('[useDashboardLayout] Erro ao salvar layout:', error);
      toast.error('Erro ao salvar layout');
    } finally {
      setSaving(false);
    }
  }, [user?.id, layout]);

  /**
   * RESET LAYOUT
   * Restaura layout padrão (limpa Supabase + localStorage)
   */
  const resetLayout = useCallback(async () => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return;
    }

    try {
      // Limpar localStorage
      resetToDefaultDashboardExampleLayout();

      // Deletar registro do Supabase
      const { error } = await supabase
        .from('user_layout_preferences')
        .delete()
        .eq('user_id', user.id)
        .eq('layout_type', LAYOUT_TYPE);

      if (error) throw error;

      // Restaurar layout padrão
      setLayout(DEFAULT_DASHBOARD_EXAMPLE_LAYOUT);
      setOriginalLayout(DEFAULT_DASHBOARD_EXAMPLE_LAYOUT);

      console.log('[useDashboardLayout] Layout resetado para padrão');
      toast.success('Layout restaurado para o padrão!');
    } catch (error) {
      console.error('[useDashboardLayout] Erro ao resetar layout:', error);
      toast.error('Erro ao resetar layout');
    }
  }, [user?.id]);

  /**
   * AUTO-SAVE WITH DEBOUNCE
   * Salva automaticamente após 2 segundos de inatividade
   */
  useEffect(() => {
    if (!isModified) return;

    // Limpar timeout anterior
    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    // Criar novo timeout
    const timeout = setTimeout(() => {
      console.log('[useDashboardLayout] Auto-salvando após inatividade...');
      saveLayout();
    }, DEBOUNCE_SAVE_MS);

    setSaveTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [layout, isModified]); // Removi saveLayout das dependências para evitar loop

  return {
    layout,
    loading,
    saving,
    isModified,
    updateCardWidth,
    updateCardOrder,
    addCard,
    removeCard,
    saveLayout,
    resetLayout,
    hasUnsavedChanges,
  };
};
