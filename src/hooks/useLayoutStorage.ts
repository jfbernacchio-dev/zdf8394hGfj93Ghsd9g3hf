import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutType,
  LayoutConfig,
  saveLayoutToLocalStorage,
  loadLayoutFromLocalStorage,
  deleteLayoutFromLocalStorage,
} from '@/lib/layoutStorage';

/**
 * Hook SIMPLES para gerenciar layout usando apenas localStorage
 */
export function useLayoutStorage(layoutType: LayoutType, defaultLayout: LayoutConfig) {
  const { user } = useAuth();
  const [layout, setLayout] = useState<LayoutConfig>(defaultLayout);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carrega o layout do localStorage quando o usuário estiver disponível
  useEffect(() => {
    if (!user) {
      setIsLoaded(true);
      return;
    }

    console.log(`🔄 Carregando layout do tipo "${layoutType}" para user ${user.id}`);
    
    const savedLayout = loadLayoutFromLocalStorage(user.id, layoutType);
    
    if (savedLayout) {
      console.log('✅ Layout encontrado no localStorage, aplicando...');
      setLayout(savedLayout);
    } else {
      console.log('ℹ️ Nenhum layout salvo, usando default');
      setLayout(defaultLayout);
    }
    
    setIsLoaded(true);
  }, [user, layoutType, defaultLayout]);

  // Função para salvar o layout
  const saveLayout = useCallback(
    (newLayout: LayoutConfig) => {
      if (!user) {
        console.warn('⚠️ Usuário não autenticado, não é possível salvar');
        return false;
      }

      console.log('💾 Salvando layout...', newLayout);
      saveLayoutToLocalStorage(user.id, layoutType, newLayout);
      setLayout(newLayout);
      return true;
    },
    [user, layoutType]
  );

  // Função para resetar o layout
  const resetLayout = useCallback(() => {
    if (!user) {
      console.warn('⚠️ Usuário não autenticado, não é possível resetar');
      return false;
    }

    console.log('🔄 Resetando layout para o padrão');
    deleteLayoutFromLocalStorage(user.id, layoutType);
    setLayout(defaultLayout);
    return true;
  }, [user, layoutType, defaultLayout]);

  return {
    layout,
    setLayout,
    saveLayout,
    resetLayout,
    isLoaded,
  };
}
