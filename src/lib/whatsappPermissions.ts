/**
 * ============================================================================
 * FASE W3 - WhatsApp Permissions Helper
 * ============================================================================
 * 
 * Helper centralizado para resolver permissões de acesso ao WhatsApp,
 * considerando hierarquia organizacional e peer sharing.
 * 
 * ============================================================================
 */

import { supabase } from '@/integrations/supabase/client';
import { resolveEffectivePermissions } from './resolveEffectivePermissions';
import { isOlimpoUser } from './userUtils';

/**
 * Verifica se um usuário pode visualizar conversas de outro usuário
 * 
 * Regras:
 * 1. Admin/Owner vê tudo
 * 2. Olimpo (whitelist) vê tudo (João & Larissa)
 * 3. Secretária com secretary_can_access_whatsapp = true vê tudo da org
 * 4. Superior com can_view_subordinate_whatsapp = true vê conversas de subordinados
 * 5. Peers com peer sharing 'whatsapp' habilitado veem conversas uns dos outros
 * 6. Próprio usuário sempre vê suas próprias conversas
 * 
 * @param viewerId - ID de quem está tentando ver
 * @param targetUserId - ID de quem possui a conversa
 * @returns true se pode visualizar
 */
export async function canViewWhatsAppConversations(
  viewerId: string,
  targetUserId: string
): Promise<boolean> {
  // HOTFIX W3.1: Olimpo bypassa todas as restrições
  if (isOlimpoUser({ userId: viewerId })) {
    return true;
  }

  // Sempre pode ver suas próprias conversas
  if (viewerId === targetUserId) {
    return true;
  }

  // Buscar permissões do viewer
  const viewerPerms = await resolveEffectivePermissions(viewerId);

  // Admin/Owner vê tudo
  if (viewerPerms.isOrganizationOwner) {
    return true;
  }

  // Secretária com permissão total vê tudo da organização
  if (viewerPerms.secretaryCanAccessWhatsapp) {
    // Verificar se ambos estão na mesma org
    const sameOrg = await areInSameOrganization(viewerId, targetUserId);
    if (sameOrg) {
      return true;
    }
  }

  // Superior pode ver subordinados se tiver permissão
  if (viewerPerms.canViewSubordinateWhatsapp) {
    const isSubordinate = await isDirectSubordinate(viewerId, targetUserId);
    if (isSubordinate) {
      return true;
    }
  }

  // Peer sharing - verificar se estão no mesmo nível e compartilham WhatsApp
  const peerSharing = await hasPeerWhatsAppSharing(viewerId, targetUserId);
  if (peerSharing) {
    return true;
  }

  return false;
}

/**
 * Verifica se um usuário pode enviar mensagens (responder) em nome de outro
 * 
 * Regras:
 * 1. Admin/Owner pode responder por todos
 * 2. Olimpo (whitelist) pode responder por todos
 * 3. Secretária com secretary_can_access_whatsapp = true pode responder por todos da org
 * 4. Superior com can_manage_subordinate_whatsapp = true pode responder por subordinados
 * 5. Próprio usuário sempre pode responder por si mesmo
 * 
 * @param managerId - ID de quem está tentando responder
 * @param targetUserId - ID de quem possui a conversa
 * @returns true se pode responder
 */
export async function canManageWhatsAppConversations(
  managerId: string,
  targetUserId: string
): Promise<boolean> {
  // HOTFIX W3.1: Olimpo bypassa todas as restrições
  if (isOlimpoUser({ userId: managerId })) {
    return true;
  }

  // Sempre pode responder em suas próprias conversas
  if (managerId === targetUserId) {
    return true;
  }

  const managerPerms = await resolveEffectivePermissions(managerId);

  // Admin/Owner pode responder por todos
  if (managerPerms.isOrganizationOwner) {
    return true;
  }

  // Secretária com permissão total pode responder por todos da org
  if (managerPerms.secretaryCanAccessWhatsapp) {
    const sameOrg = await areInSameOrganization(managerId, targetUserId);
    if (sameOrg) {
      return true;
    }
  }

  // Superior pode responder por subordinados se tiver permissão
  if (managerPerms.canManageSubordinateWhatsapp) {
    const isSubordinate = await isDirectSubordinate(managerId, targetUserId);
    if (isSubordinate) {
      return true;
    }
  }

  return false;
}

/**
 * Retorna todos os user_ids cujas conversas o viewer pode visualizar
 * 
 * @param viewerId - ID de quem está visualizando
 * @returns Array de user_ids acessíveis
 */
export async function getAccessibleWhatsAppUserIds(viewerId: string): Promise<string[]> {
  // HOTFIX W3.1: Olimpo vê todos da organização
  if (isOlimpoUser({ userId: viewerId })) {
    const orgUsers = await getUsersInOrganization(viewerId);
    return orgUsers.length > 0 ? orgUsers : [viewerId];
  }

  const viewerPerms = await resolveEffectivePermissions(viewerId);
  const accessibleUserIds: string[] = [viewerId]; // Sempre inclui o próprio

  // Admin/Owner vê todos da organização
  if (viewerPerms.isOrganizationOwner) {
    const orgUsers = await getUsersInOrganization(viewerId);
    return [...new Set([...accessibleUserIds, ...orgUsers])];
  }

  // Secretária com permissão total vê todos da org
  if (viewerPerms.secretaryCanAccessWhatsapp) {
    const orgUsers = await getUsersInOrganization(viewerId);
    return [...new Set([...accessibleUserIds, ...orgUsers])];
  }

  // Superior pode ver subordinados
  if (viewerPerms.canViewSubordinateWhatsapp) {
    const subordinates = await getDirectSubordinates(viewerId);
    accessibleUserIds.push(...subordinates);
  }

  // Peers com sharing habilitado
  const peers = await getPeersWithWhatsAppSharing(viewerId);
  accessibleUserIds.push(...peers);

  return [...new Set(accessibleUserIds)]; // Remove duplicatas
}

// ============================================================================
// Funções auxiliares
// ============================================================================

/**
 * Verifica se dois usuários estão na mesma organização
 */
async function areInSameOrganization(userId1: string, userId2: string): Promise<boolean> {
  const { data: hierarchy1 } = await supabase
    .rpc('get_organization_hierarchy_info', { _user_id: userId1 });
  
  const { data: hierarchy2 } = await supabase
    .rpc('get_organization_hierarchy_info', { _user_id: userId2 });

  if (!hierarchy1?.[0]?.organization_id || !hierarchy2?.[0]?.organization_id) {
    return false;
  }

  return hierarchy1[0].organization_id === hierarchy2[0].organization_id;
}

/**
 * Verifica se targetUserId é subordinado direto de managerId
 */
async function isDirectSubordinate(managerId: string, targetUserId: string): Promise<boolean> {
  const { data: subordinates } = await supabase
    .rpc('get_subordinates_at_depth', { 
      _user_id: managerId, 
      _target_depth: 1 
    });

  if (!subordinates) return false;

  return subordinates.some((sub: any) => sub.subordinate_user_id === targetUserId);
}

/**
 * Verifica se há peer sharing de WhatsApp entre dois usuários
 */
async function hasPeerWhatsAppSharing(userId1: string, userId2: string): Promise<boolean> {
  // Verificar se estão no mesmo nível
  const { data: hierarchy1 } = await supabase
    .rpc('get_organization_hierarchy_info', { _user_id: userId1 });
  
  const { data: hierarchy2 } = await supabase
    .rpc('get_organization_hierarchy_info', { _user_id: userId2 });

  if (!hierarchy1?.[0]?.level_id || !hierarchy2?.[0]?.level_id) {
    return false;
  }

  if (hierarchy1[0].level_id !== hierarchy2[0].level_id) {
    return false;
  }

  // Verificar level_sharing_config
  const { data: levelSharing } = await supabase
    .from('level_sharing_config')
    .select('shared_domains')
    .eq('level_id', hierarchy1[0].level_id)
    .maybeSingle();

  if (levelSharing?.shared_domains?.includes('whatsapp')) {
    return true;
  }

  // Verificar peer_sharing individual
  const { data: peerSharing } = await supabase
    .from('peer_sharing')
    .select('*')
    .or(`and(sharer_user_id.eq.${userId1},receiver_user_id.eq.${userId2}),and(sharer_user_id.eq.${userId2},receiver_user_id.eq.${userId1},is_bidirectional.eq.true)`)
    .maybeSingle();

  if (peerSharing?.shared_domains?.includes('whatsapp')) {
    return true;
  }

  return false;
}

/**
 * Retorna subordinados diretos de um usuário
 */
async function getDirectSubordinates(managerId: string): Promise<string[]> {
  const { data: subordinates } = await supabase
    .rpc('get_subordinates_at_depth', { 
      _user_id: managerId, 
      _target_depth: 1 
    });

  if (!subordinates) return [];

  return subordinates.map((sub: any) => sub.subordinate_user_id);
}

/**
 * Retorna todos os usuários da mesma organização
 */
async function getUsersInOrganization(userId: string): Promise<string[]> {
  const { data: hierarchy } = await supabase
    .rpc('get_organization_hierarchy_info', { _user_id: userId });

  if (!hierarchy?.[0]?.organization_id) return [];

  const orgId = hierarchy[0].organization_id;

  // Buscar todos os usuários com positions nessa org
  const { data: positions } = await supabase
    .from('user_positions')
    .select(`
      user_id,
      organization_positions!inner (
        level_id,
        organization_levels!inner (
          organization_id
        )
      )
    `)
    .eq('organization_positions.organization_levels.organization_id', orgId);

  if (!positions) return [];

  return positions.map((p: any) => p.user_id);
}

/**
 * Retorna peers com sharing de WhatsApp habilitado
 */
async function getPeersWithWhatsAppSharing(userId: string): Promise<string[]> {
  const peers: string[] = [];

  // Buscar nível do usuário
  const { data: hierarchy } = await supabase
    .rpc('get_organization_hierarchy_info', { _user_id: userId });

  if (!hierarchy?.[0]?.level_id) return [];

  const levelId = hierarchy[0].level_id;

  // Buscar level_sharing_config
  const { data: levelSharing } = await supabase
    .from('level_sharing_config')
    .select('shared_domains')
    .eq('level_id', levelId)
    .maybeSingle();

  if (levelSharing?.shared_domains?.includes('whatsapp')) {
    // Se há sharing de nível, buscar todos do mesmo nível
    const { data: levelPeers } = await supabase
      .from('user_positions')
      .select('user_id')
      .eq('position_id', hierarchy[0].position_id);

    if (levelPeers) {
      peers.push(...levelPeers.map((p: any) => p.user_id).filter((id: string) => id !== userId));
    }
  }

  // Buscar peer_sharing individual
  const { data: peerSharings } = await supabase
    .from('peer_sharing')
    .select('*')
    .or(`sharer_user_id.eq.${userId},and(receiver_user_id.eq.${userId},is_bidirectional.eq.true)`);

  if (peerSharings) {
    for (const sharing of peerSharings) {
      if (sharing.shared_domains?.includes('whatsapp')) {
        if (sharing.sharer_user_id === userId) {
          peers.push(sharing.receiver_user_id);
        } else if (sharing.is_bidirectional) {
          peers.push(sharing.sharer_user_id);
        }
      }
    }
  }

  return [...new Set(peers)]; // Remove duplicatas
}
