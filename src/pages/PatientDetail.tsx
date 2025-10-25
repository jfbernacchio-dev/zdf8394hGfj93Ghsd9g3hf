import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { ArrowLeft, Plus, Calendar, DollarSign, Edit, FileText } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';

const PatientDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [patient, setPatient] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [isInvoiceDialogOpen, setIsInvoiceDialogOpen] = useState(false);
  const [invoiceText, setInvoiceText] = useState('');
  const [invoiceSessions, setInvoiceSessions] = useState<any[]>([]);
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
  }, [id]);

  const loadData = async () => {
    const { data: patientData } = await supabase.from('patients').select('*').eq('id', id).single();
    const { data: sessionsData } = await supabase.from('sessions').select('*').eq('patient_id', id).order('date', { ascending: false });
    
    setPatient(patientData);
    setSessions(sessionsData || []);
  };

  const openNewSessionDialog = () => {
    setEditingSession(null);
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      status: 'attended',
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
      time: patient?.session_time || ''
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
      paid: formData.paid
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
    const unpaidSessions = sessions.filter(s => s.status === 'attended' && !s.paid);
    
    if (unpaidSessions.length === 0) {
      toast({ 
        title: 'Nenhuma sessão em aberto', 
        description: 'Não há sessões para fechamento.',
        variant: 'destructive' 
      });
      return;
    }

    setInvoiceSessions(unpaidSessions);
    
    const totalValue = unpaidSessions.reduce((sum, s) => sum + Number(s.value), 0);
    const sessionDates = unpaidSessions.map(s => format(parseISO(s.date), 'dd/MM/yyyy')).join(', ');
    
    const invoice = `RECIBO DE PRESTAÇÃO DE SERVIÇOS

Recebi de: ${patient.name}
CPF: ${patient.cpf}

Referente a: Serviços de Psicologia
Sessões realizadas nas datas: ${sessionDates}
Quantidade de sessões: ${unpaidSessions.length}

Valor unitário por sessão: R$ ${Number(patient.session_value).toFixed(2)}
Valor total: R$ ${totalValue.toFixed(2)}

Data de emissão: ${format(new Date(), 'dd/MM/yyyy')}

_____________________________
Assinatura do Profissional`;

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


  if (!patient) {
    return (
      <div className="min-h-screen bg-[var(--gradient-soft)]">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-muted-foreground">Paciente não encontrado</p>
        </div>
      </div>
    );
  }

  const totalSessions = sessions.length;
  const attendedSessions = sessions.filter(s => s.status === 'attended').length;
  const unpaidSessions = sessions.filter(s => s.status === 'attended' && !s.paid);
  const totalValue = sessions.filter(s => s.status === 'attended').reduce((sum, s) => sum + Number(s.value || 0), 0);

  return (
    <div className="min-h-screen bg-[var(--gradient-soft)]">
      <Navbar />
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
                <p className="text-muted-foreground">{patient.email}</p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(`/patients/${id}/edit`)}
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                <p className="text-xl font-semibold text-foreground">{attendedSessions}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5 text-success" />
              <div>
                <p className="text-sm text-muted-foreground">Sessões em Aberto</p>
                <p className="text-xl font-semibold text-foreground">{unpaidSessions.length}</p>
              </div>
            </div>
          </div>
        </Card>

        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-foreground">Histórico de Sessões</h2>
          <div className="flex gap-2">
            <Button onClick={generateInvoice} variant="outline">
              <FileText className="w-4 h-4 mr-2" />
              Fazer Fechamento
            </Button>
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
                    <p className="font-semibold">R$ {Number(session.value).toFixed(2)}</p>
                    {session.paid ? (
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
    </div>
  );
};

export default PatientDetail;
