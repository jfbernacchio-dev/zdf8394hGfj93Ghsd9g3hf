import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { PermissionDomain } from '@/types/permissions';

// ============================================================================
// TYPES
// ============================================================================

export interface PeerSharingConfig {
  id: string;
  sharer_user_id: string;
  receiver_user_id: string;
  shared_domains: PermissionDomain[];
  is_bidirectional: boolean;
  created_at: string;
  updated_at: string;
}

export interface LevelSharingConfig {
  id: string;
  level_id: string;
  shared_domains: PermissionDomain[];
  created_at: string;
  updated_at: string;
}

export interface PeerInfo {
  user_id: string;
  full_name: string;
  level_id: string;
  level_name: string;
  level_number: number;
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function usePeerSharing() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [peerSharings, setPeerSharings] = useState<PeerSharingConfig[]>([]);
  const [levelSharing, setLevelSharing] = useState<LevelSharingConfig | null>(null);
  const [peersInLevel, setPeersInLevel] = useState<PeerInfo[]>([]);

  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    loadPeerData();
  }, [user?.id]);

  const loadPeerData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);

      // 1. Carregar compartilhamentos individuais (onde sou sharer ou receiver)
      const { data: sharingData } = await supabase
        .from('peer_sharing')
        .select('*')
        .or(`sharer_user_id.eq.${user.id},receiver_user_id.eq.${user.id}`);

      setPeerSharings((sharingData || []) as PeerSharingConfig[]);

      // 2. Obter informações do meu nível
      const { data: hierarchyInfo } = await supabase.rpc(
        'get_organization_hierarchy_info',
        { _user_id: user.id }
      );

      if (hierarchyInfo && hierarchyInfo.length > 0) {
        const myLevelId = hierarchyInfo[0].level_id;

        // 3. Carregar configuração de compartilhamento do nível
        const { data: levelSharingData } = await supabase
          .from('level_sharing_config')
          .select('*')
          .eq('level_id', myLevelId)
          .single();

        setLevelSharing(levelSharingData as LevelSharingConfig);

        // 4. Carregar outros usuários no mesmo nível (peers potenciais)
        const { data: peersData } = await supabase
          .from('user_positions')
          .select(`
            user_id,
            organization_positions!inner(
              level_id,
              organization_levels!inner(
                level_name,
                level_number
              )
            )
          `)
          .eq('organization_positions.level_id', myLevelId)
          .neq('user_id', user.id);

        if (peersData) {
          // Buscar nomes dos peers
          const peerIds = peersData.map((p: any) => p.user_id);
          const { data: profiles } = await supabase
            .from('profiles')
            .select('id, full_name')
            .in('id', peerIds);

          const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

          const peers: PeerInfo[] = peersData.map((p: any) => ({
            user_id: p.user_id,
            full_name: profileMap.get(p.user_id) || 'Usuário',
            level_id: myLevelId,
            level_name: p.organization_positions.organization_levels.level_name,
            level_number: p.organization_positions.organization_levels.level_number,
          }));

          setPeersInLevel(peers);
        }
      }
    } catch (error) {
      console.error('Error loading peer data:', error);
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  /**
   * Verifica se posso ver dados de outro usuário em um domínio específico
   */
  const canViewPeerData = async (
    targetUserId: string,
    domain: PermissionDomain
  ): Promise<boolean> => {
    if (!user?.id) return false;

    try {
      const { data, error } = await supabase.rpc('can_view_peer_data', {
        _requesting_user_id: user.id,
        _target_user_id: targetUserId,
        _domain: domain,
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('Error checking peer data access:', error);
      return false;
    }
  };

  /**
   * Obtém todos os domínios compartilhados com um usuário específico
   */
  const getPeerSharedDomains = async (
    targetUserId: string
  ): Promise<PermissionDomain[]> => {
    if (!user?.id) return [];

    try {
      const { data, error } = await supabase.rpc('get_peer_shared_domains', {
        _requesting_user_id: user.id,
        _target_user_id: targetUserId,
      });

      if (error) throw error;
      return (data || []) as PermissionDomain[];
    } catch (error) {
      console.error('Error getting peer shared domains:', error);
      return [];
    }
  };

  /**
   * Cria ou atualiza um compartilhamento individual com peer
   */
  const shareToPeer = async (
    receiverUserId: string,
    domains: PermissionDomain[],
    isBidirectional: boolean = false
  ) => {
    if (!user?.id) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('peer_sharing')
      .upsert({
        sharer_user_id: user.id,
        receiver_user_id: receiverUserId,
        shared_domains: domains,
        is_bidirectional: isBidirectional,
      })
      .select()
      .single();

    if (error) throw error;

    await loadPeerData();
    return data;
  };

  /**
   * Remove um compartilhamento individual
   */
  const removePeerSharing = async (receiverUserId: string) => {
    if (!user?.id) throw new Error('User not authenticated');

    const { error } = await supabase
      .from('peer_sharing')
      .delete()
      .eq('sharer_user_id', user.id)
      .eq('receiver_user_id', receiverUserId);

    if (error) throw error;

    await loadPeerData();
  };

  /**
   * Atualiza a configuração de compartilhamento no nível
   * (Apenas para organization owners)
   */
  const updateLevelSharing = async (
    levelId: string,
    domains: PermissionDomain[]
  ) => {
    const { data, error } = await supabase
      .from('level_sharing_config')
      .upsert({
        level_id: levelId,
        shared_domains: domains,
      })
      .select()
      .single();

    if (error) throw error;

    await loadPeerData();
    return data;
  };

  /**
   * Remove a configuração de compartilhamento no nível
   */
  const removeLevelSharing = async (levelId: string) => {
    const { error } = await supabase
      .from('level_sharing_config')
      .delete()
      .eq('level_id', levelId);

    if (error) throw error;

    await loadPeerData();
  };

  return {
    loading,
    peerSharings,
    levelSharing,
    peersInLevel,
    canViewPeerData,
    getPeerSharedDomains,
    shareToPeer,
    removePeerSharing,
    updateLevelSharing,
    removeLevelSharing,
    refresh: loadPeerData,
  };
}
