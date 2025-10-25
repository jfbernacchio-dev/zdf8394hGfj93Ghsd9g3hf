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
import { Calendar as CalendarIcon, Plus, CheckCircle, XCircle, DollarSign, ArrowLeft } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, isBefore, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Schedule = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'day'>('month');
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
    if (user) {
      loadData();
      autoUpdateOldSessions();
    }
  }, [user, currentMonth]);

  const autoUpdateOldSessions = async () => {
    // Get all scheduled sessions with patient info
    const { data: scheduledSessions } = await supabase
      .from('sessions')
      .select('*, patients!inner(*)')
      .eq('patients.user_id', user!.id)
      .eq('status', 'scheduled');

    if (!scheduledSessions) return;

    const now = new Date();
    const sessionsToUpdate: string[] = [];

    // Check each session's date + time
    scheduledSessions.forEach(session => {
      const sessionDate = parseISO(session.date);
      const [hours, minutes] = (session.patients.session_time || '00:00').split(':').map(Number);
      sessionDate.setHours(hours, minutes, 0, 0);

      if (sessionDate < now) {
        sessionsToUpdate.push(session.id);
      }
    });

    // Update all sessions that have passed
    if (sessionsToUpdate.length > 0) {
      const { error } = await supabase
        .from('sessions')
        .update({ status: 'attended' })
        .in('id', sessionsToUpdate);

      if (error) console.error('Erro ao atualizar sessões:', error);
    }
  };

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
    const newStatus = session.status === 'scheduled' ? 'attended' : 
                     session.status === 'attended' ? 'missed' : 'scheduled';
    
    const { error } = await supabase
      .from('sessions')
      .update({ status: newStatus })
      .eq('id', session.id);

    if (!error) {
      // If marked as attended or missed, create next session
      if (newStatus === 'attended' || newStatus === 'missed') {
        const { getNextSessionDate } = await import('@/lib/sessionUtils');
        const patient = session.patients;
        const nextDate = getNextSessionDate(session.date, patient.session_day, patient.frequency);
        
        // Check if next session already exists
        const { data: existingSession } = await supabase
          .from('sessions')
          .select('id')
          .eq('patient_id', session.patient_id)
          .eq('date', nextDate)
          .maybeSingle();

        if (!existingSession) {
          await supabase.from('sessions').insert({
            patient_id: session.patient_id,
            date: nextDate,
            status: 'scheduled',
            value: patient.session_value,
            paid: false,
          });
        }
      }

      toast({ title: `Status alterado para ${newStatus === 'scheduled' ? 'Agendada' : newStatus === 'attended' ? 'Compareceu' : 'Não Compareceu'}` });
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
    return sessions.filter(session => isSameDay(parseISO(session.date), day));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attended': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'missed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
    }
  };

  const getDayView = () => {
    const daySessions = getSessionsForDay(selectedDate);
    const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 to 21:00

    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" onClick={() => setViewMode('month')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar ao mês
          </Button>
          <h2 className="text-xl font-semibold">
            {format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
          <Button onClick={() => openNewDialog(selectedDate)}>
            <Plus className="mr-2 h-4 w-4" /> Nova Sessão
          </Button>
        </div>

        <div className="space-y-2">
          {hours.map(hour => {
            const hourSessions = daySessions.filter(s => {
              const sessionHour = parseInt(s.patients?.session_time?.split(':')[0] || '0');
              return sessionHour === hour;
            });

            return (
              <div key={hour} className="flex gap-4 p-2 border-b">
                <div className="w-20 text-sm font-semibold text-muted-foreground">
                  {hour.toString().padStart(2, '0')}:00
                </div>
                <div className="flex-1 space-y-2">
                  {hourSessions.map(session => (
                    <div
                      key={session.id}
                      onClick={() => openEditDialog(session)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${getStatusColor(session.status)}`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold">{session.patients.name}</p>
                          <p className="text-xs">{session.patients.session_time}</p>
                        </div>
                        <div className="text-right">
                          {session.paid && <p className="text-xs">💰 Pago</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-soft)]">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-foreground">Agenda</h1>
          {viewMode === 'month' && (
            <Button onClick={() => openNewDialog(selectedDate)}>
              <Plus className="mr-2 h-4 w-4" /> Nova Sessão
            </Button>
          )}
        </div>

        {viewMode === 'month' ? (
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
            
            {/* Empty cells to align the 1st with the correct day of week */}
            {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[100px]" />
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
                    setViewMode('day');
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
        ) : getDayView()}

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
                    <SelectItem value="attended">Compareceu</SelectItem>
                    <SelectItem value="missed">Não Compareceu</SelectItem>
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
