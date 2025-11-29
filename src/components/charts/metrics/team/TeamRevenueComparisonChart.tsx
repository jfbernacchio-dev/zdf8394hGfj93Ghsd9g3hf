/**
 * 📊 GRÁFICO DE COMPARATIVO DE RECEITA DA EQUIPE
 * 
 * Visualiza comparativo de receita entre terapeutas.
 * Sub-aba: "Desempenho" do domínio "Team"
 * 
 * @phase C3-R.6
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  Cell
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { MetricsChartBaseProps } from '@/types/metricsChartTypes';
import type { MetricsSession, MetricsPatient, MetricsProfile } from '@/lib/systemMetricsUtils';

interface TeamRevenueComparisonChartProps extends MetricsChartBaseProps {
  sessions: MetricsSession[];
  patients: MetricsPatient[];
  profiles: Record<string, MetricsProfile>;
  isLoading: boolean;
}

export function TeamRevenueComparisonChart({ 
  sessions, 
  patients,
  profiles,
  isLoading, 
  periodFilter,
  timeScale
}: TeamRevenueComparisonChartProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  // Calculate revenue by therapist
  const revenueData = useMemo(() => {
    if (!sessions || sessions.length === 0 || !patients || patients.length === 0) return [];

    // Get unique therapist IDs
    const therapistIds = Array.from(new Set(patients.map(p => p.user_id)));

    // Calculate revenue for each therapist
    const data = therapistIds.map(userId => {
      const therapistPatients = patients.filter(p => p.user_id === userId && p.status === 'active');
      const therapistName = profiles[userId]?.full_name?.split(' ')[0] || `Terapeuta ${userId.substring(0, 8)}`;

      const therapistSessions = sessions.filter(s => {
        const patient = patients.find(p => p.id === s.patient_id);
        return patient && patient.user_id === userId && s.status === 'attended';
      });

      const revenue = therapistSessions.reduce((sum, s) => {
        return sum + (typeof s.value === 'string' ? parseFloat(s.value) : s.value);
      }, 0);

      const avgPerSession = therapistSessions.length > 0 ? revenue / therapistSessions.length : 0;

      return {
        name: therapistName,
        revenue,
        sessionCount: therapistSessions.length,
        avgPerSession,
        activePatients: therapistPatients.length,
        fill: `hsl(var(--chart-${(therapistIds.indexOf(userId) % 5) + 1}))`,
      };
    })
    .filter(d => d.revenue > 0)
    .sort((a, b) => b.revenue - a.revenue);

    return data;
  }, [sessions, patients, profiles]);

  if (revenueData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Comparativo de Receita
          </CardTitle>
          <CardDescription>Receita por terapeuta</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Sem dados de receita para comparação. Certifique-se de que há sessões realizadas por múltiplos terapeutas.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Chart configuration
  const chartConfig = {
    revenue: {
      label: 'Receita (R$)',
      color: 'hsl(var(--primary))',
    },
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const totalRevenue = revenueData.reduce((sum, d) => sum + d.revenue, 0);
  const avgRevenue = totalRevenue / revenueData.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Comparativo de Receita
        </CardTitle>
        <CardDescription>
          Receita por terapeuta • Total: {formatCurrency(totalRevenue)} • Média: {formatCurrency(avgRevenue)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
                tickFormatter={formatCurrency}
                label={{ value: 'Receita (R$)', angle: -90, position: 'insideLeft' }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => `${label}`}
                    formatter={(value, name, props) => {
                      const payload = props.payload;
                      return [
                        <div key="tooltip-content" className="space-y-1">
                          <div className="font-semibold">{formatCurrency(payload.revenue)}</div>
                          <div className="text-xs text-muted-foreground">
                            Sessões: {payload.sessionCount}<br />
                            Ticket médio: {formatCurrency(payload.avgPerSession)}<br />
                            Pacientes ativos: {payload.activePatients}
                          </div>
                        </div>,
                        'Receita'
                      ];
                    }}
                  />
                }
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={() => 'Receita (R$)'}
              />
              <Bar 
                dataKey="revenue" 
                radius={[8, 8, 0, 0]}
                name="Receita"
              >
                {revenueData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
