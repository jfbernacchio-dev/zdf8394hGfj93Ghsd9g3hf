import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from './ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  title: string;
  message: string;
  category: string;
  severity: string;
  read: boolean;
  action_url: string | null;
  created_at: string;
}

const categoryLabels: Record<string, string> = {
  security: 'Segurança',
  compliance: 'Compliance',
  backup: 'Backup',
  audit: 'Auditoria',
  permission: 'Permissões',
  incident: 'Incidentes',
  system: 'Sistema',
};

const severityColors: Record<string, string> = {
  info: 'bg-blue-500',
  warning: 'bg-yellow-500',
  error: 'bg-orange-500',
  critical: 'bg-red-500',
};

export const NotificationCenter = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadNotifications();
      
      // Subscribe to real-time updates
      const channel = supabase
        .channel('notifications')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'system_notifications',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            loadNotifications();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const loadNotifications = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('system_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error loading notifications:', error);
      return;
    }

    setNotifications(data || []);
    setUnreadCount(data?.filter(n => !n.read).length || 0);
  };

  const markAsRead = async (id: string) => {
    const { error } = await supabase
      .from('system_notifications')
      .update({ read: true })
      .eq('id', id);

    if (!error) {
      loadNotifications();
    }
  };

  const markAllAsRead = async () => {
    if (!user) return;

    const { error } = await supabase
      .from('system_notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);

    if (!error) {
      loadNotifications();
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.action_url) {
      setOpen(false);
      navigate(notification.action_url);
    }
  };

  const filterByCategory = (category: string) => {
    return notifications.filter(n => n.category === category);
  };

  const renderNotification = (notification: Notification) => (
    <div
      key={notification.id}
      onClick={() => handleNotificationClick(notification)}
      className={`p-4 rounded-lg border transition-colors cursor-pointer ${
        notification.read
          ? 'bg-muted/30 border-border'
          : 'bg-card border-primary/20'
      } hover:bg-muted/50`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full mt-2 ${severityColors[notification.severity]}`} />
        <div className="flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-sm">{notification.title}</h4>
            <Badge variant="outline" className="text-xs">
              {categoryLabels[notification.category]}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
          <p className="text-xs text-muted-foreground mt-2">
            {formatDistanceToNow(new Date(notification.created_at), {
              addSuffix: true,
              locale: ptBR,
            })}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>Central de Notificações</SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                Marcar todas como lidas
              </Button>
            )}
          </div>
        </SheetHeader>

        <Tabs defaultValue="all" className="mt-6">
          <TabsList className="w-full grid grid-cols-4 mb-4">
            <TabsTrigger value="all">
              Todas
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 w-5 rounded-full p-0 text-xs">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="compliance">Compliance</TabsTrigger>
            <TabsTrigger value="security">Segurança</TabsTrigger>
            <TabsTrigger value="audit">Auditoria</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[calc(100vh-180px)]">
            <TabsContent value="all" className="space-y-3 mt-0">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Bell className="w-12 h-12 mx-auto mb-2 opacity-20" />
                  <p>Nenhuma notificação</p>
                </div>
              ) : (
                notifications.map(renderNotification)
              )}
            </TabsContent>

            <TabsContent value="compliance" className="space-y-3 mt-0">
              {filterByCategory('compliance').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma notificação de compliance</p>
                </div>
              ) : (
                filterByCategory('compliance').map(renderNotification)
              )}
            </TabsContent>

            <TabsContent value="security" className="space-y-3 mt-0">
              {filterByCategory('security').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma notificação de segurança</p>
                </div>
              ) : (
                filterByCategory('security').map(renderNotification)
              )}
            </TabsContent>

            <TabsContent value="audit" className="space-y-3 mt-0">
              {filterByCategory('audit').length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Nenhuma notificação de auditoria</p>
                </div>
              ) : (
                filterByCategory('audit').map(renderNotification)
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};
