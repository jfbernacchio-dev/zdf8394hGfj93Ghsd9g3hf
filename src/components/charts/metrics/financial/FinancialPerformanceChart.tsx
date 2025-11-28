/**
 * 📊 GRÁFICO DE DESEMPENHO FINANCEIRO
 * 
 * Visualiza sessões atendidas e taxa de faltas ao longo do tempo.
 * Sub-aba: "Desempenho" do domínio "Financial"
 * 
 * @phase C3.7
 */

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity } from 'lucide-react';
import { 
  ResponsiveContainer, 
  ComposedChart,
  Bar,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import type { FinancialTrendsChartProps } from '@/types/metricsChartTypes';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';

export function FinancialPerformanceChart({ 
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

  if (!trends || trends.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Desempenho Operacional
          </CardTitle>
          <CardDescription>Sessões atendidas e taxa de faltas</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Sem dados suficientes para exibir desempenho neste período.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Chart configuration
  const chartConfig = {
    sessions: {
      label: 'Sessões',
      color: 'hsl(var(--chart-1))',
    },
    missedRate: {
      label: 'Taxa de Faltas',
      color: 'hsl(var(--destructive))',
    },
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Desempenho Operacional
        </CardTitle>
        <CardDescription>
          Sessões atendidas e taxa de faltas • Escala: {
            timeScale === 'daily' ? 'Diária' : 
            timeScale === 'weekly' ? 'Semanal' : 
            'Mensal'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={trends} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="label" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <YAxis 
                yAxisId="left"
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
                label={{ value: 'Sessões', angle: -90, position: 'insideLeft' }}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
                label={{ value: 'Taxa de Faltas (%)', angle: 90, position: 'insideRight' }}
                domain={[0, 100]}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => `Período: ${label}`}
                    formatter={(value, name) => {
                      if (name === 'missedRate') {
                        return [`${(value as number).toFixed(1)}%`, 'Taxa de Faltas'];
                      }
                      return [value, 'Sessões'];
                    }}
                  />
                }
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                formatter={(value) => 
                  value === 'sessions' ? 'Sessões' : 'Taxa de Faltas (%)'
                }
              />
              <Bar 
                yAxisId="left"
                dataKey="sessions" 
                fill="hsl(var(--chart-1))"
                radius={[8, 8, 0, 0]}
                name="Sessões"
              />
              <Line 
                yAxisId="right"
                type="monotone" 
                dataKey="missedRate" 
                stroke="hsl(var(--destructive))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--destructive))', r: 4 }}
                activeDot={{ r: 6 }}
                name="Taxa de Faltas"
              />
            </ComposedChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
