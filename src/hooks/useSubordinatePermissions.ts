import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSubordinateAutonomy, type AutonomyPermissions } from '@/lib/checkSubordinateAutonomy';

/**
 * ============================================================================
 * HOOK: useSubordinatePermissions
 * ============================================================================
 * 
 * Hook centralizado para gerenciar permissões de subordinados.
 * 
 * RETORNA:
 * - permissions: Objeto com todas as configurações de autonomia
 * - loading: Estado de carregamento
 * - isFullTherapist: Atalho para verificar se é terapeuta Full (não subordinado)
 * 
 * CASOS DE USO:
 * 1. Componentes que precisam esconder/mostrar funcionalidades
 * 2. Páginas que precisam filtrar dados baseado em permissões
 * 3. Lógica condicional de navegação
 * 
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
  const { user, isSubordinate } = useAuth();
  const [permissions, setPermissions] = useState<ExtendedAutonomyPermissions | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPermissions() {
      if (!user) {
        setLoading(false);
        return;
      }

      // Se não é subordinado, tem todas as permissões (é Full)
      if (!isSubordinate) {
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

      // É subordinado, buscar configurações
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
  }, [user, isSubordinate]);

  return {
    permissions,
    loading,
    isFullTherapist: permissions?.isFullTherapist ?? false,
  };
}
