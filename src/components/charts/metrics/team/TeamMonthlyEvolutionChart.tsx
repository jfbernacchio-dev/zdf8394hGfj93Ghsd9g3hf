/**
 * 📈 GRÁFICO DE EVOLUÇÃO MENSAL DA EQUIPE
 * 
 * Visualiza evolução da receita total da equipe ao longo dos meses.
 * Sub-aba: "Retenção" do domínio "Team"
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
  LineChart,
  Line,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { FinancialTrendsChartProps } from '@/types/metricsChartTypes';

export function TeamMonthlyEvolutionChart({ 
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

  // Use trends data directly
  const evolutionData = useMemo(() => {
    if (!trends || trends.length === 0) return [];
    return trends;
  }, [trends]);

  if (evolutionData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolução Mensal da Equipe
          </CardTitle>
          <CardDescription>Receita total da equipe ao longo do tempo</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Sem dados de evolução para o período selecionado.
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
      color: 'hsl(var(--success))',
    },
    sessions: {
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

  const totalRevenue = evolutionData.reduce((sum, point) => sum + point.revenue, 0);
  const totalSessions = evolutionData.reduce((sum, point) => sum + point.sessions, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Evolução Mensal da Equipe
        </CardTitle>
        <CardDescription>
          Receita total da equipe ao longo do tempo • Total: {formatCurrency(totalRevenue)} • {totalSessions} sessões • Escala: {
            timeScale === 'daily' ? 'Diária' : 
            timeScale === 'weekly' ? 'Semanal' : 
            'Mensal'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolutionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="label" 
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
                    labelFormatter={(label) => `Período: ${label}`}
                    formatter={(value, name, props) => {
                      const payload = props.payload;
                      if (name === 'revenue') {
                        return [formatCurrency(payload.revenue), 'Receita'];
                      }
                      return [payload.sessions, 'Sessões'];
                    }}
                  />
                }
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <Line 
                type="monotone" 
                dataKey="revenue" 
                yAxisId="revenue"
                stroke="hsl(var(--success))"
                strokeWidth={3}
                dot={{ fill: 'hsl(var(--success))', r: 5 }}
                activeDot={{ r: 7 }}
                name="Receita"
              />
              <Line 
                type="monotone" 
                dataKey="sessions" 
                yAxisId="sessions"
                stroke="hsl(var(--chart-2))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--chart-2))', r: 4 }}
                activeDot={{ r: 6 }}
                name="Sessões"
                strokeDasharray="5 5"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
