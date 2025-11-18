import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';

/**
 * ============================================================================
 * HOOK: useOwnData
 * ============================================================================
 * 
 * Hook para filtrar apenas dados próprios do usuário (excluindo subordinados).
 * Usado nas seções principais do dashboard (Financeiro, Administrativo, Clínica).
 * 
 * RETORNA:
 * - ownPatients: Pacientes próprios (sem subordinados)
 * - ownSessions: Sessões dos pacientes próprios
 * - subordinateIds: IDs dos subordinados (para filtrar)
 * 
 * ============================================================================
 */

export function useOwnData(
  allPatients: any[] = [], 
  allSessions: any[] = [],
  subordinateIds: string[] = []
) {
  const { user } = useAuth();

  const ownPatients = useMemo(() => {
    if (!user) return [];
    
    // Filtrar apenas pacientes do próprio usuário (não dos subordinados)
    return allPatients.filter(patient => 
      patient.user_id === user.id
    );
  }, [allPatients, user]);

  const ownSessions = useMemo(() => {
    if (ownPatients.length === 0) return [];
    
    const ownPatientIds = new Set(ownPatients.map(p => p.id));
    return allSessions.filter(session => 
      ownPatientIds.has(session.patient_id)
    );
  }, [allSessions, ownPatients]);

  return {
    ownPatients,
    ownSessions,
    subordinateIds,
  };
}
