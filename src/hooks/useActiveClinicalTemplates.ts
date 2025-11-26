/**
 * ============================================================================
 * FASE C2.2 - useActiveClinicalTemplates Hook
 * ============================================================================
 * 
 * Hook React para obter os templates clínicos ativos do usuário atual.
 * 
 * USO (para referência futura, NÃO usar ainda nas telas clínicas):
 * 
 * ```tsx
 * const { 
 *   activeRoleTemplate, 
 *   activeApproachTemplate, 
 *   activeTemplates,
 *   isLoading 
 * } = useActiveClinicalTemplates();
 * 
 * if (activeRoleTemplate?.id === 'psychology_basic') {
 *   // Renderizar forms/features do template psicopatológico básico
 * }
 * ```
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import type { ActiveTemplatesResult } from '@/lib/templates/templateTypes';
import { getActiveClinicalTemplatesForUser } from '@/lib/templates/templateService';

/**
 * Hook para obter templates clínicos ativos do usuário atual
 * 
 * @returns Templates ativos e estado de loading
 */
export function useActiveClinicalTemplates() {
  const { user } = useAuth();
  
  const [result, setResult] = useState<ActiveTemplatesResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchTemplates() {
      if (!user?.id) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        const templatesResult = await getActiveClinicalTemplatesForUser(user.id);
        setResult(templatesResult);
        
        // Log para debug (pode remover depois)
        console.log('[useActiveClinicalTemplates] Templates resolvidos:', {
          roleTemplate: templatesResult.activeRoleTemplate?.id,
          approachTemplate: templatesResult.activeApproachTemplate?.id,
          totalActive: templatesResult.activeTemplates.length,
          usedFallback: templatesResult.usedFallback
        });
      } catch (err) {
        console.error('[useActiveClinicalTemplates] Erro ao buscar templates:', err);
        setError(err instanceof Error ? err : new Error('Erro desconhecido'));
      } finally {
        setIsLoading(false);
      }
    }

    fetchTemplates();
  }, [user?.id]);

  return {
    activeRoleTemplate: result?.activeRoleTemplate || null,
    activeApproachTemplate: result?.activeApproachTemplate || null,
    activeTemplates: result?.activeTemplates || [],
    usedFallback: result?.usedFallback || false,
    isLoading,
    error
  };
}

/**
 * ============================================================================
 * HELPER HOOKS
 * ============================================================================
 */

/**
 * Verifica se o usuário tem um template específico ativo
 */
export function useHasTemplate(templateId: string): boolean {
  const { activeTemplates } = useActiveClinicalTemplates();
  return activeTemplates.some(t => t.id === templateId);
}

/**
 * Verifica se o usuário tem suporte para uma feature clínica
 */
export function useSupportsFeature(
  feature: 'complaint' | 'sessionEvaluation' | 'evolution'
): boolean {
  const { activeTemplates } = useActiveClinicalTemplates();
  
  const featureMap = {
    complaint: 'supportsComplaint',
    sessionEvaluation: 'supportsSessionEvaluation',
    evolution: 'supportsEvolution'
  } as const;

  const prop = featureMap[feature];
  
  return activeTemplates.some(t => t[prop]);
}
