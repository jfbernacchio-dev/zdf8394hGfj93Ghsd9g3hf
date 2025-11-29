/**
 * 📊 GRÁFICO DE VALOR PERDIDO POR FALTAS
 * 
 * Visualiza receita não realizada devido a faltas por mês.
 * Sub-aba: "Desempenho" do domínio "Financial"
 * 
 * @phase C3-R.7
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart,
  Bar,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { MetricsChartBaseProps } from '@/types/metricsChartTypes';
import type { MetricsSession } from '@/lib/systemMetricsUtils';
import { getLostRevenueByMonth } from '@/lib/systemMetricsUtils';

interface FinancialLostRevenueChartProps extends MetricsChartBaseProps {
  sessions: MetricsSession[];
  isLoading: boolean;
}

export function FinancialLostRevenueChart({ 
  sessions, 
  isLoading, 
  periodFilter,
  timeScale
}: FinancialLostRevenueChartProps) {
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

  const lostData = useMemo(() => {
    if (!sessions || sessions.length === 0 || !periodFilter) return [];
    
    return getLostRevenueByMonth({ 
      sessions, 
      start: periodFilter.startDate, 
      end: periodFilter.endDate 
    });
  }, [sessions, periodFilter]);

  if (lostData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Valor Perdido por Faltas
          </CardTitle>
          <CardDescription>Receita não realizada devido a faltas por mês</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Sem dados de receita perdida neste período.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    perdido: {
      label: 'Valor Perdido',
      color: 'hsl(var(--destructive))',
    },
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const totalLost = lostData.reduce((sum, d) => sum + d.perdido, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Valor Perdido por Faltas
        </CardTitle>
        <CardDescription>
          Receita não realizada devido a faltas por mês • Total perdido: {formatCurrency(totalLost)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={lostData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
                tickFormatter={formatCurrency}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => `Mês: ${label}`}
                    formatter={(value) => [formatCurrency(value as number), 'Valor Perdido']}
                  />
                }
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <Bar 
                dataKey="perdido" 
                fill="hsl(var(--destructive))" 
                radius={[8, 8, 0, 0]}
                name="Valor Perdido"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
