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
        const orgUserIds = await getUserIdsInOrganization(organizationId);
        
        // Buscar subordinados que pertencem à organização ativa
        const { data: subordinates } = await supabase
          .from('profiles')
          .select('id')
          .eq('created_by', user.id);

        const subIds = (subordinates?.map(s => s.id) || []).filter(id => 
          orgUserIds.includes(id)
        );
        setSubordinateIds(subIds);

        if (subIds.length === 0) {
          setTeamPatients([]);
          setTeamSessions([]);
          setLoading(false);
          return;
        }

        // Buscar pacientes dos subordinados
        const { data: patients } = await supabase
          .from('patients')
          .select('*')
          .in('user_id', subIds);

        setTeamPatients(patients || []);

        // Buscar sessões dos pacientes dos subordinados
        const patientIds = patients?.map(p => p.id) || [];
        if (patientIds.length > 0) {
          const { data: sessions } = await supabase
            .from('sessions')
            .select('*')
            .in('patient_id', patientIds);

          setTeamSessions(sessions || []);
        } else {
          setTeamSessions([]);
        }
      } catch (error) {
        console.error('[useTeamData] Error:', error);
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
