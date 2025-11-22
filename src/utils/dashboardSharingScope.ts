/**
 * ============================================================================
 * FASE 12.3 - Dashboard Sharing Scope
 * ============================================================================
 * 
 * Helper para determinar quais user_ids são visíveis no dashboard baseado em:
 * - level_sharing_config (compartilhamento de nível)
 * - peer_sharing (compartilhamento manual entre pares)
 * - Hierarquia organizacional
 * 
 * Usado para filtrar métricas de equipe/agregadas no dashboard
 * ============================================================================
 */

import { SupabaseClient } from '@supabase/supabase-js';

export type DashboardDomain = 'financial' | 'administrative' | 'clinical' | 'media' | 'team';

export interface GetVisibleUserIdsParams {
  supabase: SupabaseClient;
  userId: string;
  organizationId: string;
  levelId: string | null;
  domain: DashboardDomain;
}

/**
 * Obter lista de user_ids visíveis para um usuário em um domínio específico
 * 
 * LÓGICA:
 * 1. Sempre inclui o próprio usuário
 * 2. Busca subordinados diretos via hierarquia
 * 3. Aplica level_sharing_config (compartilhamento de nível)
 * 4. Aplica peer_sharing (compartilhamento manual peer-to-peer)
 * 5. Respeita configurações de visibilidade por domínio
 */
export async function getDashboardVisibleUserIds(
  params: GetVisibleUserIdsParams
): Promise<string[]> {
  const { supabase, userId, organizationId, levelId, domain } = params;
  
  console.log('[TEAM_METRICS] 👥 Calculando escopo de equipe para domínio', {
    userId,
    organizationId,
    levelId,
    domain,
  });

  try {
    // 1. SEMPRE INCLUI O PRÓPRIO USUÁRIO
    const visibleUserIds = new Set<string>([userId]);

    // 2. BUSCAR SUBORDINADOS DIRETOS (hierarquia organizacional)
    const subordinates = await getDirectSubordinates(supabase, userId);
    console.log('[TEAM_METRICS] 📊 Subordinados diretos encontrados:', subordinates.length);
    subordinates.forEach(subId => visibleUserIds.add(subId));

    // 3. APLICAR LEVEL SHARING CONFIG (se existir)
    if (levelId) {
      const levelSharedUsers = await getLevelSharedUsers(supabase, levelId, userId, domain);
      console.log('[TEAM_METRICS] 🔗 Usuários compartilhados via level_sharing:', levelSharedUsers.length);
      levelSharedUsers.forEach(uid => visibleUserIds.add(uid));
    }

    // 4. APLICAR PEER SHARING (compartilhamento manual)
    const peerSharedUsers = await getPeerSharedUsers(supabase, userId, domain);
    console.log('[TEAM_METRICS] 🤝 Usuários compartilhados via peer_sharing:', peerSharedUsers.length);
    peerSharedUsers.forEach(uid => visibleUserIds.add(uid));

    const finalUserIds = Array.from(visibleUserIds);
    console.log('[TEAM_METRICS] ✅ Escopo final de equipe', {
      domain,
      totalVisibleUsers: finalUserIds.length,
      includesOwnData: finalUserIds.includes(userId),
    });

    return finalUserIds;

  } catch (error) {
    console.error('[TEAM_METRICS] ❌ Erro ao calcular escopo de equipe:', error);
    // Fallback seguro: apenas o próprio usuário
    return [userId];
  }
}

/**
 * Buscar subordinados diretos via get_all_subordinates
 */
async function getDirectSubordinates(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  try {
    const { data, error } = await supabase.rpc('get_all_subordinates', {
      _user_id: userId
    });

    if (error || !data) {
      console.warn('[TEAM_METRICS] ⚠️ Erro ao buscar subordinados:', error);
      return [];
    }

    // Retornar apenas subordinados diretos (depth = 1)
    return data
      .filter((sub: any) => sub.depth === 1)
      .map((sub: any) => sub.subordinate_user_id);
  } catch (error) {
    console.error('[TEAM_METRICS] ❌ Erro em getDirectSubordinates:', error);
    return [];
  }
}

/**
 * Buscar usuários do mesmo nível com compartilhamento ativo
 */
async function getLevelSharedUsers(
  supabase: SupabaseClient,
  levelId: string,
  userId: string,
  domain: DashboardDomain
): Promise<string[]> {
  try {
    // 1. Buscar level_sharing_config para este nível
    const { data: sharingConfig, error: configError } = await supabase
      .from('level_sharing_config')
      .select('shared_domains')
      .eq('level_id', levelId)
      .maybeSingle();

    if (configError || !sharingConfig) {
      return [];
    }

    // 2. Verificar se o domínio está compartilhado
    const sharedDomains = sharingConfig.shared_domains || [];
    if (!sharedDomains.includes(domain)) {
      console.log('[TEAM_METRICS] 🔒 Domínio não compartilhado no nível', { domain, levelId });
      return [];
    }

    // 3. Buscar outros usuários do mesmo nível
    const { data: peers, error: peersError } = await supabase
      .from('user_positions')
      .select('user_id, position_id')
      .neq('user_id', userId);

    if (peersError || !peers) {
      return [];
    }

    // 4. Filtrar apenas os do mesmo nível
    const { data: positions, error: posError } = await supabase
      .from('organization_positions')
      .select('id, level_id')
      .eq('level_id', levelId)
      .in('id', peers.map(p => p.position_id));

    if (posError || !positions) {
      return [];
    }

    const positionIds = new Set(positions.map(p => p.id));
    const sameLevelUsers = peers
      .filter(p => positionIds.has(p.position_id))
      .map(p => p.user_id);

    console.log('[TEAM_METRICS] 👥 Usuários do mesmo nível com compartilhamento:', sameLevelUsers.length);
    return sameLevelUsers;

  } catch (error) {
    console.error('[TEAM_METRICS] ❌ Erro em getLevelSharedUsers:', error);
    return [];
  }
}

/**
 * Buscar usuários com compartilhamento peer-to-peer ativo
 */
async function getPeerSharedUsers(
  supabase: SupabaseClient,
  userId: string,
  domain: DashboardDomain
): Promise<string[]> {
  try {
    // Usar a função RPC get_peer_shared_domains
    const { data: sharingRecords, error } = await supabase
      .from('peer_sharing')
      .select('sharer_user_id, receiver_user_id, shared_domains, is_bidirectional')
      .or(`sharer_user_id.eq.${userId},receiver_user_id.eq.${userId}`);

    if (error || !sharingRecords) {
      return [];
    }

    const peerUsers: string[] = [];

    for (const record of sharingRecords) {
      const sharedDomains = record.shared_domains || [];
      
      // Verificar se o domínio está compartilhado
      if (!sharedDomains.includes(domain)) continue;

      // Adicionar o peer (o outro lado da relação)
      if (record.sharer_user_id === userId) {
        // Eu compartilho com receiver
        peerUsers.push(record.receiver_user_id);
      } else if (record.is_bidirectional || record.sharer_user_id !== userId) {
        // Alguém compartilha comigo (ou é bidirecional)
        peerUsers.push(record.sharer_user_id);
      }
    }

    console.log('[TEAM_METRICS] 🤝 Peers com compartilhamento manual:', peerUsers.length);
    return peerUsers;

  } catch (error) {
    console.error('[TEAM_METRICS] ❌ Erro em getPeerSharedUsers:', error);
    return [];
  }
}
