/**
 * 📊 GRÁFICO DE PERFORMANCE INDIVIDUAL DA EQUIPE
 * 
 * Visualiza receita e sessões realizadas por cada terapeuta.
 * Sub-aba: "Desempenho" do domínio "Team"
 * 
 * @phase C3-R.6
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3 } from 'lucide-react';
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

interface TeamIndividualPerformanceChartProps extends MetricsChartBaseProps {
  sessions: MetricsSession[];
  patients: MetricsPatient[];
  profiles: Record<string, MetricsProfile>;
  isLoading: boolean;
}

export function TeamIndividualPerformanceChart({ 
  sessions, 
  patients,
  profiles,
  isLoading, 
  periodFilter,
  timeScale
}: TeamIndividualPerformanceChartProps) {
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

  // Calculate performance by therapist
  const performanceData = useMemo(() => {
    if (!sessions || sessions.length === 0 || !patients || patients.length === 0) return [];

    // Get unique therapist IDs
    const therapistIds = Array.from(new Set(patients.map(p => p.user_id)));

    // Calculate metrics for each therapist
    const data = therapistIds.map(userId => {
      // Get therapist name from profiles
      const therapistPatients = patients.filter(p => p.user_id === userId && p.status === 'active');
      const therapistName = profiles[userId]?.full_name?.split(' ')[0] || `Terapeuta ${userId.substring(0, 8)}`;

      // Calculate revenue and session count
      const therapistSessions = sessions.filter(s => {
        const patient = patients.find(p => p.id === s.patient_id);
        return patient && patient.user_id === userId && s.status === 'attended';
      });

      const revenue = therapistSessions.reduce((sum, s) => {
        return sum + (typeof s.value === 'string' ? parseFloat(s.value) : s.value);
      }, 0);

      const sessionCount = therapistSessions.length;

      return {
        name: therapistName,
        revenue,
        sessionCount,
        activePatients: therapistPatients.length,
        fill: `hsl(var(--chart-${(therapistIds.indexOf(userId) % 5) + 1}))`,
      };
    })
    .filter(d => d.sessionCount > 0) // Only show therapists with sessions
    .sort((a, b) => b.revenue - a.revenue); // Sort by revenue descending

    return data;
  }, [sessions, patients, profiles]);

  if (performanceData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Performance Individual
          </CardTitle>
          <CardDescription>Receita e sessões por terapeuta</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Sem dados de equipe para o período selecionado. Certifique-se de que há múltiplos terapeutas com sessões realizadas.
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
      color: 'hsl(var(--chart-1))',
    },
    sessionCount: {
      label: 'Sessões',
      color: 'hsl(var(--chart-2))',
    },
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const totalRevenue = performanceData.reduce((sum, d) => sum + d.revenue, 0);
  const totalSessions = performanceData.reduce((sum, d) => sum + d.sessionCount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Performance Individual
        </CardTitle>
        <CardDescription>
          Receita e sessões por terapeuta • Total: {formatCurrency(totalRevenue)} • {totalSessions} sessões
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={performanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="name" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <YAxis 
                yAxisId="revenue"
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
                tickFormatter={formatCurrency}
                label={{ value: 'Receita (R$)', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="sessions"
                orientation="right"
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
                label={{ value: 'Sessões', angle: 90, position: 'insideRight' }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => `Terapeuta: ${label}`}
                    formatter={(value, name, props) => {
                      const payload = props.payload;
                      if (name === 'revenue') {
                        return [formatCurrency(payload.revenue), 'Receita'];
                      }
                      return [payload.sessionCount, 'Sessões'];
                    }}
                  />
                }
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <Bar 
                dataKey="revenue" 
                yAxisId="revenue"
                fill="hsl(var(--chart-1))" 
                radius={[8, 8, 0, 0]}
                name="Receita"
              >
                {performanceData.map((entry, index) => (
                  <Cell key={`cell-revenue-${index}`} fill={entry.fill} />
                ))}
              </Bar>
              <Bar 
                dataKey="sessionCount" 
                yAxisId="sessions"
                fill="hsl(var(--chart-2))" 
                radius={[8, 8, 0, 0]}
                name="Sessões"
              >
                {performanceData.map((entry, index) => (
                  <Cell key={`cell-sessions-${index}`} fill={entry.fill} opacity={0.7} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
