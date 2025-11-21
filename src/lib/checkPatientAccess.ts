import { supabase } from "@/integrations/supabase/client";

/**
 * ============================================================================
 * PATIENT ACCESS VALIDATION - FASE 5
 * ============================================================================
 * 
 * Simplified access validation using effective permissions system.
 * Access is primarily controlled through RLS policies.
 * ============================================================================
 */

/**
 * Verifica se um usuário pode acessar detalhes de um paciente
 */
export async function checkPatientAccess(
  userId: string,
  patientId: string
): Promise<boolean> {
  const { data: patient, error } = await supabase
    .from('patients')
    .select('user_id')
    .eq('id', patientId)
    .single();

  if (error || !patient) return false;
  
  // Terapeuta do paciente sempre tem acesso
  if (patient.user_id === userId) return true;
  
  // Outros acessos controlados via RLS
  return true;
}
