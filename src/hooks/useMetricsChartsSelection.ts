/**
 * ============================================================================
 * useMetricsChartsSelection - FASE 2
 * ============================================================================
 * 
 * Hook para gerenciar a seleção de gráficos na página /metrics
 * 
 * PERSISTÊNCIA:
 * - Supabase (user_layout_preferences) = fonte de verdade
 * - localStorage v2 = cache/fallback
 * - localStorage v1 = migração (leitura única)
 * 
 * ORDEM DE LEITURA:
 * 1. Supabase
 * 2. localStorage v1 (migração)
 * 3. defaults (getDefaultEnabledChartIds)
 * ============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  type MetricsChartDomain, 
  getDefaultEnabledChartIds,
  getMetricsChartById,
} from '@/lib/metricsChartsRegistry';

// ============================================================
// TIPOS
// ============================================================

export type MetricsChartsSelection = Record<MetricsChartDomain, string[]>;

interface UseMetricsChartsSelectionResult {
  chartsSelection: MetricsChartsSelection;
  isLoading: boolean;
  error: Error | null;
  addChart: (domain: MetricsChartDomain, chartId: string) => void;
  removeChart: (domain: MetricsChartDomain, chartId: string) => void;
  resetToDefaults: () => Promise<void>;
}

// ============================================================
// CONSTANTES
// ============================================================

const LAYOUT_TYPE = 'metrics-charts-selection';
const LOCALSTORAGE_KEY_V1 = 'metrics_charts_selection_v1';
const LOCALSTORAGE_KEY_V2 = 'metrics_charts_selection_v2';
const DEBOUNCE_SAVE_MS = 2000;

// ============================================================
// HELPERS
// ============================================================

/**
 * Constrói defaults para todos os domínios
 */
function buildDefaultSelection(): MetricsChartsSelection {
  return {
    financial: getDefaultEnabledChartIds('financial'),
    administrative: getDefaultEnabledChartIds('administrative'),
    marketing: getDefaultEnabledChartIds('marketing'),
    team: getDefaultEnabledChartIds('team'),
  };
}

/**
 * Lê do localStorage V2 (cache)
 */
function readFromLocalStorageV2(): MetricsChartsSelection | null {
  try {
    const saved = localStorage.getItem(LOCALSTORAGE_KEY_V2);
    if (!saved) return null;
    
    const parsed = JSON.parse(saved);
    
    // Validação mínima: deve ser objeto com as 4 keys
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'financial' in parsed &&
      'administrative' in parsed &&
      'marketing' in parsed &&
      'team' in parsed
    ) {
      console.log('[CHARTS-SELECTION] ✅ Lido do localStorage v2:', parsed);
      return parsed;
    }
    
    console.warn('[CHARTS-SELECTION] ⚠️ localStorage v2 formato inválido, ignorando');
    return null;
  } catch (e) {
    console.error('[CHARTS-SELECTION] ❌ Erro ao ler localStorage v2, limpando:', e);
    localStorage.removeItem(LOCALSTORAGE_KEY_V2);
    toast.warning('Configuração de gráficos estava corrompida e foi resetada para o padrão.');
    return null;
  }
}

/**
 * Lê do localStorage V1 (migração)
 */
function readFromLocalStorageV1(): MetricsChartsSelection | null {
  try {
    const saved = localStorage.getItem(LOCALSTORAGE_KEY_V1);
    if (!saved) return null;
    
    const parsed = JSON.parse(saved);
    
    // Validação mínima
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'financial' in parsed &&
      'administrative' in parsed &&
      'marketing' in parsed &&
      'team' in parsed
    ) {
      console.log('[CHARTS-SELECTION] ✅ Migrado do localStorage v1:', parsed);
      // Remover v1 após leitura
      localStorage.removeItem(LOCALSTORAGE_KEY_V1);
      return parsed;
    }
    
    console.warn('[CHARTS-SELECTION] ⚠️ localStorage v1 formato inválido, removendo');
    localStorage.removeItem(LOCALSTORAGE_KEY_V1);
    return null;
  } catch (e) {
    console.error('[CHARTS-SELECTION] ❌ Erro ao ler localStorage v1, limpando:', e);
    localStorage.removeItem(LOCALSTORAGE_KEY_V1);
    return null;
  }
}

/**
 * Escreve no localStorage V2 (cache)
 */
function writeToLocalStorageV2(selection: MetricsChartsSelection): void {
  try {
    localStorage.setItem(LOCALSTORAGE_KEY_V2, JSON.stringify(selection));
    console.log('[CHARTS-SELECTION] 💾 Salvo em localStorage v2');
  } catch (e) {
    console.error('[CHARTS-SELECTION] ❌ Erro ao salvar em localStorage v2:', e);
  }
}

// ============================================================
// HOOK
// ============================================================

export const useMetricsChartsSelection = (): UseMetricsChartsSelectionResult => {
  const { user } = useAuth();
  
  const [chartsSelection, setChartsSelection] = useState<MetricsChartsSelection>(buildDefaultSelection());
  const [originalSelection, setOriginalSelection] = useState<MetricsChartsSelection>(buildDefaultSelection());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [saveTimeout, setSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  /**
   * LOAD FROM SUPABASE
   */
  const loadFromSupabase = useCallback(async (): Promise<MetricsChartsSelection | null> => {
    if (!user?.id) {
      console.log('[CHARTS-SELECTION] ⚠️ Sem usuário, pulando Supabase');
      return null;
    }

    try {
      console.log('[CHARTS-SELECTION] 🔍 Buscando no Supabase...');
      const { data, error: dbError } = await supabase
        .from('user_layout_preferences')
        .select('layout_config')
        .eq('user_id', user.id)
        .eq('layout_type', LAYOUT_TYPE)
        .maybeSingle();

      if (dbError) throw dbError;

      if (data?.layout_config) {
        const dbSelection = data.layout_config as unknown as MetricsChartsSelection;
        console.log('[CHARTS-SELECTION] ✅ Carregado do Supabase:', dbSelection);
        return dbSelection;
      }

      console.log('[CHARTS-SELECTION] ⚠️ Nenhum registro no Supabase');
      return null;
    } catch (err) {
      console.error('[CHARTS-SELECTION] ❌ Erro ao carregar do Supabase:', err);
      setError(err as Error);
      return null;
    }
  }, [user?.id]);

  /**
   * INITIALIZE SELECTION
   */
  useEffect(() => {
    const initSelection = async () => {
      setIsLoading(true);
      
      // 1. Tentar Supabase
      const fromSupabase = await loadFromSupabase();
      if (fromSupabase) {
        setChartsSelection(fromSupabase);
        setOriginalSelection(fromSupabase);
        writeToLocalStorageV2(fromSupabase);
        setIsLoading(false);
        return;
      }

      // 2. Tentar localStorage v1 (migração)
      const fromV1 = readFromLocalStorageV1();
      if (fromV1) {
        setChartsSelection(fromV1);
        setOriginalSelection(fromV1);
        writeToLocalStorageV2(fromV1);
        setIsLoading(false);
        return;
      }

      // 3. Tentar localStorage v2 (cache)
      const fromV2 = readFromLocalStorageV2();
      if (fromV2) {
        setChartsSelection(fromV2);
        setOriginalSelection(fromV2);
        setIsLoading(false);
        return;
      }

      // 4. Usar defaults
      const defaults = buildDefaultSelection();
      console.log('[CHARTS-SELECTION] ⚠️ Usando defaults:', defaults);
      setChartsSelection(defaults);
      setOriginalSelection(defaults);
      writeToLocalStorageV2(defaults);
      setIsLoading(false);
    };

    initSelection();
  }, [loadFromSupabase]);

  /**
   * CHECK IF MODIFIED
   */
  const isModified = JSON.stringify(chartsSelection) !== JSON.stringify(originalSelection);

  /**
   * SAVE TO SUPABASE
   */
  const saveToSupabase = useCallback(async () => {
    if (!user?.id) {
      console.error('[CHARTS-SELECTION] ❌ Tentou salvar sem usuário');
      return;
    }

    console.log('[CHARTS-SELECTION] 💾 Salvando no Supabase...', chartsSelection);

    try {
      const { data: existing } = await supabase
        .from('user_layout_preferences')
        .select('id, version')
        .eq('user_id', user.id)
        .eq('layout_type', LAYOUT_TYPE)
        .maybeSingle();

      if (existing) {
        console.log('[CHARTS-SELECTION] 🔄 Atualizando registro existente:', existing.id);
        
        const { error: updateError } = await supabase
          .from('user_layout_preferences')
          .update({
            layout_config: chartsSelection as any,
            version: existing.version + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error('[CHARTS-SELECTION] ❌ Erro no UPDATE:', updateError);
          throw updateError;
        }

        console.log('[CHARTS-SELECTION] ✅ UPDATE bem-sucedido');
      } else {
        console.log('[CHARTS-SELECTION] ➕ Criando novo registro');
        
        const { error: insertError } = await supabase
          .from('user_layout_preferences')
          .insert({
            user_id: user.id,
            layout_type: LAYOUT_TYPE,
            layout_config: chartsSelection as any,
            version: 1,
          });

        if (insertError) {
          console.error('[CHARTS-SELECTION] ❌ Erro no INSERT:', insertError);
          throw insertError;
        }

        console.log('[CHARTS-SELECTION] ✅ INSERT bem-sucedido');
      }

      // Atualizar originalSelection
      setOriginalSelection(chartsSelection);
      console.log('[CHARTS-SELECTION] ✅ originalSelection atualizado');
    } catch (err) {
      console.error('[CHARTS-SELECTION] ❌ ERRO ao salvar:', err);
      toast.error('Erro ao salvar seleção de gráficos');
    }
  }, [user?.id, chartsSelection]);

  /**
   * AUTO-SAVE com debounce
   */
  useEffect(() => {
    if (!isModified) {
      console.log('[CHARTS-SELECTION] ⏭️ Auto-save ignorado (isModified=false)');
      return;
    }

    console.log('[CHARTS-SELECTION] ⏰ Auto-save agendado (debounce 2s)...');

    if (saveTimeout) {
      clearTimeout(saveTimeout);
    }

    const timeout = setTimeout(() => {
      console.log('[CHARTS-SELECTION] 🚀 Auto-save DISPARADO após debounce');
      saveToSupabase();
    }, DEBOUNCE_SAVE_MS);

    setSaveTimeout(timeout);

    return () => {
      if (timeout) {
        console.log('[CHARTS-SELECTION] 🧹 Auto-save cancelado (nova mudança)');
        clearTimeout(timeout);
      }
    };
  }, [chartsSelection, isModified, saveToSupabase]);

  /**
   * Persistir em localStorage sempre que mudar (cache síncrono)
   */
  useEffect(() => {
    writeToLocalStorageV2(chartsSelection);
  }, [chartsSelection]);

  /**
   * ADD CHART
   */
  const addChart = useCallback((domain: MetricsChartDomain, chartId: string) => {
    console.log(`[CHARTS-SELECTION] ➕ Adicionando chart ${chartId} ao domínio ${domain}`);
    
    setChartsSelection((prev) => {
      const currentCharts = prev[domain] || [];
      
      // Validar se já existe
      if (currentCharts.includes(chartId)) {
        console.warn(`[CHARTS-SELECTION] ⚠️ Chart ${chartId} já existe em ${domain}`);
        return prev;
      }

      // Validar se o chart existe no registry
      const chartDef = getMetricsChartById(chartId);
      if (!chartDef) {
        console.error(`[CHARTS-SELECTION] ❌ Chart ${chartId} não encontrado no registry`);
        return prev;
      }

      // Validar se o chart pertence ao domínio correto
      if (chartDef.domain !== domain) {
        console.error(`[CHARTS-SELECTION] ❌ Chart ${chartId} não pertence ao domínio ${domain}`);
        return prev;
      }

      return {
        ...prev,
        [domain]: [...currentCharts, chartId],
      };
    });
  }, []);

  /**
   * REMOVE CHART
   */
  const removeChart = useCallback((domain: MetricsChartDomain, chartId: string) => {
    console.log(`[CHARTS-SELECTION] ➖ Removendo chart ${chartId} do domínio ${domain}`);
    
    setChartsSelection((prev) => {
      const currentCharts = prev[domain] || [];
      
      return {
        ...prev,
        [domain]: currentCharts.filter(id => id !== chartId),
      };
    });
  }, []);

  /**
   * RESET TO DEFAULTS
   */
  const resetToDefaults = useCallback(async () => {
    if (!user?.id) {
      console.error('[CHARTS-SELECTION] ❌ Tentou resetar sem usuário');
      toast.error('Usuário não autenticado');
      return;
    }

    console.log('[CHARTS-SELECTION] 🔄 Resetando para defaults...');

    try {
      // Deletar do Supabase
      const { error: deleteError } = await supabase
        .from('user_layout_preferences')
        .delete()
        .eq('user_id', user.id)
        .eq('layout_type', LAYOUT_TYPE);

      if (deleteError) {
        console.error('[CHARTS-SELECTION] ❌ Erro ao deletar do Supabase:', deleteError);
        throw deleteError;
      }

      console.log('[CHARTS-SELECTION] ✅ Deletado do Supabase');

      // Limpar localStorage
      localStorage.removeItem(LOCALSTORAGE_KEY_V1);
      localStorage.removeItem(LOCALSTORAGE_KEY_V2);
      console.log('[CHARTS-SELECTION] ✅ localStorage limpo');

      // Resetar para defaults
      const defaults = buildDefaultSelection();
      setChartsSelection(defaults);
      setOriginalSelection(defaults);
      writeToLocalStorageV2(defaults);

      toast.success('Seleção de gráficos resetada para o padrão!');
      console.log('[CHARTS-SELECTION] ✅ Reset concluído');
    } catch (err) {
      console.error('[CHARTS-SELECTION] ❌ ERRO ao resetar:', err);
      toast.error('Erro ao resetar seleção de gráficos');
    }
  }, [user?.id]);

  return {
    chartsSelection,
    isLoading,
    error,
    addChart,
    removeChart,
    resetToDefaults,
  };
};
