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
  config: LayoutConfig,
  updateActiveProfileToo: boolean = false
): Promise<boolean> {
  try {
    // Create backup before saving
    const currentLayout = await loadLayout(userId, layoutType);
    if (currentLayout) {
      await createBackup(userId, layoutType, currentLayout);
    }

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
      } as any, {
        onConflict: 'user_id,layout_type'
      });

    if (error) throw error;

    // Update localStorage cache
    const cacheKey = `layout_${layoutType}`;
    localStorage.setItem(cacheKey, JSON.stringify(config));
    localStorage.setItem(`${cacheKey}_synced_at`, new Date().toISOString());
    localStorage.setItem(`${cacheKey}_version`, newVersion.toString());
    
    // Remove pending sync flag if exists
    localStorage.removeItem(`${cacheKey}_pending_sync`);

    // Update active profile if requested
    if (updateActiveProfileToo) {
      console.log('[saveLayout] Updating active profile...');
      const profileUpdateSuccess = await updateActiveProfile(userId, layoutType, config);
      console.log('[saveLayout] Profile update result:', profileUpdateSuccess);
    }

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

// ============================================================================
// BACKUP MANAGEMENT
// ============================================================================

export interface LayoutBackup {
  id: string;
  user_id: string;
  layout_type: LayoutType;
  layout_config: LayoutConfig;
  created_at: string;
  version: number;
}

export async function createBackup(
  userId: string,
  layoutType: LayoutType,
  config: LayoutConfig
): Promise<boolean> {
  try {
    // Get current backup count
    const { data: backups, error: countError } = await supabase
      .from('layout_backups')
      .select('id, created_at, version')
      .eq('user_id', userId)
      .eq('layout_type', layoutType)
      .order('created_at', { ascending: false });

    if (countError) throw countError;

    // If we have 5 or more backups, delete the oldest ones
    if (backups && backups.length >= 5) {
      const toDelete = backups.slice(4).map(b => b.id);
      await supabase
        .from('layout_backups')
        .delete()
        .in('id', toDelete);
    }

    // Get next version number
    const nextVersion = backups && backups.length > 0 
      ? Math.max(...backups.map(b => b.version || 0)) + 1 
      : 1;

    // Insert new backup
    const { error } = await supabase
      .from('layout_backups')
      .insert({
        user_id: userId,
        layout_type: layoutType,
        layout_config: config as any,
        version: nextVersion
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error creating backup:', error);
    return false;
  }
}

export async function getBackups(
  userId: string,
  layoutType: LayoutType
): Promise<LayoutBackup[]> {
  try {
    const { data, error } = await supabase
      .from('layout_backups')
      .select('*')
      .eq('user_id', userId)
      .eq('layout_type', layoutType)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as LayoutBackup[];
  } catch (error) {
    console.error('Error fetching backups:', error);
    return [];
  }
}

export async function restoreBackup(
  userId: string,
  backupId: string
): Promise<LayoutConfig | null> {
  try {
    const { data, error } = await supabase
      .from('layout_backups')
      .select('layout_config, layout_type')
      .eq('id', backupId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Save as current layout
    await saveLayout(userId, data.layout_type as LayoutType, data.layout_config as unknown as LayoutConfig);
    
    return data.layout_config as unknown as LayoutConfig;
  } catch (error) {
    console.error('Error restoring backup:', error);
    return null;
  }
}

// ============================================================================
// ACTIVE PROFILE MANAGEMENT
// ============================================================================

export interface ActiveProfileState {
  user_id: string;
  active_profile_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Get the active profile ID for a user
 */
export async function getActiveProfileId(userId: string): Promise<string | null> {
  try {
    // Try DB first
    const { data, error } = await supabase
      .from('active_profile_state' as any)
      .select('active_profile_id')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    
    const activeProfileId = (data as any)?.active_profile_id || null;
    
    // Update cache
    if (activeProfileId) {
      localStorage.setItem('active_profile_id', activeProfileId);
      localStorage.setItem('active_profile_synced_at', new Date().toISOString());
    } else {
      localStorage.removeItem('active_profile_id');
      localStorage.removeItem('active_profile_synced_at');
    }
    
    return activeProfileId;
  } catch (error) {
    console.error('Error getting active profile:', error);
    
    // Fallback to cache
    const cached = localStorage.getItem('active_profile_id');
    return cached || null;
  }
}

/**
 * Set the active profile for a user
 */
export async function setActiveProfile(
  userId: string, 
  profileId: string | null
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('active_profile_state' as any)
      .upsert({
        user_id: userId,
        active_profile_id: profileId,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (error) throw error;
    
    // Update cache
    if (profileId) {
      localStorage.setItem('active_profile_id', profileId);
      localStorage.setItem('active_profile_synced_at', new Date().toISOString());
    } else {
      localStorage.removeItem('active_profile_id');
      localStorage.removeItem('active_profile_synced_at');
    }
    
    return true;
  } catch (error) {
    console.error('Error setting active profile:', error);
    
    // Save to cache as pending sync
    if (profileId) {
      localStorage.setItem('active_profile_id', profileId);
      localStorage.setItem('active_profile_pending_sync', 'true');
    }
    
    return false;
  }
}

/**
 * Update the active profile with current layouts
 */
export async function updateActiveProfile(
  userId: string, 
  layoutTypeToUpdate?: LayoutType,
  newLayoutConfig?: LayoutConfig
): Promise<boolean> {
  try {
    const activeProfileId = await getActiveProfileId(userId);
    if (!activeProfileId) {
      console.log('[updateActiveProfile] No active profile found');
      return false;
    }

    console.log('[updateActiveProfile] Updating profile:', activeProfileId);

    // Get current profile to preserve other layouts
    const { data: profileData, error: fetchError } = await supabase
      .from('layout_profiles')
      .select('layout_configs')
      .eq('id', activeProfileId)
      .eq('user_id', userId)
      .single();

    if (fetchError) throw fetchError;

    const currentLayouts = (profileData?.layout_configs || {}) as unknown as Record<string, LayoutConfig>;

    // If specific layout provided, update only that one
    if (layoutTypeToUpdate && newLayoutConfig) {
      currentLayouts[layoutTypeToUpdate] = newLayoutConfig;
      console.log('[updateActiveProfile] Updated specific layout:', layoutTypeToUpdate);
    } else {
      // Otherwise, load ALL current layouts from DB
      const layoutTypes: LayoutType[] = ['dashboard', 'patient-detail', 'evolution'];
      
      for (const layoutType of layoutTypes) {
        const layout = await loadLayout(userId, layoutType);
        if (layout) {
          currentLayouts[layoutType] = layout;
        }
      }
    }

    console.log('[updateActiveProfile] Layouts to update:', Object.keys(currentLayouts));

    // Update the profile
    const { error } = await supabase
      .from('layout_profiles')
      .update({
        layout_configs: currentLayouts as any,
        updated_at: new Date().toISOString(),
      })
      .eq('id', activeProfileId)
      .eq('user_id', userId);

    if (error) throw error;
    
    console.log('[updateActiveProfile] Profile updated successfully');
    return true;
  } catch (error) {
    console.error('[updateActiveProfile] Error:', error);
    return false;
  }
}

// ============================================================================
// PROFILE MANAGEMENT
// ============================================================================

export interface LayoutProfile {
  id: string;
  user_id: string;
  profile_name: string;
  layout_configs: Record<LayoutType, LayoutConfig>;
  created_at: string;
  updated_at: string;
}

export async function getProfiles(
  userId: string
): Promise<LayoutProfile[]> {
  try {
    const { data, error } = await supabase
      .from('layout_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as LayoutProfile[];
  } catch (error) {
    console.error('Error fetching profiles:', error);
    return [];
  }
}

export async function saveProfile(
  userId: string,
  profileName: string
): Promise<boolean> {
  try {
    // Check if user already has 5 profiles
    const { data: existing, error: countError } = await supabase
      .from('layout_profiles')
      .select('id')
      .eq('user_id', userId);

    if (countError) throw countError;

    if (existing && existing.length >= 5) {
      throw new Error('Você já possui 5 profiles. Exclua um antes de criar outro.');
    }

    // Load ALL current layouts
    const layoutTypes: LayoutType[] = ['dashboard', 'patient-detail', 'evolution'];
    const allLayouts: Record<string, LayoutConfig> = {};
    
    for (const layoutType of layoutTypes) {
      const layout = await loadLayout(userId, layoutType);
      if (layout) {
        allLayouts[layoutType] = layout;
      }
    }

    const { error } = await supabase
      .from('layout_profiles')
      .insert({
        user_id: userId,
        profile_name: profileName,
        layout_configs: allLayouts as any
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error saving profile:', error);
    throw error;
  }
}

export async function loadProfile(
  userId: string,
  profileId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('layout_profiles')
      .select('layout_configs')
      .eq('id', profileId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!data) return false;

    const layoutConfigs = data.layout_configs as unknown as Record<string, LayoutConfig>;
    const layoutTypes: LayoutType[] = ['dashboard', 'patient-detail', 'evolution'];

    // Create backups for ALL current layouts before loading profile
    for (const layoutType of layoutTypes) {
      const currentLayout = await loadLayout(userId, layoutType);
      if (currentLayout) {
        await createBackup(userId, layoutType, currentLayout);
      }
    }

    // Load ALL layouts from profile
    for (const layoutType of layoutTypes) {
      if (layoutConfigs[layoutType]) {
        await saveLayout(userId, layoutType, layoutConfigs[layoutType], false);
      }
    }
    
    // Set this profile as active
    await setActiveProfile(userId, profileId);
    
    return true;
  } catch (error) {
    console.error('Error loading profile:', error);
    return false;
  }
}

export async function deleteProfile(
  userId: string,
  profileId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('layout_profiles')
      .delete()
      .eq('id', profileId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting profile:', error);
    return false;
  }
}

export async function duplicateProfile(
  userId: string,
  profileId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('layout_profiles')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!data) return false;

    // Check if user already has 5 profiles
    const { data: existing, error: countError } = await supabase
      .from('layout_profiles')
      .select('id')
      .eq('user_id', userId);

    if (countError) throw countError;

    if (existing && existing.length >= 5) {
      throw new Error('Você já possui 5 profiles. Exclua um antes de duplicar.');
    }

    const { error: insertError } = await supabase
      .from('layout_profiles')
      .insert({
        user_id: userId,
        profile_name: `${data.profile_name} (cópia)`,
        layout_configs: data.layout_configs
      });

    if (insertError) throw insertError;
    return true;
  } catch (error) {
    console.error('Error duplicating profile:', error);
    throw error;
  }
}

export async function exportProfile(
  userId: string,
  profileId: string
): Promise<Blob> {
  try {
    const { data, error } = await supabase
      .from('layout_profiles')
      .select('*')
      .eq('id', profileId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!data) throw new Error('Profile não encontrado');

    const exportData = {
      name: data.profile_name,
      description: `Profile exportado em ${new Date().toLocaleDateString('pt-BR')}`,
      layout_configs: data.layout_configs,
      version: 5,
      exported_at: new Date().toISOString(),
      exported_by: userId
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });

    return blob;
  } catch (error) {
    console.error('Error exporting profile:', error);
    throw error;
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
    // Create backup before resetting
    const currentLayout = await loadLayout(userId, layoutType);
    if (currentLayout) {
      await createBackup(userId, layoutType, currentLayout);
    }

    // Delete from database
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
