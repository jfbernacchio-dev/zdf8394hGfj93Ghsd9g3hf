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
import { Badge } from '@/components/ui/badge';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon, Plus, CheckCircle, XCircle, DollarSign, ArrowLeft, Lock } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, addDays, isBefore, parseISO, getDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const Schedule = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'day' | 'week'>('month');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [scheduleBlocks, setScheduleBlocks] = useState<any[]>([]);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const { toast } = useToast();

  const [blockForm, setBlockForm] = useState({
    day_of_week: '1',
    start_time: '12:00',
    end_time: '13:00',
    reason: '',
    replicate_weeks: 1
  });

  const [formData, setFormData] = useState({
    patient_id: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    status: 'scheduled',
    notes: '',
    value: '',
    paid: false,
    time: ''
  });

  useEffect(() => {
    if (user) {
      loadData();
      loadScheduleBlocks();
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

  const loadScheduleBlocks = async () => {
    const { data } = await supabase
      .from('schedule_blocks')
      .select('*')
      .eq('user_id', user!.id);
    
    setScheduleBlocks(data || []);
  };

  const isTimeBlocked = (dayOfWeek: number, time: string) => {
    return scheduleBlocks.some(block => {
      if (block.day_of_week !== dayOfWeek) return false;
      return time >= block.start_time && time < block.end_time;
    });
  };

  const handleCreateBlock = async () => {
    const blocks = [];
    for (let week = 0; week < blockForm.replicate_weeks; week++) {
      blocks.push({
        user_id: user!.id,
        day_of_week: parseInt(blockForm.day_of_week),
        start_time: blockForm.start_time,
        end_time: blockForm.end_time,
        reason: blockForm.reason
      });
    }

    const { error } = await supabase
      .from('schedule_blocks')
      .insert(blocks);

    if (error) {
      toast({ title: 'Erro ao criar bloqueio', variant: 'destructive' });
      return;
    }

    toast({ title: 'Bloqueio(s) criado(s) com sucesso!' });
    setIsBlockDialogOpen(false);
    setBlockForm({
      day_of_week: '1',
      start_time: '12:00',
      end_time: '13:00',
      reason: '',
      replicate_weeks: 1
    });
    loadScheduleBlocks();
  };

  const deleteBlock = async (blockId: string) => {
    const { error } = await supabase
      .from('schedule_blocks')
      .delete()
      .eq('id', blockId);

    if (!error) {
      toast({ title: 'Bloqueio removido' });
      loadScheduleBlocks();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const sessionData = {
      patient_id: formData.patient_id,
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
      paid: false,
      time: ''
    });
    loadData();
  };

  const deleteSession = async () => {
    if (!editingSession) return;
    
    if (!confirm('Tem certeza que deseja excluir esta sessão?')) return;
    
    const { error } = await supabase
      .from('sessions')
      .delete()
      .eq('id', editingSession.id);

    if (error) {
      toast({ title: 'Erro ao excluir sessão', variant: 'destructive' });
      return;
    }

    toast({ title: 'Sessão excluída com sucesso!' });
    setIsDialogOpen(false);
    setEditingSession(null);
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
      paid: session.paid,
      time: session.time || session.patients?.session_time || ''
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
      paid: false,
      time: ''
    });
    setIsDialogOpen(true);
  };

  const toggleStatus = async (session: any) => {
    // Prevent marking future sessions as attended
    if (session.status === 'scheduled' && isBefore(new Date(), parseISO(session.date))) {
      toast({ 
        title: 'Não é possível marcar como compareceu', 
        description: 'Sessões futuras não podem ser marcadas como comparecidas.',
        variant: 'destructive' 
      });
      return;
    }

    const newStatus = session.status === 'scheduled' ? 'attended' : 
                     session.status === 'attended' ? 'missed' : 'scheduled';
    
    const { error } = await supabase
      .from('sessions')
      .update({ status: newStatus })
      .eq('id', session.id);

    if (!error) {
      // If marked as attended or missed, ensure 4 future sessions exist
      if (newStatus === 'attended' || newStatus === 'missed') {
        const { ensureFutureSessions } = await import('@/lib/sessionUtils');
        await ensureFutureSessions(session.patient_id, session.patients, supabase, 4);
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

  const getStatusVariant = (status: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (status) {
      case 'completed':
      case 'attended': return 'default';
      case 'missed': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
      case 'attended': return 'Compareceu';
      case 'missed': return 'Não Compareceu';
      default: return 'Agendada';
    }
  };

  const getWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = Array.from({ length: 5 }, (_, i) => addDays(weekStart, i));
    const hours = Array.from({ length: 15 }, (_, i) => i + 7); // 7:00 to 21:00

    // Calculate position based on exact time
    const getSessionPosition = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      const totalMinutes = (hours - 7) * 60 + minutes;
      return (totalMinutes / 60) * 60; // 60px per hour
    };

    return (
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setViewMode('month')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar ao mês
            </Button>
            <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Lock className="mr-2 h-4 w-4" />
                  Gerenciar Bloqueios
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Bloqueio de Agenda</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Dia da Semana</Label>
                    <Select value={blockForm.day_of_week} onValueChange={(value) => setBlockForm({...blockForm, day_of_week: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Segunda-feira</SelectItem>
                        <SelectItem value="2">Terça-feira</SelectItem>
                        <SelectItem value="3">Quarta-feira</SelectItem>
                        <SelectItem value="4">Quinta-feira</SelectItem>
                        <SelectItem value="5">Sexta-feira</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label>Início</Label>
                      <Input type="time" value={blockForm.start_time} onChange={(e) => setBlockForm({...blockForm, start_time: e.target.value})} />
                    </div>
                    <div>
                      <Label>Fim</Label>
                      <Input type="time" value={blockForm.end_time} onChange={(e) => setBlockForm({...blockForm, end_time: e.target.value})} />
                    </div>
                  </div>
                  <div>
                    <Label>Motivo (opcional)</Label>
                    <Input value={blockForm.reason} onChange={(e) => setBlockForm({...blockForm, reason: e.target.value})} placeholder="Ex: Almoço, Reunião..." />
                  </div>
                  <div>
                    <Label>Replicar para quantas semanas?</Label>
                    <Input type="number" min="1" value={blockForm.replicate_weeks} onChange={(e) => setBlockForm({...blockForm, replicate_weeks: parseInt(e.target.value)})} />
                  </div>
                  <Button onClick={handleCreateBlock} className="w-full">Criar Bloqueio</Button>
                  
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-2">Bloqueios Existentes</h3>
                    <div className="space-y-2 max-h-[200px] overflow-y-auto">
                      {scheduleBlocks.map(block => (
                        <div key={block.id} className="flex justify-between items-center p-2 bg-muted rounded">
                          <div className="text-sm">
                            <p className="font-medium">
                              {['', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'][block.day_of_week]} - {block.start_time} às {block.end_time}
                            </p>
                            {block.reason && <p className="text-xs text-muted-foreground">{block.reason}</p>}
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => deleteBlock(block.id)}>
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          <h2 className="text-xl font-semibold">
            {format(weekStart, "d 'de' MMMM", { locale: ptBR })} - {format(addDays(weekStart, 4), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </h2>
          <Button onClick={() => openNewDialog(selectedDate)}>
            <Plus className="mr-2 h-4 w-4" /> Nova Sessão
          </Button>
        </div>

        <div className="grid grid-cols-6 gap-0 border rounded-lg overflow-hidden">
          {/* Header row */}
          <div className="bg-muted/50 p-2 font-semibold text-sm border-r sticky top-0 z-10">Horário</div>
          {['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta'].map((day, index) => (
            <div key={day} className="bg-muted/50 p-2 text-center border-r last:border-r-0 sticky top-0 z-10">
              <h3 className="font-semibold text-sm">{day}</h3>
              <p className="text-xs text-muted-foreground">{format(weekDays[index], 'dd/MM')}</p>
            </div>
          ))}

          {/* Time slots with absolute positioning */}
          {hours.map(hour => (
            <div key={hour} className="contents">
              <div className="bg-muted/30 p-2 text-sm font-medium text-muted-foreground border-t border-r h-[60px] flex items-start">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {weekDays.map((dayDate, dayIndex) => {
                const dayOfWeek = getDay(dayDate);
                const adjustedDay = dayOfWeek === 0 ? 7 : dayOfWeek;
                const isBlocked = isTimeBlocked(adjustedDay, `${hour.toString().padStart(2, '0')}:00`);
                
                // Get all sessions for this day (not filtered by hour)
                const allDaySessions = sessions.filter(s => s.date === format(dayDate, 'yyyy-MM-dd'));

                return (
                  <div
                    key={`${hour}-${dayIndex}`}
                    className={`h-[60px] border-t border-r last:border-r-0 relative ${isBlocked ? 'bg-muted/50' : 'hover:bg-accent/20'} transition-colors`}
                  >
                    {isBlocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    
                    {/* Render sessions with absolute positioning */}
                    {hour === 7 && allDaySessions.map(session => {
                      const sessionTime = session.time || session.patients?.session_time || '00:00';
                      const topPosition = getSessionPosition(sessionTime);
                      
                      return (
                        <Card
                          key={session.id}
                          className="absolute left-1 right-1 cursor-pointer hover:shadow-md transition-all border-l-4 p-2 z-20"
                          style={{
                            top: `${topPosition}px`,
                            height: '56px', // 1 hour minus some padding
                            borderLeftColor: session.status === 'attended' ? 'hsl(var(--chart-2))' : 
                                           session.status === 'missed' ? 'hsl(var(--destructive))' : 
                                           'hsl(var(--primary))'
                          }}
                          onClick={() => openEditDialog(session)}
                        >
                          <div className="flex items-center justify-between h-full">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-xs truncate">{session.patients.name}</p>
                              <p className="text-[10px] text-muted-foreground">{sessionTime}</p>
                            </div>
                            <Badge variant={getStatusVariant(session.status)} className="text-[10px] px-1 py-0 ml-1 shrink-0">
                              {getStatusText(session.status).substring(0, 4)}
                            </Badge>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </Card>
    );
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
              const sessionTime = s.time || s.patients?.session_time || '00:00';
              const sessionHour = parseInt(sessionTime.split(':')[0]);
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
                          <p className="text-xs">{session.time || session.patients.session_time}</p>
                        </div>
                        <div className="text-right">
                          {session.paid && <p className="text-xs">💰 Pago</p>}
                          {session.status === 'missed' && <p className="text-xs">Sem Cobrança</p>}
                          {session.status === 'attended' && !session.paid && <p className="text-xs">A Pagar</p>}
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
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
                  ← Anterior
                </Button>
                <Button variant="outline" onClick={() => {
                  setViewMode('week');
                  setSelectedDate(new Date());
                }}>
                  Visualização Semanal
                </Button>
              </div>
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
        ) : viewMode === 'week' ? getWeekView() : getDayView()}

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
                <Label>Horário</Label>
                <Input
                  type="time"
                  value={formData.time || ''}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
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
                <div className="space-y-2 pt-4 border-t">
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => toggleStatus(editingSession)} className="flex-1">
                      {editingSession.status === 'scheduled' ? <CheckCircle className="mr-2 h-4 w-4" /> : <XCircle className="mr-2 h-4 w-4" />}
                      Alterar Status
                    </Button>
                    <Button type="button" variant="outline" onClick={() => togglePaid(editingSession)} className="flex-1">
                      <DollarSign className="mr-2 h-4 w-4" />
                      {editingSession.paid ? 'Marcar não pago' : 'Marcar pago'}
                    </Button>
                  </div>
                  <Button type="button" variant="destructive" onClick={deleteSession} className="w-full">
                    Excluir Sessão
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
