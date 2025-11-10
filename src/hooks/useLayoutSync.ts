import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  loadLayout,
  saveLayout,
  subscribeToLayoutUpdates,
  syncPendingLayouts,
  createBackup,
  LayoutType,
  LayoutConfig,
} from '@/lib/layoutSync';
import { RealtimeChannel } from '@supabase/supabase-js';

export function useLayoutSync(layoutType: LayoutType, defaultLayout: LayoutConfig) {
  const { user } = useAuth();
  const [layout, setLayout] = useState<LayoutConfig>(defaultLayout);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  // Load layout on mount
  useEffect(() => {
    if (!user) return;

    const loadUserLayout = async () => {
      setIsLoading(true);
      try {
        // Sync any pending layouts first
        await syncPendingLayouts(user.id);

        // Load from DB
        const savedLayout = await loadLayout(user.id, layoutType);
        if (savedLayout) {
          setLayout(savedLayout);
        } else {
          // Use default layout if none exists
          setLayout(defaultLayout);
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
        console.log('Realtime layout update received:', layoutType);
        setLayout(newConfig);
      });
    };

    setupRealtimeSubscription();

    return () => {
      if (channel) {
        channel.unsubscribe();
      }
    };
  }, [user, layoutType]);

  // Save layout function
  const saveUserLayout = useCallback(
    async (newLayout: LayoutConfig, updateActiveProfile: boolean = false) => {
      if (!user) return false;

      setIsSyncing(true);
      try {
        // Create backup before saving
        const currentLayout = await loadLayout(user.id, layoutType);
        if (currentLayout) {
          await createBackup(user.id, layoutType, currentLayout);
        }

        const success = await saveLayout(user.id, layoutType, newLayout, updateActiveProfile);
        if (success) {
          setLayout(newLayout);
        }
        return success;
      } catch (error) {
        console.error('Error saving layout:', error);
        return false;
      } finally {
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
