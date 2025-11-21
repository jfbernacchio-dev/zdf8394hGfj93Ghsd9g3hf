/**
 * ============================================================================
 * HOOK: usePermissionFlags - FASE 2 (Transição)
 * ============================================================================
 * 
 * Hook temporário de transição que deriva flags booleanas do novo sistema
 * para manter compatibilidade com código legado durante a migração.
 * 
 * OBJETIVO: Permitir que componentes antigos continuem funcionando enquanto
 * migramos gradualmente para o novo modelo.
 * 
 * ⚠️ ESTE HOOK SERÁ REMOVIDO NA FASE 3
 * ============================================================================
 */

import { useAuth } from '@/contexts/AuthContext';
import { useLevelPermissions } from './useLevelPermissions';

export interface PermissionFlags {
  isFullTherapist: boolean;
  isSubordinate: boolean;
  isPsychologist: boolean;
  isAssistant: boolean;
}

/**
 * Retorna flags booleanas derivadas do novo sistema de permissões
 * 
 * MAPEAMENTO:
 * - isFullTherapist: psychologist no nível 1 (dono)
 * - isSubordinate: psychologist em níveis > 1 (subordinado)
 * - isPsychologist: qualquer psychologist
 * - isAssistant: role assistant
 */
export function usePermissionFlags(): PermissionFlags {
  const { roleGlobal } = useAuth();
  const { levelInfo, loading } = useLevelPermissions();
  
  // Durante carregamento, retornar false para tudo
  if (loading || !roleGlobal) {
    return {
      isFullTherapist: false,
      isSubordinate: false,
      isPsychologist: false,
      isAssistant: false,
    };
  }
  
  const isPsychologist = roleGlobal === 'psychologist';
  const isAssistant = roleGlobal === 'assistant';
  
  // isFullTherapist = psychologist no nível 1 OU psychologist sem posição (default full)
  const isFullTherapist = isPsychologist && (!levelInfo || levelInfo.levelNumber === 1);
  
  // isSubordinate = psychologist com nível > 1 E não é dono
  const isSubordinate = isPsychologist && 
                        levelInfo !== null && 
                        levelInfo.levelNumber > 1 && 
                        !levelInfo.isOwner;
  
  return {
    isFullTherapist,
    isSubordinate,
    isPsychologist,
    isAssistant,
  };
}
