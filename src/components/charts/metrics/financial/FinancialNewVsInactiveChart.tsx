/**
 * 📊 GRÁFICO DE PACIENTES NOVOS VS ENCERRADOS
 * 
 * Visualiza comparativo mensal entre novos cadastros e fichas encerradas.
 * Sub-aba: "Retenção" do domínio "Financial"
 * 
 * @phase C3-R.7
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Activity } from 'lucide-react';
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
import type { MetricsPatient } from '@/lib/systemMetricsUtils';
import { getNewVsInactive } from '@/lib/systemMetricsUtils';

interface FinancialNewVsInactiveChartProps extends MetricsChartBaseProps {
  patients: MetricsPatient[];
  isLoading: boolean;
}

export function FinancialNewVsInactiveChart({ 
  patients, 
  isLoading, 
  periodFilter,
  timeScale
}: FinancialNewVsInactiveChartProps) {
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

  const comparisonData = useMemo(() => {
    if (!patients || patients.length === 0 || !periodFilter) return [];
    
    const start = periodFilter.startDate;
    const end = periodFilter.endDate;
    
    return getNewVsInactive({ patients, start, end });
  }, [patients, periodFilter]);

  if (comparisonData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Pacientes Novos vs Encerrados
          </CardTitle>
          <CardDescription>Comparativo mensal entre novos cadastros e fichas encerradas</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Sem dados de cadastros ou encerramento neste período.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    novos: {
      label: 'Novos Pacientes',
      color: 'hsl(var(--success))',
    },
    encerrados: {
      label: 'Pacientes Encerrados',
      color: 'hsl(var(--destructive))',
    },
  };

  const totalNew = comparisonData.reduce((sum, d) => sum + d.novos, 0);
  const totalInactive = comparisonData.reduce((sum, d) => sum + d.encerrados, 0);
  const netGrowth = totalNew - totalInactive;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Pacientes Novos vs Encerrados
        </CardTitle>
        <CardDescription>
          Comparativo mensal • Novos: {totalNew} • Encerrados: {totalInactive} • Saldo: {netGrowth > 0 ? '+' : ''}{netGrowth}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={comparisonData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis 
                dataKey="month" 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
              />
              <YAxis 
                className="text-xs"
                tick={{ fill: 'hsl(var(--foreground))' }}
                allowDecimals={false}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    labelFormatter={(label) => `Mês: ${label}`}
                  />
                }
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
              />
              <Bar 
                dataKey="novos" 
                fill="hsl(var(--success))" 
                radius={[8, 8, 0, 0]}
                name="Novos Pacientes"
              />
              <Bar 
                dataKey="encerrados" 
                fill="hsl(var(--destructive))" 
                radius={[8, 8, 0, 0]}
                name="Pacientes Encerrados"
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
