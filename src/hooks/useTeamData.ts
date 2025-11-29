import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';
import { getUserIdsInOrganization } from '@/lib/organizationFilters';

/**
 * ============================================================================
 * HOOK: useTeamData
 * ============================================================================
 * 
 * Hook para obter IDs dos subordinados (equipe).
 * NÃO faz queries de pacientes/sessões - apenas retorna subordinateIds.
 * 
 * Os dados de equipe devem ser derivados em memória filtrando
 * os dados globais por subordinateIds (padrão Financial.tsx).
 * 
 * RETORNA:
 * - subordinateIds: IDs dos subordinados (excluindo user.id)
 * - loading: Estado de carregamento
 * 
 * ============================================================================
 */

export function useTeamData() {
  const { user, organizationId } = useAuth();
  const [subordinateIds, setSubordinateIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTeamData() {
      if (!user || !organizationId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        // Usar escopo de compartilhamento para determinar usuários visíveis
        const { getDashboardVisibleUserIds } = await import('@/utils/dashboardSharingScope');
        
        const visibleUserIds = await getDashboardVisibleUserIds({
          supabase,
          userId: user.id,
          organizationId,
          levelId: null,
          domain: 'team',
        });

        // 🔥 CORREÇÃO 1: Filtrar user.id ANTES (não fazer query)
        const subordinateIdsOnly = visibleUserIds.filter(id => id !== user.id);
        setSubordinateIds(subordinateIdsOnly);

      } catch (error) {
        console.error('[useTeamData] Erro ao carregar subordinateIds:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTeamData();
  }, [user, organizationId]);

  return {
    subordinateIds,
    loading,
  };
}
