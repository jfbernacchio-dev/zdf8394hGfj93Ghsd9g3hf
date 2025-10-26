import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Calendar, DollarSign, TrendingUp, AlertCircle } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { parseISO } from 'date-fns';
import { NotificationPrompt } from '@/components/NotificationPrompt';

const Dashboard = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [period, setPeriod] = useState('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    const { data: patientsData } = await supabase
      .from('patients')
      .select('*')
      .eq('user_id', user!.id);

    const { data: sessionsData } = await supabase
      .from('sessions')
      .select(`
        *,
        patients!inner (
          user_id
        )
      `)
      .eq('patients.user_id', user!.id);

    setPatients(patientsData || []);
    setSessions(sessionsData || []);
  };

  const getDateRange = () => {
    const now = new Date();
    let start: Date, end: Date;

    if (period === 'custom') {
      start = new Date(customStartDate);
      end = new Date(customEndDate);
    } else if (period === 'week') {
      start = new Date(now);
      start.setDate(now.getDate() - 7);
      end = now;
    } else {
      // Este Mês: do dia 1 até o último dia do mês
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Último dia do mês
    }

    return { start, end };
  };

  const { start, end } = getDateRange();
  
  // Calculate expected sessions for active patients in the period
  const calculateExpectedSessions = () => {
    let total = 0;
    patients.filter(p => p.status === 'active').forEach(patient => {
      const patientStart = new Date(patient.start_date);
      const periodStart = patientStart > start ? patientStart : start;
      
      if (periodStart > end) return; // Patient starts after period
      
      const weeks = Math.floor((end.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24 * 7));
      const multiplier = patient.frequency === 'weekly' ? 1 : 0.5;
      total += Math.max(1, Math.ceil(weeks * multiplier));
    });
    return total;
  };

  const now = new Date();
  now.setHours(0, 0, 0, 0);
  
  const periodSessions = sessions.filter(session => {
    const date = parseISO(session.date);
    return date >= start && date <= end;
  });

  const attendedSessions = periodSessions.filter(s => s.status === 'attended');
  const expectedSessions = periodSessions.length; // Total sessions scheduled in period
  const missedSessions = periodSessions.filter(s => s.status === 'missed');
  const pendingSessions = periodSessions.filter(s => {
    const sessionDate = parseISO(s.date);
    return sessionDate > now && s.status !== 'attended' && s.status !== 'missed';
  });
  
  const missedPercent = expectedSessions > 0 ? ((missedSessions.length / expectedSessions) * 100).toFixed(0) : 0;
  const pendingPercent = expectedSessions > 0 ? ((pendingSessions.length / expectedSessions) * 100).toFixed(0) : 0;
  
  // Calculate expected revenue based on each patient's session value
  const totalExpected = patients
    .filter(p => p.status === 'active')
    .reduce((sum, patient) => {
      const patientStart = new Date(patient.start_date);
      const periodStart = patientStart > start ? patientStart : start;
      
      if (periodStart > end) return sum;
      
      const weeks = Math.floor((end.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24 * 7));
      const multiplier = patient.frequency === 'weekly' ? 1 : 0.5;
      const sessions = Math.max(1, Math.ceil(weeks * multiplier));
      
      return sum + (sessions * Number(patient.session_value || 0));
    }, 0);
  
  const totalActual = attendedSessions.reduce((sum, s) => sum + Number(s.value), 0);
  const revenuePercent = totalExpected > 0 ? ((totalActual / totalExpected) * 100).toFixed(0) : 0;
  
  // Em Aberto: TOTAL acumulado, não respeita período
  const allAttendedSessions = sessions.filter(s => s.status === 'attended');
  const unpaidSessions = allAttendedSessions.filter(s => !s.paid);
  const unpaidValue = unpaidSessions.reduce((sum, s) => sum + Number(s.value), 0);

  return (
    <div className="min-h-screen bg-[var(--gradient-soft)]">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da sua clínica</p>
        </div>

        <Card className="p-6 mb-6 shadow-[var(--shadow-card)] border-border">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Última Semana</SelectItem>
                  <SelectItem value="month">Este Mês</SelectItem>
                  <SelectItem value="custom">Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {period === 'custom' && (
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
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
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
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">
              R$ {totalExpected.toFixed(2)}
            </h3>
            <p className="text-sm text-muted-foreground">Receita Esperada</p>
          </Card>

          <Card className="p-6 shadow-[var(--shadow-card)] border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[hsl(var(--success))]" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">
              R$ {totalActual.toFixed(2)}
            </h3>
            <p className="text-sm text-muted-foreground">Receita Efetiva ({revenuePercent}%)</p>
          </Card>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card className="p-6 shadow-[var(--shadow-card)] border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-accent" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">
              {expectedSessions}
            </h3>
            <p className="text-sm text-muted-foreground">Sessões Esperadas</p>
          </Card>

          <Card className="p-6 shadow-[var(--shadow-card)] border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-destructive" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">
              {missedSessions.length}
            </h3>
            <p className="text-sm text-muted-foreground">Sessões Desmarcadas ({missedPercent}%)</p>
          </Card>

          <Card className="p-6 shadow-[var(--shadow-card)] border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-muted/50 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-muted-foreground" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">
              {pendingSessions.length}
            </h3>
            <p className="text-sm text-muted-foreground">Sessões Pendentes ({pendingPercent}%)</p>
          </Card>

          <Card className="p-6 shadow-[var(--shadow-card)] border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[hsl(var(--warning))]" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">
              R$ {unpaidValue.toFixed(2)}
            </h3>
            <p className="text-sm text-muted-foreground">Em Aberto ({unpaidSessions.length})</p>
          </Card>
        </div>
      </div>
      <NotificationPrompt />
    </div>
  );
};

export default Dashboard;
