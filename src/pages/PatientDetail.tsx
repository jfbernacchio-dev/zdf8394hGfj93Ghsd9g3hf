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
import { ArrowLeft, Plus, Calendar, DollarSign, Edit, FileText, Download, Trash2, Shield } from 'lucide-react';

import { useToast } from '@/hooks/use-toast';
import { format, parseISO, startOfMonth, endOfMonth, isFuture } from 'date-fns';
import { PatientFiles } from '@/components/PatientFiles';

const PatientDetail = () => {
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
  const [period, setPeriod] = useState('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showScheduled, setShowScheduled] = useState(false);
  const [showUnpaid, setShowUnpaid] = useState(false);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'attended',
    notes: '',
    value: '',
    paid: false,
    time: ''
  });

  useEffect(() => {
    loadData();
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

    // Log admin access to patient data
    await logAdminAccess('view_patient', undefined, id, 'Admin viewed patient details and sessions');
  };

  const filterSessions = () => {
    if (!allSessions.length) return;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Aplicar filtro de período
    let filtered = allSessions;

    if (period !== 'all') {
      let start: Date, end: Date;

      if (period === 'custom') {
        if (!customStartDate || !customEndDate) return;
        start = new Date(customStartDate);
        end = new Date(customEndDate);
      } else if (period === 'lastMonth') {
        // Último Mês: dia 01 ao 31 do mês anterior
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth(), 0);
      } else if (period === 'last2Months') {
        // Últimos 2 Meses: do dia 01 do mês anterior até o dia 31 do mês atual
        start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      } else {
        // Este Mês
        start = startOfMonth(now);
        end = endOfMonth(now);
      }

      filtered = allSessions.filter(session => {
        const date = parseISO(session.date);
        return date >= start && date <= end;
      });
    }

    // Aplicar filtro "Mostrar A Pagar"
    if (showUnpaid) {
      filtered = filtered.filter(session => session.status === 'attended' && !session.paid);
    }

    // Se "Mostrar Agendadas" está ativo, adicionar agendadas futuras (aditivo)
    if (showScheduled) {
      const scheduled = allSessions.filter(session => {
        const sessionDate = parseISO(session.date);
        return sessionDate > now && session.status === 'scheduled';
      });
      
      // Combinar sessões do período com agendadas futuras (remover duplicatas)
      const sessionIds = new Set(filtered.map(s => s.id));
      const additionalScheduled = scheduled.filter(s => !sessionIds.has(s.id));
      filtered = [...filtered, ...additionalScheduled];
    }

    // Ordenar por data decrescente (mais recentes/futuras no topo)
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
      date: format(new Date(), 'yyyy-MM-dd'),
      status: 'scheduled',
      notes: '',
      value: patient?.session_value?.toString() || '',
      paid: false,
      time: patient?.session_time || ''
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
      time: session.time || patient?.session_time || ''
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
      time: formData.time || null
    };

    if (editingSession) {
      const { error } = await supabase
        .from('sessions')
        .update(sessionData)
        .eq('id', editingSession.id);

      if (error) {
        toast({ title: 'Erro ao atualizar sessão', variant: 'destructive' });
        return;
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
    // Prevent marking future sessions as attended
    const { isBefore } = await import('date-fns');
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
    
    // If marked as attended or missed, ensure 4 future sessions exist
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
      // Agrupar sessões por mês
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

Valor mensal: R$ ${Number(patient.session_value).toFixed(2)}
Valor total: R$ ${totalValue.toFixed(2)}

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

Valor unitário por sessão: R$ ${Number(patient.session_value).toFixed(2)}
Valor total: R$ ${totalValue.toFixed(2)}

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
      // Log admin access
      await logAdminAccess('export_patient_data', undefined, id, 'Admin exported patient data (LGPD compliance)');

      const { data, error } = await supabase.functions.invoke('export-patient-data', {
        body: { patientId: id }
      });

      if (error) throw error;

      if (data.success) {
        // Create downloadable JSON
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
      // Log admin access before deletion
      await logAdminAccess('delete_patient', undefined, id, `Admin permanently deleted patient: ${patient.name}`);

      // Delete all related data first (sessions, files, etc.)
      await supabase.from('sessions').delete().eq('patient_id', id);
      await supabase.from('session_history').delete().eq('patient_id', id);
      await supabase.from('patient_files').delete().eq('patient_id', id);
      await supabase.from('nfse_issued').delete().eq('patient_id', id);

      // Finally delete the patient
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
  const futureSessions = sessions.filter(s => isFuture(parseISO(s.date)));
  const unpaidSessions = sessions.filter(s => s.status === 'attended' && !s.paid);
  const totalValue = sessions.filter(s => s.status === 'attended').reduce((sum, s) => sum + Number(s.value || 0), 0);

  return (
    <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/patients')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>

        <Card className="p-8 mb-6 shadow-[var(--shadow-card)] border-border">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-semibold text-2xl">
                {patient.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{patient.name}</h1>
                <p className="text-muted-foreground">{patient.email || 'Email não informado'}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/patients/${id}/edit`)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPatientData}
                title="Exportar dados do paciente (LGPD)"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Dados
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeletePatient}
                title="Excluir permanentemente todos os dados (LGPD)"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir Definitivamente
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Sessões</p>
                <p className="text-xl font-semibold text-foreground">{totalSessions}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-accent" />
              <div>
                <p className="text-sm text-muted-foreground">Sessões Comparecidas</p>
                <p className="text-xl font-semibold text-foreground">{attendedSessions} <span className="text-sm text-muted-foreground">({attendedPercentage}%)</span></p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Sessões Agendadas</p>
                <p className="text-xl font-semibold text-foreground">{futureSessions.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-success" />
              <div className="flex-1">
                <p className="text-sm text-muted-foreground">
                  {patient.monthly_price ? 'Meses em Aberto' : 'Sessões em Aberto'}
                </p>
                <p className="text-xl font-semibold text-foreground">
                  {patient.monthly_price ? (() => {
                    // Group unpaid sessions by month for monthly pricing
                    const sessionsByMonth = unpaidSessions.reduce((acc, session) => {
                      const monthYear = format(parseISO(session.date), 'MM/yyyy');
                      if (!acc[monthYear]) {
                        acc[monthYear] = [];
                      }
                      acc[monthYear].push(session);
                      return acc;
                    }, {} as Record<string, any[]>);
                    const monthsCount = Object.keys(sessionsByMonth).length;
                    const totalValue = monthsCount * Number(patient.session_value);
                    return (
                      <>
                        {monthsCount}
                        {' '}
                        <span className="text-sm text-muted-foreground">
                          (R$ {totalValue.toFixed(2)} - {unpaidSessions.length} {unpaidSessions.length === 1 ? 'sessão' : 'sessões'})
                        </span>
                      </>
                    );
                  })() : (() => {
                    const totalValue = unpaidSessions.reduce((sum, s) => sum + Number(s.value || 0), 0);
                    return (
                      <>
                        {unpaidSessions.length}
                        {' '}
                        <span className="text-sm text-muted-foreground">
                          (R$ {totalValue.toFixed(2)})
                        </span>
                      </>
                    );
                  })()}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Tabs defaultValue="sessions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sessions">Sessões</TabsTrigger>
            <TabsTrigger value="files">Arquivos</TabsTrigger>
            <TabsTrigger value="info">Informações</TabsTrigger>
          </TabsList>

          <TabsContent value="sessions" className="space-y-4 mt-4">
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
              <div className="flex gap-2">
                {(patient.no_nfse || patient.monthly_price || !patient.cpf) ? (
                  <Button onClick={generateInvoice} variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Gerar Texto Simples
                  </Button>
                ) : (
                  <Button onClick={generateInvoice} variant="outline">
                    <FileText className="w-4 h-4 mr-2" />
                    Fazer Fechamento
                  </Button>
                )}
                <Button onClick={openNewSessionDialog}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nova Sessão
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              {sessions.map(session => (
                <Card key={session.id} className="p-4">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-semibold">{format(parseISO(session.date), 'dd/MM/yyyy')}</p>
                      <p className={`text-sm ${
                        session.status === 'attended' ? 'text-green-600 dark:text-green-400' :
                        session.status === 'missed' ? 'text-red-600 dark:text-red-400' :
                        'text-blue-600 dark:text-blue-400'
                      }`}>
                        {session.status === 'attended' ? 'Compareceu' : 
                         session.status === 'missed' ? 'Não Compareceu' : 'Agendada'}
                      </p>
                      {session.notes && <p className="text-sm mt-1 text-muted-foreground">{session.notes}</p>}
                    </div>
                      <div className="flex items-center gap-4">
                       <div className="text-right">
                         {patient.monthly_price ? (
                           <p className="font-semibold">Valor Mensal (R$ {Number(patient.session_value).toFixed(2)})</p>
                         ) : (
                           <p className="font-semibold">R$ {Number(session.value).toFixed(2)}</p>
                         )}
                         {session.status === 'missed' ? (
                           <p className="text-xs text-muted-foreground">Sem Cobrança</p>
                         ) : session.paid ? (
                           <p className="text-xs text-green-600 dark:text-green-400">Pago</p>
                         ) : (
                           <p className="text-xs text-orange-600 dark:text-orange-400">A pagar</p>
                         )}
                       </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`status-${session.id}`} className="text-sm cursor-pointer">
                          {session.status === 'attended' ? 'Compareceu' : 'Faltou'}
                        </Label>
                        <Switch
                          id={`status-${session.id}`}
                          checked={session.status === 'attended'}
                          onCheckedChange={(checked) => toggleStatus(session, checked)}
                        />
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(session)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}

              {sessions.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Nenhuma sessão registrada</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="files" className="mt-4">
            <PatientFiles patientId={id!} />
          </TabsContent>

          <TabsContent value="info" className="mt-4">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Informações do Paciente</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nome Completo</p>
                  <p className="font-medium">{patient.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{patient.email || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{patient.phone || 'Não informado'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">CPF</p>
                  <p className="font-medium">{patient.cpf}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                  <p className="font-medium">{patient.birth_date ? format(parseISO(patient.birth_date), 'dd/MM/yyyy') : 'Não informada'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Frequência</p>
                  <p className="font-medium">{patient.frequency === 'weekly' ? 'Semanal' : 'Quinzenal'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dia da Sessão</p>
                  <p className="font-medium">{patient.session_day || 'Não definido'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Horário da Sessão</p>
                  <p className="font-medium">{patient.session_time || 'Não definido'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{patient.monthly_price ? 'Valor Mensal' : 'Valor da Sessão'}</p>
                  <p className="font-medium">R$ {Number(patient.session_value).toFixed(2)}</p>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingSession ? 'Editar Sessão' : 'Nova Sessão'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Data</Label>
                <Input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                />
              </div>

              <div>
                <Label>Valor (R$)</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  required
                />
              </div>

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="paid"
                  checked={formData.paid}
                  onChange={(e) => setFormData({ ...formData, paid: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="paid">Pago</Label>
              </div>

              {editingSession && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={() => deleteSession(editingSession.id)} 
                  className="w-full"
                >
                  Excluir Sessão
                </Button>
              )}

              <Button type="submit" className="w-full">
                {editingSession ? 'Atualizar' : 'Criar'} Sessão
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isInvoiceDialogOpen} onOpenChange={setIsInvoiceDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Fechamento de Sessões</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Textarea
                value={invoiceText}
                readOnly
                rows={15}
                className="font-mono text-sm"
              />
              <div className="flex gap-2">
                <Button onClick={markSessionsAsPaid} className="flex-1">
                  Dar Baixa nas Sessões
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    navigator.clipboard.writeText(invoiceText);
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
      </div>
    );
};

export default PatientDetail;
