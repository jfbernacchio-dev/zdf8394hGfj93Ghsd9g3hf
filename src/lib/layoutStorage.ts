// Sistema SIMPLES de salvamento de layout usando apenas localStorage

export type LayoutType = 'dashboard' | 'patient_detail' | 'evolution';

export interface LayoutConfig {
  visibleCards: string[];
  cardOrder: string[];
  cardSizes: Record<string, { width: number; height: number; x: number; y: number }>;
  sectionHeights: Record<string, number>;
}

/**
 * Salva o layout no localStorage
 */
export function saveLayoutToLocalStorage(
  userId: string,
  layoutType: LayoutType,
  config: LayoutConfig
): void {
  const key = `layout_${userId}_${layoutType}`;
  try {
    localStorage.setItem(key, JSON.stringify(config));
    console.log('✅ Layout salvo no localStorage:', key);
  } catch (error) {
    console.error('❌ Erro ao salvar layout no localStorage:', error);
  }
}

/**
 * Carrega o layout do localStorage
 */
export function loadLayoutFromLocalStorage(
  userId: string,
  layoutType: LayoutType
): LayoutConfig | null {
  const key = `layout_${userId}_${layoutType}`;
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const config = JSON.parse(stored);
      console.log('✅ Layout carregado do localStorage:', key);
      return config;
    }
    console.log('ℹ️ Nenhum layout encontrado no localStorage:', key);
    return null;
  } catch (error) {
    console.error('❌ Erro ao carregar layout do localStorage:', error);
    return null;
  }
}

/**
 * Deleta o layout do localStorage
 */
export function deleteLayoutFromLocalStorage(
  userId: string,
  layoutType: LayoutType
): void {
  const key = `layout_${userId}_${layoutType}`;
  try {
    localStorage.removeItem(key);
    console.log('✅ Layout deletado do localStorage:', key);
  } catch (error) {
    console.error('❌ Erro ao deletar layout do localStorage:', error);
  }
}
