import { useState, useEffect } from 'react';
import { toast } from 'sonner';

interface NotificationPermissionState {
  permission: NotificationPermission;
  isSupported: boolean;
}

export const usePushNotifications = () => {
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>({
    permission: 'default',
    isSupported: false,
  });

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionState({
        permission: Notification.permission,
        isSupported: true,
      });
    }
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast.error('Notificações não são suportadas neste navegador');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setPermissionState({
        permission,
        isSupported: true,
      });

      if (permission === 'granted') {
        toast.success('Notificações ativadas com sucesso!');
        return true;
      } else if (permission === 'denied') {
        toast.error('Permissão de notificação negada');
        return false;
      }
      return false;
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      toast.error('Erro ao ativar notificações');
      return false;
    }
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window)) {
      console.log('Notificações não suportadas');
      return;
    }

    if (Notification.permission === 'granted') {
      try {
        new Notification(title, {
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          ...options,
        });
      } catch (error) {
        console.error('Erro ao enviar notificação:', error);
        // Fallback para toast se notificação falhar
        toast.info(title);
      }
    } else if (Notification.permission === 'default') {
      // Se permissão ainda não foi solicitada, mostra um toast
      toast.info(title);
    }
  };

  const scheduleNotification = (
    title: string,
    date: Date,
    options?: NotificationOptions
  ): number | null => {
    const now = new Date();
    const timeUntilNotification = date.getTime() - now.getTime();

    if (timeUntilNotification < 0) {
      console.log('Data de notificação no passado');
      return null;
    }

    const timeoutId = window.setTimeout(() => {
      sendNotification(title, options);
    }, timeUntilNotification);

    return timeoutId;
  };

  const cancelScheduledNotification = (timeoutId: number) => {
    window.clearTimeout(timeoutId);
  };

  return {
    ...permissionState,
    requestPermission,
    sendNotification,
    scheduleNotification,
    cancelScheduledNotification,
  };
};
