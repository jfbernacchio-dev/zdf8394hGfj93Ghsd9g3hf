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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Calendar, Users, MessageSquare, Bell, Lock, FileText, Clock, User, Settings, ChevronRight, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getSubordinateAutonomy, type AutonomyPermissions } from '@/lib/checkSubordinateAutonomy';
import Layout from '@/components/Layout';

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
  const [isUpdating, setIsUpdating] = useState(false);
  const [autonomySettings, setAutonomySettings] = useState<AutonomyPermissions | null>(null);
  const [managerHasCNPJ, setManagerHasCNPJ] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [generatedInvoiceText, setGeneratedInvoiceText] = useState("");
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [patientsWithUnpaid, setPatientsWithUnpaid] = useState<any[]>([]);
  const [unpaidSessionsCount, setUnpaidSessionsCount] = useState(0);
  const [totalUnpaidValue, setTotalUnpaidValue] = useState(0);
  const [confirmCascadeDialog, setConfirmCascadeDialog] = useState<{
    open: boolean;
    field: 'manages_own_patients' | 'has_financial_access';
    newValue: boolean;
  }>({
    open: false,
    field: 'manages_own_patients',
    newValue: false
  });

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadTherapistData();
    loadNotifications();
    loadPreferences();
    loadAutonomySettings();
    checkManagerCNPJ();
    loadFinancialData();
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

  const loadAutonomySettings = async () => {
    if (!id) return;
    const settings = await getSubordinateAutonomy(id);
    setAutonomySettings(settings);
  };

  const checkManagerCNPJ = async () => {
    if (!user?.id) return;
    
    const { data } = await supabase
      .from('nfse_config')
      .select('cnpj')
      .eq('user_id', user.id)
      .maybeSingle();
    
    setManagerHasCNPJ(!!data?.cnpj);
  };

  const loadFinancialData = async () => {
    if (!id) return;
    
    const { data: sessions } = await supabase
      .from('sessions')
      .select('*, patients!inner(id, name, user_id)')
      .eq('patients.user_id', id)
      .eq('paid', false)
      .eq('status', 'attended');
    
    if (sessions) {
      const byPatient = sessions.reduce((acc: any, session: any) => {
        const patientId = session.patients.id;
        if (!acc[patientId]) {
          acc[patientId] = {
            patient: session.patients,
            sessions: [],
            total: 0
          };
        }
        acc[patientId].sessions.push(session);
        acc[patientId].total += Number(session.value);
        return acc;
      }, {});
      
      setPatientsWithUnpaid(Object.values(byPatient));
      setUnpaidSessionsCount(sessions.length);
      setTotalUnpaidValue(sessions.reduce((sum: number, s: any) => sum + Number(s.value), 0));
    }
  };

  const handleGeneralInvoice = async () => {
    setIsGeneratingInvoice(true);
    setShowConfirmDialog(false);
    
    try {
      // 1. Buscar sessões não pagas do subordinado
      const { data: sessions, error: sessionsError } = await supabase
        .from('sessions')
        .select('*, patients!inner(id, name, user_id, no_nfse)')
        .eq('patients.user_id', id)
        .eq('paid', false)
        .eq('status', 'attended');
      
      if (sessionsError) throw sessionsError;
      if (!sessions || sessions.length === 0) {
        toast({ title: "Não há sessões não pagas para este subordinado", variant: 'destructive' });
        return;
      }
      
      // 2. Agrupar sessões por paciente
      const sessionsByPatient = sessions.reduce((acc: any, session: any) => {
        const patientId = session.patients.id;
        if (!acc[patientId]) {
          acc[patientId] = {
            patient: session.patients,
            sessions: []
          };
        }
        acc[patientId].sessions.push(session);
        return acc;
      }, {});
      
      let invoiceText = `FECHAMENTO GERAL - ${therapist?.full_name}\n`;
      invoiceText += `Data: ${format(new Date(), "dd/MM/yyyy", { locale: ptBR })}\n\n`;
      
      let totalValue = 0;
      let totalSessions = 0;
      const sessionIdsToMark: string[] = [];
      
      // 3. Processar cada paciente
      for (const [patientId, data] of Object.entries(sessionsByPatient)) {
        const { patient, sessions: patientSessions } = data as any;
        const patientValue = patientSessions.reduce((sum: number, s: any) => sum + Number(s.value), 0);
        totalValue += patientValue;
        totalSessions += patientSessions.length;
        
        if (patient.no_nfse) {
          // Paciente sem NFSe - adicionar ao texto
          invoiceText += `${patient.name}\n`;
          invoiceText += `${patientSessions.length} sessão(ões) - R$ ${patientValue.toFixed(2)}\n\n`;
          sessionIdsToMark.push(...patientSessions.map((s: any) => s.id));
        } else {
          // Paciente com NFSe - chamar edge function
          try {
            const { error: nfseError } = await supabase.functions.invoke('issue-nfse', {
              body: {
                patientId: patient.id,
                sessionIds: patientSessions.map((s: any) => s.id)
              }
            });
            
            if (nfseError) {
              invoiceText += `${patient.name} - ERRO na emissão de NFSe\n\n`;
            } else {
              invoiceText += `${patient.name} - NFSe emitida com sucesso\n`;
              invoiceText += `${patientSessions.length} sessão(ões) - R$ ${patientValue.toFixed(2)}\n\n`;
              sessionIdsToMark.push(...patientSessions.map((s: any) => s.id));
            }
          } catch (err) {
            invoiceText += `${patient.name} - ERRO na emissão de NFSe\n\n`;
          }
        }
      }
      
      invoiceText += `\n===================\n`;
      invoiceText += `TOTAL: ${totalSessions} sessões - R$ ${totalValue.toFixed(2)}`;
      
      // 4. Marcar sessões como pagas
      if (sessionIdsToMark.length > 0) {
        await supabase
          .from('sessions')
          .update({ paid: true })
          .in('id', sessionIdsToMark);
      }
      
      // 5. Inserir log
      await supabase.from('invoice_logs').insert({
        user_id: id,
        invoice_text: invoiceText,
        total_sessions: totalSessions,
        total_value: totalValue,
        patient_count: Object.keys(sessionsByPatient).length,
        session_ids: sessionIdsToMark
      });
      
      setGeneratedInvoiceText(invoiceText);
      setShowResultDialog(true);
      await loadFinancialData();
      
      toast({ title: "Fechamento geral realizado com sucesso!" });
      
    } catch (error) {
      console.error('Erro ao gerar fechamento:', error);
      toast({ title: "Erro ao gerar fechamento geral", variant: 'destructive' });
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const updateAutonomySetting = async (
    field: 'manages_own_patients' | 'has_financial_access' | 'nfse_emission_mode',
    value: boolean | string
  ) => {
    if (!id || !user) return;

    // VALIDAÇÃO DE CASCADE
    // Se está tentando desligar "manages_own_patients" E "has_financial_access" está ligado
    if (field === 'manages_own_patients' && value === false && autonomySettings?.hasFinancialAccess) {
      // Abrir dialog de confirmação em vez de executar diretamente
      setConfirmCascadeDialog({
        open: true,
        field: 'manages_own_patients',
        newValue: false
      });
      return; // PARAR AQUI - não executa o update
    }

    // Se não precisa de cascade, executar normalmente
    setIsUpdating(true);
    
    try {
      const { data: current } = await supabase
        .from('subordinate_autonomy_settings')
        .select('*')
        .eq('subordinate_id', id)
        .maybeSingle();

      const updatedSettings = {
        subordinate_id: id,
        manager_id: user.id,
        manages_own_patients: current?.manages_own_patients || false,
        has_financial_access: current?.has_financial_access || false,
        nfse_emission_mode: current?.nfse_emission_mode || 'own_company',
        [field]: value
      };

      const { error } = await supabase
        .from('subordinate_autonomy_settings')
        .upsert(updatedSettings, { onConflict: 'subordinate_id' });

      if (error) {
        toast({ title: 'Erro ao atualizar configuração', variant: 'destructive' });
        return;
      }

      toast({ title: 'Configuração atualizada!' });
      await loadAutonomySettings();
    } finally {
      setIsUpdating(false);
    }
  };

  const executeCascadeUpdate = async () => {
    if (!id || !user) return;

    // Fechar dialog
    setConfirmCascadeDialog({ 
      open: false, 
      field: 'manages_own_patients', 
      newValue: false 
    });

    // Executar TRÊS atualizações em sequência (TRIPLE CASCADE):
    // 1. Mudar nfse_emission_mode para 'own_company' (evita constraint violation)
    // 2. Desligar has_financial_access
    // 3. Desligar manages_own_patients

    setIsUpdating(true);

    try {
      const { data: current } = await supabase
        .from('subordinate_autonomy_settings')
        .select('*')
        .eq('subordinate_id', id)
        .maybeSingle();

      // Update 1: Mudar NFSe para 'own_company' (manter switches ligados)
      const step1 = {
        subordinate_id: id,
        manager_id: user.id,
        manages_own_patients: current?.manages_own_patients ?? true,
        has_financial_access: current?.has_financial_access ?? true,
        nfse_emission_mode: 'own_company' // MUDAR PARA OWN_COMPANY
      };

      const { error: error1 } = await supabase
        .from('subordinate_autonomy_settings')
        .upsert(step1, { onConflict: 'subordinate_id' });

      if (error1) throw error1;

      // Update 2: Desligar acesso financeiro
      const step2 = {
        ...step1,
        has_financial_access: false // DESLIGAR
      };

      const { error: error2 } = await supabase
        .from('subordinate_autonomy_settings')
        .upsert(step2, { onConflict: 'subordinate_id' });

      if (error2) throw error2;

      // Update 3: Desligar gerenciamento de pacientes
      const step3 = {
        ...step2,
        manages_own_patients: false // DESLIGAR
      };

      const { error: error3 } = await supabase
        .from('subordinate_autonomy_settings')
        .upsert(step3, { onConflict: 'subordinate_id' });

      if (error3) throw error3;

      toast({ 
        title: 'Configurações atualizadas!',
        description: 'Gerenciamento de pacientes e acesso financeiro foram desligados.'
      });
      await loadAutonomySettings();

    } catch (error) {
      console.error('Erro no cascade:', error);
      toast({ 
        title: 'Erro ao atualizar configurações', 
        variant: 'destructive' 
      });
      await loadAutonomySettings(); // Recarregar para reverter estado visual
    } finally {
      setIsUpdating(false);
    }
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
  if (loading) return <div className="container mx-auto p-6">Carregando...</div>;
  if (!therapist) return <div className="container mx-auto p-6">Terapeuta não encontrado</div>;

  return (
    <>
      {/* Dialog de Confirmação de Cascade */}
      <AlertDialog open={confirmCascadeDialog.open} onOpenChange={(open) => 
        setConfirmCascadeDialog({ ...confirmCascadeDialog, open })
      }>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Desligar gerenciamento de pacientes?</AlertDialogTitle>
            <AlertDialogDescription>
              Para desligar o gerenciamento de pacientes próprios, o acesso financeiro também será desligado automaticamente.
              <br /><br />
              <strong>Após essa ação:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Subordinado não gerenciará pacientes próprios</li>
                <li>Subordinado não terá acesso à tela financeira</li>
                <li>Você (Full) verá todos os pacientes e sessões do subordinado</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeCascadeUpdate}>
              Confirmar e desligar ambos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="autonomy">Autonomia</TabsTrigger>
            <TabsTrigger value="data">Dados</TabsTrigger>
            <TabsTrigger value="patients">Pacientes</TabsTrigger>
            {/* Aba Financeiro: visível apenas quando subordinado NÃO tem acesso financeiro */}
            {autonomySettings && !autonomySettings.hasFinancialAccess && (
              <TabsTrigger value="financial">Financeiro</TabsTrigger>
            )}
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

          <TabsContent value="data">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">Dados Cadastrais</h3>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Nome Completo</Label>
                    <p className="text-base font-semibold mt-1">{therapist.full_name}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">CPF</Label>
                    <p className="text-base font-semibold mt-1">{therapist.cpf}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">CRP</Label>
                    <p className="text-base font-semibold mt-1">{therapist.crp}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Data de Nascimento</Label>
                    <p className="text-base font-semibold mt-1">
                      {format(parseISO(therapist.birth_date), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Data de Cadastro</Label>
                    <p className="text-base font-semibold mt-1">
                      {format(parseISO(therapist.created_at), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Última Atualização</Label>
                    <p className="text-base font-semibold mt-1">
                      {format(parseISO(therapist.updated_at), "d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            <Card className="p-6 mt-4">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">Horários de Trabalho</h3>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Dias da Semana</Label>
                    <p className="text-base font-semibold mt-1">
                      {therapist.work_days?.map((day: number) => 
                        ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day]
                      ).join(', ') || 'Não configurado'}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Horário de Trabalho</Label>
                    <p className="text-base font-semibold mt-1">
                      {therapist.work_start_time || '08:00'} - {therapist.work_end_time || '18:00'}
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Duração da Sessão</Label>
                    <p className="text-base font-semibold mt-1">
                      {therapist.slot_duration || 60} minutos
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Tempo de Descanso</Label>
                    <p className="text-base font-semibold mt-1">
                      {therapist.break_time || 15} minutos
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Slots por Semana</Label>
                    <p className="text-base font-semibold mt-1">
                      {(() => {
                        const workDays = therapist.work_days?.length || 5;
                        const startTime = therapist.work_start_time || '08:00';
                        const endTime = therapist.work_end_time || '18:00';
                        const slotDuration = (therapist.slot_duration || 60) + (therapist.break_time || 15);
                        
                        const [startHour, startMin] = startTime.split(':').map(Number);
                        const [endHour, endMin] = endTime.split(':').map(Number);
                        const totalMinutes = (endHour * 60 + endMin) - (startHour * 60 + startMin);
                        const slotsPerDay = Math.floor(totalMinutes / slotDuration);
                        
                        return workDays * slotsPerDay;
                      })()}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="autonomy">
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Settings className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold">Configurações de Autonomia</h3>
              </div>

              {!autonomySettings ? (
                <p className="text-muted-foreground">Carregando configurações...</p>
              ) : (
                <div className="space-y-6">
                  {/* Indicador do Cenário Atual */}
                  <Alert>
                    <AlertDescription>
                      <strong>Cenário Atual:</strong> {
                        !autonomySettings.managesOwnPatients 
                          ? '1 - Autonomia Zero (Você vê tudo, incluindo dados clínicos)'
                          : autonomySettings.hasFinancialAccess
                            ? autonomySettings.nfseEmissionMode === 'manager_company'
                              ? '3A - Autonomia Total com CNPJ do Full (Sessões entram no seu fechamento)'
                              : '3 - Autonomia Total (Subordinado gerencia tudo sozinho)'
                            : '2 - Autonomia Parcial (Subordinado gerencia clínico, você gerencia financeiro)'
                      }
                    </AlertDescription>
                  </Alert>

                  {/* Switch 1: Gerencia Pacientes */}
                  <div className="space-y-3 p-4 border rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label className="text-base font-medium">Subordinado gerencia seus próprios pacientes?</Label>
                        <p className="text-sm text-muted-foreground">
                          {autonomySettings.managesOwnPatients 
                            ? 'Você vê apenas a lista básica (sem dados clínicos)'
                            : 'Você tem acesso total aos dados clínicos'}
                        </p>
                      </div>
                      <Switch
                        checked={autonomySettings.managesOwnPatients}
                        disabled={isUpdating}
                        onCheckedChange={(checked) => updateAutonomySetting('manages_own_patients', checked)}
                      />
                    </div>
                  </div>

                  {/* Switch 2: Acesso Financeiro (Cascata) */}
                  {autonomySettings.managesOwnPatients && (
                    <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between">
                        <div className="space-y-1">
                          <Label className="text-base font-medium">Subordinado faz o controle financeiro?</Label>
                          <p className="text-sm text-muted-foreground">
                            {autonomySettings.hasFinancialAccess
                              ? 'Subordinado tem acesso à aba Financial'
                              : 'Sessões entram no seu fechamento financeiro'}
                          </p>
                        </div>
                        <Switch
                          checked={autonomySettings.hasFinancialAccess}
                          disabled={isUpdating}
                          onCheckedChange={(checked) => updateAutonomySetting('has_financial_access', checked)}
                        />
                      </div>

                      {/* RadioGroup: Modo de Emissão (Cascata) */}
                      {autonomySettings.hasFinancialAccess && (
                        <div className="mt-4 space-y-3 pl-6 border-l-2">
                          <Label className="text-sm font-medium">Modo de Emissão de NFSe:</Label>
                          <RadioGroup
                            value={autonomySettings.nfseEmissionMode}
                            disabled={isUpdating}
                            onValueChange={(value) => updateAutonomySetting('nfse_emission_mode', value)}
                          >
                            <div className="flex items-start space-x-2">
                              <RadioGroupItem value="own_company" id="own_radio" />
                              <div className="space-y-1">
                                <Label htmlFor="own_radio" className="cursor-pointer font-normal">
                                  Empresa Própria
                                </Label>
                                <p className="text-xs text-muted-foreground">
                                  Subordinado usa seu próprio CNPJ para emitir NFSe
                                </p>
                              </div>
                            </div>

                            {managerHasCNPJ ? (
                              <div className="flex items-start space-x-2">
                                <RadioGroupItem value="manager_company" id="manager_radio" />
                                <div className="space-y-1">
                                  <Label htmlFor="manager_radio" className="cursor-pointer font-normal">
                                    Empresa do Full
                                  </Label>
                                  <p className="text-xs text-muted-foreground">
                                    Subordinado emite NFSe usando o CNPJ do Full (sessões entram no fechamento do Full)
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start space-x-2 opacity-50">
                                <RadioGroupItem value="manager_company" id="manager_radio" disabled />
                                <div className="space-y-1">
                                  <Label htmlFor="manager_radio" className="cursor-pointer font-normal">
                                    Empresa do Full (Indisponível)
                                  </Label>
                                  <p className="text-xs text-muted-foreground">
                                    Você precisa cadastrar seu CNPJ na configuração de NFSe
                                  </p>
                                </div>
                              </div>
                            )}
                          </RadioGroup>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="patients">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Pacientes do Terapeuta</h3>
              {patients.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum paciente cadastrado</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {patients.map(patient => (
                    <Card 
                      key={patient.id}
                      className="p-4 cursor-pointer hover:shadow-lg hover:border-primary/50 transition-all duration-200"
                      onClick={() => navigate(`/patients/${patient.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-base mb-1">{patient.name}</h4>
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={patient.status === 'active' ? 'default' : 'secondary'}>
                              {patient.status === 'active' ? 'Ativo' : 'Inativo'}
                            </Badge>
                            {autonomySettings.managesOwnPatients && (
                              <Badge variant="outline" className="text-xs">
                                <Lock className="w-3 h-3 mr-1" />
                                Gestão Autônoma
                              </Badge>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                      </div>
                      
                      <div className="space-y-1 text-sm text-muted-foreground">
                        {patient.session_day && patient.session_time && (
                          <p className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {patient.session_day} às {patient.session_time}
                          </p>
                        )}
                        {patient.email && (
                          <p className="truncate">{patient.email}</p>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Financial Tab - Apenas quando subordinado NÃO tem acesso financeiro */}
          {autonomySettings && !autonomySettings.hasFinancialAccess && (
            <TabsContent value="financial">
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <FileText className="h-6 w-6 text-primary" />
                    <div>
                      <h3 className="text-lg font-semibold">Controle Financeiro</h3>
                      <p className="text-sm text-muted-foreground">
                        Gerencie as finanças dos pacientes de {therapist?.full_name}
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={isGeneratingInvoice || unpaidSessionsCount === 0}
                    variant="outline"
                  >
                    {isGeneratingInvoice ? (
                      <>Processando...</>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Fazer Fechamento Geral
                      </>
                    )}
                  </Button>
                </div>

                {/* Resumo Financeiro */}
                <div className="grid gap-4 md:grid-cols-3 mb-6">
                  <Card className="p-4 bg-muted/30">
                    <p className="text-sm text-muted-foreground mb-1">Total de Pacientes</p>
                    <p className="text-2xl font-bold">{patients.length}</p>
                  </Card>
                  <Card className="p-4 bg-orange-500/10">
                    <p className="text-sm text-muted-foreground mb-1">Sessões Não Pagas</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {sessions.filter(s => s.status === 'attended' && !s.paid).length}
                    </p>
                  </Card>
                  <Card className="p-4 bg-green-500/10">
                    <p className="text-sm text-muted-foreground mb-1">Valor Total em Aberto</p>
                    <p className="text-2xl font-bold text-green-600">
                      R$ {sessions
                        .filter(s => s.status === 'attended' && !s.paid)
                        .reduce((sum, s) => sum + Number(s.value || 0), 0)
                        .toFixed(2)
                        .replace('.', ',')}
                    </p>
                  </Card>
                </div>

                <Alert className="mb-6">
                  <AlertDescription>
                    Como este subordinado <strong>não tem acesso financeiro próprio</strong>, 
                    todas as sessões dele aparecem automaticamente no seu <strong>Fechamento Geral</strong> 
                    na página Financeiro.
                  </AlertDescription>
                </Alert>

                {/* Lista de Pacientes com Saldo em Aberto */}
                <div>
                  <h4 className="font-semibold mb-3">Pacientes com Sessões Não Pagas</h4>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {patients.filter(patient => {
                        const unpaidSessions = sessions.filter(
                          s => s.patient_id === patient.id && 
                          s.status === 'attended' && 
                          !s.paid
                        );
                        return unpaidSessions.length > 0;
                      }).length === 0 ? (
                        <p className="text-center text-muted-foreground py-8">
                          Nenhum paciente com sessões pendentes
                        </p>
                      ) : (
                        patients
                          .filter(patient => {
                            const unpaidSessions = sessions.filter(
                              s => s.patient_id === patient.id && 
                              s.status === 'attended' && 
                              !s.paid
                            );
                            return unpaidSessions.length > 0;
                          })
                          .map(patient => {
                            const unpaidSessions = sessions.filter(
                              s => s.patient_id === patient.id && 
                              s.status === 'attended' && 
                              !s.paid
                            );
                            const totalValue = unpaidSessions.reduce(
                              (sum, s) => sum + Number(s.value || 0), 
                              0
                            );
                            
                            return (
                              <Card 
                                key={patient.id} 
                                className="p-4 hover:shadow-md transition-shadow cursor-pointer"
                                onClick={() => navigate(`/patients/${patient.id}`)}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h5 className="font-semibold mb-1">{patient.name}</h5>
                                    <p className="text-sm text-muted-foreground">
                                      {unpaidSessions.length} sessão(ões) não paga(s)
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-lg font-bold text-orange-600">
                                      R$ {totalValue.toFixed(2).replace('.', ',')}
                                    </p>
                                    <ChevronRight className="w-5 h-5 text-muted-foreground ml-auto" />
                                  </div>
                                </div>
                              </Card>
                            );
                          })
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </Card>
            </TabsContent>
          )}

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

      {/* Dialog de Confirmação */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Fechamento Geral</AlertDialogTitle>
            <AlertDialogDescription>
              Isso irá processar todas as {unpaidSessionsCount} sessões não pagas
              de {patientsWithUnpaid.length} paciente(s), emitindo NFSes quando aplicável
              e gerando um resumo completo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleGeneralInvoice}>
              Confirmar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de Resultado */}
      <AlertDialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Fechamento Concluído</AlertDialogTitle>
          </AlertDialogHeader>
          <Textarea
            value={generatedInvoiceText}
            readOnly
            className="min-h-[400px] font-mono text-sm"
          />
          <AlertDialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(generatedInvoiceText);
                toast({ title: "Texto copiado!" });
              }}
            >
              Copiar Texto
            </Button>
            <AlertDialogAction>Fechar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default TherapistDetail;
