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
        console.log('[TEAM_METRICS] No user or organizationId', { user: !!user, organizationId });
        setLoading(false);
        return;
      }

      console.log('[TEAM_METRICS] Starting load', {
        userId: user.id,
        organizationId,
      });

      try {
        const orgUserIds = await getUserIdsInOrganization(organizationId);
        console.log('[TEAM_METRICS] Organization user IDs', { 
          count: orgUserIds.length, 
          ids: orgUserIds 
        });
        
        // Buscar subordinados que pertencem à organização ativa
        // NOTA: Usando "created_by" - verificar se este campo existe e está populado
        const { data: subordinates, error: subError } = await supabase
          .from('profiles')
          .select('id, full_name, created_by')
          .eq('created_by', user.id);

        console.log('[TEAM_METRICS] Subordinates query', {
          count: subordinates?.length || 0,
          subordinates,
          error: subError,
          filteredByOrg: orgUserIds.length,
        });

        const subIds = (subordinates?.map(s => s.id) || []).filter(id => 
          orgUserIds.includes(id)
        );
        
        console.log('[TEAM_METRICS] Filtered subordinate IDs', {
          total: subordinates?.length || 0,
          filtered: subIds.length,
          ids: subIds,
        });

        setSubordinateIds(subIds);

        if (subIds.length === 0) {
          console.log('[TEAM_METRICS] No subordinates found - zero team data');
          setTeamPatients([]);
          setTeamSessions([]);
          setLoading(false);
          return;
        }

        // Buscar pacientes dos subordinados
        const { data: patients, error: patError } = await supabase
          .from('patients')
          .select('*')
          .in('user_id', subIds);

        console.log('[TEAM_METRICS] Team patients query', {
          count: patients?.length || 0,
          subordinateIds: subIds.length,
          error: patError,
        });

        setTeamPatients(patients || []);

        // Buscar sessões dos pacientes dos subordinados
        const patientIds = patients?.map(p => p.id) || [];
        if (patientIds.length > 0) {
          const { data: sessions, error: sessError } = await supabase
            .from('sessions')
            .select('*')
            .in('patient_id', patientIds);

          console.log('[TEAM_METRICS] Team sessions query', {
            count: sessions?.length || 0,
            patientIds: patientIds.length,
            error: sessError,
          });

          setTeamSessions(sessions || []);
        } else {
          console.log('[TEAM_METRICS] No team patients, zero sessions');
          setTeamSessions([]);
        }

        console.log('[TEAM_METRICS] Final result', {
          subordinates: subIds.length,
          patients: patients?.length || 0,
          sessions: (patientIds.length > 0 ? (await supabase.from('sessions').select('*').in('patient_id', patientIds)).data?.length : 0) || 0,
        });

      } catch (error) {
        console.error('[TEAM_METRICS] Error:', error);
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
