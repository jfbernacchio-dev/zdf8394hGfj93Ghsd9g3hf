import { supabase } from '@/integrations/supabase/client';

// Padrões que serão capturados automaticamente do localStorage
const LAYOUT_PATTERNS = [
  'visible-cards',
  'card-size-',
  'section-height-',
  'dashboard_visible_cards',
  'dashboard_card_size_',
  'evolution_',
  'layout-',
];

/**
 * Captura snapshot de todos os dados de layout do localStorage
 */
export const captureLayoutSnapshot = (): Record<string, string> => {
  const snapshot: Record<string, string> = {};
  
  Object.keys(localStorage).forEach(key => {
    // Verifica se a chave corresponde a algum dos padrões
    if (LAYOUT_PATTERNS.some(pattern => key.includes(pattern))) {
      const value = localStorage.getItem(key);
      if (value !== null) {
        snapshot[key] = value;
      }
    }
  });
  
  console.log('[LayoutStorage] Snapshot capturado:', Object.keys(snapshot).length, 'itens');
  return snapshot;
};

/**
 * Aplica snapshot no localStorage
 */
export const applyLayoutSnapshot = (snapshot: Record<string, string>) => {
  console.log('[LayoutStorage] Aplicando snapshot:', Object.keys(snapshot).length, 'itens');
  
  Object.entries(snapshot).forEach(([key, value]) => {
    localStorage.setItem(key, value);
  });
};

/**
 * Limpa todos os dados de layout do localStorage
 */
export const clearLayoutFromLocalStorage = () => {
  const keysToRemove: string[] = [];
  
  Object.keys(localStorage).forEach(key => {
    if (LAYOUT_PATTERNS.some(pattern => key.includes(pattern))) {
      keysToRemove.push(key);
    }
  });
  
  keysToRemove.forEach(key => localStorage.removeItem(key));
  console.log('[LayoutStorage] Limpou', keysToRemove.length, 'itens do localStorage');
};

/**
 * Salva template no banco de dados
 */
export const saveTemplateToDatabase = async (
  userId: string,
  templateName: string,
  isDefault: boolean = false
) => {
  try {
    const snapshot = captureLayoutSnapshot();
    
    if (Object.keys(snapshot).length === 0) {
      throw new Error('Nenhum dado de layout encontrado para salvar');
    }

    // Se definindo como padrão, remove o padrão anterior
    if (isDefault) {
      const { error: updateError } = await supabase
        .from('user_layout_templates')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);
      
      if (updateError) {
        console.error('[LayoutStorage] Erro ao remover padrão anterior:', updateError);
      }
    }

    // Verifica se já existe um template com esse nome
    const { data: existing } = await supabase
      .from('user_layout_templates')
      .select('id')
      .eq('user_id', userId)
      .eq('template_name', templateName)
      .single();

    if (existing) {
      // Atualiza template existente
      const { data, error } = await supabase
        .from('user_layout_templates')
        .update({
          layout_snapshot: snapshot,
          is_default: isDefault,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) throw error;
      console.log('[LayoutStorage] Template atualizado:', templateName);
      return data;
    } else {
      // Cria novo template
      const { data, error } = await supabase
        .from('user_layout_templates')
        .insert({
          user_id: userId,
          template_name: templateName,
          layout_snapshot: snapshot,
          is_default: isDefault,
        })
        .select()
        .single();

      if (error) throw error;
      console.log('[LayoutStorage] Template criado:', templateName);
      return data;
    }
  } catch (error) {
    console.error('[LayoutStorage] Erro ao salvar template:', error);
    throw error;
  }
};

/**
 * Carrega template do banco de dados e aplica no localStorage
 */
export const loadTemplateFromDatabase = async (templateId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_layout_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Template não encontrado');

    applyLayoutSnapshot(data.layout_snapshot as Record<string, string>);
    console.log('[LayoutStorage] Template carregado:', data.template_name);
    
    return data;
  } catch (error) {
    console.error('[LayoutStorage] Erro ao carregar template:', error);
    throw error;
  }
};

/**
 * Busca template padrão do usuário
 */
export const getDefaultTemplate = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_layout_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error;
    }

    return data;
  } catch (error) {
    console.error('[LayoutStorage] Erro ao buscar template padrão:', error);
    return null;
  }
};

/**
 * Lista todos os templates do usuário
 */
export const listUserTemplates = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('user_layout_templates')
      .select('*')
      .eq('user_id', userId)
      .order('is_default', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('[LayoutStorage] Erro ao listar templates:', error);
    return [];
  }
};

/**
 * Define template como padrão
 */
export const setTemplateAsDefault = async (userId: string, templateId: string) => {
  try {
    // Remove padrão anterior
    await supabase
      .from('user_layout_templates')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);

    // Define novo padrão
    const { data, error } = await supabase
      .from('user_layout_templates')
      .update({ is_default: true })
      .eq('id', templateId)
      .select()
      .single();

    if (error) throw error;
    console.log('[LayoutStorage] Template definido como padrão');
    return data;
  } catch (error) {
    console.error('[LayoutStorage] Erro ao definir template como padrão:', error);
    throw error;
  }
};

/**
 * Duplica template
 */
export const duplicateTemplate = async (templateId: string, newName: string) => {
  try {
    const { data: original, error: fetchError } = await supabase
      .from('user_layout_templates')
      .select('*')
      .eq('id', templateId)
      .single();

    if (fetchError) throw fetchError;
    if (!original) throw new Error('Template não encontrado');

    const { data, error } = await supabase
      .from('user_layout_templates')
      .insert({
        user_id: original.user_id,
        template_name: newName,
        layout_snapshot: original.layout_snapshot,
        is_default: false,
      })
      .select()
      .single();

    if (error) throw error;
    console.log('[LayoutStorage] Template duplicado:', newName);
    return data;
  } catch (error) {
    console.error('[LayoutStorage] Erro ao duplicar template:', error);
    throw error;
  }
};

/**
 * Exclui template
 */
export const deleteTemplate = async (templateId: string) => {
  try {
    const { error } = await supabase
      .from('user_layout_templates')
      .delete()
      .eq('id', templateId);

    if (error) throw error;
    console.log('[LayoutStorage] Template excluído');
  } catch (error) {
    console.error('[LayoutStorage] Erro ao excluir template:', error);
    throw error;
  }
};

/**
 * Desabilita o template padrão do usuário
 */
export const disableDefaultTemplate = async (userId: string) => {
  try {
    const { error } = await supabase
      .from('user_layout_templates')
      .update({ is_default: false })
      .eq('user_id', userId)
      .eq('is_default', true);

    if (error) throw error;
    console.log('[LayoutStorage] Template padrão desabilitado');
  } catch (error) {
    console.error('[LayoutStorage] Erro ao desabilitar template padrão:', error);
    throw error;
  }
};
