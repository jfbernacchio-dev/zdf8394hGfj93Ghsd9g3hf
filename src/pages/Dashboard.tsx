import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Calendar, DollarSign, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { parseISO, format, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { NotificationPrompt } from '@/components/NotificationPrompt';
import { ComplianceReminder } from '@/components/ComplianceReminder';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';

const Dashboard = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [period, setPeriod] = useState('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogType, setDialogType] = useState<'expected' | 'actual' | 'unpaid' | null>(null);

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
    } else if (period === 'lastMonth') {
      // Último Mês: dia 01 ao 31 do mês anterior
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0); // Último dia do mês anterior
    } else if (period === 'year') {
      // Este Ano: do dia 01/01 do ano até hoje
      start = new Date(now.getFullYear(), 0, 1);
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
  
  // All sessions in period (for financial metrics)
  const periodSessions = sessions.filter(session => {
    const date = parseISO(session.date);
    return date >= start && date <= end;
  });

  // Only visible sessions (for operational metrics - excludes hidden sessions)
  const visiblePeriodSessions = periodSessions.filter(session => session.show_in_schedule !== false);

  const attendedSessions = periodSessions.filter(s => s.status === 'attended');
  const expectedSessions = visiblePeriodSessions.length; // Total visible sessions scheduled in period
  const missedSessions = visiblePeriodSessions.filter(s => s.status === 'missed');
  const pendingSessions = visiblePeriodSessions.filter(s => {
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
      
      if (patient.monthly_price) {
        // For monthly patients, count the value once per month in the period
        const months = eachMonthOfInterval({ start: periodStart, end });
        return sum + (months.length * Number(patient.session_value || 0));
      } else {
        // For weekly/biweekly patients, calculate based on frequency
        const weeks = Math.floor((end.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24 * 7));
        const multiplier = patient.frequency === 'weekly' ? 1 : 0.5;
        const sessions = Math.max(1, Math.ceil(weeks * multiplier));
        return sum + (sessions * Number(patient.session_value || 0));
      }
    }, 0);
  
  // Calculate actual revenue considering monthly patients
  const monthlyPatientsTracked = new Map<string, Set<string>>();
  const totalActual = attendedSessions.reduce((sum, s) => {
    const patient = patients.find(p => p.id === s.patient_id);
    if (patient?.monthly_price) {
      const monthKey = format(parseISO(s.date), 'yyyy-MM');
      if (!monthlyPatientsTracked.has(s.patient_id)) {
        monthlyPatientsTracked.set(s.patient_id, new Set());
      }
      const months = monthlyPatientsTracked.get(s.patient_id)!;
      if (!months.has(monthKey)) {
        months.add(monthKey);
        return sum + Number(s.value);
      }
      return sum;
    }
    return sum + Number(s.value);
  }, 0);
  const revenuePercent = totalExpected > 0 ? ((totalActual / totalExpected) * 100).toFixed(0) : 0;
  
  // Em Aberto: TOTAL acumulado, não respeita período
  const allAttendedSessions = sessions.filter(s => s.status === 'attended');
  const unpaidSessions = allAttendedSessions.filter(s => !s.paid);
  
  // Calculate unpaid value considering monthly patients
  const unpaidMonthlyTracked = new Map<string, Set<string>>();
  const unpaidValue = unpaidSessions.reduce((sum, s) => {
    const patient = patients.find(p => p.id === s.patient_id);
    if (patient?.monthly_price) {
      const monthKey = format(parseISO(s.date), 'yyyy-MM');
      if (!unpaidMonthlyTracked.has(s.patient_id)) {
        unpaidMonthlyTracked.set(s.patient_id, new Set());
      }
      const months = unpaidMonthlyTracked.get(s.patient_id)!;
      if (!months.has(monthKey)) {
        months.add(monthKey);
        return sum + Number(s.value);
      }
      return sum;
    }
    return sum + Number(s.value);
  }, 0);

  const openDialog = (type: 'expected' | 'actual' | 'unpaid') => {
    setDialogType(type);
    setDialogOpen(true);
  };

  const getDialogData = () => {
    if (dialogType === 'expected') {
      const activePatients = patients.filter(p => p.status === 'active');
      return activePatients.map(patient => {
        const patientStart = new Date(patient.start_date);
        const periodStart = patientStart > start ? patientStart : start;
        
        if (periodStart > end) {
          return {
            patient: patient.name,
            sessions: 0,
            value: 0,
          };
        }
        
        if (patient.monthly_price) {
          // For monthly patients, count once per month
          const months = eachMonthOfInterval({ start: periodStart, end });
          return {
            patient: patient.name,
            sessions: months.length,
            value: months.length * Number(patient.session_value || 0),
          };
        } else {
          // For weekly/biweekly patients
          const weeks = Math.floor((end.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24 * 7));
          const multiplier = patient.frequency === 'weekly' ? 1 : 0.5;
          const expectedSessions = Math.max(1, Math.ceil(weeks * multiplier));
          const expectedValue = expectedSessions * Number(patient.session_value || 0);
          
          return {
            patient: patient.name,
            sessions: expectedSessions,
            value: expectedValue,
          };
        }
      });
    } else if (dialogType === 'actual') {
      const patientRevenue = new Map<string, { sessions: number; value: number; monthly: boolean }>();
      const monthlyPatientsInDialog = new Map<string, Set<string>>();
      
      attendedSessions.forEach(session => {
        const patient = patients.find(p => p.id === session.patient_id);
        if (patient) {
          const current = patientRevenue.get(patient.name) || { sessions: 0, value: 0, monthly: false };
          
          if (patient.monthly_price) {
            const monthKey = format(parseISO(session.date), 'yyyy-MM');
            if (!monthlyPatientsInDialog.has(patient.name)) {
              monthlyPatientsInDialog.set(patient.name, new Set());
            }
            const months = monthlyPatientsInDialog.get(patient.name)!;
            if (!months.has(monthKey)) {
              months.add(monthKey);
              patientRevenue.set(patient.name, {
                sessions: current.sessions + 1,
                value: current.value + Number(session.value),
                monthly: true,
              });
            } else {
              patientRevenue.set(patient.name, {
                ...current,
                sessions: current.sessions + 1,
              });
            }
          } else {
            patientRevenue.set(patient.name, {
              sessions: current.sessions + 1,
              value: current.value + Number(session.value),
              monthly: false,
            });
          }
        }
      });
      
      return Array.from(patientRevenue.entries()).map(([patient, data]) => ({
        patient,
        sessions: data.sessions,
        value: data.value,
      }));
    } else if (dialogType === 'unpaid') {
      const patientUnpaid = new Map<string, { sessions: number; value: number; monthly: boolean }>();
      const unpaidMonthlyInDialog = new Map<string, Set<string>>();
      
      unpaidSessions.forEach(session => {
        const patient = patients.find(p => p.id === session.patient_id);
        if (patient) {
          const current = patientUnpaid.get(patient.name) || { sessions: 0, value: 0, monthly: false };
          
          if (patient.monthly_price) {
            const monthKey = format(parseISO(session.date), 'yyyy-MM');
            if (!unpaidMonthlyInDialog.has(patient.name)) {
              unpaidMonthlyInDialog.set(patient.name, new Set());
            }
            const months = unpaidMonthlyInDialog.get(patient.name)!;
            if (!months.has(monthKey)) {
              months.add(monthKey);
              patientUnpaid.set(patient.name, {
                sessions: current.sessions + 1,
                value: current.value + Number(session.value),
                monthly: true,
              });
            } else {
              patientUnpaid.set(patient.name, {
                ...current,
                sessions: current.sessions + 1,
              });
            }
          } else {
            patientUnpaid.set(patient.name, {
              sessions: current.sessions + 1,
              value: current.value + Number(session.value),
              monthly: false,
            });
          }
        }
      });
      
      return Array.from(patientUnpaid.entries()).map(([patient, data]) => ({
        patient,
        sessions: data.sessions,
        value: data.value,
      }));
    }
    return [];
  };

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da sua clínica</p>
        </div>

        <ComplianceReminder />

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
                  <SelectItem value="lastMonth">Último Mês</SelectItem>
                  <SelectItem value="year">Este Ano</SelectItem>
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
          <Card className="p-6 shadow-[var(--shadow-card)] border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">{patients.length}</h3>
            <p className="text-sm text-muted-foreground">Total de Pacientes</p>
          </Card>

          <Card 
            className="p-6 shadow-[var(--shadow-card)] border-border cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => openDialog('expected')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-blue-500" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">
              {formatBrazilianCurrency(totalExpected)}
            </h3>
            <p className="text-sm text-muted-foreground">Receita Esperada</p>
          </Card>

          <Card 
            className="p-6 shadow-[var(--shadow-card)] border-border cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => openDialog('actual')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[hsl(var(--success))]" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">
              {formatBrazilianCurrency(totalActual)}
            </h3>
            <p className="text-sm text-muted-foreground">Receita Efetiva ({revenuePercent}%)</p>
          </Card>

          <Card className="p-6 shadow-[var(--shadow-card)] border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-accent" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">
              {visiblePeriodSessions.filter(s => s.status === 'attended').length}
            </h3>
            <p className="text-sm text-muted-foreground">Sessões Realizadas</p>
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

          <Card 
            className="p-6 shadow-[var(--shadow-card)] border-border cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => openDialog('unpaid')}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-[hsl(var(--warning))]" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">
              {formatBrazilianCurrency(unpaidValue)}
            </h3>
            <p className="text-sm text-muted-foreground">Em Aberto ({unpaidSessions.length})</p>
          </Card>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {dialogType === 'expected' && 'Detalhes da Receita Esperada'}
                {dialogType === 'actual' && 'Detalhes da Receita Efetiva'}
                {dialogType === 'unpaid' && 'Detalhes dos Valores em Aberto'}
              </DialogTitle>
              <DialogDescription>
                Detalhamento por paciente das sessões e valores
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Sessões</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getDialogData().map((row, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{row.patient}</TableCell>
                      <TableCell>{row.sessions}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatBrazilianCurrency(row.value)}
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="font-bold bg-muted/50">
                    <TableCell>Total</TableCell>
                    <TableCell>
                      {getDialogData().reduce((sum, row) => sum + row.sessions, 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatBrazilianCurrency(
                        getDialogData().reduce((sum, row) => sum + row.value, 0)
                      )}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </DialogContent>
        </Dialog>

    <NotificationPrompt />
    </div>
  );
};

export default Dashboard;
