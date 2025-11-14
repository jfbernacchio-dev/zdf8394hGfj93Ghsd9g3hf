import { supabase } from "@/integrations/supabase/client";
import { getSubordinateAutonomy } from "./checkSubordinateAutonomy";

interface AccessResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Valida se um usuário pode acessar os detalhes de um paciente
 * Considera autonomia de subordinados quando aplicável
 */
export async function canAccessPatient(
  userId: string,
  patientId: string,
  isAdmin: boolean
): Promise<AccessResult> {
  // 1. Buscar paciente
  const { data: patient, error } = await supabase
    .from('patients')
    .select('user_id')
    .eq('id', patientId)
    .single();

  if (error || !patient) {
    return { 
      allowed: false, 
      reason: 'Paciente não encontrado' 
    };
  }

  // 2. Se é o próprio terapeuta do paciente, sempre permitir
  if (patient.user_id === userId) {
    return { allowed: true };
  }

  // 3. Se é admin/Full, verificar autonomia do subordinado
  if (isAdmin) {
    const autonomy = await getSubordinateAutonomy(patient.user_id);
    
    // Se subordinado gerencia próprios pacientes, Full NÃO pode ver
    if (autonomy.managesOwnPatients) {
      return { 
        allowed: false, 
        reason: 'Este terapeuta gerencia seus próprios pacientes de forma autônoma' 
      };
    }
    
    return { allowed: true };
  }

  // 4. Usuário não é dono nem admin
  return { 
    allowed: false, 
    reason: 'Você não tem permissão para acessar este paciente' 
  };
}
