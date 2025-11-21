/**
 * ============================================================================
 * HOOK: useEffectivePermissions - FASE 3 (SISTEMA NOVO)
 * ============================================================================
 * 
 * Hook unificado que resolve permissões efetivas do usuário atual.
 * 
 * SUBSTITUI:
 * - useSubordinatePermissions
 * - useLevelPermissions
 * - usePermissionFlags (parcialmente)
 * 
 * FONTE DA VERDADE: resolveEffectivePermissions(userId)
 * ============================================================================
 */

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { resolveEffectivePermissions, type EffectivePermissions } from '@/lib/resolveEffectivePermissions';

export function useEffectivePermissions() {
  const { user, roleGlobal } = useAuth();
  const [permissions, setPermissions] = useState<EffectivePermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function loadPermissions() {
      if (!user) {
        console.log('[PERM] No user, setting loading to false');
        setPermissions(null);
        setLoading(false);
        return;
      }

      try {
        console.log('[PERM] 🔍 Resolving effective permissions for user:', user.id);
        console.log('[PERM] User roleGlobal:', roleGlobal);
        
        const effectivePerms = await resolveEffectivePermissions(user.id);
        
        console.log('[PERM] ✅ Effective permissions resolved:', effectivePerms);
        
        setPermissions(effectivePerms);
        setError(null);
      } catch (err) {
        console.error('[PERM] ❌ Error loading permissions:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
        setPermissions(null);
      } finally {
        setLoading(false);
      }
    }

    loadPermissions();
  }, [user, roleGlobal]);

  return {
    permissions,
    loading,
    error,
    // Atalhos convenientes
    canAccessClinical: permissions?.canAccessClinical ?? false,
    financialAccess: permissions?.financialAccess ?? 'none',
    canAccessMarketing: permissions?.canAccessMarketing ?? false,
    canAccessWhatsapp: permissions?.canAccessWhatsapp ?? false,
    usesOrgNFSe: permissions?.usesOrgNFSe ?? false,
    clinicalVisibleToSuperiors: permissions?.clinicalVisibleToSuperiors ?? false,
    peerAgendaSharing: permissions?.peerAgendaSharing ?? false,
    peerClinicalSharing: permissions?.peerClinicalSharing ?? 'none',
    canEditSchedules: permissions?.canEditSchedules ?? false,
    canViewTeamFinancialSummary: permissions?.canViewTeamFinancialSummary ?? false,
    isOrganizationOwner: permissions?.isOrganizationOwner ?? false,
  };
}
