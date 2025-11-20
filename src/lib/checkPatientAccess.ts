import { supabase } from "@/integrations/supabase/client";
import { getSubordinateAutonomy } from "./checkSubordinateAutonomy";
import type { ExtendedAutonomyPermissions } from '@/hooks/useSubordinatePermissions';

interface AccessResult {
  allowed: boolean;
  reason?: string;
}

/**
 * ============================================================================
 * PATIENT ACCESS VALIDATION
 * ============================================================================
 * 
 * Funções para validar acesso a pacientes e seus dados.
 * 
 * REGRAS:
 * 1. Terapeuta do paciente SEMPRE tem acesso total
 * 2. Admin/Full PODE ver pacientes de subordinados SE managesOwnPatients = false
 * 3. Subordinados SÓ veem seus próprios pacientes
 * 4. Acesso financeiro é controlado separadamente via hasFinancialAccess
 * 
 * ============================================================================
 */

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

  // 3. Se é admin/Full, sempre permitir acesso à página
  // (Controle de dados clínicos é feito em canViewPatientClinicalData)
  if (isAdmin) {
    return { allowed: true };
  }

  // 4. Usuário não é dono nem admin
  return { 
    allowed: false, 
    reason: 'Você não tem permissão para acessar este paciente' 
  };
}

/**
 * Valida se um usuário pode editar dados de um paciente
 * 
 * REGRAS:
 * - Sempre pode editar seus próprios pacientes
 * - Admin/Full pode editar pacientes de subordinados se managesOwnPatients = false
 */
export async function canEditPatient(
  userId: string,
  patientId: string,
  isAdmin: boolean
): Promise<AccessResult> {
  // Reutilizar lógica de canAccessPatient
  return canAccessPatient(userId, patientId, isAdmin);
}

/**
 * Valida se um usuário pode ver dados financeiros de um paciente
 * 
 * REGRAS:
 * - Terapeuta do paciente precisa ter hasFinancialAccess = true
 * - Admin/Full sempre pode ver (a menos que subordinado gerencie próprios)
 */
export async function canViewPatientFinancials(
  userId: string,
  patientId: string,
  isAdmin: boolean,
  permissions: ExtendedAutonomyPermissions | null
): Promise<AccessResult> {
  // 1. Verificar acesso básico ao paciente
  const basicAccess = await canAccessPatient(userId, patientId, isAdmin);
  if (!basicAccess.allowed) {
    return basicAccess;
  }

  // 2. Admin sempre pode ver financeiro
  if (isAdmin || !permissions) {
    return { allowed: true };
  }

  // 3. Subordinado precisa ter hasFinancialAccess
  if (!permissions.hasFinancialAccess) {
    return {
      allowed: false,
      reason: 'Você não tem acesso a dados financeiros'
    };
  }

  return { allowed: true };
}

/**
 * Valida se um usuário pode ver dados clínicos completos de um paciente
 * 
 * REGRAS:
 * - Terapeuta do paciente sempre pode ver
 * - Admin/Full pode ver se canFullSeeClinic = true E managesOwnPatients = false
 */
export async function canViewPatientClinicalData(
  userId: string,
  patientId: string,
  isAdmin: boolean,
  permissions: ExtendedAutonomyPermissions | null
): Promise<AccessResult> {
  // 1. Buscar paciente
  const { data: patient } = await supabase
    .from('patients')
    .select('user_id')
    .eq('id', patientId)
    .single();

  if (!patient) {
    return { 
      allowed: false, 
      reason: 'Paciente não encontrado' 
    };
  }

  // 2. Se é o próprio terapeuta, sempre pode
  if (patient.user_id === userId) {
    return { allowed: true };
  }

  // 3. Admin/Full verifica autonomia do subordinado
  if (isAdmin || !permissions) {
    const subordinateAutonomy = await getSubordinateAutonomy(patient.user_id);
    
    // Se subordinado gerencia próprios, Admin NÃO vê clínico
    if (subordinateAutonomy.managesOwnPatients) {
      return {
        allowed: false,
        reason: 'Dados clínicos privados deste terapeuta'
      };
    }
    
    return { allowed: true };
  }

  // 4. Não é o terapeuta nem admin
  return {
    allowed: false,
    reason: 'Você não tem acesso a dados clínicos deste paciente'
  };
}
