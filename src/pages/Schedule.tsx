import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Plus, CheckCircle, XCircle, DollarSign } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Schedule = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    patient_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'scheduled',
    notes: '',
    value: '',
    paid: false
  });

  useEffect(() => {
    if (user) loadData();
  }, [user, currentMonth]);

  const loadData = async () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);

    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('*, patients!inner(*)')
      .eq('patients.user_id', user!.id)
      .gte('date', format(start, 'yyyy-MM-dd'))
      .lte('date', format(end, 'yyyy-MM-dd'))
      .order('date', { ascending: true });

    const { data: patientsData } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', user!.id)
      .eq('status', 'active');

    setSessions(sessionsData || []);
    setPatients(patientsData || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sessionData = {
      patient_id: formData.patient_id,
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
      toast({ title: 'Sessão atualizada com sucesso!' });
    } else {
      const { error } = await supabase
        .from('sessions')
        .insert([sessionData]);

      if (error) {
        toast({ title: 'Erro ao criar sessão', variant: 'destructive' });
        return;
      }
      toast({ title: 'Sessão criada com sucesso!' });
    }

    setIsDialogOpen(false);
    setEditingSession(null);
    setFormData({
      patient_id: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      status: 'scheduled',
      notes: '',
      value: '',
      paid: false
    });
    loadData();
  };

  const openEditDialog = (session: any) => {
    setEditingSession(session);
    setFormData({
      patient_id: session.patient_id,
      date: session.date,
      status: session.status,
      notes: session.notes || '',
      value: session.value.toString(),
      paid: session.paid
    });
    setIsDialogOpen(true);
  };

  const openNewDialog = (date: Date) => {
    setEditingSession(null);
    setFormData({
      patient_id: '',
      date: format(date, 'yyyy-MM-dd'),
      status: 'scheduled',
      notes: '',
      value: '',
      paid: false
    });
    setIsDialogOpen(true);
  };

  const toggleStatus = async (session: any) => {
    const newStatus = session.status === 'scheduled' ? 'completed' : 
                     session.status === 'completed' ? 'cancelled' : 'scheduled';
    
    const { error } = await supabase
      .from('sessions')
      .update({ status: newStatus })
      .eq('id', session.id);

    if (!error) {
      toast({ title: `Status alterado para ${newStatus === 'scheduled' ? 'Agendada' : newStatus === 'completed' ? 'Realizada' : 'Cancelada'}` });
      loadData();
    }
  };

  const togglePaid = async (session: any) => {
    const { error } = await supabase
      .from('sessions')
      .update({ paid: !session.paid })
      .eq('id', session.id);

    if (!error) {
      toast({ title: session.paid ? 'Marcado como não pago' : 'Marcado como pago' });
      loadData();
    }
  };

  const getDaysInMonth = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  };

  const getSessionsForDay = (day: Date) => {
    return sessions.filter(session => isSameDay(new Date(session.date), day));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-soft)]">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
          <Button onClick={() => openNewDialog(selectedDate)}>
            <Plus className="mr-2 h-4 w-4" /> Nova Sessão
          </Button>
        </div>

        <Card className="p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <Button variant="outline" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
              ← Anterior
            </Button>
            <h2 className="text-xl font-semibold">
              {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
            </h2>
            <Button variant="outline" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
              Próximo →
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-2">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="text-center font-semibold text-sm p-2">{day}</div>
            ))}
            
            {getDaysInMonth().map((day, index) => {
              const daySessions = getSessionsForDay(day);
              const isToday = isSameDay(day, new Date());
              
              return (
                <div
                  key={index}
                  className={`min-h-[100px] p-2 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors ${
                    isToday ? 'border-primary bg-primary/5' : ''
                  }`}
                  onClick={() => {
                    setSelectedDate(day);
                    if (daySessions.length === 0) openNewDialog(day);
                  }}
                >
                  <div className="font-semibold text-sm mb-1">{format(day, 'd')}</div>
                  <div className="space-y-1">
                    {daySessions.map(session => (
                      <div
                        key={session.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditDialog(session);
                        }}
                        className={`text-xs p-1 rounded ${getStatusColor(session.status)}`}
                      >
                        {session.patients.name}
                        {session.paid && ' 💰'}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingSession ? 'Editar Sessão' : 'Nova Sessão'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Paciente</Label>
                <Select value={formData.patient_id} onValueChange={(value) => {
                  setFormData({ ...formData, patient_id: value });
                  const patient = patients.find(p => p.id === value);
                  if (patient) setFormData({ ...formData, patient_id: value, value: patient.session_value.toString() });
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o paciente" />
                  </SelectTrigger>
                  <SelectContent>
                    {patients.map(patient => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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
                <Label>Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Agendada</SelectItem>
                    <SelectItem value="completed">Realizada</SelectItem>
                    <SelectItem value="cancelled">Cancelada</SelectItem>
                  </SelectContent>
                </Select>
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

              <div>
                <Label>Observações</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                />
              </div>

              {editingSession && (
                <div className="flex gap-2 pt-4 border-t">
                  <Button type="button" variant="outline" onClick={() => toggleStatus(editingSession)} className="flex-1">
                    {editingSession.status === 'scheduled' ? <CheckCircle className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
                    Alterar Status
                  </Button>
                  <Button type="button" variant="outline" onClick={() => togglePaid(editingSession)} className="flex-1">
                    <DollarSign className="mr-2 h-4 w-4" />
                    {editingSession.paid ? 'Marcar não pago' : 'Marcar pago'}
                  </Button>
                </div>
              )}

              <Button type="submit" className="w-full">
                {editingSession ? 'Atualizar' : 'Criar'} Sessão
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default Schedule;
