import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Bell, BellOff, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { toast } from 'sonner';

export const NotificationSettings = () => {
  const { permission, isSupported, requestPermission, sendNotification } = usePushNotifications();

  const handleTestNotification = () => {
    sendNotification('Teste de Notificação', {
      body: 'Se você viu esta mensagem, as notificações estão funcionando!',
      icon: '/icon-192x192.png',
    });
  };

  const getPermissionStatus = () => {
    if (!isSupported) {
      return {
        icon: <XCircle className="h-5 w-5 text-destructive" />,
        text: 'Não suportado',
        description: 'Seu navegador não suporta notificações push',
        variant: 'destructive' as const,
      };
    }

    switch (permission) {
      case 'granted':
        return {
          icon: <CheckCircle className="h-5 w-5 text-primary" />,
          text: 'Ativadas',
          description: 'Você receberá notificações sobre suas sessões',
          variant: 'default' as const,
        };
      case 'denied':
        return {
          icon: <XCircle className="h-5 w-5 text-destructive" />,
          text: 'Bloqueadas',
          description: 'Você bloqueou as notificações. Ative nas configurações do navegador.',
          variant: 'destructive' as const,
        };
      default:
        return {
          icon: <AlertCircle className="h-5 w-5 text-warning" />,
          text: 'Pendente',
          description: 'Clique em "Ativar Notificações" para receber alertas',
          variant: 'secondary' as const,
        };
    }
  };

  const status = getPermissionStatus();

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle>Notificações Push</CardTitle>
        </div>
        <CardDescription>
          Configure as notificações para receber lembretes de sessões
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
          <div className="flex items-center gap-3">
            {status.icon}
            <div>
              <p className="font-medium">{status.text}</p>
              <p className="text-sm text-muted-foreground">{status.description}</p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          {permission === 'default' && isSupported && (
            <Button onClick={requestPermission} className="w-full">
              <Bell className="mr-2 h-4 w-4" />
              Ativar Notificações
            </Button>
          )}

          {permission === 'granted' && (
            <Button onClick={handleTestNotification} variant="outline" className="w-full">
              Testar Notificação
            </Button>
          )}

          {permission === 'denied' && (
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-2">
                <strong>Como reativar:</strong>
              </p>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Clique no cadeado na barra de endereço</li>
                <li>Procure por "Notificações"</li>
                <li>Altere para "Permitir"</li>
                <li>Recarregue a página</li>
              </ol>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            <strong>Nota:</strong> No iPhone, notificações push têm suporte limitado. 
            Para melhor experiência com notificações, use Android ou instale o app na tela inicial.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
