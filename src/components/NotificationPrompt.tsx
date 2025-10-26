import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';

export const NotificationPrompt = () => {
  const [show, setShow] = useState(false);
  const { permission, isSupported, requestPermission } = usePushNotifications();

  useEffect(() => {
    // Verifica se já mostrou o prompt antes
    const hasSeenPrompt = localStorage.getItem('hasSeenNotificationPrompt');
    
    // Mostra o prompt se:
    // 1. Notificações são suportadas
    // 2. Permissão ainda não foi solicitada
    // 3. Usuário ainda não viu o prompt
    if (isSupported && permission === 'default' && !hasSeenPrompt) {
      // Aguarda 3 segundos antes de mostrar
      const timer = setTimeout(() => {
        setShow(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isSupported, permission]);

  const handleRequestPermission = async () => {
    await requestPermission();
    localStorage.setItem('hasSeenNotificationPrompt', 'true');
    setShow(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('hasSeenNotificationPrompt', 'true');
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md animate-in slide-in-from-bottom-5">
      <Card className="shadow-lg border-primary/20">
        <CardHeader className="relative pb-3">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 h-6 w-6"
            onClick={handleDismiss}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-lg">Ativar Notificações?</CardTitle>
          </div>
          <CardDescription>
            Receba lembretes sobre suas sessões agendadas
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-2">
          <Button onClick={handleRequestPermission} className="flex-1">
            Ativar
          </Button>
          <Button variant="outline" onClick={handleDismiss} className="flex-1">
            Agora não
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};
