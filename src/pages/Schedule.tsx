import { useState, useEffect } from 'react';
import { storage } from '@/lib/storage';
import { Patient, Session } from '@/types/patient';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Navbar from '@/components/Navbar';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, User } from 'lucide-react';

const Schedule = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [selectedWeek, setSelectedWeek] = useState(new Date());
  const [rescheduleSession, setRescheduleSession] = useState<Session | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    setPatients(storage.getPatients().filter(p => p.status === 'active'));
    setSessions(storage.getSessions());
  }, []);

  const getWeekDates = (date: Date) => {
    const week = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + 1); // Segunda-feira

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      week.push(day);
    }
    return week;
  };

  const weekDates = getWeekDates(selectedWeek);

  const getSessionsForDay = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return sessions
      .filter(s => s.date === dateStr)
      .sort((a, b) => {
        const patientA = patients.find(p => p.id === a.patientId);
        const patientB = patients.find(p => p.id === b.patientId);
        return (patientA?.sessionTime || '').localeCompare(patientB?.sessionTime || '');
      });
  };

  const getDayName = (date: Date) => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    return days[date.getDay()];
  };

  const handleReschedule = () => {
    if (!rescheduleSession || !newDate || !newTime) return;

    const allSessions = storage.getSessions();
    const patient = patients.find(p => p.id === rescheduleSession.patientId);
    
    // Remover a sessão antiga
    const filteredSessions = allSessions.filter(s => s.id !== rescheduleSession.id);
    
    // Criar nova sessão
    const newSession: Session = {
      ...rescheduleSession,
      id: `${rescheduleSession.patientId}-${newDate}-${Date.now()}`,
      date: newDate,
    };

    storage.saveSessions([...filteredSessions, newSession]);
    setSessions([...filteredSessions, newSession]);

    toast({
      title: "Sessão reagendada!",
      description: `${patient?.name} foi reagendado para ${new Date(newDate).toLocaleDateString('pt-BR')} às ${newTime}`,
    });

    setRescheduleSession(null);
    setNewDate('');
    setNewTime('');
  };

  const nextWeek = () => {
    const next = new Date(selectedWeek);
    next.setDate(selectedWeek.getDate() + 7);
    setSelectedWeek(next);
  };

  const prevWeek = () => {
    const prev = new Date(selectedWeek);
    prev.setDate(selectedWeek.getDate() - 7);
    setSelectedWeek(prev);
  };

  return (
    <div className="min-h-screen bg-[var(--gradient-soft)]">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-foreground">Agenda Semanal</h1>
          <div className="flex gap-2">
            <Button onClick={prevWeek} variant="outline">← Semana Anterior</Button>
            <Button onClick={() => setSelectedWeek(new Date())} variant="outline">Hoje</Button>
            <Button onClick={nextWeek} variant="outline">Próxima Semana →</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {weekDates.map((date, index) => {
            const daySessions = getSessionsForDay(date);
            const isToday = date.toISOString().split('T')[0] === new Date().toISOString().split('T')[0];

            return (
              <Card key={index} className={`p-4 ${isToday ? 'ring-2 ring-primary' : ''}`}>
                <div className="text-center mb-4">
                  <div className="font-bold text-lg">{getDayName(date)}</div>
                  <div className="text-sm text-muted-foreground">
                    {date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                  </div>
                </div>

                <div className="space-y-2">
                  {daySessions.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Sem sessões</p>
                  ) : (
                    daySessions.map(session => {
                      const patient = patients.find(p => p.id === session.patientId);
                      if (!patient) return null;

                      return (
                        <Dialog key={session.id}>
                          <DialogTrigger asChild>
                            <div
                              className="p-2 bg-primary/10 hover:bg-primary/20 rounded cursor-pointer transition-colors"
                              onClick={() => {
                                setRescheduleSession(session);
                                setNewTime(patient.sessionTime);
                              }}
                            >
                              <div className="flex items-center gap-1 text-xs">
                                <Clock className="w-3 h-3" />
                                <span className="font-medium">{patient.sessionTime}</span>
                              </div>
                              <div className="flex items-center gap-1 text-xs mt-1">
                                <User className="w-3 h-3" />
                                <span className="truncate">{patient.name}</span>
                              </div>
                            </div>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Reagendar Sessão</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Paciente: {patient?.name}</p>
                                <p className="text-sm text-muted-foreground">
                                  Horário atual: {date.toLocaleDateString('pt-BR')} às {patient?.sessionTime}
                                </p>
                              </div>
                              <div className="space-y-2">
                                <Label>Nova data</Label>
                                <Input
                                  type="date"
                                  value={newDate}
                                  onChange={(e) => setNewDate(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Novo horário</Label>
                                <Input
                                  type="time"
                                  value={newTime}
                                  onChange={(e) => setNewTime(e.target.value)}
                                />
                              </div>
                              <Button onClick={handleReschedule} className="w-full">
                                Confirmar Reagendamento
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      );
                    })
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Schedule;
