// ============================================================================
// TherapistDetail.tsx - Detalhes e Gestão de Terapeuta Subordinado
// ============================================================================
// 
// SPRINT 7.3 - FUTURO: Layouts Customizáveis
// TODO: Adicionar PermissionAwareSection e cards customizáveis
// TODO: Permitir que Full personalize visualização do dashboard do subordinado
// TODO: Integrar com sistema de templates de layout
//
// Por enquanto, mantém funcionalidades existentes que incluem:
// - Visualização de perfil e dados do terapeuta
// - Configurações de autonomia (manages_own_patients, has_financial_access)
// - Gestão de pacientes do subordinado
// - Controle financeiro (se includeInFullFinancial = true)
// - Agenda e bloqueios
// - Sistema de notificações
// ============================================================================

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
import { ArrowLeft, Calendar, Users, MessageSquare, Bell, Lock, FileText, Clock, User, ChevronRight, DollarSign, Shield, Network } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Layout from '@/components/Layout';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [managerHasCNPJ, setManagerHasCNPJ] = useState(false);
  
  // FASE 2C: Estados copiados de Patients.tsx
  const [isGeneralInvoiceOpen, setIsGeneralInvoiceOpen] = useState(false);
  const [generalInvoiceText, setGeneralInvoiceText] = useState('');
  const [affectedSessions, setAffectedSessions] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  
  const [unpaidSessionsCount, setUnpaidSessionsCount] = useState(0);
  const [totalUnpaidValue, setTotalUnpaidValue] = useState(0);

  // FASE 8.5.4: Estados para contexto organizacional
  const [orgInfo, setOrgInfo] = useState<{
    role: string | null;
    levelName: string | null;
    levelNumber: number | null;
    positionName: string | null;
  } | null>(null);
  const [orgLoading, setOrgLoading] = useState(true);
  const [orgError, setOrgError] = useState<string | null>(null);

  useEffect(() => {
    loadTherapistData();
    loadNotifications();
    loadPreferences();
    checkManagerCNPJ();
    loadFinancialData();
    loadManagerProfile(); // FASE 2C: Carregar perfil do manager
    loadOrgContext(); // FASE 8.5.4: Carregar contexto organizacional
  }, [id, isAdmin, navigate]);

  const loadManagerProfile = async () => {
    if (!user) return;
    const { data: profileData } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    setUserProfile(profileData);
  };

  // FASE 8.5.4: Carregar contexto organizacional do membro
  const loadOrgContext = async () => {
    if (!id) return;
    
    setOrgLoading(true);
    setOrgError(null);
    
    try {
      // 1. Buscar role do usuário
      const { data: roleRow, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', id)
        .maybeSingle();

      if (roleError) {
        throw new Error('Erro ao buscar role');
      }

      // 2. Buscar posição do usuário
      const { data: positionRow, error: userPosError } = await supabase
        .from('user_positions')
        .select('position_id')
        .eq('user_id', id)
        .maybeSingle();

      if (userPosError) {
        throw new Error('Erro ao buscar posição do usuário');
      }

      let orgPos = null;
      let level = null;

      // 3. Se tiver position_id, buscar em organization_positions
      if (positionRow?.position_id) {
        const { data: orgPosData, error: orgPosError } = await supabase
          .from('organization_positions')
          .select('id, position_name, level_id')
          .eq('id', positionRow.position_id)
          .maybeSingle();

        if (orgPosError) {
          throw new Error('Erro ao buscar cargo organizacional');
        }

        orgPos = orgPosData;

        // 4. Se tiver level_id, buscar em organization_levels
        if (orgPos?.level_id) {
          const { data: levelData, error: levelError } = await supabase
            .from('organization_levels')
            .select('id, level_name, level_number')
            .eq('id', orgPos.level_id)
            .maybeSingle();

          if (levelError) {
            throw new Error('Erro ao buscar nível organizacional');
          }

          level = levelData;
        }
      }

      // 5. Preencher estado
      setOrgInfo({
        role: roleRow?.role || null,
        levelName: level?.level_name || null,
        levelNumber: level?.level_number ?? null,
        positionName: orgPos?.position_name || null,
      });

    } catch (error: any) {
      console.error('Error loading org context:', error);
      setOrgError(error.message || 'Erro ao carregar contexto organizacional');
    } finally {
      setOrgLoading(false);
    }
  };

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
      setUnpaidSessionsCount(sessions.length);
      setTotalUnpaidValue(sessions.reduce((sum: number, s: any) => sum + Number(s.value), 0));
    }
  };

  // FASE 2C: Função copiada LITERALMENTE de Patients.tsx
  const generateGeneralInvoice = async () => {
    const { data: allUnpaidSessions, error: sessionsError } = await supabase
      .from('sessions')
      .select('*')
      .eq('status', 'attended')
      .eq('paid', false);

    if (sessionsError) {
      toast({ title: 'Erro ao carregar sessões', variant: 'destructive' });
      return;
    }

    // Filter sessions for this subordinate only
    const filteredSessions = (allUnpaidSessions || []).filter((s: any) => {
      const patient = patients.find(p => p.id === s.patient_id);
      return patient !== undefined;
    });
    
    if (filteredSessions.length === 0) {
      toast({ 
        title: 'Nenhuma sessão em aberto', 
        description: 'Não há sessões para fechamento geral.',
        variant: 'destructive' 
      });
      return;
    }

    // Group sessions by patient
    const sessionsByPatient: Record<string, any[]> = filteredSessions.reduce((acc, session) => {
      if (!acc[session.patient_id]) {
        acc[session.patient_id] = [];
      }
      acc[session.patient_id].push(session);
      return acc;
    }, {} as Record<string, any[]>);

    // Filter patients by eligibility for NFSe
    const eligiblePatients: any[] = [];
    const textOnlyPatients: any[] = [];

    Object.keys(sessionsByPatient).forEach(patientId => {
      const patient = patients.find(p => p.id === patientId);
      if (patient) {
        if (patient.no_nfse) {
          textOnlyPatients.push({ patient, sessions: sessionsByPatient[patientId] });
        } else {
          eligiblePatients.push({ patient, sessions: sessionsByPatient[patientId] });
        }
      }
    });

    // If no eligible patients for NFSe, show text for all patients
    if (eligiblePatients.length === 0) {
      setAffectedSessions(filteredSessions);
      generateInvoiceText(sessionsByPatient);
      return;
    }

    // Show confirmation dialog for NFSe issuance
    const confirmMessage = `Serão emitidas notas fiscais para ${eligiblePatients.length} paciente(s). ${textOnlyPatients.length > 0 ? `${textOnlyPatients.length} paciente(s) serão excluídos (mensais ou sem emissão de nota).` : ''}\n\nDeseja continuar?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    // Issue NFSe for eligible patients
    toast({
      title: 'Emitindo notas fiscais',
      description: `Iniciando emissão de ${eligiblePatients.length} nota(s)...`,
    });

    let successCount = 0;
    let errorCount = 0;

    for (const { patient, sessions: patientSessions } of eligiblePatients) {
      try {
        const sessionIds = patientSessions.map(s => s.id);
        
        const { error } = await supabase.functions.invoke('issue-nfse', {
          body: {
            patientId: patient.id,
            sessionIds,
          },
        });

        if (error) {
          console.error(`Error issuing NFSe for ${patient.name}:`, error);
          errorCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        console.error(`Error issuing NFSe for ${patient.name}:`, error);
        errorCount++;
      }
    }

    toast({
      title: 'Emissão concluída',
      description: `${successCount} nota(s) emitida(s) com sucesso. ${errorCount > 0 ? `${errorCount} erro(s).` : ''}`,
    });

    // After NFSe issuance, if there are text-only patients, show their invoice
    if (textOnlyPatients.length > 0) {
      const textOnlySessions = textOnlyPatients.flatMap(p => p.sessions);
      const textOnlySessionsByPatient = textOnlyPatients.reduce((acc, { patient, sessions: patientSessions }) => {
        acc[patient.id] = patientSessions;
        return acc;
      }, {} as Record<string, any[]>);
      
      setAffectedSessions(textOnlySessions);
      generateInvoiceText(textOnlySessionsByPatient);
    }

    loadFinancialData();
  };

  // FASE 2C: Função copiada LITERALMENTE de Patients.tsx
  const generateInvoiceText = (sessionsByPatient: Record<string, any[]>) => {
    let invoiceText = `FECHAMENTO GERAL DE SESSÕES\n\n`;
    invoiceText += `${'='.repeat(60)}\n\n`;
    let grandTotal = 0;

    Object.entries(sessionsByPatient).forEach(([patientId, patientSessions]) => {
      const patient = patients.find(p => p.id === patientId);
      if (!patient) return;

      const sessionDates = patientSessions.map(s => format(parseISO(s.date), 'dd/MM/yyyy')).join(' ; ');
      
      let totalValue: number;
      let valueDescription: string;
      
      if (patient.monthly_price) {
        // For monthly pricing, calculate by number of months
        const sessionsByMonth = patientSessions.reduce((acc, session) => {
          const monthYear = format(parseISO(session.date), 'MM/yyyy');
          if (!acc[monthYear]) {
            acc[monthYear] = [];
          }
          acc[monthYear].push(session);
          return acc;
        }, {} as Record<string, any[]>);
        
        const monthsCount = Object.keys(sessionsByMonth).length;
        totalValue = monthsCount * Number(patient.session_value);
        valueDescription = `Valor mensal: ${formatBrazilianCurrency(patient.session_value)}\nNúmero de meses: ${monthsCount}`;
      } else {
        // For per-session pricing
        totalValue = patientSessions.reduce((sum, s) => sum + Number(s.value), 0);
        valueDescription = `Valor unitário por sessão: ${formatBrazilianCurrency(patient.session_value)}`;
      }
      
      grandTotal += totalValue;

      invoiceText += `PACIENTE: ${patient.name}\n`;
      invoiceText += `CPF: ${patient.cpf}\n\n`;
      invoiceText += `Profissional: ${userProfile?.full_name || ''}\n`;
      invoiceText += `CPF: ${userProfile?.cpf || ''}\n`;
      invoiceText += `CRP: ${userProfile?.crp || ''}\n\n`;
      invoiceText += `Sessões realizadas nas datas: ${sessionDates}\n`;
      invoiceText += `Quantidade de sessões: ${patientSessions.length}\n`;
      invoiceText += `${valueDescription}\n`;
      invoiceText += `Valor total: ${formatBrazilianCurrency(totalValue)}\n\n`;
      invoiceText += `_____________________________\n`;
      invoiceText += `Assinatura do Profissional\n\n`;
      invoiceText += `${'='.repeat(60)}\n\n`;
    });

    invoiceText += `TOTAL GERAL: ${formatBrazilianCurrency(grandTotal)}\n`;
    invoiceText += `Total de pacientes: ${Object.keys(sessionsByPatient).length}\n`;
    invoiceText += `Total de sessões: ${affectedSessions.length}\n`;

    setGeneralInvoiceText(invoiceText);
    setIsGeneralInvoiceOpen(true);
  };

  // FASE 2C: Função copiada LITERALMENTE de Patients.tsx
  const markAllSessionsAsPaid = async () => {
    const sessionIds = affectedSessions.map(s => s.id);
    const totalValue = affectedSessions.reduce((sum, s) => sum + Number(s.value), 0);
    
    // Save invoice log (MUDANÇA: usar id do subordinado em vez de user.id)
    const { error: logError } = await supabase
      .from('invoice_logs')
      .insert({
        user_id: id!, // ✅ ÚNICA MUDANÇA: id do subordinado
        invoice_text: generalInvoiceText,
        session_ids: sessionIds,
        patient_count: new Set(affectedSessions.map(s => s.patient_id)).size,
        total_sessions: sessionIds.length,
        total_value: totalValue
      });

    if (logError) {
      console.error('Error saving invoice log:', logError);
      toast({ title: 'Erro ao salvar log', variant: 'destructive' });
      return;
    }
    
    const { error } = await supabase
      .from('sessions')
      .update({ paid: true })
      .in('id', sessionIds);

    if (error) {
      toast({ title: 'Erro ao atualizar sessões', variant: 'destructive' });
      return;
    }

    toast({ 
      title: 'Sessões atualizadas!', 
      description: `${sessionIds.length} sessão(ões) marcada(s) como paga(s). Log salvo com sucesso.` 
    });
    
    setIsGeneralInvoiceOpen(false);
    loadFinancialData();
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

  // Permissão controlada por PermissionRoute no App.tsx
  if (loading) return <div className="container mx-auto p-6">Carregando...</div>;
  if (!therapist) return <div className="container mx-auto p-6">Terapeuta não encontrado</div>;

  return (
    <>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/team-management')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{therapist.full_name}</h1>
            <p className="text-muted-foreground">CRP: {therapist.crp}</p>
          </div>
        </div>

        {/* FASE 8.5.6: Aviso para admin sobre novo sistema */}
        {isAdmin && (
          <div className="rounded-md border border-dashed border-yellow-300 bg-yellow-50 px-3 py-2 text-xs text-yellow-800">
            As permissões deste membro agora são configuradas pelo organograma e pelo modal{" "}
            <span className="font-semibold">"Gerenciar Permissões"</span> no nível correspondente.
            <button
              type="button"
              onClick={() => navigate("/org-management")}
              className="ml-2 text-xs font-medium text-primary underline underline-offset-2"
            >
              Abrir organograma
            </button>
          </div>
        )}

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="data">Dados</TabsTrigger>
            <TabsTrigger value="patients">Pacientes</TabsTrigger>
            <TabsTrigger value="sessions">Sessões</TabsTrigger>
            <TabsTrigger value="schedule">Agenda</TabsTrigger>
            <TabsTrigger value="journal">Journal</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            {/* FASE 8.5.4: Card de Contexto Organizacional */}
            <div className="grid gap-4 md:grid-cols-4 mb-4">
              <Card className="md:col-span-4 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-6 w-6 text-primary" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Contexto Organizacional
                    </p>
                    {orgLoading ? (
                      <p className="text-sm text-muted-foreground">Carregando...</p>
                    ) : orgError ? (
                      <p className="text-sm text-destructive">{orgError}</p>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Role:</span>{' '}
                          {orgInfo?.role ? orgInfo.role : 'Não definido'}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Nível:</span>{' '}
                          {orgInfo?.levelNumber != null
                            ? `Nível ${orgInfo.levelNumber} — ${orgInfo.levelName ?? 'Sem nome'}`
                            : 'Não vinculado a nenhum nível'}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Cargo:</span>{' '}
                          {orgInfo?.positionName ?? 'Sem cargo definido'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Network className="h-4 w-4" />
                  <span>Dados sincronizados com o organograma</span>
                </div>
              </Card>
            </div>

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

      {/* FASE 2C: Dialog copiado LITERALMENTE de Patients.tsx */}
      <Dialog open={isGeneralInvoiceOpen} onOpenChange={setIsGeneralInvoiceOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Fechamento Geral de Sessões</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={generalInvoiceText}
              readOnly
              rows={20}
              className="font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button onClick={markAllSessionsAsPaid} className="flex-1">
                Dar Baixa em Todas as Sessões
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  navigator.clipboard.writeText(generalInvoiceText);
                  toast({ title: 'Texto copiado!' });
                }}
                className="flex-1"
              >
                Copiar Texto
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TherapistDetail;
