import { supabase } from "@/integrations/supabase/client";
import type { ExtendedAutonomyPermissions } from '@/types/permissions';
import { resolveEffectivePermissions } from './resolveEffectivePermissions';

interface AccessResult {
  allowed: boolean;
  accessLevel: 'none' | 'view' | 'full';
  reason?: string;
}

/**
 * ============================================================================
 * PATIENT ACCESS VALIDATION - FASE 8 (ORGANOGRAMA)
 * ============================================================================
 * 
 * Valida acesso a pacientes usando permissões do organograma (level_role_settings).
 * 
 * REGRAS:
 * 1. Admin: acesso total sempre
 * 2. Terapeuta do paciente: acesso total (se can_access_clinical)
 * 3. Superior de subordinado: acesso SE clinical_visible_to_superiors = true
 * 4. Par (mesmo nível): acesso conforme peer_clinical_sharing (none/view/full)
 * 5. Sem can_access_clinical: sem acesso
 * 
 * ============================================================================
 */

/**
 * Determina relacionamento hierárquico entre dois usuários
 */
async function getUserRelationship(
  viewerId: string,
  ownerId: string
): Promise<'self' | 'superior' | 'peer' | 'subordinate' | 'unrelated'> {
  if (viewerId === ownerId) return 'self';

  try {
    // Buscar hierarquia de ambos
    const [viewerHierarchy, ownerHierarchy] = await Promise.all([
      supabase.rpc('get_organization_hierarchy_info', { _user_id: viewerId }),
      supabase.rpc('get_organization_hierarchy_info', { _user_id: ownerId })
    ]);

    const viewerData = viewerHierarchy.data?.[0];
    const ownerData = ownerHierarchy.data?.[0];

    // Se algum não está no organograma
    if (!viewerData || !ownerData) return 'unrelated';

    // Mesma organização?
    if (viewerData.organization_id !== ownerData.organization_id) {
      return 'unrelated';
    }

    // Mesmo nível = par
    if (viewerData.level_id === ownerData.level_id) {
      return 'peer';
    }

    // Viewer é superior (nível menor = mais alto)
    if (viewerData.level_number < ownerData.level_number) {
      return 'superior';
    }

    // Viewer é subordinado (nível maior = mais baixo)
    if (viewerData.level_number > ownerData.level_number) {
      return 'subordinate';
    }

    return 'unrelated';
  } catch (error) {
    console.error('[checkPatientAccess] Erro ao determinar relacionamento:', error);
    return 'unrelated';
  }
}

/**
 * Valida acesso completo a um paciente (considera role admin)
 */
export async function checkPatientAccess(
  userId: string,
  patientId: string
): Promise<boolean> {
  // Verificar se é admin
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  const isAdmin = roles?.role === 'admin';
  const result = await canAccessPatient(userId, patientId, isAdmin);
  return result.allowed;
}

/**
 * Valida acesso E retorna o nível de acesso (view/full)
 */
export async function checkPatientAccessLevel(
  userId: string,
  patientId: string
): Promise<{ allowed: boolean; accessLevel: 'none' | 'view' | 'full'; reason?: string }> {
  // Verificar se é admin
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  const isAdmin = roles?.role === 'admin';
  return await canAccessPatient(userId, patientId, isAdmin);
}

export async function canAccessPatient(
  userId: string,
  patientId: string,
  isAdmin: boolean
): Promise<AccessResult> {
  console.log('[checkPatientAccess] Verificando acesso:', { userId, patientId, isAdmin });

  // 1. Admin sempre tem acesso total
  if (isAdmin) {
    console.log('[checkPatientAccess] ✅ Admin - acesso full');
    return { allowed: true, accessLevel: 'full' };
  }

  // 2. Buscar paciente
  const { data: patient, error } = await supabase
    .from('patients')
    .select('user_id')
    .eq('id', patientId)
    .single();

  if (error || !patient) {
    console.log('[checkPatientAccess] ❌ Paciente não encontrado');
    return { 
      allowed: false, 
      accessLevel: 'none',
      reason: 'Paciente não encontrado' 
    };
  }

  const ownerId = patient.user_id;
  console.log('[checkPatientAccess] Owner do paciente:', ownerId);

  // 3. Buscar permissões do viewer
  const viewerPerms = await resolveEffectivePermissions(userId);
  console.log('[checkPatientAccess] Permissões do viewer:', {
    canAccessClinical: viewerPerms.canAccessClinical,
    clinicalVisibleToSuperiors: viewerPerms.clinicalVisibleToSuperiors,
    peerClinicalSharing: viewerPerms.peerClinicalSharing
  });

  // 4. Se viewer não tem acesso clínico, bloquear
  if (!viewerPerms.canAccessClinical) {
    console.log('[checkPatientAccess] ❌ Viewer não tem can_access_clinical');
    return {
      allowed: false,
      accessLevel: 'none',
      reason: 'Você não tem permissão para acessar dados clínicos'
    };
  }

  // 5. Se é o próprio terapeuta do paciente (dono sempre tem acesso full)
  if (ownerId === userId) {
    console.log('[checkPatientAccess] ✅ Viewer é o dono - acesso full');
    return { allowed: true, accessLevel: 'full' };
  }

  // 6. Determinar relacionamento
  const relationship = await getUserRelationship(userId, ownerId);
  console.log('[checkPatientAccess] Relacionamento:', relationship);

  // 7. Aplicar regras baseado no relacionamento
  switch (relationship) {
    case 'self':
      console.log('[checkPatientAccess] ✅ Self - acesso full');
      return { allowed: true, accessLevel: 'full' };

    case 'superior': {
      // Buscar permissões do subordinado (dono do paciente)
      const ownerPerms = await resolveEffectivePermissions(ownerId);
      console.log('[checkPatientAccess] [SUPERIOR] Permissões do owner (subordinado):', {
        clinicalVisibleToSuperiors: ownerPerms.clinicalVisibleToSuperiors
      });
      
      if (ownerPerms.clinicalVisibleToSuperiors) {
        console.log('[checkPatientAccess] ✅ Superior - clinical_visible_to_superiors = true - acesso full');
        return { 
          allowed: true, 
          accessLevel: 'full',
          reason: 'Acesso como superior (dados clínicos visíveis)' 
        };
      } else {
        console.log('[checkPatientAccess] ❌ Superior - clinical_visible_to_superiors = false - sem acesso');
        return {
          allowed: false,
          accessLevel: 'none',
          reason: 'Dados clínicos privados deste terapeuta'
        };
      }
    }

    case 'peer': {
      // Buscar permissões do dono do paciente (peer)
      const ownerPerms = await resolveEffectivePermissions(ownerId);
      const peerSharing = ownerPerms.peerClinicalSharing;
      console.log('[checkPatientAccess] [PEER] Permissões do owner:', {
        peerClinicalSharing: peerSharing
      });
      
      if (peerSharing === 'none') {
        console.log('[checkPatientAccess] ❌ Peer - peerClinicalSharing = none');
        return {
          allowed: false,
          accessLevel: 'none',
          reason: 'Este terapeuta não compartilha dados com pares'
        };
      } else if (peerSharing === 'view') {
        console.log('[checkPatientAccess] ✅ Peer - peerClinicalSharing = view');
        return {
          allowed: true,
          accessLevel: 'view',
          reason: 'Acesso somente leitura (par do mesmo nível)'
        };
      } else if (peerSharing === 'full') {
        console.log('[checkPatientAccess] ✅ Peer - peerClinicalSharing = full');
        return {
          allowed: true,
          accessLevel: 'full',
          reason: 'Acesso completo (par do mesmo nível)'
        };
      }
      break;
    }

    case 'subordinate':
    case 'unrelated':
    default:
      console.log('[checkPatientAccess] ❌ Subordinate/Unrelated - sem acesso');
      return {
        allowed: false,
        accessLevel: 'none',
        reason: 'Você não tem permissão para acessar este paciente'
      };
  }

  console.log('[checkPatientAccess] ❌ Fallback - sem acesso');
  return {
    allowed: false,
    accessLevel: 'none',
    reason: 'Você não tem permissão para acessar este paciente'
  };
}

/**
 * Valida se um usuário pode editar dados de um paciente
 */
export async function canEditPatient(
  userId: string,
  patientId: string,
  isAdmin: boolean
): Promise<AccessResult> {
  // Reutilizar lógica de canAccessPatient
  const result = await canAccessPatient(userId, patientId, isAdmin);
  
  // Somente acesso 'full' pode editar
  if (result.accessLevel !== 'full') {
    return {
      allowed: false,
      accessLevel: 'none',
      reason: 'Você não tem permissão para editar este paciente'
    };
  }
  
  return result;
}

/**
 * Valida se um usuário pode ver dados financeiros de um paciente
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
  if (isAdmin) {
    return { allowed: true, accessLevel: 'full' };
  }

  // 3. Buscar permissões efetivas do usuário
  const userPerms = await resolveEffectivePermissions(userId);
  
  // Se não tem acesso financeiro
  if (userPerms.financialAccess === 'none') {
    return {
      allowed: false,
      accessLevel: 'none',
      reason: 'Você não tem acesso a dados financeiros'
    };
  }

  return { allowed: true, accessLevel: 'full' };
}

/**
 * Valida se um usuário pode ver dados clínicos completos de um paciente
 */
export async function canViewPatientClinicalData(
  userId: string,
  patientId: string,
  isAdmin: boolean,
  permissions: ExtendedAutonomyPermissions | null
): Promise<AccessResult> {
  // Reutilizar lógica principal que já considera clínica
  return canAccessPatient(userId, patientId, isAdmin);
}
