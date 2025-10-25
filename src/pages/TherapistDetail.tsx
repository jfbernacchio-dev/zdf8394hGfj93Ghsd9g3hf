import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/Navbar';
import { ArrowLeft, Calendar, Users, MessageSquare, Bell, Lock, FileText, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

interface NotificationPreferences {
  patient_changes: boolean;
  session_changes: boolean;
  schedule_blocks: boolean;
  reschedules: boolean;
}

const TherapistDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  
  const [therapist, setTherapist] = useState<any>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [scheduleBlocks, setScheduleBlocks] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    patient_changes: true,
    session_changes: true,
    schedule_blocks: true,
    reschedules: true,
  });
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    loadTherapistData();
    loadNotifications();
    loadPreferences();
  }, [id, isAdmin, navigate]);

  const loadTherapistData = async () => {
    if (!id) return;

    try {
      // Get therapist profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      setTherapist(profile);

      // Get patients
      const { data: patientsData } = await supabase
        .from('patients')
        .select('*')
        .eq('user_id', id);

      setPatients(patientsData || []);

      // Get sessions
      const patientIds = patientsData?.map(p => p.id) || [];
      if (patientIds.length > 0) {
        const { data: sessionsData } = await supabase
          .from('sessions')
          .select('*, patients(*)')
          .in('patient_id', patientIds)
          .order('date', { ascending: false })
          .limit(50);

        setSessions(sessionsData || []);
      }

      // Get schedule blocks
      const { data: blocksData } = await supabase
        .from('schedule_blocks')
        .select('*')
        .eq('user_id', id);

      setScheduleBlocks(blocksData || []);
    } catch (error) {
      console.error('Error loading therapist data:', error);
      toast({ title: 'Erro ao carregar dados', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const loadNotifications = async () => {
    if (!id || !user) return;

    const { data } = await supabase
      .from('therapist_notifications')
      .select('*')
      .eq('therapist_id', id)
      .eq('admin_id', user.id)
      .order('created_at', { ascending: false });

    setNotifications(data || []);
  };

  const loadPreferences = async () => {
    if (!id || !user) return;

    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('admin_id', user.id)
      .eq('therapist_id', id)
      .single();

    if (data) {
      setPreferences({
        patient_changes: data.patient_changes,
        session_changes: data.session_changes,
        schedule_blocks: data.schedule_blocks,
        reschedules: data.reschedules,
      });
    }
  };

  const sendMessage = async () => {
    if (!messageText.trim() || !id || !user) return;

    const { error } = await supabase
      .from('therapist_notifications')
      .insert({
        therapist_id: id,
        admin_id: user.id,
        type: 'message',
        title: 'Nova mensagem do administrador',
        message: messageText,
      });

    if (error) {
      toast({ title: 'Erro ao enviar mensagem', variant: 'destructive' });
      return;
    }

    toast({ title: 'Mensagem enviada!' });
    setMessageText('');
    loadNotifications();
  };

  const updatePreferences = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!id || !user) return;

    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);

    const { error } = await supabase
      .from('notification_preferences')
      .upsert({
        admin_id: user.id,
        therapist_id: id,
        ...newPrefs,
      });

    if (error) {
      toast({ title: 'Erro ao atualizar preferências', variant: 'destructive' });
    }
  };

  const markAsRead = async (notificationId: string) => {
    await supabase
      .from('therapist_notifications')
      .update({ read: true })
      .eq('id', notificationId);

    loadNotifications();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="h-4 w-4" />;
      case 'patient_change': return <Users className="h-4 w-4" />;
      case 'session_change': return <Calendar className="h-4 w-4" />;
      case 'schedule_block_change': return <Lock className="h-4 w-4" />;
      case 'reschedule': return <Clock className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  if (!isAdmin) return null;
  if (loading) return <div className="min-h-screen bg-[var(--gradient-soft)]"><Navbar /><div className="container mx-auto p-6">Carregando...</div></div>;
  if (!therapist) return <div className="min-h-screen bg-[var(--gradient-soft)]"><Navbar /><div className="container mx-auto p-6">Terapeuta não encontrado</div></div>;

  return (
    <div className="min-h-screen bg-[var(--gradient-soft)]">
      <Navbar />
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/therapists')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{therapist.full_name}</h1>
            <p className="text-muted-foreground">CRP: {therapist.crp}</p>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="patients">Pacientes</TabsTrigger>
            <TabsTrigger value="sessions">Sessões</TabsTrigger>
            <TabsTrigger value="schedule">Agenda</TabsTrigger>
            <TabsTrigger value="journal">Journal</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="p-6">
                <Users className="h-8 w-8 mb-2 text-primary" />
                <p className="text-3xl font-bold">{patients.length}</p>
                <p className="text-sm text-muted-foreground">Pacientes</p>
              </Card>
              <Card className="p-6">
                <Calendar className="h-8 w-8 mb-2 text-blue-500" />
                <p className="text-3xl font-bold">{sessions.filter(s => s.status === 'scheduled').length}</p>
                <p className="text-sm text-muted-foreground">Agendadas</p>
              </Card>
              <Card className="p-6">
                <Lock className="h-8 w-8 mb-2 text-orange-500" />
                <p className="text-3xl font-bold">{scheduleBlocks.length}</p>
                <p className="text-sm text-muted-foreground">Bloqueios</p>
              </Card>
              <Card className="p-6">
                <Bell className="h-8 w-8 mb-2 text-destructive" />
                <p className="text-3xl font-bold">{notifications.filter(n => !n.read).length}</p>
                <p className="text-sm text-muted-foreground">Notificações</p>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patients">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Pacientes do Terapeuta</h3>
              <div className="space-y-2">
                {patients.length === 0 ? (
                  <p className="text-muted-foreground text-center py-8">Nenhum paciente cadastrado</p>
                ) : (
                  patients.map(patient => (
                    <div key={patient.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                      <div>
                        <p className="font-semibold">{patient.name}</p>
                        <p className="text-sm text-muted-foreground">{patient.email}</p>
                      </div>
                      <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                        {patient.status === 'active' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="sessions">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Sessões Recentes</h3>
              <ScrollArea className="h-[500px]">
                <div className="space-y-2">
                  {sessions.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">Nenhuma sessão encontrada</p>
                  ) : (
                    sessions.map(session => (
                      <div key={session.id} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-semibold">{session.patients.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {format(parseISO(session.date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            {session.time && ` às ${session.time}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            session.status === 'attended' ? 'default' :
                            session.status === 'missed' ? 'destructive' : 'secondary'
                          }>
                            {session.status === 'attended' ? 'Compareceu' :
                             session.status === 'missed' ? 'Faltou' : 'Agendada'}
                          </Badge>
                          {session.paid && <span className="text-green-600">💰</span>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          <TabsContent value="schedule">
            <iframe
              src={`/schedule?therapist=${id}&embed=true`}
              className="w-full h-[800px] border-0 rounded-lg"
              title="Agenda do Terapeuta"
            />
          </TabsContent>

          <TabsContent value="journal" className="space-y-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Preferências de Notificação</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Alterações de Pacientes</Label>
                    <p className="text-sm text-muted-foreground">Novos pacientes, edições, etc.</p>
                  </div>
                  <Switch
                    checked={preferences.patient_changes}
                    onCheckedChange={(checked) => updatePreferences('patient_changes', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Alterações de Sessões</Label>
                    <p className="text-sm text-muted-foreground">Status, pagamentos, etc.</p>
                  </div>
                  <Switch
                    checked={preferences.session_changes}
                    onCheckedChange={(checked) => updatePreferences('session_changes', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Bloqueios de Agenda</Label>
                    <p className="text-sm text-muted-foreground">Criação ou remoção de bloqueios</p>
                  </div>
                  <Switch
                    checked={preferences.schedule_blocks}
                    onCheckedChange={(checked) => updatePreferences('schedule_blocks', checked)}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Reagendamentos</Label>
                    <p className="text-sm text-muted-foreground">Mudanças de horário/dia</p>
                  </div>
                  <Switch
                    checked={preferences.reschedules}
                    onCheckedChange={(checked) => updatePreferences('reschedules', checked)}
                  />
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Journal de Atividades</h3>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Escreva uma mensagem..."
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    rows={3}
                  />
                </div>
                <Button onClick={sendMessage} className="w-full">
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Enviar Mensagem
                </Button>

                <div className="border-t pt-4">
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-3">
                      {notifications.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">Nenhuma notificação</p>
                      ) : (
                        notifications.map(notification => (
                          <div
                            key={notification.id}
                            className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                              notification.read ? 'bg-muted/30' : 'bg-primary/5 border-primary/30'
                            }`}
                            onClick={() => !notification.read && markAsRead(notification.id)}
                          >
                            <div className="flex items-start gap-3">
                              <div className="mt-1">{getNotificationIcon(notification.type)}</div>
                              <div className="flex-1">
                                <p className="font-semibold text-sm">{notification.title}</p>
                                <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                                <p className="text-xs text-muted-foreground mt-2">
                                  {format(parseISO(notification.created_at), "d 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                                </p>
                              </div>
                              {!notification.read && (
                                <Badge variant="default" className="text-xs">Nova</Badge>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default TherapistDetail;
