import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermissionFlags } from './usePermissionFlags';
import { getSubordinateAutonomy, type AutonomyPermissions } from '@/lib/checkSubordinateAutonomy';
import { useLevelPermissions } from './useLevelPermissions';
import type { AccessLevel } from '@/types/permissions';

/**
 * ============================================================================
 * HOOK: useSubordinatePermissions (FASE 4 — INTEGRAÇÃO COM NOVO SISTEMA)
 * ============================================================================
 * 
 * Hook HÍBRIDO que integra novo sistema de níveis com sistema antigo.
 * 
 * LÓGICA DE PRIORIDADE:
 * 1. Se usuário tem posição organizacional → usa level permissions
 * 2. Senão, se é subordinado → usa subordinate_autonomy_settings (antigo)
 * 3. Senão → Full access (terapeuta Full)
 * 
 * RETORNA:
 * - permissions: Objeto com todas as configurações de autonomia
 * - loading: Estado de carregamento
 * - isFullTherapist: Atalho para verificar se é terapeuta Full
 * - usingNewSystem: Flag indicando se está usando novo sistema de níveis
 * 
 * TRANSIÇÃO SUAVE: Sistema antigo continua funcionando perfeitamente
 * ============================================================================
 */

export interface ExtendedAutonomyPermissions extends AutonomyPermissions {
  // Permissões derivadas para facilitar uso
  canViewFullFinancial: boolean; // Pode ver fechamento completo do Full
  canViewOwnFinancial: boolean;  // Pode ver suas próprias finanças
  canManageAllPatients: boolean; // Pode ver todos os pacientes da clínica
  canManageOwnPatients: boolean; // Gerencia apenas seus pacientes
  isFullTherapist: boolean;      // É terapeuta Full (não subordinado)
}

export function useSubordinatePermissions() {
  const { user } = useAuth();
  const { isSubordinate } = usePermissionFlags();
  const [permissions, setPermissions] = useState<ExtendedAutonomyPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [usingNewSystem, setUsingNewSystem] = useState(false);
  
  // FASE 4: Tentar usar novo sistema de níveis primeiro
  const { levelPermissions, levelInfo, loading: levelLoading } = useLevelPermissions();

  console.log('🎫 [useSubordinatePermissions] Estado:', {
    userId: user?.id,
    isSubordinate,
    loading,
    levelLoading,
    hasPermissions: !!permissions,
    hasLevelInfo: !!levelInfo,
    usingNewSystem
  });

  useEffect(() => {
    async function loadPermissions() {
      console.log('🎫 [useSubordinatePermissions] loadPermissions chamado:', { 
        user: user?.id, 
        isSubordinate,
        hasLevelInfo: !!levelInfo,
        levelLoading 
      });
      
      if (!user) {
        console.log('🎫 [useSubordinatePermissions] Sem user, setLoading(false)');
        setLoading(false);
        return;
      }

      // Aguardar level permissions carregar
      if (levelLoading) {
        return;
      }

      // ====================================================================
      // PRIORIDADE 1: NOVO SISTEMA DE NÍVEIS
      // ====================================================================
      if (levelInfo && levelPermissions) {
        console.log('🎫 [useSubordinatePermissions] ✅ USANDO NOVO SISTEMA (Level Permissions)');
        setUsingNewSystem(true);
        
        // Converter level permissions para formato ExtendedAutonomyPermissions
        const isOwner = levelInfo.isOwner;
        const hasFinancialWrite = hasAccessLevel(levelPermissions.financial, 'write');
        const managesOwn = levelPermissions.managesOwnPatients;
        
        setPermissions({
          managesOwnPatients: managesOwn,
          hasFinancialAccess: hasFinancialWrite,
          nfseEmissionMode: levelPermissions.nfseEmissionMode,
          canFullSeeClinic: !managesOwn, // Se não gerencia próprios = vê todos
          includeInFullFinancial: !hasFinancialWrite, // Se não tem acesso = entra no Full
          // Derivadas
          canViewFullFinancial: isOwner, // Apenas donos veem tudo
          canViewOwnFinancial: hasFinancialWrite,
          canManageAllPatients: !managesOwn,
          canManageOwnPatients: managesOwn,
          isFullTherapist: isOwner,
        });
        setLoading(false);
        return;
      }

      // ====================================================================
      // PRIORIDADE 2: SISTEMA ANTIGO (Subordinate Autonomy)
      // ====================================================================
      console.log('🎫 [useSubordinatePermissions] ⚠️ Usando SISTEMA ANTIGO (fallback)');
      setUsingNewSystem(false);
      
      // Se não é subordinado, tem todas as permissões (é Full)
      if (!isSubordinate) {
        console.log('🎫 [useSubordinatePermissions] NÃO é subordinado, setando permissões completas');
        setPermissions({
          managesOwnPatients: false, // Full gerencia todos
          hasFinancialAccess: true,
          nfseEmissionMode: 'own_company',
          canFullSeeClinic: true,
          includeInFullFinancial: false,
          // Derivadas
          canViewFullFinancial: true,
          canViewOwnFinancial: true,
          canManageAllPatients: true,
          canManageOwnPatients: false,
          isFullTherapist: true,
        });
        setLoading(false);
        return;
      }

      // É subordinado, buscar configurações antigas
      try {
        const autonomy = await getSubordinateAutonomy(user.id);
        
        setPermissions({
          ...autonomy,
          // Derivadas
          canViewFullFinancial: false, // Subordinados nunca veem fechamento do Full
          canViewOwnFinancial: autonomy.hasFinancialAccess,
          canManageAllPatients: !autonomy.managesOwnPatients, // Se não gerencia próprios = vê todos
          canManageOwnPatients: autonomy.managesOwnPatients,
          isFullTherapist: false,
        });
      } catch (error) {
        console.error('[useSubordinatePermissions] Error loading permissions:', error);
        // Default seguro em caso de erro
        setPermissions({
          managesOwnPatients: true,
          hasFinancialAccess: false,
          nfseEmissionMode: 'own_company',
          canFullSeeClinic: false,
          includeInFullFinancial: true,
          canViewFullFinancial: false,
          canViewOwnFinancial: false,
          canManageAllPatients: false,
          canManageOwnPatients: true,
          isFullTherapist: false,
        });
      } finally {
        setLoading(false);
      }
    }

    loadPermissions();
  }, [user, isSubordinate, levelInfo, levelPermissions, levelLoading]);

  return {
    permissions,
    loading,
    isFullTherapist: permissions?.isFullTherapist ?? false,
    usingNewSystem, // FASE 4: Flag para debug/monitoramento
  };
}

/**
 * Helper: Verifica se accessLevel atende minimumLevel
 */
function hasAccessLevel(current: AccessLevel, minimum: AccessLevel): boolean {
  const levels: AccessLevel[] = ['none', 'read', 'write', 'full'];
  const currentIndex = levels.indexOf(current);
  const minimumIndex = levels.indexOf(minimum);
  return currentIndex >= minimumIndex;
}
