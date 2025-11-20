import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { PermissionDomain, AccessLevel, DomainPermissions } from '@/types/permissions';

/**
 * ============================================================================
 * HOOK: useLevelPermissions (FASE 3 - NOVO SISTEMA)
 * ============================================================================
 * 
 * Hook PARALELO ao useSubordinatePermissions.
 * Carrega permissões baseadas no NÍVEL organizacional do usuário.
 * 
 * DIFERENÇA DO SISTEMA ANTIGO:
 * - Antigo: permissões individuais (subordinate_autonomy_settings)
 * - Novo: permissões por nível (level_permission_sets)
 * 
 * RETORNA:
 * - levelPermissions: Permissões do nível do usuário (por domínio)
 * - levelInfo: Informações sobre a posição hierárquica
 * - loading: Estado de carregamento
 * - isOrganizationOwner: Se é dono da organização
 * 
 * FASE ATUAL: Sistema novo PARALELO, não substitui o antigo ainda
 * ============================================================================
 */

export interface LevelInfo {
  userId: string;
  positionId: string;
  positionName: string | null;
  levelId: string;
  levelNumber: number;
  levelName: string;
  organizationId: string;
  parentPositionId: string | null;
  directSuperiorUserId: string | null;
  isOwner: boolean;
  depthFromTop: number;
}

export interface LevelPermissions {
  financial: AccessLevel;
  administrative: AccessLevel;
  clinical: AccessLevel;
  media: AccessLevel;
  general: AccessLevel;
  charts: AccessLevel;
  team: AccessLevel;
  
  // Configurações financeiras específicas
  managesOwnPatients: boolean;
  hasFinancialAccess: boolean;
  nfseEmissionMode: 'own_company' | 'manager_company';
}

export interface UseLevelPermissionsReturn {
  levelPermissions: LevelPermissions | null;
  levelInfo: LevelInfo | null;
  loading: boolean;
  isOrganizationOwner: boolean;
  error: string | null;
}

export function useLevelPermissions(): UseLevelPermissionsReturn {
  const { user } = useAuth();
  const [levelPermissions, setLevelPermissions] = useState<LevelPermissions | null>(null);
  const [levelInfo, setLevelInfo] = useState<LevelInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOrganizationOwner, setIsOrganizationOwner] = useState(false);

  useEffect(() => {
    async function loadLevelPermissions() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        console.log('[useLevelPermissions] Carregando para user:', user.id);

        // ====================================================================
        // 1. BUSCAR INFORMAÇÕES HIERÁRQUICAS DO USUÁRIO
        // ====================================================================
        const { data: hierarchyData, error: hierarchyError } = await supabase
          .rpc('get_organization_hierarchy_info', { _user_id: user.id });

        if (hierarchyError) {
          console.error('[useLevelPermissions] Erro ao buscar hierarquia:', hierarchyError);
          
          // Se não tem posição ainda, retornar permissões default (full access)
          // Isso acontece se o usuário ainda não foi migrado para nova estrutura
          console.warn('[useLevelPermissions] Usuário sem posição organizacional, usando default full');
          setLevelPermissions(getDefaultFullPermissions());
          setIsOrganizationOwner(false);
          setLevelInfo(null);
          setError(null);
          setLoading(false);
          return;
        }

        if (!hierarchyData || hierarchyData.length === 0) {
          console.warn('[useLevelPermissions] Usuário sem posição organizacional');
          setLevelPermissions(getDefaultFullPermissions());
          setIsOrganizationOwner(false);
          setLevelInfo(null);
          setError(null);
          setLoading(false);
          return;
        }

        const hierarchy = hierarchyData[0];
        console.log('[useLevelPermissions] Hierarquia encontrada:', hierarchy);

        setLevelInfo({
          userId: hierarchy.user_id,
          positionId: hierarchy.position_id,
          positionName: hierarchy.position_name,
          levelId: hierarchy.level_id,
          levelNumber: hierarchy.level_number,
          levelName: hierarchy.level_name,
          organizationId: hierarchy.organization_id,
          parentPositionId: hierarchy.parent_position_id,
          directSuperiorUserId: hierarchy.direct_superior_user_id,
          isOwner: hierarchy.is_owner,
          depthFromTop: hierarchy.depth_from_top,
        });

        setIsOrganizationOwner(hierarchy.is_owner);

        // ====================================================================
        // 2. BUSCAR PERMISSÕES DO NÍVEL
        // ====================================================================
        const { data: permissionsData, error: permissionsError } = await supabase
          .from('level_permission_sets')
          .select('*')
          .eq('level_id', hierarchy.level_id);

        if (permissionsError) {
          console.error('[useLevelPermissions] Erro ao buscar permissões:', permissionsError);
          throw permissionsError;
        }

        if (!permissionsData || permissionsData.length === 0) {
          console.warn('[useLevelPermissions] Nível sem permissões configuradas, usando full');
          setLevelPermissions(getDefaultFullPermissions());
          setError(null);
          setLoading(false);
          return;
        }

        console.log('[useLevelPermissions] Permissões encontradas:', permissionsData);

        // ====================================================================
        // 3. MONTAR OBJETO DE PERMISSÕES
        // ====================================================================
        const permissions: LevelPermissions = {
          financial: 'none',
          administrative: 'none',
          clinical: 'none',
          media: 'none',
          general: 'full', // General sempre full
          charts: 'none',
          team: 'none',
          managesOwnPatients: false,
          hasFinancialAccess: false,
          nfseEmissionMode: 'manager_company',
        };

        // Preencher permissões de cada domínio
        permissionsData.forEach((perm) => {
          const domain = perm.domain as PermissionDomain;
          const accessLevel = perm.access_level as AccessLevel;
          
          permissions[domain] = accessLevel;
          
          // Pegar configurações financeiras do primeiro registro (todas iguais por nível)
          if (domain === 'financial') {
            permissions.managesOwnPatients = perm.manages_own_patients || false;
            permissions.hasFinancialAccess = perm.has_financial_access || false;
            permissions.nfseEmissionMode = (perm.nfse_emission_mode as 'own_company' | 'manager_company') || 'manager_company';
          }
        });

        setLevelPermissions(permissions);
        setError(null);
        console.log('[useLevelPermissions] Permissões carregadas:', permissions);

      } catch (err) {
        console.error('[useLevelPermissions] Erro:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
        
        // Em caso de erro, retornar permissões full para não bloquear
        setLevelPermissions(getDefaultFullPermissions());
      } finally {
        setLoading(false);
      }
    }

    loadLevelPermissions();
  }, [user]);

  return {
    levelPermissions,
    levelInfo,
    loading,
    isOrganizationOwner,
    error,
  };
}

/**
 * Permissões padrão (full access) para usuários sem posição organizacional
 * ou em caso de erro (não bloquear funcionalidade durante transição)
 */
function getDefaultFullPermissions(): LevelPermissions {
  return {
    financial: 'full',
    administrative: 'full',
    clinical: 'full',
    media: 'full',
    general: 'full',
    charts: 'full',
    team: 'full',
    managesOwnPatients: false,
    hasFinancialAccess: true,
    nfseEmissionMode: 'own_company',
  };
}

/**
 * Helper: Converte DomainPermissions (interface atual) para o novo formato
 * Útil para manter compatibilidade durante transição
 */
export function convertToDomainPermissions(levelPerms: LevelPermissions | null): DomainPermissions {
  if (!levelPerms) {
    return {
      financial: 'full',
      administrative: 'full',
      clinical: 'full',
      media: 'full',
      general: 'full',
      charts: 'full',
      team: 'full',
    };
  }

  return {
    financial: levelPerms.financial,
    administrative: levelPerms.administrative,
    clinical: levelPerms.clinical,
    media: levelPerms.media,
    general: levelPerms.general,
    charts: levelPerms.charts,
    team: levelPerms.team,
  };
}
