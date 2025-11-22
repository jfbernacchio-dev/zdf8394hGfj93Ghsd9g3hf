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
        console.log('[TEAM_METRICS] ⏸️ Sem user ou organizationId, abortando');
        setLoading(false);
        return;
      }

      try {
        console.log('[TEAM_METRICS] 📊 Iniciando carregamento de dados da equipe', {
          userId: user.id,
          organizationId,
        });

        setLoading(true);

        // FASE 12.3: Usar escopo de compartilhamento para determinar usuários visíveis
        // Importar dinamicamente para evitar ciclo de dependência
        const { getDashboardVisibleUserIds } = await import('@/utils/dashboardSharingScope');
        
        // Buscar userIds visíveis para domínio 'team'
        const visibleUserIds = await getDashboardVisibleUserIds({
          supabase,
          userId: user.id,
          organizationId,
          levelId: null, // TODO: obter levelId do useEffectivePermissions
          domain: 'team',
        });

        console.log('[TEAM_METRICS] 👥 Usuários visíveis no escopo de equipe:', {
          count: visibleUserIds.length,
          ids: visibleUserIds,
        });

        setSubordinateIds(visibleUserIds.filter(id => id !== user.id));

        if (visibleUserIds.length <= 1) {
          console.log('[TEAM_METRICS] 📭 Apenas próprio usuário no escopo, finalizando');
          setTeamPatients([]);
          setTeamSessions([]);
          setLoading(false);
          return;
        }

        // 2. Buscar pacientes dos usuários visíveis
        const { data: patientsData, error: patientsError } = await supabase
          .from('patients')
          .select('*')
          .in('user_id', visibleUserIds)
          .eq('organization_id', organizationId);

        if (patientsError) {
          console.error('[TEAM_METRICS] ❌ Erro ao buscar pacientes:', patientsError);
          throw patientsError;
        }

        console.log('[TEAM_METRICS] 🏥 Pacientes da equipe encontrados:', {
          count: patientsData?.length || 0,
        });

        setTeamPatients(patientsData || []);

        // 3. Buscar sessões desses pacientes
        if (patientsData && patientsData.length > 0) {
          const patientIds = patientsData.map((p: any) => p.id);
          
          const { data: sessionsData, error: sessionsError } = await supabase
            .from('sessions')
            .select('*')
            .in('patient_id', patientIds)
            .eq('organization_id', organizationId);

          if (sessionsError) {
            console.error('[TEAM_METRICS] ❌ Erro ao buscar sessões:', sessionsError);
            throw sessionsError;
          }

          console.log('[TEAM_METRICS] 📅 Sessões da equipe encontradas:', {
            count: sessionsData?.length || 0,
          });

          setTeamSessions(sessionsData || []);
        } else {
          setTeamSessions([]);
        }

        console.log('[TEAM_METRICS] ✅ Carregamento concluído com sucesso');

      } catch (error) {
        console.error('[TEAM_METRICS] ❌ Erro ao carregar dados da equipe:', error);
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
