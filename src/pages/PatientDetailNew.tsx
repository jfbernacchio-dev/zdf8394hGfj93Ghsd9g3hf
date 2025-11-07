import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { logAdminAccess } from '@/lib/auditLog';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, Plus, Calendar, DollarSign, Edit, FileText, Download, Trash2, Phone, MapPin, Mail, User, Clock, Tag } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';

import { useToast } from '@/hooks/use-toast';
import { format, parseISO, startOfMonth, endOfMonth, isFuture } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { CalendarIcon } from 'lucide-react';
import { PatientFiles } from '@/components/PatientFiles';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';
import IssueNFSeDialog from '@/components/IssueNFSeDialog';
import { ConsentReminder } from '@/components/ConsentReminder';

const PatientDetailNew = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [patient, setPatient] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [invoiceText, setInvoiceText] = useState('');
  const [invoiceSessions, setInvoiceSessions] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [period, setPeriod] = useState('last2Months');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showScheduled, setShowScheduled] = useState(false);
  const [showUnpaid, setShowUnpaid] = useState(false);
  
  const getBrazilDate = () => {
    return new Date().toLocaleString('en-CA', { 
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).split(',')[0];
  };

  const [formData, setFormData] = useState({
    date: getBrazilDate(),
    status: 'attended',
    notes: '',
    value: '',
    paid: false,
    time: '',
    showInSchedule: true
  });

  useEffect(() => {
    loadData();
    
    const channel = supabase
      .channel('patient-sessions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sessions',
          filter: `patient_id=eq.${id}`
        },
        () => {
          loadData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [id, user]);

  useEffect(() => {
    filterSessions();
  }, [period, customStartDate, customEndDate, allSessions, showScheduled, showUnpaid]);

  const loadData = async () => {
    const { data: patientData } = await supabase.from('patients').select('*').eq('id', id).single();
    const { data: sessionsData } = await supabase.from('sessions').select('*').eq('patient_id', id).order('date', { ascending: false });
    
    if (user) {
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
      setUserProfile(profileData);
    }
    
    setPatient(patientData);
    setAllSessions(sessionsData || []);

    await logAdminAccess('view_patient', undefined, id, 'Admin viewed patient details (NEW UI)');
  };

  const filterSessions = () => {
    if (!allSessions.length) return;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let filtered = allSessions;

    if (period !== 'all') {
      let start: Date, end: Date;

      if (period === 'custom') {
        if (!customStartDate || !customEndDate) return;
        start = new Date(customStartDate);
        end = new Date(customEndDate);
      } else if (period === 'lastMonth') {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
      } else if (period === 'last2Months') {
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else {
        start = startOfMonth(now);
        end = endOfMonth(now);
      }

      filtered = allSessions.filter(session => {
        const date = parseISO(session.date);
        return date >= start && date <= end;
      });
    }

    if (showUnpaid) {
      filtered = filtered.filter(session => session.status === 'attended' && !session.paid);
    }

    if (showScheduled) {
      const scheduled = allSessions.filter(session => {
        const sessionDate = parseISO(session.date);
        return sessionDate > now && session.status === 'scheduled';
      });
      
      const sessionIds = new Set(filtered.map(s => s.id));
      const additionalScheduled = scheduled.filter(s => !sessionIds.has(s.id));
      filtered = [...filtered, ...additionalScheduled];
    }

    filtered.sort((a, b) => {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      return dateB.getTime() - dateA.getTime();
    });

    setSessions(filtered);
  };

  const openNewSessionDialog = () => {
    setEditingSession(null);
    setFormData({
      date: getBrazilDate(),
      status: 'scheduled',
      notes: '',
      value: patient?.session_value?.toString() || '',
      paid: false,
      time: patient?.session_time || '',
      showInSchedule: true
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (session: any) => {
    setEditingSession(session);
    setFormData({
      date: session.date,
      status: session.status,
      notes: session.notes || '',
      value: session.value.toString(),
      paid: session.paid,
      time: session.time || patient?.session_time || '',
      showInSchedule: session.show_in_schedule ?? true
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sessionData = {
      patient_id: id,
      date: formData.date,
      status: formData.status,
      notes: formData.notes,
      value: parseFloat(formData.value),
      paid: formData.paid,
      time: formData.time || null,
      show_in_schedule: formData.showInSchedule
    };

    if (editingSession) {
      const dateChanged = editingSession.date !== formData.date;
      const timeChanged = editingSession.time !== formData.time;

      const today = getBrazilDate();
      if (formData.date > today) {
        sessionData.status = 'scheduled';
      }

      const { error } = await supabase
        .from('sessions')
        .update(sessionData)
        .eq('id', editingSession.id);

      if (error) {
        toast({ title: 'Erro ao atualizar sessão', variant: 'destructive' });
        return;
      }

      if (dateChanged || timeChanged) {
        const dayNames = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        
        const oldDate = new Date(editingSession.date);
        const newDate = new Date(formData.date);
        
        const oldDay = dayNames[oldDate.getDay()];
        const newDay = dayNames[newDate.getDay()];
        
        await supabase
          .from('session_history')
          .insert({
            patient_id: id,
            old_day: oldDay,
            old_time: editingSession.time || '-',
            new_day: newDay,
            new_time: formData.time || '-'
          });
      }

      toast({ title: 'Sessão atualizada!' });
    } else {
      const { error } = await supabase
        .from('sessions')
        .insert([sessionData]);

      if (error) {
        toast({ title: 'Erro ao criar sessão', variant: 'destructive' });
        return;
      }
      toast({ title: 'Sessão criada!' });
    }

    setIsDialogOpen(false);
    loadData();
  };

  const toggleStatus = async (session: any, checked: boolean) => {
    const { isBefore } = await import('date-fns');
    
    if (session.status === 'scheduled') {
      const newStatus = checked ? 'scheduled' : 'unscheduled';
      
      const { error } = await supabase
        .from('sessions')
        .update({ 
          status: newStatus,
          show_in_schedule: checked
        })
        .eq('id', session.id);

      if (error) {
        console.error('Error updating session status:', error);
        toast({ 
          title: 'Erro ao atualizar status', 
          description: error.message,
          variant: 'destructive' 
        });
        return;
      }
      
      toast({ title: checked ? 'Sessão reagendada' : 'Sessão desmarcada' });
      await loadData();
      return;
    }

    if (session.status === 'unscheduled') {
      if (checked) {
        const { error } = await supabase
          .from('sessions')
          .update({ 
            status: 'scheduled',
            show_in_schedule: true
          })
          .eq('id', session.id);

        if (error) {
          console.error('Error updating session status:', error);
          toast({ 
            title: 'Erro ao atualizar status', 
            description: error.message,
            variant: 'destructive' 
          });
          return;
        }
        
        toast({ title: 'Sessão reagendada' });
        await loadData();
      }
      return;
    }

    if (checked && isBefore(new Date(), parseISO(session.date))) {
      toast({ 
        title: 'Não é possível marcar como compareceu', 
        description: 'Sessões futuras não podem ser marcadas como comparecidas.',
        variant: 'destructive' 
      });
      return;
    }

    const newStatus = checked ? 'attended' : 'missed';
    
    const { error } = await supabase
      .from('sessions')
      .update({ status: newStatus })
      .eq('id', session.id);

    if (error) {
      console.error('Error updating session status:', error);
      toast({ 
        title: 'Erro ao atualizar status', 
        description: error.message,
        variant: 'destructive' 
      });
      return;
    }
    
    if (newStatus === 'attended' || newStatus === 'missed') {
      const { ensureFutureSessions } = await import('@/lib/sessionUtils');
      await ensureFutureSessions(session.patient_id, patient!, supabase, 4);
    }
    
    toast({ title: `Status alterado para ${newStatus === 'attended' ? 'Compareceu' : 'Não Compareceu'}` });
    await loadData();
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Tem certeza que deseja excluir esta sessão?')) return;
    
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId);

    if (error) {
      toast({ title: 'Erro ao excluir sessão', variant: 'destructive' });
      return;
    }

    toast({ title: 'Sessão excluída com sucesso!' });
    setIsDialogOpen(false);
    loadData();
  };

  const generateInvoice = () => {
    const unpaidSessions = allSessions.filter(s => s.status === 'attended' && !s.paid);
    
    if (unpaidSessions.length === 0) {
      toast({ 
        title: 'Nenhuma sessão em aberto', 
        description: 'Não há sessões para fechamento.',
        variant: 'destructive' 
      });
      return;
    }

    setInvoiceSessions(unpaidSessions);
    
    let invoice = '';
    let totalValue = 0;

    if (patient.monthly_price) {
      const sessionsByMonth = unpaidSessions.reduce((acc, session) => {
        const monthYear = format(parseISO(session.date), 'MM/yyyy');
        if (!acc[monthYear]) {
          acc[monthYear] = [];
        }
        acc[monthYear].push(session);
        return acc;
      }, {} as Record<string, any[]>);

      const months = Object.keys(sessionsByMonth).sort();
      totalValue = months.length * Number(patient.session_value);
      
      const monthsDescription = months.map(monthYear => {
        const [month, year] = monthYear.split('/');
        const sessionCount = sessionsByMonth[monthYear].length;
        return `${month}/${year} (${sessionCount} sessão${sessionCount > 1 ? 'ões' : ''})`;
      }).join(', ');

      invoice = `RECIBO DE PRESTAÇÃO DE SERVIÇOS

Profissional: ${userProfile?.full_name || ''}
CPF: ${userProfile?.cpf || ''}
CRP: ${userProfile?.crp || ''}

Recebi de: ${patient.name}
CPF: ${patient.cpf || 'Não informado'}

Referente a: Serviços de Psicologia
Modalidade: Preço Mensal
Meses: ${monthsDescription}
Quantidade de meses: ${months.length}

Valor mensal: ${formatBrazilianCurrency(patient.session_value)}
Valor total: ${formatBrazilianCurrency(totalValue)}

Data de emissão: ${format(new Date(), 'dd/MM/yyyy')}

_____________________________
Assinatura do Profissional`;
    } else {
      totalValue = unpaidSessions.reduce((sum, s) => sum + Number(s.value), 0);
      const sessionDates = unpaidSessions.map(s => format(parseISO(s.date), 'dd/MM/yyyy')).join(', ');
      
      invoice = `RECIBO DE PRESTAÇÃO DE SERVIÇOS

Profissional: ${userProfile?.full_name || ''}
CPF: ${userProfile?.cpf || ''}
CRP: ${userProfile?.crp || ''}

Recebi de: ${patient.name}
CPF: ${patient.cpf || 'Não informado'}

Referente a: Serviços de Psicologia
Sessões realizadas nas datas: ${sessionDates}
Quantidade de sessões: ${unpaidSessions.length}

Valor unitário por sessão: ${formatBrazilianCurrency(patient.session_value)}
Valor total: ${formatBrazilianCurrency(totalValue)}

Data de emissão: ${format(new Date(), 'dd/MM/yyyy')}

_____________________________
Assinatura do Profissional`;
    }

    setInvoiceText(invoice);
    setIsInvoiceDialogOpen(true);
  };

  const markSessionsAsPaid = async () => {
    const sessionIds = invoiceSessions.map(s => s.id);
    
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
      description: `${sessionIds.length} sessão(ões) marcada(s) como paga(s).` 
    });
    
    setIsInvoiceDialogOpen(false);
    loadData();
  };

  const handleExportPatientData = async () => {
    try {
      await logAdminAccess('export_patient_data', undefined, id, 'Admin exported patient data (LGPD compliance)');

      const { data, error } = await supabase.functions.invoke('export-patient-data', {
        body: { patientId: id }
      });

      if (error) throw error;

      if (data.success) {
        const dataStr = JSON.stringify(data.data, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `paciente_${patient.name.replace(/\s/g, '_')}_${format(new Date(), 'yyyy-MM-dd')}.json`;
        link.click();

        toast({
          title: 'Dados exportados',
          description: 'Os dados do paciente foram exportados com sucesso.',
        });
      }
    } catch (error: any) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Erro ao exportar',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const handleDeletePatient = async () => {
    const confirmation = prompt(
      `Esta ação é IRREVERSÍVEL e apagará TODOS os dados do paciente.\n\nDigite "${patient.name}" para confirmar:`
    );

    if (confirmation !== patient.name) {
      if (confirmation !== null) {
        toast({
          title: 'Exclusão cancelada',
          description: 'O nome digitado não confere.',
          variant: 'destructive',
        });
      }
      return;
    }

    try {
      await logAdminAccess('delete_patient', undefined, id, `Admin permanently deleted patient: ${patient.name}`);

      const { data: conversations } = await supabase
        .from('whatsapp_conversations')
        .select('id')
        .eq('patient_id', id);

      if (conversations && conversations.length > 0) {
        const conversationIds = conversations.map(c => c.id);
        await supabase
          .from('whatsapp_messages')
          .delete()
          .in('conversation_id', conversationIds);
      }

      await supabase.from('sessions').delete().eq('patient_id', id);
      await supabase.from('session_history').delete().eq('patient_id', id);
      await supabase.from('patient_files').delete().eq('patient_id', id);
      await supabase.from('nfse_issued').delete().eq('patient_id', id);
      await supabase.from('consent_submissions').delete().eq('patient_id', id);
      await supabase.from('whatsapp_conversations').delete().eq('patient_id', id);

      const { error } = await supabase
        .from('patients')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Paciente excluído',
        description: 'Todos os dados foram permanentemente removidos.',
      });

      navigate('/patients');
    } catch (error: any) {
      console.error('Error deleting patient:', error);
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  if (!patient) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-muted-foreground">Paciente não encontrado</p>
      </div>
    );
  }

  const now = new Date();
  const pastSessions = sessions.filter(s => !isFuture(parseISO(s.date)));
  const totalSessions = pastSessions.length;
  const attendedSessions = pastSessions.filter(s => s.status === 'attended').length;
  const attendedPercentage = totalSessions > 0 ? ((attendedSessions / totalSessions) * 100).toFixed(1) : '0';
  const futureSessions = sessions.filter(s => isFuture(parseISO(s.date)) && s.status === 'scheduled');
  const nextSession = futureSessions.length > 0 ? futureSessions[futureSessions.length - 1] : null;
  const unpaidSessions = sessions.filter(s => s.status === 'attended' && !s.paid);
  const recentSessions = sessions.filter(s => s.notes).slice(0, 5);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/patients')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar
              </Button>
              <Separator orientation="vertical" className="h-6" />
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-semibold text-lg">
                    {patient.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl font-bold text-foreground">{patient.name}</h1>
                    {patient.status === 'inactive' && (
                      <Badge variant="destructive" className="text-xs">Ficha Encerrada</Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{patient.email || 'Email não informado'}</p>
                </div>
              </div>
            </div>
            <Button
              onClick={() => navigate(`/patients/${id}/edit`)}
              variant="outline"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-6">
        <div className="mb-6">
          <ConsentReminder patientId={id} />
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="appointments">Appointments</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Main Info */}
              <div className="lg:col-span-2 space-y-6">
                {/* Next Appointment */}
                {nextSession && (
                  <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">Próximo Agendamento</p>
                        <div className="flex items-center gap-2 mb-1">
                          <Calendar className="w-5 h-5 text-primary" />
                          <p className="text-2xl font-bold text-foreground">
                            {format(parseISO(nextSession.date), "EEE, dd 'de' MMM", { locale: ptBR })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <p className="text-lg">{nextSession.time || 'Horário não definido'}</p>
                        </div>
                      </div>
                      <Badge variant="secondary" className="bg-primary/10 text-primary">Agendada</Badge>
                    </div>
                  </Card>
                )}

                {/* Clinical Information */}
                <Card className="p-6">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-primary" />
                    Informação Clínica
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">Profissional</span>
                      <span className="font-medium">{userProfile?.full_name || 'Não definido'}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">Valor da Sessão</span>
                      <span className="font-medium">{formatBrazilianCurrency(patient.session_value)}</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b">
                      <span className="text-muted-foreground">Modalidade</span>
                      <Badge variant="outline">{patient.monthly_price ? 'Mensal' : 'Por Sessão'}</Badge>
                    </div>
                    <div className="flex items-center justify-between py-2">
                      <span className="text-muted-foreground">Horário Padrão</span>
                      <span className="font-medium">{patient.session_time || 'Não definido'}</span>
                    </div>
                  </div>
                </Card>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <Card className="p-4">
                    <div className="flex flex-col">
                      <p className="text-sm text-muted-foreground mb-1">Total</p>
                      <p className="text-3xl font-bold text-foreground">{totalSessions}</p>
                      <p className="text-xs text-muted-foreground mt-1">sessões</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex flex-col">
                      <p className="text-sm text-muted-foreground mb-1">Comparecidas</p>
                      <p className="text-3xl font-bold text-accent">{attendedSessions}</p>
                      <p className="text-xs text-muted-foreground mt-1">{attendedPercentage}%</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex flex-col">
                      <p className="text-sm text-muted-foreground mb-1">Agendadas</p>
                      <p className="text-3xl font-bold text-blue-500">{futureSessions.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">futuras</p>
                    </div>
                  </Card>
                  <Card className="p-4">
                    <div className="flex flex-col">
                      <p className="text-sm text-muted-foreground mb-1">A Pagar</p>
                      <p className="text-3xl font-bold text-orange-500">{unpaidSessions.length}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {patient.monthly_price ? 'meses' : 'sessões'}
                      </p>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Right Column - Sidebar */}
              <div className="space-y-6">
                {/* Contact Info */}
                <Card className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Contact Info</h3>
                  <div className="space-y-4">
                    {patient.phone && (
                      <div className="flex items-start gap-3">
                        <Phone className="w-4 h-4 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-sm text-muted-foreground">Telefone</p>
                          <p className="font-medium">{patient.phone}</p>
                        </div>
                      </div>
                    )}
                    {patient.email && (
                      <div className="flex items-start gap-3">
                        <Mail className="w-4 h-4 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium text-sm">{patient.email}</p>
                        </div>
                      </div>
                    )}
                    {patient.address && (
                      <div className="flex items-start gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-sm text-muted-foreground">Endereço</p>
                          <p className="font-medium text-sm">{patient.address}</p>
                        </div>
                      </div>
                    )}
                    {patient.cpf && (
                      <div className="flex items-start gap-3">
                        <User className="w-4 h-4 text-muted-foreground mt-1" />
                        <div>
                          <p className="text-sm text-muted-foreground">CPF</p>
                          <p className="font-medium">{patient.cpf}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                {/* Notes History */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-lg">History</h3>
                    <Button onClick={openNewSessionDialog} size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      New Note
                    </Button>
                  </div>
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-3">
                      {recentSessions.length > 0 ? (
                        recentSessions.map((session) => (
                          <div 
                            key={session.id}
                            className="p-3 rounded-lg border bg-card hover:bg-accent/5 transition-colors cursor-pointer"
                            onClick={() => openEditDialog(session)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <p className="font-medium text-sm">
                                  {session.notes.substring(0, 30)}
                                  {session.notes.length > 30 ? '...' : ''}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {format(parseISO(session.date), "dd 'de' MMM, yyyy", { locale: ptBR })}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Nenhuma nota registrada ainda
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-4">
            <Card className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select value={period} onValueChange={setPeriod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="month">Este Mês</SelectItem>
                      <SelectItem value="lastMonth">Último Mês</SelectItem>
                      <SelectItem value="last2Months">Últimos 2 Meses</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                      <SelectItem value="all">Todo Período</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {period === 'custom' ? (
                  <>
                    <div className="space-y-2">
                      <Label>Data Inicial</Label>
                      <Input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Final</Label>
                      <Input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label>Filtros</Label>
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox 
                          id="showScheduled" 
                          checked={showScheduled} 
                          onCheckedChange={(checked) => {
                            setShowScheduled(!!checked);
                            if (checked) setShowUnpaid(false);
                          }}
                        />
                        <label
                          htmlFor="showScheduled"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          Mostrar Agendadas
                        </label>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="invisible">Filtros</Label>
                      <div className="flex items-center space-x-2 pt-2">
                        <Checkbox 
                          id="showUnpaid" 
                          checked={showUnpaid} 
                          onCheckedChange={(checked) => {
                            setShowUnpaid(!!checked);
                            if (checked) setShowScheduled(false);
                          }}
                        />
                        <label
                          htmlFor="showUnpaid"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                        >
                          Mostrar A Pagar
                        </label>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </Card>

            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-foreground">Histórico de Sessões</h2>
              <Button onClick={openNewSessionDialog}>
                <Plus className="w-4 h-4 mr-2" />
                Nova Sessão
              </Button>
            </div>

            <div className="space-y-3">
              {sessions.map(session => (
                <Card key={session.id} className="p-4 hover:bg-accent/5 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-lg">{format(parseISO(session.date), 'dd/MM/yyyy')}</p>
                        <Badge 
                          variant={
                            session.status === 'attended' ? 'default' :
                            session.status === 'missed' ? 'destructive' :
                            session.status === 'unscheduled' ? 'secondary' :
                            'outline'
                          }
                          className="text-xs"
                        >
                          {session.status === 'attended' ? 'Compareceu' : 
                           session.status === 'missed' ? 'Não Compareceu' :
                           session.status === 'unscheduled' ? 'Desmarcada' : 'Agendada'}
                        </Badge>
                        {!session.show_in_schedule && (
                          <Badge variant="outline" className="text-xs">
                            Oculta da agenda
                          </Badge>
                        )}
                      </div>
                      {session.notes && (
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {session.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="font-semibold">
                          {patient.monthly_price ? 
                            `Valor Mensal (${formatBrazilianCurrency(patient.session_value)})` : 
                            formatBrazilianCurrency(session.value)
                          }
                        </p>
                        {session.status === 'missed' ? (
                          <p className="text-xs text-muted-foreground">Sem Cobrança</p>
                        ) : session.paid ? (
                          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-600 border-green-500/20">Pago</Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-orange-500/10 text-orange-600 border-orange-500/20">A pagar</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          id={`status-${session.id}`}
                          checked={session.status === 'attended' || session.status === 'scheduled'}
                          onCheckedChange={(checked) => toggleStatus(session, checked)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(session)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Faturamento</h2>
              {patient.no_nfse ? (
                <Button onClick={generateInvoice} variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Fazer Fechamento
                </Button>
              ) : (
                <IssueNFSeDialog 
                  patientId={id!} 
                  patientName={patient.name}
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Sessões em Aberto</p>
                <p className="text-3xl font-bold">{unpaidSessions.length}</p>
              </Card>
              <Card className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Valor Total em Aberto</p>
                <p className="text-3xl font-bold">
                  {formatBrazilianCurrency(
                    patient.monthly_price ? 
                      unpaidSessions.reduce((acc, session) => {
                        const monthYear = format(parseISO(session.date), 'MM/yyyy');
                        return acc;
                      }, 0) * Number(patient.session_value) :
                      unpaidSessions.reduce((sum, s) => sum + Number(s.value || 0), 0)
                  )}
                </p>
              </Card>
              <Card className="p-6">
                <p className="text-sm text-muted-foreground mb-2">Total Faturado</p>
                <p className="text-3xl font-bold">
                  {formatBrazilianCurrency(
                    sessions.filter(s => s.paid).reduce((sum, s) => sum + Number(s.value || 0), 0)
                  )}
                </p>
              </Card>
            </div>

            <Card className="p-6">
              <h3 className="font-semibold mb-4">Sessões Não Pagas</h3>
              <div className="space-y-2">
                {unpaidSessions.length > 0 ? (
                  unpaidSessions.map(session => (
                    <div key={session.id} className="flex justify-between items-center py-3 border-b last:border-0">
                      <div>
                        <p className="font-medium">{format(parseISO(session.date), 'dd/MM/yyyy')}</p>
                        <p className="text-sm text-muted-foreground">
                          {session.time || 'Horário não definido'}
                        </p>
                      </div>
                      <p className="font-semibold">{formatBrazilianCurrency(session.value)}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    Não há sessões pendentes de pagamento
                  </p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files">
            <PatientFiles patientId={id!} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Session Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingSession ? 'Editar Sessão' : 'Nova Sessão'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Data</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Agendada</SelectItem>
                  <SelectItem value="attended">Compareceu</SelectItem>
                  <SelectItem value="missed">Não Compareceu</SelectItem>
                  <SelectItem value="unscheduled">Desmarcada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notas da Sessão</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Registre observações sobre a sessão..."
                rows={6}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Valor</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required
                />
              </div>
              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  id="paid"
                  checked={formData.paid}
                  onCheckedChange={(checked) => setFormData({ ...formData, paid: checked })}
                />
                <Label htmlFor="paid">Sessão Paga</Label>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="showInSchedule"
                checked={formData.showInSchedule}
                onCheckedChange={(checked) => setFormData({ ...formData, showInSchedule: checked })}
              />
              <Label htmlFor="showInSchedule">Mostrar na Agenda</Label>
            </div>

            <div className="flex justify-between pt-4">
              <div>
                {editingSession && (
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => deleteSession(editingSession.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingSession ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Invoice Dialog */}
      <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fechamento de Sessões</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={invoiceText}
              readOnly
              rows={20}
              className="font-mono text-sm"
            />
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(invoiceText);
                  toast({ title: 'Copiado para área de transferência!' });
                }}
              >
                Copiar Texto
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsInvoiceDialogOpen(false)}>
                  Fechar
                </Button>
                <Button onClick={markSessionsAsPaid}>
                  Marcar como Pagas
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PatientDetailNew;
