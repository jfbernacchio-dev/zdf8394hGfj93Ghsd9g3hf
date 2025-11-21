/**
 * ============================================================================
 * LEGACY COMPATIBILITY HOOK - useLegacySubordinatePermissions
 * ============================================================================
 * 
 * Hook de compatibilidade temporária para código antigo que esperava
 * subordinate_autonomy_settings. Agora é apenas uma camada sobre
 * useEffectivePermissions().
 * 
 * ⚠️ DEPRECADO - Usar useEffectivePermissions() diretamente em código novo
 * ============================================================================
 */

import { useAuth } from '@/contexts/AuthContext';
import { useEffectivePermissions } from './useEffectivePermissions';

export interface LegacyAutonomyPermissions {
  hasFinancialAccess: boolean;
  managesOwnPatients: boolean;
  nfseEmissionMode: 'none' | 'own' | 'full';
}

export function useLegacySubordinatePermissions() {
  const { user, roleGlobal } = useAuth();
  const effectivePermissions = useEffectivePermissions();

  // Se não há usuário, retornar valores vazios seguros
  if (!user) {
    return {
      isSubordinate: false,
      autonomy: {
        hasFinancialAccess: false,
        managesOwnPatients: false,
        nfseEmissionMode: 'none' as const,
      },
      loading: false,
    };
  }

  // Mapear effectivePermissions para o formato antigo
  const autonomy: LegacyAutonomyPermissions = {
    hasFinancialAccess: effectivePermissions.financialAccess !== 'none',
    managesOwnPatients: true, // No novo sistema, todos gerenciam seus próprios pacientes
    nfseEmissionMode: effectivePermissions.usesOrgNFSe ? 'full' : 'own',
  };

  // isSubordinate agora é derivado do roleGlobal
  // (assistants e accountants são considerados "subordinados" no contexto legado)
  const isSubordinate = roleGlobal === 'assistant' || roleGlobal === 'accountant';

  return {
    isSubordinate,
    autonomy,
    loading: false,
  };
}
