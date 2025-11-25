/**
 * ============================================================================
 * USE PATIENT OVERVIEW LAYOUT HOOK - FASE C1.3
 * ============================================================================
 * 
 * Hook React para gerenciar o layout da aba "Visão Geral"
 * 
 * Este hook:
 * - Carrega o layout do localStorage na montagem
 * - Fornece função para atualizar o layout
 * - Salva automaticamente no localStorage (com debounce)
 * - Fornece função para resetar ao layout padrão
 * 
 * ⚠️ IMPORTANTE:
 * - Nesta fase, APENAS localStorage
 * - NÃO integrado ao PatientDetail ainda
 * - Preparado para futuras extensões (templates, Supabase)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PatientOverviewCardLayout } from '@/lib/patientOverviewLayout';
import {
  getDefaultPatientOverviewLayout,
  normalizePatientOverviewLayout,
} from '@/lib/patientOverviewLayout';
import {
  loadPatientOverviewLayout,
  savePatientOverviewLayout,
  resetPatientOverviewLayout,
} from '@/lib/patientOverviewLayoutPersistence';

/**
 * Opções do hook
 */
interface UsePatientOverviewLayoutOptions {
  /** ID do usuário */
  userId: string;
  
  /** ID da organização */
  organizationId: string;
  
  /** Delay de debounce para salvar (ms) */
  saveDebounceMs?: number;
  
  /** Se true, não carrega nem salva automaticamente (modo preview) */
  readOnly?: boolean;
}

/**
 * Retorno do hook
 */
interface UsePatientOverviewLayoutReturn {
  /** Layout atual */
  layout: PatientOverviewCardLayout[];
  
  /** Se está carregando o layout inicial */
  isLoading: boolean;
  
  /** Se o layout foi modificado (não salvo ainda) */
  isDirty: boolean;
  
  /** Atualiza o layout (com debounce para salvar) */
  updateLayout: (newLayout: PatientOverviewCardLayout[]) => void;
  
  /** Salva o layout imediatamente (sem debounce) */
  saveNow: () => void;
  
  /** Reseta o layout para o padrão */
  resetLayout: () => void;
  
  /** Se existe um layout salvo */
  hasStoredLayout: boolean;
}

/**
 * Hook para gerenciar o layout da aba "Visão Geral"
 * 
 * @param options - Opções do hook
 * @returns Estado e funções do layout
 */
export function usePatientOverviewLayout(
  options: UsePatientOverviewLayoutOptions
): UsePatientOverviewLayoutReturn {
  const {
    userId,
    organizationId,
    saveDebounceMs = 1000,
    readOnly = false,
  } = options;

  // FASE C1.5: Validação de parâmetros
  const hasValidParams = userId && organizationId;
  
  // Estado principal
  const [layout, setLayout] = useState<PatientOverviewCardLayout[]>(() => {
    // Carregar do localStorage ou usar padrão
    if (readOnly || !hasValidParams) return getDefaultPatientOverviewLayout();
    
    const stored = loadPatientOverviewLayout(userId, organizationId);
    return stored || getDefaultPatientOverviewLayout();
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [hasStoredLayout, setHasStoredLayout] = useState(() => {
    if (readOnly || !hasValidParams) return false;
    const stored = loadPatientOverviewLayout(userId, organizationId);
    return !!stored;
  });

  // Refs para debounce
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const layoutToSaveRef = useRef<PatientOverviewCardLayout[] | null>(null);
  
  // FASE C1.5: Track if already loaded to prevent double-loading
  const hasLoadedRef = useRef(false);

  // Carregar layout na montagem (apenas se parâmetros mudarem)
  useEffect(() => {
    if (readOnly || !hasValidParams || hasLoadedRef.current) return;
    
    hasLoadedRef.current = true;
    setIsLoading(true);
    
    try {
      const stored = loadPatientOverviewLayout(userId, organizationId);
      
      if (stored) {
        setLayout(stored);
        setHasStoredLayout(true);
      } else {
        setLayout(getDefaultPatientOverviewLayout());
        setHasStoredLayout(false);
      }
    } catch (error) {
      console.error('[usePatientOverviewLayout] Erro ao carregar layout:', error);
      setLayout(getDefaultPatientOverviewLayout());
      setHasStoredLayout(false);
    } finally {
      setIsLoading(false);
    }
  }, [userId, organizationId, readOnly, hasValidParams]);

  // Função de salvamento com debounce
  const debouncedSave = useCallback(() => {
    if (readOnly || !hasValidParams) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      if (layoutToSaveRef.current) {
        const success = savePatientOverviewLayout(
          userId,
          organizationId,
          layoutToSaveRef.current
        );
        
        if (success) {
          setIsDirty(false);
          setHasStoredLayout(true);
        }
        
        layoutToSaveRef.current = null;
      }
    }, saveDebounceMs);
  }, [userId, organizationId, saveDebounceMs, readOnly]);

  // Atualizar layout
  const updateLayout = useCallback((newLayout: PatientOverviewCardLayout[]) => {
    const normalized = normalizePatientOverviewLayout(newLayout);
    
    setLayout(normalized);
    setIsDirty(true);
    
    layoutToSaveRef.current = normalized;
    debouncedSave();
  }, [debouncedSave]);

  // Salvar imediatamente
  const saveNow = useCallback(() => {
    if (readOnly || !hasValidParams) return;
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }

    const success = savePatientOverviewLayout(userId, organizationId, layout);
    
    if (success) {
      setIsDirty(false);
      setHasStoredLayout(true);
    }
  }, [userId, organizationId, layout, readOnly]);

  // Resetar para o padrão
  const resetLayout = useCallback(() => {
    if (readOnly || !hasValidParams) return;
    
    const defaultLayout = resetPatientOverviewLayout(userId, organizationId);
    
    setLayout(defaultLayout);
    setIsDirty(false);
    setHasStoredLayout(false);
    
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = null;
    }
    
    layoutToSaveRef.current = null;
  }, [userId, organizationId, readOnly]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return {
    layout,
    isLoading,
    isDirty,
    updateLayout,
    saveNow,
    resetLayout,
    hasStoredLayout,
  };
}
