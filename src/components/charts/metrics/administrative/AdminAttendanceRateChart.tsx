/**
 * 📈 GRÁFICO DE TAXA DE COMPARECIMENTO
 * 
 * Visualiza a taxa de comparecimento de pacientes ao longo do tempo.
 * Sub-aba: "Desempenho" do domínio "Administrative"
 * 
 * @phase C3-R.5
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingUp } from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ReferenceLine
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { FinancialTrendsChartProps } from '@/types/metricsChartTypes';

export function AdminAttendanceRateChart({ 
  trends, 
  isLoading, 
  periodFilter,
  timeScale 
}: FinancialTrendsChartProps) {
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

  // Calculate attendance rate for each trend point
  const attendanceData = useMemo(() => {
    if (!trends || trends.length === 0) return [];

    return trends.map((point) => {
      const totalSessions = point.sessions || 0;
      const missedRateDecimal = (point.missedRate || 0) / 100; // Convert from percentage
      const missedSessions = Math.round(totalSessions * missedRateDecimal);
      const attendedSessions = totalSessions - missedSessions;
      
      const totalRelevant = attendedSessions + missedSessions;
      const attendanceRate = totalRelevant > 0 
        ? (attendedSessions / totalRelevant) * 100 
        : 0;

      return {
        label: point.label || point.date,
        attendanceRate: parseFloat(attendanceRate.toFixed(1)),
        attendedCount: attendedSessions,
        missedCount: missedSessions,
        totalSessions,
      };
    });
  }, [trends]);

  if (attendanceData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Taxa de Comparecimento
          </CardTitle>
          <CardDescription>Taxa de comparecimento ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Sem dados suficientes para exibir taxa de comparecimento neste período.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Chart configuration
  const chartConfig = {
    attendanceRate: {
      label: 'Taxa de Comparecimento (%)',
      color: 'hsl(var(--success))',
    },
  };

  const avgAttendanceRate = attendanceData.reduce((sum, point) => sum + point.attendanceRate, 0) / attendanceData.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Taxa de Comparecimento
        </CardTitle>
        <CardDescription>
          Taxa de comparecimento ao longo do tempo • Média: {avgAttendanceRate.toFixed(1)}% • Escala: {
            timeScale === 'daily' ? 'Diária' : 
            timeScale === 'weekly' ? 'Semanal' : 
            'Mensal'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={attendanceData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="label" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
                domain={[0, 100]}
                tickFormatter={(val) => `${val}%`}
                label={{ value: 'Taxa (%)', angle: -90, position: 'insideLeft' }}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => `Período: ${label}`}
                    formatter={(value, name, props) => {
                      const payload = props.payload;
                      return [
                        <div key="tooltip-content" className="space-y-1">
                          <div className="font-semibold">{value}%</div>
                          <div className="text-xs text-muted-foreground">
                            Comparecimento: {payload.attendedCount} sessões<br />
                            Faltas: {payload.missedCount} sessões
                          </div>
                        </div>,
                        'Taxa de Comparecimento'
                      ];
                    }}
                  />
                }
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={() => 'Taxa de Comparecimento (%)'}
              />
              <ReferenceLine 
                y={80} 
                stroke="hsl(var(--warning))" 
                strokeDasharray="3 3" 
                label={{ value: 'Meta 80%', position: 'right' }}
              />
              <Line 
                type="monotone" 
                dataKey="attendanceRate" 
                stroke="hsl(var(--success))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--success))', r: 5 }}
                activeDot={{ r: 7 }}
                name="Taxa"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
