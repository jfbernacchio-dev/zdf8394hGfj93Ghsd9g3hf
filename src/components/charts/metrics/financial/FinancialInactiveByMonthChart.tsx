/**
 * 📊 GRÁFICO DE PACIENTES ENCERRADOS POR MÊS
 * 
 * Visualiza o número de pacientes encerrados mensalmente.
 * Sub-aba: "Desempenho" do domínio "Financial"
 * 
 * @phase C3-R.7
 */

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Users } from 'lucide-react';
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
import type { FinancialTrendsChartProps } from '@/types/metricsChartTypes';

export function FinancialInactiveByMonthChart({ 
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

  const inactiveData = useMemo(() => {
    if (!trends || trends.length === 0) return [];
    
    // FinancialTrendPoint includes inactiveCount in the object
    return trends
      .filter(point => (point as any).inactiveCount && (point as any).inactiveCount > 0)
      .map(point => ({
        month: point.label,
        encerrados: (point as any).inactiveCount || 0,
      }));
  }, [trends]);

  if (inactiveData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Pacientes Encerrados por Mês
          </CardTitle>
          <CardDescription>Número de fichas encerradas mensalmente</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Sem dados de pacientes encerrados neste período.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const chartConfig = {
    encerrados: {
      label: 'Pacientes Encerrados',
      color: 'hsl(var(--destructive))',
    },
  };

  const totalInactive = inactiveData.reduce((sum, d) => sum + d.encerrados, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Pacientes Encerrados por Mês
        </CardTitle>
        <CardDescription>
          Número de fichas encerradas mensalmente • Total: {totalInactive} pacientes
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={inactiveData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
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
