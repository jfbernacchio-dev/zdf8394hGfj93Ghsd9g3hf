import { useEffect, useState } from 'react';
import { storage } from '@/lib/storage';
import { Patient, Session } from '@/types/patient';
import { Card } from '@/components/ui/card';
import { Users, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import Navbar from '@/components/Navbar';

const Dashboard = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  useEffect(() => {
    setPatients(storage.getPatients());
    setSessions(storage.getSessions());
  }, []);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthSessions = sessions.filter(session => {
    const date = new Date(session.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const monthRevenue = monthSessions
    .filter(s => s.attended)
    .reduce((sum, s) => sum + s.value, 0);

  const attendanceRate = monthSessions.length > 0
    ? (monthSessions.filter(s => s.attended).length / monthSessions.length) * 100
    : 0;

  return (
    <div className="min-h-screen bg-[var(--gradient-soft)]">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da sua clínica</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 shadow-[var(--shadow-card)] border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">{patients.length}</h3>
            <p className="text-sm text-muted-foreground">Total de Pacientes</p>
          </Card>

          <Card className="p-6 shadow-[var(--shadow-card)] border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">{monthSessions.length}</h3>
            <p className="text-sm text-muted-foreground">Sessões este mês</p>
          </Card>

          <Card className="p-6 shadow-[var(--shadow-card)] border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[hsl(var(--success))]" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">
              R$ {monthRevenue.toFixed(2)}
            </h3>
            <p className="text-sm text-muted-foreground">Receita do mês</p>
          </Card>

          <Card className="p-6 shadow-[var(--shadow-card)] border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-[hsl(var(--warning))]" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">
              {attendanceRate.toFixed(0)}%
            </h3>
            <p className="text-sm text-muted-foreground">Taxa de comparecimento</p>
          </Card>
        </div>

        {monthSessions.length > 0 && (
          <Card className="p-6 shadow-[var(--shadow-card)] border-border">
            <h2 className="text-xl font-semibold text-foreground mb-4">Sessões Recentes</h2>
            <div className="space-y-3">
              {monthSessions.slice(0, 5).map(session => {
                const patient = patients.find(p => p.id === session.patientId);
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-secondary/50"
                  >
                    <div>
                      <p className="font-medium text-foreground">{patient?.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(session.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">R$ {session.value.toFixed(2)}</p>
                      <p className={`text-sm ${session.attended ? 'text-[hsl(var(--success))]' : 'text-destructive'}`}>
                        {session.attended ? 'Compareceu' : 'Faltou'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
