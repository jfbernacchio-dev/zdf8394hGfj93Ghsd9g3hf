import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  loadLayout,
  saveLayout,
  subscribeToLayoutUpdates,
  syncPendingLayouts,
  createBackup,
  getActiveProfileId,
  loadProfile,
  LayoutType,
  LayoutConfig,
} from '@/lib/layoutSync';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useLayoutSync(
  layoutType: LayoutType, 
  defaultLayout: LayoutConfig,
  isEditMode: boolean = false
) {
  const { user } = useAuth();
  const [layout, setLayout] = useState<LayoutConfig>(defaultLayout);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load layout on mount - with auto-load of active profile
  useEffect(() => {
    if (!user) return;

    const loadUserLayout = async () => {
      setIsLoading(true);
      try {
        // Sync any pending layouts first
        await syncPendingLayouts(user.id);

        // Check if user already has a saved layout
        const savedLayout = await loadLayout(user.id, layoutType);
        
        if (savedLayout) {
          // User has saved layouts, use them
          setLayout(savedLayout);
        } else {
          // First time user - check if there's an active profile to load
          const activeProfileId = await getActiveProfileId(user.id);
          if (activeProfileId) {
            // Load the active profile (this will populate user_layout_preferences)
            await loadProfile(user.id, activeProfileId);
            // Now load the newly populated layout
            const profileLayout = await loadLayout(user.id, layoutType);
            if (profileLayout) {
              setLayout(profileLayout);
            } else {
              setLayout(defaultLayout);
            }
          } else {
            // No profile, use default
            setLayout(defaultLayout);
          }
        }
      } catch (error) {
        console.error('Error loading layout:', error);
        setLayout(defaultLayout);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserLayout();
  }, [user, layoutType]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!user) return;

    let channel: RealtimeChannel;

    const setupRealtimeSubscription = () => {
      channel = subscribeToLayoutUpdates(user.id, layoutType, (newConfig) => {
        // CRITICAL: Only update if NOT in edit mode to prevent losing temp changes
        if (!isEditMode) {
          console.log('[Realtime] Applying update for:', layoutType);
          setLayout(newConfig);
        } else {
          console.log('[Realtime] Blocked update during edit mode for:', layoutType);
        }
      });
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [user, layoutType, isEditMode]); // Add isEditMode dependency

  // Save layout function
  const saveUserLayout = useCallback(
    async (newLayout: LayoutConfig, updateActiveProfile: boolean = false) => {
      console.log('[useLayoutSync] saveUserLayout called');
      console.log('[useLayoutSync] newLayout:', newLayout);
      console.log('[useLayoutSync] updateActiveProfile:', updateActiveProfile);
      
      if (!user) {
        console.log('[useLayoutSync] No user, returning false');
        return false;
      }

      setIsSyncing(true);
      console.log('[useLayoutSync] setIsSyncing(true) - starting save...');
      
      try {
        const success = await saveLayout(user.id, layoutType, newLayout, updateActiveProfile);
        console.log('[useLayoutSync] saveLayout returned:', success);
        
        if (success) {
          console.log('[useLayoutSync] Setting layout state...');
          setLayout(newLayout);
          console.log('[useLayoutSync] Layout state updated');
        }
        return success;
      } catch (error) {
        console.error('[useLayoutSync] Error saving layout:', error);
        return false;
      } finally {
        console.log('[useLayoutSync] setIsSyncing(false) - save process ended');
        setIsSyncing(false);
      }
    },
    [user, layoutType]
  );

  return {
    layout,
    setLayout,
    saveUserLayout,
    isLoading,
    isSyncing,
  };
}
