import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatBrazilianCurrency } from '@/lib/brazilianFormat';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, DollarSign, Users, AlertCircle, Calendar, PieChartIcon } from 'lucide-react';
import { parseISO, format, startOfMonth, endOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const COLORS = ['hsl(100, 20%, 55%)', 'hsl(100, 25%, 65%)', 'hsl(100, 30%, 75%)', 'hsl(100, 15%, 45%)', 'hsl(100, 35%, 85%)', 'hsl(40, 35%, 75%)'];

const Financial = () => {
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [period, setPeriod] = useState('year');
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
          user_id,
          name
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
    } else if (period === '3months') {
      start = subMonths(now, 3);
      end = now;
    } else if (period === '6months') {
      start = subMonths(now, 6);
      end = now;
    } else {
      start = new Date(now.getFullYear(), 0, 1);
      end = now;
    }

    return { start, end };
  };

  const { start, end } = getDateRange();

  const periodSessions = sessions.filter(session => {
    const date = parseISO(session.date);
    return date >= start && date <= end;
  });

  // Receita por mês
  const getMonthlyRevenue = () => {
    const months = eachMonthOfInterval({ start, end });
    
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthSessions = periodSessions.filter(s => {
        const date = parseISO(s.date);
        return date >= monthStart && date <= monthEnd && s.status === 'attended';
      });

      const revenue = monthSessions.reduce((sum, s) => sum + Number(s.value), 0);
      const expected = sessions.filter(s => {
        const date = parseISO(s.date);
        return date >= monthStart && date <= monthEnd;
      }).length;

      // Count inactive patients in this month
      const inactiveCount = patients.filter(p => {
        if (p.status !== 'inactive' || !p.updated_at) return false;
        const updatedDate = parseISO(p.updated_at);
        return updatedDate >= monthStart && updatedDate <= monthEnd;
      }).length;

      return {
        month: format(month, 'MMM/yy', { locale: ptBR }),
        receita: revenue,
        sessoes: monthSessions.length,
        esperadas: expected,
        encerrados: inactiveCount,
      };
    });
  };

  // Distribuição por paciente
  const getPatientDistribution = () => {
    const patientRevenue = new Map<string, number>();
    
    periodSessions.forEach(session => {
      if (session.status === 'attended') {
        const patientName = session.patients?.name || 'Desconhecido';
        const current = patientRevenue.get(patientName) || 0;
        patientRevenue.set(patientName, current + Number(session.value));
      }
    });

    return Array.from(patientRevenue.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  };

  // Taxa de faltas por mês
  const getMissedRate = () => {
    const months = eachMonthOfInterval({ start, end });
    
    return months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthSessions = periodSessions.filter(s => {
        const date = parseISO(s.date);
        return date >= monthStart && date <= monthEnd;
      });

      const missed = monthSessions.filter(s => s.status === 'missed').length;
      const total = monthSessions.length;
      const rate = total > 0 ? (missed / total) * 100 : 0;

      return {
        month: format(month, 'MMM/yy', { locale: ptBR }),
        taxa: Number(rate.toFixed(1)),
        faltas: missed,
        total,
      };
    });
  };

  // Faturamento médio por paciente
  const getAvgRevenuePerPatient = () => {
    const patientRevenue = new Map<string, { revenue: number; sessions: number }>();
    
    periodSessions.forEach(session => {
      if (session.status === 'attended') {
        const patientName = session.patients?.name || 'Desconhecido';
        const current = patientRevenue.get(patientName) || { revenue: 0, sessions: 0 };
        patientRevenue.set(patientName, {
          revenue: current.revenue + Number(session.value),
          sessions: current.sessions + 1,
        });
      }
    });

    return Array.from(patientRevenue.entries())
      .map(([name, data]) => ({
        name,
        faturamento: data.revenue,
        media: data.sessions > 0 ? data.revenue / data.sessions : 0,
        sessoes: data.sessions,
      }))
      .sort((a, b) => b.faturamento - a.faturamento);
  };

  const totalRevenue = periodSessions
    .filter(s => s.status === 'attended')
    .reduce((sum, s) => sum + Number(s.value), 0);

  const totalSessions = periodSessions.filter(s => s.status === 'attended').length;
  const missedSessions = periodSessions.filter(s => s.status === 'missed').length;
  const missedRate = periodSessions.length > 0 
    ? ((missedSessions / periodSessions.length) * 100).toFixed(1) 
    : 0;

  const avgPerSession = totalSessions > 0 ? totalRevenue / totalSessions : 0;
  const activePatients = patients.filter(p => p.status === 'active').length;

  const monthlyData = getMonthlyRevenue();
  const patientDistribution = getPatientDistribution();
  const missedRateData = getMissedRate();
  const avgRevenueData = getAvgRevenuePerPatient();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Análise Financeira</h1>
        <p className="text-muted-foreground">Métricas, insights e controle completo das finanças</p>
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
                <SelectItem value="3months">Últimos 3 Meses</SelectItem>
                <SelectItem value="6months">Últimos 6 Meses</SelectItem>
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

      {/* Métricas principais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 shadow-[var(--shadow-card)] border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[hsl(var(--success))]" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-1">
            {formatBrazilianCurrency(totalRevenue)}
          </h3>
          <p className="text-sm text-muted-foreground">Receita Total</p>
        </Card>

        <Card className="p-6 shadow-[var(--shadow-card)] border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-primary" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-1">
            {formatBrazilianCurrency(avgPerSession)}
          </h3>
          <p className="text-sm text-muted-foreground">Média por Sessão</p>
        </Card>

        <Card className="p-6 shadow-[var(--shadow-card)] border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-destructive" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-1">
            {missedRate}%
          </h3>
          <p className="text-sm text-muted-foreground">Taxa de Faltas</p>
        </Card>

        <Card className="p-6 shadow-[var(--shadow-card)] border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Users className="w-6 h-6 text-accent" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-foreground mb-1">
            {activePatients}
          </h3>
          <p className="text-sm text-muted-foreground">Pacientes Ativos</p>
        </Card>
      </div>

      <Tabs defaultValue="revenue" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="distribution">Distribuição</TabsTrigger>
          <TabsTrigger value="performance">Desempenho</TabsTrigger>
          <TabsTrigger value="patients">Por Paciente</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Evolução da Receita Mensal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: any) => formatBrazilianCurrency(value)}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="receita" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    name="Receita"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Sessões Realizadas vs Esperadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="esperadas" fill="hsl(var(--muted))" name="Esperadas" />
                  <Bar dataKey="sessoes" fill="hsl(var(--primary))" name="Realizadas" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5" />
                Distribuição de Receita por Paciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={500}>
                <PieChart>
                  <Pie
                    data={patientDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {patientDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: any) => formatBrazilianCurrency(value)}
                  />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Taxa de Faltas por Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={missedRateData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: any, name: string) => {
                      if (name === 'taxa') return `${value}%`;
                      return value;
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="taxa" 
                    stroke="hsl(var(--destructive))" 
                    strokeWidth={2}
                    name="Taxa (%)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Pacientes Encerrados por Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-muted-foreground">
                Número de pacientes que tiveram suas fichas encerradas
              </div>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar dataKey="encerrados" fill="hsl(var(--destructive))" name="Pacientes Encerrados" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patients">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Faturamento por Paciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 text-sm text-muted-foreground">
                Comparativo de faturamento total e valor médio por sessão de cada paciente
              </div>
              <ResponsiveContainer width="100%" height={Math.max(400, avgRevenueData.length * 60)}>
                <BarChart data={avgRevenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="name" 
                    stroke="hsl(var(--muted-foreground))"
                    angle={-45}
                    textAnchor="end"
                    height={100}
                    interval={0}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: any) => formatBrazilianCurrency(value)}
                  />
                  <Legend />
                  <Bar dataKey="faturamento" fill="hsl(var(--primary))" name="Faturamento Total" radius={[8, 8, 0, 0]} />
                  <Bar dataKey="media" fill="hsl(var(--accent))" name="Média por Sessão" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Financial;