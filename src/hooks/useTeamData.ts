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
 * Hook para gerenciar dados dos subordinados (equipe).
 * Filtra pacientes e sessões baseado nos IDs dos subordinados.
 * 
 * RETORNA:
 * - teamPatients: Pacientes dos subordinados
 * - teamSessions: Sessões dos subordinados
 * - subordinateIds: IDs dos subordinados
 * - loading: Estado de carregamento
 * 
 * ============================================================================
 */

export function useTeamData() {
  const { user, organizationId } = useAuth();
  const [subordinateIds, setSubordinateIds] = useState<string[]>([]);
  const [teamPatients, setTeamPatients] = useState<any[]>([]);
  const [teamSessions, setTeamSessions] = useState<any[]>([]);
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

        setSubordinateIds(visibleUserIds.filter(id => id !== user.id));

        if (visibleUserIds.length <= 1) {
          setTeamPatients([]);
          setTeamSessions([]);
          setLoading(false);
          return;
        }

        // Buscar pacientes dos usuários visíveis
        const { data: patientsData, error: patientsError } = await supabase
          .from('patients')
          .select('*')
          .in('user_id', visibleUserIds)
          .eq('organization_id', organizationId);

        if (patientsError) {
          console.error('[useTeamData] Erro ao buscar pacientes:', patientsError);
          throw patientsError;
        }

        setTeamPatients(patientsData || []);

        // Buscar sessões desses pacientes
        if (patientsData && patientsData.length > 0) {
          const patientIds = patientsData.map((p: any) => p.id);
          
          const { data: sessionsData, error: sessionsError } = await supabase
            .from('sessions')
            .select('*')
            .in('patient_id', patientIds)
            .eq('organization_id', organizationId);

          if (sessionsError) {
            console.error('[useTeamData] Erro ao buscar sessões:', sessionsError);
            throw sessionsError;
          }

          setTeamSessions(sessionsData || []);
        } else {
          setTeamSessions([]);
        }

      } catch (error) {
        console.error('[useTeamData] Erro ao carregar dados da equipe:', error);
      } finally {
        setLoading(false);
      }
    }

    loadTeamData();
  }, [user, organizationId]);

  return {
    teamPatients,
    teamSessions,
    subordinateIds,
    loading,
  };
}
