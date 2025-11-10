import { supabase } from '@/integrations/supabase/client';

export type LayoutType = 'dashboard' | 'patient-detail' | 'evolution';

export interface LayoutConfig {
  visibleCards: string[];
  cardSizes: Record<string, { width: number; height: number; x: number; y: number }>;
  sectionHeights: Record<string, number>;
}

export interface LayoutPreference {
  id: string;
  user_id: string;
  layout_type: LayoutType;
  layout_config: LayoutConfig;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface LayoutTemplate {
  name: string;
  description: string;
  layout_type: LayoutType;
  layout_config: LayoutConfig;
  version: number;
  exported_at: string;
  exported_by: string;
}

/**
 * Load layout from DB (source of truth) and update localStorage cache
 */
export async function loadLayout(
  userId: string,
  layoutType: LayoutType
): Promise<LayoutConfig | null> {
  try {
    const { data, error } = await supabase
      .from('user_layout_preferences')
      .select('*')
      .eq('user_id', userId)
      .eq('layout_type', layoutType)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No layout found, return null
        return null;
      }
      throw error;
    }

    if (data) {
      // Update localStorage cache
      const cacheKey = `layout_${layoutType}`;
      localStorage.setItem(cacheKey, JSON.stringify(data.layout_config));
      localStorage.setItem(`${cacheKey}_synced_at`, new Date().toISOString());
      localStorage.setItem(`${cacheKey}_version`, data.version.toString());
      
      return data.layout_config as unknown as LayoutConfig;
    }

    return null;
  } catch (error) {
    console.error('Error loading layout from DB:', error);
    
    // Fallback to localStorage cache if DB fails
    const cacheKey = `layout_${layoutType}`;
    const cached = localStorage.getItem(cacheKey);
    if (cached) {
      try {
        return JSON.parse(cached) as LayoutConfig;
      } catch {
        return null;
      }
    }
    
    return null;
  }
}

/**
 * Save layout to DB and update localStorage cache
 */
export async function saveLayout(
  userId: string,
  layoutType: LayoutType,
  config: LayoutConfig
): Promise<boolean> {
  try {
    // Get current version
    const { data: current } = await supabase
      .from('user_layout_preferences')
      .select('version')
      .eq('user_id', userId)
      .eq('layout_type', layoutType)
      .single();

    const newVersion = (current?.version || 0) + 1;

    const { error } = await supabase
      .from('user_layout_preferences')
      .upsert({
        user_id: userId,
        layout_type: layoutType,
        layout_config: config as any,
        version: newVersion,
        updated_at: new Date().toISOString(),
      } as any);

    if (error) throw error;

    // Update localStorage cache
    const cacheKey = `layout_${layoutType}`;
    localStorage.setItem(cacheKey, JSON.stringify(config));
    localStorage.setItem(`${cacheKey}_synced_at`, new Date().toISOString());
    localStorage.setItem(`${cacheKey}_version`, newVersion.toString());
    
    // Remove pending sync flag if exists
    localStorage.removeItem(`${cacheKey}_pending_sync`);

    return true;
  } catch (error) {
    console.error('Error saving layout to DB:', error);
    
    // If offline, save to localStorage with pending sync flag
    const cacheKey = `layout_${layoutType}`;
    localStorage.setItem(cacheKey, JSON.stringify(config));
    localStorage.setItem(`${cacheKey}_pending_sync`, 'true');
    
    return false;
  }
}

/**
 * Check for pending syncs and sync them
 */
export async function syncPendingLayouts(userId: string): Promise<void> {
  const layoutTypes: LayoutType[] = ['dashboard', 'patient-detail', 'evolution'];
  
  for (const layoutType of layoutTypes) {
    const cacheKey = `layout_${layoutType}`;
    const isPending = localStorage.getItem(`${cacheKey}_pending_sync`);
    
    if (isPending === 'true') {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        try {
          const config = JSON.parse(cached) as LayoutConfig;
          await saveLayout(userId, layoutType, config);
        } catch (error) {
          console.error(`Error syncing pending layout ${layoutType}:`, error);
        }
      }
    }
  }
}

/**
 * Subscribe to realtime updates for layouts
 */
export function subscribeToLayoutUpdates(
  userId: string,
  layoutType: LayoutType,
  onUpdate: (config: LayoutConfig) => void
) {
  const channel = supabase
    .channel(`layout-sync-${layoutType}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'user_layout_preferences',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        const newData = payload.new as LayoutPreference;
        if (newData.layout_type === layoutType) {
          // Update localStorage cache
          const cacheKey = `layout_${layoutType}`;
          localStorage.setItem(cacheKey, JSON.stringify(newData.layout_config));
          localStorage.setItem(`${cacheKey}_synced_at`, newData.updated_at);
          localStorage.setItem(`${cacheKey}_version`, newData.version.toString());
          
          // Notify component to update
          onUpdate(newData.layout_config);
        }
      }
    )
    .subscribe();

  return channel;
}

/**
 * Export layout as template file
 */
export async function exportLayoutTemplate(
  userId: string,
  layoutType: LayoutType,
  templateName: string,
  templateDescription: string
): Promise<Blob> {
  const { data } = await supabase
    .from('user_layout_preferences')
    .select('*')
    .eq('user_id', userId)
    .eq('layout_type', layoutType)
    .single();

  if (!data) {
    throw new Error('Layout not found');
  }

  // Get user email for exported_by
  const { data: { user } } = await supabase.auth.getUser();

  const template: LayoutTemplate = {
    name: templateName,
    description: templateDescription,
    layout_type: layoutType,
    layout_config: data.layout_config as unknown as LayoutConfig,
    version: data.version,
    exported_at: new Date().toISOString(),
    exported_by: user?.email || 'Unknown',
  };

  const json = JSON.stringify(template, null, 2);
  return new Blob([json], { type: 'application/json' });
}

/**
 * Import layout from template file
 */
export async function importLayoutTemplate(
  userId: string,
  file: File
): Promise<{ success: boolean; layoutType: LayoutType; message: string }> {
  try {
    const text = await file.text();
    const template = JSON.parse(text) as LayoutTemplate;

    // Validate template structure
    if (!template.layout_type || !template.layout_config) {
      throw new Error('Arquivo de template inválido');
    }

    if (!['dashboard', 'patient-detail', 'evolution'].includes(template.layout_type)) {
      throw new Error('Tipo de layout inválido');
    }

    // Save imported layout
    const success = await saveLayout(userId, template.layout_type, template.layout_config);

    if (success) {
      return {
        success: true,
        layoutType: template.layout_type,
        message: `Template "${template.name}" importado com sucesso!`,
      };
    } else {
      throw new Error('Falha ao salvar layout importado');
    }
  } catch (error) {
    console.error('Error importing template:', error);
    return {
      success: false,
      layoutType: 'dashboard',
      message: error instanceof Error ? error.message : 'Erro ao importar template',
    };
  }
}

/**
 * Reset layout to default
 */
export async function resetLayoutToDefault(
  userId: string,
  layoutType: LayoutType
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_layout_preferences')
      .delete()
      .eq('user_id', userId)
      .eq('layout_type', layoutType);

    if (error) throw error;

    // Clear localStorage cache
    const cacheKey = `layout_${layoutType}`;
    localStorage.removeItem(cacheKey);
    localStorage.removeItem(`${cacheKey}_synced_at`);
    localStorage.removeItem(`${cacheKey}_version`);
    localStorage.removeItem(`${cacheKey}_pending_sync`);

    return true;
  } catch (error) {
    console.error('Error resetting layout:', error);
    return false;
  }
}
