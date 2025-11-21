/**
 * ============================================================================
 * LEGACY COMPATIBILITY HOOK - useLegacyLevelPermissions
 * ============================================================================
 * 
 * Hook de compatibilidade temporária para código antigo que esperava
 * level_permission_sets. Agora é apenas uma camada sobre
 * useEffectivePermissions().
 * 
 * ⚠️ DEPRECADO - Usar useEffectivePermissions() diretamente em código novo
 * ============================================================================
 */

import { useAuth } from '@/contexts/AuthContext';
import { useEffectivePermissions } from './useEffectivePermissions';

export interface LegacyLevelPermissions {
  canAccessClinical: boolean;
  canAccessMarketing: boolean;
  canAccessWhatsapp: boolean;
  canEditSchedules: boolean;
  canViewTeamFinancialSummary: boolean;
  clinicalVisibleToSuperiors: boolean;
  financialAccess: 'none' | 'summary' | 'full';
  hasFinancialAccess: boolean;
  managesOwnPatients: boolean;
  nfseEmissionMode: 'none' | 'own' | 'full';
  peerAgendaSharing: boolean;
  peerClinicalSharing: 'none' | 'view' | 'full';
  usesOrgNFSe: boolean;
}

export function useLegacyLevelPermissions() {
  const { user } = useAuth();
  const effectivePermissions = useEffectivePermissions();

  // Se não há usuário, retornar valores vazios seguros
  if (!user) {
    return {
      levelPermissions: null as LegacyLevelPermissions | null,
      loading: false,
    };
  }

  // Mapear effectivePermissions para o formato antigo
  const levelPermissions: LegacyLevelPermissions = {
    canAccessClinical: effectivePermissions.canAccessClinical,
    canAccessMarketing: effectivePermissions.canAccessMarketing,
    canAccessWhatsapp: effectivePermissions.canAccessWhatsapp,
    canEditSchedules: effectivePermissions.canEditSchedules,
    canViewTeamFinancialSummary: effectivePermissions.canViewTeamFinancialSummary,
    clinicalVisibleToSuperiors: effectivePermissions.clinicalVisibleToSuperiors,
    financialAccess: effectivePermissions.financialAccess,
    hasFinancialAccess: effectivePermissions.financialAccess !== 'none',
    managesOwnPatients: true, // No novo sistema, todos gerenciam seus próprios pacientes
    nfseEmissionMode: effectivePermissions.usesOrgNFSe ? 'full' : 'own',
    peerAgendaSharing: effectivePermissions.peerAgendaSharing,
    peerClinicalSharing: effectivePermissions.peerClinicalSharing,
    usesOrgNFSe: effectivePermissions.usesOrgNFSe,
  };

  return {
    levelPermissions,
    loading: false,
  };
}
